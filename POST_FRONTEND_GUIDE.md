# Post API Guide

This guide details the endpoints for creating and interacting with posts in the frontend application, specifically detailing how to upload images and videos.

---

## 1. Create a Post (with Mixed Media)

Creates a new post. The request **must** be sent as `multipart/form-data` if you are uploading media (images or videos). You can send up to 10 media files.

**Endpoint:** `POST /api/posts`

**Form Data Fields:**
- `content` (Text, optional if media is provided) - The text content of the post.
- `media` (Files, optional if content is provided) - Array of up to 10 image or video files. Max size is 100MB for videos.

**cURL Request:**
```bash
curl -X POST http://localhost:8080/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "content=Check out this amazing video and photo!" \
  -F "media=@/path/to/image.jpg" \
  -F "media=@/path/to/video.mp4"
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "uuid-post-id",
    "content": "Check out this amazing video and photo!",
    "createdAt": "2026-09-08T12:00:00Z",
    "author": {
      "id": "uuid-user-id",
      "username": "johndoe123",
      "fullName": "John Doe",
      "profileImage": "https://cdn.../avatar.jpg"
    },
    "media": [
      "https://cdn.../user_timestamp_0.jpg",
      "https://cdn.../user_timestamp_1.mp4"
    ],
    "hashtags": [],
    "mentions": [],
    "likeCount": 0,
    "bookmarkCount": 0,
    "repostCount": 0,
    "commentCount": 0,
    "hasLiked": false,
    "hasBookmarked": false
  }
}
```
> **Frontend Implementation Note:** The `media` array returns plain string URLs. Your frontend should check the file extension (e.g., `.mp4`, `.mov` vs `.jpg`, `.png`) to determine whether to render an `<img src="..."/>` or a `<video src="..."/>` component.

---

## 2. Get a Post by ID

Retrieves a single post and its details.

**Endpoint:** `GET /api/posts/:id`

**cURL Request:**
```bash
curl -X GET http://localhost:8080/api/posts/uuid-post-id \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Post fetched successfully",
  "data": {
    "id": "uuid-post-id",
    "content": "Check out this amazing video and photo!",
    ...
    "likeCount": 10,
    "hasLiked": true
  }
}
```

---

## 3. Delete a Post

Deletes a post owned by the authenticated user.

**Endpoint:** `DELETE /api/posts/:id`

**cURL Request:**
```bash
curl -X DELETE http://localhost:8080/api/posts/uuid-post-id \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

## 4. Like / Unlike a Post

Toggles the like status of a post.

**Endpoint:** `POST /api/posts/:id/like`

**cURL Request:**
```bash
curl -X POST http://localhost:8080/api/posts/uuid-post-id/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Post liked",
  "data": {
    "liked": true
  }
}
```

---

## 5. Bookmark / Unbookmark a Post

Toggles the bookmark status of a post.

**Endpoint:** `POST /api/posts/:id/bookmark`

**cURL Request:**
```bash
curl -X POST http://localhost:8080/api/posts/uuid-post-id/bookmark \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Post bookmarked",
  "data": {
    "bookmarked": true
  }
}
```

---

## 6. Repost

Reposts content to the user's feed.

**Endpoint:** `POST /api/posts/:id/repost`

**cURL Request:**
```bash
curl -X POST http://localhost:8080/api/posts/uuid-post-id/repost \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Post reposted to your followers",
  "data": { ... }
}
```
