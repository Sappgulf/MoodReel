import { useState, useEffect, useCallback, useRef } from 'react';
import searchService from '../services/searchService';
import { getUserFacingMessage, isAbortError, shouldSkipLog } from '../services/apiErrorUtils';
import { useModalDialog } from './useModalDialog';

export function useActorFilmography({ contentId } = {}) {
  const [selectedActor, setSelectedActor] = useState(null);
  const [actorFilmography, setActorFilmography] = useState([]);
  const [actorLoading, setActorLoading] = useState(false);
  const [actorError, setActorError] = useState('');

  const actorRequestRef = useRef(null);
  const actorRequestIdRef = useRef(0);
  const actorDialogCloseRef = useRef(null);

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
          .filter(c => c.id !== parseInt(contentId, 10) && (c.poster_path || c.backdrop_path))
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 12);

        if (currentRequestId === actorRequestIdRef.current && !controller.signal.aborted) {
          setActorFilmography(credits);
        }
      } catch (err) {
        if (isAbortError(err)) return;
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
    [contentId]
  );

  useEffect(() => {
    return () => {
      actorRequestRef.current?.abort();
    };
  }, []);

  return {
    selectedActor,
    actorFilmography,
    actorLoading,
    actorError,
    actorDialogRef,
    actorDialogCloseRef,
    handleActorClick,
    closeActorModal,
  };
}
