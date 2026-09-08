# Trust Score API Documentation

This document outlines the available endpoints for the Trust Score module. These APIs allow the frontend to fetch the authenticated user's current Trust Score details and their historical Trust Score calculations.

**Base URL**: `{{API_BASE_URL}}`

---

## 1. Get My Trust Score

Fetches the current Trust Score, Tier, Monetization Eligibility, and the detailed breakdown of the 5 component scores for the currently authenticated user.

- **Endpoint:** `GET /api/trust-score/me`
- **Auth Required:** Yes (Bearer Token)

### Request (cURL)

```bash
curl --location '{{API_BASE_URL}}/api/trust-score/me' \
--header 'Authorization: Bearer {{YOUR_ACCESS_TOKEN}}'
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Trust score fetched successfully",
    "data": {
        "score": 68,
        "tier": "GLUNITY_TRUSTED",
        "monetizationEligible": true,
        "components": {
            "onChain": 0,
            "smartFollowers": 80,
            "engagement": 60,
            "longevity": 50,
            "reports": 100
        },
        "weights": {
            "onChain": 20,
            "smartFollowers": 20,
            "engagement": 30,
            "longevity": 20,
            "reports": 10
        },
        "calculatedAt": "2026-09-08T04:20:00.000Z"
    }
}
```

---

## 2. Get My Trust Score History

Fetches the paginated history of the authenticated user's Trust Score calculations. (Calculations occur weekly).

- **Endpoint:** `GET /api/trust-score/history?page=1&limit=20`
- **Auth Required:** Yes (Bearer Token)

### Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | `integer` | `1` | The page number to fetch. |
| `limit` | `integer` | `20` | The number of records per page. |

### Request (cURL)

```bash
curl --location '{{API_BASE_URL}}/api/trust-score/history?page=1&limit=20' \
--header 'Authorization: Bearer {{YOUR_ACCESS_TOKEN}}'
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Trust score history fetched successfully",
    "data": {
        "history": [
            {
                "finalScore": 68,
                "tier": "GLUNITY_TRUSTED",
                "calculationReason": "WEEKLY",
                "calculatedAt": "2026-09-08T04:20:00.000Z"
            },
            {
                "finalScore": 65,
                "tier": "GLUNITY_TRUSTED",
                "calculationReason": "WEEKLY",
                "calculatedAt": "2026-09-01T04:20:00.000Z"
            }
        ],
        "total": 2,
        "page": 1,
        "limit": 20
    }
}
```

---

## 3. Public Profile Integration

The Trust Score has been natively integrated into the existing user profile endpoints. When fetching any user's profile, their public `trustScore` and `trustTier` are now returned.

- **Affected Endpoints:**
  - `GET /api/users/me`
  - `GET /api/users/:id`

### Example Profile Response Snippet

```json
{
    "success": true,
    "message": "Profile fetched",
    "data": {
        "id": "uuid-...",
        "username": "johndoe",
        "fullName": "John Doe",
        "postCount": 15,
        "followerCount": 100,
        "followingCount": 50,
        "trustScore": 68,
        "trustTier": "GLUNITY_TRUSTED",
        ...
    }
}
```

---

## Trust Score Tiers Reference

For frontend rendering logic, these are the exact tiers mapped to their score ranges:

| Score Range | Tier Name | Monetization Eligible? |
| :--- | :--- | :--- |
| **0 – 29** | `UNVERIFIED` | ❌ No |
| **30 – 49** | `EMERGING` | ❌ No |
| **50 – 64** | `RESONANT VOICE` | ❌ No |
| **65 – 74** | `GLUNITY TRUSTED` | ✅ Yes |
| **75 – 89** | `GLUNITY SENTINEL` | ✅ Yes |
| **90 – 100** | `GLUNITY ELITE` | ✅ Yes |
