import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function generateStandardSlide(productGroupName: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{productName}} – {{categoryName}}</title>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    .slide { width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #309E3B 0%, #1A1A1A 100%); color: white; text-align: center; padding: 60px; box-sizing: border-box; }
    h1 { font-size: 4rem; margin: 0 0 20px 0; font-weight: 700; }
    .subtitle { font-size: 1.5rem; opacity: 0.9; margin-bottom: 30px; }
    .logo { font-size: 2rem; margin-bottom: 40px; font-weight: 700; }
    .city { margin-top: 40px; font-size: 1rem; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="slide">
    <div>
      <div class="logo">${productGroupName}</div>
      <h1>{{productName}}</h1>
      <p class="subtitle">für {{categoryName}}</p>
      <p class="city">📍 {{customerCity}}</p>
    </div>
  </div>
</body>
</html>`
}

function generateStandardWebsite(productGroupName: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{productName}} – {{categoryName}}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #1A1A1A; background: #F5F5F5; }
    nav { background: #1A1A1A; color: white; padding: 16px 40px; display: flex; align-items: center; gap: 12px; }
    nav .logo { font-weight: 700; font-size: 1.2rem; color: #309E3B; }
    nav .product { font-size: 0.95rem; opacity: 0.7; }
    .hero { background: linear-gradient(135deg, #309E3B 0%, #1A1A1A 100%); color: white; padding: 80px 40px; text-align: center; }
    .hero h1 { font-size: 3rem; font-weight: 700; margin-bottom: 16px; }
    .hero p { font-size: 1.25rem; opacity: 0.9; max-width: 600px; margin: 0 auto; }
    .section { max-width: 900px; margin: 0 auto; padding: 60px 40px; }
    .section h2 { font-size: 1.75rem; font-weight: 700; color: #309E3B; margin-bottom: 24px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-top: 32px; }
    .card { background: white; border-radius: 8px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-top: 4px solid #309E3B; }
    .card h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 10px; }
    .card p { font-size: 0.95rem; color: #6B6B6B; line-height: 1.6; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
    .info-item { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .info-item .label { font-size: 0.8rem; color: #6B6B6B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .info-item .value { font-weight: 600; font-size: 1rem; }
    .cta { background: #309E3B; color: white; text-align: center; padding: 60px 40px; margin-top: 60px; }
    .cta h2 { font-size: 2rem; margin-bottom: 16px; }
    .cta p { opacity: 0.9; max-width: 500px; margin: 0 auto 32px; }
    .cta-btn { display: inline-block; background: white; color: #309E3B; font-weight: 700; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 1rem; }
    footer { background: #1A1A1A; color: #6B6B6B; text-align: center; padding: 24px; font-size: 0.85rem; }
  </style>
</head>
<body>
  <nav>
    <span class="logo">${productGroupName}</span>
    <span class="product">/ {{productName}}</span>
  </nav>

  <div class="hero">
    <h1>{{productName}}</h1>
    <p>Die optimale Digital Signage Lösung für {{categoryName}}</p>
  </div>

  <div class="section">
    <h2>Über die Lösung</h2>
    <p style="color:#6B6B6B; line-height:1.8;">{{productDescription}}</p>

    <div class="cards">
      <div class="card">
        <h3>Maßgeschneidert</h3>
        <p>Speziell entwickelt für die Anforderungen im Bereich {{categoryName}}.</p>
      </div>
      <div class="card">
        <h3>Bewährte Technologie</h3>
        <p>Basierend auf ${productGroupName} – langjährig erprobt und zuverlässig.</p>
      </div>
      <div class="card">
        <h3>Full-Service</h3>
        <p>Von der Installation bis zum laufenden Betrieb – alles aus einer Hand.</p>
      </div>
    </div>
  </div>

  <div class="section" style="padding-top:0;">
    <h2>Details</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Branche</div>
        <div class="value">{{categoryName}}</div>
      </div>
      <div class="info-item">
        <div class="label">Standort</div>
        <div class="value">{{customerCity}}</div>
      </div>
      <div class="info-item">
        <div class="label">Produktgruppe</div>
        <div class="value">${productGroupName}</div>
      </div>
      <div class="info-item">
        <div class="label">Erstellt</div>
        <div class="value">{{createdDate}}</div>
      </div>
    </div>
  </div>

  <div class="cta">
    <h2>Interesse geweckt?</h2>
    <p>Kontaktieren Sie uns für ein unverbindliches Beratungsgespräch.</p>
    <a href="mailto:info@ibox.at" class="cta-btn">Jetzt anfragen</a>
  </div>

  <footer>
    Erstellt am {{createdDate}} · © ibox group – Digital Signage Solutions
  </footer>
</body>
</html>`
}

async function main() {
  console.log("🌱 Seeding standard templates (one per product group)...")

  const productGroups = await prisma.productGroup.findMany()
  console.log(`Found ${productGroups.length} product groups`)

  let created = 0
  let skipped = 0

  for (const pg of productGroups) {
    const existing = await prisma.template.findFirst({
      where: {
        productGroupId: pg.id,
        isStandard: true,
      },
    })

    if (existing) {
      console.log(`⏭  Skipped: ${pg.name} (Standard exists)`)
      skipped++
      continue
    }

    await prisma.template.create({
      data: {
        name: `${pg.name} – Standard`,
        description: `Standard-Template für ${pg.name}`,
        productGroupId: pg.id,
        isStandard: true,
        isActive: true,
        htmlSlide: generateStandardSlide(pg.name),
        htmlWebsite: generateStandardWebsite(pg.name),
      },
    })

    console.log(`✓  Created Standard: ${pg.name}`)
    created++
  }

  console.log(`\n✅ Done! Created ${created} standard templates, skipped ${skipped}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
