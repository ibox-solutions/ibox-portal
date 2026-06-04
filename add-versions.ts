import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("📦 Adding versions to products without versions...")

  const products = await prisma.product.findMany({
    include: { versions: true },
  })

  for (const product of products) {
    if (product.versions.length === 0) {
      await prisma.productVersion.create({
        data: {
          productId: product.id,
          version: "1.0",
          releaseDate: new Date(),
          description: `Version 1.0 for ${product.name}`,
          isActive: true,
          displayOrder: 1,
        },
      })
      console.log(`✅ Added version to: ${product.name}`)
    }
  }

  console.log("\n✅ Done!")
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
