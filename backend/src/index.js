import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import mediaRoutes from './routes/media.routes.js';
import projectRoutes from './routes/projects.js';
import http from 'http';
import { WebSocketServer } from 'ws';
import presenceService from './services/presenceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware de logging
app.use((req, res, next) => {
  console.log('\n=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Body:', req.body);
  console.log('======================\n');
  next();
});

// CORS middleware
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  exposedHeaders: ['Content-Type', 'Accept'],
  credentials: true
}));

// JSON parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure uploads directory
const mediaDir = path.join(__dirname, '../media');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}
app.use('/media', express.static(mediaDir));

// Mount routes
app.use('/api/media', mediaRoutes);
app.use('/api/projects', projectRoutes);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-editor', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl
  });
});

const PORT = 4000;
const server = http.createServer(app);

// Initialize WebSocket server with CORS
const wsServer = new WebSocketServer({ 
  server,
  verifyClient: (info) => {
    // Autoriser les connexions depuis le frontend
    const origin = info.origin;
    console.log('Tentative de connexion WebSocket depuis:', origin);
    return origin === 'http://localhost:3001';
  }
});

// Initialize presence service with our WebSocket server
presenceService.initialize(wsServer);

server.listen(PORT, () => {
  console.log(`\n=== Server Started ===`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/presence`);
  console.log(`Media directory: ${mediaDir}`);
  console.log(`===================\n`);
});
