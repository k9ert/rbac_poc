# RBAC POC Admin API

## Overview

A secure Admin API that demonstrates session-based authorization using Ory Kratos. The API provides CRUD operations for Accounts and Devices with file-based storage.

## Features

- **Kratos Session Protection**: All endpoints require valid Kratos authentication
- **File-based Storage**: Simple JSON file storage for demonstration
- **CORS Support**: Configured for web app integration
- **RESTful Design**: Standard HTTP methods and status codes
- **Audit Trail**: Tracks who created/updated records

## Endpoints

### Authentication
All API endpoints require a valid Kratos session cookie. Users must authenticate via the web app first.

### Health Check
- `GET /health` - API health status (no auth required)

### Account Management
- `GET /api/accounts` - List all accounts (AccountRead)
- `POST /api/accounts` - Create new account (AccountWrite)
- `GET /api/accounts/:id` - Get specific account (AccountRead)
- `PUT /api/accounts/:id` - Update account (AccountWrite)

### Device Management
- `GET /api/devices` - List all devices (DeviceRead)
- `POST /api/devices` - Create new device (DeviceWrite)
- `GET /api/devices/:id` - Get specific device (DeviceRead)
- `PUT /api/devices/:id` - Update device (DeviceWrite)

## Data Models

### Account
```json
{
  "id": "uuid",
  "name": "Account Name",
  "email": "user@example.com",
  "status": "active|inactive",
  "createdAt": "2025-08-06T10:00:00.000Z",
  "createdBy": "creator@example.com",
  "updatedAt": "2025-08-06T11:00:00.000Z",
  "updatedBy": "updater@example.com"
}
```

### Device
```json
{
  "id": "uuid",
  "name": "Device Name",
  "type": "mobile|desktop|tablet",
  "status": "active|inactive",
  "accountId": "account-uuid",
  "createdAt": "2025-08-06T10:00:00.000Z",
  "createdBy": "creator@example.com",
  "updatedAt": "2025-08-06T11:00:00.000Z",
  "updatedBy": "updater@example.com"
}
```

## Setup

### 1. Install Dependencies
```bash
cd admin-api
npm install
```

### 2. Environment Variables
The API reads from the parent directory's `.env` file:
```bash
ADMIN_API_PORT=4000
KRATOS_PUBLIC_URL=http://localhost:4433
```

### 3. Start the API
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### 4. Verify Setup
```bash
curl http://localhost:4000/health
```

## Authentication Flow

1. **User authenticates** via web app (localhost:3000)
2. **Kratos sets session cookie** in browser
3. **API requests include cookie** automatically
4. **API validates session** with Kratos `/sessions/whoami`
5. **Authorized requests** proceed to business logic

## File Storage

### Directory Structure
```
admin-api/
├── data/
│   ├── accounts/
│   │   ├── uuid1.json
│   │   └── uuid2.json
│   └── devices/
│       ├── uuid3.json
│       └── uuid4.json
├── server.js
└── package.json
```

### Data Persistence
- Each record stored as individual JSON file
- UUID-based filenames for uniqueness
- Automatic directory creation
- Atomic file operations

## API Usage Examples

### Create Account
```bash
curl -X POST http://localhost:4000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Cookie: ory_kratos_session=..." \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active"
  }'
```

### List Accounts
```bash
curl http://localhost:4000/api/accounts \
  -H "Cookie: ory_kratos_session=..."
```

### Update Device
```bash
curl -X PUT http://localhost:4000/api/devices/uuid \
  -H "Content-Type: application/json" \
  -H "Cookie: ory_kratos_session=..." \
  -d '{
    "name": "Updated Device Name",
    "status": "inactive"
  }'
```

## Security Features

### Session Validation
- Every request validates session with Kratos
- Invalid sessions return 401 Unauthorized
- Session data includes user identity

### CORS Protection
- Configured for specific origins
- Credentials support for cookies
- Preflight request handling

### Audit Trail
- Tracks creation and modification timestamps
- Records user email for accountability
- Immutable audit fields

### Input Validation
- JSON parsing with error handling
- Required field validation
- Type checking for known fields

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (invalid session)
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Testing

### Prerequisites
1. Kratos running on localhost:4433
2. User authenticated via web app
3. Valid session cookie available

### Manual Testing
```bash
# Health check (no auth)
curl http://localhost:4000/health

# Test authentication (requires session)
curl http://localhost:4000/api/accounts \
  -H "Cookie: ory_kratos_session=your_session_cookie"

# Create test account
curl -X POST http://localhost:4000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Cookie: ory_kratos_session=your_session_cookie" \
  -d '{"name": "Test Account", "email": "test@example.com"}'
```

### Integration with Web App
The web app can make authenticated requests to the API:
```javascript
// Fetch accounts (session cookie sent automatically)
const response = await fetch('http://localhost:4000/api/accounts', {
  credentials: 'include'
});
const data = await response.json();
```

## Production Considerations

### Database Migration
- Replace file storage with proper database
- Implement connection pooling
- Add transaction support

### Security Enhancements
- Add rate limiting
- Implement API key authentication
- Add request/response logging
- Input sanitization and validation

### Scalability
- Add caching layer
- Implement pagination
- Database indexing
- Load balancing

### Monitoring
- Health check endpoints
- Metrics collection
- Error tracking
- Performance monitoring

## Related Documentation

- [Main RBAC POC README](../README.md)
- [Kratos Configuration](../docs/kratos-configuration.md)
- [Login Flow Diagram](../docs/login-flow-diagram.md)
- [Environment Variables](../docs/environment-variables.md)
