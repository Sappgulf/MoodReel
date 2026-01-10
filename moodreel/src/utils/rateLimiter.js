/**
 * Rate Limiter for TMDB API calls
 * 
 * - Regular users: Limited requests per minute
 * - Admin users: Unlimited access (set via localStorage)
 * 
 * To enable admin mode: localStorage.setItem('moodreel-admin', 'true')
 */

const RATE_LIMIT_KEY = 'moodreel-rate-limit';
const ADMIN_KEY = 'moodreel-admin';
const MAX_REQUESTS_PER_MINUTE = 60;  // Increased for better UX in media-heavy app
const WINDOW_MS = 60000; // 1 minute window

/**
 * Check if current user is admin (unlimited access)
 */
export function isAdmin() {
    try {
        return localStorage.getItem(ADMIN_KEY) === 'true';
    } catch {
        return false;
    }
}

/**
 * Set admin status
 * @param {boolean} enabled - Whether to enable admin mode
 */
export function setAdminMode(enabled) {
    try {
        if (enabled) {
            localStorage.setItem(ADMIN_KEY, 'true');
        } else {
            localStorage.removeItem(ADMIN_KEY);
        }
    } catch (e) {
        console.error('Failed to set admin mode:', e);
    }
}

/**
 * Get current rate limit state
 */
function getRateLimitState() {
    try {
        const stored = localStorage.getItem(RATE_LIMIT_KEY);
        if (stored) {
            const state = JSON.parse(stored);
            // Check if window has expired
            if (Date.now() - state.windowStart > WINDOW_MS) {
                return { count: 0, windowStart: Date.now() };
            }
            return state;
        }
    } catch {
        // Ignore parse errors
    }
    return { count: 0, windowStart: Date.now() };
}

/**
 * Save rate limit state
 */
function saveRateLimitState(state) {
    try {
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
    } catch {
        // Ignore save errors
    }
}

/**
 * Check if a request can be made (returns true if allowed)
 * Automatically increments counter if allowed
 */
export function canMakeRequest() {
    // Admins bypass rate limiting
    if (isAdmin()) {
        return true;
    }

    const state = getRateLimitState();

    if (state.count >= MAX_REQUESTS_PER_MINUTE) {
        const timeRemaining = Math.ceil((WINDOW_MS - (Date.now() - state.windowStart)) / 1000);
        console.warn(`Rate limit reached. Try again in ${timeRemaining} seconds.`);
        return false;
    }

    // Increment and save
    state.count++;
    saveRateLimitState(state);
    return true;
}

/**
 * Get remaining requests in current window
 */
export function getRemainingRequests() {
    if (isAdmin()) {
        return Infinity;
    }
    const state = getRateLimitState();
    return Math.max(0, MAX_REQUESTS_PER_MINUTE - state.count);
}

/**
 * Get time until rate limit resets (in seconds)
 */
export function getResetTime() {
    const state = getRateLimitState();
    const elapsed = Date.now() - state.windowStart;
    return Math.max(0, Math.ceil((WINDOW_MS - elapsed) / 1000));
}

/**
 * Wrapper for axios requests with rate limiting
 * @param {Function} requestFn - Async function that makes the request
 * @returns {Promise} - Result of request or throws error if rate limited
 */
export async function rateLimitedRequest(requestFn) {
    if (!canMakeRequest()) {
        const resetTime = getResetTime();
        throw new Error(`Rate limit exceeded. Please wait ${resetTime} seconds.`);
    }
    return requestFn();
}

// Named export for ESLint compliance
const rateLimiter = {
    isAdmin,
    setAdminMode,
    canMakeRequest,
    getRemainingRequests,
    getResetTime,
    rateLimitedRequest,
};

export default rateLimiter;
