# Username/Password Authentication System

## Overview
CampusCompanion now includes a complete username/password authentication database for secure user sign-in.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  profile_image_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Key Features
- **Unique Usernames**: Each user has a unique username for login
- **Unique Emails**: Email addresses must be unique
- **Secure Password Storage**: Passwords are hashed using bcrypt (10 rounds)
- **Flexible Login**: Users can login with either username OR email
- **JWT Authentication**: Secure token-based authentication (7-day expiry)

## API Endpoints

### Register New User
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Validation Rules:**
- Username: minimum 3 characters
- Email: valid email format
- Password: minimum 6 characters

### Login
```
POST /api/auth/login
```

**Request Body (with username):**
```json
{
  "emailOrUsername": "johndoe",
  "password": "SecurePass123"
}
```

**Request Body (with email):**
```json
{
  "emailOrUsername": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Verify Token
```
GET /api/auth/verify
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "userId": "1234567890",
    "email": "john@example.com"
  }
}
```

## Security Features

### Password Hashing
- Uses **bcrypt** with 10 salt rounds
- Passwords never stored in plain text
- Hash comparison for authentication

### JWT Tokens
- **Algorithm**: HS256
- **Expiry**: 7 days
- **Payload**: userId, email, firstName, lastName
- **Secret**: Configurable via JWT_SECRET environment variable

### Protected Routes
All API routes require authentication via JWT token:
```javascript
// Example protected route
GET /api/notes
Headers: Authorization: Bearer <token>
```

## Testing

Run the authentication test suite:
```bash
npx tsx test-username-auth.ts
```

This will test:
1. User registration with username
2. Login with username
3. Login with email
4. Token verification
5. Access to protected resources

## Frontend Integration

### Registration Form
```typescript
const handleRegister = async (data) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: data.username,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    }),
  });
  
  const result = await response.json();
  localStorage.setItem('token', result.token);
};
```

### Login Form
```typescript
const handleLogin = async (data) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrUsername: data.usernameOrEmail,
      password: data.password,
    }),
  });
  
  const result = await response.json();
  localStorage.setItem('token', result.token);
};
```

### Making Authenticated Requests
```typescript
const token = localStorage.getItem('token');

const response = await fetch('/api/notes', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## Database Storage

### In-Memory Cache
- Fast lookups for active users
- Synced with SQLite database

### SQLite Database
- Persistent storage
- Foreign key constraints for data integrity
- Automatic user creation on first auth

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{ "message": "Username already taken" }
{ "message": "Email already registered" }
{ "message": "Username must be at least 3 characters" }
```

**401 Unauthorized**
```json
{ "message": "Invalid credentials" }
{ "message": "Unauthorized" }
{ "message": "Invalid token" }
```

**500 Internal Server Error**
```json
{ "message": "Registration failed" }
{ "message": "Login failed" }
```

## Configuration

### Environment Variables

```env
# JWT Secret (REQUIRED for production)
JWT_SECRET=your-very-secure-random-string-here

# Database (optional, defaults to in-memory SQLite)
DATABASE_URL=sqlite:memory
```

**⚠️ IMPORTANT**: Change `JWT_SECRET` in production to a strong random string!

## Sample Data

New users automatically receive sample data:
- 10+ Computer Science notes
- 5+ flashcard decks with 50+ cards
- 5+ quizzes with multiple questions

This helps users understand the platform immediately after registration.

## Best Practices

1. **Never log passwords** - Always hash before storage
2. **Use HTTPS in production** - Protect tokens in transit
3. **Rotate JWT secrets regularly** - Security best practice
4. **Implement rate limiting** - Prevent brute force attacks
5. **Add email verification** - Confirm user email addresses
6. **Enable 2FA** - Additional security layer (future enhancement)

## Troubleshooting

### "Username already taken"
- Try a different username
- Usernames are case-sensitive

### "Invalid credentials"
- Check username/email spelling
- Verify password is correct
- Ensure account exists

### "Token verification failed"
- Token may be expired (7-day limit)
- Re-login to get new token
- Check JWT_SECRET matches on server

## Future Enhancements

- [ ] Password reset via email
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub)
- [ ] Session management dashboard
- [ ] Password strength requirements
- [ ] Account lockout after failed attempts
- [ ] Remember me functionality
