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
