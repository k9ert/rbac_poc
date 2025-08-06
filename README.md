# Proof of Concept: Google IAM Authentication with Ory Kratos

## Goal

Demonstrate how to use Google as an identity provider for employee authentication in a web application, leveraging Ory Kratos for identity management and user session handling. The POC will show how to configure Ory Kratos to accept Google sign-in, map Google user data to the application's identity schema, and provide a secure, unified login experience for an admin API.

## Overview

This repository provides a step-by-steRp implementation of a system where employees authenticate using their Google Workspace accounts. Ory Kratos is used as the identity management layer, handling user sessions, profile data, and mapping Google claims to application-specific identity traits. The POC does **not** use Ory Keto for permissions, focusing solely on authentication and identity management.

## Developer Tasklist

### 1. Prerequisites

- Google Cloud account with access to Google Cloud Console
- Docker and Docker Compose installed
- Ory Kratos (self-hosted) or Ory Network account
- Basic knowledge of OAuth2/OIDC and web application development

### 2. Set Up Google OAuth Client

- Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Create a new OAuth 2.0 Client ID
- Set the **Authorized redirect URI** to:  
  `http(s)://<domain-of-ory-kratos>:<public-port>/self-service/methods/oidc/callback/google`
- Save the **Client ID** and **Client Secret** for later use  
  [Reference](https://www.ory.sh/docs/kratos/social-signin/google)

### 3. Configure Ory Kratos for Google Social Sign-In

- Edit your Ory Kratos configuration file (e.g., `kratos.yml`) to enable OIDC and add Google as a provider:

  ```yaml
  selfservice:
    methods:
      oidc:
        config:
          providers:
            - id: google
              provider: google
              client_id: "<GOOGLE_CLIENT_ID>"
              client_secret: "<GOOGLE_CLIENT_SECRET>"
              mapper_url: "base64://<BASE64_ENCODED_JSONNET>"
              scope:
                - email
                - profile
        enabled: true
```

- Create a Jsonnet file to map Google claims to your identity schema (see data mapping example), encode it in Base64, and insert it as mapper_url.





```markdown
# Proof of Concept: Google IAM Authentication with Ory Kratos

## Goal

Demonstrate how to use Google as an identity provider for employee authentication in a web application, leveraging Ory Kratos for identity management and user session handling. The POC will show how to configure Ory Kratos to accept Google sign-in, map Google user data to the application's identity schema, and provide a secure, unified login experience for an admin API.

## Overview

This repository provides a step-by-step implementation of a system where employees authenticate using their Google Workspace accounts. Ory Kratos is used as the identity management layer, handling user sessions, profile data, and mapping Google claims to application-specific identity traits. The POC does **not** use Ory Keto for permissions, focusing solely on authentication and identity management.

## Developer Tasklist

### 1. Prerequisites

- Google Cloud account with access to Google Cloud Console
- Docker and Docker Compose installed
- Ory Kratos (self-hosted) or Ory Network account
- Basic knowledge of OAuth2/OIDC and web application development

### 2. Set Up Google OAuth Client

- Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Create a new OAuth 2.0 Client ID
- Set the **Authorized redirect URI** to:  
  `http(s)://<domain-of-ory-kratos>:<public-port>/self-service/methods/oidc/callback/google`
- Save the **Client ID** and **Client Secret** for later use  
  [Reference](https://www.ory.sh/docs/kratos/social-signin/google)

### 3. Configure Ory Kratos for Google Social Sign-In

- Edit your Ory Kratos configuration file (e.g., `kratos.yml`) to enable OIDC and add Google as a provider:
```yaml
  selfservice:
    methods:
      oidc:
        config:
          providers:
            - id: google
              provider: google
              client_id: "<GOOGLE_CLIENT_ID>"
              client_secret: "<GOOGLE_CLIENT_SECRET>"
              mapper_url: "base64://<BASE64_ENCODED_JSONNET>"
              scope:
                - email
                - profile
        enabled: true
  ```

- Create a Jsonnet file to map Google claims to your identity schema (see [data mapping example](https://www.ory.sh/docs/kratos/social-signin/google#data-mapping)), encode it in Base64, and insert it as `mapper_url`.

### 4. Update Identity Schema

- Ensure your identity schema includes fields for `email`, `first_name`, and `last_name` to match the mapped Google claims  
  [Reference](https://www.ory.sh/docs/kratos/social-signin/google#data-mapping)

### 5. Run Ory Kratos

- Start Ory Kratos using Docker Compose or your preferred method
- Ensure the public endpoint is accessible at the domain/port used in the Google OAuth redirect URI

### 6. Implement a Simple Web App

- Create a minimal web app (e.g., Node.js, Python, etc.) that:
  - Redirects users to the Ory Kratos login flow
  - Displays a "Sign in with Google" button (provided by Kratos)
  - Handles the post-login callback and displays user information

### 7. Test the Flow

- Navigate to the login page
- Click "Sign in with Google"
- Authenticate with a Google Workspace account
- Verify that a new identity is created in Kratos and the user is logged in

### 8. (Optional) Secure an Admin API

- Protect an API endpoint by requiring a valid Kratos session cookie
- Only allow access to users authenticated via Google

### 9. Document and Clean Up

- Document any configuration or environment variables used
- Provide troubleshooting steps for common issues (e.g., redirect URI mismatches)

---

**References:**  
All steps and configuration details are based on the official Ory documentation for [Google social sign-in](https://www.ory.sh/docs/kratos/social-signin/google), [OIDC configuration](https://www.ory.sh/docs/self-hosted/kratos/configuration/oidc), and [identity schema management](https://www.ory.sh/docs/kratos/manage-identities/overview).
```
```markdown
# Proof of Concept: Google IAM Authentication with Ory Kratos

## Goal

Demonstrate how to use Google as an identity provider for employee authentication in a web application, leveraging Ory Kratos for identity management and user session handling. The POC will show how to configure Ory Kratos to accept Google sign-in, map Google user data to the application's identity schema, and provide a secure, unified login experience for an admin API.

## Overview

This repository provides a step-by-step implementation of a system where employees authenticate using their Google Workspace accounts. Ory Kratos is used as the identity management layer, handling user sessions, profile data, and mapping Google claims to application-specific identity traits. The POC does **not** use Ory Keto for permissions, focusing solely on authentication and identity management.

## Developer Tasklist

### 1. Prerequisites

- Google Cloud account with access to Google Cloud Console
- Docker and Docker Compose installed
- Ory Kratos (self-hosted) or Ory Network account
- Basic knowledge of OAuth2/OIDC and web application development

### 2. Set Up Google OAuth Client

- Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Create a new OAuth 2.0 Client ID
- Set the **Authorized redirect URI** to:  
  `http(s)://<domain-of-ory-kratos>:<public-port>/self-service/methods/oidc/callback/google`
- Save the **Client ID** and **Client Secret** for later use  
  [Reference](https://www.ory.sh/docs/kratos/social-signin/google)

### 3. Configure Ory Kratos for Google Social Sign-In

- Edit your Ory Kratos configuration file (e.g., `kratos.yml`) to enable OIDC and add Google as a provider:

  ```yaml
  selfservice:
    methods:
      oidc:
        config:
          providers:
            - id: google
              provider: google
              client_id: "<GOOGLE_CLIENT_ID>"
              client_secret: "<GOOGLE_CLIENT_SECRET>"
              mapper_url: "base64://<BASE64_ENCODED_JSONNET>"
              scope:
                - email
                - profile
        enabled: true
  ```

- Create a Jsonnet file to map Google claims to your identity schema (see [data mapping example](https://www.ory.sh/docs/kratos/social-signin/google#data-mapping)), encode it in Base64, and insert it as `mapper_url`.

### 4. Update Identity Schema

- Ensure your identity schema includes fields for `email`, `first_name`, and `last_name` to match the mapped Google claims  
  [Reference](https://www.ory.sh/docs/kratos/social-signin/google#data-mapping)

### 5. Run Ory Kratos

- Start Ory Kratos using Docker Compose or your preferred method
- Ensure the public endpoint is accessible at the domain/port used in the Google OAuth redirect URI

### 6. Implement a Simple Web App

- Create a minimal web app (e.g., Node.js, Python, etc.) that:
  - Redirects users to the Ory Kratos login flow
  - Displays a "Sign in with Google" button (provided by Kratos)
  - Handles the post-login callback and displays user information

### 7. Test the Flow

- Navigate to the login page
- Click "Sign in with Google"
- Authenticate with a Google Workspace account
- Verify that a new identity is created in Kratos and the user is logged in

### 8. (Optional) Secure an Admin API

- Protect an API endpoint by requiring a valid Kratos session cookie
- Only allow access to users authenticated via Google

### 9. Document and Clean Up

- Document any configuration or environment variables used
- Provide troubleshooting steps for common issues (e.g., redirect URI mismatches)

---

**References:**  
All steps and configuration details are based on the official Ory documentation for [Google social sign-in](https://www.ory.sh/docs/kratos/social-signin/google), [OIDC configuration](https://www.ory.sh/docs/self-hosted/kratos/configuration/oidc), and [identity schema management](https://www.ory.sh/docs/kratos/manage-identities/overview).
```
