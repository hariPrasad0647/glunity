# Unfollowed Users API Guide

This document provides the frontend reference for fetching all users on the platform that the current user does **not** follow, sorted from the highest trust score to the lowest.

## Endpoint

**GET** `/api/users/unfollowed`

### Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | Integer | `1` | The page number for pagination. |
| `limit` | Integer | `20` | The number of users to return per page. |

---

## 1. Fetching Unfollowed Users

**cURL Example:**

```bash
curl --location --request GET 'http://localhost:3000/api/users/unfollowed?page=1&limit=20' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN'
```

**Expected JSON Response:**

```json
{
  "success": true,
  "status": 200,
  "message": "Unfollowed users fetched",
  "data": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "users": [
      {
        "id": "e4b51347-19ab-48d6-9dc4-839cc667b93a",
        "username": "crypto_king",
        "fullName": "Crypto King",
        "profileImage": "https://cdn.glunity.com/profiles/crypto_king.jpg",
        "trustScore": {
          "finalScore": 98.5,
          "tier": "PLATINUM"
        }
      },
      {
        "id": "f8a92038-23ab-41c6-9ad4-949dd778c10b",
        "username": "satoshi_fan",
        "fullName": "Satoshi Fan",
        "profileImage": "https://cdn.glunity.com/profiles/satoshi_fan.jpg",
        "trustScore": {
          "finalScore": 95.2,
          "tier": "GOLD"
        }
      }
      // ... up to 20 users
    ]
  }
}
```

### Response Object Notes

- `data.users`: An array of user objects.
  - `id`: The user's unique UUID.
  - `username`: The user's handle.
  - `fullName`: The user's display name.
  - `profileImage`: The URL for the user's avatar.
  - `trustScore`: An object containing the user's `finalScore` and trust `tier` (which drives the ranking logic under the hood).
