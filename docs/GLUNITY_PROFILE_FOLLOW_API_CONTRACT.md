# Glunity Backend API Contract: Profile & Follow Module

This document is the **FINAL and AUTHORITATIVE API CONTRACT** for the Profile and Follow features of the Glunity backend. It is based strictly on an exhaustive audit of the actual Node.js codebase.

**Production Backend Base URL:** `https://glunity.onrender.com`

---

## 1. COMPLETE ROUTE INVENTORY

| Feature | Method | Endpoint | Auth | Status |
|---|---|---|---|---|
| Get Own Profile (w/ posts) | GET | `/api/users/me` | Required | IMPLEMENTED |
| Get User Profile | GET | `/api/users/:id` | Required | IMPLEMENTED |
| Update Profile | PATCH | `/api/users/profile` | Required | IMPLEMENTED |
| Follow User | POST | `/api/users/:id/follow` | Required | IMPLEMENTED |
| Unfollow / Cancel Request | DELETE | `/api/users/:id/follow` | Required | IMPLEMENTED |
| List Follow Requests | GET | `/api/users/follow-requests` | Required | IMPLEMENTED |
| Accept Request | PATCH | `/api/users/follow-requests/:id/accept` | Required | IMPLEMENTED |
| Reject Request | PATCH | `/api/users/follow-requests/:id/reject` | Required | IMPLEMENTED |
| List Own Followers | GET | `/api/users/followers` | Required | IMPLEMENTED |
| List Own Following | GET | `/api/users/following` | Required | IMPLEMENTED |
| List User Followers | GET | `/api/users/:id/followers` | Required | IMPLEMENTED |
| List User Following | GET | `/api/users/:id/following` | Required | IMPLEMENTED |
| Mutual Friends | GET | `/api/users/friends` | Required | IMPLEMENTED |
| Friend Suggestions | GET | `/api/users/suggestions` | Required | IMPLEMENTED |
| Search Users | GET | `/api/users/search?q=` | Required | IMPLEMENTED |

---

## 2. USER PROFILE RETRIEVAL

### A. View Own Profile (`GET /api/users/me`)
- **Authentication:** Required.
- **Query Params:** `?postLimit=12&reelLimit=12`
- **Behavior:** Returns the authenticated user's profile, combined with the first page of their posts and reels.
- **Response Structure:**
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "uuid",
    "username": "string",
    "fullName": "string",
    "bio": "string",
    "profession": "string",
    "profileImage": "url|null",
    "isPrivate": boolean,
    "postCount": 10,
    "reelCount": 5,
    "followerCount": 100,
    "followingCount": 50,
    "isOwnProfile": true,
    "posts": {
      "items": [...],
      "total": 10,
      "page": 1,
      "limit": 12
    },
    "reels": {
      "items": [...],
      "total": 5,
      "page": 1,
      "limit": 12
    }
  }
}
```

### B. View Another User (`GET /api/users/:id`)
- **Behavior:** Returns just the profile and counts (no nested posts array).
- **Privacy check:** You can view a private profile's basic stats (bio, picture, follower count), but you cannot retrieve their actual lists of posts/followers unless you follow them.
- **Relationship State:** The backend exposes relationship state explicitly via the `followStatus` string: `"following" | "pending" | "none"`.

**Response Structure:**
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "uuid",
    "username": "string",
    "fullName": "string",
    "bio": "string",
    "profession": "string",
    "profileImage": "url",
    "isPrivate": boolean,
    "createdAt": "date",
    "postCount": 42,
    "reelCount": 3,
    "followerCount": 1000,
    "followingCount": 500,
    "followStatus": "none",
    "isOwnProfile": false
  }
}
```

---

## 3. UPDATE PROFILE

- **Method:** `PATCH`
- **Endpoint:** `/api/users/profile`
- **Content-Type:** `multipart/form-data`
- **Allowed Fields:**
  - `fullName` (string)
  - `username` (string) - Checked for uniqueness.
  - `bio` (string)
  - `profession` (string)
  - `isPrivate` (boolean)
  - `profileImage` (file - single image)
- **Profile Image Behavior:** The backend automatically uploads to Bunny.net CDN, deletes the old image from the CDN, and saves the new URL.
- **Changing Privacy:** 
  - Submitting `isPrivate: true` locks the account.
  - Submitting `isPrivate: false` opens the account. 
  - *Note: Switching a private account to public does NOT automatically accept pending follow requests in the current backend logic.*
