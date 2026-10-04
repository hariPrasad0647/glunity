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

### cURL Request
```bash
curl -X GET "https://glunity.onrender.com/api/admin/dashboard" \
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


---

## 3. Get User Growth Chart Data

Retrieves the day-by-day (or grouped) user registration counts for a specified time range.

**Endpoint:** `GET /api/admin/dashboard/user-growth`
**Authentication:** Required

### Query Parameters
- `timeRange` (optional): Preset ranges. Values: `7d` (default), `1m`, `3m`, `8m`, `1y`.
- `startDate` & `endDate` (optional): Custom date range (e.g. `startDate=2023-01-01&endDate=2023-12-31`). Overrides `timeRange`.

### cURL Request
```bash
curl -X GET "https://glunity.onrender.com/api/admin/dashboard/user-growth?timeRange=1m" \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example

```json
{
  "success": true,
  "data": {
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
      }
    ]
  }
}
```
# Admin Dashboard User Growth API

This document provides the reference for the dedicated User Growth chart API. Use this to fetch dynamic date ranges without reloading the entire dashboard.

---

## Get User Growth Chart Data

Retrieves the day-by-day user registration counts for a specified time range. This is designed to be fed directly into your frontend chart components.

**Endpoint:** `GET /api/admin/dashboard/user-growth`
**Authentication:** Required

### Query Parameters

You can use **either** the preset `timeRange` **or** a custom `startDate` and `endDate`.

- `timeRange` (optional): Filter the "User Growth" data array by preset ranges. Values: 
  - `7d` (default)
  - `1m` (Last 1 month)
  - `3m` (Last 3 months)
  - `8m` (Last 8 months)
  - `1y` (Last 1 year)
- `startDate` & `endDate` (optional): Filter by a custom date range (e.g. `startDate=2023-01-01&endDate=2023-12-31`). If provided, this completely overrides `timeRange`.

### cURL Request (Preset Range Example)
```bash
curl -X GET "https://glunity.onrender.com/api/admin/dashboard/user-growth?timeRange=1m" \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### cURL Request (Custom Date Range Example)
```bash
curl -X GET "https://glunity.onrender.com/api/admin/dashboard/user-growth?startDate=2026-01-01&endDate=2026-10-04" \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example

```json
{
  "success": true,
  "data": {
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
      }
    ]
  }
}
```
# Admin Analytics API Reference

This document provides the API endpoints specifically designed for the Analytics overview pages (User Growth, Engagement, and Retention).

---

## 1. User Growth (DAU, WAU, MAU)

Retrieves the Daily Active Users (DAU), Weekly Active Users (WAU), and Monthly Active Users (MAU) along with their percentage changes compared to the previous equivalent period.

**Endpoint:** `GET /api/admin/analytics/user-growth`
**Authentication:** Required

### cURL Request
```bash
curl -X GET "https://glunity.onrender.com/api/admin/analytics/user-growth" \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "dau": {
      "value": 25431,
      "percentageChange": 12.0
    },
    "wau": {
      "value": 92105,
      "percentageChange": 8.0
    },
    "mau": {
      "value": 152890,
      "percentageChange": 15.0
    }
  }
}
```

---

## 2. Content Engagement (Monthly)

Retrieves the total number of likes and comments (replies) aggregated by month over the last 12 months.

**Endpoint:** `GET /api/admin/analytics/engagement`
**Authentication:** Required

### cURL Request
```bash
curl -X GET "https://glunity.onrender.com/api/admin/analytics/engagement" \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "monthlyEngagement": [
      {
        "month": "2026-01",
        "likes": 12000,
        "comments": 45000
      },
      {
        "month": "2026-02",
        "likes": 14000,
        "comments": 52000
      }
    ]
  }
}
```

---

## 3. User Retention (Cohorts)

Retrieves simplified cohort retention data. Users are grouped by their registration month (`cohortMonth`) and their last active month (`activeMonth`).

**Endpoint:** `GET /api/admin/analytics/retention`
**Authentication:** Required

### cURL Request
```bash
curl -X GET "https://glunity.onrender.com/api/admin/analytics/retention" \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "cohorts": {
      "2026-08": {
        "total": 1500,
        "retention": {
          "2026-08": 500,
          "2026-09": 800,
          "2026-10": 200
        }
      },
      "2026-09": {
        "total": 1200,
        "retention": {
          "2026-09": 900,
          "2026-10": 300
        }
      }
    }
  }
}
```
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
        "likes": 142,
        "comments": 24,
        "reach": 1530,
        "reposts": 5,
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
