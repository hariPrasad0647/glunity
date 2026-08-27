# Glunity Frontend API Contract: Posts & Social Module

This document outlines the precise API contract for the Posts and Social features of the Glunity backend. It is generated based entirely on the actual, current implementation of the Node.js/Express backend running at `https://glunity.onrender.com`.

## 1. Post Module Overview

The Post architecture uses a **text-first model** where the primary text is stored in the `content` field.

**Post Model Fields:**
- `id` (UUID)
- `content` (TEXT) - Primary text. Replaces legacy `caption`.
- `isPrivate` (BOOLEAN)
- `createdAt` (DATE)
- `author` (Object) - `{ id, username, fullName, profileImage }`
- `media` (Array of Strings) - CDN URLs ordered by upload sequence.
- `hashtags` (Array of Strings) - Extracted automatically from `content`.
- `mentions` (Array of Objects) - `{ id, username, profileImage }`, extracted automatically from `content`.
- `likeCount`, `bookmarkCount`, `repostCount`, `commentCount` (Integers)
- `hasLiked`, `hasBookmarked` (Booleans) - Relative to the authenticated user.

**Post Response Structure Example:**
```json
{
  "id": "e8a939f8-b3d2-45e0-8356-9b1686cc938f",
  "content": "Hello Glunity! #launch @user1",
  "isPrivate": false,
  "createdAt": "2026-08-27T14:30:00.000Z",
  "author": {
    "id": "f5c329a1-c3b1-41d9-8123-1d2a58b928f9",
    "username": "johndoe",
    "fullName": "John Doe",
    "profileImage": "https://cdn.glunity.org/profile-images/johndoe.jpg"
  },
  "media": [
    "https://cdn.glunity.org/posts/image1.jpg"
  ],
  "hashtags": ["launch"],
  "mentions": [
    {
      "id": "a9c139b2-c1b1-41d9-8123-1d2a58b928f9",
      "username": "user1",
      "profileImage": null
    }
  ],
  "likeCount": 12,
  "bookmarkCount": 3,
  "repostCount": 1,
  "commentCount": 5,
  "hasLiked": true,
  "hasBookmarked": false
}
```

---

## 2. Create Post

There are two valid endpoints for creating a post.

### A. Dedicated Post Endpoint (Images/Text Only)
- **Method:** `POST`
- **URL:** `/api/posts`
- **Authentication:** `Bearer <accessToken>`
- **Content-Type:** `multipart/form-data`
- **Validation:**
  - `content`: Optional, max 10,000 characters.
  - `isPrivate`: Optional, boolean.
  - `images`: Optional, up to 10 files.
  - *Constraint:* The request must contain either `content` OR at least one file in `images`. If both are missing, returns `400`.

### B. Unified Content Endpoint (Detects Post vs Reel)
- **Method:** `POST`
- **URL:** `/api/content`
- **Authentication:** `Bearer <accessToken>`
- **Content-Type:** `multipart/form-data`
- **Behavior:** 
  - If `video` is uploaded: Interpreted as a Reel, expects `caption`.
  - If `images` are uploaded OR no media is uploaded: Interpreted as a Post, expects `content`.
  - If both `images` and `video` are uploaded: Returns `400`.

**Supported Post Creation Scenarios:**
- Text-only: **SUPPORTED**
- Text + image(s): **SUPPORTED** (Up to 10 images)
- Media-only (no text): **SUPPORTED**
- Text + video: **NOT SUPPORTED** (Videos are processed exclusively as Reels, not Posts).

**Example: Text-Only Post Request (Multipart not strictly required if no files, but recommended for consistency)**
```http
POST /api/posts
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

content: "Hello Glunity!"
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "type": "post",
    "id": "...",
    "content": "...",
    ...
  }
}
```

---

## 3. Get Feed

### A. Chronological/Home Feed
- **Method:** `GET`
- **URL:** `/api/feed/home`
- **Authentication:** `Bearer <accessToken>`
- **Query Parameters:** `?page=1&limit=10`
- **Behavior:** 
  - Page 1 uniquely returns the authenticated user's own posts and reels.
  - Page 2+ returns a chronological feed of posts and reels from followed users.

### B. Standard Feed
- **Method:** `GET`
- **URL:** `/api/feed`
- **Authentication:** `Bearer <accessToken>`
- **Query Parameters:** `?page=1&limit=20` (Offset pagination)
- **Ordering:** Mixed scoring mechanism (`computeScore`) based on recency, interactions, and follow status.

**Response Structure:**
```json
{
  "success": true,
  "message": "Feed fetched",
  "data": {
    "items": [
      {
        "type": "post",
        "id": "...",
        "content": "...",
        "author": {...}
      },
      {
        "type": "reel",
        "id": "...",
        "caption": "...", // Reels use caption
        "author": {...}
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```

---

## 4. Get Single Post

