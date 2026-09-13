# Chat API Frontend Guide

This guide documents how to implement the Chat features in the frontend, including fetching conversations, sending messages, and handling real-time WebSocket events.

## 1. WebSocket Connection

Chat uses Socket.IO. You must connect with the user's JWT token in the `auth` object.

```javascript
import { io } from 'socket.io-client';

const socket = io('https://your-api-url', {
  auth: {
    token: 'USER_ACCESS_TOKEN'
  }
});
```

## 2. Message Status (Sent vs Seen)
A key feature of the chat module is message read receipts.
Every message object returned by the API or WebSocket will have a `status` field:
* `status: 'sent'` - The message has been delivered to the server.
* `status: 'seen'` - The recipient has opened the conversation and viewed the message.

## 3. Real-time Events (Socket.IO)

### Sending a message
To send a message, emit `chat:send`:
```typescript
socket.emit('chat:send', {
  recipientId: 'UUID',
  content: 'Hello!', // optional if media is provided
  media: [],         // optional array of media objects
  replyToId: null    // optional message ID to reply to
});
```

### Receiving messages
Listen for `chat:message` to receive new incoming messages:
```typescript
socket.on('chat:message', (payload) => {
  // payload: { conversationId, message }
  // newly received messages will default to message.status = 'sent'
});
```

### Read Receipts
When the user opens a conversation, let the server know they have read the messages:
```typescript
socket.emit('chat:read', { 
  conversationId: 'UUID', 
  senderId: 'OTHER_USER_UUID' // ID of the person you're chatting with
});
```

When the *other* user reads your messages, you will receive this event:
```typescript
socket.on('chat:read', (payload) => {
  // payload: { conversationId, readBy }
  // Action: Update all messages in this conversation where senderId === myUserId and status === 'sent' to status = 'seen'
});
```

### Typing Indicators
```typescript
// Emit when the user starts/stops typing
socket.emit('chat:typing', { recipientId: 'UUID' });
socket.emit('chat:stop_typing', { recipientId: 'UUID' });

// Listen for typing events
socket.on('chat:typing', ({ senderId }) => { ... });
socket.on('chat:stop_typing', ({ senderId }) => { ... });
```

## 4. REST APIs

All REST endpoints are prefixed with `/api/chat` (or similar depending on your router setup).

### GET `/conversations`
Fetches all active conversations for the current user.
**Response**:
```json
[
  {
    "conversationId": "UUID",
    "otherUser": {
      "id": "UUID",
      "username": "john_doe",
      "fullName": "John Doe",
      "profileImage": "url"
    },
    "lastMessage": {
      "id": "UUID",
      "content": "Hello",
      "status": "sent", // or "seen"
      "createdAt": "2026-09-12T10:00:00.000Z"
    },
    "lastReadAt": "2026-09-12T09:00:00.000Z"
  }
]
```

### GET `/conversations/:conversationId/messages`
Fetches paginated messages for a conversation.
**Query Params**: `limit` (default 30), `before` (timestamp for pagination).

### GET `/search?q=query`
Searches for friends or existing conversations by name.
**Response**:
```json
{
  "conversations": [], // existing matched conversations
  "friends": [] // matched mutual friends, useful to start new chats
}
```

### DELETE `/messages/:messageId`
Deletes a message sent by the user.

### POST `/send` & POST `/upload`
You can also send messages and upload media via standard REST POST requests instead of WebSockets if preferred.
