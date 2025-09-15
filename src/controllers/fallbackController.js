const logger = require('../utils/logger');
const Domain = require('../models/domain');
const { resolveDomainWithDNS } = require('../utils/dnsUtils');
const cryptoUtils = require('../utils/cryptoUtils');

// Get cache instances from domainController
const domainController = require('./domainController');

/**
 * Try to resolve a domain using standard DNS as fallback
 * @param {string} domainName - Domain name to resolve
 * @returns {Promise<Object|null>} - Object with IP address or null if not found
 */
async function tryFallbackResolution(domainName) {
  try {
    logger.info(`Attempting fallback resolution for ${domainName} with standard DNS`);
    
    // Try to resolve with standard DNS
    const standardDnsIp = await resolveDomainWithDNS(domainName);
    
    if (!standardDnsIp) {
      logger.info(`Standard DNS could not resolve ${domainName}`);
      return null;
    }
    
    logger.info(`Domain ${domainName} resolved via standard DNS to ${standardDnsIp}`);
    
    // Create a domain entry for this standard DNS resolution
    try {
      const domain = await Domain.create({
        profileId: cryptoUtils.domainToHash160(domainName), // Use the hash as the profileId
        name: domainName,
        link: standardDnsIp,
        isDomain: true,
        isBanned: false,
        appData: JSON.stringify({ source: 'standard_dns' })
      });
      
      // Add to domain cache
      domainController.getDomainCache().set(domainName, domain);
      
      return { ip: standardDnsIp, domain };
    } catch (error) {
      logger.error(`Error saving standard DNS resolution for ${domainName}: ${error.message}`);
      // Even if we can't save to the database, return the IP
      return { ip: standardDnsIp };
    }
  } catch (error) {
    logger.error(`Error in fallback resolution for ${domainName}: ${error.message}`);
    return null;
  }
}

module.exports = {
  tryFallbackResolution
};
