# Safety Net DAO API Documentation

This document describes the REST and GraphQL APIs for the Safety Net DAO platform.

## Authentication

All protected endpoints require authentication via headers:
- `x-user-id`: The authenticated user's ID
- `x-user-role`: The user's role (USER, VALIDATOR, ADMIN)

## REST API Endpoints

### Claims API

#### GET /api/claims
Get all claims with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (max: 50, default: 10)
- `status` (string): Filter by claim status
- `category` (string): Filter by claim category
- `userId` (string): Filter by claim owner

**Response:**
```json
{
  "claims": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### POST /api/claims
Create a new claim.

**Body:**
```json
{
  "title": "Emergency Medical Claim",
  "description": "Detailed description...",
  "category": "MEDICAL",
  "requestedAmount": 5000,
  "attachments": ["https://example.com/doc1.pdf"],
  "evidenceNotes": "Additional notes..."
}
```

#### GET /api/claims/[id]
Get specific claim details.

#### PUT /api/claims/[id]
Update claim (draft only, owner only).

#### DELETE /api/claims/[id]
Delete claim (draft only, owner only).

#### POST /api/claims/[id]/review
Review claim (admin/validator only).

**Body:**
```json
{
  "status": "APPROVED",
  "reviewNotes": "Claim approved after verification",
  "approvedAmount": 5000
}
```

#### GET /api/claims/[id]/vote
Get user's vote on claim.

#### POST /api/claims/[id]/vote
Vote on claim (community voting only).

**Body:**
```json
{
  "vote": "APPROVE",
  "justification": "Valid claim with proper documentation"
}
```

### Governance API

#### GET /api/governance
Get all proposals with filtering and pagination.

**Query Parameters:**
- `page`, `limit`: Pagination
- `status` (string): Filter by proposal status
- `type` (string): Filter by proposal type
- `category` (string): Filter by category

#### POST /api/governance
Create new proposal.

**Body:**
```json
{
  "title": "Update Treasury Allocation Policy",
  "description": "Detailed proposal description...",
  "type": "POLICY_CHANGE",
  "category": "Treasury Management",
  "proposedChanges": {
    "maxClaimAmount": 10000,
    "votingThreshold": 0.6
  },
  "requiredQuorum": 0.6,
  "votingPeriodDays": 7
}
```

#### GET /api/governance/[id]
Get specific proposal with vote statistics.

#### PUT /api/governance/[id]
Update proposal (draft only, owner only).

#### DELETE /api/governance/[id]
Delete proposal (draft only, owner only).

#### GET /api/governance/[id]/vote
Get user's vote on proposal.

#### POST /api/governance/[id]/vote
Vote on proposal.

**Body:**
```json
{
  "vote": "FOR",
  "reason": "This proposal will improve efficiency",
  "votingPower": 5
}
```

### NFT API

#### GET /api/nfts
Get all NFTs with filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `type` (string): Filter by NFT type
- `tier` (string): Filter by tier
- `ownerId` (string): Filter by owner

#### POST /api/nfts
Create NFT template (admin only).

**Body:**
```json
{
  "name": "Gold Membership",
  "description": "Premium membership NFT",
  "image": "https://example.com/gold-nft.png",
  "type": "MEMBERSHIP",
  "tier": "GOLD",
  "metadata": {
    "votingPower": 5,
    "benefits": ["Priority claims", "Governance participation"]
  },
  "transferable": true
}
```

#### GET /api/nfts/[id]
Get specific NFT details.

#### PUT /api/nfts/[id]
Update NFT (admin only).

#### DELETE /api/nfts/[id]
Delete NFT (admin only).

#### POST /api/nfts/[id]/mint
Mint NFT to user (admin only).

**Body:**
```json
{
  "recipientId": "user123",
  "tokenURI": "https://example.com/token/123",
  "metadata": {
    "mintReason": "Community contribution"
  }
}
```

### Treasury API

#### GET /api/treasury
Get treasury balance, statistics, and transaction history.

**Query Parameters:**
- `page`, `limit`: Pagination
- `type` (string): Filter by transaction type
- `dateFrom`, `dateTo` (ISO string): Date range filter

**Response:**
```json
{
  "treasury": {
    "balance": 150000,
    "stats": {
      "totalBalance": 150000,
      "monthlyIncome": 25000,
      "monthlyOutgoing": 15000,
      "monthlyTransactions": 45
    },
    "transactions": [...]
  },
  "pagination": {...}
}
```

#### POST /api/treasury
Create treasury transaction (admin only).

**Body:**
```json
{
  "type": "DEPOSIT",
  "amount": 10000,
  "currency": "ETH",
  "description": "Monthly membership fees",
  "metadata": {
    "source": "membership_fees",
    "period": "2024-01"
  }
}
```

### Users API

#### GET /api/users
Get all users (admin sees full data, public sees limited data).

**Query Parameters:**
- `page`, `limit`: Pagination
- `status` (string): Filter by membership status
- `tier` (string): Filter by membership tier
- `role` (string): Filter by user role

#### POST /api/users
Create new user (admin only).

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "walletAddress": "0x123...",
  "membershipStatus": "ACTIVE",
  "membershipTier": "GOLD",
  "role": "USER"
}
```

