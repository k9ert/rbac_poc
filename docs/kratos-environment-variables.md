# Environment Variables Configuration

## Overview

This document explains how to configure the RBAC POC using environment variables to override configuration values, particularly for sensitive data like OAuth credentials.

## Kratos Environment Variable Override

Ory Kratos supports overriding configuration values using environment variables with a specific naming convention. The environment variable names follow the configuration path structure.

### Google OAuth Configuration

The Google OAuth credentials are configured using these environment variables:

```bash
SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS_0_CLIENT_ID=your_google_client_id
SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS_0_CLIENT_SECRET=your_google_client_secret
```

### Environment Variable Naming Convention

Kratos uses the following rules to map environment variables to configuration paths:

1. **Uppercase**: All letters are uppercase
2. **Underscores**: Use underscores (`_`) instead of dots (`.`) or dashes (`-`)
3. **Array Indices**: Use numbers for array indices (e.g., `_0_` for the first item)

**Example Mapping:**
```yaml
# Configuration path: selfservice.methods.oidc.config.providers[0].client_id
# Environment variable: SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS_0_CLIENT_ID
```

## Configuration Files

### 1. kratos.yml

The Kratos configuration file contains placeholder values:

```yaml
selfservice:
  methods:
    oidc:
      config:
        providers:
          - id: google
            provider: google
            client_id: "REPLACE_WITH_GOOGLE_CLIENT_ID"
            client_secret: "REPLACE_WITH_GOOGLE_CLIENT_SECRET"
```

These placeholders are overridden by environment variables at runtime.

### 2. docker-compose.yml

The Docker Compose file sets the environment variables:

```yaml
environment:
  - SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS_0_CLIENT_ID=${GOOGLE_CLIENT_ID}
  - SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS_0_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
```

### 3. .env file

Create a `.env` file in the project root with your actual credentials:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_actual_client_secret
```

## Setup Instructions

### 1. Create Environment File

```bash
cp .env.example .env
```

Edit the `.env` file with your Google OAuth credentials from Google Cloud Console.

### 2. Verify Configuration

Check that environment variables are properly set in the container:

```bash
docker exec rbac_poc-kratos-1 env | grep SELFSERVICE
```

Should output:
```
SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS_0_CLIENT_ID=your_client_id
SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS_0_CLIENT_SECRET=your_client_secret
```

### 3. Test Configuration

Test that Kratos is using the correct values:

```bash
curl -s http://localhost:4433/self-service/login/browser
```

The OAuth redirect should contain your actual client ID, not the placeholder.

## Troubleshooting

### Environment Variables Not Working

If environment variables aren't being applied:

1. **Check Docker Compose**: Ensure the environment variables are properly defined
2. **Restart Services**: Environment changes require container restart
3. **Verify Injection**: Use `docker exec` to check if variables are in the container
4. **Check Syntax**: Ensure environment variable names match Kratos convention

### Common Issues

1. **Typos in variable names**: Environment variable names are case-sensitive
2. **Missing array indices**: Don't forget the `_0_` for array elements
3. **Docker Compose syntax**: Ensure proper YAML formatting in docker-compose.yml

## Additional Configuration

You can override other Kratos configuration values using the same pattern:

```bash
# Database configuration
DSN=postgres://user:pass@host:5432/db

# Logging level
LOG_LEVEL=debug

# CORS settings
SERVE_PUBLIC_CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

