const dns = require('dns');
const { promisify } = require('util');
const logger = require('./logger');

// Promisify DNS lookup
const lookup = promisify(dns.lookup);

/**
 * Resolve a domain name using the standard DNS system
 * @param {string} domainName - Domain name to resolve
 * @returns {Promise<string|null>} - IP address or null if not found
 */
async function resolveDomainWithDNS(domainName) {
  try {
    logger.info(`Attempting to resolve ${domainName} with standard DNS`);
    const result = await lookup(domainName);
    logger.info(`Standard DNS resolved ${domainName} to ${result.address}`);
    return result.address;
  } catch (error) {
    logger.info(`Standard DNS could not resolve ${domainName}: ${error.message}`);
    return null;
  }
}

module.exports = {
  resolveDomainWithDNS
};
