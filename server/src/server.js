import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🛡️  Med-Guard AI Server running in [${config.nodeEnv}] mode`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`🔒 Row-Level Security: Active`);
  console.log(`🧠 AI Engine: @google/genai`);
  console.log('====================================================');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
