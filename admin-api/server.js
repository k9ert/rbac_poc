const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.ADMIN_API_PORT || 4000;
const KRATOS_PUBLIC_URL = process.env.KRATOS_PUBLIC_URL || 'http://localhost:4433';

// Data directories
const DATA_DIR = path.join(__dirname, 'data');
const ACCOUNTS_DIR = path.join(DATA_DIR, 'accounts');
const DEVICES_DIR = path.join(DATA_DIR, 'devices');

// Ensure data directories exist
fs.ensureDirSync(ACCOUNTS_DIR);
fs.ensureDirSync(DEVICES_DIR);

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Authentication middleware - validates Kratos session
async function requireAuth(req, res, next) {
  try {
    const response = await axios.get(`${KRATOS_PUBLIC_URL}/sessions/whoami`, {
      headers: {
        Cookie: req.headers.cookie || ''
      }
    });
    
    req.user = response.data;
    next();
  } catch (error) {
    console.error('Authentication failed:', error.message);
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Valid Kratos session required',
      details: 'Please authenticate via the web app first'
    });
  }
}

// Helper functions for file operations
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function listJsonFiles(directory) {
  try {
    const files = await fs.readdir(directory);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    const results = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(directory, file);
      const data = await readJsonFile(filePath);
      if (data) {
        results.push({ id: path.basename(file, '.json'), ...data });
      }
    }
    
    return results;
  } catch (error) {
    return [];
  }
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'RBAC POC Admin API'
  });
});

// Account endpoints
app.get('/api/accounts', requireAuth, async (req, res) => {
  try {
    const accounts = await listJsonFiles(ACCOUNTS_DIR);
    res.json({
      success: true,
      data: accounts,
      count: accounts.length,
      user: req.user.identity.traits.email
    });
  } catch (error) {
    console.error('AccountRead error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read accounts',
      message: error.message 
    });
  }
});

app.post('/api/accounts', requireAuth, async (req, res) => {
  try {
    const accountId = uuidv4();
    const accountData = {
      id: accountId,
      name: req.body.name || 'Unnamed Account',
      email: req.body.email || '',
      status: req.body.status || 'active',
      createdAt: new Date().toISOString(),
      createdBy: req.user.identity.traits.email,
      ...req.body
    };
    
    const filePath = path.join(ACCOUNTS_DIR, `${accountId}.json`);
    await writeJsonFile(filePath, accountData);
    
    res.status(201).json({
      success: true,
      data: accountData,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('AccountWrite error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create account',
      message: error.message 
    });
  }
});

app.get('/api/accounts/:id', requireAuth, async (req, res) => {
  try {
    const filePath = path.join(ACCOUNTS_DIR, `${req.params.id}.json`);
    const account = await readJsonFile(filePath);
    
    if (!account) {
      return res.status(404).json({ 
        success: false, 
        error: 'Account not found' 
      });
    }
    
    res.json({
      success: true,
      data: { id: req.params.id, ...account }
    });
  } catch (error) {
    console.error('AccountRead error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read account',
      message: error.message 
    });
  }
});

app.put('/api/accounts/:id', requireAuth, async (req, res) => {
  try {
    const filePath = path.join(ACCOUNTS_DIR, `${req.params.id}.json`);
    const existingAccount = await readJsonFile(filePath);
    
    if (!existingAccount) {
      return res.status(404).json({ 
        success: false, 
        error: 'Account not found' 
      });
    }
    
    const updatedAccount = {
      ...existingAccount,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.identity.traits.email
    };
    
    await writeJsonFile(filePath, updatedAccount);
    
    res.json({
      success: true,
      data: updatedAccount,
      message: 'Account updated successfully'
    });
  } catch (error) {
    console.error('AccountWrite error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update account',
      message: error.message 
    });
  }
});

// Device endpoints
app.get('/api/devices', requireAuth, async (req, res) => {
  try {
    const devices = await listJsonFiles(DEVICES_DIR);
    res.json({
      success: true,
      data: devices,
      count: devices.length,
      user: req.user.identity.traits.email
    });
  } catch (error) {
    console.error('DeviceRead error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read devices',
      message: error.message 
    });
  }
});

app.post('/api/devices', requireAuth, async (req, res) => {
  try {
    const deviceId = uuidv4();
    const deviceData = {
      id: deviceId,
      name: req.body.name || 'Unnamed Device',
      type: req.body.type || 'unknown',
      status: req.body.status || 'active',
      accountId: req.body.accountId || null,
      createdAt: new Date().toISOString(),
      createdBy: req.user.identity.traits.email,
      ...req.body
    };
    
    const filePath = path.join(DEVICES_DIR, `${deviceId}.json`);
    await writeJsonFile(filePath, deviceData);
    
    res.status(201).json({
      success: true,
      data: deviceData,
      message: 'Device created successfully'
    });
  } catch (error) {
    console.error('DeviceWrite error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create device',
      message: error.message 
    });
  }
});

app.get('/api/devices/:id', requireAuth, async (req, res) => {
  try {
    const filePath = path.join(DEVICES_DIR, `${req.params.id}.json`);
    const device = await readJsonFile(filePath);
    
    if (!device) {
      return res.status(404).json({ 
        success: false, 
        error: 'Device not found' 
      });
    }
    
    res.json({
      success: true,
      data: { id: req.params.id, ...device }
    });
  } catch (error) {
    console.error('DeviceRead error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read device',
      message: error.message 
    });
  }
});

app.put('/api/devices/:id', requireAuth, async (req, res) => {
  try {
    const filePath = path.join(DEVICES_DIR, `${req.params.id}.json`);
    const existingDevice = await readJsonFile(filePath);
    
    if (!existingDevice) {
      return res.status(404).json({ 
        success: false, 
        error: 'Device not found' 
      });
    }
    
    const updatedDevice = {
      ...existingDevice,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.identity.traits.email
    };
    
    await writeJsonFile(filePath, updatedDevice);
    
    res.json({
      success: true,
      data: updatedDevice,
      message: 'Device updated successfully'
    });
  } catch (error) {
    console.error('DeviceWrite error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update device',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/accounts',
      'POST /api/accounts',
      'GET /api/accounts/:id',
      'PUT /api/accounts/:id',
      'GET /api/devices',
      'POST /api/devices',
      'GET /api/devices/:id',
      'PUT /api/devices/:id'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🔐 RBAC POC Admin API running on http://localhost:${PORT}`);
  console.log(`📡 Kratos Public URL: ${KRATOS_PUBLIC_URL}`);
  console.log(`📁 Data Directory: ${DATA_DIR}`);
  console.log(`🔗 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/accounts`);
  console.log(`   POST /api/accounts`);
  console.log(`   GET  /api/accounts/:id`);
  console.log(`   PUT  /api/accounts/:id`);
  console.log(`   GET  /api/devices`);
  console.log(`   POST /api/devices`);
  console.log(`   GET  /api/devices/:id`);
  console.log(`   PUT  /api/devices/:id`);
});
