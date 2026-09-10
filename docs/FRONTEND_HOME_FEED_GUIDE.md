# Frontend Guide: Home Feed Implementation

This guide covers the implementation details for the **Home Feed** screen, including how to handle mixed content (posts, reels) and the newly added **friend suggestions carousel**.

## Overview

The Home Feed API (`GET /api/feed/home`) is a unified endpoint that returns:
1. **Posts** (images/text)
2. **Reels** (videos)
3. **Suggestions** (a list of recommended users to follow)

You can use a `FlatList` (in React Native) or a standard mapping function to render this data. The backend handles the insertion logic for the suggestions automatically:
- **Middle of the feed**: A suggestion block is injected at index `5` on `page=1`.
- **End of the feed**: A suggestion block is appended to the final page when there is no more content (`hasMore: false`).

---

## The API Endpoint

**Endpoint:** `GET /api/feed/home`  
**Method:** `GET`  
**Auth Required:** Yes (`Authorization: Bearer <token>`)

### Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | Integer | `1` | The current page to fetch. Increment this as the user scrolls. |
| `limit` | Integer | `10` | The number of items to fetch per page. |

---

## Example `cURL` Request

```bash
curl --location --request GET 'https://<your-api-domain>/api/feed/home?page=1&limit=10' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

---

## Example Response

A typical response for `page=1` will look like this. Notice how `type` helps you determine which UI component to render for each item in the `feed` array.

```json
{
  "success": true,
  "message": "Home feed fetched",
  "data": {
    "feed": [
      {
        "type": "post",
        "id": "e8a939f8-b3d2-45e0-8356-9b1686cc938f",
        "content": "Just launched my new project! 🚀 #launch",
        "createdAt": "2026-09-10T14:30:00.000Z",
        "author": {
          "id": "f5c329a1-c3b1-41d9-8123-1d2a58b928f9",
          "username": "johndoe",
          "fullName": "John Doe",
          "profileImage": "https://cdn.example.com/profiles/johndoe.jpg"
        },
        "media": [
          "https://cdn.example.com/posts/image1.jpg"
        ],
        "hashtags": ["launch"],
        "mentions": [],
        "likeCount": 12,
        "bookmarkCount": 3,
        "repostCount": 1,
        "replyCount": 5,
        "hasLiked": true,
        "hasBookmarked": false,
        "isOwn": true
      },
      {
        "type": "reel",
        "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
        "videoUrl": "https://cdn.example.com/reels/video1.mp4",
        "thumbnailUrl": "https://cdn.example.com/reels/thumb1.jpg",
        "caption": "A day in the life 🎬",
        "createdAt": "2026-09-09T18:00:00.000Z",
        "author": {
          "id": "some-author-id",
          "username": "jane_smith",
          "fullName": "Jane Smith",
          "profileImage": null
        },
        "hashtags": [],
        "mentions": [],
        "likeCount": 42,
        "bookmarkCount": 5,
        "repostCount": 0,
        "replyCount": 10,
        "hasLiked": false,
        "hasBookmarked": false,
        "isOwn": false
      },
      
      // ... more posts or reels ...

      {
        "type": "suggestions",
        "users": [
          {
            "id": "user-uuid-1",
            "username": "suggested_user1",
            "fullName": "Suggested User One",
            "profileImage": "https://cdn.example.com/profiles/user1.jpg"
          },
          {
            "id": "user-uuid-2",
            "username": "suggested_user2",
            "fullName": "Suggested User Two",
            "profileImage": null
          }
        ]
      }
    ],
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

---

## Frontend Implementation Guidance

When building your UI, loop over the `data.feed` array and render a specific component based on the `type` property.

### React Native / React Example Structure:

```jsx
import React from 'react';
import { FlatList, View, Text } from 'react-native';
// Import your custom UI components
import PostCard from './components/PostCard';
import ReelCard from './components/ReelCard';
import SuggestionsCarousel from './components/SuggestionsCarousel';

const HomeFeedScreen = ({ feedData, loadMore }) => {
  
  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'post':
        return <PostCard post={item} />;
      
      case 'reel':
        return <ReelCard reel={item} />;
      
      case 'suggestions':
        // Render a horizontal scrollview / carousel of user profiles
        return <SuggestionsCarousel users={item.users} />;
      
      default:
        return null;
    }
  };

  return (
    <FlatList
      data={feedData}
      keyExtractor={(item, index) => item.id ? item.id : `suggestion-${index}`}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
};

export default HomeFeedScreen;
```

### Key Takeaways:
1. **Keys**: Since the `suggestions` object doesn't have an `id` field, ensure your `keyExtractor` handles it by generating a fallback key (e.g., using the array index).
2. **Infinite Scrolling**: Use `data.hasMore` to determine if you should trigger another API fetch in your `onEndReached` callback. Increment `page` for each subsequent call.
3. **No extra API calls for suggestions**: You do not need to hit a separate endpoint for suggestions. It is natively injected into the feed array by the backend.
