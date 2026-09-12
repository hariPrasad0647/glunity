# Reposts API Guide

This document outlines the API endpoints used to fetch reposts (posts and reels) made by a user. 

## 1. Get Logged-In User's Reposted Posts
Fetches the paginated list of posts that the currently authenticated user has reposted.

**Endpoint:** `GET /api/users/me/reposted/posts`  
**Auth Required:** Yes (Bearer Token)  

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | `1` | Page number for pagination |
| `limit` | Integer | `12` | Number of posts per page |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Reposted posts fetched",
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
        "media": ["https://cdn.url/video.mp4"],
        "hashtags": ["tech", "coding"],
        "mentions": [],
        "likeCount": 10,
        "saveCount": 2,
        "shareCount": 5,
        "commentCount": 3,
        "hasLiked": false,
        "hasSaved": false
      }
    ]
  }
}
```

---

## 2. Get Logged-In User's Reposted Reels
Fetches the paginated list of reels that the currently authenticated user has reposted.

**Endpoint:** `GET /api/users/me/reposted/reels`  
**Auth Required:** Yes (Bearer Token)  

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | `1` | Page number for pagination |
| `limit` | Integer | `12` | Number of reels per page |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Reposted reels fetched",
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
        "hasSaved": false
      }
    ]
  }
}
```

---

## 3. Get Another User's Reposted Posts
Fetches the paginated list of posts reposted by a specific user by their ID.

**Endpoint:** `GET /api/users/:id/reposted/posts`  
**Auth Required:** Yes (Bearer Token)  

### Path Parameters
- `id` (UUID): The unique identifier of the user.

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | `1` | Page number for pagination |
| `limit` | Integer | `12` | Number of posts per page |

### Response (200 OK)
Same format as `GET /api/users/me/reposted/posts`.

---

## 4. Get Another User's Reposted Reels
Fetches the paginated list of reels reposted by a specific user by their ID.

**Endpoint:** `GET /api/users/:id/reposted/reels`  
**Auth Required:** Yes (Bearer Token)  

### Path Parameters
- `id` (UUID): The unique identifier of the user.

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | `1` | Page number for pagination |
| `limit` | Integer | `12` | Number of reels per page |

### Response (200 OK)
Same format as `GET /api/users/me/reposted/reels`.
