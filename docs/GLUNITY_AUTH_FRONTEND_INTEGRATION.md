# Glunity Authentication - Frontend Integration Contract

This document provides the precise frontend integration contract for the existing Glunity backend authentication system. It is strictly derived from the actual backend implementation code and serves as the single source of truth for the React Native/Expo frontend team.

---

## 1. Authentication Architecture

**FACT:** The backend implements a unified session architecture. 
Regardless of how a user authenticates, the system generates the exact same `Glunity User` object and issues identical Access and Refresh tokens.

```text
                    GLUNITY AUTH
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     Email + OTP       Google         Apple
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                    Glunity User
                         │
               Access + Refresh Tokens
```

The frontend should **not** maintain separate state modules for Google vs. Email. Once the backend responds with tokens, the frontend session state is identical.

---

## 2. Email + OTP Flow

**FACT:** The backend utilizes completely distinct endpoints for Signup vs. Login. It uses hashed OTP storage; the frontend must NEVER persist the plaintext OTP beyond the active input screen.

### Signup Flow
1. **Request OTP:** `POST /api/auth/signup`
   - **Body:** `{ "fullName": "...", "username": "...", "email": "...", "phone": "..." }`
   - **Response:** `200 OK` `{ "email": "..." }`
2. **Resend OTP:** `POST /api/auth/resend-otp`
   - **Body:** `{ "email": "..." }`
   - **Response:** `200 OK` `{ "email": "..." }`
3. **Verify OTP:** `POST /api/auth/verify-otp`
   - **Body:** `{ "email": "...", "code": "123456" }`
   - **Response:** `200 OK` `{ "user": {...}, "accessToken": "...", "refreshToken": "..." }`

### Login Flow
1. **Request OTP:** `POST /api/auth/login`
   - **Body:** `{ "email": "..." }`
   - **Response:** `200 OK` `{ "email": "..." }`
   - *(Note: To resend a login OTP, simply hit this endpoint again. Cooldowns are enforced automatically).*
2. **Verify OTP:** `POST /api/auth/login/verify`
   - **Body:** `{ "email": "...", "code": "123456" }`
   - **Response:** `200 OK` `{ "user": {...}, "accessToken": "...", "refreshToken": "..." }`

**FACT:** OTPs are 6 numeric digits. The backend strictly enforces a maximum of 5 attempts and a 60-second cooldown between resends.

---

## 3. Google Authentication

**FACT:** The backend relies entirely on cryptographic verification of the Google ID Token.

