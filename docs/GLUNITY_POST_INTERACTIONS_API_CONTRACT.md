# Glunity Backend API Contract: Post & Social Module

This document is the **FINAL and AUTHORITATIVE API CONTRACT** for the Post and Social features of the Glunity backend. It is based strictly on an exhaustive audit of the actual Node.js codebase (as of the recent caption->content refactor).

**Production Backend Base URL:** `https://glunity.onrender.com`

---

## 1. COMPLETE ROUTE INVENTORY

| Feature | Method | Endpoint | Auth | Status |
|---|---|---|---|---|
| Create Post (Dedicated) | POST | `/api/posts` | Required | IMPLEMENTED |
| Create Post (Unified) | POST | `/api/content` | Required | IMPLEMENTED |
| Get Single Post | GET | `/api/posts/:id` | Required | IMPLEMENTED |
| Home Feed | GET | `/api/feed/home` | Required | IMPLEMENTED |
| General Feed | GET | `/api/feed` | Required | IMPLEMENTED |
| User Posts | GET | `/api/users/:id/posts` | Required | IMPLEMENTED |
| My Posts | GET | `/api/users/me/posts` | Required | IMPLEMENTED |
| Like Post | POST | `/api/posts/:id/like` | Required | IMPLEMENTED |
| Bookmark Post | POST | `/api/posts/:id/bookmark` | Required | IMPLEMENTED |
| Repost Post | POST | `/api/posts/:id/repost` | Required | IMPLEMENTED |
| Saved Posts List | GET | `/api/users/saved/posts` | Required | IMPLEMENTED |
| Add Reply | POST | `/api/posts/:id/replies` | Required | IMPLEMENTED |
| Get Replies | GET | `/api/posts/:id/replies` | Required | IMPLEMENTED |
| Add Nested Reply | POST | `/api/posts/:id/replies/:replyId/replies` | Required | IMPLEMENTED |
| Get Nested Replies| GET | `/api/posts/:id/replies/:replyId/replies` | Required | IMPLEMENTED |
| Delete Reply | DELETE | `/api/posts/:id/replies/:replyId` | Required | IMPLEMENTED |
| Like Reply | POST | `/api/posts/:id/replies/:replyId/like` | Required | IMPLEMENTED |
| Update/Edit Post | PATCH/PUT| `N/A` | N/A | **NOT IMPLEMENTED** |
| Delete Post | DELETE | `N/A` | N/A | **NOT IMPLEMENTED** |
| Quote Post | POST | `N/A` | N/A | **NOT IMPLEMENTED** |
| Share/External | POST | `N/A` | N/A | **NOT IMPLEMENTED** |

---

## 2. POST CREATION

Posts can be created via two endpoints. The backend uses `multer` for multipart form data parsing and uploads media directly to a Bunny.net CDN.

### A. Dedicated Post Route (`POST /api/posts`)
- **Authentication:** `Bearer <accessToken>`
- **Content-Type:** `multipart/form-data`
- **Request Body / Form Fields:**
  - `content` (string, optional, max 10,000 chars)
  - `isPrivate` (boolean, optional)
  - `images` (file array, optional, max 10 files, 5MB each)
- **Validation:** Must contain either `content` or `images`.
- **Supported Scenarios:**
  - **Text-only Post:** SUPPORTED (Send `content`)
  - **Text + Image(s):** SUPPORTED (Send `content` + `images`)
  - **Multiple Images:** SUPPORTED (Up to 10 `images`)
  - **Media-only:** SUPPORTED (Send `images` without `content`)
  - **Video:** **NOT SUPPORTED** on this route.

### B. Unified Content Route (`POST /api/content`)
- **Authentication:** `Bearer <accessToken>`
- **Content-Type:** `multipart/form-data`
- **Request Body / Form Fields:**
  - `content` (string, optional)
  - `caption` (string, optional - for Reels only)
  - `isPrivate` (boolean, optional)
  - `images` (file array, optional)
  - `video` (file, optional)
