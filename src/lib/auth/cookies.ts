/**
 * Single source of truth for the session cookie.
 *
 * Before this file existed, the login and logout routes wrote a cookie named
 * `session` while getSession() and the magic-link verify route read
 * `sessionToken`. Password logins therefore created a valid Session row that
 * nothing downstream could find, and logging out after a magic-link sign-in
 * cleared a cookie that was never set. Import these instead of writing the
 * name or the options by hand.
 */

/** Cookie holding the opaque session token (a Session.id). */
export const SESSION_COOKIE = "sessionToken";

/** Session lifetime: 30 days, expressed in seconds for `maxAge`. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * Options applied whenever the session cookie is written.
 *
 * - httpOnly: JavaScript cannot read it, so an XSS bug cannot steal the session.
 * - secure: HTTPS only in production. Left off in development because the dev
 *   server runs over plain HTTP.
 * - sameSite "lax": the cookie is not sent on cross-site POSTs, which blocks
 *   basic CSRF while still working on normal top-level navigation.
 */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
