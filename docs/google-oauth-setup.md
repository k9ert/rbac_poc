# Google OAuth Client Setup Guide

## Overview

This guide walks you through setting up Google OAuth 2.0 credentials for your `k9ert-rbac-poc` project to enable "Sign in with Google" functionality with Ory Kratos.

## Prerequisites

- Access to Google Cloud Console
- Project: `k9ert-rbac-poc` (already created)
- Project URL: https://console.cloud.google.com/welcome?inv=1&invt=Ab4vjA&project=k9ert-rbac-poc

## Step-by-Step Setup

### 1. Enable Google+ API (if needed)

1. Navigate to the [APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard?project=k9ert-rbac-poc)
2. Click **"+ ENABLE APIS AND SERVICES"**
3. Search for "People API"
4. Click on it and press **"ENABLE"**

### 2. Configure OAuth Consent Screen

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent?project=k9ert-rbac-poc)
2. Choose **"External"** user type (unless you have Google Workspace)
3. Fill in the required fields:
   - **App name**: `RBAC POC`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **"SAVE AND CONTINUE"**
5. On the Scopes page, click **"SAVE AND CONTINUE"** (we'll use default scopes)
6. On Test users page, add your email if testing, then **"SAVE AND CONTINUE"**
7. Review and click **"BACK TO DASHBOARD"**

### 3. Create OAuth 2.0 Client ID

1. Navigate to [Credentials](https://console.cloud.google.com/apis/credentials?project=k9ert-rbac-poc)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Choose **"Web application"** as the application type
4. Configure the client:
   - **Name**: `Kratos OIDC Client`
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:4433
     http://localhost:4455
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:4433/self-service/methods/oidc/callback/google
     http://localhost:4455/self-service/methods/oidc/callback/google
     ```
5. Click **"CREATE"**

### 4. Save Your Credentials

After creating the OAuth client, you'll see a popup with:
- **Client ID**: `xxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxx`

**Important**: Copy these values immediately and store them securely.

### 5. Create Environment File

Create a `.env` file in your project root with these credentials:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret_here

# Kratos Configuration
KRATOS_PUBLIC_URL=http://localhost:4433
KRATOS_ADMIN_URL=http://localhost:4434
```

### 6. Security Notes

- **Never commit** the `.env` file to version control
- Add `.env` to your `.gitignore` file
- For production, use proper secret management (Google Secret Manager, etc.)
- The redirect URIs must match exactly what you configure in Kratos

## Next Steps

Once you have your Google OAuth credentials:

1. Configure Ory Kratos with these credentials
2. Set up the identity schema
3. Create the Jsonnet mapper for Google claims
4. Test the authentication flow

## Troubleshooting

### Common Issues

1. **Redirect URI mismatch**: Ensure the URIs in Google Console exactly match your Kratos configuration
2. **App not verified**: For testing, you can proceed with unverified app warning
3. **Invalid client**: Double-check your Client ID and Secret are correctly copied

### Useful Links

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Ory Kratos Google Integration](https://www.ory.sh/docs/kratos/social-signin/google)
- [OAuth Consent Screen Setup](https://support.google.com/cloud/answer/10311615)

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Console | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret from Google Console | `GOCSPX-abcdefghijklmnop` |
| `KRATOS_PUBLIC_URL` | Public URL where Kratos will be accessible | `http://localhost:4433` |
| `KRATOS_ADMIN_URL` | Admin URL for Kratos management | `http://localhost:4434` |
