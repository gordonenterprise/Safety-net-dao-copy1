import { gql } from 'graphql-tag'

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  # User Management
  type User {
    id: ID!
    email: String!
    name: String
    walletAddress: String
    role: UserRole!
    membershipStatus: MembershipStatus!
    membershipNftTokenId: String
    membershipExpiresAt: DateTime
    joinedAt: DateTime!
    lastActiveAt: DateTime!
    bio: String
    location: String
    riskScore: Float
    
    # Relations
    claims: [Claim!]!
    votes: [Vote!]!
    proposals: [Proposal!]!
    nftTokens: [NFTTransfer!]!
  }

  enum UserRole {
    MEMBER
    VALIDATOR
    ADMIN
  }

  enum MembershipStatus {
    PENDING
    ACTIVE
    SUSPENDED
    EXPIRED
    CANCELLED
  }

  # Claims System
  type Claim {
    id: ID!
    userId: String!
    user: User!
    title: String!
    description: String!
    category: ClaimCategory!
    requestedAmount: Int!
    status: ClaimStatus!
    priority: ClaimPriority!
    riskScore: Float
    riskFactors: JSON
    attachments: [String!]!
    evidenceNotes: String
    reviewNotes: String
    reviewerId: String
    approvedAmount: Int
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    votes: [ClaimVote!]!
    payout: Payout
  }

  enum ClaimCategory {
    EMERGENCY
    MEDICAL
    PROPERTY
    INCOME_PROTECTION
    OTHER
  }

  enum ClaimStatus {
    DRAFT
    SUBMITTED
    UNDER_REVIEW
    COMMUNITY_VOTING
    APPROVED
    REJECTED
    PAID
    CANCELLED
  }

  enum ClaimPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  type ClaimVote {
    id: ID!
    claimId: String!
    claim: Claim!
    userId: String!
    user: User!
    vote: VoteChoice!
    justification: String
    weight: Int!
    createdAt: DateTime!
  }

  enum VoteChoice {
    APPROVE
    REJECT
    ABSTAIN
  }

  # Governance System
  type Proposal {
    id: ID!
    title: String!
    description: String!
    category: ProposalCategory!
    status: ProposalStatus!
    proposerId: String!
    proposer: User!
    executorId: String
    executor: User
    startTime: DateTime!
    endTime: DateTime!
    executionTime: DateTime
    votesFor: Int!
    votesAgainst: Int!
    votesAbstain: Int!
    totalVotes: Int!
    quorumRequired: Int!
    passingThreshold: Int!
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    votes: [ProposalVote!]!
  }

  enum ProposalCategory {
    TREASURY
    GOVERNANCE
    MEMBERSHIP
    CLAIMS
    TECHNICAL
  }

  enum ProposalStatus {
    DRAFT
    ACTIVE
    SUCCEEDED
    DEFEATED
    CANCELLED
    EXECUTED
  }

  type ProposalVote {
    id: ID!
    proposalId: String!
    proposal: Proposal!
    userId: String!
    user: User!
    choice: VoteChoice!
    weight: Int!
    reason: String
    createdAt: DateTime!
  }

  # NFT System
  type NFTTransfer {
    id: ID!
    fromUserId: String
    fromUser: User
    toUserId: String!
    toUser: User!
    tokenId: String!
    transferType: TransferType!
    tier: MembershipTier
    metadata: JSON
    txHash: String
    createdAt: DateTime!
  }

  enum TransferType {
    MINT
    TRANSFER
    UPGRADE
    REVOKE
  }

  enum MembershipTier {
    BASIC
    PREMIUM
    FOUNDER
    EARLY_ADOPTER
    VALIDATOR
    CONTRIBUTOR
  }

  type MintRequest {
    id: ID!
    userId: String!
    user: User!
    tier: MembershipTier!
    status: MintRequestStatus!
    reviewerId: String
    reviewer: User
    rejectionReason: String
    txHash: String
    tokenId: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum MintRequestStatus {
    PENDING
    UNDER_REVIEW
    APPROVED
    REJECTED
    MINTED
    CANCELLED
  }

  # Treasury & Payments
  type Payout {
    id: ID!
    claimId: String!
    claim: Claim!
    userId: String!
    user: User!
    amount: Int!
    currency: String!
    status: PayoutStatus!
    txHash: String
    processedAt: DateTime
    failedAt: DateTime
    createdAt: DateTime!
  }

  enum PayoutStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  # Security & Monitoring
  type AuditLog {
    id: ID!
    userId: String
    walletAddress: String
    action: String!
    level: String!
    resource: String
    resourceId: String
    details: JSON
    metadata: JSON
    timestamp: DateTime!
  }

  type Alert {
    id: ID!
    category: String!
    severity: String!
    title: String!
    description: String!
    metadata: JSON
    timestamp: DateTime!
    resolved: Boolean!
    resolvedAt: DateTime
    resolvedBy: String
  }

  # API Queries
  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(limit: Int, offset: Int, filter: UserFilter): [User!]!
    
    # Claims queries
    claim(id: ID!): Claim
    claims(limit: Int, offset: Int, filter: ClaimFilter): [Claim!]!
    myClaims: [Claim!]!
    
    # Governance queries
    proposal(id: ID!): Proposal
    proposals(limit: Int, offset: Int, filter: ProposalFilter): [Proposal!]!
    activeProposals: [Proposal!]!
    
    # NFT queries
    nftTransfer(id: ID!): NFTTransfer
    nftTransfers(limit: Int, offset: Int, filter: NFTFilter): [NFTTransfer!]!
    myNFTs: [NFTTransfer!]!
    mintRequest(id: ID!): MintRequest
    mintRequests(limit: Int, offset: Int): [MintRequest!]!
    
    # Treasury queries
    payout(id: ID!): Payout
    payouts(limit: Int, offset: Int): [Payout!]!
    myPayouts: [Payout!]!
    
    # Admin queries
    auditLogs(limit: Int, offset: Int, filter: AuditFilter): [AuditLog!]!
    alerts(limit: Int, offset: Int, filter: AlertFilter): [Alert!]!
    systemHealth: SystemHealth!
  }

  # API Mutations
  type Mutation {
    # User mutations
    updateProfile(input: UpdateProfileInput!): User!
    
    # Claims mutations
    createClaim(input: CreateClaimInput!): Claim!
    updateClaim(id: ID!, input: UpdateClaimInput!): Claim!
    submitClaim(id: ID!): Claim!
    voteClaim(claimId: ID!, vote: VoteChoice!, justification: String): ClaimVote!
    
    # Governance mutations
    createProposal(input: CreateProposalInput!): Proposal!
    voteProposal(proposalId: ID!, choice: VoteChoice!, reason: String): ProposalVote!
    executeProposal(id: ID!): Proposal!
    
    # NFT mutations
    requestMint(tier: MembershipTier!): MintRequest!
    transferNFT(tokenId: String!, toUserId: String!): NFTTransfer!
    
    # Admin mutations
    reviewClaim(id: ID!, input: ReviewClaimInput!): Claim!
    reviewMintRequest(id: ID!, input: ReviewMintInput!): MintRequest!
    suspendUser(id: ID!, reason: String!): User!
    resolveAlert(id: ID!): Alert!
  }

  # Input Types
  input UserFilter {
    role: UserRole
    membershipStatus: MembershipStatus
    search: String
  }

  input ClaimFilter {
    status: ClaimStatus
    category: ClaimCategory
    userId: String
    search: String
  }

  input ProposalFilter {
    status: ProposalStatus
    category: ProposalCategory
    search: String
  }

  input NFTFilter {
    transferType: TransferType
    tier: MembershipTier
    userId: String
  }

  input AuditFilter {
    userId: String
    action: String
    level: String
    resource: String
    startDate: DateTime
    endDate: DateTime
  }

  input AlertFilter {
    category: String
    severity: String
    resolved: Boolean
  }

  input UpdateProfileInput {
    name: String
    bio: String
    location: String
  }

  input CreateClaimInput {
    title: String!
    description: String!
    category: ClaimCategory!
    requestedAmount: Int!
    attachments: [String!]
    evidenceNotes: String
  }

  input UpdateClaimInput {
    title: String
    description: String
    requestedAmount: Int
    attachments: [String!]
    evidenceNotes: String
  }

  input ReviewClaimInput {
    status: ClaimStatus!
    reviewNotes: String
    approvedAmount: Int
  }

  input CreateProposalInput {
    title: String!
    description: String!
    category: ProposalCategory!
    startTime: DateTime
    endTime: DateTime!
    metadata: JSON
  }

  input ReviewMintInput {
    status: MintRequestStatus!
    rejectionReason: String
  }

  # System Types
  type SystemHealth {
    status: String!
    metrics: JSON!
    activeAlerts: Int!
    criticalAlerts: Int!
  }
`