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
