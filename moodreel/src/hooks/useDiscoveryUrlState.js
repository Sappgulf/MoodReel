import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function useDiscoveryUrlState({
  mood,
  setMood,
  titleQuery,
  setTitleQuery,
  contentType,
  setContentType,
  advancedFilters,
  setAdvancedFilters,
  minRating,
  setMinRating,
  region,
  setRegion,
  myServices,
  setMyServices,
  searchScope,
  setSearchScope,
  showHidden,
  setShowHidden,
  currentYear,
  handleSearch,
}) {
  const location = useLocation();
  const hasHydratedRef = useRef(false);
  const [shouldRunHydratedSearch, setShouldRunHydratedSearch] = useState(false);

  useEffect(() => {
    if (hasHydratedRef.current) return;
    const params = new URLSearchParams(location.search);
    const moodParam = params.get('mood');
    const queryParam = params.get('query');
    const typeParam = params.get('type');
    const yearMinParam = params.get('yearMin');
    const yearMaxParam = params.get('yearMax');
    const ratingParam = params.get('rating');
    const regionParam = params.get('region');
    const servicesParam = params.get('services');
    const scopeParam = params.get('scope');
    const showHiddenParam = params.get('showHidden');

    if (moodParam) setMood(moodParam);
    if (queryParam) setTitleQuery(queryParam);
    if (typeParam) setContentType(typeParam);
    if (scopeParam) setSearchScope(scopeParam);
    if (regionParam) setRegion(regionParam);

    if (yearMinParam || yearMaxParam || ratingParam) {
      setAdvancedFilters(prev => ({
        ...prev,
        yearMin: yearMinParam ? parseInt(yearMinParam, 10) : prev.yearMin,
        yearMax: yearMaxParam ? parseInt(yearMaxParam, 10) : prev.yearMax,
      }));
      if (ratingParam) setMinRating(parseFloat(ratingParam));
    }

    if (servicesParam) {
      const ids = servicesParam
        .split(',')
        .map(id => parseInt(id, 10))
        .filter(Boolean);
      setMyServices(ids);
    }

    if (showHiddenParam) {
      setShowHidden(showHiddenParam === 'true');
    }

    hasHydratedRef.current = true;

    if (moodParam) {
      setShouldRunHydratedSearch(true);
    }
  }, [
    location.search,
    setAdvancedFilters,
    setContentType,
    setMinRating,
    setMood,
    setMyServices,
    setRegion,
    setSearchScope,
    setShowHidden,
    setTitleQuery,
  ]);

  useEffect(() => {
    if (!shouldRunHydratedSearch || !mood.trim()) return;
    setShouldRunHydratedSearch(false);
    handleSearch();
  }, [handleSearch, mood, shouldRunHydratedSearch]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    const params = new URLSearchParams();

    if (mood) params.set('mood', mood);
    if (titleQuery) params.set('query', titleQuery);
    if (contentType && contentType !== 'all') params.set('type', contentType);
    if (advancedFilters.yearMin && advancedFilters.yearMin > 1900)
      params.set('yearMin', advancedFilters.yearMin);
    if (advancedFilters.yearMax && advancedFilters.yearMax < currentYear)
      params.set('yearMax', advancedFilters.yearMax);
    if (minRating > 0) params.set('rating', minRating);
    if (region && region !== 'US') params.set('region', region);
    if (myServices.length > 0) params.set('services', myServices.join(','));
    if (searchScope !== 'within') params.set('scope', searchScope);
    if (showHidden) params.set('showHidden', 'true');

    const queryString = params.toString();
    const nextUrl = `${location.pathname}${queryString ? `?${queryString}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [
    mood,
    titleQuery,
    contentType,
    advancedFilters,
    minRating,
    region,
    myServices,
    searchScope,
    showHidden,
    location.pathname,
    currentYear,
  ]);
}

export default useDiscoveryUrlState;
