# Phase 4: Profile & Follow Implementation Plan

This plan outlines the architecture for integrating the existing Glunity Profile & Follow backend into the React Native frontend based on the `GLUNITY_PROFILE_FOLLOW_API_CONTRACT.md`.

## 1. Overview & Scope

The goal is to build out a robust User Profile system that handles viewing profiles (own and others), editing profiles, managing follow states (including private account pending requests), and viewing relationship lists (followers/following). 

All interactions will be wired securely to `https://glunity.onrender.com`.

## 2. Proposed Architecture

### A. Queries & Mutations (`src/queries/profile/profileQueries.ts`)
We will create a new dedicated TanStack Query file for user-related data:
- **Queries:**
  - `useMyProfileQuery()` → `GET /api/users/me`
  - `useUserProfileQuery(id)` → `GET /api/users/:id`
  - `useFollowersQuery(id)` / `useFollowingQuery(id)`
  - `useFollowRequestsQuery()`
  - `useUserSearchQuery(q)`
- **Mutations:**
  - `useUpdateProfileMutation()` → `PATCH /api/users/profile` (Using `FormData` for images)
  - `useFollowMutation(id, isPrivate)` → `POST /api/users/:id/follow` (Optimistic updates to `followStatus`)
  - `useUnfollowMutation(id)` → `DELETE /api/users/:id/follow`

### B. Screens (`src/screens/profile/*`)
- **[NEW]** `ProfileScreen.tsx`: A unified screen that dynamically renders "My Profile" vs "Other User Profile". Features a Parallax header with the profile image, bio, stats (Followers/Following/Posts), and a flatlist for their posts (using `useUserPostsQuery`).
- **[NEW]** `EditProfileScreen.tsx`: A modal screen with a form to update `fullName`, `bio`, `username`, `isPrivate`, and `profileImage` (using `expo-image-picker`).
- **[NEW]** `FollowListScreen.tsx`: A tabbed screen (Followers / Following) displaying a list of users.
- **[NEW]** `SearchScreen.tsx`: A screen to search for users.

### C. UI Components
- **[MODIFY]** `PostCard.tsx` / `ReplyCard.tsx`: Tapping on an author's avatar or username will navigate to their `ProfileScreen`.
- **[NEW]** `UserListRow.tsx`: A reusable component to render a user with a dynamic Follow/Requested/Unfollow button based on `followStatus`.

## 3. Navigation Updates (`RootNavigator.tsx`)
We need to register the new screens into the stack so they can be pushed dynamically from anywhere in the app:
- `Profile` (receives `{ userId?: string }`)
- `EditProfile` (modal)
- `FollowList`
- `Search`

## 4. Open Questions & Decisions

> [!IMPORTANT]
> **My Profile Access Strategy**
> Currently, the `MainTabNavigator` has 5 tabs (Home, Wallet, Research, Launchpad, DAO). How should the user access their *own* profile?
> **Option A (Recommended):** Add a user avatar icon to the top-left or top-right header of the `HomeScreen` (Twitter-style). Tapping it opens `ProfileScreen`.
> **Option B:** Add a 6th "Profile" tab to the bottom `MainTabNavigator`. (Note: 6 tabs might get visually crowded).
> **Option C:** Replace one of the existing tabs (e.g., DAO) with "Profile" for now.

> [!NOTE]
> **Image Uploads (`expo-image-picker`)**
> The `PATCH /api/users/profile` endpoint accepts a `profileImage` file. I will install and use `expo-image-picker` to allow the user to select an image from their camera roll and append it to the `FormData` payload. Are you okay with introducing this package?

## 5. Verification Plan
- **Privacy:** Verify that viewing a private profile correctly hides the posts/followers lists unless `followStatus === 'following'`.
- **Follow Flow:** Verify that following a public user results in `following`, while a private user results in `pending`.
- **Profile Updates:** Verify that updating bio and toggling `isPrivate` immediately reflects in the app.
