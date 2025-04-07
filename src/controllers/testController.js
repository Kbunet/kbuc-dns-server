const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const Domain = require('../models/domain');
const mockBitcoinService = require('../services/mockBitcoinService');
const cryptoUtils = require('../utils/cryptoUtils');

// Initialize caches
const domainCache = new NodeCache({ stdTTL: process.env.DOMAIN_CACHE_TTL || 3600 });
const notFoundCache = new NodeCache({ stdTTL: process.env.NOT_FOUND_CACHE_TTL || 1800 });

/**
 * Resolve domain name to IP address using mock data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.resolveDomain = async (req, res) => {
  try {
    const { domainName } = req.params;
    
    if (!domainName) {
      return res.status(400).json({ error: 'Domain name is required' });
    }

    logger.info(`[TEST] Resolving domain: ${domainName}`);
    
    // Check if domain is in the not found cache
    if (notFoundCache.has(domainName)) {
      logger.info(`[TEST] Domain ${domainName} found in not-found cache`);
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    // Check if domain is in the available domains cache
    if (domainCache.has(domainName)) {
      const cachedDomain = domainCache.get(domainName);
      logger.info(`[TEST] Domain ${domainName} found in cache, IP: ${cachedDomain.link}`);
      return res.json({ ip: cachedDomain.link });
    }
    
    // Query the mock Bitcoin node
    try {
      // Get profile directly from the mock Bitcoin node
      const profile = await mockBitcoinService.getProfileIdByName(domainName);
      
      if (!profile || profile.isDomain !== true) {
        logger.info(`[TEST] Domain ${domainName} not found in mock Bitcoin node or is not a domain`);
        // Cache as not found
        notFoundCache.set(domainName, true);
        return res.status(404).json({ error: 'Domain not found' });
      }
      
      // Add to cache
      domainCache.set(domainName, profile);
      
      logger.info(`[TEST] Domain ${domainName} found in mock Bitcoin node, IP: ${profile.link}`);
      return res.json({ ip: profile.link });
    } catch (error) {
      logger.error(`[TEST] Error querying mock Bitcoin node: ${error.message}`);
      // Cache as not found
      notFoundCache.set(domainName, true);
      return res.status(404).json({ error: 'Domain not found' });
    }
  } catch (error) {
    logger.error(`[TEST] Error resolving domain: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get domain profile information using mock data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDomainProfile = async (req, res) => {
  try {
    const { domainName } = req.params;
    
    if (!domainName) {
      return res.status(400).json({ error: 'Domain name is required' });
    }
    
    logger.info(`[TEST] Getting profile for domain: ${domainName}`);
    
    // Check if domain is in the not found cache
    if (notFoundCache.has(domainName)) {
      logger.info(`[TEST] Domain ${domainName} found in not-found cache`);
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    // Check if domain is in the available domains cache
    if (domainCache.has(domainName)) {
      const cachedDomain = domainCache.get(domainName);
      logger.info(`[TEST] Domain ${domainName} found in cache`);
      return res.json(cachedDomain);
    }
    
    // Query the mock Bitcoin node
    try {
      // Get profile directly from the mock Bitcoin node
      const profile = await mockBitcoinService.getProfileIdByName(domainName);
      
      if (!profile || profile.isDomain !== true) {
        logger.info(`[TEST] Domain ${domainName} not found in mock Bitcoin node or is not a domain`);
        // Cache as not found
        notFoundCache.set(domainName, true);
        return res.status(404).json({ error: 'Domain not found' });
      }
      
      // Add to cache
      domainCache.set(domainName, profile);
      
      logger.info(`[TEST] Domain ${domainName} found in mock Bitcoin node`);
      return res.json(profile);
    } catch (error) {
      logger.error(`[TEST] Error querying mock Bitcoin node: ${error.message}`);
      // Cache as not found
      notFoundCache.set(domainName, true);
      return res.status(404).json({ error: 'Domain not found' });
    }
  } catch (error) {
    logger.error(`[TEST] Error getting domain profile: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
