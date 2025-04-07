const logger = require('../utils/logger');
const cryptoUtils = require('../utils/cryptoUtils');

// Mock data for testing
const mockDomains = {
  'example.domain': {
    profileId: '0x1234567890abcdef',
    name: 'example.domain',
    link: '192.168.1.100',
    owner: '0xabcdef1234567890',
    signer: '0x9876543210abcdef',
    appData: '0xdata123456',
    rps: 95,
    ownedProfilesCount: 3,
    isRented: false,
    tenant: '',
    rentedAt: 0,
    duration: 0,
    isCandidate: true,
    isBanned: false,
    missed: 0,
    isDomain: true,
    offeredAt: 0,
    bidAmount: 0,
    buyer: '',
    balance: 1000,
    bidTarget: '',
    ownedProfiles: [
      {
        id: '0xsubdomain1',
        name: 'subdomain1.example.domain',
        link: '192.168.1.101',
        appData: '0xsubdata1',
        owner: '0xabcdef1234567890',
        rps: 80,
        ownershipType: 'owned',
        tenant: '',
        rentedAt: 0,
        duration: 0,
        isCandidate: false,
        isBanned: false,
        isDomain: true,
        offeredAt: 0,
        bidAmount: 0,
        buyer: '',
        balance: 500,
        bidTarget: ''
      },
      {
        id: '0xsubdomain2',
        name: 'subdomain2.example.domain',
        link: '192.168.1.102',
        appData: '0xsubdata2',
        owner: '0xabcdef1234567890',
        rps: 75,
        ownershipType: 'owned',
        tenant: '',
        rentedAt: 0,
        duration: 0,
        isCandidate: false,
        isBanned: false,
        isDomain: true,
        offeredAt: 0,
        bidAmount: 0,
        buyer: '',
        balance: 300,
        bidTarget: ''
      }
    ]
  },
  'test.domain': {
    profileId: '0xabcdef1234567890',
    name: 'test.domain',
    link: '192.168.1.200',
    owner: '0x1234567890abcdef',
    signer: '0xfedcba0987654321',
    appData: '0xdata654321',
    rps: 85,
    ownedProfilesCount: 1,
    isRented: true,
    tenant: '0x2468ace13579bdf',
    rentedAt: 1000,
    duration: 10000,
    isCandidate: false,
    isBanned: false,
    missed: 0,
    isDomain: true,
    offeredAt: 0,
    bidAmount: 0,
    buyer: '',
    balance: 2000,
    bidTarget: '',
    ownedProfiles: [
      {
        id: '0xsubdomain3',
        name: 'subdomain.test.domain',
        link: '192.168.1.201',
        appData: '0xsubdata3',
        owner: '0x1234567890abcdef',
        rps: 70,
        ownershipType: 'rented',
        tenant: '0x13579bdf2468ace',
        rentedAt: 1100,
        duration: 5000,
        isCandidate: false,
        isBanned: false,
        isDomain: true,
        offeredAt: 0,
        bidAmount: 0,
        buyer: '',
        balance: 800,
        bidTarget: ''
      }
    ]
  }
};

// Map of domain names to profile IDs
const domainToProfileId = {
  'example.domain': '0x1234567890abcdef',
  'test.domain': '0xabcdef1234567890'
};

// Map of domain hashes to profile IDs
const domainHashToProfileId = {};

// Initialize the domain hash mapping
Object.keys(mockDomains).forEach(domainName => {
  const hash = cryptoUtils.domainToHash160(domainName);
  domainHashToProfileId[hash] = domainToProfileId[domainName];
});

/**
 * Get profile by domain name hash
 * @param {string} domainName - Domain name to look up
 * @returns {Promise<Object|null>} - Profile object or null if not found
 */
async function getProfileIdByName(domainName) {
  logger.info(`[MOCK] Getting profile for domain: ${domainName}`);
  
  // Convert domain name to HASH160
  const domainHash = cryptoUtils.domainToHash160(domainName);
  logger.info(`[MOCK] Converted domain ${domainName} to HASH160: ${domainHash}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Get the profile ID from the hash
  const profileId = domainHashToProfileId[domainHash] || domainToProfileId[domainName];
  
  if (!profileId) {
    return null;
  }
  
  // Find the domain with the matching profile ID
  for (const domain of Object.values(mockDomains)) {
    if (domain.profileId === profileId) {
      return domain;
    }
  }
  
  return null;
}

// Keep the getProfile function for backward compatibility
async function getProfile(profileId) {
  logger.info(`[MOCK] Getting profile for ID: ${profileId}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Find the domain with the matching profile ID
  for (const domain of Object.values(mockDomains)) {
    if (domain.profileId === profileId) {
      return domain;
    }
  }
  
  return null;
}

module.exports = {
  getProfileIdByName,
  getProfile
};
