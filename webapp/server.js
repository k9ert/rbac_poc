const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3000;
const KRATOS_PUBLIC_URL = process.env.KRATOS_PUBLIC_URL || 'http://localhost:4433';

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Helper function to check if user is authenticated
async function getSession(req) {
  try {
    const response = await axios.get(`${KRATOS_PUBLIC_URL}/sessions/whoami`, {
      headers: {
        Cookie: req.headers.cookie || ''
      }
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

// Routes
app.get('/', async (req, res) => {
  const session = await getSession(req);
  
  if (session) {
    // User is authenticated
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>RBAC POC - Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .user-info { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .logout-btn { background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
          .logout-btn:hover { background: #c82333; }
          pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>🎉 Welcome to RBAC POC!</h1>
        <p>You are successfully authenticated with Google via Ory Kratos.</p>
        
        <div class="user-info">
          <h3>Your Profile Information:</h3>
          <p><strong>Email:</strong> ${session.identity.traits.email}</p>
          <p><strong>Name:</strong> ${session.identity.traits.first_name} ${session.identity.traits.last_name}</p>
          ${session.identity.traits.picture ? `<p><strong>Picture:</strong> <img src="${session.identity.traits.picture}" alt="Profile" style="width: 50px; height: 50px; border-radius: 50%;"></p>` : ''}
          <p><strong>Identity ID:</strong> ${session.identity.id}</p>
          <p><strong>Session ID:</strong> ${session.id}</p>
        </div>

        <h3>Full Session Data:</h3>
        <pre>${JSON.stringify(session, null, 2)}</pre>
        
        <p>
          <a href="/logout" class="logout-btn">Logout</a>
        </p>
      </body>
      </html>
    `);
  } else {
    // User is not authenticated
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>RBAC POC - Login</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
          .login-container { background: #f8f9fa; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .login-btn { background: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px; }
          .login-btn:hover { background: #3367d6; }
        </style>
      </head>
      <body>
        <div class="login-container">
          <h1>🔐 RBAC POC</h1>
          <p>Welcome! Please sign in with your Google account to continue.</p>
          <p>
            <a href="/login" class="login-btn">🚀 Sign in with Google</a>
          </p>
        </div>
      </body>
      </html>
    `);
  }
});

app.get('/login', async (req, res) => {
  const flowId = req.query.flow;

  if (!flowId) {
    // No flow ID, redirect to Kratos to initialize login flow
    try {
      const response = await axios.get(`${KRATOS_PUBLIC_URL}/self-service/login/browser`, {
        maxRedirects: 0,
        validateStatus: (status) => status === 303 || status === 200
      });

      if (response.status === 303) {
        res.redirect(response.headers.location);
      } else {
        res.redirect(`${KRATOS_PUBLIC_URL}/self-service/login/browser`);
      }
    } catch (error) {
      console.error('Login initialization error:', error.message);
      res.status(500).send('Error initiating login flow');
    }
    return;
  }

  // We have a flow ID, fetch the login flow and render the login form
  try {
    const response = await axios.get(`${KRATOS_PUBLIC_URL}/self-service/login/flows?id=${flowId}`, {
      headers: {
        Accept: 'application/json',
        Cookie: req.headers.cookie || ''
      }
    });

    const loginFlow = response.data;

    // Find the Google OIDC method
    const oidcMethod = loginFlow.ui.nodes.find(node =>
      node.attributes.name === 'provider' && node.attributes.value === 'google'
    );

    if (!oidcMethod) {
      res.status(500).send('Google OAuth not configured properly');
      return;
    }

    // Render login page with Google sign-in
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>RBAC POC - Login</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
          .login-container { background: #f8f9fa; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .google-btn { background: #4285f4; color: white; padding: 12px 24px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; text-decoration: none; display: inline-block; }
          .google-btn:hover { background: #3367d6; }
        </style>
      </head>
      <body>
        <div class="login-container">
          <h1>🔐 RBAC POC</h1>
          <p>Welcome! Please sign in with your Google account to continue.</p>
          <form action="${loginFlow.ui.action}" method="${loginFlow.ui.method}">
            ${loginFlow.ui.nodes.map(node => {
              if (node.attributes.name === 'csrf_token') {
                return `<input type="hidden" name="${node.attributes.name}" value="${node.attributes.value}">`;
              }
              if (node.attributes.name === 'provider' && node.attributes.value === 'google') {
                return `<input type="hidden" name="${node.attributes.name}" value="${node.attributes.value}">`;
              }
              return '';
            }).join('')}
            <button type="submit" class="google-btn">🚀 Sign in with Google</button>
          </form>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Login flow error:', error.message);
    if (error.response && (error.response.status === 404 || error.response.status === 403)) {
      // Flow not found or expired, redirect to create a new one
      res.redirect('/login');
    } else {
      res.status(500).send('Error loading login flow');
    }
  }
});

app.get('/logout', async (req, res) => {
  try {
    // Initialize logout flow
    const response = await axios.get(`${KRATOS_PUBLIC_URL}/self-service/logout/browser`, {
      headers: {
        Cookie: req.headers.cookie || ''
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 303 || status === 200
    });
    
    if (response.status === 303) {
      // Redirect to Kratos logout page
      res.redirect(response.headers.location);
    } else {
      res.redirect(`${KRATOS_PUBLIC_URL}/self-service/logout/browser`);
    }
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).send('Error initiating logout flow');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
  console.log(`🚀 RBAC POC Web App running on http://localhost:${PORT}`);
  console.log(`📡 Kratos Public URL: ${KRATOS_PUBLIC_URL}`);
  console.log(`🔗 Open http://localhost:${PORT} to test the authentication flow`);
});
