# ImagePivot API

Express.js API server for ImagePivot application.

## Structure

```
apps/api/src/
├── config/              # Environment configuration
│   └── env.ts          # Environment variable validation
├── prisma/              # Database client
│   └── client.ts       # Prisma client singleton
├── libs/                # Shared utilities
│   ├── logger.ts       # Logging utility
│   ├── errors.ts       # Custom error classes
│   └── tokens.ts       # JWT token utilities
├── modules/             # Domain modules
│   └── auth/           # Authentication module
│       ├── auth.service.ts
│       ├── auth.controller.ts
│       ├── auth.routes.ts
│       ├── google-oauth.handler.ts
│       └── facebook-oauth.handler.ts
├── middlewares/         # Express middlewares
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── routes/              # Route composition
│   └── index.ts
├── app.ts               # Express app setup
└── main.ts              # Application entry point
```

## Authentication Endpoints

### Email/Password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password

### OAuth
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/facebook` - Initiate Facebook OAuth
- `GET /api/auth/facebook/callback` - Facebook OAuth callback

### Email Verification
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email (protected)

### Password Reset
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### User Info
- `GET /api/auth/me` - Get current user (protected)

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 chars)

Optional:
- `JWT_EXPIRES_IN` - JWT expiration (default: 7d)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_CALLBACK_URL` - Google OAuth callback URL
- `FACEBOOK_APP_ID` - Facebook OAuth app ID
- `FACEBOOK_APP_SECRET` - Facebook OAuth app secret
- `FACEBOOK_CALLBACK_URL` - Facebook OAuth callback URL
- `FRONTEND_URL` - Frontend URL for OAuth redirects
- `ADMIN_FRONTEND_URL` - Admin frontend URL
- `CORS_ORIGIN` - Comma-separated CORS origins

## Running

```bash
# Development
npm run dev:api

# Build
npm run build:api

# Production
npm start
```

## Authentication Flow

1. **Email/Password Registration:**
   - User registers with email/password
   - JWT token returned
   - Email verification token generated (can be sent via email)

2. **OAuth Flow:**
   - User clicks Google/Facebook login
   - Redirected to provider
   - Callback receives provider token
   - User created/found in database
   - JWT token generated
   - Redirected to frontend with token

3. **Protected Routes:**
   - Include `Authorization: Bearer <token>` header
   - Middleware validates token and attaches user to request

