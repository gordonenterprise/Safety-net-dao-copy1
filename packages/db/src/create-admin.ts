import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminUser() {
  const adminEmail = 'admin@safetynet.dao'
  const adminPassword = 'admin123' // Change this in production
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })
  
  if (existingAdmin) {
    console.log('Admin user already exists:', adminEmail)
    return
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 12)
  
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'SafetyNet Admin',
      password: hashedPassword,
      role: 'ADMIN',
      membershipStatus: 'ACTIVE',
      emailVerified: new Date(),
    }
  })
  
  console.log('Admin user created successfully:')
  console.log('Email:', adminEmail)
  console.log('Password:', adminPassword)
  console.log('User ID:', admin.id)
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'CREATE',
      entityType: 'user',
      entityId: admin.id,
      metadata: {
        action: 'admin_user_created',
        seedScript: true
      }
    }
  })
}

createAdminUser()
  .catch((e) => {
    console.error('Error creating admin user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })