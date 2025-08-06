# Ory Kratos Configuration Guide

## Overview

This guide explains the Ory Kratos configuration files created for Google OAuth integration in the RBAC POC project.

## Configuration Files

### 1. `config/kratos.yml`

Main Kratos configuration file with:
- **OIDC Provider**: Google OAuth configuration
- **Identity Schema**: Reference to identity.schema.json
- **Self-Service Flows**: Login, registration, recovery, verification
- **CORS Settings**: Configured for local development
- **Database**: SQLite for development (memory/file-based)

Key features:
- Google OAuth provider with environment variable substitution
- Base64-encoded Jsonnet mapper for Google claims
- UI URLs pointing to localhost:3000 (frontend app)
- Debug logging enabled for development

### 2. `config/identity.schema.json`

JSON Schema defining user identity structure:
- **Required**: email (used as identifier)
- **Optional**: first_name, last_name, picture
- **Email verification**: Configured for recovery and verification flows
- **Password credentials**: Email as identifier

### 3. `config/google-claims-mapper.jsonnet`

Jsonnet file that maps Google OAuth claims to Kratos identity traits:
- Maps `claims.email` → `traits.email`
- Maps `claims.given_name` → `traits.first_name`
- Maps `claims.family_name` → `traits.last_name`
- Maps `claims.picture` → `traits.picture`

**Important**:
- Uses `std.extVar('claims')` to access Google OAuth claims (Kratos v1.3.1 syntax)
- This file is base64-encoded in the kratos.yml configuration
- If you modify this file, re-encode it with: `base64 -i config/google-claims-mapper.jsonnet`

### 4. `docker-compose.yml`

Docker Compose setup with:
- **kratos-migrate**: Runs database migrations
- **kratos**: Main Kratos service (ports 4433/4434)
- **mailslurper**: Email testing service (port 4436)
- **SQLite volume**: Persistent database storage

### 5. `.env.example`

Template for environment variables:
- Google OAuth credentials
- Kratos URLs
- Application URLs

## Setup Instructions

### 1. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your Google OAuth credentials from Google Cloud Console.

**Important**: The configuration file contains placeholder values that are overridden by environment variables. See [Environment Variables Guide](environment-variables.md) for details.

### 2. Start Kratos

```bash
docker-compose up -d
```

This will:
- Run database migrations
- Start Kratos on ports 4433 (public) and 4434 (admin)
- Start Mailslurper for email testing on port 4436

### 3. Verify Setup

Check that Kratos is running:
```bash
curl http://localhost:4433/health/ready
```

Should return: `{"status":"ok"}`

### 4. Test Google OAuth

Navigate to the login flow:
```bash
curl http://localhost:4433/self-service/login/browser
```

## Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Kratos Public | http://localhost:4433 | Public API for self-service flows |
| Kratos Admin | http://localhost:4434 | Admin API for identity management |
| Mailslurper | http://localhost:4436 | Email testing interface |
| Frontend App | http://localhost:3000 | Your web application (to be created) |

## Security Notes

- **Development Only**: Current configuration uses insecure secrets
- **SQLite**: Not suitable for production
- **CORS**: Configured for local development only
- **Logging**: Debug mode exposes sensitive information

## Next Steps

1. Create your frontend web application
2. Implement login/logout flows
3. Test Google OAuth integration
4. Add proper error handling
5. Configure for production deployment

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 4433, 4434, 4436 are available
2. **Environment variables**: Check .env file is properly configured
3. **Google OAuth**: Verify redirect URIs match in Google Console
4. **Docker**: Ensure Docker and Docker Compose are running

### Useful Commands

```bash
# View Kratos logs
docker-compose logs kratos

# Restart Kratos
docker-compose restart kratos

# Stop all services
docker-compose down

# Reset database
docker-compose down -v && docker-compose up -d
```