- **Response (200 OK):** Returns the updated user object.

---

## 4. FOLLOW SYSTEM

### A. Follow User (`POST /api/users/:id/follow`)
- **Path Param:** `:id` is the TARGET user you want to follow.
- **Behavior:**
  - If target is **PUBLIC**: Follow is created with status `'accepted'`.
  - If target is **PRIVATE**: Follow is created with status `'pending'`.
- **Errors:**
  - `400`: You can't follow yourself.
  - `404`: User not found.
  - `409`: Already following this user, or follow request already sent.

### B. Unfollow / Cancel Request (`DELETE /api/users/:id/follow`)
- **Path Param:** `:id` is the TARGET user.
- **Behavior:** Deletes the follow row entirely, regardless of whether the status is `'accepted'` or `'pending'`. 
- **Consequence:** This single endpoint functions as BOTH "Unfollow" and "Cancel Request".

### C. List Follow Requests (`GET /api/users/follow-requests`)
- **Behavior:** Returns users who have sent a pending request to the authenticated user.
- **Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "uuid",
        "username": "string",
        "fullName": "string",
        "profileImage": "url"
      }
    ]
  }
}
```

### D. Accept Request (`PATCH /api/users/follow-requests/:id/accept`)
- **Path Param:** `:id` is the REQUESTER's user ID.
- **Behavior:** Changes the follow row status from `'pending'` to `'accepted'`.

### E. Reject/Decline Request (`PATCH /api/users/follow-requests/:id/reject`)
- **Path Param:** `:id` is the REQUESTER's user ID.
- **Behavior:** Deletes the pending follow row entirely.

---

## 5. FOLLOWER / FOLLOWING LISTS

### A. Own Lists
- `GET /api/users/followers` (Returns users where `status: 'accepted'`)
- `GET /api/users/following` (Returns users where `status: 'accepted'`)

### B. Other User's Lists
- `GET /api/users/:id/followers`
- `GET /api/users/:id/following`
- **Privacy Enforcement:** If the target user is private, and the authenticated user is NOT following them (status='accepted'), the backend returns a 403 Forbidden: `{"success": false, "message": "This account is private"}`.

### C. Mutual Friends (`GET /api/users/friends`)
- **Behavior:** Returns users that the authenticated user follows (`status: 'accepted'`) who ALSO follow the authenticated user (`status: 'accepted'`).
- **Response Structure:** Same list of user objects as `followers`/`following`.

### D. Friend Suggestions (`GET /api/users/suggestions`)
- **Behavior:** Returns a complex object of 1st, 2nd, and 3rd degree connections, calculating mutual connection counts.
- **Response:**
```json
{
  "success": true,
  "data": {
    "firstDegree": [...],
    "secondDegree": [...],
    "thirdDegree": [...]
  }
}
```

---

## 6. SEARCH USERS

- **Endpoint:** `GET /api/users/search`
- **Query Params:** `?q=searchterm&page=1&limit=20`
- **Behavior:** Searches `username` and `fullName`. Excludes the authenticated user from results. Automatically attaches the current user's `followStatus` (`"following" | "pending" | "none"`) to every returned user.

---

## 7. PRIVACY / AUTHORIZATION MATRIX

| Action | Auth Req | Owner Req | Target User Req | Notes |
|---|---|---|---|---|
| View Profile | YES | NO | NO | Basic profile always visible |
| View Posts | YES | NO | YES | 403 if target is private & not following |
| View Followers | YES | NO | YES | 403 if target is private & not following |
| Follow User | YES | NO | YES | Target privacy dictates accepted vs pending |
| Accept Req | YES | YES | NO | Only profile owner can accept |
| Update Profile | YES | YES | NO | |

---

## 8. NOT IMPLEMENTED / GAPS

The following features were audited and are **NOT IMPLEMENTED** in the backend codebase:

1. **Blocking (`NOT IMPLEMENTED`)**: There are no tables, endpoints, or filtering logic to support blocking a user.
2. **Muting / Restricting (`NOT IMPLEMENTED`)**: Does not exist.
3. **Notifications (`NOT IMPLEMENTED`)**: The backend does NOT trigger notifications when a user follows, requests to follow, or accepts a request.
4. **Remove Follower (`NOT IMPLEMENTED`)**: There is no endpoint for User A to force User B to unfollow them (other than blocking, which is also missing).
5. **Cursor Pagination (`NOT IMPLEMENTED`)**: All lists are unpaginated (e.g. `getFollowers` returns all records) except Search, which uses offset (`page/limit`).

---

## 9. ERROR CONTRACT

| Status | Meaning | Typical Usage |
|---|---|---|
| `400` | Bad Request | Following yourself. |
| `403` | Forbidden | Trying to fetch posts/followers of a private account you do not follow. |
| `404` | Not Found | User doesn't exist, or trying to accept/reject/cancel a non-existent follow request. |
| `409` | Conflict | Username already taken on profile update. Already following / request already sent. |
| `413` | Payload Too Large | Profile image > 5MB. |

---

## 10. REACT NATIVE INTEGRATION RECOMMENDATIONS

### A. Architectural Strategy (FACT + RECOMMENDATION)
- **Profile Updates (RECOMMENDATION):** Use `FormData` to submit the `PATCH /api/users/profile`. Ensure you send the file properly appended to the form data. If no image is changing, you can omit the `profileImage` key.
- **Following State (FACT):** Rely on `followStatus` (`"following" | "pending" | "none"`) returned in `GET /api/users/:id` or `GET /api/users/search`. You do NOT need a separate API call to check relationship status.
- **Optimistic Updates (RECOMMENDATION):** When a user taps "Follow", optimistically update the cached profile's `followStatus` to `"pending"` (if `isPrivate === true`) or `"following"` (if `isPrivate === false`).
- **Cancel Request (FACT):** The UI should map a "Requested" or "Cancel Request" button to the `DELETE /api/users/:id/follow` unfollow endpoint.

---

## 11. FRONTEND FEATURE MATRIX

| Feature | Backend Status | Method | Endpoint | Frontend Ready | Notes |
|---|---|---|---|---|---|
| Get own profile | SUPPORTED | GET | `/api/users/me` | ✅ Yes | |
| Get user profile| SUPPORTED | GET | `/api/users/:id`| ✅ Yes | |
| Update profile | SUPPORTED | PATCH | `/api/users/profile` | ✅ Yes | |
| Update bio | SUPPORTED | PATCH | `/api/users/profile` | ✅ Yes | |
| Update username | SUPPORTED | PATCH | `/api/users/profile` | ✅ Yes | Checks uniqueness |
| Public/private | SUPPORTED | PATCH | `/api/users/profile` | ✅ Yes | Send `isPrivate: true` |
| Profile picture | SUPPORTED | PATCH | `/api/users/profile` | ✅ Yes | Handled via multipart form |
| Follow | SUPPORTED | POST | `/api/users/:id/follow` | ✅ Yes | Handles pending/accepted internally |
| Unfollow | SUPPORTED | DELETE| `/api/users/:id/follow` | ✅ Yes | |
| Follow request | SUPPORTED | POST | `/api/users/:id/follow` | ✅ Yes | Generated automatically |
| Accept request | SUPPORTED | PATCH | `.../follow-requests/:id/accept`| ✅ Yes | |
| Reject request | SUPPORTED | PATCH | `.../follow-requests/:id/reject`| ✅ Yes | |
| Cancel request | SUPPORTED | DELETE| `/api/users/:id/follow` | ✅ Yes | Same as unfollow |
| Followers list | SUPPORTED | GET | `/api/users/:id/followers`| ✅ Yes | |
| Following list | SUPPORTED | GET | `/api/users/:id/following`| ✅ Yes | |
| Mutual friends | SUPPORTED | GET | `/api/users/friends` | ✅ Yes | Requires two-way follow |
| Block user | NOT IMPLEMENTED| N/A | N/A | ❌ No | |
| Notifications | NOT IMPLEMENTED| N/A | N/A | ❌ No | |

---

### Source Files Inspected
- `modules/user/routes/user.routes.js`
- `modules/user/controllers/user.controller.js`
- `modules/user/services/user.service.js`
- `modules/user/models/user.model.js`
- `modules/user/models/follow.model.js`
- `middleware/upload.js`
