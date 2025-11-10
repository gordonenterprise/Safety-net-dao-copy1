import { PrismaClient, UserRole, MembershipStatus, MembershipTier, VerificationLevel, SubscriptionStatus, SubscriptionPlan, ClaimStatus, ClaimCategory, ClaimPriority, ProposalCategory, ProposalStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seed...')

  // 1. Create comprehensive system configuration with security guardrails
  console.log('📋 Creating system configuration...')
  
  const configs = [
    // Financial Limits & Security
    {
      key: 'MAX_CLAIM_AMOUNT_USD',
      value: '50000', // $500 max claim (conservative start)
      description: 'Maximum individual claim amount in USD cents'
    },
    {
      key: 'DAILY_TREASURY_CAP_USD',
      value: '500000', // $5000 daily cap
      description: 'Daily treasury payout cap in USD cents'
    },
    {
      key: 'AUTO_APPROVAL_LIMIT_USD',
      value: '10000', // $100 auto-approval threshold
      description: 'Claims under this amount can be auto-approved'
    },
    {
      key: 'HIGH_RISK_THRESHOLD',
      value: '0.7', // Risk score threshold
      description: 'Risk score threshold for flagging claims'
    },
    
    // Membership & Pricing
    {
      key: 'MEMBERSHIP_PRICE_USD',
      value: '800', // $8.00 monthly
      description: 'Monthly membership fee in USD cents'
    },
    {
      key: 'CLAIMS_ELIGIBILITY_DAYS',
      value: '60', // 60-day requirement
      description: 'Required membership days before claims eligibility'
    },
    {
      key: 'GRACE_PERIOD_DAYS',
      value: '7', // 7-day grace period
      description: 'Grace period for membership renewal'
    },
    
    // Governance & Voting
    {
      key: 'VOTING_PERIOD_HOURS',
      value: '168', // 7 days
      description: 'Default voting period for proposals in hours'
    },
    {
      key: 'MIN_QUORUM_PERCENT',
      value: '30', // 30% minimum participation
      description: 'Minimum quorum percentage for valid votes'
    },
    {
      key: 'APPROVAL_THRESHOLD_PERCENT',
      value: '66', // 66% approval needed
      description: 'Percentage threshold for proposal/claim approval'
    },
    {
      key: 'MIN_VALIDATORS_REQUIRED',
      value: '3',
      description: 'Minimum number of validators required for voting'
    },
    
    // Rate Limiting & Security
    {
      key: 'MAX_LOGIN_ATTEMPTS',
      value: '5',
      description: 'Maximum login attempts before lockout'
    },
    {
      key: 'MAX_CLAIMS_PER_DAY',
      value: '30',
      description: 'Maximum claims that can be submitted per day'
    },
    {
      key: 'MAX_VOTES_PER_DAY',
      value: '50',
      description: 'Maximum votes that can be cast per day'
    },
    
    // Treasury Management
    {
      key: 'TREASURY_RESERVE_PERCENT',
      value: '20', // 20% kept in reserve
      description: 'Percentage of treasury to keep in reserve'
    },
    {
      key: 'MULTI_SIG_THRESHOLD',
      value: '3', // 3-of-5 multisig
      description: 'Multi-signature threshold for treasury operations'
    }
  ]

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config
    })
  }

  // 2. Create comprehensive feature flags
  console.log('🏁 Creating feature flags...')
  
  const featureFlags = [
    {
      key: 'ENABLE_CLAIMS',
      enabled: true,
      description: 'Enable claims submission and processing'
    },
    {
      key: 'ENABLE_GOVERNANCE',
      enabled: true,
      description: 'Enable governance proposals and voting'
    },
    {
      key: 'ENABLE_TREASURY',
      enabled: true,
      description: 'Enable treasury operations'
    },
    {
      key: 'ENABLE_NFT_MEMBERSHIP',
      enabled: true,
      description: 'Enable NFT-based membership system'
    },
    {
      key: 'ENABLE_STRIPE_PAYMENTS',
      enabled: false, // Will be enabled when Stripe is configured
      description: 'Enable Stripe payment processing'
    },
    {
      key: 'ENABLE_AUTO_CLAIMS',
      enabled: false, // Conservative default
      description: 'Enable automatic claim approvals under threshold'
    },
    {
      key: 'ENABLE_DELEGATION',
      enabled: true,
      description: 'Enable vote delegation system'
    },
    {
      key: 'ENABLE_RATE_LIMITING',
      enabled: true,
      description: 'Enable rate limiting protection'
    },
    {
      key: 'ENABLE_2FA',
      enabled: true,
      description: 'Enable two-factor authentication'
    },
    {
      key: 'MAINTENANCE_MODE',
      enabled: false,
      description: 'Enable maintenance mode'
    }
  ]

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { enabled: flag.enabled, description: flag.description },
      create: flag
    })
  }

  // 3. Create treasury configuration
  console.log('🏦 Creating treasury configuration...')
  
  await prisma.treasuryConfig.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      safeAddress: '0x0000000000000000000000000000000000000000', // To be updated with actual Safe
      chainId: 137, // Polygon mainnet
      dailyCapUsd: 500000, // $5000 daily cap
      maxClaimUsd: 50000, // $500 max claim
      minQuorumPercent: 30,
      autoApprovalLimit: 10000, // $100
      highRiskThreshold: 0.7,
      gracePeriodDays: 7,
      votingPeriodHours: 168, // 7 days
      isActive: true
    }
  })

  // 4. Create admin and validator users
  console.log('👑 Creating admin and validator accounts...')
  
  const adminPassword = await bcrypt.hash('admin123!@#SafetyNet', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@safetynet.dao' },
    update: {},
    create: {
      email: 'admin@safetynet.dao',
      name: 'System Administrator',
      password: adminPassword,
      role: UserRole.ADMIN,
      membershipStatus: MembershipStatus.ACTIVE,
      emailVerified: new Date(),
      emailVerifiedAt: new Date(),
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      bio: 'Safety Net DAO system administrator with full platform access',
      location: 'Global',
      occupation: 'DAO Administrator',
      walletAddress: '0x742d35Cc6524EFFd55C1F20BC4E527A5e8ad2975'
    }
  })

  // Create comprehensive validator team
  const validators = [
    {
      email: 'validator1@safetynet.dao',
      name: 'Alice Chen',
      occupation: 'Risk Assessment Specialist',
      location: 'San Francisco, CA',
      walletAddress: '0x1234567890123456789012345678901234567890',
      bio: 'Experienced risk analyst specializing in fraud detection and financial verification'
    },
    {
      email: 'validator2@safetynet.dao',
      name: 'Bob Martinez',
      occupation: 'Insurance Claims Investigator',
      location: 'Austin, TX',
      walletAddress: '0x2345678901234567890123456789012345678901',
      bio: 'Former insurance investigator with 10+ years in claims validation'
    },
    {
      email: 'validator3@safetynet.dao',
      name: 'Carol Johnson',
      occupation: 'Financial Auditor',
      location: 'Chicago, IL',
      walletAddress: '0x3456789012345678901234567890123456789012',
      bio: 'CPA with expertise in financial auditing and compliance'
    },
    {
      email: 'validator4@safetynet.dao',
      name: 'David Kim',
      occupation: 'Blockchain Security Expert',
      location: 'Seattle, WA',
      walletAddress: '0x4567890123456789012345678901234567890123',
      bio: 'Security researcher focused on DeFi protocols and smart contract auditing'
    },
    {
      email: 'validator5@safetynet.dao',
      name: 'Elena Rodriguez',
      occupation: 'Community Relations Manager',
      location: 'Miami, FL',
      walletAddress: '0x5678901234567890123456789012345678901234',
      bio: 'Community management expert with deep understanding of DAO governance'
    }
  ]

  const validatorUsers = []
  for (const validator of validators) {
    const user = await prisma.user.upsert({
      where: { email: validator.email },
      update: {},
      create: {
        ...validator,
        password: adminPassword,
        role: UserRole.VALIDATOR,
        membershipStatus: MembershipStatus.ACTIVE,
        emailVerified: new Date(),
        emailVerifiedAt: new Date(),
        joinedAt: new Date(),
        lastActiveAt: new Date()
      }
    })
    validatorUsers.push(user)
  }

  // 5. Create diverse member base
  console.log('👥 Creating diverse member community...')
  
  const members = [
    {
      email: 'maria.driver@example.com',
      name: 'Maria Rodriguez',
      occupation: 'Rideshare Driver',
      location: 'Los Angeles, CA',
      bio: 'Full-time rideshare driver supporting family of three',
      walletAddress: '0x6789012345678901234567890123456789012345'
    },
    {
      email: 'john.dev@example.com',
      name: 'John Smith',
      occupation: 'Freelance Developer',
      location: 'Portland, OR',
      bio: 'Independent software developer working on web3 projects',
      walletAddress: '0x7890123456789012345678901234567890123456'
    },
    {
      email: 'sarah.artist@example.com',
      name: 'Sarah Chen',
      occupation: 'Digital Artist',
      location: 'New York, NY',
      bio: 'NFT artist and graphic designer in the creative economy',
      walletAddress: '0x8901234567890123456789012345678901234567'
    },
    {
      email: 'mike.tutor@example.com',
      name: 'Mike Johnson',
      occupation: 'Online Tutor',
      location: 'Dallas, TX',
      bio: 'Mathematics tutor providing online education services',
      walletAddress: '0x9012345678901234567890123456789012345678'
    },
    {
      email: 'ana.writer@example.com',
      name: 'Ana Santos',
      occupation: 'Content Writer',
      location: 'Denver, CO',
      bio: 'Freelance content writer specializing in tech and blockchain',
      walletAddress: '0xa123456789012345678901234567890123456789'
    }
  ]

  const memberUsers = []
  for (const member of members) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: {},
      create: {
        ...member,
        role: UserRole.MEMBER,
        membershipStatus: MembershipStatus.ACTIVE,
        emailVerified: new Date(),
        emailVerifiedAt: new Date(),
        joinedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000), // 75 days ago (eligible for claims)
        lastActiveAt: new Date()
      }
    })
    memberUsers.push(user)

    // Create active subscriptions for all members
    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: SubscriptionStatus.ACTIVE,
        plan: SubscriptionPlan.BASIC,
        amount: 800, // $8.00
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Started 15 days ago
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // Ends in 15 days
      }
    })
  }

  // 6. Create governance tokens for all users
  console.log('🪙 Creating governance token distribution...')
  
  // Admin gets founding allocation
  await prisma.governanceToken.create({
    data: {
      userId: admin.id,
      balance: BigInt('1000000000000000000000'), // 1000 tokens
      lockedBalance: BigInt('0'),
      earnedFromClaims: BigInt('0'),
      earnedFromVoting: BigInt('0'),
      earnedFromStaking: BigInt('0'),
      membershipMultiplier: 2.0,
      tenureMultiplier: 1.5,
      participationMultiplier: 1.2
    }
  })

  // Validators get significant allocation for their role
  for (const validator of validatorUsers) {
    await prisma.governanceToken.create({
      data: {
        userId: validator.id,
        balance: BigInt('500000000000000000000'), // 500 tokens each
        lockedBalance: BigInt('0'),
        earnedFromClaims: BigInt('0'),
        earnedFromVoting: BigInt('100000000000000000000'), // 100 tokens from voting
        earnedFromStaking: BigInt('0'),
        membershipMultiplier: 1.5,
        tenureMultiplier: 1.2,
        participationMultiplier: 1.1
      }
    })
  }

  // Members get standard allocation
  for (const member of memberUsers) {
    await prisma.governanceToken.create({
      data: {
        userId: member.id,
        balance: BigInt('100000000000000000000'), // 100 tokens each
        lockedBalance: BigInt('0'),
        earnedFromClaims: BigInt('0'),
        earnedFromVoting: BigInt('0'),
        earnedFromStaking: BigInt('0'),
        membershipMultiplier: 1.0,
        tenureMultiplier: 1.0,
        participationMultiplier: 1.0
      }
    })
  }

  // 7. Create membership NFTs
  console.log('🎨 Creating membership NFT collection...')
  
  // Admin founder NFT
  await prisma.membershipNFT.create({
    data: {
      tokenId: '1',
      contractAddress: '0x0000000000000000000000000000000000000000', // Placeholder
      ownerId: admin.id,
      tier: MembershipTier.FOUNDER,
      name: 'Safety Net DAO Founder #1',
      description: 'Founding member of Safety Net DAO with full governance rights and premium benefits',
      imageUrl: 'https://assets.safetynet.dao/nft/founder/1.png',
      metadataUri: 'https://metadata.safetynet.dao/founder/1.json',
      votingPowerMultiplier: 2.0,
      claimLimitUsd: 100000, // $1000 for founders
      governanceAccess: true,
      premiumFeatures: true,
      verificationLevel: VerificationLevel.PREMIUM,
      verifiedAt: new Date(),
      verifierId: admin.id,
      isFounder: true,
      serialNumber: 1
    }
  })

  // Validator NFTs
  for (let i = 0; i < validatorUsers.length; i++) {
    await prisma.membershipNFT.create({
      data: {
        tokenId: (i + 2).toString(),
        contractAddress: '0x0000000000000000000000000000000000000000',
        ownerId: validatorUsers[i].id,
        tier: MembershipTier.VALIDATOR,
        name: `Safety Net DAO Validator #${i + 2}`,
        description: 'Trusted validator with enhanced governance participation and validation rights',
        imageUrl: `https://assets.safetynet.dao/nft/validator/${i + 2}.png`,
        metadataUri: `https://metadata.safetynet.dao/validator/${i + 2}.json`,
        votingPowerMultiplier: 1.5,
        claimLimitUsd: 75000, // $750 for validators
        governanceAccess: true,
        premiumFeatures: true,
        verificationLevel: VerificationLevel.ENHANCED,
        verifiedAt: new Date(),
        verifierId: admin.id,
        serialNumber: i + 2
      }
    })
  }

  // Member NFTs (Premium tier for active subscribers)
  for (let i = 0; i < memberUsers.length; i++) {
    await prisma.membershipNFT.create({
      data: {
        tokenId: (i + 7).toString(),
        contractAddress: '0x0000000000000000000000000000000000000000',
        ownerId: memberUsers[i].id,
        tier: MembershipTier.PREMIUM,
        name: `Safety Net DAO Member #${i + 7}`,
        description: 'Premium member with full platform access and claim eligibility',
        imageUrl: `https://assets.safetynet.dao/nft/premium/${i + 7}.png`,
        metadataUri: `https://metadata.safetynet.dao/premium/${i + 7}.json`,
        votingPowerMultiplier: 1.0,
        claimLimitUsd: 50000, // $500 for premium members
        governanceAccess: true,
        premiumFeatures: false,
        verificationLevel: VerificationLevel.BASIC,
        verifiedAt: new Date(),
        verifierId: admin.id,
        serialNumber: i + 7
      }
    })
  }

  // 8. Create realistic claims for testing
  console.log('📋 Creating sample claims...')
  
  const claimsData = [
    {
      title: 'Car Transmission Repair Emergency',
      description: 'My car transmission failed suddenly while working delivery shifts. Without my vehicle, I cannot continue earning income as a rideshare driver. The repair estimate is $1,200 from a certified mechanic. I have attached the diagnostic report and repair estimate.',
      category: ClaimCategory.VEHICLE,
      requestedAmount: 40000, // $400 (within $500 limit)
      status: ClaimStatus.VOTING,
      priority: ClaimPriority.HIGH,
      attachments: ['diagnostic_report.pdf', 'repair_estimate.pdf'],
      evidenceNotes: 'Vehicle diagnostic confirms transmission failure. Repair necessary for continued employment.'
    },
    {
      title: 'Emergency Dental Treatment',
      description: 'Developed severe tooth infection requiring immediate treatment. Emergency dental work needed to prevent serious health complications. Insurance covers only partial costs, leaving me with significant out-of-pocket expenses.',
      category: ClaimCategory.MEDICAL,
      requestedAmount: 35000, // $350
      status: ClaimStatus.UNDER_REVIEW,
      priority: ClaimPriority.URGENT,
      attachments: ['dental_xray.jpg', 'treatment_plan.pdf', 'insurance_statement.pdf'],
      evidenceNotes: 'Emergency dental treatment required. Partial insurance coverage confirmed.'
    },
    {
      title: 'Work Laptop Replacement',
      description: 'My primary work laptop was stolen from my apartment during a break-in. Police report filed. I need a replacement to continue my freelance development work and maintain client relationships.',
      category: ClaimCategory.DEVICE,
      requestedAmount: 45000, // $450
      status: ClaimStatus.SUBMITTED,
      priority: ClaimPriority.NORMAL,
      attachments: ['police_report.pdf', 'laptop_specs.pdf', 'insurance_denial.pdf'],
      evidenceNotes: 'Police report confirms theft. Insurance claim denied due to deductible. Replacement needed for work continuity.'
    }
  ]

  for (let i = 0; i < claimsData.length && i < memberUsers.length; i++) {
    await prisma.claim.create({
      data: {
        ...claimsData[i],
        userId: memberUsers[i].id,
        riskScore: 0.3 + (i * 0.1), // Varying risk scores for testing
        duplicateCheckCid: `Qm${Math.random().toString(36).substr(2, 9)}`, // Mock IPFS CID
        evidenceCid: `Qm${Math.random().toString(36).substr(2, 9)}`
      }
    })
  }

  // 9. Create sample governance proposal
  console.log('🗳️ Creating governance proposals...')
  
  await prisma.proposal.create({
    data: {
      title: 'Increase Maximum Claim Amount to $750',
      description: `# Proposal: Increase Maximum Claim Amount

## Summary
This proposal suggests increasing the maximum individual claim amount from $500 to $750 to better serve members facing higher-cost emergencies while maintaining responsible treasury management.

## Rationale
- Current $500 limit may be insufficient for significant emergencies (car repairs, medical treatments)
- Proposed $750 limit provides better member support while remaining conservative
- Additional oversight measures will be implemented for claims over $500

## Implementation Details
- Update MAX_CLAIM_AMOUNT_USD system configuration from 50000 to 75000 cents
- Require additional validator review for claims between $500-$750
- Maintain existing fraud detection and risk assessment processes
- Apply change only to Premium+ tier NFT holders initially

## Risk Assessment
- **Low Risk**: Moderate increase with enhanced oversight
- **Treasury Impact**: Estimated 15% increase in monthly payouts
- **Member Benefit**: Improved coverage for legitimate high-cost emergencies
- **Fraud Protection**: Enhanced validation for higher amounts

## Voting Details
- **Voting Period**: 7 days from proposal activation
- **Quorum Required**: 30% of eligible voters
- **Approval Threshold**: 66% approval needed
- **Implementation**: Immediate upon approval`,
      category: ProposalCategory.TREASURY,
      proposerId: admin.id,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      quorumRequired: 30,
      votingThreshold: 66,
      status: ProposalStatus.ACTIVE,
      tags: ['treasury', 'claims', 'limits', 'member-benefits'],
      discussionUrl: 'https://discord.gg/safetynet-dao'
    }
  })

  // 10. Create comprehensive treasury snapshot
  console.log('📊 Creating treasury snapshot...')
  
  await prisma.treasurySnapshot.create({
    data: {
      totalBalance: BigInt('2000000000000'), // 2M USDC (6 decimals)
      availableBalance: BigInt('1600000000000'), // 1.6M available (80%)
      reservedBalance: BigInt('400000000000'), // 400K reserved (20%)
      usdcBalance: BigInt('2000000000000'), // 2M USDC
      maticBalance: BigInt('100000000000000000000000'), // 100K MATIC
      ethBalance: BigInt('50000000000000000000'), // 50 ETH
      totalMembers: memberUsers.length + validatorUsers.length + 1, // All users
      activeMembers: memberUsers.length + validatorUsers.length + 1,
      totalClaims: 3,
      approvedClaims: 0,
      totalPayouts: BigInt('0'),
      blockNumber: 51234567,
      networkId: '137'
    }
  })

  // 11. Create initial audit logs
  console.log('📝 Creating audit trail...')
  
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'CREATE',
      entityType: 'system',
      entityId: 'database_seed',
      metadata: {
        version: '2.0.0',
        source: 'comprehensive_seed_script',
        timestamp: new Date().toISOString(),
        environment: 'development'
      },
      ipAddress: '127.0.0.1',
      userAgent: 'database-seed-script/2.0.0'
    }
  })

  console.log('✅ Comprehensive database seed completed successfully!')
  console.log('\n🎯 Security Guardrails Implemented:')
  console.log('• Role-based access control (MEMBER → VALIDATOR → ADMIN)')
  console.log('• 60-day membership requirement for claims eligibility')
  console.log('• $500 maximum claim amount with $100 auto-approval threshold')
  console.log('• $5000 daily treasury cap with 20% reserve requirement')
  console.log('• Multi-level rate limiting and fraud detection')
  console.log('• Comprehensive audit logging for all actions')
  console.log('• NFT-based membership tiers with governance rights')
  console.log('• Feature flags for controlled rollout')
  
  console.log('\n📊 Platform Summary:')
  console.log(`• 1 Admin with full system access`)
  console.log(`• ${validatorUsers.length} Validators for claims review`)
  console.log(`• ${memberUsers.length} Active members with subscriptions`)
  console.log(`• ${claimsData.length} Sample claims for testing`)
  console.log(`• 1 Active governance proposal`)
  console.log(`• $2M initial treasury balance`)
  console.log(`• ${configs.length} System configurations`)
  console.log(`• ${featureFlags.length} Feature flags`)
  
  console.log('\n🔐 Access Credentials:')
  console.log('Admin: admin@safetynet.dao / admin123!@#SafetyNet')
  console.log('Validators: validator[1-5]@safetynet.dao / admin123!@#SafetyNet')
  
  console.log('\n🚀 Next Steps:')
  console.log('1. Configure Stripe integration for payments')
  console.log('2. Deploy and configure NFT smart contract')
  console.log('3. Set up Safe multisig wallet for treasury')
  console.log('4. Configure monitoring and alerting systems')
  console.log('5. Enable production feature flags')
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })