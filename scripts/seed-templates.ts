import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Generates a Slide HTML template with {{placeholders}}
 * Variants by design style.
 */
function generateSlideTemplate(designSlug: string, productGroupName: string): string {
  const baseStyles = {
    standard: { bg: "#309E3B", accent: "#1A1A1A" },
    premium: { bg: "#1A1A1A", accent: "#D4AF37" },
    minimal: { bg: "#FFFFFF", accent: "#1A1A1A" },
  }
  const style = baseStyles[designSlug as keyof typeof baseStyles] || baseStyles.standard

  if (designSlug === "minimal") {
    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{productName}} – {{categoryName}}</title>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background: ${style.bg}; color: ${style.accent}; }
    .slide { width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; padding: 60px; box-sizing: border-box; }
    .content { max-width: 800px; }
    .label { font-size: 0.9rem; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.6; margin-bottom: 24px; }
    h1 { font-size: 4.5rem; margin: 0 0 24px 0; font-weight: 300; letter-spacing: -0.02em; line-height: 1; }
    .divider { width: 60px; height: 2px; background: ${style.accent}; margin: 32px 0; }
    .subtitle { font-size: 1.25rem; opacity: 0.7; max-width: 500px; }
    .city { margin-top: 48px; font-size: 0.95rem; opacity: 0.5; }
  </style>
</head>
<body>
  <div class="slide">
    <div class="content">
      <div class="label">${productGroupName}</div>
      <h1>{{productName}}</h1>
      <div class="divider"></div>
      <p class="subtitle">für {{categoryName}}</p>
      <p class="city">📍 {{customerCity}}</p>
    </div>
  </div>
</body>
</html>`
  }

  if (designSlug === "premium") {
    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{productName}} – {{categoryName}}</title>
  <style>
    body { margin: 0; padding: 0; font-family: Georgia, serif; }
    .slide { width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; background: ${style.bg}; color: white; text-align: center; padding: 60px; box-sizing: border-box; position: relative; overflow: hidden; }
    .slide::before { content: ''; position: absolute; top: 40px; left: 40px; right: 40px; bottom: 40px; border: 1px solid ${style.accent}; opacity: 0.3; pointer-events: none; }
    .content { position: relative; z-index: 1; }
    .label { font-size: 0.85rem; letter-spacing: 0.4em; color: ${style.accent}; text-transform: uppercase; margin-bottom: 40px; }
    h1 { font-size: 5rem; margin: 0 0 24px 0; font-weight: 400; font-style: italic; }
    .ornament { color: ${style.accent}; font-size: 1.5rem; margin: 24px 0; letter-spacing: 1em; }
    .subtitle { font-size: 1.5rem; opacity: 0.9; }
    .city { margin-top: 48px; font-size: 1rem; opacity: 0.7; font-style: italic; }
  </style>
</head>
<body>
  <div class="slide">
    <div class="content">
      <div class="label">${productGroupName}</div>
      <h1>{{productName}}</h1>
      <div class="ornament">◆ ◆ ◆</div>
      <p class="subtitle">für {{categoryName}}</p>
      <p class="city">{{customerCity}}</p>
    </div>
  </div>
</body>
</html>`
  }

  // standard
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{productName}} – {{categoryName}}</title>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    .slide { width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, ${style.bg} 0%, ${style.accent} 100%); color: white; text-align: center; padding: 60px; box-sizing: border-box; }
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

/**
 * Generates a Website HTML template with {{placeholders}}
 */
