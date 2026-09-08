# Authentication API Guide

This guide details the updated password-based authentication flow for the frontend application.

## 1. Signup

Creates a new user account with a password. Email verification is no longer required to create the account.

**Endpoint:** `POST /api/v1/auth/signup`

**cURL Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/signup \
-H "Content-Type: application/json" \
-d '{
  "fullName": "John Doe",
  "username": "johndoe123",
  "email": "johndoe@example.com",
  "password": "securepassword123",
  "phone": "+1234567890",
  "referralCode": "OPTIONALCODE"
}'
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "fullName": "John Doe",
      "username": "johndoe123",
      "email": "johndoe@example.com",
      "phone": "+1234567890"
    },
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1..."
  }
}
```

---

## 2. Login

Authenticates a user with their email and password.

**Endpoint:** `POST /api/v1/auth/login`

**cURL Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "johndoe@example.com",
  "password": "securepassword123"
}'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "fullName": "John Doe",
      "username": "johndoe123",
      "email": "johndoe@example.com",
      "phone": "+1234567890"
    },
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1..."
  }
}
```

---

## 3. Forgot Password

Sends a 6-digit OTP to the user's email address to initiate a password reset.

**Endpoint:** `POST /api/v1/auth/forgot-password`

**cURL Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
-H "Content-Type: application/json" \
-d '{
  "email": "johndoe@example.com"
}'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset code sent to your email",
  "data": {
    "email": "johndoe@example.com"
  }
}
```

---

## 4. Reset Password

Verifies the 6-digit OTP and updates the user's password.

**Endpoint:** `POST /api/v1/auth/reset-password`

**cURL Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/reset-password \
-H "Content-Type: application/json" \
-d '{
  "email": "johndoe@example.com",
  "code": "123456",
  "newPassword": "newsecurepassword123"
}'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "fullName": "John Doe",
      "username": "johndoe123",
      "email": "johndoe@example.com",
      "phone": "+1234567890"
    },
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1..."
  }
}
```
