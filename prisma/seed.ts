import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // DELETE ALLES ZUERST
  await prisma.presentation.deleteMany({})
  await prisma.presentationOffer.deleteMany({})
  await prisma.presentationProduct.deleteMany({})
  await prisma.productVersion.deleteMany({})
  await prisma.template.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.design.deleteMany({})
  await prisma.additionalOffer.deleteMany({})
  await prisma.industryCategory.deleteMany({})
  await prisma.productGroup.deleteMany({})

  console.log('🧹 Alte Daten gelöscht')

  // 1. PRODUKTGRUPPEN
  const ibox = await prisma.productGroup.create({
    data: { name: 'ibox', slug: 'ibox' },
  })
  const iboard = await prisma.productGroup.create({
    data: { name: 'iboard', slug: 'iboard' },
  })
  const saas = await prisma.productGroup.create({
    data: { name: 'SaaS', slug: 'saas' },
  })
  const service = await prisma.productGroup.create({
    data: { name: 'Dienstleistung', slug: 'dienstleistung' },
  })

  console.log('✅ Produktgruppen erstellt')

  // 2. DESIGNS
  const designs = [
    { name: 'Standard', slug: 'standard' },
    { name: 'Premium', slug: 'premium' },
    { name: 'Minimal', slug: 'minimal' },
  ]

  for (const design of designs) {
    await prisma.design.create({ data: design })
  }

  console.log('✅ Designs erstellt')

  // 3. KATEGORIEN (50+)
  const categories = [
    { name: 'Gastronomie', path: '1' },
    { name: 'Hotels & Beherbergung', path: '1.1' },
    { name: 'Cafés & Bars', path: '1.2' },
    { name: 'Restaurants', path: '1.3' },
    { name: 'Einzelhandel', path: '2' },
    { name: 'Modeboutiques', path: '2.1' },
    { name: 'Elektronik-Shops', path: '2.2' },
    { name: 'Supermärkte', path: '2.3' },
    { name: 'Parfümerien', path: '2.4' },
    { name: 'Spielwarengeschäfte', path: '2.5' },
    { name: 'Buchhandlungen', path: '2.6' },
    { name: 'Großhandel', path: '3' },
    { name: 'Lebensmittel-Großhandel', path: '3.1' },
    { name: 'Textil-Großhandel', path: '3.2' },
    { name: 'Gewerbe & Handwerk', path: '4' },
    { name: 'Baubetriebe', path: '4.1' },
    { name: 'Fleischereien', path: '4.2' },
    { name: 'Bäckereien', path: '4.3' },
    { name: 'Schlossereien', path: '4.4' },
    { name: 'Elektroinstallationen', path: '4.5' },
    { name: 'Klempnereien', path: '4.6' },
    { name: 'Malerhandwerk', path: '4.7' },
    { name: 'Industrie', path: '5' },
    { name: 'Maschinenbau', path: '5.1' },
    { name: 'Metallverarbeitung', path: '5.2' },
    { name: 'Chemische Industrie', path: '5.3' },
    { name: 'Pharmazie', path: '5.4' },
    { name: 'Holzverarbeitung', path: '5.5' },
    { name: 'Information & Consulting', path: '6' },
    { name: 'IT-Unternehmen', path: '6.1' },
    { name: 'Telekommunikation', path: '6.2' },
    { name: 'Finanzberatung', path: '6.3' },
    { name: 'Unternehmensberatung', path: '6.4' },
    { name: 'Immobilienmakler', path: '6.5' },
    { name: 'Werbeagenturen', path: '6.6' },
    { name: 'Medienunternehmen', path: '6.7' },
    { name: 'Transport & Verkehr', path: '7' },
    { name: 'Logistikunternehmen', path: '7.1' },
    { name: 'Speditionen', path: '7.2' },
    { name: 'Taxiunternehmen', path: '7.3' },
    { name: 'Busunternehmen', path: '7.4' },
    { name: 'Gesundheit & Wellness', path: '8' },
    { name: 'Apotheken', path: '8.1' },
    { name: 'Zahnarztpraxen', path: '8.2' },
    { name: 'Fitnessstudios', path: '8.3' },
    { name: 'Wellness-Center', path: '8.4' },
    { name: 'Bildung', path: '9' },
    { name: 'Schulen', path: '9.1' },
    { name: 'Universitäten', path: '9.2' },
    { name: 'Sprachschulen', path: '9.3' },
  ]

  for (const cat of categories) {
    await prisma.industryCategory.create({
      data: { name: cat.name, slug: cat.name.toLowerCase().replace(/\s+/g, '-'), path: cat.path },
    })
  }

  console.log('✅ 50+ Kategorien erstellt')

  // 4. ZUSATZANGEBOTE
  const offers = [
    { name: 'Müllsackabo', slug: 'muellsackabo', category: 'Subscription' },
    { name: 'Hundekotsackerl-Abo', slug: 'hundekotsackerl-abo', category: 'Subscription' },
    { name: 'Content-Management', slug: 'content-management', category: 'Service' },
    { name: 'Remote-Support', slug: 'remote-support', category: 'Service' },
  ]

  for (const offer of offers) {
    await prisma.additionalOffer.create({ data: offer })
  }

  console.log('✅ Zusatzangebote erstellt')

  // 5. PRODUKTE
  const products = [
    { name: '4K Display 65"', slug: '4k-display-65', productGroupId: ibox.id },
    { name: 'Full HD Display 55"', slug: 'full-hd-display-55', productGroupId: ibox.id },
    { name: 'iboard Standard', slug: 'iboard-standard', productGroupId: iboard.id },
    { name: 'iboard Professional', slug: 'iboard-professional', productGroupId: iboard.id },
  ]

  for (const product of products) {
    await prisma.product.create({ data: product })
  }

  console.log('✅ Demo-Produkte erstellt')
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
