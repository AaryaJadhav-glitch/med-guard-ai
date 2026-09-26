import express from 'express';
import morgan from 'morgan';
import { securityHeaders, corsMiddleware, generalLimiter } from './middleware/security.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import apiRoutes from './routes/index.js';

const app = express();

// Security Middleware
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(generalLimiter);

// Request body size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging (sanitized - no tokens or health bodies)
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Mount Clinical API Routes
app.use('/api', apiRoutes);

// Optional: Serve client production bundle if built
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Clinical endpoint ${req.method} ${req.originalUrl} not found.` });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
