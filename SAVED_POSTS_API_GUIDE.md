# Saved Posts API Guide

This document outlines the API endpoints used to fetch content (posts and reels) that the currently authenticated user has saved (bookmarked). This works similarly to the Instagram "Saved" section.

## 1. Get Saved Posts
Fetches a list of all posts that the authenticated user has saved/bookmarked. The most recently saved posts appear first.

**Endpoint:** `GET /api/users/saved/posts`  
**Auth Required:** Yes (Bearer Token)  

### Response (200 OK)
```json
{
  "success": true,
  "message": "Saved posts fetched",
  "data": {
    "posts": [
      {
        "type": "post",
        "id": "uuid",
        "content": "Post text content...",
        "createdAt": "2026-09-12T13:00:00Z",
        "author": {
          "id": "uuid",
          "username": "johndoe",
          "fullName": "John Doe",
          "profileImage": "https://cdn.url/image.jpg"
        },
        "media": ["https://cdn.url/image.jpg"],
        "hashtags": ["tech", "coding"],
        "mentions": [],
        "likeCount": 10,
        "saveCount": 2,
        "shareCount": 5,
        "commentCount": 3,
        "hasLiked": false,
        "hasSaved": true
      }
    ]
  }
}
```

---

## 2. Get Saved Reels
Fetches a list of all reels that the authenticated user has saved/bookmarked. The most recently saved reels appear first.

**Endpoint:** `GET /api/users/saved/reels`  
**Auth Required:** Yes (Bearer Token)  

### Response (200 OK)
```json
{
  "success": true,
  "message": "Saved reels fetched",
  "data": {
    "reels": [
      {
        "type": "reel",
        "id": "uuid",
        "videoUrl": "https://cdn.url/reel.mp4",
        "thumbnailUrl": "https://cdn.url/thumbnail.jpg",
        "caption": "Reel caption...",
        "createdAt": "2026-09-12T13:00:00Z",
        "author": {
          "id": "uuid",
          "username": "janedoe",
          "fullName": "Jane Doe",
          "profileImage": "https://cdn.url/image.jpg"
        },
        "hashtags": ["fun", "vlog"],
        "mentions": [],
        "likeCount": 50,
        "saveCount": 10,
        "shareCount": 15,
        "commentCount": 8,
        "hasLiked": true,
        "hasSaved": true
      }
    ]
  }
}
```
