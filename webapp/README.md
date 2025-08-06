# RBAC POC Web Application

## Overview

Simple Node.js/Express web application that demonstrates Google OAuth authentication using Ory Kratos.

## Features

- **Landing Page**: Shows login button for unauthenticated users
- **Dashboard**: Displays user profile information after successful authentication
- **Session Management**: Integrates with Kratos session handling
- **Logout Flow**: Proper logout through Kratos

## Setup

### 1. Install Dependencies

```bash
cd webapp
npm install
```

### 2. Start the Application

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### 3. Access the Application

Open your browser and navigate to: http://localhost:3000

## How It Works

1. **Unauthenticated Users**: See a login page with "Sign in with Google" button
2. **Login Flow**: Redirects to Kratos login flow which handles Google OAuth
3. **Authenticated Users**: See dashboard with profile information from Google
4. **Session Check**: Uses Kratos `/sessions/whoami` endpoint to verify authentication
5. **Logout**: Properly terminates session through Kratos logout flow

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Main page (login or dashboard based on auth status) |
| `GET /login` | Initiates Kratos login flow |
| `GET /logout` | Initiates Kratos logout flow |
| `GET /health` | Health check endpoint |

## Environment Variables

The app reads from the parent directory's `.env` file:
- `KRATOS_PUBLIC_URL`: Kratos public endpoint (default: http://localhost:4433)
- `PORT`: Web app port (default: 3000)

## Dependencies

- **express**: Web framework
- **axios**: HTTP client for Kratos API calls
- **cookie-parser**: Handle session cookies
- **dotenv**: Environment variable management

## Testing the Flow

1. Ensure Kratos is running (`docker-compose up -d` in parent directory)
2. Start the web app (`npm start`)
3. Visit http://localhost:3000
4. Click "Sign in with Google"
5. Complete Google OAuth flow
6. View your profile information on the dashboard
7. Test logout functionality

## Notes

- This is a minimal POC implementation
- In production, add proper error handling, validation, and security measures
- The app displays full session data for debugging purposes
- Session cookies are automatically handled by the browser
