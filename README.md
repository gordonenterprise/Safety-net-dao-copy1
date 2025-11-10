# SafetyNet DAO

A decentralized mutual-aid platform where members pay $8/month and receive fast micro-payouts from a transparent on-chain treasury.

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Fill in your values in .env.local
   ```

3. **Set up the database:**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

   This starts:
   - Web app: http://localhost:3000
   - Worker: Background processes for blockchain polling and notifications

## Project Structure

```
├── apps/
│   └── web/                 # Next.js 14 frontend + API routes
├── packages/
│   ├── ui/                  # Shared UI components (shadcn/ui)
│   ├── db/                  # Prisma schema + client
│   └── config/              # Configuration loader
├── workers/
│   └── indexer/             # Background worker for blockchain & webhooks
└── tests/
    └── e2e/                 # Playwright end-to-end tests
```

## Features

### Core Platform
- **Membership**: $8/month Stripe subscriptions with soulbound NFTs
- **Claims Pipeline**: Submit income-loss claims, validator review, payouts
- **Treasury Transparency**: Live wallet balances, transaction feeds, reports
- **Governance**: On-chain proposal reading and token-gated voting

### Admin Panel
- Member management (activate/cancel/reactivate)
- Claims review and payout processing
- Treasury operations and reporting
- Content management and configuration
- Full audit logging

### Security
- NextAuth with email/password + SIWE wallet login
- Mandatory TOTP 2FA for admins
- Role-based access control (member/validator/admin/superadmin)
- File upload scanning with ClamAV
- Comprehensive audit logging

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL
- **Auth**: NextAuth, SIWE (Sign-In with Ethereum), TOTP 2FA
- **Blockchain**: wagmi, viem, OpenZeppelin Governor, Polygon testnet
- **Payments**: Stripe Subscriptions
- **Jobs**: Redis + BullMQ
- **Storage**: S3-compatible with signed URLs
- **Monitoring**: Sentry, Logtail

## Demo Data

The seed script creates:
- Demo users with different roles
- 100 sample members with various statuses
- 20 claims in different pipeline stages
- Treasury wallets with mock transactions
- Sample governance proposals
- Configuration defaults

Login credentials after seeding:
- **Member**: `member@example.com` / `password123`
- **Validator**: `validator@example.com` / `password123`  
- **Admin**: `admin@example.com` / `password123`
- **Super Admin**: `superadmin@example.com` / `password123`

## License

MIT License - see LICENSE file for details.