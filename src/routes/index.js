const express = require('express');
const domainController = require('../controllers/domainController');

const router = express.Router();

// Domain name resolution endpoint
router.get('/resolve/:domainName', domainController.resolveDomain);

// Domain profile endpoint
router.get('/profile/:domainName', domainController.getDomainProfile);

// Domain refresh endpoint
router.post('/refresh/:domainName', async (req, res) => {
  try {
    const { domainName } = req.params;
    
    if (!domainName) {
      return res.status(400).json({ error: 'Domain name is required' });
    }
    
    const result = await domainController.refreshDomain(domainName);
    
    if (result) {
      return res.status(200).json({ 
        message: `Domain ${domainName} refreshed successfully`,
        domain: result
      });
    } else {
      return res.status(404).json({ 
        message: `Domain ${domainName} not found or could not be refreshed` 
      });
    }
  } catch (error) {
    console.error(`Error refreshing domain: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
