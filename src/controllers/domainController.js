const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const Domain = require('../models/domain');
const bitcoinService = require('../services/bitcoinService');
const cryptoUtils = require('../utils/cryptoUtils'); // Import cryptoUtils

// Initialize caches
const domainCache = new NodeCache({ stdTTL: process.env.DOMAIN_CACHE_TTL || 3600 });
const notFoundCache = new NodeCache({ stdTTL: process.env.NOT_FOUND_CACHE_TTL || 1800 });

/**
 * Get the domain cache instance
 * @returns {NodeCache} - Domain cache instance
 */
exports.getDomainCache = () => domainCache;

/**
 * Get the not found cache instance
 * @returns {NodeCache} - Not found cache instance
 */
exports.getNotFoundCache = () => notFoundCache;

/**
 * Resolve domain name to IP address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.resolveDomain = async (req, res) => {
  try {
    const { domainName } = req.params;
    
    if (!domainName) {
      return res.status(400).json({ error: 'Domain name is required' });
    }

    logger.info(`Resolving domain: ${domainName}`);
    
    // Check if domain is in the not found cache
    if (notFoundCache.has(domainName)) {
      logger.info(`Domain ${domainName} found in not-found cache`);
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    // Check if domain is in the available domains cache
    if (domainCache.has(domainName)) {
      const cachedDomain = domainCache.get(domainName);
      logger.info(`Domain ${domainName} found in cache, IP: ${cachedDomain.link}`);
      return res.json({ ip: cachedDomain.link });
    }
    
    // Check if domain is in the database
    let domain = await Domain.findOne({ name: domainName });
    
    if (domain) {
      logger.info(`Domain ${domainName} found in database, IP: ${domain.link}`);
      // Add to cache
      domainCache.set(domainName, domain);
      return res.json({ ip: domain.link });
    }
    
    // Query the Bitcoin node
    try {
      // Get profile directly from the Bitcoin node
      const profile = await bitcoinService.getProfileIdByName(domainName);
      
      if (!profile || profile.isDomain !== true) {
        logger.info(`Domain ${domainName} not found in Bitcoin node or is not a domain`);
        // Cache as not found
        notFoundCache.set(domainName, true);
        return res.status(404).json({ error: 'Domain not found' });
      }
      
      // Save to database
      domain = await Domain.create({
        profileId: cryptoUtils.domainToHash160(domainName), // Use the hash as the profileId
        name: domainName,
        link: profile.link,
        owner: profile.owner,
        signer: profile.signer,
        appData: profile.appData,
        rps: profile.rps,
        isRented: profile.isRented,
        tenant: profile.tenant,
        rentedAt: profile.rentedAt,
        duration: profile.duration,
        isCandidate: profile.isCandidate,
        isBanned: profile.isBanned,
        missed: profile.missed,
        isDomain: profile.isDomain,
        offeredAt: profile.offeredAt,
        bidAmount: profile.bidAmount,
        buyer: profile.buyer,
        balance: profile.balance,
        bidTarget: profile.bidTarget,
        ownedProfiles: profile.ownedProfiles || []
      });
      
      // Add to cache
      domainCache.set(domainName, domain);
      
      logger.info(`Domain ${domainName} found in Bitcoin node, IP: ${domain.link}`);
      return res.json({ ip: domain.link });
    } catch (error) {
      logger.error(`Error querying Bitcoin node: ${error.message}`);
      // Cache as not found
      notFoundCache.set(domainName, true);
      return res.status(404).json({ error: 'Domain not found' });
    }
  } catch (error) {
    logger.error(`Error resolving domain: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get domain profile information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDomainProfile = async (req, res) => {
  try {
    const { domainName } = req.params;
    
    if (!domainName) {
      return res.status(400).json({ error: 'Domain name is required' });
    }
    
    logger.info(`Getting profile for domain: ${domainName}`);
    
    // Check if domain is in the not found cache
    if (notFoundCache.has(domainName)) {
      logger.info(`Domain ${domainName} found in not-found cache`);
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    // Check if domain is in the available domains cache
    if (domainCache.has(domainName)) {
      const cachedDomain = domainCache.get(domainName);
      logger.info(`Domain ${domainName} found in cache`);
      return res.json(cachedDomain);
    }
    
    // Check if domain is in the database
    let domain = await Domain.findOne({ name: domainName });
    
    if (domain) {
      logger.info(`Domain ${domainName} found in database`);
      // Add to cache
      domainCache.set(domainName, domain);
      return res.json(domain);
    }
    
    // Query the Bitcoin node
    try {
      // Get profile directly from the Bitcoin node
      const profile = await bitcoinService.getProfileIdByName(domainName);
      
      if (!profile || profile.isDomain !== true) {
        logger.info(`Domain ${domainName} not found in Bitcoin node or is not a domain`);
        // Cache as not found
        notFoundCache.set(domainName, true);
        return res.status(404).json({ error: 'Domain not found' });
      }
      
      // Save to database
      domain = await Domain.create({
        profileId: cryptoUtils.domainToHash160(domainName), // Use the hash as the profileId
        name: domainName,
        link: profile.link,
        owner: profile.owner,
        signer: profile.signer,
        appData: profile.appData,
        rps: profile.rps,
        isRented: profile.isRented,
        tenant: profile.tenant,
        rentedAt: profile.rentedAt,
        duration: profile.duration,
        isCandidate: profile.isCandidate,
        isBanned: profile.isBanned,
        missed: profile.missed,
        isDomain: profile.isDomain,
        offeredAt: profile.offeredAt,
        bidAmount: profile.bidAmount,
        buyer: profile.buyer,
        balance: profile.balance,
        bidTarget: profile.bidTarget,
        ownedProfiles: profile.ownedProfiles || []
      });
      
      // Add to cache
      domainCache.set(domainName, domain);
      
      logger.info(`Domain ${domainName} found in Bitcoin node`);
      return res.json(domain);
    } catch (error) {
      logger.error(`Error querying Bitcoin node: ${error.message}`);
      // Cache as not found
      notFoundCache.set(domainName, true);
      return res.status(404).json({ error: 'Domain not found' });
    }
  } catch (error) {
    logger.error(`Error getting domain profile: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Refresh a domain from the Bitcoin node
 * @param {string} domainName - Domain name to refresh
 * @returns {Promise<Object|null>} - Updated domain or null if not found
 */
