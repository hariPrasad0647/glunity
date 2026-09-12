# View Count API Guide

This document outlines the API endpoints to record views for posts and reels, similar to Twitter (X). The view counts are now included in the response payloads when you fetch a post, reel, or feed.

## 1. Record a Post View
Call this endpoint when a post enters the user's viewport to record a view.

**Endpoint:** `POST /api/posts/:id/view`  
**Auth Required:** Yes (Bearer Token)  

### Path Parameters
- `id` (UUID): The unique identifier of the post.

### cURL Example
```bash
curl -X POST http://localhost:5000/api/posts/POST_ID_HERE/view \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Post view recorded",
  "data": {
    "success": true
  }
}
```

---

## 2. Record a Reel View
Call this endpoint when a reel starts playing or enters the viewport to record a view.

**Endpoint:** `POST /api/reels/:id/view`  
**Auth Required:** Yes (Bearer Token)  

### Path Parameters
- `id` (UUID): The unique identifier of the reel.

### cURL Example
```bash
curl -X POST http://localhost:5000/api/reels/REEL_ID_HERE/view \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Reel view recorded",
  "data": {
    "success": true
  }
}
```

---

## 3. Fetching the View Count
The `viewCount` is automatically included in all post and reel objects when fetching them through existing endpoints (e.g., getting the feed, viewing a profile, or getting a single post). 

Here is an example of what the response now looks like:

### Example Post Object
```json
{
  "type": "post",
  "id": "uuid",
  "content": "Hello world!",
  "createdAt": "2026-09-12T13:00:00Z",
  "author": {
    "id": "uuid",
    "username": "johndoe",
    "fullName": "John Doe",
    "profileImage": "https://cdn.url/image.jpg"
  },
  "media": [],
  "hashtags": [],
  "mentions": [],
  "likeCount": 10,
  "saveCount": 2,
  "shareCount": 5,
  "commentCount": 3,
  "viewCount": 1500,  // <-- NEW: Indicates the number of views
  "hasLiked": false,
  "hasBookmarked": true
}
```
