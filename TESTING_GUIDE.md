# Testing Guide for New Features

## Prerequisites
1. Run the SQL migration in Supabase SQL Editor (manual_migration.sql)
2. Server should be running on http://localhost:3000

## New/Updated Endpoints to Test

### 1. Register with Username ✅
**Endpoint:** `POST /auth/register`
**File:** `Auth/Register.bru`
**What's New:** Now requires `username` field (not empty), `photo` is optional
```json
{
  "email": "User@example.com",
  "username": "userexample",
  "password": "password123",
  "photo": ""
}
```

### 2. Update User Preferences ✅
**Endpoint:** `PATCH /me`
**File:** `Users/Update -me.bru`
**What's New:** Added `nsfwEnabled` and `spoilerEnabled` fields
```json
{
  "username": "newusername",
  "nsfwEnabled": false,
  "spoilerEnabled": false
}
```

### 3. Get Current User with Posts ✅
**Endpoint:** `GET /me`
**File:** `Users/Get Me.bru`
**What's New:** Response now includes user preferences and all user's posts

### 4. Get Followed Items ✅
**Endpoint:** `GET /followed`
**File:** `Users/Get Followed.bru`
**What's New:** New endpoint - returns followed users and communities
**Response:**
```json
{
  "users": [...],
  "communities": [...]
}
```

### 5. Get User with Posts ✅
**Endpoint:** `GET /user/:id`
**File:** `Users/Get User.bru`
**What's New:** Response now includes all posts by that user

### 6. Get Posts by User ✅
**Endpoint:** `GET /user/:userId/posts`
**File:** `Posts/List Posts by User.bru`
**What's New:** New endpoint - get all posts created by specific user

### 7. Create Post with Flags ✅
**Endpoint:** `POST /communities/:cid/posts`
**File:** `Posts/Create Post.bru`
**What's New:** Added `isNsfw` and `isSpoiler` boolean fields
```json
{
  "title": "My first post",
  "content": "Hello world",
  "img": "",
  "isNsfw": false,
  "isSpoiler": false
}
```

### 8. Update Post with Flags ✅
**Endpoint:** `PATCH /posts/:id`
**File:** `Posts/Update Post.bru`
**What's New:** Can now update `isNsfw` and `isSpoiler` fields

## Testing Order
1. Register a new user (with username)
2. Login to get token
3. Update preferences via PATCH /me
4. Get current user (GET /me) - verify preferences and posts
5. Create a post with nsfw/spoiler flags
6. Get posts by user ID
7. Test followed endpoint (will be empty until you add follow functionality)

## Notes
- All endpoints compile without errors ✅
- Server is running successfully ✅
- Database schema is ready (after running manual_migration.sql)
- Bruno collection files are all updated ✅
