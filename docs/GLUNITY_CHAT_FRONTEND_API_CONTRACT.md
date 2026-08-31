# Glunity Chat & Messaging API Contract (Frontend Reference)

This document is a comprehensive analysis of the CURRENT actual backend implementation for the Glunity chat and direct messaging module. **It contains no assumed behavior**, only factual representation of what exists in the repository.

---

## 1. COMPLETE CHAT ROUTE INVENTORY

| Feature | Method | Endpoint / Event | Auth | Status |
|---|---|---|---|---|
| Send Message (REST) | `POST` | `/api/chat/send` | JWT | SUPPORTED |
| Upload Media | `POST` | `/api/chat/upload` | JWT | SUPPORTED |
| Get Conversations | `GET` | `/api/chat/conversations` | JWT | SUPPORTED |
| Search Chat/Friends | `GET` | `/api/chat/search?q=` | JWT | SUPPORTED |
| Get Message History | `GET` | `/api/chat/conversations/:conversationId/messages` | JWT | SUPPORTED |
| Delete Message | `DELETE` | `/api/chat/messages/:messageId` | JWT | SUPPORTED |
| Socket Connect | `WS` | `/?token=` | JWT | SUPPORTED |
| Send Message (WS) | Event | `chat:send` | WS | SUPPORTED |
| Receive Message | Event | `chat:message` | WS | SUPPORTED |
| Typing Indicator | Event | `chat:typing` | WS | SUPPORTED |
| Stop Typing | Event | `chat:stop_typing` | WS | SUPPORTED |
| Mark Read | Event | `chat:read` | WS | SUPPORTED |

---

## 2. CHAT / CONVERSATION MODEL

The database structure relies on four primary models:

1. **`Conversation`**
   - `id`: UUID (Primary Key)
   - Timestamps: `createdAt`, `updatedAt`

2. **`ConversationParticipant`**
   - `id`: UUID (Primary Key)
   - `conversationId`: UUID (FK)
   - `userId`: UUID (FK)
   - `lastReadAt`: Date
   - Indexes: Unique constraint on `[conversationId, userId]`

3. **`Message`**
   - `id`: UUID (Primary Key)
   - `conversationId`: UUID (FK)
   - `senderId`: UUID (FK)
   - `content`: Text
   - `messageType`: Enum (`text`, `story_reaction`)
   - `storyId`: UUID (nullable)
   - `reactionEmoji`: String (nullable)
   - `isDeleted`: Boolean (default: `false`) (Soft Delete)
   - Timestamps: `createdAt`, `updatedAt`
   - *Note: There are no explicit `isRead` or `isDelivered` fields on the message itself.*

4. **`MessageMedia`**
   - `id`: UUID (Primary Key)
   - `messageId`: UUID (FK)
   - `mediaUrl`: String
   - `mediaType`: Enum (`image`, `video`)
   - `thumbnailUrl`: String (nullable)

---

## 3. CREATE / START CONVERSATION

There is no dedicated endpoint to "just create" an empty conversation. 

Conversations are created dynamically when the first message is sent, via either `POST /api/chat/send` or the `chat:send` socket event. The backend method `findOrCreateConversation` automatically resolves the 1-on-1 conversation ID between the sender and recipient. If it exists, it is reused.

---

## 4. CONVERSATION LIST / INBOX

**Endpoint:** `GET /api/chat/conversations`
- **Method:** GET
- **Auth:** Required (Bearer Token)
- **Pagination:** NOT IMPLEMENTED (Returns all conversations)
- **Sorting:** Sorted internally by `lastMessage.createdAt` DESC
- **Unread Count:** NOT IMPLEMENTED (Frontend must compute it using `lastReadAt` and `lastMessage.createdAt`)
- **Response Structure:**
  ```json
  {
    "status": "success",
    "message": "Conversations fetched",
    "data": [
      {
        "conversationId": "uuid",
        "otherUser": {
          "id": "uuid",
          "username": "string",
          "profileImage": "url",
          "fullName": "string"
        },
        "lastMessage": {
          "id": "uuid",
          "content": "string",
          "isDeleted": false,
          "createdAt": "date",
          "media": []
        },
        "lastReadAt": "date"
      }
    ]
  }
  ```
  *(Note: If `lastMessage.isDeleted` is true, the `content` is sent as `null` and `media` as `[]`)*

---

## 5. SINGLE CONVERSATION

