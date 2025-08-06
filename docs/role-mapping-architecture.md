# Role Mapping Architecture for RBAC POC

## Overview

This document outlines the architecture for mapping Google IAM roles to JWT scopes in a way that decouples the admin API from Google IAM dependencies. The goal is to create a scalable, maintainable authorization system that follows industry best practices.

## Problem Statement

### The Challenge
We need to map Google Workspace/IAM roles to application-specific permissions (JWT scopes) without creating direct dependencies between our admin API and Google IAM services.

### Requirements
1. **Decouple admin API** from Google IAM
2. **Map Google roles** to application scopes
3. **Maintain security** and auditability
4. **Support role changes** without service restarts
5. **Follow JWT standards** for authorization

### Current Flow Issue
```
Admin API → Google IAM (direct dependency) ❌
```

### Desired Flow
```
Google IAM → Role Mapping → JWT Scopes → Admin API ✅
```

## Architecture Options

### Option 1: Kratos Identity Traits + Static Mapping

**Approach**: Store role mappings in Kratos identity traits during OAuth callback.

**Pros:**
- ✅ Simple implementation
- ✅ No external dependencies
- ✅ Fast authorization (no network calls)
- ✅ Easy to debug and test

**Cons:**
- ❌ Static role mapping
- ❌ Requires Kratos restart for role changes
- ❌ Limited scalability for complex role hierarchies

**Implementation:**
```jsonnet
// google-claims-mapper.jsonnet
local claims = std.extVar('claims');
local email = claims.email;
local domain = std.split(email, '@')[1];

local roleMapping = {
  'blinkbtc.com': {
    'admin@blinkbtc.com': ['admin:read', 'admin:write', 'account:*', 'device:*'],
    'manager@blinkbtc.com': ['account:write', 'device:read'],
    '_default': ['account:read', 'device:read']
  }
};

local userRoles = if std.objectHas(roleMapping[domain], email) 
  then roleMapping[domain][email] 
  else roleMapping[domain]['_default'];

{
  identity: {
    traits: {
      email: email,
      roles: userRoles,
      scopes: std.join(' ', userRoles)
    }
  }
}
```

### Option 2: External Role Service

**Approach**: Dedicated microservice for role mapping with external API.

**Pros:**
- ✅ Dynamic role updates
- ✅ Centralized role management
- ✅ Can integrate with multiple identity providers
- ✅ Audit trail and role history

**Cons:**
- ❌ Additional service complexity
- ❌ Network dependency during token generation
- ❌ Potential single point of failure

**Implementation:**
```javascript
// role-service/server.js
const roleMapping = {
  'admin@blinkbtc.com': ['admin:read', 'admin:write', 'account:*', 'device:*'],
  'manager@blinkbtc.com': ['account:write', 'device:read']
};

app.get('/roles/:email', (req, res) => {
  const roles = roleMapping[req.params.email] || ['user'];
  res.json({ 
    email: req.params.email,
    roles, 
    scopes: roles.join(' '),
    timestamp: new Date().toISOString()
  });
});
```

### Option 3: Google Directory API Integration

**Approach**: Real-time lookup of Google Workspace groups/roles during token generation.

**Pros:**
- ✅ Real-time role synchronization
- ✅ Leverages existing Google IAM
- ✅ No role duplication
- ✅ Automatic role updates

**Cons:**
- ❌ Google API dependency
- ❌ Rate limiting concerns
- ❌ Network latency during auth
- ❌ Requires Google Admin SDK setup

**Implementation:**
```javascript
// google-directory-integration.js
const { google } = require('googleapis');

async function getGoogleWorkspaceRoles(email) {
  const admin = google.admin({ version: 'directory_v1', auth });
  
  try {
    const groups = await admin.members.list({
      groupKey: 'all@blinkbtc.com'
    });
    
    const userGroups = groups.data.members
      .filter(member => member.email === email)
      .map(member => member.role);
      
    return mapGoogleGroupsToScopes(userGroups);
  } catch (error) {
    console.error('Google Directory API error:', error);
    return ['user']; // Fallback role
  }
}

function mapGoogleGroupsToScopes(googleGroups) {
  const mapping = {
    'ADMIN': ['admin:read', 'admin:write', 'account:*', 'device:*'],
    'MANAGER': ['account:write', 'device:read'],
    'MEMBER': ['account:read', 'device:read']
  };
  
  return googleGroups.flatMap(group => mapping[group] || ['user']);
}
```

## Recommended Hybrid Approach

### Phase 1: Static Mapping (Immediate Implementation)

**Use Kratos identity traits with domain-based role mapping:**

```jsonnet
// Enhanced google-claims-mapper.jsonnet
local claims = std.extVar('claims');
local email = claims.email;
local domain = std.split(email, '@')[1];

// Domain-based role configuration
local domainConfig = {
  'blinkbtc.com': {
    'roles': {
      'admin@blinkbtc.com': ['admin:read', 'admin:write', 'account:*', 'device:*'],
      'manager@blinkbtc.com': ['manager:read', 'manager:write', 'account:write', 'device:read'],
      'user@blinkbtc.com': ['account:read', 'device:read']
    },
    'default': ['account:read'] // Default role for domain
  },
  // Add more domains as needed
  'example.com': {
    'roles': {},
    'default': ['guest']
  }
};

local getDomainRoles = function(domain, email)
  if std.objectHas(domainConfig, domain) then
    local config = domainConfig[domain];
    if std.objectHas(config.roles, email) then
      config.roles[email]
    else
      config.default
  else
    ['guest']; // Unknown domain

local userRoles = getDomainRoles(domain, email);

{
  identity: {
    traits: {
      email: email,
      first_name: claims.given_name,
      last_name: claims.family_name,
      picture: claims.picture,
      domain: domain,
      roles: userRoles,
      scopes: std.join(' ', userRoles),
      role_source: 'static_mapping',
      role_updated_at: std.toString(std.floor(std.time))
    }
  }
}
```

### Phase 2: Dynamic Role Service (Future Enhancement)

**Add background role synchronization service:**

```javascript
// role-sync-service.js
class RoleSyncService {
  constructor() {
    this.kratosAdmin = new KratosAdminApi();
    this.googleAdmin = new GoogleAdminApi();
  }

  async syncUserRoles(email) {
    try {
      // Get current roles from Google
      const googleRoles = await this.getGoogleWorkspaceRoles(email);
      const mappedScopes = this.mapGoogleRolesToScopes(googleRoles);
      
      // Update Kratos identity
      await this.updateKratosIdentity(email, {
        roles: googleRoles,
        scopes: mappedScopes.join(' '),
        role_source: 'google_sync',
        role_updated_at: new Date().toISOString()
      });
      
      console.log(`Updated roles for ${email}:`, mappedScopes);
    } catch (error) {
      console.error(`Role sync failed for ${email}:`, error);
    }
  }

  async syncAllUsers() {
    const identities = await this.kratosAdmin.listIdentities();
    for (const identity of identities) {
      await this.syncUserRoles(identity.traits.email);
    }
  }
}

// Run sync every hour
setInterval(() => {
  new RoleSyncService().syncAllUsers();
}, 60 * 60 * 1000);
```

## JWT Token Generation with Oathkeeper

### Oathkeeper Configuration

```yaml
# oathkeeper-rules.yml
- id: "admin-api-token"
  upstream:
    url: "http://token-endpoint"
  match:
    url: "http://localhost:4455/api/token"
    methods: ["GET"]
  authenticators:
    - handler: cookie_session
      config:
        check_session_url: "http://kratos:4433/sessions/whoami"
  mutators:
    - handler: id_token
      config:
        issuer_url: "http://localhost:4455"
        jwks_url: "http://localhost:4455/.well-known/jwks.json"
        ttl: "24h"
        claims: |
          {
            "sub": "{{ print .Subject }}",
            "email": "{{ print .Extra.identity.traits.email }}",
            "scope": "{{ print .Extra.identity.traits.scopes }}",
            "roles": {{ print .Extra.identity.traits.roles | toJson }},
            "domain": "{{ print .Extra.identity.traits.domain }}",
            "iss": "rbac-poc",
            "aud": "admin-api",
            "iat": {{ print now.Unix }},
            "exp": {{ print (now.Add (time.Hour 24)).Unix }},
            "role_source": "{{ print .Extra.identity.traits.role_source }}"
          }
  authorizer:
    handler: allow
```

