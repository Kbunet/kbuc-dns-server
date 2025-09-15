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
      // Get all domains from the Bitcoin node using getdomainprofiles
      const domainProfiles = await bitcoinService.getDomainProfiles();
      logger.info(`Retrieved ${domainProfiles.total} domains from Bitcoin node`);
      
      // Get all existing domains from the database for comparison
      const existingDomains = await Domain.find({});
      logger.info(`Found ${existingDomains.length} existing domains in database`);
      
      // Create a map of existing domains for quick lookup
      const existingDomainMap = {};
      existingDomains.forEach(domain => {
        existingDomainMap[domain.name] = domain;
      });
      
      let updatedCount = 0;
      let addedCount = 0;
      let errorCount = 0;
      
      // Process domains from the Bitcoin node
      for (const domainProfile of domainProfiles.domains) {
        try {
          const { profile_id, name, ip, rps, height, extra, owner } = domainProfile;
          
          // In getdomainprofiles, IP is in the 'ip' field, but our model uses 'link'
          // Handle empty IP case - set a default or placeholder value if IP is empty
          const linkValue = ip || '0.0.0.0'; // Use a placeholder IP if empty
          
          // Store additional data as JSON string since appData is defined as String in the model
          const appDataString = JSON.stringify({
            rps,
            height,
            extra
          });
          
          // Check if the domain already exists in our database
          if (existingDomainMap[name]) {
            // Update existing domain
            const domain = existingDomainMap[name];
            
            // Update fields
            domain.profileId = profile_id;
            domain.link = linkValue;
            domain.owner = owner;
            domain.isBanned = false; // Reset banned status as domain exists
            domain.isDomain = true;
            domain.appData = appDataString;
            
            // Update numeric fields directly if they exist in the schema
            if (typeof domain.rps !== 'undefined') {
              domain.rps = rps;
            }
            
            await domain.save();
            
            // Update cache if present
            if (domainController.getDomainCache().has(name)) {
              domainController.getDomainCache().set(name, domain);
              logger.info(`Updated ${name} in domain cache`);
            }
            
            updatedCount++;
            logger.info(`Updated domain: ${name}`);
          } else {
            // Create new domain
            const newDomain = new Domain({
              name,
              profileId: profile_id,
              link: linkValue,
              owner,
              isDomain: true,
              isBanned: false,
              appData: appDataString,
              rps: rps // Add direct field if it exists in the schema
            });
            
            await newDomain.save();
            addedCount++;
            logger.info(`Added new domain: ${name}`);
          }
        } catch (error) {
          logger.error(`Error processing domain ${domainProfile.name}: ${error.message}`);
          errorCount++;
        }
        
        // Small delay between operations to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      logger.info(`Domain refresh completed: ${updatedCount} updated, ${addedCount} added, ${errorCount} errors`);
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