- **Method:** `GET`
- **URL:** `/api/posts/:id`
- **Authentication:** `Bearer <accessToken>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Post fetched successfully",
  "data": {
    "id": "...",
    "content": "..."
  }
}
```
- **Errors:** 
  - `404 Not Found` if post doesn't exist.
  - `403 Forbidden` if the post is private and the user does not follow the author.

---

## 5. User Posts

Retrieve all posts authored by a specific user.

- **Method:** `GET`
- **URL:** `/api/users/:id/posts` (or `/api/users/me/posts` for authenticated user)
- **Authentication:** `Bearer <accessToken>`
- **Query Parameters:** `?page=1&limit=12`
- **Ordering:** `createdAt DESC`
- **Response Structure:**
```json
{
  "success": true,
  "data": {
    "canView": true,
    "posts": [{...}, {...}],
    "total": 45,
    "page": 1,
    "limit": 12
  }
}
```

---

## 6. Update Post

- **NOT IMPLEMENTED.**
- The backend currently does not support editing/updating a post after creation.

---

## 7. Delete Post

- **NOT IMPLEMENTED.**
- The backend currently does not have an endpoint to delete a `Post`. (Note: Deleting a `Reply` *is* implemented).

---

## 8. Likes

Glunity uses a "toggle" endpoint for likes rather than separate POST/DELETE routes.

- **Method:** `POST`
- **URL:** `/api/posts/:id/like`
- **Authentication:** `Bearer <accessToken>`
- **Behavior:** Calling this endpoint automatically toggles the state. If unliked, it likes it. If liked, it unlikes it.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Post liked", // or "Post unliked"
  "data": {
    "liked": true,
    "likeCount": 13
  }
}
```

---

## 9. Replies / Comments

The backend refers to comments exclusively as **Replies**.

- **Add Reply:** `POST /api/posts/:id/replies`
  - Body: `{ "text": "My reply" }`
- **Get Replies:** `GET /api/posts/:id/replies?page=1&limit=20`
- **Add Nested Reply:** `POST /api/posts/:id/replies/:replyId/replies`
  - Body: `{ "text": "My nested reply" }`
- **Get Nested Replies:** `GET /api/posts/:id/replies/:replyId/replies?page=1&limit=20`
- **Like Reply:** `POST /api/posts/:id/replies/:replyId/like` (Toggle behavior)
- **Delete Reply:** `DELETE /api/posts/:id/replies/:replyId` (Ownership verified)

A reply references its parent via `contentId` (the Post ID) and `contentType` ('post'). Nested replies use `parentId` to reference the top-level reply.

---

## 10. Reposts

- **Method:** `POST`
- **URL:** `/api/posts/:id/repost`
- **Authentication:** `Bearer <accessToken>`
- **Behavior:** Calling this endpoint creates a repost record. 
- **CRITICAL BACKEND LIMITATION:** The backend currently uses `findOrCreate` for reposts. It **does not support undoing/removing a repost**. Calling it twice simply returns the same state.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Post reposted to your followers",
  "data": {
    "repostCount": 5
  }
}
```

---

## 11. Quote Posts

- **NOT IMPLEMENTED.**

---

## 12. Bookmarks (Saved Posts)

Glunity uses a "toggle" endpoint for bookmarks, identical to the Like behavior.

- **Method:** `POST`
- **URL:** `/api/posts/:id/bookmark`
- **Authentication:** `Bearer <accessToken>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Post bookmarked", // or "Post unbookmarked"
  "data": {
    "bookmarked": true,
    "bookmarkCount": 4
  }
}
```
- **List Bookmarks:** `GET /api/users/saved/posts?page=1&limit=12`

---

## 13. Share

- **NO BACKEND SHARE ENDPOINT.**
- Sharing must be handled purely on the frontend via native mobile share sheets (e.g., generating a deep link `glunity://post/<id>`).

---

## 14. Media

Media for posts is handled directly in the `POST /api/posts` creation flow via `multipart/form-data`. There is no separate pre-upload endpoint for posts.

- **Field name:** `images`
- **Limit:** Max 10 files.
- **File Types:** `.jpg`, `.jpeg`, `.png`, `.webp`
- **Size Limit:** 5MB per image.
- **CDN:** Uploaded files are streamed directly to Bunny.net CDN, and the backend stores the resulting URLs in the database.
- **Deletion:** Media deletion is **NOT IMPLEMENTED** (since Post deletion itself is not implemented).

---

## 15. Hashtags

- **Detection:** Extracted automatically on the backend from `content` using the regex `/`#([a-zA-Z0-9_]+)`/g`.
- **Storage:** Normalized to lowercase and stored in a normalized `Hashtags` junction table.
- **Retrieval:** Returned as an array of strings in the post response (`"hashtags": ["launch"]`).
- **Search:** Dedicated hashtag search is **NOT IMPLEMENTED** in the current module routing.

---

## 16. Mentions