**Endpoint:** `GET /api/chat/conversations/:conversationId/messages`
- There is no endpoint to fetch just the "Conversation" object. You fetch the *messages* for that conversation. The backend validates if the authenticated user is a participant of the conversation.

---

## 6. SEND MESSAGE

Messages can be sent via REST or WebSocket.

**A. REST API**
- **Endpoint:** `POST /api/chat/send`
- **Content-Type:** `multipart/form-data` or `application/json`
- **Body / FormData Fields:**
  - `recipientId` (UUID, Required)
  - `content` (String, Optional, Max 5000 chars)
  - `image`/`video` file upload (if using multipart, via `req.chatUpload`)
- **Validation:** Must have text or a file.
- **Success (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Message sent",
    "data": {
      "conversationId": "uuid",
      "message": { /* canonical message object */ }
    }
  }
  ```

**B. WebSocket (Recommended)**
- **Event:** `chat:send`
- **Payload:**
  ```json
  {
    "recipientId": "uuid",
    "content": "string",
    "media": [
       { "mediaUrl": "string", "mediaType": "image", "thumbnailUrl": "string" }
    ]
  }
  ```

---

## 7. MESSAGE RESPONSE (Canonical)

The message object structure returned by endpoints and socket events:

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "content": "Hello world",
  "messageType": "text",
  "storyId": null,
  "reactionEmoji": null,
  "isDeleted": false,
  "createdAt": "2023-10-01T12:00:00.000Z",
  "updatedAt": "2023-10-01T12:00:00.000Z",
  "sender": {
    "id": "uuid",
    "username": "user123",
    "profileImage": "url"
  },
  "media": [
    {
      "id": "uuid",
      "mediaUrl": "url",
      "mediaType": "image",
      "thumbnailUrl": null
    }
  ],
  "story": null
}
```

*Note: If `messageType` is `story_reaction`, the `story` object will be populated with media details.*

---

## 8. MESSAGE HISTORY

**Endpoint:** `GET /api/chat/conversations/:conversationId/messages`
- **Method:** GET
- **Pagination:** Cursor-based via `before` query parameter.
- **Query Params:**
  - `limit`: Number (default 30, max 100)
  - `before`: ISO 8601 Date (fetches messages older than this date)
- **Ordering Behavior:** Returns oldest → newest within the batch for easier frontend rendering (e.g., standard mapping in a FlatList). The database fetches the most recent messages prior to the `before` cursor and reverses them before sending.

---

## 9. READ / SEEN STATUS

- **Endpoint:** NONE
- **Realtime Event:** `chat:read`
- **Behavior:** The frontend must emit `chat:read` with `{ "conversationId": "uuid", "senderId": "uuid" }`. This updates the `lastReadAt` timestamp in the database for the current user and broadcasts a `chat:read` event to the `senderId`.
- **Read Receipts:** Yes, supported via realtime event.

---

## 10. DELIVERED STATUS

**NOT IMPLEMENTED.**
The backend does not track `deliveredAt` or emit delivery receipts.

---

## 11. TYPING INDICATOR

- **Realtime implementation only.**
- **Start Typing Emit:** `chat:typing` payload: `{ "recipientId": "uuid" }`
- **Stop Typing Emit:** `chat:stop_typing` payload: `{ "recipientId": "uuid" }`
- **Receive Event:** Pushes to the recipient as `{ "senderId": "uuid" }`

---

## 12. REALTIME MESSAGING

**Implemented via Socket.IO.**
- **Connection URL:** Base backend URL
- **Authentication:** `socket.handshake.auth.token` must contain the JWT.
- **Channel Routing:** Handled server-side. Users automatically join a private room matching their `userId` upon connection.
- **Disconnection/Reconnection:** Normal Socket.IO behavior.
- **Authorization:** Token is verified on handshake.

---

## 13. CHAT EVENTS (Socket.IO)

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `chat:send` | Client → Server | `{ recipientId, content, media[] }` | Send a new message |
| `chat:message` | Server → Client | `{ conversationId, message }` | Received a new message |
| `chat:typing` | Bidirectional | `{ recipientId }` (Up), `{ senderId }` (Down) | User started typing |
| `chat:stop_typing` | Bidirectional | `{ recipientId }` (Up), `{ senderId }` (Down) | User stopped typing |
| `chat:read` | Bidirectional | `{ conversationId, senderId }` (Up), `{ conversationId, readBy }` (Down) | Marks messages as read |
| `chat:error` | Server → Client | `{ message }` | Encountered an error |

