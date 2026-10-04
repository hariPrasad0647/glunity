# Admin Users API Reference

This document outlines the backend APIs available for the Admin Dashboard to fetch and display user data.

---

## 1. Get All Users

Retrieves a paginated list of all users on the platform. Includes searching functionality.

**Endpoint:** `GET /api/admin/users`
**Authentication:** Required

### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search query for username, fullName, or email.

### cURL Request
```bash
curl -X GET "https://glunity.onrender.com/api/admin/users?page=1&limit=10&search=" \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "e434f8a3-...",
        "username": "arjun_k",
        "fullName": "Arjun Kumar",
        "email": "arjun@example.com",
        "avatar": "https://example.com/avatar1.jpg",
        "joined": "2023-01-15T10:00:00Z",
        "trustScore": 98,
        "points": 12450,
        "status": "Active"
      }
    ],
    "pagination": {
      "total": 128420,
      "page": 1,
      "limit": 10,
      "totalPages": 12842
    }
  }
}
```

---

## 2. Get User Details

Retrieves complete profile details for a specific user, including aggregated stats like posts, reposts, followers, following, trust score, and points.

**Endpoint:** `GET /api/admin/users/:id`
**Authentication:** Required

### cURL Request
```bash
curl -X GET "https://glunity.onrender.com/api/admin/users/e434f8a3-..." \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example

```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "e434f8a3-...",
      "username": "arjun_k",
      "fullName": "Arjun Kumar",
      "email": "arjun@example.com",
      "bio": "Crypto enthusiast and developer.",
      "profileImage": "https://example.com/avatar1.jpg",
      "bannerImage": "https://example.com/banner1.jpg",
      "joined": "2023-01-15T10:00:00Z",
      "profession": "Software Engineer"
    },
    "stats": {
      "posts": 142,
      "reposts": 35,
      "followers": 1500,
      "following": 300,
      "trustScore": 98,
      "points": 12450
    }
  }
}
```

---

## 3. Get User Posts

Retrieves a paginated list of posts created by a specific user, including their content and media URLs (images/videos).

**Endpoint:** `GET /api/admin/users/:id/posts`
**Authentication:** Required

### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### cURL Request
```bash
curl -X GET "https://glunity.onrender.com/api/admin/users/e434f8a3-.../posts?page=1&limit=10" \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post-uuid-1",
        "content": "Enjoying the sunset! #vibes",
        "createdAt": "2023-10-01T15:30:00Z",
        "media": [
          "https://example.com/uploads/image1.jpg",
          "https://example.com/uploads/video1.mp4"
        ]
      }
    ],
    "pagination": {
      "total": 142,
      "page": 1,
      "limit": 10,
      "totalPages": 15
    }
  }
}
```

---

## 4. Get User Followers

Retrieves a paginated list of users who are following the specific user.

**Endpoint:** `GET /api/admin/users/:id/followers`
**Authentication:** Required

### cURL Request
```bash
curl -X GET "https://glunity.onrender.com/api/admin/users/e434f8a3-.../followers?page=1&limit=10" \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "followers": [
      {
        "id": "follower-uuid-1",
        "username": "priya_shines",
        "fullName": "Priya Sharma",
        "avatar": "https://example.com/avatar2.jpg",
        "followedAt": "2023-05-12T09:12:00Z"
      }
    ],
    "pagination": {
      "total": 1500,
      "page": 1,
      "limit": 10,
      "totalPages": 150
    }
  }
}
```

---

## 5. Get User Following

Retrieves a paginated list of users that the specific user is following.

**Endpoint:** `GET /api/admin/users/:id/following`
**Authentication:** Required

### cURL Request
```bash
curl -X GET "https://glunity.onrender.com/api/admin/users/e434f8a3-.../following?page=1&limit=10" \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "following": [
      {
        "id": "following-uuid-1",
        "username": "rahul_v",
        "fullName": "Rahul Verma",
        "avatar": "https://example.com/avatar3.jpg",
        "followedAt": "2023-04-10T14:20:00Z"
      }
    ],
    "pagination": {
      "total": 300,
      "page": 1,
      "limit": 10,
      "totalPages": 30
    }
  }
}
```
