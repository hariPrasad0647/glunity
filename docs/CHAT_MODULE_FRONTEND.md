# Glunity Chat Module - Frontend Integration Guide

This document outlines how to integrate the Glunity chat module into the frontend application. It covers both the REST API endpoints and the real-time WebSocket events.

## 1. Authentication

All chat requests (both REST and WebSocket) require authentication.

*   **REST API:** Send the JWT token in the `Authorization` header: `Bearer <token>`
*   **WebSocket:** Pass the token in the connection handshake auth object.

---

## 2. Real-time WebSocket Connection

Connect to the Socket.IO server and authenticate.

```javascript
import { io } from 'socket.io-client';

const socket = io('YOUR_BACKEND_URL', {
  auth: {
    token: 'YOUR_JWT_TOKEN' // Required for connection
  }
});

socket.on('connect', () => {
  console.log('Connected to chat server');
});

socket.on('connect_error', (err) => {
  console.error('Connection failed:', err.message);
});
```

---

## 3. Data Structures

### Message Object
The structure returned by the API and emitted via WebSockets.

```typescript
interface User {
  id: string;
  username: string;
  profileImage: string | null;
}

interface MessageMedia {
  id: string;
  mediaUrl: string;
  mediaType: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  messageType: 'text' | 'story_reaction';
  isDeleted: boolean;
  createdAt: string;
  
  sender: User;
  media: MessageMedia[];
  
  // Included if it's a story reaction
  story?: {
    id: string;
    mediaUrl: string;
    mediaType: string;
    isExpired: boolean;
  };
  
  // Included if replying to another message
  replyToId: string | null;
  replyTo?: {
    id: string;
    content: string | null;
    isDeleted: boolean;
    sender: User;
    media: MessageMedia[];
  };
}
```

---

## 4. WebSocket Events (Real-time Actions)

### A. Sending a Message
Use the `chat:send` event to send a message.

**Emit Payload:**
```typescript
socket.emit('chat:send', {
  recipientId: 'USER_UUID',       // Required
  content: 'Hello there!',        // Optional if media is provided
  media: [{                       // Optional
    mediaUrl: '...',
    mediaType: 'image'
  }],
  replyToId: 'MESSAGE_UUID'       // Optional (for quoted replies)
});
```

### B. Receiving Messages
Listen for incoming messages (this also triggers when *you* send a message from another tab).

**Listen:**
```javascript
socket.on('chat:message', (payload) => {
  // payload.conversationId
  // payload.message (matches the Message Object structure)
});
```

### C. Typing Indicators
Notify the other user when typing starts or stops.

**Emit:**
```javascript
socket.emit('chat:typing', { recipientId: 'USER_UUID' });
socket.emit('chat:stop_typing', { recipientId: 'USER_UUID' });
```

**Listen:**
```javascript
socket.on('chat:typing', ({ senderId }) => { ... });
socket.on('chat:stop_typing', ({ senderId }) => { ... });
```

### D. Read Receipts
Mark a conversation as read.

**Emit:**
```javascript
socket.emit('chat:read', { 
  conversationId: 'CONV_UUID',
  senderId: 'OTHER_USER_UUID' // To notify them
});
```

**Listen (when someone reads your messages):**
```javascript
socket.on('chat:read', ({ conversationId, readBy }) => { ... });
```

### E. Error Handling
Listen for chat-specific errors.

```javascript
socket.on('chat:error', ({ message }) => {
  console.error('Chat error:', message);
});
```

---

## 5. REST API Endpoints

Base URL: `/api/chat`

### A. Get Conversations List
Fetch the user's inbox (list of ongoing conversations).

*   **GET** `/api/chat/conversations`
*   **Response:**
    ```json
    [
      {
        "conversationId": "uuid",
        "otherUser": { "id": "...", "username": "...", "profileImage": "...", "fullName": "..." },
        "lastMessage": { /* Message Object */ },
        "lastReadAt": "2023-10-01T12:00:00Z"
      }
    ]
    ```

### B. Get Conversation Messages
Fetch history for a specific conversation (paginated).

*   **GET** `/api/chat/conversations/:conversationId/messages?limit=30&before=ISO_DATE`
    *   `limit` (optional): Default 30.
    *   `before` (optional): Pass the `createdAt` of the oldest message you have to load the previous page.
*   **Response:** Array of Message Objects (oldest first, so append them to the top of your UI).

### C. Search Users / Chat
Search for users to start a chat with, or existing conversations.

*   **GET** `/api/chat/search?q=search_term`
*   **Response:**
    ```json
    {
      "conversations": [ /* matched existing conversations */ ],
      "friends": [ 
        /* matched mutual followers */ 
        { "id": "...", "username": "...", "conversationId": "uuid_if_exists_else_null" }
      ]
    }
    ```

### D. Send Message (REST Alternative)
You can use REST instead of WebSockets to send a message.

*   **POST** `/api/chat/send`
*   **Body:**
    ```json
    {
      "recipientId": "uuid",
      "content": "Hello!",
      "replyToId": "uuid" // Optional
    }
    ```
    *(Note: if uploading media, use FormData and the field `chatMedia`)*
*   **Response:** `201 Created` with `{ conversationId, message }`

### E. Delete Message (Soft Delete)
Deletes a message sent by the current user.

*   **DELETE** `/api/chat/messages/:messageId`
*   **Response:** `200 OK`

### F. Upload Media
Upload a file before sending it.

*   **POST** `/api/chat/upload`
*   **Body:** `multipart/form-data` with file in `chatMedia` field.
*   **Response:** Returns the media URL/type to be used in the `chat:send` socket event.
