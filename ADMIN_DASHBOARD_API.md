# Admin Dashboard API Reference

This document outlines the backend APIs available for the Admin Dashboard to help frontend developers integrate the metrics easily.

---

## 1. Admin Authentication

### Register Admin (First-time setup)
**Endpoint:** `POST /api/admin/register`
**Description:** Use this to create the initial admin user. You may want to disable or protect this in production.

**Request Body:**
```json
{
  "name": "Super Admin",
  "email": "admin@glunity.com",
  "password": "securepassword123"
}
```

### Login Admin
**Endpoint:** `POST /api/admin/login`
**Description:** Authenticates the admin and returns a JWT token that must be used for subsequent requests.

**Request Body:**
```json
{
  "email": "admin@glunity.com",
  "password": "securepassword123"
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5...",
    "admin": {
      "id": "e434f8a3-...",
      "name": "Super Admin",
      "email": "admin@glunity.com"
    }
  }
}
```

---

## 2. Get Dashboard Statistics

Retrieves all the necessary aggregated data for the admin dashboard, including summary metrics, user growth over the last 7 days, user activity distribution, and a leaderboard of top users.

**Endpoint:** `GET /api/admin/dashboard`
**Authentication:** Required (You should pass the admin token in the headers if this route is protected)

### Query Parameters
- `timeRange` (optional): Filter the "User Growth" data array by preset ranges. Values: `7d` (default), `1m`, `3m`, `8m`, `1y`.
- `startDate` & `endDate` (optional): Filter "User Growth" by a custom date range (e.g. `startDate=2023-01-01&endDate=2023-12-31`). If provided, this overrides `timeRange`.

### cURL Request
```bash
curl -X GET "https://glunity.onrender.com/api/admin/dashboard?timeRange=1m" \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": {
        "value": 128420,
        "percentageChange": 12.8
      },
      "activeUsers": {
        "value": 42381,
        "percentageChange": 5.2
      },
      "totalPosts": {
        "value": 892430,
        "percentageChange": 18.4
      },
      "totalEngagement": {
        "value": 4200000,
        "percentageChange": 22.1
      },
      "chatMessages": {
        "value": 12400000,
        "percentageChange": 14.2
      },
      "pointsDistributed": {
        "value": 18500000,
        "percentageChange": 8.1
      },
      "reposts": {
        "value": 342100,
        "percentageChange": 12.4
      }
    },
    "userGrowth": [
      {
        "date": "2026-09-28",
        "count": 120
      },
      {
        "date": "2026-09-29",
        "count": 145
      },
      {
        "date": "2026-09-30",
        "count": 180
      },
      {
        "date": "2026-10-01",
        "count": 210
      },
      {
        "date": "2026-10-02",
        "count": 250
      },
      {
        "date": "2026-10-03",
        "count": 310
      },
      {
        "date": "2026-10-04",
        "count": 345
      }
    ],
    "userActivity": {
      "inactive": 86039,
      "new": 10500,
      "returning": 31881
    },
    "topUsers": [
      {
        "id": "e2f1...",
        "username": "arjun_k",
        "name": "Arjun Kumar",
        "avatar": "https://example.com/avatar1.jpg",
        "trustScore": 98,
        "points": 12450,
        "posts": 142
      },
      {
        "id": "a4b2...",
        "username": "priya_shines",
        "name": "Priya Sharma",
        "avatar": "https://example.com/avatar2.jpg",
        "trustScore": 85,
        "points": 8300,
        "posts": 89
      },
      {
        "id": "c7d9...",
        "username": "rahul_v",
        "name": "Rahul Verma",
        "avatar": "https://example.com/avatar3.jpg",
        "trustScore": 32,
        "points": 120,
        "posts": 12
      },
      {
        "id": "b1e3...",
        "username": "ananya_g",
        "name": "Ananya Gupta",
        "avatar": "https://example.com/avatar4.jpg",
        "trustScore": 99,
        "points": 25600,
        "posts": 340
      },
      {
        "id": "f5a8...",
        "username": "vikram_s",
        "name": "Vikram Singh",
        "avatar": null,
        "trustScore": 12,
        "points": 0,
        "posts": 0
      }
    ]
  }
}
```

### Integration Notes for Frontend

- **Stats Percentages**: The backend now calculates `percentageChange` dynamically by comparing the most recent 30-day period with the preceding 30-day period. Use this field directly on the frontend (e.g. `+${stat.percentageChange}% vs last month`).
- **Top Users Table**: 
  - `trustScore`: Maps to the "Trust" column. Color-coding (Green for >80, Red for <50, etc.) can be driven by this value.
  - `points`: Maps to the "Points" column.
  - `posts`: Maps to the "Posts" column.
- **User Activity Chart**: Use the `userActivity` object to populate your Doughnut/Pie chart.
  - `inactive`: Users with no activity in the last 30 days.
  - `new`: Users registered within the last 30 days.
  - `returning`: Users who were active in the last 30 days but registered earlier.
- **User Growth Chart**: The `userGrowth` array gives you a day-by-day count of new registrations for the past 7 days, which maps perfectly to the area chart.

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
