# Glunity Referral Module — Frontend Reference Guide

This document details the frontend implementation and API structure for the Glunity Referral Module. It serves as a reference for frontend engineers integrating or modifying the referral system in the React Native app.

## 1. Business Logic Overview
* **Reward:** 500 points to the **referrer** per successful referral.
* **Success Criteria:** The referred user must complete **both**:
  1. Profile setup (uploading a profile image).
  2. Creating their first post.
* **Referral Link Format:** `https://glunity.org/signup?ref=<REFERRAL_CODE>`
* **Limits:** Currently uncapped. A referrer can refer an unlimited number of users.

## 2. API Endpoints

### 2.1. Get Referral Stats & Code
**`GET /api/referrals/me`**
Fetches the authenticated user's referral code, shareable link, and aggregated statistics.

**Response Structure:**
```json
{
  "success": true,
  "message": "Referral stats fetched successfully",
  "data": {
    "referral_code": "GLUN8X92",
    "referral_link": "http://localhost:3000/signup?ref=GLUN8X92",
    "total_referrals": 12,
    "successful_referrals": 8,
    "pending_referrals": 4,
    "points_earned": 4000
  }
}
```

### 2.2. Get Referral History
**`GET /api/referrals/history?page=1&limit=20`**
Fetches a paginated history of users referred by the authenticated user. To protect privacy, personally identifiable information (PII) of referred users is excluded.

**Response Structure:**
```json
{
  "success": true,
  "message": "Referral history fetched successfully",
  "data": {
    "referrals": [
      {
        "id": "uuid-here",
        "status": "COMPLETED",
        "points_awarded": 500,
        "created_at": "2026-09-06T10:00:00.000Z",
        "completed_at": "2026-09-07T12:30:00.000Z"
      },
      {
        "id": "uuid-here2",
        "status": "PENDING",
        "points_awarded": 0,
        "created_at": "2026-09-08T14:15:00.000Z",
        "completed_at": null
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 20
  }
}
```
*(Status values: `PENDING`, `COMPLETED`, `FLAGGED`)*

---

## 3. React Native / Expo Implementation

### 3.1. TanStack Query Hooks
The API client hooks are located in `src/queries/referrals/referralQueries.ts`.

#### `useMyReferral()`
Use this hook to retrieve the user's current referral stats and code.
```typescript
import { useMyReferral } from '~/queries/referrals/referralQueries';

const { data: stats, isLoading, error } = useMyReferral();
// Access stats.referral_code, stats.successful_referrals, etc.
```

#### `useReferralHistory(page, limit)`
Use this hook to retrieve the paginated timeline of referrals.
```typescript
import { useReferralHistory } from '~/queries/referrals/referralQueries';

const { data: history, isLoading } = useReferralHistory(1, 20);
// Access history.referrals (Array), history.total, etc.
```

### 3.2. Types & Interfaces
The following TypeScript interfaces are exported from `referralQueries.ts` for strict typing across components:
```typescript
export interface ReferralStats {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  points_earned: number;
}

export interface ReferralHistoryItem {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FLAGGED';
  points_awarded: number;
  created_at: string;
  completed_at: string | null;
}
```

### 3.3. UI Components
**`src/screens/referrals/ReferralScreen.tsx`**
This is the primary user-facing referral dashboard. It utilizes Glunity's native theme colors (`useTheme()`) and includes:
- Native `expo-clipboard` integration for copying the referral code and link.
- Native React Native `Share` module for broadcasting the referral link.
- A 4-grid stat display showcasing Total, Successful, Pending, and Points Earned.
- A dynamic timeline mapping through the `ReferralHistoryItem` array, displaying `+500 pts` badges dynamically tied to the `COMPLETED` status.

### 3.4. Navigation
The `ReferralScreen` has been injected into the `RootStackParamList` inside `src/navigation/RootNavigator.tsx`.
You can navigate to it using standard React Navigation:
```typescript
navigation.navigate('Referrals');
```

---

## 4. Auth & Signup Integration Notes
If you need to pass a referral code during the signup flow manually from the frontend:
- The standard `authService.signup` payload now accepts an optional `referralCode` property.
- Social logins (`googleLogin`, `appleLogin`) also accept an optional `referralCode` property.
- Ensure the frontend captures the `?ref=CODE` query parameter dynamically from deep links or web URLs, stores it in state/context, and passes it along during the final API request.