---

## 14. MESSAGE DELETION

- **Endpoint:** `DELETE /api/chat/messages/:messageId`
- **Behavior:** Soft deletes the message (`isDeleted = true`).
- **Authorization:** Only the sender can delete their own message.
- **Realtime Event:** **NOT IMPLEMENTED.** (The frontend will not automatically know a message was deleted without refreshing).

---

## 15. MESSAGE EDITING

**NOT IMPLEMENTED.**

---

## 16. CONVERSATION DELETE / ARCHIVE

**NOT IMPLEMENTED.**

---

## 17. BLOCKING AND MESSAGING

**NOT IMPLEMENTED.** 
The chat permission logic (`canMessageUser`) completely ignores the `Block` model. Currently, blocked users can still message each other if they meet the privacy/follow requirements.

---

## 18. UNFOLLOWING AND MESSAGING

- **Public Users:** Can be messaged regardless of follow status.
- **Private Users:** Require a **mutual follow status** (accepted both ways). If two private users unfollow each other, any attempt to send a new message will result in a `403 Forbidden`. The existing conversation history is retained.

---

## 19. MESSAGE PERMISSION RULES

| Scenario | Can Send Message? | Backend Rule | Endpoint Result |
|---|---|---|---|
| Mutual followers | Yes | `senderFollows && recipientFollows` (if private) | 201 Created |
| Public target, not following | Yes | `!recipient.isPrivate` is true | 201 Created |
| Private target, not following | No | Mutual follow required | 403 Forbidden |
| Follower → private user | No | Mutual follow required | 403 Forbidden |
| Non-follower → private user | No | Mutual follow required | 403 Forbidden |
| Blocked user | **Yes** | No block check implemented | 201 Created |
| Self | **Yes** | No self-messaging prevention | 201 Created |

### Intended Glunity Messaging Policy

- Mutual followers can chat -> **MATCHES**
- Public profiles can be messaged -> **MATCHES**
- Private profiles follow privacy rules -> **MATCHES**
- **BACKEND GAP:** Missing block validation.

---

## 20. MESSAGE REQUESTS

**NOT IMPLEMENTED.** 
There is no pending/request inbox. Messages are either allowed or strictly forbidden.

---

## 21. USER SEARCH / NEW CHAT

**Endpoint:** `GET /api/chat/search?q=...`
- Searches through existing conversations and mutual friends (users following the current user & accepted mutually).
- **Pagination:** NOT IMPLEMENTED.
- **Response:**
  ```json
  {
    "data": {
      "conversations": [ /* existing conversations matching query */ ],
      "friends": [ 
        { "id": "uuid", "username": "str", "fullName": "str", "conversationId": "uuid (if exists)" }
      ]
    }
  }
  ```

---

## 22. USER PROFILE → MESSAGE

The profile endpoint (`GET /api/users/:id`) returns `isPrivate`, `followStatus`, and `isMutual`. It **does not** return a definitive `canMessage` boolean.

**Frontend computation required:**
```javascript
const canMessage = !profile.isPrivate || profile.isMutual;
```

---

## 23. ATTACHMENTS / MEDIA

- **Upload Endpoint:** `POST /api/chat/upload`
- **Method:** `multipart/form-data`
- **Usage:** Used to upload a file *before* sending the message over WebSocket. It returns the uploaded file object, which the frontend then passes in the `media` array of the `chat:send` socket event.

---

## 24. UNREAD COUNTS

- **Per-conversation:** NOT EXPLICITLY RETURNED.
- **Global:** NOT IMPLEMENTED.
- **Frontend computation:** Frontend must evaluate `conversation.lastReadAt < conversation.lastMessage.createdAt` to determine unread status.

---

## 25. NOTIFICATIONS

**NOT IMPLEMENTED.** 
There is no integration with the notification service or push notifications when a message is sent.

---

## 26. PAGINATION

- **Conversation List:** None
- **Message History:** Cursor-based (`before` ISO string).
- **User Search:** None

---

## 27. ERROR CONTRACT

| Status | Meaning | Typical Usage |
|---|---|---|
| `400` | Bad Request | Missing recipientId or content |
| `401` | Unauthorized | Missing or invalid JWT |
| `403` | Forbidden | Attempting to message a private user without mutual follow, or accessing a conversation you don't belong to. |
| `404` | Not Found | Recipient user not found. |