### Example JWT Payload

```json
{
  "sub": "user-uuid",
  "email": "kim@blinkbtc.com",
  "scope": "manager:read manager:write account:write device:read",
  "roles": ["manager:read", "manager:write", "account:write", "device:read"],
  "domain": "blinkbtc.com",
  "iss": "rbac-poc",
  "aud": "admin-api",
  "iat": 1691234567,
  "exp": 1691320967,
  "role_source": "static_mapping"
}
```

## Admin API Authorization

### Scope-Based Endpoint Protection

```javascript
// admin-api/middleware/auth.js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'http://localhost:4455/.well-known/jwks.json',
  cache: true,
  cacheMaxAge: 600000 // 10 minutes
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function validateJWT(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, getKey, {
    audience: 'admin-api',
    issuer: 'rbac-poc',
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token', details: err.message });
    }
    
    req.user = decoded;
    next();
  });
}

function requireScope(requiredScope) {
  return (req, res, next) => {
    const userScopes = req.user.scope ? req.user.scope.split(' ') : [];
    
    // Check for exact scope or wildcard permission
    const hasPermission = userScopes.some(scope => 
      scope === requiredScope || 
      scope === 'admin:*' ||
      (requiredScope.includes(':') && scope === requiredScope.split(':')[0] + ':*')
    );
    
    if (hasPermission) {
      next();
    } else {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredScope,
        available: userScopes,
        user: req.user.email
      });
    }
  };
}

module.exports = { validateJWT, requireScope };
```

### Protected Endpoints

```javascript
// admin-api/routes/accounts.js
const { validateJWT, requireScope } = require('../middleware/auth');

// All endpoints require valid JWT
router.use(validateJWT);

// Scope-based authorization
router.get('/', requireScope('account:read'), listAccounts);
router.post('/', requireScope('account:write'), createAccount);
router.get('/:id', requireScope('account:read'), getAccount);
router.put('/:id', requireScope('account:write'), updateAccount);
router.delete('/:id', requireScope('account:delete'), deleteAccount);
```

## Implementation Roadmap

### Phase 1: Basic JWT with Static Roles (Week 1)
1. ✅ Update Kratos Jsonnet mapper with role mapping
2. ✅ Add Oathkeeper to Docker Compose
3. ✅ Configure JWT generation with scopes
4. ✅ Update admin API for JWT validation
5. ✅ Implement scope-based authorization

### Phase 2: Enhanced Role Management (Week 2)
1. 🔄 Add role management UI
2. 🔄 Implement role audit logging
3. 🔄 Add role validation and testing
4. 🔄 Create role documentation

### Phase 3: Dynamic Role Sync (Future)
1. 📋 Google Directory API integration
2. 📋 Background role synchronization service
3. 📋 Role change notifications
4. 📋 Advanced role hierarchies

## Security Considerations

### JWT Security
- **Use RS256** for signing (not HS256)
- **Short token expiry** (24 hours max)
- **Proper audience validation**
- **JWKS rotation support**

### Role Management Security
- **Principle of least privilege**
- **Regular role audits**
- **Role change logging**
- **Fallback to minimal permissions**

### Google Integration Security
- **Service account with minimal permissions**
- **API rate limiting**
- **Fallback mechanisms**
- **Secure credential storage**

## Testing Strategy

### Unit Tests
- Role mapping logic
- JWT validation
- Scope checking functions

### Integration Tests
- End-to-end authentication flow
- Role-based access control
- Token generation and validation

### Security Tests
- Invalid token handling
- Scope escalation attempts
- Expired token behavior

## Monitoring and Observability

### Metrics to Track
- Authentication success/failure rates
- Authorization decision latency
- Role sync success/failure
- Token generation frequency

### Logging Requirements
- All authorization decisions
- Role changes and updates
- Failed authentication attempts
- API access patterns

## Conclusion

This architecture provides a scalable, secure approach to role-based access control that:

1. **Decouples** admin API from Google IAM
2. **Uses industry standards** (JWT, OAuth2)
3. **Supports evolution** from static to dynamic roles
4. **Maintains security** throughout the system
5. **Provides clear audit trails**

The hybrid approach allows for immediate implementation with static roles while providing a clear path to dynamic role management as the system evolves.
