# Follow API

Base URL: `https://glunity-fk10.onrender.com/api/users`

All endpoints below require authentication:
```
Authorization: Bearer <accessToken>
```

---

## POST `/api/users/:id/follow`

Send a follow request to a user. `:id` is the **target user's id**.

- If the target account is **public**, the follow is auto-accepted immediately.
- If the target account is **private**, this creates a `pending` request that the target must accept/reject.
- Re-following after a prior rejection re-sends the request (resets status based on current privacy setting).

**Request**
```
POST /api/users/64f1c2.../follow
```
No body required.

**Response 200**
```json
{
  "success": true,
  "message": "Follow request sent",
  "data": null
}
```

**Error cases**
| Status | Message | Cause |
|---|---|---|
| 400 | You can't follow yourself | `:id` equals the requester's own id |
| 404 | User not found | `:id` doesn't exist |
| 409 | Already following this user | Existing `accepted` relationship |
| 409 | Follow request already sent | Existing `pending` relationship |

> Note: the response message is always "Follow request sent" regardless of whether the account was public (auto-accepted) or private (pending). Frontend should call `GET /api/users/:id` afterward (or rely on the `followStatus` field from search/profile responses) to know whether it's `following` or `pending`.

---

## DELETE `/api/users/:id/follow`

Unfollow a user, or cancel a follow request you sent that's still pending. `:id` is the target user's id.

**Request**
```
DELETE /api/users/64f1c2.../follow
```

**Response 200**
```json
{
  "success": true,
  "message": "Unfollowed successfully",
  "data": null
}
```

**Error cases**
| Status | Message | Cause |
|---|---|---|
| 404 | You are not following this user | No existing follow/request row to delete |

---

## GET `/api/users/follow-requests`

Lists **incoming** pending follow requests (people who want to follow you, awaiting your decision).

**Response 200**
```json
{
  "success": true,
  "message": "Follow requests fetched",
  "data": {
    "requests": [
      { "id": "uuid", "username": "jane_doe", "fullName": "Jane Doe", "profileImage": null }
    ]
  }
}
```

Each entry is the **requester's** user info — use their `id` for the accept/reject calls below.

---

## PATCH `/api/users/follow-requests/:id/accept`

Accept a pending follow request. `:id` is the **requester's** id (the person who asked to follow you), not your own id.

**Request**
```
PATCH /api/users/follow-requests/64f1c2.../accept
```

**Response 200**
```json
{
  "success": true,
  "message": "Follow request accepted",
  "data": null
}
```

**Error cases**
| Status | Message | Cause |
|---|---|---|
| 404 | Pending follow request not found | No pending request from that user |

---

## PATCH `/api/users/follow-requests/:id/reject`

Reject (delete) a pending follow request. `:id` is the requester's id.

**Request**
```
PATCH /api/users/follow-requests/64f1c2.../reject
```

**Response 200**
```json
{
  "success": true,
  "message": "Follow request rejected",
  "data": null
}
```

**Error cases**
| Status | Message | Cause |
|---|---|---|
| 404 | Pending follow request not found | No pending request from that user |

---

## GET `/api/users/followers`

Lists your **accepted** followers (people who follow you).

**Response 200**
```json
{
  "success": true,
  "message": "Followers fetched",
  "data": {
    "followers": [
      { "id": "uuid", "username": "jane_doe", "fullName": "Jane Doe", "profileImage": null }
    ]
  }
}
```

---

## GET `/api/users/following`

Lists users **you** follow (accepted only).

**Response 200**
```json
{
  "success": true,
  "message": "Following fetched",
  "data": {
    "following": [
      { "id": "uuid", "username": "jane_doe", "fullName": "Jane Doe", "profileImage": null }
    ]
  }
}
```

---

## GET `/api/users/friends`

Lists **mutual** follows — people you follow who also follow you back ("real friends").

**Response 200**
```json
{
  "success": true,
  "message": "Friends fetched",
  "data": {
    "friends": [
      { "id": "uuid", "username": "jane_doe", "fullName": "Jane Doe", "profileImage": null }
    ]
  }
}
```

---

## GET `/api/users/suggestions`

"People you may know" — degree-based suggestions built from your follow graph.

**Response 200**
```json
{
  "success": true,
  "message": "Friend suggestions fetched",
  "data": {
    "firstDegree": [
      { "id": "uuid", "username": "jane_doe", "fullName": "Jane Doe", "profileImage": null }
    ],
    "secondDegree": [
      { "id": "uuid", "username": "sam_lee", "fullName": "Sam Lee", "profileImage": null, "mutualFriendsCount": 2 }
    ],
    "thirdDegree": [
      { "id": "uuid", "username": "alex_kim", "fullName": "Alex Kim", "profileImage": null, "mutualConnectionsCount": 1 }
    ]
  }
}
```

- **firstDegree** — people who already follow you but you haven't followed back yet.
- **secondDegree** — people your mutual friends follow (sorted by `mutualFriendsCount` desc), excluding anyone you already have any relationship with.
- **thirdDegree** — people that 2nd-degree suggestions follow (sorted by `mutualConnectionsCount` desc), excluding everyone above.

---

## GET `/api/users/search?q=<query>`

Search all users by username or full name, to find people to follow. See also `POST /api/users/:id/follow` above to act on a result.

**Query params:** `q` (required), `page` (default 1), `limit` (default 20)

**Response 200**
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
        "profileImage": null,
        "isPrivate": true,
        "followStatus": "none"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

`followStatus` — one of:
- `"none"` — show a **Follow** button
- `"pending"` — show **Requested** (request sent, awaiting accept)
- `"following"` — show **Following**

---

## Typical frontend flows

**Sending and completing a follow request (private account):**
1. `GET /api/users/search?q=...` or view a profile → get target `id` + `followStatus`.
2. `POST /api/users/:id/follow` → status becomes `pending`.
3. Target sees it via `GET /api/users/follow-requests`.
4. Target calls `PATCH /api/users/follow-requests/:requesterId/accept` (or `/reject`).
5. Once accepted, both `GET /api/users/followers` (for target) and `GET /api/users/following` (for requester) reflect the new relationship, and `followStatus` becomes `"following"`.

**Following a public account:** step 2 immediately results in `followStatus: "following"` — no accept/reject step needed.

**Canceling your own pending request or unfollowing:** `DELETE /api/users/:id/follow` in both cases.
