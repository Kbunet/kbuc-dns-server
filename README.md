# DNS Server for Bitcoin Domains

A Node.js server that resolves domain names using a Bitcoin node. This server provides two main endpoints:

1. **Name Resolution Endpoint**: Resolves a domain name to an IP address
2. **Domain Profile Endpoint**: Returns complete information about a domain

## Features

- Multi-level caching system (memory cache for fast responses)
- MongoDB integration for persistent storage
- Bitcoin node integration via RPC
- Logging system for monitoring and debugging

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Bitcoin node with RPC access

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on the `.env.example` file:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration values:

```
# Server Configuration
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/dns-server

# Bitcoin Node Configuration
BITCOIN_RPC_URL=http://localhost:8332
BITCOIN_RPC_USER=your_rpc_username
BITCOIN_RPC_PASSWORD=your_rpc_password

# Cache Configuration
DOMAIN_CACHE_TTL=3600  # Time in seconds for domain cache entries
NOT_FOUND_CACHE_TTL=1800  # Time in seconds for not found cache entries
```

## Usage

Start the server:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## API Endpoints

### 1. Resolve Domain Name

```
GET /api/resolve/:domainName
```

Returns the IP address for the specified domain name.

**Example Response:**
```json
{
  "ip": "192.168.1.1"
}
```

### 2. Get Domain Profile

```
GET /api/profile/:domainName
```

Returns complete information about the domain.

**Example Response:**
```json
{
  "profileId": "abc123",
  "name": "example.com",
  "link": "192.168.1.1",
  "owner": "owner123",
  "signer": "signer456",
  "appData": "appData789",
  "rps": 10,
  "isRented": false,
  "isDomain": true,
  ...
}
```

## Resolution Process

1. Check if domain is in the "not found" cache
2. Check if domain is in the available domains cache
3. Query the MongoDB database
4. Query the Bitcoin node
5. Cache the result appropriately

## License

MIT
