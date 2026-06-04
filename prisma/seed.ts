import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting seed...")

  // Hash demo password
  const hashedPassword = await bcrypt.hash("demo123", 10)

  // Delete existing demo users
  await prisma.user.deleteMany({
    where: { email: { contains: "@ibox.eu" } },
  })

  // Create demo users
  const user1 = await prisma.user.create({
    data: {
      email: "john@ibox.eu",
      password: hashedPassword,
      name: "John Doe",
      role: "MITARBEITER",
      isActive: true,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: "admin@ibox.eu",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      isActive: true,
    },
  })

  console.log("✅ Seeded users:")
  console.log(`  - ${user1.email} (MITARBEITER)`)
  console.log(`  - ${user2.email} (ADMIN)`)

  // Seed Products & Versions if not exist
  const iboxGroup = await prisma.productGroup.findUnique({
    where: { slug: "ibox" },
  })

  if (iboxGroup && (await prisma.product.count({ where: { productGroupId: iboxGroup.id } })) === 0) {
    console.log("\n📦 Seeding Products...")

    // Create products for ibox group
    const product1 = await prisma.product.create({
      data: {
        productGroupId: iboxGroup.id,
        name: "ibox.city",
        slug: "ibox-city",
        description: "Digitale Stadtmöblierung mit interaktiven Displays",
        displayOrder: 1,
        isActive: true,
      },
    })

    const product2 = await prisma.product.create({
      data: {
        productGroupId: iboxGroup.id,
        name: "ibox.indoor",
        slug: "ibox-indoor",
        description: "Indoor Digital Signage Systeme",
        displayOrder: 2,
        isActive: true,
      },
    })

    // Create versions for products
    await prisma.productVersion.create({
      data: {
        productId: product1.id,
        version: "1.0",
        releaseDate: new Date("2024-01-01"),
        description: "Initial release",
        isActive: true,
        displayOrder: 1,
      },
    })

    await prisma.productVersion.create({
      data: {
        productId: product2.id,
        version: "2.0",
        releaseDate: new Date("2024-06-01"),
        description: "Latest version",
        isActive: true,
        displayOrder: 1,
      },
    })

    console.log("✅ Products & versions seeded!")
  }

  console.log("\n📝 Demo password: demo123")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
