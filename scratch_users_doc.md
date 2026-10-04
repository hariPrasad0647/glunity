---

## 3. Get All Users

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

## 4. Get User Details

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
