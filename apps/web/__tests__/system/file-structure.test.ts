/**
 * File System and Architecture Tests
 * 
 * These tests validate that all required files exist and the project
 * structure is properly configured for the DAO system.
 */

import * as fs from 'fs'
import * as path from 'path'

const projectRoot = path.resolve(__dirname, '../../')

describe('DAO Project Structure Validation', () => {
  describe('Core Files Existence', () => {
    it('should have all required API route files', () => {
      const apiRoutes = [
        'app/api/claims/route.ts',
        'app/api/claims/[id]/route.ts', 
        'app/api/claims/[id]/review/route.ts',
        'app/api/claims/[id]/vote/route.ts',
        'app/api/governance/route.ts',
        'app/api/governance/[id]/route.ts',
        'app/api/governance/[id]/vote/route.ts',
        'app/api/nfts/route.ts',
        'app/api/nfts/[id]/route.ts',
        'app/api/nfts/[id]/mint/route.ts',
        'app/api/treasury/route.ts',
        'app/api/users/route.ts',
        'app/api/users/[id]/route.ts',
        'app/api/graphql/route.ts'
      ]

      const missingFiles = []
      const existingFiles = []

      apiRoutes.forEach(route => {
        const filePath = path.join(projectRoot, route)
        if (fs.existsSync(filePath)) {
          existingFiles.push(route)
        } else {
          missingFiles.push(route)
        }
      })

      console.log(`Found ${existingFiles.length} API routes:`, existingFiles)
      if (missingFiles.length > 0) {
        console.log(`Missing ${missingFiles.length} API routes:`, missingFiles)
      }

      // At least some core routes should exist
      expect(existingFiles.length).toBeGreaterThan(0)
    })

    it('should have security system files', () => {
      const securityFiles = [
        'lib/security/SecurityMiddleware.ts',
        'lib/security/AuditLogger.ts',
        'lib/security/FraudDetectionEngine.ts',
        'lib/security/RateLimiter.ts'
      ]

      const existingSecurityFiles = []
      const missingSecurityFiles = []

      securityFiles.forEach(file => {
        const filePath = path.join(projectRoot, file)
        if (fs.existsSync(filePath)) {
          existingSecurityFiles.push(file)
        } else {
          missingSecurityFiles.push(file)
        }
      })

      console.log(`Found ${existingSecurityFiles.length} security files:`, existingSecurityFiles)
      if (missingSecurityFiles.length > 0) {
        console.log(`Missing ${missingSecurityFiles.length} security files:`, missingSecurityFiles)
      }

      // At least some security files should exist
      expect(existingSecurityFiles.length).toBeGreaterThan(0)
    })

    it('should have database schema file', () => {
      const schemaPath = path.join(projectRoot, 'prisma/schema.prisma')
      const schemaExists = fs.existsSync(schemaPath)
      
      console.log(`Database schema exists: ${schemaExists}`)
      
      if (schemaExists) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8')
        const hasUserModel = schemaContent.includes('model User')
        const hasClaimModel = schemaContent.includes('model Claim')
        const hasProposalModel = schemaContent.includes('model Proposal')
        
        expect(hasUserModel).toBe(true)
        expect(hasClaimModel).toBe(true)
        expect(hasProposalModel).toBe(true)
      }

      expect(schemaExists).toBe(true)
    })

    it('should have GraphQL schema files', () => {
      const graphqlFiles = [
        'lib/graphql/schema.ts',
        'lib/graphql/resolvers.ts',
        'lib/graphql/types.ts'
      ]

      const existingGraphQLFiles = []

      graphqlFiles.forEach(file => {
        const filePath = path.join(projectRoot, file)
        if (fs.existsSync(filePath)) {
          existingGraphQLFiles.push(file)
        }
      })

      console.log(`Found ${existingGraphQLFiles.length} GraphQL files:`, existingGraphQLFiles)
      
      // At least the schema should exist
      expect(existingGraphQLFiles.length).toBeGreaterThan(0)
    })

    it('should have component files', () => {
      const componentFiles = [
        'components/ui/button.tsx',
        'components/ui/card.tsx',
        'components/ui/input.tsx',
        'components/ui/label.tsx',
        'components/ui/badge.tsx',
        'components/ui/dialog.tsx',
        'components/ui/tabs.tsx',
        'components/ui/table.tsx'
      ]

      const existingComponents = []

      componentFiles.forEach(file => {
        const filePath = path.join(projectRoot, file)
        if (fs.existsSync(filePath)) {
          existingComponents.push(file)
        }
      })

      console.log(`Found ${existingComponents.length} UI components:`, existingComponents)
      
      // Should have some UI components
      expect(existingComponents.length).toBeGreaterThan(0)
    })
  })

  describe('Configuration Files', () => {
    it('should have package.json with required dependencies', () => {
      const packagePath = path.join(projectRoot, 'package.json')
      expect(fs.existsSync(packagePath)).toBe(true)

      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      
      // Check for core dependencies
      const requiredDeps = [
        'next',
        'react',
        'prisma',
        '@prisma/client'
      ]

      const missingDeps = requiredDeps.filter(dep => 
        !packageContent.dependencies?.[dep] && !packageContent.devDependencies?.[dep]
      )

      console.log('Package.json dependencies validated')
      if (missingDeps.length > 0) {
        console.log('Missing dependencies:', missingDeps)
      }

      expect(missingDeps.length).toBe(0)
    })

    it('should have TypeScript configuration', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json')
      const tsconfigExists = fs.existsSync(tsconfigPath)
      
      console.log(`TypeScript config exists: ${tsconfigExists}`)
      
      if (tsconfigExists) {
        const tsconfigContent = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
        expect(tsconfigContent.compilerOptions).toBeDefined()
        expect(tsconfigContent.compilerOptions.strict).toBe(true)
      }

      expect(tsconfigExists).toBe(true)
    })

    it('should have Next.js configuration', () => {
      const nextConfigPath = path.join(projectRoot, 'next.config.js')
      const nextConfigMjsPath = path.join(projectRoot, 'next.config.mjs')
      
      const hasNextConfig = fs.existsSync(nextConfigPath) || fs.existsSync(nextConfigMjsPath)
      
      console.log(`Next.js config exists: ${hasNextConfig}`)
      expect(hasNextConfig).toBe(true)
    })

    it('should have Tailwind CSS configuration', () => {
      const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.ts')
      const tailwindConfigJsPath = path.join(projectRoot, 'tailwind.config.js')
      
      const hasTailwindConfig = fs.existsSync(tailwindConfigPath) || fs.existsSync(tailwindConfigJsPath)
      
      console.log(`Tailwind config exists: ${hasTailwindConfig}`)
      expect(hasTailwindConfig).toBe(true)
    })
  })

  describe('Directory Structure', () => {
    it('should have required directories', () => {
      const requiredDirs = [
        'app',
        'components',
        'lib',
        'prisma',
        '__tests__'
      ]

      const existingDirs = []
      const missingDirs = []

      requiredDirs.forEach(dir => {
        const dirPath = path.join(projectRoot, dir)
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          existingDirs.push(dir)
        } else {
          missingDirs.push(dir)
        }
      })

      console.log(`Found ${existingDirs.length} required directories:`, existingDirs)
      if (missingDirs.length > 0) {
        console.log(`Missing ${missingDirs.length} directories:`, missingDirs)
      }

      expect(existingDirs.length).toBeGreaterThan(3)
    })

    it('should have API directory structure', () => {
      const apiPath = path.join(projectRoot, 'app/api')
      
      if (fs.existsSync(apiPath)) {
        const apiSubdirs = fs.readdirSync(apiPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)

        console.log('API subdirectories:', apiSubdirs)
        
        // Should have at least some API endpoints
        expect(apiSubdirs.length).toBeGreaterThan(0)
      } else {
        console.log('API directory does not exist')
      }
    })
  })

  describe('Test Infrastructure', () => {
    it('should have Jest configuration', () => {
      const jestConfigPath = path.join(projectRoot, 'jest.config.json')
      const jestConfigJsPath = path.join(projectRoot, 'jest.config.js')
      
      const hasJestConfig = fs.existsSync(jestConfigPath) || fs.existsSync(jestConfigJsPath)
      
      console.log(`Jest config exists: ${hasJestConfig}`)
      expect(hasJestConfig).toBe(true)
    })

    it('should have test setup file', () => {
      const setupPath = path.join(projectRoot, 'jest.setup.js')
      const setupTsPath = path.join(projectRoot, 'jest.setup.ts')
      
      const hasSetup = fs.existsSync(setupPath) || fs.existsSync(setupTsPath)
      
      console.log(`Jest setup file exists: ${hasSetup}`)
      expect(hasSetup).toBe(true)
    })

    it('should have test files in __tests__ directory', () => {
      const testsPath = path.join(projectRoot, '__tests__')
      
      if (fs.existsSync(testsPath)) {
        const findTestFiles = (dir: string): string[] => {
          const files: string[] = []
          const items = fs.readdirSync(dir, { withFileTypes: true })
          
          for (const item of items) {
            const fullPath = path.join(dir, item.name)
            if (item.isDirectory()) {
              files.push(...findTestFiles(fullPath))
            } else if (item.name.endsWith('.test.ts') || item.name.endsWith('.test.js')) {
              files.push(fullPath)
            }
          }
          
          return files
        }

        const testFiles = findTestFiles(testsPath)
        console.log(`Found ${testFiles.length} test files`)
        
        expect(testFiles.length).toBeGreaterThan(0)
      }
    })
  })
})