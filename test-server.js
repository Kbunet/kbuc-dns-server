require('dotenv').config();
const express = require('express');
const logger = require('./src/utils/logger');

// Initialize Express app
const app = express();
const PORT = process.env.TEST_PORT || 3101;

// Import test controller that uses mock Bitcoin service
const testController = require('./src/controllers/testController');

// Middleware
app.use(express.json());

// Test routes
app.get('/api/resolve/:domainName', testController.resolveDomain);
app.get('/api/profile/:domainName', testController.getDomainProfile);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Test server running on port ${PORT}`);
  logger.info(`API available at http://localhost:${PORT}/api`);
  logger.info('Using mock Bitcoin service with test data');
  logger.info('Available test domains: example.domain, test.domain');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
