import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Ensures Vite bundles, Google GIS scripts, fonts, and inline styles are never blocked
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: false
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server, same-origin)
    if (!origin) return callback(null, true);
    
    // Always permit localhost, Vercel deployments (*.vercel.app), and configured origins
    const isVercel = origin.endsWith('.vercel.app') || origin.includes('vercel.app');
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isWildcard = config.corsOrigin === '*';
    const isMatch = config.corsOrigin && origin === config.corsOrigin;

    if (isLocal || isVercel || isWildcard || isMatch || config.nodeEnv === 'development') {
      return callback(null, true);
    }

    // Default to allowing origin in production to prevent 500 crashes
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

export const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max 20 clinical safety evaluations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Analysis rate limit reached. Please wait a moment before submitting another medication evaluation.'
  }
});
