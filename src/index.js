require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const routes = require('./routes');
const refreshService = require('./services/refreshService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');

    // Start the refresh service after MongoDB connection is established
    logger.info(`Starting refresh service with interval of ${process.env.REFRESH_INTERVAL_MINUTES || 25} minutes`);
    const refreshInterval = process.env.REFRESH_INTERVAL_MINUTES 
      ? parseInt(process.env.REFRESH_INTERVAL_MINUTES) * 60 * 1000 
      : 15 * 60 * 1000; // Default: 15 minutes
    
    refreshService.refreshInterval = refreshInterval;
    refreshService.start();
    logger.info(`Domain refresh service started with interval of ${refreshInterval / 60000} minutes`);
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Stop the refresh service
  refreshService.stop();
  
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Stop the refresh service
  refreshService.stop();
  
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});
