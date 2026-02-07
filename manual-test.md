# Manual Authentication Testing Guide

The username/password authentication system has been successfully implemented. Here's how to test it:

## ✅ What Was Implemented

1. **Database Schema** - Added `username` and `password_hash` columns to users table
2. **User Registration** - POST `/api/auth/register` now requires a username (min 3 chars)
3. **Flexible Login** - POST `/api/auth/login` accepts username OR email
4. **Password Security** - bcrypt hashing with 10 salt rounds
5. **JWT Tokens** - 7-day expiry with HS256 algorithm

## 🧪 How to Test

### Method 1: Using the Frontend (Easiest)

1. Make sure the server is running: `npm run dev`
2. Open browser to: http://127.0.0.1:5173
3. Register a new account:
   - Fill in username, email, password, first name, last name
   - Click "Register"
4. Login with either username or email
5. Sample data will be automatically seeded for new users!

### Method 2: Using PowerShell (API Testing)

```powershell
# Start the server
npm run dev

# In a new PowerShell window:

# Test 1: Register a new user
$registerBody = @{
    username = "testuser"
    email = "test@example.com"
    password = "password123"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/auth/register" `
    -Method POST `
    -Body $registerBody `
    -ContentType "application/json"

Write-Host "Registration successful! Token: $($response.token.Substring(0, 20))..."
Write-Host "Username: $($response.user.username)"

# Test 2: Login with username
$loginBody = @{
    emailOrUsername = "testuser"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

Write-Host "Login with username successful!"
$token = $response.token

# Test 3: Login with email
$loginBody = @{
    emailOrUsername = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

Write-Host "Login with email successful!"

# Test 4: Access protected endpoint
$headers = @{
    "Authorization" = "Bearer $token"
}

$notes = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/notes" `
    -Method GET `
    -Headers $headers

Write-Host "Protected endpoint access successful! Notes count: $($notes.Count)"
```

## 📊 Expected Results

✅ Registration creates user with unique username
✅ Password is hashed (never stored in plain text)
✅ Login works with username
✅ Login works with email  
✅ JWT token authenticates protected routes
✅ Sample data auto-seeded for new users
✅ Duplicate usernames/emails are rejected

## 🔍 Verifying Implementation

### Check Database Schema
The users table now has:
- `id` (UUID primary key)
- `email` (TEXT UNIQUE)
- **`username`** (TEXT UNIQUE) ← NEW
- **`password_hash`** (TEXT) ← NEW
- `first_name` (TEXT)
- `last_name` (TEXT)
- `created_at` (INTEGER)

### Check Server Logs
When users register/login, you should see:
```
10:52:45 PM [express] POST /api/auth/register 201 in 245ms
10:52:46 PM [express] POST /api/auth/login 200 in 123ms
```

### Check Token Payload
JWT tokens now include:
```json
{
  "userId": "...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## 📚 Documentation

Full authentication guide: See [AUTH_GUIDE.md](./AUTH_GUIDE.md)

## 🎉 Summary

Your authentication database with usernames and passwords is fully implemented and ready to use! The system supports:

- ✅ Secure password storage (bcrypt)
- ✅ Username uniqueness validation  
- ✅ Flexible login (username OR email)
- ✅ JWT token-based sessions
- ✅ Auto-seeding sample data
- ✅ Protected API routes

You can now update the frontend registration form to include the username field and start using the new authentication system!
