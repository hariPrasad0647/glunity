# Notification API Documentation

This document outlines the available endpoints for the Notification module. These APIs allow the frontend to fetch the authenticated user's notifications, retrieve the unread count, and manage read statuses.

**Base URL**: `{{API_BASE_URL}}`

---

## 1. Get Notifications

Fetches the paginated list of notifications for the authenticated user, ordered from newest to oldest.

- **Endpoint:** `GET /api/notifications?page=1&limit=20`
- **Auth Required:** Yes (Bearer Token)

### Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | `integer` | `1` | The page number to fetch. |
| `limit` | `integer` | `20` | The number of records per page. |

### Request (cURL)

```bash
curl --location '{{API_BASE_URL}}/api/notifications?page=1&limit=20' \
--header 'Authorization: Bearer {{YOUR_ACCESS_TOKEN}}'
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Notifications fetched successfully",
    "data": {
        "notifications": [
            {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "recipientId": "789e4567-e89b-12d3-a456-426614174001",
                "actorId": "987e4567-e89b-12d3-a456-426614174002",
                "type": "LIKE",
                "message": "John Doe liked your post",
                "entityId": "456e4567-e89b-12d3-a456-426614174003",
                "entityType": "POST",
                "isRead": false,
                "createdAt": "2026-09-08T10:00:00.000Z",
                "updatedAt": "2026-09-08T10:00:00.000Z",
                "actor": {
                    "id": "987e4567-e89b-12d3-a456-426614174002",
                    "username": "johndoe",
                    "fullName": "John Doe",
                    "profileImage": "https://bunnycdn.com/path/to/image.jpg"
                }
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 50,
            "totalPages": 3
        }
    }
}
```

---

## 2. Get Unread Count

Fetches the total number of unread notifications for the authenticated user.

- **Endpoint:** `GET /api/notifications/unread-count`
- **Auth Required:** Yes (Bearer Token)

### Request (cURL)

```bash
curl --location '{{API_BASE_URL}}/api/notifications/unread-count' \
--header 'Authorization: Bearer {{YOUR_ACCESS_TOKEN}}'
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Unread notification count fetched successfully",
    "data": {
        "count": 5
    }
}
```

---

## 3. Mark Single Notification as Read

Marks a specific notification belonging to the authenticated user as read.

- **Endpoint:** `PATCH /api/notifications/:id/read`
- **Auth Required:** Yes (Bearer Token)

### Path Variables

| Variable | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | The unique ID of the notification to mark as read. |

### Request (cURL)

```bash
curl --location --request PATCH '{{API_BASE_URL}}/api/notifications/123e4567-e89b-12d3-a456-426614174000/read' \
--header 'Authorization: Bearer {{YOUR_ACCESS_TOKEN}}'
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Notification marked as read",
    "data": null
}
```

---

## 4. Mark All Notifications as Read

Marks all unread notifications belonging to the authenticated user as read.

- **Endpoint:** `PATCH /api/notifications/read-all`
- **Auth Required:** Yes (Bearer Token)

### Request (cURL)

```bash
curl --location --request PATCH '{{API_BASE_URL}}/api/notifications/read-all' \
--header 'Authorization: Bearer {{YOUR_ACCESS_TOKEN}}'
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "All notifications marked as read",
    "data": null
}
```

---

## Notification Types Reference

For frontend rendering logic (e.g. routing and deep-linking), these are the exact Enum types and their typical Entities:

| Type | Entity Type | Entity ID Reference | Message Format Example |
| :--- | :--- | :--- | :--- |
| `FOLLOW` | `USER` | The user ID of the follower | "Jane followed you" |
| `LIKE` | `POST` or `REEL` | The ID of the liked Post or Reel | "Jane liked your post" |
| `COMMENT` | `REPLY` | The ID of the newly created comment | "Jane commented on your post" |
| `REPOST` | `POST` or `REEL` | The ID of the reposted Post or Reel | "Jane reposted your reel" |
| `REPLY` | `REPLY` | The ID of the newly created reply | "Jane replied to your comment" |
