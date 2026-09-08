# Notification Module Walkthrough

I have successfully inspected the existing Glunity backend architecture and implemented the BACKEND-ONLY in-app Notification module without introducing Firebase or modifying any frontend code.

## 1. Inspection Summary
- **Architecture**: Modular structure (`modules/*`), using Express.js controllers, services, and routes.
- **ORM/Database**: Sequelize ORM with MySQL/TiDB. Tables are auto-synced using `sequelize.sync({ alter: true })`.
- **Existing Models**: `User`, `Post`, `Follow`, `Like`, `Reply`, `Repost`.
- **Logic Locations**: 
  - Follow: `user.service.js`
  - Like/Repost: `post/services/interaction.service.js`
  - Comment/Reply: `reply/services/reply.service.js`

## 2. Files Created
- [NEW] `modules/notification/models/notification.model.js`
- [NEW] `modules/notification/services/notification.service.js`
- [NEW] `modules/notification/controllers/notification.controller.js`
- [NEW] `modules/notification/routes/notification.routes.js`

## 3. Files Modified
- [MODIFY] `app.js` (Registered `/api/notifications` routes)
- [MODIFY] `server.js` (Required the Notification model so Sequelize can sync it)
- [MODIFY] `modules/user/services/user.service.js` (Added FOLLOW notification)
- [MODIFY] `modules/post/services/interaction.service.js` (Added LIKE and REPOST notifications)
- [MODIFY] `modules/reply/services/reply.service.js` (Added COMMENT and REPLY notifications)

## 4. Database Migration Details
The Glunity backend uses `sequelize.sync({ alter: true })` inside `server.js`. 
Therefore, upon server restart, the new `notifications` table will automatically be created in the MySQL database along with its associations, constraints, and indexes. 

Indexes added to the `notifications` table:
- `recipientId`
- `recipientId` + `isRead`
- `recipientId` + `createdAt`
- `actorId`
- `type`

## 5. Notification Model
The `Notification` model handles tracking the events:
- `id` (UUID)
- `recipientId` (References `User.id`, `CASCADE` deletion)
- `actorId` (References `User.id`, `SET NULL` on deletion)
- `type` (ENUM: `'FOLLOW', 'LIKE', 'COMMENT', 'REPOST', 'REPLY'`)
- `message` (String, e.g., "John liked your post")
- `entityId` & `entityType` (For frontend deep-linking)
- `isRead` (Boolean, default `false`)

## 6. NotificationService
The centralized `notification.service.js` contains methods to interact with the database:
- `createNotification({ recipientId, actorId, ... })` - Checks for self-actions and creates the record.
- `getNotifications(userId, pagination)` - Fetches paginated notifications (newest first) including `actor` basic info.
- `getUnreadCount(userId)` - Counts unread messages.
- `markAsRead(userId, notificationId)` - Safely marks a specific notification as read.
- `markAllAsRead(userId)` - Safely marks all user's notifications as read.

## 7. API Endpoints
All endpoints are secured via the existing `auth` middleware.
- `GET /api/notifications` - Get paginated notifications.
- `GET /api/notifications/unread-count` - Get unread count.
- `PATCH /api/notifications/read-all` - Mark all unread notifications as read.
- `PATCH /api/notifications/:id/read` - Mark a specific notification as read.

## 8. Event Integrations
Notification creation is strategically hooked into the specific success flows (after database inserts):
1. **FOLLOW**: Dispatched from `followUser()` in `user.service.js`.
2. **LIKE**: Dispatched from `toggleLike()` in `interaction.service.js` only when a *new* like is created.
3. **REPOST**: Dispatched from `repostContent()` in `interaction.service.js` only when a *new* repost is created.
4. **COMMENT/REPLY**: Dispatched from `addReply()` in `reply.service.js`, dynamically handling nested replies.

In all hooks, checks ensure the user is not notifying themselves (`if (content.userId !== userId)`).

## 9. Assumptions Made
- Display names in messages are formatted as `"{requester.fullName} [action]"`. 
- `recipientId` owns the content, while `actorId` performs the action. If a user deletes their account, `actorId` gracefully becomes `null` using `ON DELETE SET NULL`, preserving the notification.
- Existing standard responses `success(res, 200, ...)` and `errorHandler` fit seamlessly with the new module.

## 10. Example API Responses

**GET /api/notifications**
```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": {
    "notifications": [
      {
        "id": "e5b8...9f",
        "recipientId": "...",
        "actorId": "...",
        "type": "LIKE",
        "message": "Jane Smith liked your post",
        "entityId": "...",
        "entityType": "POST",
        "isRead": false,
        "createdAt": "2026-09-08T10:00:00.000Z",
        "updatedAt": "2026-09-08T10:00:00.000Z",
        "actor": {
          "id": "...",
          "username": "janesmith",
          "fullName": "Jane Smith",
          "profileImage": "https://..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**GET /api/notifications/unread-count**
```json
{
  "success": true,
  "message": "Unread notification count fetched successfully",
  "data": {
    "count": 5
  }
}
```

**PATCH /api/notifications/:id/read**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": null
}
```