- **Decision Logic:** 
  - If `video` is uploaded → Processes as a **Reel** (saves text from `caption`).
  - If `images` are uploaded or NO media is uploaded → Processes as a **Post** (saves text from `content`).
  - If both `video` and `images` are sent → Returns 400 Error.

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "type": "post",
    "id": "uuid",
    "content": "...",
    "media": ["url1", "url2"],
    "author": { "id": "...", "username": "..." }
  }
}
```
**Error Statuses:** 400 (Validation/Too many files), 413 (File too large > 5MB), 500 (CDN failure).

---

## 3. POST RETRIEVAL

### A. Single Post (`GET /api/posts/:id`)
- **Privacy Rules:** If `isPrivate` is true, only the author or users who follow the author (status: 'accepted') can view it. Otherwise, returns 403 Forbidden.
- **Response:** Complete Post object including metrics (`likeCount`, `commentCount`, etc.) and `hasLiked`/`hasBookmarked` specific to the viewer.

### B. Feed (`GET /api/feed` & `/api/feed/home`)
- **Pagination:** Offset-based via query parameters `?page=1&limit=20`
- **Defaults:** `page=1`, `limit=20` (home feed uses `limit=10`)
- **Ordering/Scoring:** Uses a custom `computeScore` algorithm blending recency, `likeCount`, `bookmarkCount`, `repostCount`, and follow status.
- **Structure:**
```json
{
  "success": true,
  "data": {
    "items": [
      { "type": "post", "content": "..." },
      { "type": "reel", "caption": "..." }
    ],
    "total": 500,
    "page": 1,
    "limit": 20
  }
}
```

### C. User Posts (`GET /api/users/:id/posts`)
- **Pagination:** Offset-based (`?page=1&limit=12`).
- **Ordering:** Strictly chronological (`createdAt DESC`).
- **Privacy:** Enforces `canViewContent` checking before returning list.

---

## 4. POST UPDATE / EDIT
- **NOT IMPLEMENTED.** 
- There are no backend routes, controllers, or services to mutate post content after creation.

---

## 5. POST DELETE
- **NOT IMPLEMENTED.** 
- There are no backend routes to delete a top-level Post (though you can delete Replies).

---

## 6. LIKES
- **Toggle Endpoint:** `POST /api/posts/:id/like`
- **Behavior:** The backend automatically looks up the current user's state. If the like exists, it deletes it (Unlike). If it doesn't exist, it creates it (Like). 
- **Response:**
```json
{
  "success": true,
  "message": "Post liked", // or "Post unliked"
  "data": {
    "liked": true,
    "likeCount": 42
  }
}
```
- **List Likers API:** **NOT IMPLEMENTED**.

---

## 7. REPLIES / COMMENTS
The backend specifically calls these **Replies** (`Reply` model).

- **Create Reply:** `POST /api/posts/:id/replies`
  - Body: `{ "text": "My reply" }`
- **List Replies:** `GET /api/posts/:id/replies?page=1&limit=20`
- **Delete Reply:** `DELETE /api/posts/:id/replies/:replyId` (Enforces authorship ownership)
- **Like Reply:** `POST /api/posts/:id/replies/:replyId/like` (Toggle behavior)
- **Edit Reply:** **NOT IMPLEMENTED**

---

## 8. NESTED REPLIES
- **How nesting works:** The backend uses `parentId` to associate a child reply with a parent reply. The child reply still maintains the `contentId` pointing to the original Post.
- **Depth limit:** The schema allows infinite nesting structurally, but the API explicitly defines only one level of nesting routes (`/:replyId/replies`).
- **Create Nested Reply:** `POST /api/posts/:id/replies/:replyId/replies` (Body: `{ "text": "..." }`)
- **List Nested Replies:** `GET /api/posts/:id/replies/:replyId/replies?page=1&limit=20`

---

## 9. REPOST
- **Endpoint:** `POST /api/posts/:id/repost`
- **Behavior:** **ONE-WAY REPOST**. The backend uses `findOrCreate` in `interaction.service.js` to create the repost record. 
- **Limitation:** There is NO code to destroy or undo the repost. Hitting the endpoint twice simply returns success but does not decrement the count.
- **Current-User State:** The backend does **NOT** return `hasReposted` in the Post object response.

---

## 10. QUOTE POST
- **NOT IMPLEMENTED.**

---

## 11. BOOKMARK
- **Endpoint:** `POST /api/posts/:id/bookmark`
- **Behavior:** Standard Toggle (like Likes). Creates or destroys based on existence.
- **List Saved Posts:** `GET /api/users/saved/posts?page=1&limit=12`
- **Current-User State:** Returned on the Post object as `hasBookmarked: true/false`.

---

## 12. SHARE
- **NO BACKEND SHARE SYSTEM.**
- There are no endpoints to track shares, no database tables for shares, and no `shareCount` tracked on the Post model. Sharing must be handled natively by the OS via deep linking.

---

## 13. MEDIA
- **Limits:** 10 images max per post. 5MB max per file. Valid extensions: `.jpg`, `.jpeg`, `.png`, `.webp`.
- **CDN:** Uploads are streamed to Bunny.net; URLs are saved to the `PostMedia` table.
- **Ordering:** Order is guaranteed by iterating the `req.files` array via `order: i` during insertion, and queried via `ORDER BY order ASC`.
- **Media Deletion/Replacement:** **NOT IMPLEMENTED**.
- **Post Media vs Reel Media:** Posts take arrays of images. Reels take a single `video` file + `thumbnail` image. They are stored in separate tables (`PostMedia` vs `Reel`).

---

## 14. HASHTAGS
- **Extraction:** Backend automatically parses the `content` string via Regex `#([a-zA-Z0-9_]+)`.
- **Storage:** Creates unique rows in `Hashtags` and links them via `PostHashtags` junction table.
- **Response:** Included in Post object as `hashtags: ["launch", "glunity"]`.
- **Search Endpoint:** **NOT IMPLEMENTED**.

