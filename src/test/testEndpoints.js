const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_DOMAIN = 'example.domain';

/**
 * Test the domain resolution endpoint
 */
async function testResolveDomain() {
  try {
    console.log(`Testing domain resolution for: ${TEST_DOMAIN}`);
    const response = await axios.get(`${API_BASE_URL}/resolve/${TEST_DOMAIN}`);
    console.log('Resolution successful!');
    console.log('IP Address:', response.data.ip);
    return response.data;
  } catch (error) {
    console.error('Resolution failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * Test the domain profile endpoint
 */
async function testDomainProfile() {
  try {
    console.log(`Testing domain profile for: ${TEST_DOMAIN}`);
    const response = await axios.get(`${API_BASE_URL}/profile/${TEST_DOMAIN}`);
    console.log('Profile retrieval successful!');
    console.log('Profile data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Profile retrieval failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting DNS server tests...');
  
  // Test domain resolution
  const resolutionResult = await testResolveDomain();
  
  // Test domain profile
  const profileResult = await testDomainProfile();
  
  console.log('Tests completed!');
}

// Run the tests
runTests().catch(console.error);
