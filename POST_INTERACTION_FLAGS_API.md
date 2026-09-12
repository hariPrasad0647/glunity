# Post & Reel Interaction API Update

This document outlines the updated API payloads regarding interaction flags (reposting, commenting, and bookmarking) based on the frontend's requirements.

## 1. Updated Feed & Single Post/Reel Payload

All `Post` and `Reel` objects returned by the backend (whether in feeds, profiles, or when fetching a single item) will now include `hasReposted` and `hasCommented` flags. 

Additionally, we have standardized the save properties to `bookmarkCount` and `hasBookmarked` to match the frontend `PostCard` expectations. `shareCount` has also been updated to `repostCount` to stay consistent.

### Standardized Payload Example
```json
{
  "type": "post", // or "reel"
  "id": "uuid",
  // ... other post fields (content, media, author, etc.)
  "likeCount": 10,
  "bookmarkCount": 2, // was saveCount
  "repostCount": 5,   // was shareCount
  "commentCount": 3,
  "viewCount": 1500,

  // User interaction state (Booleans)
  "hasLiked": false,
  "hasBookmarked": false, // was hasSaved
  "hasReposted": true,    // NEW: User has reposted this
  "hasCommented": false   // NEW: User has replied/commented on this
}
```

---

## 2. Updated Repost Mutation (Toggle)

The repost endpoint is now a toggle (like bookmark and like). If a user hits it again, it will undo the repost. It now returns the boolean state of the repost alongside the new count.

**Endpoint:** `POST /api/posts/:id/repost` (and `POST /api/reels/:id/repost`)
**Auth Required:** Yes (Bearer Token)

### cURL Example
```bash
curl -X POST http://localhost:5000/api/posts/POST_ID_HERE/repost \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Reel reposted to your followers", // or "Reel unreposted"
  "data": {
    "reposted": true, // Boolean: True if reposted, False if undone
    "repostCount": 6
  }
}
```

### Next Steps for Frontend:
1. Update `PostCard` to use `hasBookmarked` and `bookmarkCount` directly.
2. Add support for `hasReposted` to highlight the repost button.
3. Update the repost mutation cache logic to use `data.reposted` and `data.repostCount` from the mutation response.
