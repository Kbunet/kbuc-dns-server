const CryptoJS = require('crypto-js');
const logger = require('./logger');

/**
 * Converts a domain name to HASH160 format (RIPEMD160(SHA256(input)))
 * This is the same algorithm used for Bitcoin addresses
 * 
 * @param {string} domainName - The domain name to convert
 * @returns {string} - The HASH160 value as a hex string
 */
function domainToHash160(domainName) {
  try {
    // Convert domain name to lowercase
    const normalizedDomain = domainName.toLowerCase();
    
    // Convert to UTF-8 bytes
    const wordArray = CryptoJS.enc.Utf8.parse(normalizedDomain);
    
    // First apply SHA-256
    const sha256Hash = CryptoJS.SHA256(wordArray);
    
    // Then apply RIPEMD-160 to get HASH160
    const hash160 = CryptoJS.RIPEMD160(sha256Hash);
    
    // Convert to hex string
    return hash160.toString(CryptoJS.enc.Hex);
  } catch (error) {
    logger.error(`Error converting domain to HASH160: ${error.message}`);
    throw error;
  }
}

/**
 * Converts a hex string to a Buffer
 * 
 * @param {string} hexString - The hex string to convert
 * @returns {Buffer} - The resulting Buffer
 */
function hexToBuffer(hexString) {
  // Ensure the hex string has the correct format
  const normalizedHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  return Buffer.from(normalizedHex, 'hex');
}

/**
 * Converts a Buffer to a hex string
 * 
 * @param {Buffer} buffer - The buffer to convert
 * @returns {string} - The resulting hex string with '0x' prefix
 */
function bufferToHex(buffer) {
  return '0x' + buffer.toString('hex');
}

module.exports = {
  domainToHash160,
  hexToBuffer,
  bufferToHex
};
