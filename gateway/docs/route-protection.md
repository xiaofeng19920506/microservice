# Gateway Route Protection

## Public Endpoints (No Authentication Required)

### Auth Service

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request

### Gateway

- `GET /health` - Gateway health check
- `GET /api` - API information
- `GET /api-docs` - Swagger documentation
- `GET /unified-health` - Unified health check
- `GET /unified-api` - Unified API information

## Protected Endpoints (Authentication Required)

### Auth Service

- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/refresh` - Token refresh
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/admin/users` - Admin users (Admin only)
- `GET /api/auth/staff/dashboard` - Staff dashboard (Staff only)

### User Service

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Admin-Only Endpoints (Admin Staff Required)

### User Service

- `GET /api/users/staff` - Get all staff members
- `GET /api/users/staff/:id` - Get staff member by ID
- `PUT /api/users/staff/:id` - Update staff member
- `DELETE /api/users/staff/:id` - Delete staff member
- `GET /api/users/all` - Get all users (admin view)

## Authentication Flow

1. **Public Access**: No token required
2. **Protected Access**: Valid JWT token required in `Authorization: Bearer <token>` header
3. **Admin Access**: Valid JWT token with `userType: "staff"` and `role: "admin"`
4. **Staff Access**: Valid JWT token with `userType: "staff"`

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Access token is required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 403 Admin Required

```json
{
  "success": false,
  "message": "Admin staff access required"
}
```