---

## 28. AUTHENTICATION

All endpoints are protected by standard JWT Bearer authentication. Socket connections require the JWT passed in `socket.handshake.auth.token`.

---

## 29. SECURITY

- **Participant Authorization:** Implemented. Users cannot view messages of conversations they do not belong to.
- **Send Authorization:** Implemented. Checks privacy and follow rules via `canMessageUser`.
- **Blocked-user enforcement:** **MISSING.**

---

## 30. RATE LIMITING

**NOT IMPLEMENTED.** The `apiLimiter` is commented out in `app.js`.

---

## 31. FRONTEND INTEGRATION RECOMMENDATIONS

- **RECOMMENDATION:** Rely heavily on Socket.IO for sending (`chat:send`) and receiving (`chat:message`), as this handles real-time delivery efficiently.
- **RECOMMENDATION:** Use REST for fetching historical messages (`/api/chat/conversations/:id/messages`) for infinite scrolling.
- **RECOMMENDATION:** Implement optimistic UI updates when emitting `chat:send`. If a `chat:error` is received, roll back the optimistic message.
- **RECOMMENDATION:** Since `chat:read` updates read status but global unread count isn't natively provided, maintain a local cache/state of unread conversations.
- **RECOMMENDATION:** Do not rely on server-side message deletion events in real-time. If a user deletes a message, it will only reflect on the other client's screen upon a hard refresh.

---

## 32. FRONTEND FEATURE MATRIX

| Feature | Backend Status | Method | Endpoint/Event | Frontend Ready |
|---|---|---|---|---|
| Conversation list | SUPPORTED | REST | `GET /conversations` | Yes (No Pagination) |
| Start conversation | SUPPORTED | WS/REST | `chat:send` / `POST /send` | Yes |
| Message history | SUPPORTED | REST | `GET /conversations/:id/messages` | Yes (Cursor `before`) |
| Send text | SUPPORTED | WS/REST | `chat:send` / `POST /send` | Yes |
| Send image/video | SUPPORTED | WS/REST | `POST /upload` -> `chat:send` | Yes |
| Read status | SUPPORTED | WS | `chat:read` | Yes |
| Delivered status | NOT IMPLEMENTED | - | - | No |
| Typing indicator | SUPPORTED | WS | `chat:typing` | Yes |
| Realtime messages | SUPPORTED | WS | `chat:message` | Yes |
| Delete message | PARTIAL | REST | `DELETE /messages/:id` | No real-time broadcast |
| Edit message | NOT IMPLEMENTED | - | - | No |
| Delete conversation | NOT IMPLEMENTED | - | - | No |
| Block messaging | NOT IMPLEMENTED | - | - | No (Security gap) |
| Message requests | NOT IMPLEMENTED | - | - | No |
| Unread count | PARTIAL | REST | (Computed via `lastReadAt`) | Client-side computation |
| User search | SUPPORTED | REST | `GET /search` | Yes |

---

## 33. CHAT UX DATA REQUIREMENTS

**Frontend logic required to compensate for backend limitations:**
- **Unread Status:** Check `!isSender && lastMessage.createdAt > lastReadAt`.
- **Message Perms:** Check `!isPrivate || isMutualFollower` directly in the Profile Screen logic.

---

## 34. BACKEND GAPS FOR GLUNITY MESSAGING

**Missing Features:**
- **Blocking Validation:** A critical gap. Users can message people who blocked them (or whom they blocked) if privacy rules permit.
- **Message Requests:** The intended product behavior might require an inbox for non-followers to send requests to private accounts. This does not exist.
- **Real-time Deletions:** Deleting a message does not notify the other participant in real-time.
- **Push Notifications:** Chat pushes (FCM/APNs) are not wired up.
- **Delivered Receipts:** Only read receipts exist.
- **Pagination for Conversations:** Missing.

---

## 35. SOURCE FILES INSPECTED

- `modules/chat/routes/chat.routes.js`
- `modules/chat/controllers/chat.controller.js`
- `modules/chat/services/chat.service.js`
- `modules/chat/socket/chat.socket.js`
- `modules/chat/validators/chat.validator.js`
- `modules/chat/models/conversation.model.js`
- `modules/chat/models/conversationParticipant.model.js`
- `modules/chat/models/message.model.js`
- `modules/chat/models/messageMedia.model.js`
- `app.js`
