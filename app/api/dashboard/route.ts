import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [
      totalPresentations,
      publishedPresentations,
      draftPresentations,
      totalProducts,
      totalProductGroups,
      totalTemplates,
      totalUsers,
      recentPresentations,
      presentationsByStatus,
      presentationsByType,
      productGroups,
    ] = await Promise.all([
      prisma.presentation.count(),
      prisma.presentation.count({ where: { status: "PUBLISHED" } }),
      prisma.presentation.count({ where: { status: "DRAFT" } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.productGroup.count(),
      prisma.template.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.presentation.findMany({
        take: 6,
        orderBy: { updatedAt: "desc" },
        include: {
          baseProductVersion: { include: { product: { include: { productGroup: true } } } },
          baseCategory: true,
        },
      }),
      prisma.presentation.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.presentation.groupBy({
        by: ["presentationType"],
        _count: { presentationType: true },
      }),
      prisma.productGroup.findMany({
        include: {
          products: { include: { _count: { select: { versions: true } } } },
          _count: { select: { templates: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ])

    // Presentations per product group
    const presentationsPerGroup = await prisma.presentation.findMany({
      include: {
        baseProductVersion: { include: { product: { include: { productGroup: true } } } },
      },
    })

    const groupCounts: Record<string, { name: string; count: number; color: string }> = {}
    const groupColors = ["#309E3B", "#1A1A1A", "#6B6B6B", "#E8A020", "#2563EB", "#DC2626"]
    presentationsPerGroup.forEach((p) => {
      const groupName = p.baseProductVersion?.product?.productGroup?.name || "Unbekannt"
      if (!groupCounts[groupName]) {
        const idx = Object.keys(groupCounts).length
        groupCounts[groupName] = { name: groupName, count: 0, color: groupColors[idx % groupColors.length] }
      }
      groupCounts[groupName].count++
    })

    return NextResponse.json({
      stats: {
        totalPresentations,
        publishedPresentations,
        draftPresentations,
        totalProducts,
        totalProductGroups,
        totalTemplates,
        totalUsers,
      },
      recentPresentations: recentPresentations.map((p) => ({
        id: p.id,
        title: p.title,
        customerCity: p.customerCity,
        status: p.status,
        presentationType: p.presentationType,
        productName: p.baseProductVersion?.product?.name,
        productGroupName: p.baseProductVersion?.product?.productGroup?.name,
        categoryName: p.baseCategory?.name,
        updatedAt: p.updatedAt,
        createdAt: p.createdAt,
      })),
      presentationsByStatus,
      presentationsByType,
      presentationsPerGroup: Object.values(groupCounts),
      productGroups: productGroups.map((pg) => ({
        id: pg.id,
        name: pg.name,
        productCount: pg.products.length,
        templateCount: pg._count.templates,
      })),
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
