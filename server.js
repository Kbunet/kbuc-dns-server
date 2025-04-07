require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');
const routes = require('./src/routes');
const refreshService = require('./src/services/refreshService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3100;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    
    // Start the refresh service after MongoDB connection is established
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add a manual refresh endpoint
app.post('/api/refresh', async (req, res) => {
  try {
    logger.info('Manual refresh requested');
    
    // If a specific domain is provided, refresh only that domain
    if (req.body && req.body.domain) {
      const domainController = require('./src/controllers/domainController');
      const result = await domainController.refreshDomain(req.body.domain);
      
      if (result) {
        return res.status(200).json({ 
          message: `Domain ${req.body.domain} refreshed successfully`,
          domain: result
        });
      } else {
        return res.status(404).json({ 
          message: `Domain ${req.body.domain} not found or could not be refreshed` 
        });
      }
    }
    
    // Otherwise, refresh all domains
    refreshService.refreshAllDomains();
    res.status(202).json({ message: 'Refresh process started' });
  } catch (error) {
    logger.error('Error during manual refresh:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API available at http://localhost:${PORT}/api`);
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