function generateWebsiteTemplate(designSlug: string, productGroupName: string): string {
  const baseStyles = {
    standard: { primary: "#309E3B", dark: "#1A1A1A", bg: "#F5F5F5" },
    premium: { primary: "#D4AF37", dark: "#0A0A0A", bg: "#1A1A1A" },
    minimal: { primary: "#1A1A1A", dark: "#FFFFFF", bg: "#FAFAFA" },
  }
  const style = baseStyles[designSlug as keyof typeof baseStyles] || baseStyles.standard

  if (designSlug === "minimal") {
    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{productName}} – {{categoryName}}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; color: ${style.primary}; background: ${style.bg}; line-height: 1.6; }
    .container { max-width: 720px; margin: 0 auto; padding: 80px 40px; }
    .label { font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.5; margin-bottom: 32px; }
    h1 { font-size: 3.5rem; font-weight: 300; letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 24px; }
    .lead { font-size: 1.25rem; opacity: 0.7; margin-bottom: 64px; max-width: 500px; }
    h2 { font-size: 1.5rem; font-weight: 400; margin: 64px 0 16px 0; }
    p { margin-bottom: 16px; opacity: 0.8; }
    .meta { margin-top: 80px; padding-top: 32px; border-top: 1px solid rgba(0,0,0,0.1); font-size: 0.85rem; opacity: 0.5; display: flex; gap: 32px; flex-wrap: wrap; }
    .meta div span { display: block; opacity: 0.6; margin-bottom: 4px; }
    .cta { margin-top: 48px; }
    .cta a { color: ${style.primary}; text-decoration: underline; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="label">${productGroupName}</div>
    <h1>{{productName}}</h1>
    <p class="lead">Eine maßgeschneiderte Digital Signage Lösung für {{categoryName}} in {{customerCity}}.</p>

    <h2>Über die Lösung</h2>
    <p>{{productDescription}}</p>

    <h2>Vorteile</h2>
    <p>Speziell entwickelt für die Anforderungen im Bereich {{categoryName}}, basierend auf bewährter ${productGroupName} Technologie mit professioneller Unterstützung.</p>

    <div class="cta">
      <a href="mailto:info@ibox.at">Anfrage senden →</a>
    </div>

    <div class="meta">
      <div><span>Branche</span>{{categoryName}}</div>
      <div><span>Standort</span>{{customerCity}}</div>
      <div><span>Erstellt</span>{{createdDate}}</div>
    </div>
  </div>
</body>
</html>`
  }

  if (designSlug === "premium") {
    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{productName}} – {{categoryName}}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; color: white; background: ${style.bg}; line-height: 1.7; }
    nav { padding: 24px 60px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid rgba(212,175,55,0.2); }
    nav .logo { font-weight: 400; font-size: 1.3rem; color: ${style.primary}; letter-spacing: 0.1em; }
    .hero { padding: 100px 60px; text-align: center; border-bottom: 1px solid rgba(212,175,55,0.2); }
    .hero .ornament { color: ${style.primary}; font-size: 1.2rem; letter-spacing: 1em; margin-bottom: 24px; }
    .hero h1 { font-size: 4rem; font-weight: 400; font-style: italic; margin-bottom: 24px; }
    .hero p { font-size: 1.4rem; opacity: 0.8; max-width: 600px; margin: 0 auto; }
    .section { max-width: 900px; margin: 0 auto; padding: 80px 60px; }
    .section h2 { font-size: 2rem; font-weight: 400; color: ${style.primary}; margin-bottom: 32px; font-style: italic; }
    .section p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 24px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 48px; padding: 48px; border: 1px solid rgba(212,175,55,0.3); }
    .info-item .label { font-size: 0.75rem; color: ${style.primary}; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 8px; }
    .info-item .value { font-size: 1.2rem; font-weight: 400; }
    .cta { text-align: center; padding: 100px 60px; border-top: 1px solid rgba(212,175,55,0.2); }
    .cta h2 { font-size: 2.5rem; font-style: italic; font-weight: 400; margin-bottom: 24px; }
    .cta-btn { display: inline-block; border: 1px solid ${style.primary}; color: ${style.primary}; padding: 18px 48px; text-decoration: none; font-size: 0.9rem; letter-spacing: 0.3em; text-transform: uppercase; margin-top: 24px; }
    footer { padding: 40px 60px; text-align: center; opacity: 0.5; font-size: 0.85rem; font-style: italic; }
  </style>
</head>
<body>
  <nav>
    <span class="logo">${productGroupName}</span>
  </nav>

  <div class="hero">
    <div class="ornament">◆ ◆ ◆</div>
    <h1>{{productName}}</h1>
    <p>Eine exklusive Digital Signage Lösung für {{categoryName}}</p>
  </div>

  <div class="section">
    <h2>Über die Lösung</h2>
    <p>{{productDescription}}</p>

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
        <div class="label">Produktlinie</div>
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
    <a href="mailto:info@ibox.at" class="cta-btn">Kontakt aufnehmen</a>
  </div>

  <footer>
    © ibox group – Premium Digital Signage Solutions
  </footer>
</body>
</html>`
  }

  // standard
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{productName}} – {{categoryName}}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; color: ${style.dark}; background: ${style.bg}; }
    nav { background: ${style.dark}; color: white; padding: 16px 40px; display: flex; align-items: center; gap: 12px; }
    nav .logo { font-weight: 700; font-size: 1.2rem; color: ${style.primary}; }
    nav .product { font-size: 0.95rem; opacity: 0.7; }
    .hero { background: linear-gradient(135deg, ${style.primary} 0%, ${style.dark} 100%); color: white; padding: 80px 40px; text-align: center; }
    .hero h1 { font-size: 3rem; font-weight: 700; margin-bottom: 16px; }
    .hero p { font-size: 1.25rem; opacity: 0.9; max-width: 600px; margin: 0 auto; }
    .section { max-width: 900px; margin: 0 auto; padding: 60px 40px; }
    .section h2 { font-size: 1.75rem; font-weight: 700; color: ${style.primary}; margin-bottom: 24px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-top: 32px; }
    .card { background: white; border-radius: 8px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-top: 4px solid ${style.primary}; }
    .card h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 10px; }
    .card p { font-size: 0.95rem; color: #6B6B6B; line-height: 1.6; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
    .info-item { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .info-item .label { font-size: 0.8rem; color: #6B6B6B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .info-item .value { font-weight: 600; font-size: 1rem; }
    .cta { background: ${style.primary}; color: white; text-align: center; padding: 60px 40px; margin-top: 60px; }
    .cta h2 { font-size: 2rem; margin-bottom: 16px; }
    .cta p { opacity: 0.9; max-width: 500px; margin: 0 auto 32px; }
    .cta-btn { display: inline-block; background: white; color: ${style.primary}; font-weight: 700; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 1rem; }
    footer { background: ${style.dark}; color: #6B6B6B; text-align: center; padding: 24px; font-size: 0.85rem; }
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
  console.log("🌱 Seeding templates...")

  const productGroups = await prisma.productGroup.findMany()
  const designs = await prisma.design.findMany()

  console.log(`Found ${productGroups.length} product groups and ${designs.length} designs`)
  console.log(`Will create ${productGroups.length * designs.length} templates`)

  let created = 0
  let skipped = 0

  for (const productGroup of productGroups) {
    for (const design of designs) {
      const exists = await prisma.template.findUnique({
        where: {
          productGroupId_designId: {
            productGroupId: productGroup.id,
            designId: design.id,
          },
        },
      })

      if (exists) {
        console.log(`⏭  Skipped: ${productGroup.name} × ${design.name} (already exists)`)
        skipped++
        continue
      }

      await prisma.template.create({
        data: {
          name: `${productGroup.name} – ${design.name}`,
          description: `Standard-Template für ${productGroup.name} im ${design.name}-Design`,
          productGroupId: productGroup.id,
          designId: design.id,
          htmlSlide: generateSlideTemplate(design.slug, productGroup.name),
          htmlWebsite: generateWebsiteTemplate(design.slug, productGroup.name),
          isActive: true,
        },
      })

      console.log(`✓  Created: ${productGroup.name} × ${design.name}`)
      created++
    }
  }

  console.log(`\n✅ Done! Created ${created} templates, skipped ${skipped}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
