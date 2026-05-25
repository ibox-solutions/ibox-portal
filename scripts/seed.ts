import { prisma } from '@/lib/db'

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'admin@ibox.eu.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'ADMIN',
    },
  })
  console.log('✅ User created:', user.email)
}

main().catch(console.error).finally(() => process.exit(0))