exports.refreshDomain = async (domainName) => {
  try {
    logger.info(`Manually refreshing domain: ${domainName}`);
    
    // Check if domain is in the database
    let domain = await Domain.findOne({ name: domainName });
    
    if (!domain) {
      logger.info(`Domain ${domainName} not found in database, cannot refresh`);
      return null;
    }
    
    // Query the Bitcoin node
    try {
      // Get profile directly from the Bitcoin node
      const profile = await bitcoinService.getProfileIdByName(domainName);
      
      if (!profile || profile.isDomain !== true) {
        logger.info(`Domain ${domainName} no longer exists in Bitcoin node or is not a domain`);
        
        // Remove from cache if present
        if (domainCache.has(domainName)) {
          domainCache.del(domainName);
        }
        
        // Add to not found cache
        notFoundCache.set(domainName, true);
        
        return null;
      }
      
      // Update domain in database
      domain.link = profile.link;
      domain.owner = profile.owner;
      domain.signer = profile.signer;
      domain.appData = profile.appData;
      domain.rps = profile.rps;
      domain.isRented = profile.isRented;
      domain.tenant = profile.tenant;
      domain.rentedAt = profile.rentedAt;
      domain.duration = profile.duration;
      domain.isCandidate = profile.isCandidate;
      domain.isBanned = profile.isBanned;
      domain.missed = profile.missed;
      domain.isDomain = profile.isDomain;
      domain.offeredAt = profile.offeredAt;
      domain.bidAmount = profile.bidAmount;
      domain.buyer = profile.buyer;
      domain.balance = profile.balance;
      domain.bidTarget = profile.bidTarget;
      domain.ownedProfiles = profile.ownedProfiles || [];
      
      await domain.save();
      
      // Update cache
      if (domainCache.has(domainName)) {
        domainCache.set(domainName, domain);
      }
      
      logger.info(`Domain ${domainName} refreshed successfully`);
      return domain;
    } catch (error) {
      logger.error(`Error refreshing domain ${domainName} from Bitcoin node: ${error.message}`);
      return domain; // Return the existing domain without updates
    }
  } catch (error) {
    logger.error(`Error in refreshDomain: ${error.message}`);
    return null;
  }
};
