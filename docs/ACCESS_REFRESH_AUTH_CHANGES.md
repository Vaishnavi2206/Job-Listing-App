# Access and Refresh Token Authentication

## What changed

This app now uses two tokens after login:

- Access token: a short-lived JWT returned to the frontend and sent on API calls as `Authorization: Bearer <token>`.
- Refresh token: a longer-lived JWT stored in an HTTP-only browser cookie named `refreshToken`.
- Idle timeout: the frontend logs the user out after 10 minutes without app activity.

The access token is used for normal protected API requests. The refresh token is used only to get a new access token when the old one expires.

## Why two tokens

A single long-lived token is simple, but risky. If it is stolen, it can be used for a long time.

With this setup:

1. The access token expires quickly.
2. The refresh token lasts longer but is stored in an HTTP-only cookie, so frontend JavaScript cannot read it.
3. When the access token expires, the frontend calls `/api/auth/refresh`.
4. The browser automatically sends the refresh cookie.
5. The backend verifies the refresh token and returns a fresh access token.

This keeps the normal API flow fast while reducing how useful a leaked access token is.

## Inactivity behavior

The app now tracks user activity in the browser. Activity includes clicks, key presses, mouse movement, scrolling, touch input, and window focus.

If the user is away from the app for 10 minutes:

1. The frontend calls `/api/auth/logout`.
2. The backend clears the refresh token cookie.
3. The frontend clears the access token, user data, and last activity timestamp.
4. Protected routes redirect the user back to login.

This is intentionally different from token refresh. Refresh keeps active users signed in smoothly. Idle timeout signs out inactive users.

## Backend changes

### `backend/src/modules/auth/auth.service.js`

- Added separate token helpers for access and refresh tokens.
- Access tokens include `userId`, `roleId`, and `roleName`.
- Refresh tokens include only `userId`.
- Login now returns:
  - `accessToken`
  - `refreshToken`
  - safe user data
- Added `refreshSession(refreshToken)` to verify the refresh token, reload the user, and issue a new token pair.
- Signup now returns safe user data instead of the full database user record.

### `backend/src/modules/auth/auth.controller.js`

- Login sets the refresh token in an HTTP-only cookie.
- Login returns only the access token and user data in the JSON body.
- Added `POST /api/auth/refresh`.
- Refresh verifies the cookie token, rotates the refresh cookie, and returns a new access token.
- Logout clears the refresh token cookie.

### `backend/src/modules/auth/auth.route.js`

- Added the refresh route:

```txt
POST /api/auth/refresh
```

### `backend/src/middleware/auth.middleware.js`

- Protected routes still require an access token in the `Authorization` header.
- Removed debug logging of raw tokens.

### `.env`

Added token-specific settings:

```txt
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_SECRET=...
REFRESH_COOKIE_MAX_AGE_DAYS=7
```

## Frontend changes

### `frontend/src/api/axios.ts`

- The request interceptor still attaches the access token from `localStorage`.
- If the idle timeout has already expired, axios clears local auth state and does not attempt refresh.
- Added a response interceptor:
  1. If a request fails with `401`, it calls `/auth/refresh`.
  2. If refresh succeeds, it stores the new access token and retries the original request.
  3. If refresh fails, it clears local auth state.
- Added small browser events so React state stays synced with background refreshes.

### `frontend/src/services/auth.service.ts`

- Login now expects `accessToken`.
- Added `refreshUserSession()`.
- Added `logoutUser()`.

### `frontend/src/context/AuthContext.tsx`

- Added `refreshSession()`.
- Added `logout()`.
- Added `isAuthLoading`.
- On app load, the provider tries to restore the session using the refresh cookie.
- Added a 10-minute idle timer that logs out inactive users.
- Added browser activity listeners to reset the idle timer while the user is active.

### `frontend/src/utils/authSession.ts`

- Added shared helpers for the idle timeout.
- Stores the last activity timestamp in `localStorage`.
- Exposes the 10-minute timeout value in one place.

### `frontend/src/routes/ProtectedRoute.tsx`

- Waits for session restore before redirecting unauthenticated users.

### `frontend/src/routes/PublicRoute.tsx`

- Waits for session restore before sending authenticated users to the dashboard.

### `frontend/src/pages/Dashboard.tsx`

- Logout now calls the backend logout endpoint before clearing frontend state.

## Request flow

### Login

1. User submits username and password.
2. Backend validates credentials.
3. Backend returns an access token in JSON.
4. Backend sets refresh token as an HTTP-only cookie.
5. Frontend stores the access token and user data.

### Protected API request

1. Axios reads the access token.
2. Axios sends `Authorization: Bearer <accessToken>`.
3. Backend verifies the access token.
4. Protected route runs.

### Expired access token

1. API returns `401`.
2. Axios calls `/api/auth/refresh`.
3. Backend verifies the refresh cookie.
4. Backend sends back a new access token and rotates the refresh cookie.
5. Axios retries the original request.

### Logout

1. Frontend calls `/api/auth/logout`.
2. Backend clears the refresh cookie.
3. Frontend clears the access token and user data.

### Inactivity logout

1. User logs in.
2. User leaves the app idle for 10 minutes.
3. The idle timer logs the user out.
4. User is redirected to login when protected routes re-render.
5. User must log in again.

## Notes

- In production, the refresh cookie is marked `secure` when `NODE_ENV=production`.
- The access token currently remains in `localStorage` to match the app's existing structure. A stronger future improvement would be storing it only in memory and relying on refresh restore after page reload.
- Refresh token revocation is cookie-based in this implementation. For stricter security, add a database-backed refresh token table with rotation tracking and reuse detection.
- For testing the idle timeout faster, temporarily lower `IDLE_TIMEOUT_MS` in `frontend/src/utils/authSession.ts`.