- **Detection:** Extracted automatically on the backend from `content` using the regex `/`@([a-zA-Z0-9_.]+)`/g`.
- **Storage:** Resolves the usernames to actual user database records and stores them in a `PostMentions` junction table.
- **Retrieval:** Returned as an array of user objects in the post response (`"mentions": [{ "id": "...", "username": "..." }]`).

---

## 17. Post Metrics

The backend returns the following exact metrics:
- `likeCount`
- `bookmarkCount`
- `repostCount`
- `commentCount` (Note: represents replies)
- `hasLiked` (Relative to viewer)
- `hasBookmarked` (Relative to viewer)

*Note: `isReposted`, `viewCount`, and `shareCount` are **NOT IMPLEMENTED** on the post return object.*

---

## 18. Notifications

- **NOT IMPLEMENTED.** (The `modules/notification` directory exists but is not currently hooked into the Post/Interaction services in the provided scope).

---

## 19. Privacy

- Governed by `isPrivate` boolean on the Post creation.
- If a post is private, only followers of the author (status: 'accepted') or the author themselves can retrieve it via `GET /api/posts/:id` or view it in feed queries.
- Enforcement happens in `post.controller.js` and `user.service.js`.

---

## 20. Error Contract

| Feature | HTTP Status | Meaning | Format |
|---------|-------------|---------|--------|
| Create Post | `400` | Post missing text/media, or validation failed | `{ "success": false, "message": "..." }` |
| Upload | `413` | File too large (>5MB) | `{ "success": false, "message": "File too large..." }` |
| Upload | `400` | Too many files (>10) | `{ "success": false, "message": "Too many files uploaded" }` |
| View Post | `404` | Post does not exist | `{ "success": false, "message": "Post not found" }` |
| View Post | `403` | Post is private and viewer is not following | `{ "success": false, "message": "This post is private" }` |

---

## 21. Authentication

- **ALL** Post-related endpoints documented above strictly require authentication.
- Must provide header: `Authorization: Bearer <accessToken>`

---

## 22. Frontend Implementation Notes

*These are architectural recommendations based on the backend contract.*

- **API Paradigm:** Use TanStack Query (React Query) for state management.
- **Mutations:** Likes and Bookmarks should use `useMutation` with **Optimistic Updates**. Because the backend returns `{ liked: true/false, likeCount: N }`, you can optimistically toggle the UI state instantly, and reconcile it silently when the response returns.
- **Pagination:** Feed endpoints use offset pagination (`?page=X&limit=Y`), not cursor pagination. Use React Query's `useInfiniteQuery` mapped to the `page` parameter.
- **Reposts:** Since the backend cannot currently undo a repost, disable or lock the repost UI button once `hasReposted` is true (though note the backend currently doesn't return `hasReposted` state to the client, you will need to track this locally).
- **Upload Flow:** For media posts, use `FormData` and append `content` as a string and `images` as file blobs. Ensure your fetch interceptor removes the `Content-Type: application/json` header to allow the browser/fetch client to set the proper multipart boundary automatically.

---

## 23. Frontend Feature Matrix

| Feature | Backend Status | Endpoint | Frontend Ready |
|---------|----------------|----------|----------------|
| Create text post | Supported | `POST /api/posts` | ✅ Yes |
| Create media post | Supported | `POST /api/posts` | ✅ Yes |
| Feed | Supported | `GET /api/feed` | ✅ Yes |
| Single post | Supported | `GET /api/posts/:id` | ✅ Yes |
| User posts | Supported | `GET /api/users/:id/posts`| ✅ Yes |
| Like | Supported | `POST /api/posts/:id/like`| ✅ Yes (Toggle) |
| Unlike | Supported | `POST /api/posts/:id/like`| ✅ Yes (Toggle) |
| Reply | Supported | `POST /api/posts/:id/replies`| ✅ Yes |
| Repost | Supported (One-way)| `POST /api/posts/:id/repost`| ⚠️ Partial (No Undo) |
| Quote post | Not Implemented| N/A | ❌ No |
| Bookmark | Supported | `POST /api/posts/:id/bookmark`| ✅ Yes (Toggle) |
| Share | Backend N/A | N/A (Native Mobile Only) | ✅ Yes |
| Delete | Not Implemented| N/A | ❌ No |
| Edit | Not Implemented| N/A | ❌ No |

---

### Source Files Inspected
- `modules/post/routes/post.routes.js`
- `modules/post/controllers/post.controller.js`
- `modules/post/services/post.service.js`
- `modules/post/services/interaction.service.js`
- `modules/content/routes/content.routes.js`
- `modules/content/controllers/content.controller.js`
- `modules/feed/routes/feed.routes.js`
- `modules/feed/controllers/feed.controller.js`
- `modules/feed/services/feed.service.js`
- `modules/reply/controllers/reply.controller.js`
- `modules/reply/services/reply.service.js`
- `modules/user/routes/user.routes.js`
- `modules/user/services/user.service.js`
- `middleware/upload.js`
