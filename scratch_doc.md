---

## 3. Get User Posts

Retrieves a paginated list of posts created by a specific user, including their captions and media URLs (images/videos).

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
        "caption": "Enjoying the sunset! #vibes",
        "isPrivate": 0,
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