**HTTP Method:** `POST`
**Endpoint:** `/api/auth/google`
**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1..." 
}
```

**Frontend Flow:**
1. Trigger Native Google Sign-In via Expo (requires configuring a standalone/dev build).
2. Obtain the `idToken` from Google.
3. Send the `idToken` to the backend.
4. The backend verifies the signature, extracts the Google `sub` (provider ID), and returns Glunity session tokens.

**CRITICAL RULE:** The frontend must **never** send a raw `email` or `googleId` and expect the backend to trust it. You must only send the signed `idToken`.

---

## 4. Apple Authentication

*(Note: Apple frontend integration is deferred, but the backend contract is active).*

**FACT:** The backend strictly verifies Apple's `identityToken` using Apple's JWKS and extracts the `sub` claim.

**HTTP Method:** `POST`
**Endpoint:** `/api/auth/apple`
**Request Body:**
```json
{
  "identityToken": "eyJraWQiOiI...",
  "fullName": "John Doe" // Optional, Apple only provides this on the very first login
}
```

---

## 5. Duplicate Account Behavior

**FACT:** Implicit (silent) account merging is strictly forbidden by the backend.

If a user exists via Email+OTP (`user@example.com`), and they attempt to use Google or Apple Sign-In with that exact same email, the backend will reject the request.

**Response:** `409 Conflict`
**Message:** *"An account with this email already exists. Please login using your Email and link this social account in your settings."*

**FACT:** Account linking (e.g., attaching Google to an existing authenticated session) is **NOT CURRENTLY IMPLEMENTED** in the backend.

---

## 6. JWT / Session

**FACT:** Upon successful authentication, all methods return the exact same payload:
```json
{
  "user": {
    "id": "uuid",
    "fullName": "...",
    "username": "...",
    "email": "...",
    "phone": "...",
    "isPrivate": false
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

**Frontend Responsibility:** 
All subsequent authenticated API requests must include the access token in the headers:
`Authorization: Bearer <accessToken>`

---

## 7. Token Refresh & Logout

**FACT:** The backend **DOES NOT CURRENTLY IMPLEMENT** a `/refresh` endpoint or a `/logout` endpoint.

**RECOMMENDATION:** 
- **Refresh:** Until the backend implements `POST /api/auth/refresh`, access token expiration will require the user to log in again.
- **Logout:** Since there is no backend revocation endpoint yet, frontend logout consists entirely of clearing local secure storage and resetting the navigation stack to the Auth screens.

---

## 8. Rate Limiting

**FACT:** Every single route under `/api/auth/*` is protected by a strict Redis-backed rate limiter (`authLimiter`).

**Frontend Behavior:** If the user triggers too many requests (e.g., spamming OTP requests), the backend will return `429 Too Many Requests`. The frontend must catch this and display a user-friendly "Please wait" message.

---

## 9. AuthIdentity

**FACT:** The backend creates an `AuthIdentity` record for social logins. It relies exclusively on the provider's stable `sub` claim as the `providerUserId`. It is structurally impossible to create duplicate identities due to a strict database composite unique index.

---

## 10. Error Contract

The backend uses standard HTTP status codes. The frontend Axios interceptors should handle these gracefully:

| Status | Meaning | Expected Frontend Behavior |
|--------|---------|----------------------------|
| **400** | Bad Request / Validation Failed / Invalid OTP | Display the backend `message` string inline (e.g., "Invalid verification code"). |
| **401** | Unauthorized / Invalid ID Token | Clear session, return to login. For Google/Apple, show "Authentication failed". |
| **404** | Not Found | E.g., "No account found with this email" during login. |
| **409** | Conflict | Display conflict message. E.g., "Username already taken" or "Use your existing Email account". |
| **429** | Too Many Requests | Display "Please wait and try again later." |
| **500** | Internal Server Error | Display a generic fallback error message. |

---

## 11. React Native Architecture & TanStack Query

**RECOMMENDATION:**
- Use **TanStack Query** (React Query) for all authentication mutations (Request OTP, Verify OTP, Google Login).
- Maintain a global session context (via React Context or Zustand) that ONLY holds `accessToken`, `refreshToken`, and the `user` object. Do not duplicate server state into Zustand.

```text
React Native App
    │
    ├── Auth UI (Forms, Google Button)
    │
    ├── TanStack Query (Mutations/Loading States)
    │
    ├── Axios API Client (Bearer Interceptor)
    │
    ├── Zustand/Context (Holds Session & Tokens)
    │
    └── SecureStore (Expo Secure Storage)
```

---

## 12. Axios API Client

**RECOMMENDATION:**
Configure an Axios instance specifically for the API.
1. **Base URL:** Point to the backend API.
2. **Request Interceptor:** Attach `Authorization: Bearer <token>` from Secure Storage.
3. **Response Interceptor:** If a `401` is received, clear local storage and redirect to the Auth Stack. (Since `/refresh` doesn't exist yet, do not attempt to queue requests for retry).

---

## 13. Secure Storage

**RECOMMENDATION:**
Because this is an Expo application, you MUST use `expo-secure-store` to persist the `accessToken` and `refreshToken`. 
`AsyncStorage` is unencrypted and insecure. Do not use it for tokens.

---

## 14. Google + Expo Integration

**RECOMMENDATION:**
Native Google Sign-In requires an Expo development build (`npx expo run:ios` / `run:android`). It will not work inside Expo Go if using native Google libraries (like `@react-native-google-signin/google-signin`).

**CRITICAL:** Google Client Secrets MUST NEVER be embedded in the React Native bundle. Only use Client IDs.

---

## 15. NO MOCK DATA

**CRITICAL RULE:**
The frontend must use **ZERO** mock authentication data. 
- No hardcoded tokens.
- No fake user objects bypassing the backend.
- If provider configuration (Google) is missing on the client, gracefully disable the button.

---

## 16. Security Rules

The frontend MUST NEVER:
1. Log access tokens, refresh tokens, Google ID tokens, or Apple Identity tokens to the console.
2. Send provider IDs (`googleId`) as proof of authentication to the backend (always send the JWT token).
3. Attempt to automatically merge accounts locally.
4. Store backend secrets (e.g., Apple Private Keys) in the client bundle.

---

## 17. Frontend Navigation Flow

```text
App Startup
    │
    ▼
Check SecureStore for Access Token
    │
    ├─ (Token Exists) ───▶ Main App Stack
    │
    └─ (No Token) ───────▶ Auth Stack (Login/Signup)
```
Upon a `401 Unauthorized` API response anywhere in the app, immediately transition back to the Auth Stack.

---

## 18. Testing Checklist

**Email + OTP**
- [ ] Signup: Request OTP
- [ ] Signup: Resend OTP
- [ ] Signup: Verify valid OTP (Navigates to Main App)
- [ ] Signup: Invalid OTP shows error
- [ ] Login: Request OTP
- [ ] Login: Verify valid OTP (Navigates to Main App)
- [ ] Rate limit triggers gracefully (429)
- [ ] Logout (Clears SecureStore, navigates to Auth)

**Google**
- [ ] Google Button triggers native prompt
- [ ] User cancellation handled without crashing
- [ ] Successful Google auth routes ID token to backend
- [ ] Duplicate email error (409) shown to user gracefully
- [ ] Invalid token handled

**Apple**
- [ ] DEFERRED

---

## 19. Backend API Contract Table

| Purpose | Method | Endpoint | Request Body | Success | Possible Errors |
|---------|--------|----------|--------------|---------|-----------------|
| Signup Request | `POST` | `/api/auth/signup` | `fullName`, `username`, `email`, `phone` | `200` `{ email }` | `409` (conflict), `429` (rate limit), `400` |
| Signup Verify | `POST` | `/api/auth/verify-otp` | `email`, `code` | `200` `{ user, accessToken, refreshToken }` | `400` (invalid/expired), `404` |
| Signup Resend | `POST` | `/api/auth/resend-otp` | `email` | `200` `{ email }` | `429` (cooldown), `404`, `400` |
| Login Request | `POST` | `/api/auth/login` | `email` | `200` `{ email }` | `404` (not found), `429` |
| Login Verify | `POST` | `/api/auth/login/verify`| `email`, `code` | `200` `{ user, accessToken, refreshToken }` | `400` (invalid/expired), `404` |
| Google Login | `POST` | `/api/auth/google` | `idToken` | `200` `{ user, accessToken, refreshToken }` | `409` (duplicate email), `401` |
| Apple Login | `POST` | `/api/auth/apple` | `identityToken`, `fullName` | `200` `{ user, accessToken, refreshToken }` | `409` (duplicate email), `401` |
| Refresh Token | N/A | *Not Implemented* | N/A | N/A | N/A |
| Logout | N/A | *Not Implemented* | N/A | N/A | N/A |

---

## 20. Backend Source Files

*This contract was derived strictly by inspecting the following live files in the backend repository:*
- `modules/auth/routes/auth.routes.js`
- `modules/auth/controllers/auth.controller.js`
- `modules/auth/services/auth.service.js`
- `modules/auth/services/google.service.js`
- `modules/auth/services/apple.service.js`
- `modules/auth/validators/auth.validator.js`
- `modules/auth/models/auth-identity.model.js`
- `middleware/rateLimiter.js`
