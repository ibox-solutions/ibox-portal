"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

const SLIDE_TYPES = [
  { value: "cover", label: "Deckblatt", icon: "🎯" },
  { value: "content", label: "Inhalt", icon: "📄" },
  { value: "bullets", label: "Aufzählung", icon: "📋" },
  { value: "comparison", label: "Vergleich", icon: "⚖️" },
  { value: "cta", label: "Call to Action", icon: "🚀" },
]

interface Slide {
  id: string
  type: string
  label?: string
  headline?: string
  subheadline?: string
  text?: string
  bullets?: string[]
  ctaText?: string
  backgroundColor?: string
}

export default function PresentationEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const [presentation, setPresentation] = useState<any>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [editorMode, setEditorMode] = useState<"slides" | "sections">("slides")
  const [selectedSlide, setSelectedSlide] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/presentations/${id}/slides`)
      .then((r) => r.json())
      .then((data) => {
        setPresentation(data)
        setSlides((data.slidesData as Slide[]) || [])
        setEditorMode(data.editorMode || "slides")
        if (data.slidesData?.length > 0) setSelectedSlide(data.slidesData[0].id)
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const currentSlide = slides.find((s) => s.id === selectedSlide)

  const updateSlide = (field: string, value: any) => {
    setSlides((prev) => prev.map((s) =>
      s.id === selectedSlide ? { ...s, [field]: value } : s
    ))
  }

  const updateBullet = (index: number, value: string) => {
    const bullets = [...(currentSlide?.bullets || [])]
    bullets[index] = value
    updateSlide("bullets", bullets)
  }

  const addBullet = () => {
    updateSlide("bullets", [...(currentSlide?.bullets || []), ""])
  }

  const removeBullet = (index: number) => {
    const bullets = [...(currentSlide?.bullets || [])]
    bullets.splice(index, 1)
    updateSlide("bullets", bullets)
  }

  const addSlide = () => {
    const newSlide: Slide = {
      id: `slide_${Date.now()}`,
      type: "content",
      headline: "Neue Folie",
      bullets: [],
    }
    setSlides((prev) => [...prev, newSlide])
    setSelectedSlide(newSlide.id)
  }

  const deleteSlide = (slideId: string) => {
    if (slides.length <= 1) return
    const newSlides = slides.filter((s) => s.id !== slideId)
    setSlides(newSlides)
    if (selectedSlide === slideId) setSelectedSlide(newSlides[0]?.id || null)
  }

  const moveSlide = (slideId: string, direction: "up" | "down") => {
    const idx = slides.findIndex((s) => s.id === slideId)
    if (direction === "up" && idx === 0) return
    if (direction === "down" && idx === slides.length - 1) return
    const newSlides = [...slides]
    const target = direction === "up" ? idx - 1 : idx + 1
    ;[newSlides[idx], newSlides[target]] = [newSlides[target], newSlides[idx]]
    setSlides(newSlides)
  }

  const save = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/presentations/${id}/slides`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slidesData: slides, editorMode }),
      })
      if (res.ok) {
        setSaveMessage("✅ Gespeichert")
      } else {
        setSaveMessage("❌ Fehler beim Speichern")
      }
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const exportPDF = async () => {
    setIsExporting(true)
    // Save first
    await fetch(`/api/presentations/${id}/slides`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slidesData: slides, editorMode }),
    })
    // Open print dialog
    const res = await fetch(`/api/presentations/${id}/slides`)
    const data = await res.json()
    const printWindow = window.open("", "_blank")
    if (printWindow && data.htmlSlide) {
      printWindow.document.write(data.htmlSlide)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
    }
    setIsExporting(false)
  }

  const exportHTML = async () => {
    await fetch(`/api/presentations/${id}/slides`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slidesData: slides, editorMode }),
    })
    const res = await fetch(`/api/presentations/${id}/slides`)
    const data = await res.json()
    const html = editorMode === "slides" ? data.htmlSlide : data.htmlWebsite
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${presentation?.title || "praesentation"}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Live preview HTML
  const LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAH0AfQDASIAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAcIBQYBAgQDCf/EAFoQAAEDAgIDBwwOBQkIAgMAAAABAgMEBQYRByFBEhMxUVZh0ggWF1NxdIGRkpOUsRQVGCIjMjZCUnKhstHTJDVic8EzNDc4VXWCtMIlVGNkg7PD4SaiQ6Pw/8QAGwEBAAIDAQEAAAAAAAAAAAAAAAUGAwQHAgH/xAA+EQABAwICAhAFBAICAwEAAAAAAQIDBBEFMRIhBhMUFTJBUVNhcYGRkqHB0SI0UlSxFjPh8CRyYnMjNUKi/9oADAMBAAIRAxEAPwCmQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmsDwxT4wtUM8bZI31TEc1yZoqZniR+gxXch5e7RaruQwoLbXLBGFLg1W1Njo9erdMjRi/ZkRtjfQvGkT6vDE792mtaWd2ef1XfiQNLskpJ3aLrtXpy7yKgxqnlWzvh68iEgfevpKmgq5KSshfBPE7cvY9MlRT4FgRUVLoS6LfWgAB9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM7o++W9n77Z6zBGcwB8tbP33H6zDU/sv6l/Bjm/bd1KW8QBAcgOdkfaYcC0+JLRLcaOFG3anYrmOamuZqfNX+BWl7XMerHtVrmrkqLwopddeLPIq/pusrbPjupWJiMhq2pUMRE1Jnwp40UumxjEHOvTPXLWnqhZsDrHOvA7iyNHABcSxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5RFVckTM3HR3o/uuLZd+ai0tvauT6hycPM1NpPWGNH2F7DTsZBboqiZE99PUN3b1Xw6k8BDYhjdNRLoL8TuRPUjavFIaZdFda8iFW0oa10TpUpJ1jambnb2uSJx5mV0fpnjaz99s9ZZfSJFFHgO8oyNjE9iP+K3LYVp0fIq43s6J/vbPWeKLE98KaV+ja108j5S1u64Xuta3sW6QBAc2KUFIQ6p6mYk1lq0T37myxqvMmS/xJvUhfqn/wCbWT68vqaTWx5VTEGdv4Uk8IW1W3t/BB4AOll1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABs2jfC0+LMSRUDc2U7PhKiT6LEX1rwGsliep2sraLCEl0kam/V0qq1cte4bqT7cyMxetWjpXPbmupOtTRxGp3NAr0zyQka20NLbaCGhoomxU8LUaxiJwIek4OTl7nK5brmpRnKrluprukpcsB3nvR5WfR8uWOLOv8AzbPWWX0m/IK896vKy4DXLGlnX/nI/vFy2OfJTdv4LLg3y0n94i3qAICllZC7CF+qfX9HsaftS+ppNC7CFuqfT4Cxr+1L6mkzsf8A/YM7fwpJYR82zt/BCAAOmF2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABn7NbqWKjhrq6F1TLVP3ujpUduUkdnkrnLsbnq5zw96MS6nlzkahgAb1cLXcqKOofV2OzTxUv85gp3ossKbVXJc07prN8oKeGOGvt73PoanPcbr40bk4WO501a9qKY452vyPLJUdkYsAGcyAAAAAAAAAAAAAAAAAAAmrBmlqw2LCtvtMtvrnyU0KMerdzuVXNVVU185CplKWyz1FOydssSNemaIueZp1lDDWsRkqak1mvU0sdS1GyZE3dnDD39m3HxN/E6v05WFPi2q4L3Van8SGOt+p7fD9v4Drfqu3Q/b+BHfpyg+le9TT3mpPp8yUMWaYLRecNXC1xWutikqYVjY5zmqiKvHkRfgdf/mNoX/nI/vIfKqstRTwPmdLE5rUzVEzzPrgj5YWjvyP7yG5HQQ0UD2wpZFRfwbDKWOmic2NLIpb9AEBysoYUjPTrhW9Ynp7W2z07J1p3yLIivRqpmiZcPcJMBs0dU+kmSZmacpnpqh1PIkjc0Kurorxvn+qE8838R2K8b/2Qnnm/iWhyGRPfqqq+lvn7krv9P9KefuVddosxw1M/adV7kzPxPPNo3xrF8aw1C/VVq+pS1WXcOcj6myqqTNjfP3PqY9PxtTz9ynVwsF7t6K6ttVZA1OFXwqieMxhdZzGvarXtRzV2KmaGpYr0dYXxA1z5qBlLULwT0ybh3hRNSm/T7K43LaZlulNZtQ48xVtI23UVWBv+PdF97w2j6ulT2xt6a99jT37E/ab/ABQ0As9PUxVLNOJ10JyGaOZukxboAAZzKAAAAAAActa5y5NRVXiRD30tkvNUmdNa6yX6sLl/geXOa3NbHxXImZjwZpMJ4mXgsNx8w479Z+Kf7AuHmFMe6IvqTvQ8bbH9SGCBnFwjidOGw3HzDjz1GHb9Tt3U9nr4043QO/A+pPEuTk7z6krFyVDFg7SRyRu3MjHMXicmR1Mp7AByiKqZoigHAOdy76KnO4d9FfEAdQdtw/6K+I6gAAAAAAAHKIqrkiZnO9yfQd4gDqDtvb/oO8Q3D/oO8QB1NtYm7rMKVTVzp8o4ly4Ee2T3yd3Wimpq1U4UVDJ2m7rSU0lFUwNqqKRyPWNy5K1yfOa75qmKViuTUY5GqqaiRsQTWt9fjV1kpJo7sm6ZLvsqObJErvhHMTYu3LXqNDkY6DA0aTalqa5XwtXa1rMnO7maongOqVdgikWeOmuUki8LHzIjV40Vya1Q8N4udRc6hsk25YyNiRwxMTJsbE4ERDWp6dY/h4tWfQljFFErdR4QAbxsgAAAAAAAAAAAAAAAAAA3Gzfqun+p/FTTjcbN+q6f6n8VAPYAADyXj9Wz/VMLgn5X2jvyP7yGau/6tn+oYXBPyvtHfkf3kMVR+07qU8S8BeouAgCA4+c6AAAAAAAAAAAAOHNRzVa5EVFTJUUh7SzosjqY575huFsc7UV89I1Mkk41YnHzExBTcoq6aik0417OJes2aWrkpn6TF/kpQ9rmPVj2q1yLkqKmtFOCa9POBGMZJim0QblEVPZsTE//AGInrIUOm0NbHWwpKztTkUu9LUsqY0e0AHeGKSaZkMLHPkeqNa1qZqqrsNw2DmnhlqJmQwRvlkeuTWNTNVXmQlzA+hiqq446vEs7qWNyI5KaJfhFT9pdhuWiPR5T4bomXG5xMlu0rUXNde8IvzU5+NSRkKViuyN+ksVKurl9vcrVfjLkcscHf7GBsWD8N2SFsdvtNMxU+e9m7eq86rrM4xjWJk1qInMmXqOwKpJPJKt3uVV6Svvle9buW5wMu6cgx3PBxl3QqIvCiKnOcgIqi5irxh2x3eJ0VxtVJUIqZZujTNO4vChFWNdC0e9yVWGJ3Ncmv2LM7NF5mu/EmoG/SYpVUi3jdq5FyNynrp6dbsdq5OIphcaGrt1ZJR11PJTzxrk9j0yVDddDmKaOy3n2uu0FPLbqxyIr5Y0csT9i69nGTTpLwPQ4utbsmshuMTVWCdEyz/ZdxoVhudDVWy4TUNZEsVRA9WPauxULzR1sOL07o3al405OlC001THiEKtXUvGnqhcFtrtjkRyUFGuaalSFv4HKWu2/7hSeZb+BF+gXHCV1I3DNzmVaqFv6K9y/HYnze6hLpRq6CejmWJ6rq80KrVRS00ixvU8a2u2qmS2+kVOeFv4EIadMBRW1/XFZqZI6V65VUTE1Ru+kibEX1k9nxrqaCspJaWpibLDKxWPa7Wiouw9YfiUtHMkiLdONOVD1R1j6aVH3unH1FLQbZpOwjPhLEDqfJz6KfN9NJlwtz+KvOhqZ06GZk8aSMW6KXiORsrEe1dSgJrXIElaEcEe391S8XCP/AGdSP1NXgmenAncTaeKqqjpYllkXUh4nnZBGsj8kN00IYBiobcl9vNKx9VVM+AikbnvbF2qi7VJP9rrfsoaVP+i38D1IiIiNRMkTgQ5OX1lfNVTLK5cyjVNXJPIr1XM8ntbb/wDcqbzTfwPjW01oo6SWqqqWjjhiar3vdE3JETwGQID08Y5dX1j8NWyVPYkDv0mRq/yj0+bnxIZ8NpJq6dI2qtuNeRDLRU8lVKjEXVxmm6S8TRYmxA6ekpmU9DDmynY1iNVW/SXLapqwB02GJsLEjZkhd442xtRrckAAMh7AAAAAAAAAAAAAAAAAAAAABuNm/VdP9T+KmnG42b9V0/1P4qAewAAHku/6tn+oYbA+vGNo78j+8hmbx+rZ/qmHwN8sbR35H95DDUftO6l/Bjl/bd1KW+QBAcgOdhTQ9MOMbjg+gt9RboKeV1RK5jt9RVTJERdim+KQ51Ty/wCy7Kn/ABpV/wDq0k8HhZNWMZIl0W/4N7DY2y1LWvS6fwa6mm/E39n2zyH9I57OGJf7Ptvku/EisF/3moeaQtu91L9CEp9nDE2f6vtnkP6RkLZp0r2vRLlZKeRmetYJFav25kOA8uwSgcltrTzPi4ZSqltBC1uDMfYfxSu80VQsNVlmtPN71/g4/AbWilK6aeamnZPTyvilYu6Y9i5K1eNFLB6GtIvt/E2x3iRfbONuccq5ZTtTZ9ZPtKvi+x9aZqzQa2pmnGn8EFiGEbS1ZItacnISiAgKuQR86mGKop5KeZiPjkarHtVM0VFTJUKnaR8PSYZxZV25WKkG63ynVdsa608XB4C2pE3VIWVtTh6lvTGJvtJJvb12qx3/ALLDscrVgqkjXJ+rt4vYl8GqVin0Fyd+eIgAljqeMLtuF2mxBVx7qCiXcQIvA6VdvgT1kTlqtENsjtmALZGxMnTR7+9cuFXa/VkWfZDVrT0io3N2r3J3F6hYadUTNdRtwAOblLBjr5fLTZKff7tXwUjF4N8dkq9xOFTH6QMSwYVw1UXOREfL8SBmfxpF4PBtUqvfbvcL3cZK+41L55pFzzcupOZE2IT2EYI6vRZHrZieZLYdhi1V3uWzSyE2lfBMT1b7aPfltZE5U9R07LeCf7Qm8w4rGCxJsWo+V3ensTKYFTcq/wB7CzrNLOCXORPbKRue1YXZeo2KwYosN9VW2m6U9S9EzWNrsnoncXWVAPvQVdTQVcdXRzvhnjXdMexclRTHLsVp1b/43Ki9OsxyYDCqfA5UUuiDSdEeMuu2w51OTbjSqjKhE1I7icnd9ZuxSqmnfTyrE9NaFZnhdC9WPzQEMdUZhdj6aDE1JEiSMXeqtU+cnzXL3ODwoTOYnGFtju+GbhbpERUmgcicy5ZovjNjDKtaWpZImXH1cZmoahaedr0y4+oqJQVdRQVsNZSSLFPC9HscmxULSaMMXw4tw+2oduWV0CIyqjReB30k5lKqvarHq1yZKi5KZ7AeJqvCuIIblTKqx57mePPVIxeFC/Yxhja6H4eGmXsW3EaJKqLVwkyLcg8dluVLdrXT3GilSSCdiPaqLnw7F5z2HNHNVqq1yWVCkOarVspgMeYZpMVYfmttTkyTLdQS5a437F7nGVUvlrrLNdai218SxzwPVrk2LzpzKXKI60y4CXFFHHcLZG1LrBk3JVySVnEvOmwsWx/Ftyv2mVfgXyX2UmcIxDaXbU9fhXyILwJhmsxVf4rbStckfxp5ctUbM9ar/AtXYrXR2W1QW23xJFTwtyaibeNV41UwejTCFPhHD7KX3j6yVEfUyp853EnMhtRgxzFVrZdBi/A3Lp6fYxYpX7pfot4KefSADB42xJRYXsU1zrHJmiKkMe2R+WpEIaKN0r0YxLqpGxsdI5GtS6qalptxwmHrUtpt8qJc6tnCnDFGvzu6uwri5yucrnKqqq5qq7T2326Vl6u1Rc66RZJ53bpy8XEicyHhOn4XhzaGBGJwlzXpLxQ0baWLRTPjAAJI3QAAAAAAAAAAAADvvMvan+So3mXtT/JUA6A77zL2p/kqN5l7U/yVAOgO+8y9qf5KjeZe1P8AJUA6A77zL2p/kqN5l7U/yVAOhuNm/VdP9T8TUd5l7U/yVNusyKlsgRUyXc/xUA9gAAPJeP1bP9Uw2B9WMbR35H95DM3dFW2zoiZqrTD4LilTF1pVY3p+lx/NX6SGKf8Aad1KeJeAvUW+QBAcfOdBSGuqe3XsCycW+y+ppMpD3VNse+1WZWtc7KeXgT9lCYwBf8+Pt/CklhPzbO38EEA77zL2p/kqN5l7U/yVOml2OgO+8y9qf5KjeZe1P8lQDoeq1V1RbbjT19I9WTwSI9jk40PhvMvan+So3mXtT/JU+KiOSynxURUspcLC91jveH6G6xoiJUwteqJsXangUyZoegh8jtHVG2TdIrJJGtReLdG+HJa2FIah8aZIqnP6qNIpnMTiUGuaSbelywLeKRG7py0znt+s1N0nqNjPJeG7q01jV4FgkT/6qY6d6xytcnEqHiFyska5OJUKZFycPRthsVBE1MkZTRonkoU7dDKkipvb9S/RUuTakytlMnFCz7qFw2WL/wCOLrX0LHsg4DO30PUACklYIO6pquctVabcjveox8ypz55IQwSv1SbHvxbQ7ljnIlGnAmfzlIr3mXtT/JU6fgbUbQR25PUvOFtRtIyx0B33mXtT/JUbzL2p/kqSxvnQHfeZe1P8lRvMvan+SoBI3U71r6fHi0qK7cVVM9qonGmtCx5WfQLHI3STRq5jkTeZdap+wpZhDn2yhqJWIqcbU9So46iJUovQDhdaKhyFK2QpTrFULafE1zgamTWVcrUTiycpjDOY4ik68bxlG9U9mzfNX6amG3mXtT/JU7BCt42r0IdFjW7EXoJK0H449orklluUqpbqp3vHKuqGReBe4pYpFRURyKioqZoqbSliRTIuaRv8lSweg3Gj7tbUsV0eqV1K34F7885mcWfGhVNkeFaX+VEn+3v7kBjNBdNvYnX7konAOSlFZAAUA+VXUQ0tNJVVEjYoYmq573LkiInCpVvSnjCfFmIHyMcraCnVWU0fN9JedTdNPGNJK2Z2GbTJI6njX9LlZnk930OdEIf3mXtT/JUvmx3CtpZuiVPiXLoT+S14PQbU3bnprXLoQ6A77zL2p/kqN5l7U/yVLSTp0B33mXtT/JUbzL2p/kqAdAd95l7U/wAlRvMvan+SoB0B33mXtT/JUbzL2p/kqAdAd95l7U/yVG8y9qf5KgHQHfeZe1P8lQAfsqAAAAAAAAAAAAvAfmnpp/paxV/es/31P0sXgPzT01f0tYq/vWf76gGoAAA3HQn/AEt4W/vOH7x+jeIoVqLBXwomavpntTyVPzj0Kf0tYX/vOH7yH6VPaj2Kx3A5MlPLm6TVQ+OS6WKguTJypxKcGSxTQOteI7hQPzzgqHtTuZ6vsyMacflYsb1auaKc6e1WOVq8QUkbqf61lPi+eleqJ7Kpla3XtaqLl4syOT3WC5VFnvFLcqZU3ynkR6Iu3jTwpqNrD6lKapZKuSL5GejmSCdr14lLZA8GHrtSXu0U9zono6KZueWetq7Wrzop7zqzXI9Ec3JS/NcjkugAB6PoAMBjzEdPhnD81dI5qzuRWU8arre9U1eBOFTHLK2JivetkQ8ve1jVc7JCCdLdWysx/cnxqqtjekXhaiIv25mqHeeWSed80z1fJI5XPcvCqquaqdDktVNt8z5OVVU59PJtsrn8qg91ggdU3yggaiqslTG1MudyHhNw0PW91wx5QLl7ymVZ3L9VNX25HqjiWaoZGnGqHqmj2yZreVULHqmTMuJCo1d/PZ/3jvWpbl3xV7hUau1Vs6f8R3rUtmy3gRdvoWDZBwWdvofEAFKKwTn1PHyZr++/9KEmkX9Tu9Fw9cY9qVSL42p+BKB1HBfkYuovWG/Ks6gACUN4AAA0TTr/AEfT98RfeK9FhdOv9H03fEX3ivRz/ZT84n+qflSpY98wnV7gbQCtEIWlwF8irN3lF91DNmFwJ8i7N3lF91DNHX6f9pvUh0SLgN6gaRpjxBQ2nCs9DPHHUVFcxY44na8k2vXues2fEN3o7HaJ7nXSIyKFueW1y7GpzqpWPFV8rMQ3ue51j1VZFyYzPVGzY1OYh8dxNKSHa28N3knKR2K1yU8ei3hL/bmLABzgpgO0L97mZJuUduXIuS8CnUH1Fstz6i2LR4Gv9FiLD8FbRokatRI5YdsTkTg7nFzGdKzaN8VTYWvzJ1Vz6KbJlTHn836Sc6f+iylHUQ1dLFVU0jZIZWo9j2rqVFOm4PiTa6C68JM09S74dWpVRX/+kzPqACXJAAAAAAAAAAAAAAAAAAAAAAAAAAAAKfmrptardLmKkVMv9qT/AH1P0qPz36q6zTWfTnf98ZlHXPjrIVy1K17Ezy/xI5ACLAAAbhoU/pawt/ecP3j9K0PzU0J/0t4W/vOH7x+laAEIaf7GtPeae+RMXe6pu9yqiat21NXjT1EXZay1WLrJT4hsFTa6hE+EbnG76D01tXxlXrrRVNtuM9DVxrHPA9WPavGhz7ZJQLBUbc1Phd+So41SrFLtiZO/J5gAVshTatH+NrhhSsVrU9kUEq5zQKv2tXYpPOF8W2PEUKOt9azfss3QPXcyN8G3wFXDlj3Mej2Oc1zVzRUXJUXuk7huOz0SJGqaTeTk6lJWixWWmTQXW0t+CrdLi/E1NGkcN8rUYiZIiyquXjPnW4pxFWRrHU3muexeFu/KiL4ie/VcFr6C37CVXH4rcFfIn/F+O7DhyN7JaltTWImqmhciuz514G+EgPF+Jrjia5rW170RqaooWr72NOJPxMIqqqqqqq8YQruJY1PXfCvwt5E9eUh63E5ar4cm8nuEABDEaNpN+gCxOprRUXyePcvqnb3Dn2tOFfCvqIpwZYKrEd+gt1O1dy5d1M/Yxm1V/wD7hyLQW+kgoKGCipmIyGFiMY1NiIhbNjFArpVqXJqTUnX/AAWDA6RXPWZyaky6z7lTL7A+mvddTyJuXR1D2qn+JS2ZXHTHanWzHFW7c5RVeU7Fy1Lnw/ai+MkNlUSup2PTiX8m3j0auha5OJfyaaAChlUJU6nq6Rw3WutUj0a6oYkkSLtVvCniXPwE2FR7bW1Nur4a2kldHPA9HscmxUJ9wZpLsl3oo2XKojt9ciIkjZVyY5eNq8/EpedjuKRbSlPItlTK/GhacHrmbVtL1sqZG9g8TbxaXIipc6JUX/jt/Ee29q/tOi8+38S07Y3lJ3STlPaDwreLSiZrdKJE/ft/E1vE+kfDdnpnrDWMr6lEVGRQLukz53cCIY5amGFuk9yIh4kmjjTSc5EQ1zqhrqyO10NnY9N8ll356cTURUT7V+whQyGI7xW367zXKvk3U0i8CcDE2NRNiGPOZ4tW7tqXSJlknUUnEKlKmdXplxAa89QM3gW1OvOLLfQo1VY6ZHSfUTWv2IaUMayyNY3NVsa0TFkejU4yymGKf2Jhy202SosdLG1UXhRdyhkHvaxjnvcjWtTNVXgRDkifTdjT2PE/DVsl+GkTKse1dbWr8xOddvMdTq6qOhp1kfknn0F7qJ2UsWm7iNO0s4xdiS7+xaR6pbaVypF/xHbXr/D/ANmkIAcvqqqSqlWWRdalGnnfPIr35qD02ugrLnXR0VBA+oqJFyaxia1PMiK5URqKqrqREThLA6IMGNsFs9sq6JPbKqbwKmuJn0e6u03MKw11fNo5NTNTYoKJ1XJo8SZkAzxSQTPhmY6OWNytexyZK1UXJUVDoTJpuwWsjX4ltkWbk11sbU4U7Yn8SGzFiNA+hnWN2XEvKh4raR1LKrFy4gpKmhLGfsOpbhy5z/o8zv0R71+I9fmZ8S7OfukVhqua5HNcqKi5oqbFPFBWyUUySs7elDzSVT6aRHtLgA0TRHjJmIbV7ArZf9p0rcn5/wD5GbHd3jN7OpU1THUxJLGupS9QzNmYj2ZKAAZzKAAAAAAAAAAAAUD92vpO5O4P9Gqfzx7tfSdydwf6NU/nlYwAWc92vpO5O4P9Gqfzx7tfSdydwf6NU/nlYwAWc92vpO5O4P8ARqn88e7X0ncncH+jVP55WMAFnPdr6TuTuD/Rqn88e7X0ncncH+jVP55WMAFnPdr6TuTuD/Rqn88j/SbpqvelW80NXiS02WhnpYlhZLQRSsV7VXNEdu3uzRFz4MuFSIwmpc0AN94AYOzXdqtZT1K7lU1Nf+Jm0VFRFRdS8AB7bJf6vC14pMRUEUEtVbpm1ETJ0VWOc1c0RyIqLl3FQlP3a2k7k7g/0ap/PIVu/wCrp/qGmgFnPdr6TuTuD/Rqn88xNT1St2xfiOmlxbYrHQxqm9vqbdFKx6cSuR8js0TxleQa9TTR1MSxSJdFMU8LJ2Kx6alLp0tRBVU8dRTyNlikajmPauaKh9SsOjXSNccJvSknR1ZbHLmsKr76PnYuzuFhML4nsuJKNtTaq2OVcs3RKuUjOZWnOcSweehddUu3l9+Qptbh0tK6+beUzQODkiCOAAAGQBwAcqeO83Ohs9uluFwqGQU8SZuc5fsTjXmMPjTGdkwtRukr6lr6jL3lNGucj17mxOdSuukHG90xfXI+pXeKONfgaZq+9bzrxrzk3heCzVrkc7Uzl9iTocMkqVRztTeX2Jbw/wBVTivCstXDh3DWHHU8siq2WthmfM5qcCKrZWp4MjL+7X0ncncH+jVP55WMHRYYWQRpHGlkQuUcbY2oxqWRCznu19J3J3B/o1T+eeSXqnMQY5vdvosXWbD9FSterUqaKKZj2brjV8jk3OeWwrcDzU07KiJ0T8lPM0TZo1Y7JS66Oa5qOaqK1UzRU2nKEE6ItKDKGKCw4hevsdvvIKpVz3CbGu5ucnOGWOaJssT2yRvRFa5q5oqLwKcwxDD5qGTQkTVxLylHq6OSlfouTqXlO4ODk0DUGScSeIauJPEAfbqfbqMk4k8QAUXVT5cA4DnI1quc5GoiZqqrqQ+DM59ZH1z6oS66OsWTwYTtdluMjY96mmro5Ho12etGbh7cufPMwWlnSlT0cM9kw9Mk1U9qsmqWr72PZk1dq8+whWxWutvt4gt1Gx0tRO/LNdeXGqlzwDCVh/y6hLWyRfypZcJw9Y/8ibVbL3LcaN+qf0sY0uT6dbFhakoI2rv9VFSz7pmfAjd1Mqbruopk6iaWonknnkdJLI5XPc5c1cq61VVMDgvD1JhiwQWukRF3CZyyZa5H7VUzRC4zia102rgJl7kZiVatVJq4KZe5yDg1PSfi+DCVgdUJk+tmzZTR5/O+kvMhGQQPnkSNia1NGGJ0r0YxNamMxrpjkwBiWlZY7dbLpcKdd8kbXNe+KNdmpjmqrtvCfT3a+k7k7g/0ap/PK01tTPWVctVUyOkmler3uXhVVPidRw6hZRQJG3tXlUvVHStpokY3t6yzcnVp6S5I3RyYbwc5jkVHNWlqMlRdn8uffRnpCixvHUrU0tLQXFj1c6np90ke4XgViOVVyTg1qpV0yOHLxWWG8090oZFZNC7Ph1OTai8ymLFcObXQaP8A9Jkv95TxX0baqLR40yLjgw2DcQUWJrDT3SjcmT0ykj2xv2tUzJzCWN0T1Y9LKhR3scxytcmtD2WW611muUNxt0qR1MK5tVUzavMqbUXiNRxn1W2lnDN/ntVXhzCC7hc45PYtSiSM2Knw5sJpulbBsOLLE5ImtbcaZFfTSZcPGxV4lJzAsV3HLtb1+B3kvL7kphVfud+g/gr5Hm92vpO5O4P9Gqfzx7tfSdydwf6NU/nlZ6qCamqJKeojdFLG5WvY5MlaqbD5nRkW+tC4lnPdr6TuTuD/AEap/PHu19J3J3B/o1T+eVjABZz3a+k7k7g/0ap/PHu19J3J3B/o1T+eVjABZz3a+k7k7g/0ap/PHu19J3J3B/o1T+eVjABZz3a+k7k7g/0ap/PBWMAAAAAAAAAAAAAAAAA9dLcaymySOZdynzXa0PIADLTXuWamfFLCxVc3LdJqMSAAAAAD0W+urLfUtqaGqmppm8D43q1fsPOD4qIqWU+KiLqUlXDWmm90TGQ3iliuDETLfE95J4dim+2vTFg+qYxKmWqonrwpJCrkTwtzK2ghqjY/RTrfR0V6NX8EdNhNNKt7W6i2dPjzB07d1HiKgy/ak3K/adanH+DYEzkxFQr9R+69RU4Gh+lKa/DXyNTeCG/CXyLG3fTPhSlY72E2rrpE4EbHuGr4XfgR9ijTHiK5xugtccdrhdq3TPfSqn1l4PAhGYJCmwGip1ujbr06/wCDbhwqmiW6Nv1/2x9aqonqp3T1M0k0rlzc97lcq+FT5AEyiW1ISQAAAAAANqwdj3EWGHo2jq1mpdtNN75ng4vAaqDFLDHM3QkS6dJ4kjZI3Rel0J+sWm6zTsa270FTSP4FdEm+N/E2yg0k4KrGI5l+p4lX5syOjX7UKqggptjNHIt23b1L7kVJglM9bpdC3Dca4SXgxFbfPoc9emE+UNt8+0qMDX/SkH1r5GHeCH6lLcLjbCSJmuIrb59Dw1mknBNMxznX+merdkSOeq+JCqoPrdilNfW9fI+pgMHG5fIsFe9Nthp2q21UVVWv2K9N7b9usjDGWkjEmJWrBLUJR0ef8hT+9RfrLwqaYCUpMGo6VdJjbryrrN+nw2ngW7W6+VQSfomxXg7CVFJU1sNZNdJtTnsiRUY3iTWRgDcqqVlVGsT1Wy8hsTwNnYrHZKWMbppwiq64rin/AEU/E79mjB/0bj5j/wBlcARH6ZoenvI7eSl6e8sVLpqwo1rljguL3ImpN6RM18ZCWN8S12Kb7Lcq167lV3MMWfvY2bEQwQN2iwimonK+JNfSbVNh8FM5XMTWAASZugAAG5aLcbTYPu7nStkmt86bmeJq604nJzoS23TThFeGK5J/0U6RXIETWYLS1km2SIt+hTQqcNgqH6b01ljuzRhDtdx8yn4hdNGEMs0Zcs+LeU/EriDV/TND095r7yUvT3m9aWr3hbEdwjutjjqoat+qpbJEjWv4ncPCaKATVPA2njSNqrZOUk4YkiYjEyQAAzGQAAAAAAAAAAAAAAAAAAAAAFo8PYCwjJYLdJUYfoZJnUsTpHqz4zlYma+Mq4XKw78n7d3rF9xCq7KJpImR6DlTWuS25CBxyR7Gs0VtmYbsf4L5N0HkDsf4L5N0HkEr2e0YGW30sl3xPVMq52or4qemXcwKuxyqi5+AxuO8OS4WxA+2PnSoYrElikRMt0xc8s02Lmip4CsvWsZFtu2KqasnXtfK9l1EI7dLWaenq6HXtfl1kHY1bouwjXQUd1wyx0s0W+t3mnRyZZqmvNycRgeurQ1yXl9Eb0zw9U18qrZ3j/rcRMWvDcNbUUrJXyPuv/JSfoqJs0DXue669Kkz9dWhrkvL6I3pjrq0Ncl5fRG9MhgG7vLFzj/Eps72x/W7vJn66tDXJeX0RvTHXVoa5Ly+iN6ZDAG8sXOP8Sje2P63d5M/XVoa5Ly+iN6Y66tDXJeX0RvTIYA3li5x/iUb2x/W7vJn66tDXJeX0RvTHXVoa5Ly+iN6ZDAG8sXOP8Sje2P63d5M/XVoa5Ly+iN6Y66tDXJeX0RvTIYA3li5x/iUb2x/W7vJn66tDXJeX0RvTHXVoa5Ly+iN6ZDAG8sXOP8AEo3tj+t3eTP11aGuS8vojemOurQ1yXl9Eb0yGAN5Yucf4lG9sf1u7yZ+urQ1yXl9Eb0x11aGuS8vojemQwBvLFzj/Eo3tj+t3eTP11aGuS8vojemOurQ1yXl9Eb0yGAN5Yucf4lG9sf1u7yZ+urQ1yXl9Eb0x11aGuS8vojemQwBvLFzj/Eo3tj+t3eTP11aGuS8vojemOurQ1yXl9Eb0yGAN5Yucf4lG9sf1u7yZ+urQ1yXl9Eb0x11aGuS8vojemQwBvLFzj/Eo3tj+t3eTP11aGuS8vojemeu3XfRZcnOZbsD3CscxM3JBbt8VO7k5SDmpunI3NEzXLWXEwxZKHD1kp7Vb4msihaiOcia5HZa3LxqpD4vHDh7G2c9Vd/yXiI7EWR0bUsrlVf+SkS1OItENLO6CpwhVQSsXJ0clEjXN7qK7UfPrq0Ncl5fRG9M2XqhrHQ1eC5L06Jja2hfHuJUT3zmOejVYvGnvs+bLnUrmbGGUsNfBtqOei3svxLmZaGCKqi00c5OLhEz9dWhrkvL6I3pjrq0Ncl5fRG9MhgEhvLFzj/Epub2x/W7vJn66tDXJeX0RvTHXVoa5Ly+iN6ZDAG8sXOP8Sje2P63d5M/XVoa5Ly+iN6Y66tDXJeX0RvTIYA3li5x/iUb2x/W7vJn66tDXJeX0RvTHXVoa5Ly+iN6ZDAG8sXOP8Sje2P63d5M/XVoa5Ly+iN6Y66tDXJeX0RvTIYA3li5x/iUb2x/W7vJn66tDXJeX0RvTHXVoa5Ly+iN6ZDAG8sXOP8AEo3tj+t3eTli+24JuWiO4Ylw9Y4aVUVrYpHRbl7VSZrV2rzkGkzW/wDqx1n7xf8AMtIZPmDIrWysVVXReqJdb6kRD5hqKiSNVVWzlTX2AAEySQAAAAAAAAAAAAAAAAAAAAALlYd+T9u71i+4hTUuVh35P27vWL7iFR2WcCLrX0K9j/BZ2+hOTa6l63LRLhXENjslJFAntg2ZjFqN1kma5Oaqudw8Wa7VNX04XChuWLqaot9XDVRJQRtV8T0ciLunrlq25KnjMVYcD3y72xlyjSkpaSRVbFJVTpGkip9HapiL/Z6+xXJ9vuUSRTsRHZNejkVF4FRU2KQtXV1D6az47NdbXrtqysmSX8yNqKiZ0FnMsi25bauTkuVw6pr5VWzvH/W4iYlnqmvlVbO8f9biJi6YJ8hH1epZcM+VZ1AGXwrhy74muSUNopVmkRM3uVcmRt43LsT7V2ErWrQQm9I66YgykVNbKaDNE/xOXX4kMtXidLSLoyvsvJmvke6iugp1tI7WQkCdK3QRROjX2HiGojfs32nR6L4lQjPH+Cbpg2qgiuE9LPHUbpYXwv1qiZZ5tXJU4U5uc8UuL0lU7Qjfr5NaHmDEKed2ix2s1cAEkboBm8JYWveKa1aW0Uiy7nLfJXLuY40/ad/Dh5iVLXoJi3pHXPED1kVNbKaBERP8Tl1+JCPq8UpaRdGV9l5M18jUqK6CnW0jtZCAJwuWgiFYlW24gekiJqbUQIqL4Wrq8SkW4wwjfMKVaQXel3DHr8FPGu6ik7juPmXJeYUuK0lWujE/XyZL5nyCvp6hbMdrMCACQNwA27RvgioxrPWxU9fFRrStY5VexXbrdKvF3DdOwRceUNJ6O78SPnxWkp5FjlfZU6F9jTlr6eF6se6y9pDoN7wJoxvWKFfULI2gtzHqxKmRiqsiouS7hurPu5onOb1PoIoFp8oMQ1LZsvjPp2ubn3EVF+0x1GNUVO/Qe/X1Kv4PMuJU0TtFztZBQMti2yS4cxBVWaepgqZKdyI58KqrdaIuWvbkutNinowLh5uKL+yz+2MVDLKxyxOkYrke5Ne51Lw5Zr4DeWojSLbr/Da9+g2llYke2X1Z9hgQTF2CLjyhpPR3fiaTpHwPXYLqqSOpqY6uGqYqsmYxWpukXW3Je6i+E1afFaSoekcb7qvWa8VfTzO0GOupqYBv+j/RhcsW2V11ZXw0UG+rHGkkauWTLLNUy2Z6vAps1FTFTM05XWQzzTxwt0pFshoAJi7BFx5Q0nmHfiRReKWGhulTRwVbKuOCRY2zsbk2TJcs05jFS4hT1aqkLr26FMcFXDUKqRuvY8hNeB9NFLSWeGhxJSVck8DEY2pp0a7fETgVyKqZLzpnnzEKEsWnQpcLhaqSvbfaWNtTAyZGrA5VajmouXDzmri7aF0bUq1snFn6GDEEpXMRKhbchjdK+kt+LoI7ZbqaWktjHpI/fVTfJnJwZompETizXXrI5N60i6OarBlrp66oucNW2ebekayNWqi7lVz1rzGimfDUpkgRKXg/3lM1EkCRJtHBAB6LdQ1lxrYqKgppamplXcsjjbm5ym8qoiXU2VVES6nnBL+HdB1yqIWzXy6xUKqme8QM31ycyuzREXuZmYqdBFudGqU2IKuN+WpZIGvTxIqEO/H6BjtFX9yKvoR7sWpGrbS8lIIBumkDRzecHwNramemqqF8iRtmjduVRyoqoitXXsXgz4DSyTgqIqhmnE66G7FMyZukxboADYMG4PvuLKl0Vppc4mLlLUSLuYo+6u1eZM1PUsrImq962RD6+RsbdJy2Q18E5W7QRTJEi3HEErpF4WwQI1E8KqufiQ+V10EpvTnWrECrIiamVMGpf8TV1eJSKTZBQK7R0/JfY0N96S9tLyUhIGZxXhi9YYr0pLxSOhV2axyIu6jkTja7b3OFNphiWjkZI1HsW6KSDHte3Sat0Jmt/wDVjrP3i/5lpDJM1v8A6sdZ+8X/ADLSGSLwnOf/ALHehoYfnL/uvoAAS5IgAAAAAAAAAAAAAAAAAAAAAuVh35P27vWL7iFNS5WHfk/bu9YvuIVHZZwIutfQr2P8Fnb6Eu2uWsrsK2i14iwPcbnRRN3VFV0TnI5GO40bq8apwJq2mr6TbBR4bxQ630NRJLCsLJUSRUV8eefvVVO5n3FQxlvxDfrdT+x6G819NDsjjqHNancRF1GPnmlqJnzTyvlleubnvcrnOXjVV4SuVNZFLCjNG7tWtbakRLWuia+3IhpqhkkSNtr1a1txdWfaV86pr5VWzvH/AFuImJZ6pr5VWzvH/W4iYvuCfIR9XqWzDPlWdRZrQLbKeg0d0dTExu/Vz3zTP2qqOVrU8CInjUzukHEkmFcNyXeO3SV6se1ixtduUai/OcuS5Inc2oRloJ0gW+itrML3mdtKjHuWjneuTFRy5qxy7FzVVRV1a8uLObfevbsc1U7qKhR8TifBXudO26Kt+tOvq7ir1zHRVTnSpdFW/WnWQ/Z9OtBLOkd2sc9LGq5b5BMkuXdaqN9akYaUMTLirF1TcI3O9hx/A0jVTLKNvAuWxVXNfCWBxPo3wlfo3rLa46OodwVFIiRuReNUT3rvCilfNIeDq/Bt4SjqnpPTzIr6aoamSSNThzTY5NWac6cZYsEkw2SbSgarX2yVb9xMYY+idLeJNF1sl9DWTKYVs1TiHENHZ6TVJUybndKmaMamtzl7iIq+AxZKPU1wRyY4q5noiuhoHqzmVXsTPxKqeEn6+oWnpnytzRCWq5Vhhc9M0QnXDVkt+HrPBa7ZCkUESa1+c921zl2qpoWk7Ss3DF3dZrXQx1lZE1FnklcqRxqqZo3JNarkqLwpl6pPMFXMwe+sldXNsLqndZSLMkSvz589eZzWklj25ZKhiv7ePlUpdPIzbFfK1Xe5pejLSumJbwyzXahipKqZF3iSFyqx6omatVF1ouSLlrXMkHEdmoL/AGaotVxhSSCZuXOxdjk4lThMdTrgqnmZPTrh6KVi5tezeWuavGipwGR9vbJ/bFu9JZ+J7qnNdMklNGrPfoPU6tWRHwsVvuVFxBbJ7Ne6y1VOuWlmdE5ctTsl1KnMqa/CeE3fTg+kl0j19RRzRTRysicr4no5qrvbUXWncNIOlUkqzQMkdmqIvkXSneskTXrmqITL1L/6wvv7qH1vJzIM6l/9YX391D63k5nPtkP/ALB/Z+EKjjHzbuz8Ia7iDF2FcKJFR3K4wUjkYm908bHPc1uz3rUXJO7kYyu0l4V63K+6226wVUtNErmwORzHvcupqblyIuWapmqcBW7FFwqLriK4XGqerpZ6h7lzXgTPUicyJkidwxpPw7F4NBrpHLpar5W6U/qktHgcWiivct+PkPtW1M9bWTVlTIsk88jpJHrwucq5qvjOaCrqKGugraWRYp4JGyRvTha5FzRT4AtOiltG2onbJaxb/BN/p8TYZo7xBk1ZmZSsRf5ORNTm+P7MlMRpfw71x4Iq4Io91V0v6TTZJrVzUXNvhbmndyIp6nvFPtViB9gq5MqS4r8Fmupk6Jq8pNXdRpYY5rXU78LrrsyRbp1f3UUqqhdQ1V28WtP75FMLXQ1FyuVNb6Rm7nqZWxRpzuXJC4GHLVT2OxUVppU+CpYkjRcst0u1y86rmvhNAwho8baNKl0vToUS3xN32gTLVu5c90ifV98n+JpJr3NYxz3uRrWpmqquSInGbWP4m2rcxka/CiX7V9k9TYxatSoVrWZWv2r7GiabsU9bmEX09NJua+45wQ5LrY3L37/Ai5d1yFYzatKWJ3YqxdU1zHKtHF8DSN4o0Xh7qrmvhy2GqlqwWg3HTIjk+Jda+3YT2G0m5oERc11qC4eDvkjZu8IP+20p4XDwd8kbN3hB/wBtpE7LP24+tSPx/gM61I86pr5J2zv7/wAbiv5YDqmvknbO/v8AxuK/khsc+Qb1r+Tbwb5VOtQmtckLQaIsE0+FbFHUVELVu9UxHVEiprjRdaRpxIm3jXwFecB08dVjayU8yIsclfCjkXam7TNC3xHbKat7Gsgaupda+hp47UOajYkyXWp57lXUdtoZa6vqY6amhbupJJHZI1DROzJgr2VvO/124zy372Mu47vDuvsNW6py4VTVs9ra9zaZ6STvROB7kVETPuZr4yEzBhOAQ1NOk0yrrysYsPwmOaFJJFXXyEj6dMY02JbzTUVqqUmttJGjke3NEkkcmarr4kyTXwLuiOAC20lMylhbEzJCwU8DYI0jbkhnMDYenxRieks8LlY2V26mkRP5ONNbneLg51QthZLXQ2a1wW2207YKaBu5Y1vrXjVeFVIR6mKCN1+u9SqJvkdKxjV5nOzX7qE9FJ2TVb31O03+Ftu9Ss43O5021cSfkijSNpd9oL3NZ7Pb4auanXczzTuXcI7a1ETWuW1c+E92i3ShHiu4raLjRR0derFfEsblVkqJrVMl1oqJr26kU2mqZgt9TK6qZh906vVZFkSFXK7PXnnrzzOaV+C6WdtRSuw/BMz4skawtcmrLUqazTdJSLT7WkC6VuFfj/vEa6vp1h0EiXS5ek9GMMP0OJrDUWmuYitkbnHJl76J/wA16c6famabSo1xpJ7fcKihqW7menldFInE5qqi/ahcD29sn9sW70ln4lYdLa0ztI15fSSxywvma9HxuRzVVWNVclTnVSX2LSyte+FyLa1/QkMCkejnRrlmb5b/AOrHWfvF/wAy0hkma3/1Y6z94v8AmWkMk5hOc/8A2O9CTw/OX/dfQAAlyRAAAAAAAAAAAAAAAAAAAAABcrDvyft3esX3EKalysO/J+3d6xfcQqOyzgRda+hXsf4LO30JKw1R4QltlMsuHsSXapeieyZYGLvcbtqN3PDlzmK0mYbhwvid1vpZXyU8kTZot38ZrVVUyXj1opuNXiaxXOwWhYcVV9gbQQJHUW+liejpVRE1Nc1UTXkuSrnw5rka1pgvltxBieCttU6zQNomRucrVbk7dOVU1/WQiKyOnbSroq1XJo2VLIq6teS37yPqGQpBqVFVLWtbt6e8qb1TXyqtneP+txExLPVNfKq2d4/63EURKxsrHSMV7Eciuai5ZptTPYXDBfkI+r1LFhnyjOokLCGiq64jwe69w1MdPUSP/RYZUybKxNSqq7M14NWznzPrh1dK2E7jHb6O3XaSNrkRKd8KzU6pxI7W1qc7VQljBGkPB11t9NSU1XDa5I42xtpKhyR7hETJGtVfeuTiyXPmQ3WOSORm+RyMexfnNXNCs1ONVTHvjqYkVqrqRyZe5CT4lO1zmTRoqLxKmQiV6xNWRqNerUVzUXPJdqEV9UyyFcIW6RyJvza9EZx7lY37r7Uab9e8U4dssLpLneKODcpnuFkRz17jUzcvgQrtpcxwuMbvE2ljfDbaTNIGv+M9V4XuTZnkmSbE7prYDQzSVbZUbZrdd/Qw4VSyvqGyWsicZpBumhe+w2DHtJNUvSOmqmupZXqupqOyyVebdI3PmzNLBfqiBs8TonZKli2TRJLGrHZKXYIP0uaL7zW4gqb7h+JtZHVO3c1Oj0a9j8tapnkiovDx5rwHXRbpbjo6SGzYqfIscaIyGuRFcqN2JIia1y+kmfPxkzWy7Wu6QpNbrhS1bF4Fhla/1Kc9RtZgs6uROi/Eqf3tKgjanDZVdb2UrfYNE+MLlWsiqqD2tp8/hJ53N96nM1FzVfs50NqxZoQmig3/AA1cFqHNam6p6pUa5y5a1a9NWviVE7pNFfcrdQRrLXV9LSsTWrppWsRPGpF+kPTBbqOlloMLyJWVjkVq1W5+Ci525/GXi2d3gN+HFcUrZm7Slk6tXaq/3kNuKvrqmRNrTy1dpBNxo6q3101DWwuhqIHqySN3C1U2HnO80sk0z5pnukkkcrnvcuauVdaqq8Z0Lw29teZZ0vbWTL1L/wCsL7+6h9bycyv/AFOd2tVqrry66XKioWyRRIxamdsaOVFdnlulTMmXrvwnyosnp8XSOeY/DI6verWqqauLoQqGLRvdVOVEXi/BUmv/AJ9UfvXes+B9q1UdWTuaqKiyOVFTbrPidDbkhb0yAAPp9O8MkkMrJYnuZIxyOa5q5K1U4FQtho1xLHirCdLcs2+yWpvVU1Pmyt4fAupU5lKmEgaD8Wsw3ij2LXTtittwRI5XPdk2N6fEeqrwJwoq8S57CDx/D9102k1PibrT1Qi8WpN0Q3bwm6/cswRnp/xT7T4ZSy0smVZc0Vrsl1shT4y+H4vc3XEbg/GOEmMc9cT2VUama5V0ar4ERc1Kw49xDNijFNXd5d0kb3biBi/MiT4qfxXnVSs4Dhj5qlHyNs1uvXxrxe5CYVROkm0npqbr7eIwIAOhFvBcPB3yRs3eEH/baU8LV4UxVheHC9phmxJZ45Y6KFr2Pro0c1UYiKiortSlV2UxvfHHopfWpA46xzmM0UvrU1TqmvknbO/v/G4r+Th1Q98st0wzb4bZeLfXSMrd05lPUskVqbhyZqjVXUQeb2x5jmULUclta/k2sHaraVEVONT02qskt10pLhDlvtNMyZmfG1yKnqLh2S5Ul4tFLdKGRH09TGkjF4s9i86LqXnQpmb3ot0iVmD51pKlj6u0yu3T4UX30S7XMz+1OBeY8Y9hbq2NHx8Jvmh5xWhdUsRzOEnmTbpUwVHjOyRwxysgr6VyvppXJ73XwtdzLkmvZkncIP7FGO/Ze8e07cs8t99kx7jLj+Nn9mZYTDuLsOX+Fslsu1NK5U1xOejJG91i6zL1NTTU0ayVFRFCxNaukejUTwqVekxatw9u0I3sVF1fggqfEKmjTardioVFxhhy44WvTrVc0jWZI2yI+NVVj2uThRVRNuad1FMMTF1Qd5wpeKaiS3XKGrutNIrVWn9+zelTWivTVwomWSrt4yHS84bUSVFM2SRtncfF29paaKZ80KPellJB0CX6GzY5ZT1MiMguMa026VdSPzRWL403P+IsuUoRVRUVFyVCcNGWl6n9ixWrFkjo5WIjY67JXI9NiSZa0X9rbty4VgNkOEyTO3RCl1404+sicYw98jtujS/Khi9KOiu+OxDV3ewU6V1LVyumfC16Nkie5c3Jkqpmmarllx5ZaszB4Z0SYrudfGy4UntXSZ/CTTOarsuJrUXNV7uSc5Y23XK33GFJrfXU1XGqZo6GVr0+xTrcbra7dEslwuNJSMThWaZrPWpFx7IK5kaQoiXTVey3/vYaLMXqms2pE15ZayFcY6Equna6pwxWLVsRM/YtSqNk/wALtTV7i5d1SIqqCalqZaaojdHNE9WSMdwtci5Ki+EnDSTpgpGUktswnI6ad6K19duVa2NNu4Rdau5+BNmZBblVzlc5VVVXNVXaWjBXVz4r1fZfPt/tycw11U6O8/Zy9pMtv/qx1n7xf8y0hkma3/1Y6z94v+ZaQyesJzn/AOx3ofcPzl/3X0AAJckQAAAAAAAAAAAAAAAAAAAAAXEw7U0/W/bv0iL+axfPT6CFOwRGK4UmItamlo2vxXz7UI+voN2I1NK1ugun7Jpv94i8tB7Jpv8AeIvLQpYCG/SSc7/+f5I39Ppznl/JZPSbgi04uutLW1WI4re6GDekZk126TdKuetycZqfYcsHLaLzbOmQwCTgwqqgjSNlQqIn/FDeioJ4mIxs2pOhCZ+w5YOW0Xm2dMdhywctovNs6ZDAMu4a37lfCh73LU88vhQmfsOWDltF5tnTHYcsHLaLzbOmQwBuGt+5XwoNy1PPL4UJn7Dlg5bRebZ0x2HLBy2i82zpkMAbhrfuV8KDctTzy+FCZ+w5YOW0Xm2dMdhywctovNs6ZDAG4a37lfCg3LU88vhQmfsOWDltF5tnTHYcsHLaLzbOmQwBuGt+5XwoNy1PPL4UJn7Dlg5bRebZ0x2HLBy2i82zpkMAbhrfuV8KDctTzy+FCZ+w5YOW0Xm2dMdhywctovNs6ZDAG4a37lfCg3LU88vhQmfsOWDltF5tnTHYcsHLaLzbOmQwBuGt+5XwoNy1PPL4UJn7Dlg5bRebZ0x2HLBy2i82zpkMAbhrfuV8KDctTzy+FCZ+w5YOW0Xm2dMdhywctovNs6ZDAG4a37lfCg3LU88vhQmfsOWDltF5tnTHYcsHLaLzbOmQwBuGt+5XwoNy1PPL4UJn7Dlg5bRebZ0x2HLBy2i82zpkMAbhrfuV8KDctTzy+FCZ+w5YOW0Xm2dMdhywctovNs6ZDAG4a37lfCg3LU88vhQmfsOWDltF5tnTHYcsHLaLzbOmQwBuGt+5XwoNy1PPL4UJn7Dlg5bRebZ0x2HLBy2i82zpkMAbhrfuV8KDctTzy+FCZ+w5YOW0Xm2dMdhywctovNs6ZDAG4a37lfCg3LU88vhQmfsOWDltF5tnTHYcsHLaLzbOmQwBuGt+5XwoNy1PPL4UJn7Dlg5bRebZ0x2HLBy2i82zpkMAbhrfuV8KDctTzy+FCZ+w5YOW0Xm2dMdhywctovNs6ZDAG4a37lfCg3LU88vhQmfsOWDltF5tnTHYcsHLaLzbOmQwBuGt+5XwoNy1PPL4UJ+xbbLbhvQfcrDS3iCvcxWua5HNRzt1Ox3xUVeAgEA2aCiWka5HO0lcqqq2tnYz0lMtO1yK66qtwADfNoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//9k="
  const GREEN = "#309E3B"
  const DARK = "#0F0F0F"
  const MID = "#6B6B6B"
  const SERIF = "'DM Serif Display', Georgia, serif"
  const SANS = "'DM Sans', -apple-system, sans-serif"
  const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');"

  const logoImg = (dark = false) =>
    `<img src="${LOGO}" style="position:absolute;top:12px;right:16px;width:48px;height:48px;object-fit:contain;opacity:${dark ? "0.85" : "0.7"};z-index:20" alt="ibox"/>`

  const accentBar = `<div style="position:absolute;top:0;left:0;right:0;height:4px;background:${GREEN};z-index:10"></div>`

  const footerHtml = (idx: number, total: number, dark = false) =>
    `<div style="position:absolute;bottom:0;left:0;right:0;height:36px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;border-top:1px solid ${dark ? "rgba(255,255,255,0.08)" : "#EBEBEB"};font-size:9px;letter-spacing:0.08em;font-family:${SANS};font-weight:500;text-transform:uppercase;color:${dark ? "rgba(255,255,255,0.22)" : "#BDBDBD"}">
      <span>ibox solutions · frank@ibox.eu.com</span><span>${idx + 1} · ${total}</span>
    </div>`

  const wrapSlide = (inner: string, bg: string) =>
    `<!DOCTYPE html><html><head><style>
      ${FONT_IMPORT}
      *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
      html,body{width:100%;height:100%;overflow:hidden;font-family:${SANS};-webkit-font-smoothing:antialiased}
      .slide{width:100%;height:100%;position:relative;overflow:hidden;background:${bg}}
    </style></head><body><div class="slide">${inner}</div></body></html>`

  const previewHTML = () => {
    if (!currentSlide) return ""
    const s = currentSlide
    const idx = slides.findIndex(sl => sl.id === selectedSlide)
    const total = slides.length
    const bullets = (s.bullets || []).filter(Boolean)
    const theme = (s as any).theme || (s.type === "cover" ? "dark" : "light")
    const isDark = theme === "dark" || s.type === "cta"

    if (s.type === "cover") {
      return wrapSlide(`
        ${accentBar}${logoImg(true)}
        <div style="position:absolute;right:-10px;bottom:-20px;font-family:${SERIF};font-size:240px;color:${isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"};line-height:1;pointer-events:none">${String(idx+1).padStart(2,"0")}</div>
        <div style="padding:44px 52px;height:100%;display:flex;flex-direction:column;justify-content:center">
          ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${GREEN};margin-bottom:18px">${s.label}</div>` : ""}
          <h1 style="font-family:${SERIF};font-size:${isDark?"42px":"40px"};line-height:1.1;color:${isDark?"white":DARK};margin-bottom:14px;font-weight:400;max-width:480px">${s.headline||"Präsentation"}</h1>
          ${s.subheadline ? `<p style="font-size:13px;color:${isDark?"rgba(255,255,255,0.42)":MID};font-weight:300;max-width:380px;line-height:1.6">${s.subheadline}</p>` : ""}
          <div style="width:36px;height:2px;background:${GREEN};margin-top:24px"></div>
        </div>
        ${footerHtml(idx,total,isDark)}
      `, isDark ? DARK : "white")
    }

    if (s.type === "cta") {
      return wrapSlide(`
        <div style="position:absolute;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.2)"></div>
        ${logoImg(true)}
        <div style="position:absolute;right:0;top:0;bottom:0;width:35%;opacity:0.055"><svg width="100%" height="100%"><defs><pattern id="g" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" stroke-width="0.7"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/></svg></div>
        <div style="padding:48px 60px;height:100%;display:flex;flex-direction:column;justify-content:center;position:relative">
          ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:14px">${s.label}</div>` : ""}
          <h2 style="font-family:${SERIF};font-size:38px;line-height:1.12;color:white;margin-bottom:12px;font-weight:400;max-width:460px">${s.headline||"Jetzt starten"}</h2>
          ${s.text ? `<p style="font-size:12px;color:rgba(255,255,255,0.62);margin-bottom:24px;max-width:400px;line-height:1.65;font-weight:300">${s.text}</p>` : "<div style='height:16px'></div>"}
          <div style="display:inline-block;background:white;color:${GREEN};font-weight:600;font-size:11px;padding:11px 26px;border-radius:4px">${s.ctaText||"Demo-Termin anfragen"}</div>
        </div>
        ${footerHtml(idx,total,true)}
      `, GREEN)
    }

    if (s.type === "bullets") {
      const cols = bullets.length > 4 ? 2 : 1
      return wrapSlide(`
        ${accentBar}${logoImg(false)}
        <div style="padding:42px 52px;height:100%;display:flex;flex-direction:column;justify-content:center">
          ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${GREEN};margin-bottom:14px">${s.label}</div>` : ""}
          <h2 style="font-family:${SERIF};font-size:28px;line-height:1.15;color:${DARK};margin-bottom:${s.subheadline?"6px":"22px"};font-weight:400;max-width:520px">${s.headline||""}</h2>
          ${s.subheadline ? `<p style="font-size:11px;color:${MID};margin-bottom:18px;font-style:italic">${s.subheadline}</p>` : ""}
          <div style="display:grid;grid-template-columns:${cols>1?"1fr 1fr":"1fr"};gap:0 32px;max-width:580px">
            ${bullets.map((b:string,j:number)=>`
              <div style="display:flex;align-items:flex-start;gap:12px;padding:9px 0;border-top:1px solid #F0F0F0">
                <span style="font-family:${SERIF};font-size:17px;color:${GREEN};line-height:1;flex-shrink:0">${String(j+1).padStart(2,"0")}</span>
                <span style="font-size:11.5px;color:#333;line-height:1.5">${b}</span>
              </div>`).join("")}
          </div>
        </div>
        ${footerHtml(idx,total,false)}
      `, "white")
    }

    if (s.type === "comparison") {
      const half = Math.ceil(bullets.length/2)
      const left = bullets.slice(0,half)
      const right = bullets.slice(half)
      return wrapSlide(`
        ${accentBar}${logoImg(false)}
        <div style="padding:38px 48px 44px;height:100%;display:flex;flex-direction:column">
          ${s.label ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${GREEN};margin-bottom:10px">${s.label}</div>` : ""}
          <h2 style="font-family:${SERIF};font-size:24px;color:${DARK};margin-bottom:20px;font-weight:400">${s.headline||""}</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1">
            <div style="padding-right:28px;border-right:1px solid #E8E8E8">
              <div style="font-size:8px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#AAA;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #E8E8E8">Standard</div>
              ${left.map((b:string)=>`<div style="display:flex;gap:8px;margin-bottom:9px"><span style="color:#CCC;font-size:12px">✕</span><span style="font-size:11px;color:#888;line-height:1.45">${b}</span></div>`).join("")}
            </div>
            <div style="padding-left:28px">
              <div style="font-size:8px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:${GREEN};margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid ${GREEN}">ibox</div>
              ${right.map((b:string)=>`<div style="display:flex;gap:8px;margin-bottom:9px"><span style="color:${GREEN};font-size:12px">✓</span><span style="font-size:11px;color:${DARK};line-height:1.45;font-weight:500">${b}</span></div>`).join("")}
            </div>
          </div>
        </div>
        ${footerHtml(idx,total,false)}
      `, "white")
    }

    // Default: content
    return wrapSlide(`
      ${accentBar}${logoImg(false)}
      <div style="display:grid;grid-template-columns:156px 1fr;height:100%">
        <div style="background:${DARK};padding:44px 24px;display:flex;flex-direction:column;justify-content:space-between;position:relative">
          <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${GREEN}"></div>
          ${s.label ? `<div style="font-size:7.5px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${GREEN};line-height:1.6">${s.label}</div>` : "<div></div>"}
          <div style="font-family:${SERIF};font-size:60px;color:rgba(255,255,255,0.06);line-height:1">${String(idx+1).padStart(2,"0")}</div>
        </div>
        <div style="padding:36px 42px;display:flex;flex-direction:column;justify-content:center">
          <h2 style="font-family:${SERIF};font-size:25px;line-height:1.15;color:${DARK};margin-bottom:${s.subheadline?"6px":"18px"};font-weight:400;max-width:440px">${s.headline||""}</h2>
          ${s.subheadline ? `<p style="font-size:11px;color:${MID};margin-bottom:14px;font-style:italic;line-height:1.5">${s.subheadline}</p>` : ""}
          ${s.text ? `<p style="font-size:11.5px;color:#444;line-height:1.7;max-width:420px;margin-bottom:${bullets.length?"14px":"0"}">${s.text}</p>` : ""}
          ${bullets.map((b:string)=>`
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:7px">
              <div style="width:15px;height:15px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px"><div style="width:4px;height:4px;border-radius:50%;background:${GREEN}"></div></div>
              <span style="font-size:11.5px;color:#333;line-height:1.5">${b}</span>
            </div>`).join("")}
        </div>
      </div>
      ${footerHtml(idx,total,false)}
    `, "white")
  }


  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#309E3B] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">

      {/* Top Bar */}
      <div className="bg-white border-b border-[#E0E0E0] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/presentations/${id}`} className="text-[#9B9B9B] hover:text-[#1A1A1A] text-sm">← Zurück</Link>
          <span className="text-[#E0E0E0]">|</span>
          <span className="font-semibold text-[#1A1A1A] text-sm truncate max-w-64">{presentation?.title}</span>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 border border-[#E0E0E0] rounded-lg p-1">
          {(["slides", "sections"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setEditorMode(mode)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                editorMode === mode ? "bg-[#309E3B] text-white" : "text-[#6B6B6B] hover:text-[#1A1A1A]"
              }`}
            >
              {mode === "slides" ? "📊 Folien" : "📄 Sektionen"}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {saveMessage && <span className="text-xs text-[#309E3B]">{saveMessage}</span>}
          <button onClick={save} disabled={isSaving} className="px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-xs font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition disabled:opacity-50">
            {isSaving ? "Speichert..." : "💾 Speichern"}
          </button>
          <button onClick={exportHTML} className="px-3 py-1.5 bg-[#1A1A1A] text-white rounded-lg text-xs font-medium hover:bg-[#333] transition">
            ⬇ HTML
          </button>
          <button onClick={exportPDF} disabled={isExporting} className="px-3 py-1.5 bg-[#309E3B] text-white rounded-lg text-xs font-medium hover:bg-[#2a8a32] transition disabled:opacity-50">
            {isExporting ? "..." : "⬇ PDF"}
          </button>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Slide List */}
        <div className="w-52 bg-[#F5F5F5] border-r border-[#E0E0E0] flex flex-col overflow-hidden">
          <div className="px-3 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
              {slides.length} {editorMode === "slides" ? "Folien" : "Sektionen"}
            </span>
            <button onClick={addSlide} className="text-[#309E3B] hover:text-[#2a8a32] text-lg font-bold leading-none">+</button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                onClick={() => setSelectedSlide(slide.id)}
                className={`group relative rounded-lg p-2.5 cursor-pointer transition ${
                  selectedSlide === slide.id
                    ? "bg-white shadow-sm border border-[#309E3B]"
                    : "hover:bg-white hover:shadow-sm border border-transparent"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[#9B9B9B] w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1A1A] truncate">
                      {SLIDE_TYPES.find(t => t.value === slide.type)?.icon} {slide.headline || "Keine Headline"}
                    </p>
                    {slide.label && <p className="text-[10px] text-[#309E3B] truncate mt-0.5">{slide.label}</p>}
                    <p className="text-[10px] text-[#9B9B9B] truncate">{SLIDE_TYPES.find(t => t.value === slide.type)?.label}</p>
                  </div>
                </div>
                {selectedSlide === slide.id && (
                  <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={(e) => { e.stopPropagation(); moveSlide(slide.id, "up") }} className="w-5 h-5 text-[10px] bg-[#F5F5F5] rounded hover:bg-[#E0E0E0] flex items-center justify-center">↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveSlide(slide.id, "down") }} className="w-5 h-5 text-[10px] bg-[#F5F5F5] rounded hover:bg-[#E0E0E0] flex items-center justify-center">↓</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id) }} className="w-5 h-5 text-[10px] bg-[#F5F5F5] rounded hover:bg-red-100 hover:text-red-600 flex items-center justify-center">✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center: Preview */}
        <div className="flex-1 bg-[#E8E8E8] flex items-center justify-center overflow-auto p-6">
          <div className="w-full max-w-3xl aspect-video bg-white rounded-lg shadow-xl overflow-hidden">
            <iframe
              ref={iframeRef}
              srcDoc={previewHTML()}
              className="w-full h-full border-0"
              title="Vorschau"
            />
          </div>
        </div>

        {/* Right: Edit Panel */}
        <div className="w-80 bg-white border-l border-[#E0E0E0] flex flex-col overflow-hidden">
          {currentSlide ? (
            <>
              <div className="px-4 py-3 border-b border-[#E0E0E0]">
                <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-2">Folie bearbeiten</p>
                <div className="flex flex-wrap gap-1">
                  {SLIDE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => updateSlide("type", t.value)}
                      className={`text-xs px-2 py-1 rounded transition ${
                        currentSlide.type === t.value
                          ? "bg-[#309E3B] text-white"
                          : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E0E0E0]"
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                {/* Theme toggle for cover */}
                {currentSlide.type === "cover" && (
                  <Field label="Variante">
                    <div className="flex gap-2">
                      {[
                        { value: "dark", label: "Dunkel", bg: "#0F0F0F" },
                        { value: "light", label: "Hell", bg: "#FFFFFF" },
                      ].map((t) => (
                        <button
                          key={t.value}
                          onClick={() => updateSlide("theme", t.value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-medium transition ${
                            ((currentSlide as any).theme || "dark") === t.value
                              ? "border-[#309E3B] bg-[#F0F9F1] text-[#309E3B]"
                              : "border-[#E0E0E0] text-[#6B6B6B] hover:border-[#309E3B]"
                          }`}
                        >
                          <span className="w-4 h-4 rounded border border-[#E0E0E0]" style={{ background: t.bg }} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                )}

                <Field label="Label / Kapitel">
                  <input
                    type="text"
                    value={currentSlide.label || ""}
                    onChange={(e) => updateSlide("label", e.target.value)}
                    placeholder="z.B. DIGITAL SIGNAGE, BUSINESS MODEL..."
                    className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                  />
                </Field>

                <Field label="Headline *">
                  <textarea
                    value={currentSlide.headline || ""}
                    onChange={(e) => updateSlide("headline", e.target.value)}
                    placeholder="Haupttitel der Folie"
                    rows={2}
                    className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] resize-none"
                  />
                </Field>

                <Field label="Subheadline">
                  <textarea
                    value={currentSlide.subheadline || ""}
                    onChange={(e) => updateSlide("subheadline", e.target.value)}
                    placeholder="Untertitel oder Ergänzung"
                    rows={2}
                    className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] resize-none"
                  />
                </Field>

                <Field label="Text / Beschreibung">
                  <textarea
                    value={currentSlide.text || ""}
                    onChange={(e) => updateSlide("text", e.target.value)}
                    placeholder="Fließtext, Erklärung..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B] resize-none"
                  />
                </Field>

                {/* Bullets */}
                <Field label="Aufzählungspunkte">
                  <div className="space-y-2">
                    {(currentSlide.bullets || []).map((bullet, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => updateBullet(i, e.target.value)}
                          placeholder={`Punkt ${i + 1}`}
                          className="flex-1 px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                        />
                        <button
                          onClick={() => removeBullet(i)}
                          className="w-7 h-7 text-[#9B9B9B] hover:text-red-500 flex items-center justify-center rounded transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addBullet}
                      className="w-full py-1.5 border border-dashed border-[#309E3B] text-[#309E3B] rounded-lg text-xs font-medium hover:bg-[#F0F9F1] transition"
                    >
                      + Punkt hinzufügen
                    </button>
                  </div>
                </Field>

                {/* CTA Text */}
                {currentSlide.type === "cta" && (
                  <Field label="Button-Text">
                    <input
                      type="text"
                      value={currentSlide.ctaText || ""}
                      onChange={(e) => updateSlide("ctaText", e.target.value)}
                      placeholder="z.B. Demo-Termin anfragen"
                      className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#309E3B]"
                    />
                  </Field>
                )}

              </div>

              {/* Save Button */}
              <div className="px-4 py-3 border-t border-[#E0E0E0]">
                <button
                  onClick={save}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
                >
                  {isSaving ? "Speichert..." : "💾 Speichern"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#9B9B9B] text-sm p-8 text-center">
              Wähle eine Folie aus der linken Liste um sie zu bearbeiten.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}
