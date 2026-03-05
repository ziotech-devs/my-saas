---
id: auth
title: Authentication
---

# Authentication

The boilerplate supports multiple authentication strategies out of the box.

## Supported Methods

| Method | Description |
|---|---|
| Email/Password | Local auth with bcrypt hashing |
| JWT | Access + refresh token pair |
| GitHub OAuth | Passport `passport-github2` |
| Google OAuth | Passport `passport-google-oauth20` |
| OpenID Connect | Generic OIDC via `passport-openidconnect` |
| Two-Factor (2FA) | TOTP via `otplib` |

## Environment Variables

```env
JWT_SECRET=your-secret
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRY=7d

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

## Key Files

- `apps/server/src/auth/auth.service.ts` — Core auth logic
- `apps/server/src/auth/auth.controller.ts` — API endpoints
- `apps/server/src/auth/strategy/` — Passport strategies
- `apps/client/src/services/auth/` — Client-side auth calls