---

## 15. MENTIONS
- **Extraction:** Backend automatically parses the `content` string via Regex `@([a-zA-Z0-9_.]+)`.
- **Storage:** Resolves the usernames to actual user IDs and saves to `PostMentions`.
- **Response:** Included in Post object as `mentions: [{ id, username, profileImage }]`.
- **Notifications:** **NOT IMPLEMENTED**.

---

## 16. NOTIFICATIONS
- **NOT IMPLEMENTED.**
- The repository contains an empty `modules/notification` directory structure. No code in `interaction.service.js` or `post.service.js` currently triggers any notifications for likes, replies, mentions, or reposts.

---

## 17. PRIVACY & AUTHORIZATION

| Action | Auth Req | Owner Req | Follower Req |
|---|---|---|---|
| Create Post | YES | N/A | N/A |
| View Post | YES | NO | YES (If `isPrivate=true`) |
| Like Post | YES | NO | YES (If `isPrivate=true`) |
| Reply to Post | YES | NO | YES (If `isPrivate=true`) |
| Delete Reply | YES | YES | N/A |
| Delete Post | N/A | N/A | N/A (Not Implemented) |

---

## 18. POST RESPONSE CONTRACT

Every Post returned by the backend has this exact structure:

```json
{
  "id": "uuid",
  "content": "string",
  "isPrivate": false,
  "createdAt": "datetime",
  "author": {
    "id": "uuid",
    "username": "string",
    "fullName": "string",
    "profileImage": "url|null"
  },
  "media": ["url", "url"],
  "hashtags": ["string"],
  "mentions": [
    {
      "id": "uuid",
      "username": "string",
      "profileImage": "url|null"
    }
  ],
  "likeCount": 0,
  "bookmarkCount": 0,
  "repostCount": 0,
  "commentCount": 0,
  "hasLiked": false,
  "hasBookmarked": false
}
```
*Note: `hasReposted` and `shareCount` do not exist.*

---

## 19. PAGINATION
- **Mechanism:** Query-based Offset Pagination (`?page=1&limit=20`) across ALL list endpoints.
- Cursor pagination is **NOT IMPLEMENTED**.

---

## 20. ERROR CONTRACT
- `400 Bad Request`: Validation failure (e.g., missing text/media on post creation).
- `401 Unauthorized`: Missing or invalid Bearer token.
- `403 Forbidden`: Trying to view a private post without following, or trying to delete someone else's reply.
- `404 Not Found`: Post or Reply does not exist.
- `413 Payload Too Large`: Uploaded image > 5MB.
- `429 Too Many Requests`: Triggered by global `apiLimiter` (1000 requests per 15 minutes).

---

