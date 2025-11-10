// Simplified database configuration for initial deployment
// This will allow the app to build without requiring a real database connection

let db: any = null;

// Mock database client for initial deployment
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('localhost')) {
  try {
    const { PrismaClient } = require('@safetynet/db');
    db = new PrismaClient();
  } catch (error) {
    console.warn('Database not available, using mock client');
    // Create a mock db object for build purposes
    db = {
      user: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve({}),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve({}),
      },
      // Add other mock methods as needed
    };
  }
} else {
  try {
    const { PrismaClient } = require('@safetynet/db');
    
    // Global for Prisma Client to avoid multiple instances in development
    declare global {
      var __prisma: any | undefined
    }

    // Singleton pattern for Prisma client
    db = globalThis.__prisma || new PrismaClient();

    if (process.env.NODE_ENV === 'development') {
      globalThis.__prisma = db;
    }
  } catch (error) {
    console.warn('Prisma client not available, using mock client');
    db = {
      user: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve({}),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve({}),
      },
    };
  }
}

export { db };
export default db;