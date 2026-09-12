# Following Feed API Reference

This document provides details for the dedicated feed API that returns content exclusively from the users the current user follows.

## Endpoint

```http
GET /api/feed/following
```

### Query Parameters

| Parameter | Type   | Default | Description                                      |
|-----------|--------|---------|--------------------------------------------------|
| `page`    | Number | 1       | The page number to fetch for pagination.         |
| `limit`   | Number | 20      | The maximum number of items to return per page.  |

---

## 1. Fetching the Following Feed

### Request (cURL)

```bash
curl -X GET "http://localhost:5000/api/feed/following?page=1&limit=10" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example (200 OK)

```json
{
  "status": 200,
  "message": "Following feed fetched",
  "data": {
    "feed": [
      {
        "type": "post",
        "id": 101,
        "content": "This is a post from someone you follow!",
        "createdAt": "2026-09-12T08:30:00.000Z",
        "author": {
          "id": 42,
          "username": "johndoe",
          "fullName": "John Doe",
          "profileImage": "https://cdn.example.com/profiles/johndoe.jpg"
        },
        "media": [
          "https://cdn.example.com/posts/media1.jpg"
        ],
        "hashtags": ["following", "update"],
        "mentions": [],
        "likeCount": 15,
        "bookmarkCount": 2,
        "repostCount": 1,
        "replyCount": 5,
        "hasLiked": true,
        "hasBookmarked": false,
        "isFromFollowing": true
      },
      {
        "type": "reel",
        "id": 205,
        "videoUrl": "https://cdn.example.com/reels/video205.mp4",
        "thumbnailUrl": "https://cdn.example.com/reels/thumb205.jpg",
        "caption": "Check out my new reel!",
        "createdAt": "2026-09-12T07:15:00.000Z",
        "author": {
          "id": 55,
          "username": "janedoe",
          "fullName": "Jane Doe",
          "profileImage": null
        },
        "hashtags": ["fun", "reel"],
        "mentions": [],
        "likeCount": 120,
        "bookmarkCount": 10,
        "repostCount": 4,
        "replyCount": 20,
        "hasLiked": false,
        "hasBookmarked": false,
        "isFromFollowing": true
      }
    ],
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

---

## 2. Empty or End of Feed Response

When the user doesn't follow anyone, or when the requested page goes beyond the available posts.

### Response Example (200 OK)

```json
{
  "status": 200,
  "message": "Following feed fetched",
  "data": {
    "feed": [],
    "page": 2,
    "limit": 10,
    "hasMore": false
  }
}
```
