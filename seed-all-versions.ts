import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding all products with versions...")

  // Get all products
  const products = await prisma.product.findMany()

  let count = 0
  for (const product of products) {
    // Check if product already has versions
    const versionCount = await prisma.productVersion.count({
      where: { productId: product.id }
    })

    if (versionCount === 0) {
      // Create 2 versions per product
      await prisma.productVersion.createMany({
        data: [
          {
            productId: product.id,
            version: "1.0",
            releaseDate: new Date("2024-01-01"),
            description: `Initial release of ${product.name}`,
            isActive: true,
            displayOrder: 1,
          },
          {
            productId: product.id,
            version: "2.0",
            releaseDate: new Date("2024-06-01"),
            description: `Latest version of ${product.name}`,
            isActive: true,
            displayOrder: 2,
          }
        ]
      })
      count++
      console.log(`✅ ${product.name}: Added 2 versions`)
    }
  }

  console.log(`\n✅ Seeded ${count} products with versions!`)
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