## 21. REACT NATIVE INTEGRATION RECOMMENDATIONS

### A. Architectural Strategy (FACT + RECOMMENDATION)
- **Pagination Strategy (RECOMMENDATION):** Map React Query's `useInfiniteQuery` directly to `pageParam` injecting into `?page=${pageParam}`. 
- **Optimistic Updates (RECOMMENDATION):** Use `onMutate` in React Query for Likes and Bookmarks. Because they are toggle endpoints that return the absolute `liked` state and updated `likeCount`, you can revert easily on error.
- **Upload Strategy (RECOMMENDATION):** Use `FormData`. The backend uses `multer` which relies on standard multipart boundaries. Do not manually set `Content-Type: multipart/form-data` in `fetch()`/Axios, let the browser/engine set it to generate the boundary hash.

### B. Handling Reposts (FACT + RECOMMENDATION)
- **FACT:** The backend `POST /api/posts/:id/repost` is a one-way street and does not return `hasReposted`.
- **RECOMMENDATION:** Once a user taps Repost, the UI must locally disable the button for that session, as the backend will not track or allow undo operations natively.

---

## 22. FRONTEND FEATURE MATRIX

| Feature | Backend | Endpoint | Frontend Action | Notes |
|---|---|---|---|---|
| Create Text Post | SUPPORTED | `POST /api/posts` | ✅ Use | Allowed fallback via /api/content |
| Create Image Post | SUPPORTED | `POST /api/posts` | ✅ Use | Max 10 images, 5MB each |
| Like / Unlike | SUPPORTED | `POST /api/posts/:id/like` | ✅ Use | Toggle behavior |
| Bookmark / Unbookmark | SUPPORTED | `POST /api/posts/:id/bookmark`| ✅ Use | Toggle behavior |
| Reply | SUPPORTED | `POST /api/posts/:id/replies` | ✅ Use | |
| Nested Reply | SUPPORTED | `POST /.../replies/:replyId/replies`| ✅ Use | One level of nesting supported |
| Reply Like | SUPPORTED | `POST /.../replies/:replyId/like`| ✅ Use | Toggle behavior |
| Reply Delete | SUPPORTED | `DELETE /.../replies/:replyId`| ✅ Use | Enforces authorship |
| Repost | PARTIAL | `POST /api/posts/:id/repost` | ⚠️ Use Carefully | Additive only. Cannot be undone. |
| Quote Post | NOT IMPLEMENTED| N/A | ❌ Skip | |
| Share | NOT IMPLEMENTED| N/A | ✅ Native OS Share| No backend tracking required |
| Edit Post | NOT IMPLEMENTED| N/A | ❌ Skip | |
| Delete Post | NOT IMPLEMENTED| N/A | ❌ Skip | |

---

## 23. BACKEND GAPS FOR X/TWITTER-STYLE GLUNITY
If aiming for a complete X/Twitter parity, the following are verified gaps in the current backend logic:
1. **Delete Post:** Users cannot delete their own posts.
2. **Undo Repost:** Reposts cannot be removed.
3. **Repost State Tracking:** The client doesn't know if the authenticated user has already reposted an item.
4. **Notifications:** Interactions do not generate backend notifications.
5. **Quote Posts:** Not supported.
6. **Hashtag Search:** Hashtags are extracted but there are no endpoints to click a hashtag and see a feed of posts.
7. **View Counts:** Not tracked or returned.

---

### Source Files Inspected
- `app.js`
- `middleware/upload.js`
- `middleware/rateLimiter.js`
- `modules/post/routes/post.routes.js`
- `modules/post/controllers/post.controller.js`
- `modules/post/services/post.service.js`
- `modules/post/services/interaction.service.js`
- `modules/feed/routes/feed.routes.js`
- `modules/feed/controllers/feed.controller.js`
- `modules/feed/services/feed.service.js`
- `modules/reply/routes/reply.routes.js` *(Mapped via post.routes)*
- `modules/reply/controllers/reply.controller.js`
- `modules/reply/services/reply.service.js`
- `modules/user/routes/user.routes.js`
- `modules/user/services/user.service.js`
- `modules/content/routes/content.routes.js`
- `modules/content/controllers/content.controller.js`
- `modules/notification/services/notification.service.js`
