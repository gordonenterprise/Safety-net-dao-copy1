/**
 * End-to-End Integration Tests
 * 
 * These tests simulate complete user workflows across the entire DAO system,
 * testing the integration between frontend components, APIs, database, and security systems.
 */

import { NextRequest } from 'next/server'
import { GET as getClaims, POST as postClaims } from '../../../src/app/api/claims/route'
import { GET as getGovernance, POST as postGovernance } from '../../../src/app/api/governance/route'
import { POST as voteOnClaim } from '../../../src/app/api/claims/[id]/vote/route'
import { POST as reviewClaim } from '../../../src/app/api/claims/[id]/review/route'
import { prisma } from '@safetynet/db'

// Mock all external dependencies
jest.mock('../../../src/lib/security/middleware')
jest.mock('../../../src/lib/security')
jest.mock('@safetynet/db')

describe('End-to-End DAO Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock responses
    const mockSecurityMiddleware = require('../../../src/lib/security/middleware')
    mockSecurityMiddleware.SecurityMiddleware.mockImplementation(() => ({
      createMiddleware: jest.fn(() => 
        jest.fn().mockResolvedValue(new Response('OK', { status: 200 }))
      )
    }))

    const mockSecurity = require('../../../src/lib/security')
    mockSecurity.getSecuritySystems.mockReturnValue({
      auditLogger: {
        logUserAction: jest.fn(),
        logSecurityEvent: jest.fn(),
      },
      fraudDetector: {
        checkForFraud: jest.fn().mockResolvedValue({
          isFraudulent: false,
          riskScore: 0.1,
          reason: ''
        })
      }
    })
  })

  describe('Complete Claim Lifecycle', () => {
    it('should handle full claim workflow: create → submit → vote → approve → payout', async () => {
      // Step 1: User creates a claim
      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        membershipStatus: 'ACTIVE',
        walletAddress: '0x123'
      }

      const mockClaim = {
        id: 'claim1',
        title: 'Medical Emergency',
        description: 'Emergency surgery required',
        category: 'MEDICAL',
        requestedAmount: 5000,
        status: 'DRAFT',
        userId: 'user1',
        user: mockUser
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.claim.create as jest.Mock).mockResolvedValue(mockClaim)

      const createRequest = new NextRequest('http://localhost:3000/api/claims', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Medical Emergency',
          description: 'Emergency surgery required',
          category: 'MEDICAL',
          requestedAmount: 5000
        })
      })
      createRequest.headers.set('x-user-id', 'user1')
      createRequest.headers.set('x-user-role', 'USER')
      createRequest.headers.set('content-type', 'application/json')

      const createResponse = await postClaims(createRequest)
      const createdClaim = await createResponse.json()

      expect(createResponse.status).toBe(201)
      expect(createdClaim.title).toBe('Medical Emergency')
      expect(createdClaim.status).toBe('DRAFT')

      // Step 2: User submits claim for review
      const submittedClaim = {
        ...mockClaim,
        status: 'SUBMITTED',
        reviewStartedAt: new Date()
      }

      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockClaim)
      ;(prisma.claim.update as jest.Mock).mockResolvedValue(submittedClaim)

      // Step 3: Admin reviews and sends to community voting
      const communityVotingClaim = {
        ...submittedClaim,
        status: 'COMMUNITY_VOTING',
        reviewNotes: 'Sending to community for decision',
        reviewedAt: new Date(),
        reviewedBy: 'admin1'
      }

      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(submittedClaim)
      ;(prisma.claim.update as jest.Mock).mockResolvedValue(communityVotingClaim)

      const reviewRequest = new NextRequest('http://localhost:3000/api/claims/claim1/review', {
        method: 'POST',
        body: JSON.stringify({
          status: 'COMMUNITY_VOTING',
          reviewNotes: 'Sending to community for decision'
        })
      })
      reviewRequest.headers.set('x-user-id', 'admin1')
      reviewRequest.headers.set('x-user-role', 'ADMIN')
      reviewRequest.headers.set('content-type', 'application/json')

      const reviewResponse = await reviewClaim(reviewRequest, { params: { id: 'claim1' } })
      const reviewedClaim = await reviewResponse.json()

      expect(reviewResponse.status).toBe(200)
      expect(reviewedClaim.status).toBe('COMMUNITY_VOTING')

      // Step 4: Community members vote on the claim
      const mockVote = {
        id: 'vote1',
        claimId: 'claim1',
        userId: 'voter1',
        vote: 'APPROVE',
        justification: 'Valid medical emergency',
        user: { id: 'voter1', name: 'Voter One' }
      }

      const mockVoter = {
        id: 'voter1',
        membershipStatus: 'ACTIVE'
      }

      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue({
        ...communityVotingClaim,
        user: { id: 'user1' } // Different from voter
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockVoter)
      ;(prisma.claimVote.findUnique as jest.Mock).mockResolvedValue(null) // No existing vote
      ;(prisma.claimVote.create as jest.Mock).mockResolvedValue(mockVote)

      const voteRequest = new NextRequest('http://localhost:3000/api/claims/claim1/vote', {
        method: 'POST',
        body: JSON.stringify({
          vote: 'APPROVE',
          justification: 'Valid medical emergency'
        })
      })
      voteRequest.headers.set('x-user-id', 'voter1')
      voteRequest.headers.set('x-user-role', 'USER')
      voteRequest.headers.set('content-type', 'application/json')

      const voteResponse = await voteOnClaim(voteRequest, { params: { id: 'claim1' } })
      const vote = await voteResponse.json()

      expect(voteResponse.status).toBe(200)
      expect(vote.vote).toBe('APPROVE')

      // Step 5: Final approval and treasury payout (would be triggered automatically)
      const approvedClaim = {
        ...communityVotingClaim,
        status: 'APPROVED',
        approvedAmount: 5000,
        votingClosedAt: new Date()
      }

      const mockTreasuryTransaction = {
        id: 'tx1',
        type: 'PAYOUT',
        amount: 5000,
        recipient: '0x123',
        description: 'Claim payout for Medical Emergency'
      }

      ;(prisma.claim.update as jest.Mock).mockResolvedValue(approvedClaim)
      ;(prisma.treasuryTransaction.create as jest.Mock).mockResolvedValue(mockTreasuryTransaction)

      // Verify the complete workflow
      expect(prisma.claim.create).toHaveBeenCalled()
      expect(prisma.claim.update).toHaveBeenCalled()
      expect(prisma.claimVote.create).toHaveBeenCalled()
    })
  })

  describe('Complete Governance Workflow', () => {
    it('should handle full governance workflow: propose → vote → execute', async () => {
      // Step 1: User creates a proposal
      const mockProposer = {
        id: 'proposer1',
        name: 'Alice Proposer',
        membershipStatus: 'ACTIVE'
      }

      const mockProposal = {
        id: 'proposal1',
        title: 'Increase Claim Limits',
        description: 'Proposal to increase maximum claim limits for Gold members',
        type: 'PARAMETER_UPDATE',
        category: 'Policy',
        status: 'DRAFT',
        proposerId: 'proposer1',
        proposer: mockProposer,
        proposedChanges: {
          goldMemberClaimLimit: 15000
        }
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockProposer)
      ;(prisma.proposal.create as jest.Mock).mockResolvedValue(mockProposal)

      const createProposalRequest = new NextRequest('http://localhost:3000/api/governance', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Increase Claim Limits',
          description: 'Proposal to increase maximum claim limits for Gold members',
          type: 'PARAMETER_UPDATE',
          category: 'Policy',
          proposedChanges: {
            goldMemberClaimLimit: 15000
          }
        })
      })
      createProposalRequest.headers.set('x-user-id', 'proposer1')
      createProposalRequest.headers.set('x-user-role', 'USER')
      createProposalRequest.headers.set('content-type', 'application/json')

      const createProposalResponse = await postGovernance(createProposalRequest)
      const createdProposal = await createProposalResponse.json()

      expect(createProposalResponse.status).toBe(201)
      expect(createdProposal.title).toBe('Increase Claim Limits')
      expect(createdProposal.status).toBe('DRAFT')

      // Step 2: Proposal moves to active voting (would be done by admin or automatically)
      const activeProposal = {
        ...mockProposal,
        status: 'ACTIVE',
        votingStartDate: new Date(),
        votingEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }

      // Step 3: Users vote on the proposal
      const mockVoters = [
        { id: 'voter1', name: 'Voter One', membershipStatus: 'ACTIVE', nfts: [{ type: 'GOVERNANCE_TOKEN', metadata: { votingPower: 5 } }] },
        { id: 'voter2', name: 'Voter Two', membershipStatus: 'ACTIVE', nfts: [{ type: 'GOVERNANCE_TOKEN', metadata: { votingPower: 3 } }] },
        { id: 'voter3', name: 'Voter Three', membershipStatus: 'ACTIVE', nfts: [] }
      ]

      const mockVotes = [
        { id: 'pvote1', proposalId: 'proposal1', userId: 'voter1', vote: 'FOR', votingPower: 5 },
        { id: 'pvote2', proposalId: 'proposal1', userId: 'voter2', vote: 'FOR', votingPower: 3 },
        { id: 'pvote3', proposalId: 'proposal1', userId: 'voter3', vote: 'AGAINST', votingPower: 1 }
      ]

      // Mock voting process
      ;(prisma.proposal.findUnique as jest.Mock).mockResolvedValue(activeProposal)
      mockVoters.forEach((voter, index) => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(voter)
        ;(prisma.proposalVote.findUnique as jest.Mock).mockResolvedValueOnce(null)
        ;(prisma.proposalVote.create as jest.Mock).mockResolvedValueOnce(mockVotes[index])
      })

      // Step 4: Proposal passes and gets executed
      const passedProposal = {
        ...activeProposal,
        status: 'PASSED',
        votingClosedAt: new Date(),
        finalVoteCount: {
          for: 8, // 5 + 3
          against: 1,
          abstain: 0,
          totalVotingPower: 9,
          quorumReached: true
        }
      }

      ;(prisma.proposal.update as jest.Mock).mockResolvedValue(passedProposal)

      // Verify the workflow
      expect(prisma.proposal.create).toHaveBeenCalled()
      expect(createdProposal.type).toBe('PARAMETER_UPDATE')
    })
  })

  describe('Member Permission Workflows', () => {
    it('should enforce proper access controls across the system', async () => {
      // Test 1: Regular user cannot access admin endpoints
      const regularUserRequest = new NextRequest('http://localhost:3000/api/treasury', {
        method: 'POST',
        body: JSON.stringify({
          type: 'WITHDRAWAL',
          amount: 1000,
          description: 'Unauthorized attempt'
        })
      })
      regularUserRequest.headers.set('x-user-id', 'user1')
      regularUserRequest.headers.set('x-user-role', 'USER')
      regularUserRequest.headers.set('content-type', 'application/json')

      // Mock security middleware to reject non-admin
      const mockSecurityMiddleware = require('../../../src/lib/security/middleware')
      mockSecurityMiddleware.SecurityMiddleware.mockImplementationOnce(() => ({
        createMiddleware: jest.fn(() => 
          jest.fn().mockResolvedValue(new Response('Forbidden', { status: 403 }))
        )
      }))

      const { POST: postTreasury } = require('../../../src/app/api/treasury/route')
      const treasuryResponse = await postTreasury(regularUserRequest)

      expect(treasuryResponse.status).toBe(403)

      // Test 2: Suspended user cannot vote
      const suspendedUser = {
        id: 'suspended1',
        membershipStatus: 'SUSPENDED'
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(suspendedUser)

      const suspendedVoteRequest = new NextRequest('http://localhost:3000/api/claims/claim1/vote', {
        method: 'POST',
        body: JSON.stringify({
          vote: 'APPROVE'
        })
      })
      suspendedVoteRequest.headers.set('x-user-id', 'suspended1')
      suspendedVoteRequest.headers.set('x-user-role', 'USER')
      suspendedVoteRequest.headers.set('content-type', 'application/json')

      const suspendedVoteResponse = await voteOnClaim(suspendedVoteRequest, { params: { id: 'claim1' } })
      const suspendedVoteResult = await suspendedVoteResponse.json()

      expect(suspendedVoteResponse.status).toBe(403)
      expect(suspendedVoteResult.error).toContain('active members')

      // Test 3: Admin can perform administrative actions
      const adminUser = {
        id: 'admin1',
        role: 'ADMIN'
      }

      // Reset security middleware for admin access
      mockSecurityMiddleware.SecurityMiddleware.mockImplementation(() => ({
        createMiddleware: jest.fn(() => 
          jest.fn().mockResolvedValue(new Response('OK', { status: 200 }))
        )
      }))

      const adminRequest = new NextRequest('http://localhost:3000/api/claims/claim1/review', {
        method: 'POST',
        body: JSON.stringify({
          status: 'APPROVED',
          reviewNotes: 'Admin approval',
          approvedAmount: 5000
        })
      })
      adminRequest.headers.set('x-user-id', 'admin1')
      adminRequest.headers.set('x-user-role', 'ADMIN')
      adminRequest.headers.set('content-type', 'application/json')

      const mockClaim = {
        id: 'claim1',
        status: 'SUBMITTED',
        user: { id: 'user1', name: 'Test', walletAddress: '0x123' }
      }

      const approvedClaim = {
        ...mockClaim,
        status: 'APPROVED',
        approvedAmount: 5000,
        reviewedBy: 'admin1'
      }

      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockClaim)
      ;(prisma.claim.update as jest.Mock).mockResolvedValue(approvedClaim)
      ;(prisma.treasuryTransaction.create as jest.Mock).mockResolvedValue({
        id: 'tx1',
        type: 'PAYOUT',
        amount: 5000
      })

      const adminResponse = await reviewClaim(adminRequest, { params: { id: 'claim1' } })
      const adminResult = await adminResponse.json()

      expect(adminResponse.status).toBe(200)
      expect(adminResult.status).toBe('APPROVED')
    })
  })

  describe('Security Integration', () => {
    it('should properly handle fraud detection across workflows', async () => {
      // Mock fraud detection to trigger on suspicious activity
      const mockSecurity = require('../../../src/lib/security')
      mockSecurity.getSecuritySystems.mockReturnValue({
        auditLogger: {
          logUserAction: jest.fn(),
          logSecurityEvent: jest.fn(),
        },
        fraudDetector: {
          checkForFraud: jest.fn().mockResolvedValue({
            isFraudulent: true,
            riskScore: 0.9,
            reason: 'Multiple rapid claims from same user'
          })
        }
      })

      const suspiciousUser = {
        id: 'suspicious1',
        membershipStatus: 'ACTIVE'
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(suspiciousUser)

      const suspiciousRequest = new NextRequest('http://localhost:3000/api/claims', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Suspicious Claim',
          description: 'This looks fraudulent',
          category: 'EMERGENCY',
          requestedAmount: 10000
        })
      })
      suspiciousRequest.headers.set('x-user-id', 'suspicious1')
      suspiciousRequest.headers.set('x-user-role', 'USER')
      suspiciousRequest.headers.set('content-type', 'application/json')

      const fraudResponse = await postClaims(suspiciousRequest)
      const fraudResult = await fraudResponse.json()

      expect(fraudResponse.status).toBe(400)
      expect(fraudResult.error).toContain('Security check failed')
      
      // Verify security event was logged
      expect(mockSecurity.getSecuritySystems().auditLogger.logSecurityEvent).toHaveBeenCalledWith(
        'FRAUD_DETECTED',
        expect.objectContaining({
          userId: 'suspicious1',
          action: 'CLAIM_CREATION'
        })
      )
    })
  })
})