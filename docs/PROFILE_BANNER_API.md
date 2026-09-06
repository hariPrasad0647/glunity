# Profile Banner API — Frontend Reference

> **Base URL**: `{{API_BASE}}/api/users`
> All requests require `Authorization: Bearer <token>`.
> Banner upload uses `multipart/form-data`.

---

## Overview

Users can set a **profile banner** — a wide header media displayed at the top of their profile page. The banner can be either:

- A **static image** (jpg, jpeg, png, webp)
- A **short video** ≤ 15 seconds (mp4, mov, avi, webm, mkv)

Only one banner type is active at a time. Uploading a new banner automatically replaces and deletes the old one from the CDN.

---

## Upload / Update Profile Banner

Banner upload is part of the existing profile update endpoint. Send the file in the `banner` field.

**`PATCH /api/users/profile`**
**Content-Type**: `multipart/form-data`

### Request Fields

| Field | Type | Required | Constraints |
|---|---|---|---|
| `banner` | file | **Yes** (for banner update) | Image or video — see formats & limits below |

> Other profile fields (`fullName`, `username`, `bio`, `profileImage`, etc.) can be sent alongside or omitted. The `banner` field is independent.

### Accepted File Formats

| Media type | Extensions | Max size |
|---|---|---|
| Image | `.jpg` `.jpeg` `.png` `.webp` | 50 MB |
| Video | `.mp4` `.mov` `.avi` `.webm` `.mkv` | 50 MB |

> **Video duration**: Maximum **15 seconds**. This is enforced **client-side** before upload.

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

### Response — Banner Fields

| Field | Type | Description |
|---|---|---|
| `bannerImage` | `string \| null` | CDN URL of the banner image, or `null` |
| `bannerVideo` | `string \| null` | CDN URL of the banner video, or `null` |

> `bannerImage` and `bannerVideo` are **mutually exclusive** — only the most recently uploaded type will be non-null. Both are `null` if no banner has been set.

### Error Responses

| Status | Message | Reason |
|---|---|---|
| `400` | `Unexpected form field "..."` | Wrong field name used (must be `banner`) |
| `413` | `File too large. Maximum allowed size is 100MB` | File exceeds the 50 MB limit |
| `400` | `Unsupported file type "..." ...` | Extension not in the allowed list |
| `500` | `Failed to upload banner. Please try again.` | CDN upload error |

---

## Banner in Profile Responses

Once a banner is set, it is returned by all profile fetch endpoints automatically — no extra call needed.

### `GET /api/users/me`

```json
{
  "data": {
    "id": "uuid",
    "username": "jane_doe",
    "bannerImage": "https://cdn.example.net/profile-banners/images/uuid_1234.jpg",
    "bannerVideo": null,
    ...
  }
}
```

### `GET /api/users/:id`

```json
{
  "data": {
    "id": "uuid",
    "username": "other_user",
    "bannerImage": null,
    "bannerVideo": "https://cdn.example.net/profile-banners/videos/uuid_1234.mp4",
    ...
  }
}
```

---

## Client-Side Implementation Guide

### 1. Pick a file (React Native example)

```js
import { launchImageLibrary } from 'react-native-image-picker';

const pickBanner = async () => {
  const result = await launchImageLibrary({
    mediaType: 'mixed',   // allow both photo and video
    videoQuality: 'high',
  });

  if (result.assets?.[0]) {
    const asset = result.assets[0];

    // Validate video duration
    if (asset.type?.startsWith('video') && asset.duration > 15) {
      alert('Banner video must be 15 seconds or less.');
      return;
    }

    uploadBanner(asset);
  }
};
```

### 2. Upload the banner

```js
const uploadBanner = async (asset) => {
  const formData = new FormData();

  formData.append('banner', {
    uri: asset.uri,
    name: asset.fileName,
    type: asset.type,   // e.g. 'image/jpeg' or 'video/mp4'
  });

  const response = await fetch(`${API_BASE}/api/users/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type manually — let the browser/RN set it with the boundary
    },
    body: formData,
  });

  const data = await response.json();
  // data.data.bannerImage or data.data.bannerVideo contains the CDN URL
};
```

### 3. Display the banner

```jsx
// React Native
const Profile = ({ user }) => (
  <View>
    {user.bannerVideo ? (
      <Video
        source={{ uri: user.bannerVideo }}
        style={styles.banner}
        repeat
        muted
        resizeMode="cover"
      />
    ) : user.bannerImage ? (
      <Image source={{ uri: user.bannerImage }} style={styles.banner} />
    ) : (
      <View style={[styles.banner, styles.bannerPlaceholder]} />
    )}
  </View>
);

const styles = StyleSheet.create({
  banner: { width: '100%', height: 180 },     // 3:1 on mobile
  bannerPlaceholder: { backgroundColor: '#1a1a2e' },
});
```

---

## Validation Checklist (Client-Side)

Before calling the upload endpoint, validate the selected file:

```
✅ File extension is one of: jpg, jpeg, png, webp, mp4, mov, avi, webm, mkv
✅ File size < 50 MB
✅ If video: duration ≤ 15 seconds
✅ Do NOT set Content-Type header manually (multipart boundary must be auto-set)
✅ Use field name exactly: "banner"
```

---

## CDN Path Structure

| Banner type | CDN path pattern |
|---|---|
| Image | `profile-banners/images/<userId>_<timestamp>.<ext>` |
| Video | `profile-banners/videos/<userId>_<timestamp>.<ext>` |

---

## Recommended Display Dimensions

| Screen | Aspect ratio | Example resolution |
|---|---|---|
| Mobile | 3 : 1 | 1080 × 360 px |
| Tablet | 4 : 1 | 1280 × 320 px |
| Desktop | 4 : 1 | 1500 × 375 px |

---

## Behaviour Summary

| Action | Result |
|---|---|
| Upload image banner | `bannerImage` = CDN URL, `bannerVideo` = `null` |
| Upload video banner | `bannerVideo` = CDN URL, `bannerImage` = `null` |
| Upload new banner over existing | Old file deleted from CDN automatically |
| No banner ever set | Both `bannerImage` and `bannerVideo` are `null` |

---

*Last updated: 2026-09-06*
