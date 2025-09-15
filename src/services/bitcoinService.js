const axios = require('axios');
const logger = require('../utils/logger');
const cryptoUtils = require('../utils/cryptoUtils');

// Bitcoin RPC configuration
const rpcUrl = process.env.BITCOIN_RPC_URL;
const rpcUser = process.env.BITCOIN_RPC_USER;
const rpcPassword = process.env.BITCOIN_RPC_PASSWORD;

// Create basic auth header
const auth = {
  username: rpcUser,
  password: rpcPassword
};

/**
 * Make an RPC call to the Bitcoin node
 * @param {string} method - RPC method name
 * @param {Array} params - RPC method parameters
 * @returns {Promise<any>} - RPC response
 */
async function rpcCall(method, params = []) {
  try {
    const response = await axios.post(rpcUrl, {
      jsonrpc: '1.0',
      id: 'dns-server',
      method,
      params
    }, {
      auth,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.error) {
      throw new Error(`RPC Error: ${JSON.stringify(response.data.error)}`);
    }

    return response.data.result;
  } catch (error) {
    logger.error(`Bitcoin RPC call failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get profile by domain name hash
 * @param {string} domainName - Domain name to look up
 * @returns {Promise<Object|null>} - Profile object or null if not found
 */
async function getProfileIdByName(domainName) {
  try {
    // Convert domain name to HASH160 format
    const domainHash = cryptoUtils.domainToHash160(domainName);
    logger.info(`Converted domain ${domainName} to HASH160: ${domainHash}`);
    
    // Call the RPC method with the HASH160 value directly
    const profile = await rpcCall('getprofile', [domainHash]);
    
    // Return the full profile object
    return profile;
  } catch (error) {
    logger.error(`Failed to get profile for domain ${domainName}: ${error.message}`);
    return null;
  }
}

/**
 * Get profile information by profile ID
 * @param {string} profileId - Profile ID to look up
 * @returns {Promise<Object|null>} - Profile object or null if not found
 */
async function getProfile(profileId) {
  try {
    const profile = await rpcCall('getprofile', [profileId]);
    
    // Ensure the profile is a domain
    if (!profile || profile.isDomain !== true) {
      logger.info(`Profile ${profileId} is not a domain`);
      return null;
    }
    
    return profile;
  } catch (error) {
    logger.error(`Failed to get profile ${profileId}: ${error.message}`);
    return null;
  }
}

/**
 * Get all domain profiles from the Bitcoin node
 * @returns {Promise<Object>} - Object containing domains array and total count
 */
async function getDomainProfiles() {
  try {
    const result = await rpcCall('getdomainprofiles', []);
    logger.info(`Retrieved ${result.total} domain profiles from Bitcoin node`);
    return result;
  } catch (error) {
    logger.error(`Failed to get domain profiles: ${error.message}`);
    throw error;
  }
}

module.exports = {
  rpcCall,
  getProfileIdByName,
  getProfile,
  getDomainProfiles
};
