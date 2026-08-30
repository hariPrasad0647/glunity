# Glunity Profile Setup API Contract

This document outlines the APIs required for a user to set up their profile, including updating basic information, making the profile public or private, uploading a profile image, and managing interests.

All endpoints require the `Authorization: Bearer <token>` header.

---

## 1. Update Profile (Bio, Privacy, Image, etc.)

**Endpoint:** `PATCH /api/users/profile`
**Content-Type:** `multipart/form-data`
**Authorization:** Required

Updates the user's basic profile details. Since this uses `multipart/form-data`, you can send text fields alongside an image file.

### Request Payload (`FormData`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `fullName` | String | Optional | Full name of the user. Cannot be empty if provided. |
| `username` | String | Optional | 3-30 characters (letters, numbers, `_` or `.`). |
| `bio` | String | Optional | Max 160 characters. |
| `profession` | String | Optional | Max 100 characters. |
| `isPrivate` | Boolean/String | Optional | `"true"` or `"false"` to make the profile private or public. |
| `image` | File | Optional | The profile image file to upload. |

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid-string",
    "fullName": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "bio": "Software Developer",
    "profession": "Engineer",
    "isPrivate": false,
    "profileImage": "https://cdn.example.com/profile.jpg"
  }
}
```

---

## 2. Save User Interests

**Endpoint:** `POST /api/users/interests`
**Content-Type:** `application/json`
**Authorization:** Required

Sets or updates the user's interests. The user must select at least 5 interests. This replaces their previous interests.

### Request Payload

```json
{
  "interests": ["Technology", "Sports", "Music", "Art", "Travel"]
}
```

- `interests` (Array of Strings): Minimum 5 items. Each item must not exceed 50 characters.

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Interests saved successfully",
  "data": {
    "interests": [
      "Technology",
      "Sports",
      "Music",
      "Art",
      "Travel"
    ]
  }
}
```

---

## 3. Get User Interests

**Endpoint:** `GET /api/users/interests`
**Authorization:** Required

Retrieves the currently authenticated user's selected interests.

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Interests fetched successfully",
  "data": {
    "interests": [
      "Technology",
      "Sports",
      "Music",
      "Art",
      "Travel"
    ]
  }
}
```

---

## 4. Get My Profile (Initial Load)

**Endpoint:** `GET /api/users/me`
**Authorization:** Required

Fetches the current user's complete profile information, including their basic details (bio, privacy setting, profile image) along with the first page of their posts and reels.

### Query Parameters (Optional)
- `postLimit` (Number): Default `12`.
- `reelLimit` (Number): Default `12`.

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Profile fetched",
  "data": {
    "id": "uuid-string",
    "username": "johndoe",
    "fullName": "John Doe",
    "bio": "Software Developer",
    "profession": "Engineer",
    "profileImage": "https://cdn.example.com/profile.jpg",
    "isPrivate": false,
    "createdAt": "2023-10-01T12:00:00.000Z",
    "followerCount": 150,
    "followingCount": 120,
    "friendCount": 85,
    "isOwnProfile": true,
    "posts": {
      "data": [...],
      "pagination": { "currentPage": 1, "totalPages": 5, "totalItems": 60, "hasNextPage": true }
    },
    "reels": {
      "data": [...],
      "pagination": { "currentPage": 1, "totalPages": 2, "totalItems": 24, "hasNextPage": true }
    }
  }
}
```
