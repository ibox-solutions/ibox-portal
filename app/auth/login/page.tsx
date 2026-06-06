"use client"

import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, Suspense, useState } from "react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#309E3B] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">ibox</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-[#1A1A1A] mb-2">
          Portal Login
        </h1>
        <p className="text-center text-[#6B6B6B] mb-8">
          Sign in to your ibox account
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="john@ibox.eu"
              className="w-full px-4 py-2 border border-[#F5F5F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-[#F5F5F5]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-[#F5F5F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#309E3B] bg-[#F5F5F5]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#309E3B] hover:bg-[#2a8a32] text-white font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#F5F5F5]">
          <p className="text-xs text-[#6B6B6B] text-center">
            Bei Problemen wende dich an deinen Administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#309E3B] to-[#1A1A1A] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