#### GET /api/users/[id]
Get specific user profile (access level depends on relationship).

#### PUT /api/users/[id]
Update user profile (own profile or admin).

#### DELETE /api/users/[id]
Delete user (admin only, cannot delete self).

## GraphQL API

### Endpoint: /api/graphql

The GraphQL API provides a single endpoint with comprehensive type definitions and resolvers for all DAO functionality.

#### Key Types:
- `User`: User profile and membership information
- `Claim`: Insurance claims with voting and review data
- `Proposal`: Governance proposals with voting statistics
- `NFT`: Membership and achievement tokens
- `TreasuryTransaction`: Financial transactions
- `SecurityEvent`: Audit logs and security events

#### Example Queries:

**Get User with Claims:**
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    membershipStatus
    claims {
      id
      title
      status
      requestedAmount
    }
  }
}
```

**Get Proposals with Votes:**
```graphql
query GetProposals($first: Int, $status: ProposalStatus) {
  proposals(first: $first, status: $status) {
    id
    title
    status
    votes {
      vote
      user {
        name
      }
    }
    voteStats {
      totalVotes
      forVotes
      againstVotes
    }
  }
}
```

#### Example Mutations:

**Create Claim:**
```graphql
mutation CreateClaim($input: CreateClaimInput!) {
  createClaim(input: $input) {
    id
    title
    status
  }
}
```

**Vote on Proposal:**
```graphql
mutation VoteOnProposal($proposalId: ID!, $vote: VoteType!, $reason: String) {
  voteOnProposal(proposalId: $proposalId, vote: $vote, reason: $reason) {
    id
    vote
    votingPower
  }
}
```

## Security Features

### Rate Limiting
- Authentication required endpoints: 100 requests/hour
- Public endpoints: 1000 requests/hour
- Admin endpoints: 200 requests/hour

### Fraud Detection
- Large transactions (>10,000 ETH) trigger additional verification
- Rapid claim submissions are flagged for review
- Multiple failed authentication attempts trigger temporary blocks

### Audit Logging
All significant actions are logged including:
- User authentication and authorization
- Claim submissions and reviews
- Proposal creation and voting
- Treasury transactions
- Administrative actions

### Input Validation
- All endpoints use Zod schemas for request validation
- File uploads are validated for type and size
- SQL injection protection via Prisma ORM
- XSS protection on all text inputs

## Error Handling

### Standard Error Response:
```json
{
  "error": "Error message",
  "details": "Additional error details (validation errors, etc.)"
}
```

### HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Testing

Use tools like Postman, curl, or GraphQL Playground to test the APIs. 

### Example curl request:
```bash
curl -X GET "http://localhost:3000/api/claims?page=1&limit=10" \
  -H "x-user-id: user123" \
  -H "x-user-role: USER"
```

### GraphQL Playground:
Visit `/api/graphql` in your browser to access the GraphQL Playground for interactive testing.