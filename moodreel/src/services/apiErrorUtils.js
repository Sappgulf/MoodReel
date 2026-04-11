import axios from 'axios';

function toUserMessage(err) {
    if (err?.code === 'TMDB_API_KEY_MISSING') {
        return 'TMDB API unavailable. Configure VITE_TMDB_API_KEY (or REACT_APP_TMDB_API_KEY) in your environment.';
    }

    if (err?.code === 'TMDB_NETWORK_ERROR') {
        return 'Network error. Please check your connection.';
    }

    if (err?.status === 401) {
        return 'TMDB API unavailable. Check that your API key is valid.';
    }

    if (err?.status === 404) {
        return 'TMDB API endpoint not found. Please try again.';
    }

    if (err?.status === 429) {
        return 'Rate limit reached. Please retry in a moment.';
    }

    if (err?.status >= 500) {
        return 'TMDB API is temporarily unavailable. Please retry.';
    }

    return 'Network error. Please check your connection.';
}

export function isAbortError(err) {
    return axios.isCancel(err) || err?.name === 'AbortError';
}

export function getUserFacingMessage(err) {
    if (err?.name === 'TmdbApiError' || err?.code?.startsWith?.('TMDB_')) {
        return err.message;
    }
    return toUserMessage(err);
}

export function isExpectedTmdbErrorForLogging(err) {
    const code = err?.code;
    if (code === 'TMDB_API_KEY_MISSING' || code === 'TMDB_NETWORK_ERROR') {
        return true;
    }

    if (typeof code === 'string' && code.startsWith('TMDB_HTTP_')) {
        const status = Number.parseInt(code.slice('TMDB_HTTP_'.length), 10);
        return Number.isFinite(status) && [401, 404, 408, 429].includes(status);
    }

    return [401, 404, 408, 429].includes(err?.status) || (err?.status >= 500);
}

export function shouldSkipLog(err) {
    return isAbortError(err) || isExpectedTmdbErrorForLogging(err);
}
