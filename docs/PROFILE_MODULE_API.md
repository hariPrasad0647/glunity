# User Profile Module — Frontend API Reference

> **Base URL**: `{{API_BASE}}/api/users`
> All endpoints require `Authorization: Bearer <token>` unless noted otherwise.
> All file uploads use `multipart/form-data`. All other requests use `application/json`.

---

## Table of Contents

1. [Update Profile](#1-update-profile)
2. [Get My Profile](#2-get-my-profile)
3. [Get My Posts](#3-get-my-posts)
4. [Get My Reels](#4-get-my-reels)
5. [Get Public User Profile](#5-get-public-user-profile)
6. [Get User Posts](#6-get-user-posts)
7. [Get User Reels](#7-get-user-reels)
8. [Search Users](#8-search-users)
9. [Follow a User](#9-follow-a-user)
10. [Unfollow a User](#10-unfollow-a-user)
11. [Get Follow Requests](#11-get-follow-requests)
12. [Accept Follow Request](#12-accept-follow-request)
13. [Reject Follow Request](#13-reject-follow-request)
14. [Get My Followers](#14-get-my-followers)
15. [Get My Following](#15-get-my-following)
16. [Get User Followers](#16-get-user-followers)
17. [Get User Following](#17-get-user-following)
18. [Get Friends (Mutual Follows)](#18-get-friends-mutual-follows)
19. [Get Friend Suggestions](#19-get-friend-suggestions)
20. [Save Interests](#20-save-interests)
21. [Get Interests](#21-get-interests)
22. [Get Saved Posts](#22-get-saved-posts)
23. [Get Saved Reels](#23-get-saved-reels)
24. [Get Liked Posts](#24-get-liked-posts)
25. [Get Liked Reels](#25-get-liked-reels)
26. [Get My Comments](#26-get-my-comments)
27. [Profile Banner Notes](#27-profile-banner-notes)
28. [Shared Object Shapes](#28-shared-object-shapes)

---

## 1. Update Profile

Update the authenticated user's profile. Supports text fields, profile avatar, and/or a profile banner (image or video).

**`PATCH /api/users/profile`**
**Content-Type**: `multipart/form-data`

### Form Fields

| Field | Type | Required | Constraints |
|---|---|---|---|
| `fullName` | text | No | Non-empty string |
| `username` | text | No | 3–30 chars, `a-z A-Z 0-9 _ .` only |
| `bio` | text | No | Max 160 characters |
| `profession` | text | No | Max 100 characters |
| `isPrivate` | text (`"true"` / `"false"`) | No | Boolean |
| `profileImage` | file (image) | No | jpg, jpeg, png, webp — max **5 MB** |
| `banner` | file (image **or** video) | No | jpg, jpeg, png, webp, mp4, mov, avi, webm, mkv — max **50 MB** — video must be **≤ 15 seconds** (enforced client-side) |

> Only send the fields you want to change. All fields are optional.
> `bannerImage` and `bannerVideo` in the response are mutually exclusive — only one will be non-null.

### Success Response `200`

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "fullName": "Jane Doe",
    "username": "jane_doe",
    "email": "jane@example.com",
    "phone": "+919876543210",
    "bio": "Hello world",
    "profession": "Designer",
    "isPrivate": false,
    "profileImage": "https://cdn.example.net/profile-images/uuid_1234.jpg",
    "bannerImage": "https://cdn.example.net/profile-banners/images/uuid_1234.jpg",
    "bannerVideo": null
  }
}
```

### Error Responses

| Status | Reason |
|---|---|
| `400` | Validation error (e.g. username format invalid) |
| `409` | Username already taken |
| `413` | File too large |
| `500` | CDN upload failed |

---

## 2. Get My Profile

Returns the authenticated user's profile with first-page posts and reels in one call.

**`GET /api/users/me`**

### Query Parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `postLimit` | number | `12` | Posts to return |
| `reelLimit` | number | `12` | Reels to return |

### Success Response `200`

```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "uuid",
    "username": "jane_doe",
    "fullName": "Jane Doe",
    "bio": "Hello world",
    "profession": "Designer",
    "profileImage": "https://cdn.example.net/...",
    "bannerImage": "https://cdn.example.net/profile-banners/images/...",
    "bannerVideo": null,
    "isPrivate": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "postCount": 10,
    "reelCount": 5,
    "followerCount": 200,
    "followingCount": 150,
    "followStatus": null,
    "isOwnProfile": true,
    "posts": {
      "items": [],
      "total": 10,
      "page": 1,
      "limit": 12
    },
    "reels": {
      "items": [],
      "total": 5,
      "page": 1,
      "limit": 12
    }
  }
}
```

---

## 3. Get My Posts

Paginated list of the authenticated user's posts.

**`GET /api/users/me/posts`**

### Query Parameters

| Param | Type | Default |
|---|---|---|
| `page` | number | `1` |
| `limit` | number | `12` |

### Success Response `200`

```json
{
  "success": true,
  "message": "Posts fetched",
  "data": {
    "canView": true,
    "posts": [],
    "total": 10,
    "page": 1,
    "limit": 12
  }
}
```

---

## 4. Get My Reels

Paginated list of the authenticated user's reels.

**`GET /api/users/me/reels`**

### Query Parameters

| Param | Type | Default |
|---|---|---|
| `page` | number | `1` |
| `limit` | number | `12` |

### Success Response `200`

```json
{
  "success": true,
  "message": "Reels fetched",
  "data": {
    "canView": true,
    "reels": [],
    "total": 5,
    "page": 1,
    "limit": 12
  }
}
```

---

## 5. Get Public User Profile

Fetch another user's profile. Includes counts and follow status from the viewer's perspective.

**`GET /api/users/:id`**

| Param | Description |
|---|---|
| `id` | UUID of the target user |

### Success Response `200`

```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "uuid",
    "username": "other_user",
    "fullName": "Other User",
    "bio": "...",
    "profession": "...",
    "profileImage": "https://cdn.example.net/...",
    "bannerImage": null,
    "bannerVideo": "https://cdn.example.net/profile-banners/videos/uuid.mp4",
    "isPrivate": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "postCount": 3,
    "reelCount": 1,
    "followerCount": 50,
    "followingCount": 40,
    "followStatus": "pending",
    "isOwnProfile": false
  }
}
```

### `followStatus` values

| Value | Meaning |
|---|---|
| `"none"` | Not following |
| `"pending"` | Follow request sent, awaiting approval |
| `"following"` | Actively following |
| `null` | Own profile |

### Error Responses

| Status | Reason |
|---|---|
| `404` | User not found |

---

## 6. Get User Posts

Paginated posts for a specific user. Returns `canView: false` if the account is private and the viewer is not a follower.

**`GET /api/users/:id/posts`**

### Query Parameters

| Param | Type | Default |
|---|---|---|
| `page` | number | `1` |
| `limit` | number | `12` |

### Success Response `200`

```json
{
  "success": true,
  "message": "Posts fetched",
  "data": {
    "canView": true,
    "posts": [],
    "total": 3,
    "page": 1,
    "limit": 12
  }
}
```

> Returns `403` when `canView` is `false` (private account).

---

## 7. Get User Reels

**`GET /api/users/:id/reels`**

Same structure as [Get User Posts](#6-get-user-posts) but returns a `reels` array.

---

## 8. Search Users

Search by username or full name.

**`GET /api/users/search?q=<query>`**

### Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | **Yes** | Search term |
| `page` | number | No | Default `1` |
| `limit` | number | No | Default `20` |

### Success Response `200`

```json
{
  "success": true,
  "message": "Search results fetched",
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "jane_doe",
        "fullName": "Jane Doe",
        "profileImage": "https://cdn.example.net/...",
        "isPrivate": false,
        "followStatus": "none"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

## 9. Follow a User

Sends a follow request. Auto-accepted for public accounts; pending for private accounts.

**`POST /api/users/:id/follow`**

### Success Response `200`

```json
{ "success": true, "message": "Follow request sent" }
```

### Error Responses

| Status | Reason |
|---|---|
| `400` | Trying to follow yourself |
| `404` | User not found |
| `409` | Already following / request already sent |

---

## 10. Unfollow a User

**`DELETE /api/users/:id/follow`**

### Success Response `200`

```json
{ "success": true, "message": "Unfollowed successfully" }
```

---

## 11. Get Follow Requests

Returns incoming **pending** follow requests for the authenticated user.

**`GET /api/users/follow-requests`**

### Success Response `200`

```json
{
  "success": true,
  "message": "Follow requests fetched",
  "data": {
    "requests": [
      {
        "id": "uuid",
        "username": "requester",
        "fullName": "Requester Name",
        "profileImage": "https://cdn.example.net/..."
      }
    ]
  }
}
```

---

## 12. Accept Follow Request

**`PATCH /api/users/follow-requests/:id/accept`**

| Param | Description |
|---|---|
| `id` | UUID of the user whose request to accept |

### Success Response `200`

```json
{ "success": true, "message": "Follow request accepted" }
```

---

## 13. Reject Follow Request

**`PATCH /api/users/follow-requests/:id/reject`**

| Param | Description |
|---|---|
| `id` | UUID of the user whose request to reject |

### Success Response `200`

```json
{ "success": true, "message": "Follow request rejected" }
```

---

## 14. Get My Followers

**`GET /api/users/followers`**

### Success Response `200`

```json
{
  "success": true,
  "message": "Followers fetched",
  "data": {
    "followers": [
      { "id": "uuid", "username": "...", "fullName": "...", "profileImage": "..." }
    ]
  }
}
```

---

## 15. Get My Following

**`GET /api/users/following`**

Same structure as [Get My Followers](#14-get-my-followers) but returns a `following` array.

---

## 16. Get User Followers

Returns followers of any user (respects private account rules).

**`GET /api/users/:id/followers`**

### Success Response `200`

```json
{
  "success": true,
  "message": "Followers fetched",
  "data": {
    "canView": true,
    "followers": [
      { "id": "uuid", "username": "...", "fullName": "...", "profileImage": "..." }
    ]
  }
}
```

> Returns `403` if the account is private and the viewer doesn't follow.

---

## 17. Get User Following

**`GET /api/users/:id/following`**

Same structure as [Get User Followers](#16-get-user-followers) but returns a `following` array.

---

## 18. Get Friends (Mutual Follows)

Returns users who both follow the viewer **and** are followed back.

**`GET /api/users/friends`**

### Success Response `200`

```json
{
  "success": true,
  "message": "Friends fetched",
  "data": {
    "friends": [
      { "id": "uuid", "username": "...", "fullName": "...", "profileImage": "..." }
    ]
  }
}
```

---

## 19. Get Friend Suggestions

Returns tiered people-you-may-know suggestions.

**`GET /api/users/suggestions`**

### Success Response `200`

```json
{
  "success": true,
  "message": "Friend suggestions fetched",
  "data": {
    "firstDegree": [
      { "id": "uuid", "username": "...", "fullName": "...", "profileImage": "..." }
    ],
    "secondDegree": [
      {
        "id": "uuid", "username": "...", "fullName": "...",
        "profileImage": "...", "mutualFriendsCount": 3
      }
    ],
    "thirdDegree": [
      {
        "id": "uuid", "username": "...", "fullName": "...",
        "profileImage": "...", "mutualConnectionsCount": 1
      }
    ]
  }
}
```

| Tier | Who they are |
|---|---|
| `firstDegree` | Users who follow you but you haven't followed back |
| `secondDegree` | Friends-of-friends (with mutual count) |
| `thirdDegree` | Extended network connections |

---

## 20. Save Interests

Replaces the user's interest list entirely (minimum 5).

**`POST /api/users/interests`**

### Request Body

```json
{ "interests": ["Music", "Gaming", "Travel", "Art", "Food"] }
```

### Success Response `200`

```json
{
  "success": true,
  "message": "Interests saved successfully",
  "data": { "interests": ["Music", "Gaming", "Travel", "Art", "Food"] }
}
```

---

## 21. Get Interests

**`GET /api/users/interests`**

### Success Response `200`

```json
{
  "success": true,
  "message": "Interests fetched successfully",
  "data": { "interests": ["Music", "Gaming", "Travel", "Art", "Food"] }
}
```

---

## 22. Get Saved Posts

**`GET /api/users/saved/posts`**

### Success Response `200`

```json
{
  "success": true,
  "message": "Saved posts fetched",
  "data": { "posts": [] }
}
```

---

## 23. Get Saved Reels

**`GET /api/users/saved/reels`**

### Success Response `200`

```json
{
  "success": true,
  "message": "Saved reels fetched",
  "data": { "reels": [] }
}
```

---

## 24. Get Liked Posts

**`GET /api/users/me/liked/posts`**

### Query Parameters

| Param | Type | Default |
|---|---|---|
| `page` | number | `1` |
| `limit` | number | `12` |

### Success Response `200`

```json
{
  "success": true,
  "message": "Liked posts fetched",
  "data": { "posts": [] }
}
```

---

## 25. Get Liked Reels

**`GET /api/users/me/liked/reels`**

### Query Parameters

| Param | Type | Default |
|---|---|---|
| `page` | number | `1` |
| `limit` | number | `12` |

### Success Response `200`

```json
{
  "success": true,
  "message": "Liked reels fetched",
  "data": { "reels": [] }
}
```

---

## 26. Get My Comments

**`GET /api/users/me/comments`**

### Query Parameters

| Param | Type | Default |
|---|---|---|
| `page` | number | `1` |
| `limit` | number | `20` |

### Success Response `200`

```json
{
  "success": true,
  "message": "Comments fetched",
  "data": {
    "comments": [],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

---

## 27. Profile Banner Notes

### Behaviour
- A user can have **either** a `bannerImage` **or** a `bannerVideo`, never both simultaneously.
- Uploading a new banner **automatically deletes** the previous one from the CDN.
- Both fields are `null` until a banner is set.

### Client-side validation checklist (video)
Before sending a video banner, validate on the client:

```
✅ Duration  ≤ 15 seconds
✅ Extension: mp4 | mov | avi | webm | mkv
✅ File size < 50 MB
```

### Recommended display dimensions

| Context | Aspect ratio | Example size |
|---|---|---|
| Mobile | 3 : 1 | 1080 × 360 px |
| Tablet / Desktop | 4 : 1 | 1500 × 375 px |

### CDN path structure

| Type | CDN Path |
|---|---|
| Banner image | `profile-banners/images/<userId>_<timestamp>.<ext>` |
| Banner video | `profile-banners/videos/<userId>_<timestamp>.<ext>` |

---

## 28. Shared Object Shapes

### Post Object

```json
{
  "type": "post",
  "id": "uuid",
  "content": "Caption text",
  "isPrivate": false,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "author": {
    "id": "uuid",
    "username": "jane_doe",
    "fullName": "Jane Doe",
    "profileImage": "https://cdn.example.net/..."
  },
  "media": ["https://cdn.example.net/posts/img1.jpg"],
  "hashtags": ["travel", "sunset"],
  "mentions": [
    { "id": "uuid", "username": "friend", "profileImage": "https://cdn.example.net/..." }
  ],
  "likeCount": 42,
  "saveCount": 5,
  "shareCount": 2,
  "commentCount": 8,
  "hasLiked": false,
  "hasSaved": true
}
```

### Reel Object

```json
{
  "type": "reel",
  "id": "uuid",
  "videoUrl": "https://cdn.example.net/reels/videos/uuid.mp4",
  "thumbnailUrl": "https://cdn.example.net/reels/thumbnails/uuid.jpg",
  "caption": "Caption text",
  "isPrivate": false,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "author": {
    "id": "uuid",
    "username": "jane_doe",
    "fullName": "Jane Doe",
    "profileImage": "https://cdn.example.net/..."
  },
  "hashtags": ["dance"],
  "mentions": [],
  "likeCount": 100,
  "saveCount": 20,
  "shareCount": 10,
  "commentCount": 15,
  "hasLiked": true,
  "hasSaved": false
}
```

### User Stub (used in followers / following / suggestions)

```json
{
  "id": "uuid",
  "username": "jane_doe",
  "fullName": "Jane Doe",
  "profileImage": "https://cdn.example.net/..."
}
```

---

*Last updated: 2026-09-06*
