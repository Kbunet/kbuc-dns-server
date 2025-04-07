const logger = require('../utils/logger');
const Domain = require('../models/domain');
const bitcoinService = require('./bitcoinService');
const NodeCache = require('node-cache');

// Get cache instances from domainController
const domainController = require('../controllers/domainController');

/**
 * Service to periodically refresh domain data from the Bitcoin node
 */
class RefreshService {
  constructor(refreshInterval = 15 * 60 * 1000) { // Default: 15 minutes
    this.refreshInterval = refreshInterval;
    this.refreshTimer = null;
    this.isRefreshing = false;
  }

  /**
   * Start the periodic refresh service
   */
  start() {
    logger.info(`Starting domain refresh service with interval of ${this.refreshInterval / 60000} minutes`);
    
    // Perform an initial refresh
    this.refreshAllDomains();
    
    // Set up periodic refresh
    this.refreshTimer = setInterval(() => {
      this.refreshAllDomains();
    }, this.refreshInterval);
  }

  /**
   * Stop the periodic refresh service
   */
  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      logger.info('Domain refresh service stopped');
    }
  }

  /**
   * Refresh all domains in the database
   */
  async refreshAllDomains() {
    if (this.isRefreshing) {
      logger.info('Domain refresh already in progress, skipping');
      return;
    }

    this.isRefreshing = true;
    logger.info('Starting domain refresh process');

    try {
      // Get all domains from the database
      const domains = await Domain.find({});
      logger.info(`Found ${domains.length} domains to refresh`);

      let updatedCount = 0;
      let errorCount = 0;

      // Process domains in batches to avoid overwhelming the Bitcoin node
      for (const domain of domains) {
        try {
          await this.refreshDomain(domain);
          updatedCount++;
        } catch (error) {
          logger.error(`Error refreshing domain ${domain.name}: ${error.message}`);
          errorCount++;
        }
        
        // Small delay between requests to avoid overwhelming the Bitcoin node
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info(`Domain refresh completed: ${updatedCount} updated, ${errorCount} errors`);
    } catch (error) {
      logger.error(`Error during domain refresh: ${error.message}`);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Refresh a single domain
   * @param {Object} domain - Domain object from database
   */
  async refreshDomain(domain) {
    logger.info(`Refreshing domain: ${domain.name}`);

    try {
      // Get updated profile from Bitcoin node
      const profile = await bitcoinService.getProfileIdByName(domain.name);

      if (!profile || profile.isDomain !== true) {
        logger.warn(`Domain ${domain.name} no longer exists or is not a domain in the Bitcoin node`);
        // We'll keep it in the database but update its status
        domain.isBanned = true;
        await domain.save();
        
        // Remove from cache if present
        if (domainController.getDomainCache().has(domain.name)) {
          domainController.getDomainCache().del(domain.name);
          logger.info(`Removed ${domain.name} from domain cache`);
        }
        
        return;
      }

      // Check if any data has changed
      let hasChanged = false;
      
      // Fields to check for changes
      const fieldsToCheck = [
        'link', 'owner', 'signer', 'isRented', 'tenant', 
        'rentedAt', 'duration', 'isCandidate', 'isBanned', 
        'isDomain', 'offeredAt', 'bidAmount', 'buyer', 
        'balance', 'bidTarget'
      ];

      for (const field of fieldsToCheck) {
        if (JSON.stringify(domain[field]) !== JSON.stringify(profile[field])) {
          domain[field] = profile[field];
          hasChanged = true;
        }
      }

      // Check appData separately as it might be complex
      if (JSON.stringify(domain.appData) !== JSON.stringify(profile.appData)) {
        domain.appData = profile.appData;
        hasChanged = true;
      }

      // Check ownedProfiles separately
      if (JSON.stringify(domain.ownedProfiles) !== JSON.stringify(profile.ownedProfiles || [])) {
        domain.ownedProfiles = profile.ownedProfiles || [];
        hasChanged = true;
      }

      if (hasChanged) {
        logger.info(`Domain ${domain.name} has changed, updating database`);
        await domain.save();
        
        // Update cache if present
        if (domainController.getDomainCache().has(domain.name)) {
          domainController.getDomainCache().set(domain.name, domain);
          logger.info(`Updated ${domain.name} in domain cache`);
        }
      } else {
        logger.info(`No changes detected for domain ${domain.name}`);
      }
    } catch (error) {
      logger.error(`Error refreshing domain ${domain.name}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new RefreshService();
