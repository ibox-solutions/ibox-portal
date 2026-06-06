import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

const ASANA_API_BASE = "https://app.asana.com/api/1.0"
const ASANA_TOKEN = process.env.ASANA_ACCESS_TOKEN

async function asanaFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${ASANA_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${ASANA_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })
  return res
}

// GET: Check Asana connection + list workspaces
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!ASANA_TOKEN) {
    return NextResponse.json(
      { error: "ASANA_ACCESS_TOKEN nicht konfiguriert" },
      { status: 503 }
    )
  }

  try {
    const res = await asanaFetch("/users/me?opt_fields=name,email,workspaces,workspaces.name")
    if (!res.ok) {
      return NextResponse.json(
        { error: "Asana-Verbindung fehlgeschlagen", status: res.status },
        { status: 502 }
      )
    }
    const data = await res.json()
    return NextResponse.json({
      connected: true,
      user: data.data,
    })
  } catch (e) {
    return NextResponse.json({ error: "Netzwerkfehler zu Asana" }, { status: 502 })
  }
}

// POST: Create an Asana task from a presentation
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!ASANA_TOKEN) {
    return NextResponse.json(
      { error: "ASANA_ACCESS_TOKEN nicht konfiguriert" },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const { presentationId, projectId, taskType, assigneeEmail, dueDate, notes } = body

    if (!presentationId || !projectId) {
      return NextResponse.json(
        { error: "presentationId und projectId sind erforderlich" },
        { status: 400 }
      )
    }

    // Load the presentation
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
      include: {
        baseProductVersion: { include: { product: true } },
        baseCategory: true,
      },
    })

    if (!presentation) {
      return NextResponse.json({ error: "Präsentation nicht gefunden" }, { status: 404 })
    }

    const taskName = buildTaskName(taskType, presentation)
    const taskNotes = buildTaskNotes(taskType, presentation, notes)

    // Create the task in Asana
    const taskPayload: any = {
      data: {
        name: taskName,
        notes: taskNotes,
        projects: [projectId],
      },
    }

    if (dueDate) taskPayload.data.due_on = dueDate

    // Resolve assignee if email provided
    if (assigneeEmail) {
      const userRes = await asanaFetch(
        `/users/${encodeURIComponent(assigneeEmail)}?opt_fields=gid,name,email`
      )
      if (userRes.ok) {
        const userData = await userRes.json()
        taskPayload.data.assignee = userData.data?.gid
      }
    }

    const taskRes = await asanaFetch("/tasks", {
      method: "POST",
      body: JSON.stringify(taskPayload),
    })

    if (!taskRes.ok) {
      const err = await taskRes.json()
      return NextResponse.json(
        { error: "Asana-Task konnte nicht erstellt werden", details: err },
        { status: 502 }
      )
    }

    const taskData = await taskRes.json()
    const taskGid = taskData.data.gid
    const taskUrl = `https://app.asana.com/0/${projectId}/${taskGid}`

    return NextResponse.json({
      success: true,
      task: {
        gid: taskGid,
        name: taskName,
        url: taskUrl,
      },
    })
  } catch (error) {
    console.error("Asana task creation error:", error)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}

function buildTaskName(taskType: string, presentation: any): string {
  const city = presentation.customerCity
  const product = presentation.baseProductVersion?.product?.name || "Präsentation"
  const category = presentation.baseCategory?.name || ""

  switch (taskType) {
    case "followup":
      return `📞 Follow-up: ${product} – ${city} (${category})`
    case "send":
      return `📤 Präsentation versenden: ${product} – ${city}`
    case "review":
      return `👁 Review: ${product}-Präsentation für ${city}`
    case "offer":
      return `💼 Angebot erstellen: ${product} – ${city} (${category})`
    default:
      return `📊 ${presentation.title} – ${city}`
  }
}

function buildTaskNotes(taskType: string, presentation: any, additionalNotes?: string): string {
  const lines = [
    `Präsentation: ${presentation.title}`,
    `Produkt: ${presentation.baseProductVersion?.product?.name || "–"}`,
    `Branche: ${presentation.baseCategory?.name || "–"}`,
    `Stadt: ${presentation.customerCity}`,
    `Typ: ${presentation.presentationType === "begleitet" ? "Begleitet (Pitch)" : "Unbegleitet (E-Mail)"}`,
    `Status: ${presentation.status}`,
    `Erstellt: ${new Date(presentation.createdAt).toLocaleDateString("de-DE")}`,
    "",
    `Portal-Link: /presentations/${presentation.id}`,
  ]

  if (additionalNotes) {
    lines.push("", "Notizen:", additionalNotes)
  }

  return lines.join("\n")
}
