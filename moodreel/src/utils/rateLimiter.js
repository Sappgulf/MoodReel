/**
 * Rate Limiter for TMDB API calls
 *
 * - Regular users: Limited requests per minute
 * - Admin users: Unlimited access (set via stored app preference key)
 *
 * Use `setAdminMode(true)` (canonical key in `storageKeys.js`) to enable admin mode.
 */

import { StorageKeys as SK } from '../storage/storageKeys';
import { safeGetBoolean, safeGetJSON, safeSetJSON, safeRemove } from '../storage/safeStorage';

const RATE_LIMIT_KEY = SK.RATE_LIMIT;
const ADMIN_KEY = SK.ADMIN;
const MAX_REQUESTS_PER_MINUTE = 60; // Increased for better UX in media-heavy app
const WINDOW_MS = 60000; // 1 minute window

/**
 * Check if current user is admin (unlimited access)
 */
export function isAdmin() {
  return safeGetBoolean(ADMIN_KEY, false);
}

/**
 * Set admin status
 * @param {boolean} enabled - Whether to enable admin mode
 */
export function setAdminMode(enabled) {
  if (enabled) {
    safeSetJSON(ADMIN_KEY, true);
  } else {
    safeRemove(ADMIN_KEY);
  }
}

/**
 * Get current rate limit state
 */
function getRateLimitState() {
  const state = safeGetJSON(RATE_LIMIT_KEY, { count: 0, windowStart: Date.now() });
  if (Date.now() - state.windowStart > WINDOW_MS) {
    return { count: 0, windowStart: Date.now() };
  }
  return state;
}

/**
 * Save rate limit state
 */
function saveRateLimitState(state) {
  safeSetJSON(RATE_LIMIT_KEY, state);
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
