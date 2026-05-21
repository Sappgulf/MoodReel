import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';

import { useWatchlist } from './useWatchlist';
import { useRatings } from './useRatings';
import { useAchievements } from './useAchievements';
import { useWatchHistory } from './useWatchHistory';
import { useTrailer } from '../context/TrailerContext';
import { useSounds } from './useSounds';
import { useTasteProfile } from './useTasteProfile';
import { useProviderSettings } from './useProviderSettings';
import { useModalDialog } from './useModalDialog';
import searchService from '../services/searchService';
import { getUserFacingMessage, isAbortError, shouldSkipLog } from '../services/apiErrorUtils';
import { getDisplayTitle } from '../utils/mediaUtils';
import {
  buildProviderSections,
  computeTasteIntel,
  computeTonightVerdict,
  computeWhyYouMightLikeIt,
} from '../utils/movieDetailsUtils';

export function useMovieDetails() {
  const { id } = useParams();
  const location = useLocation();
  const isTV = location.pathname.startsWith('/tv');
  const mediaType = isTV ? 'tv' : 'movie';
  const routedItem = location.state?.item || null;
  const [requestNonce, setRequestNonce] = useState(0);
  const isValidId = typeof id === 'string' && /^\d+$/.test(id);

  const { history: watchHistory, addToHistory } = useWatchHistory();
  const { playTrailer } = useTrailer();
  const { playSound } = useSounds();
  const [content, setContent] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [providers, setProviders] = useState(null);
  const [allProviders, setAllProviders] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [cast, setCast] = useState([]);
  const [director, setDirector] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [actorFilmography, setActorFilmography] = useState([]);
  const [actorLoading, setActorLoading] = useState(false);
  const [actorError, setActorError] = useState('');
  const [isLimitedDetails, setIsLimitedDetails] = useState(false);
  const actorRequestRef = useRef(null);
  const actorRequestIdRef = useRef(0);
  const actorDialogCloseRef = useRef(null);

  const { isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useWatchlist();
  const { getRating, setRating, getReview, setReview } = useRatings();
  const { trackRating } = useAchievements();
  const { like, dislike, statusFor } = useTasteProfile();
  const { region, myServices } = useProviderSettings();

  const userRating = getRating(id);
  const userReview = getReview(id);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setContent(null);
      setSimilar([]);
      setProviders(null);
      setAllProviders(null);
      setTrailer(null);
      setCast([]);
      setDirector(null);
      setIsLimitedDetails(false);

      if (!isValidId) {
        setError('Invalid details URL. Please open a valid item.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await searchService.fetchContentDetails(id, mediaType, controller.signal);
        if (!mounted || controller.signal.aborted) return;

        const details =
          data.details || (routedItem ? { ...routedItem, media_type: mediaType } : null);
        if (!details) {
          setError(
            'This title did not return usable details. Please try again or pick another result.'
          );
          return;
        }

        setContent(details);
        setIsLimitedDetails(!data.details);
        setSimilar((data.similar || []).slice(0, 6));

        const results = data.providers;
        setAllProviders(results || null);

        const videos = data.videos || [];
        const trailerVideo =
          videos.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) ||
          videos.find(v => v.site === 'YouTube');
        setTrailer(trailerVideo || null);

        const credits = data.credits || { cast: [], crew: [] };
        const castData = credits.cast || [];
        const crewData = credits.crew || [];
        setCast(castData.slice(0, 6));

        const dir = crewData.find(c => c.job === 'Director');
        setDirector(dir || null);

        addToHistory({ ...details, media_type: mediaType }, credits);
      } catch (err) {
        if (!mounted || controller.signal.aborted) return;
        if (routedItem) {
          setContent({ ...routedItem, media_type: mediaType });
          setIsLimitedDetails(true);
          setSimilar([]);
          setProviders(null);
          setAllProviders(null);
          setTrailer(null);
          setCast([]);
          setDirector(null);
          addToHistory({ ...routedItem, media_type: mediaType }, { cast: [], crew: [] });
          return;
        }
        if (!isAbortError(err)) {
          setError(getUserFacingMessage(err) || 'Error fetching details.');
        }
        if (!shouldSkipLog(err)) {
          console.error(err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [id, mediaType, addToHistory, isValidId, requestNonce, routedItem]);

  useEffect(() => {
    if (!allProviders) {
      setProviders(null);
      return;
    }
    setProviders(
      allProviders?.[region] ||
        allProviders?.US ||
        allProviders?.[Object.keys(allProviders || {})[0]] ||
        null
    );
  }, [allProviders, region]);

  useEffect(() => {
    const savedReview = getReview(id);
    setReviewText(savedReview || '');
  }, [id, getReview]);

  useEffect(() => {
    return () => {
      actorRequestRef.current?.abort();
    };
  }, []);

  const handleActorClick = useCallback(
    async actor => {
      if (!actor?.id) return;

      const currentRequestId = ++actorRequestIdRef.current;
      actorRequestRef.current?.abort();
      const controller = new AbortController();
      actorRequestRef.current = controller;

      setSelectedActor(actor);
      setActorError('');
      setActorLoading(true);
      setActorFilmography([]);

      try {
        const response = await searchService.fetchActorCredits(actor.id, controller.signal);
        if (currentRequestId !== actorRequestIdRef.current || controller.signal.aborted) return;

        const credits = response
          .filter(c => c.id !== parseInt(id, 10) && (c.poster_path || c.backdrop_path))
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 12);

        if (currentRequestId === actorRequestIdRef.current && !controller.signal.aborted) {
          setActorFilmography(credits);
        }
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }

        if (currentRequestId === actorRequestIdRef.current && !controller.signal.aborted) {
          setActorError(
            getUserFacingMessage(err) || 'Could not load actor filmography. Please try again.'
          );
          setActorFilmography([]);
        }
        if (!shouldSkipLog(err)) {
          console.error('Error fetching actor filmography:', err);
        }
      } finally {
        if (currentRequestId === actorRequestIdRef.current && !controller.signal.aborted) {
          setActorLoading(false);
        }
      }
    },
    [id]
  );

  const closeActorModal = useCallback(() => {
    actorRequestRef.current?.abort();
    setSelectedActor(null);
    setActorFilmography([]);
    setActorLoading(false);
    setActorError('');
  }, []);

  const { dialogRef: actorDialogRef } = useModalDialog({
    isOpen: Boolean(selectedActor),
    onClose: closeActorModal,
    focusRef: actorDialogCloseRef,
  });

  const handleToggleWatchlist = useCallback(() => {
    if (content) {
      toggleWatchlist({ ...content, media_type: mediaType });
    }
  }, [content, mediaType, toggleWatchlist]);

  const handleRatingChange = useCallback(
    rating => {
      setRating(id, rating);
      trackRating(id);
      playSound('pop');
    },
    [id, setRating, trackRating, playSound]
  );

  const handleReviewSubmit = useCallback(() => {
    setReview(id, reviewText);
    setShowReviewForm(false);
    playSound('save');
  }, [id, reviewText, setReview, playSound]);

  const handleNativeShare = useCallback(async () => {
    const shareTitle = content ? getDisplayTitle(content) : 'MoodReel pick';
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `MoodReel thinks ${shareTitle} is worth considering tonight.`,
          url,
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      playSound('save');
    } catch {
      // Share buttons remain available as the fallback.
    }
  }, [content, playSound]);

  const handlePostWatchReaction = useCallback(
    reaction => {
      if (!isWatched(id, mediaType)) toggleWatched(id, mediaType);
      if (reaction.rating) setRating(id, reaction.rating);
      if (reaction.taste === 'like' && content) like(content, mediaType);
      if (reaction.taste === 'dislike' && content) dislike(content, mediaType);
      if (reaction.note) setReview(id, reaction.note);
      playSound('pop');
    },
    [
      content,
      dislike,
      id,
      isWatched,
      like,
      mediaType,
      playSound,
      setRating,
      setReview,
      toggleWatched,
    ]
  );

  const handleRetry = useCallback(() => {
    setRequestNonce(count => count + 1);
  }, []);

  const providerSections = useMemo(() => buildProviderSections(providers), [providers]);

  const tonightVerdict = useMemo(
    () =>
      computeTonightVerdict({
        content,
        providerSections,
        myServices,
        mediaType,
        isInWatchlist,
        isWatched,
      }),
    [content, isInWatchlist, isWatched, mediaType, myServices, providerSections]
  );

  const whyYouMightLikeIt = useMemo(
    () =>
      computeWhyYouMightLikeIt({
        content,
        director,
        isLimitedDetails,
        mediaType,
        statusFor,
        watchHistory,
      }),
    [content, director, isLimitedDetails, mediaType, statusFor, watchHistory]
  );

  const tasteIntel = useMemo(
    () =>
      computeTasteIntel({
        cast,
        director,
        reviewText,
        userReview,
        watchHistory,
      }),
    [cast, director, reviewText, userReview, watchHistory]
  );

  return {
    id,
    mediaType,
    isTV,
    content,
    similar,
    trailer,
    cast,
    director,
    error,
    isLoading,
    isLimitedDetails,
    region,
    providerSections,
    tonightVerdict,
    whyYouMightLikeIt,
    tasteIntel,
    userRating,
    userReview,
    reviewText,
    setReviewText,
    showReviewForm,
    setShowReviewForm,
    showTrailerModal,
    setShowTrailerModal,
    selectedActor,
    actorFilmography,
    actorLoading,
    actorError,
    actorDialogRef,
    actorDialogCloseRef,
    isInWatchlist,
    isWatched,
    toggleWatched,
    toggleWatchlist,
    like,
    dislike,
    statusFor,
    playTrailer,
    handleActorClick,
    closeActorModal,
    handleToggleWatchlist,
    handleRatingChange,
    handleReviewSubmit,
    handleNativeShare,
    handlePostWatchReaction,
    handleRetry,
  };
}

export default useMovieDetails;
