"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Processing authentication...")
  const [attempts, setAttempts] = useState(0)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log(`Checking session (attempt ${attempts + 1})`)
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }

        console.log("Session check result:", data.session)

        if (data.session) {
          console.log("Session found in callback:", data.session)
          setMessage("Authentication successful! Redirecting...")
          
          // 브라우저 스토리지에 상태 변경 알림
          window.localStorage.setItem('supabase.auth.token', new Date().toISOString())
          window.dispatchEvent(new Event('storage'))
          
          // 홈페이지로 리디렉션
          setTimeout(() => {
            router.push('/')
          }, 1500)
        } else {
          // 세션이 없으면 최대 5번까지 3초마다 다시 확인
          if (attempts < 5) {
            setAttempts(prev => prev + 1)
            setMessage(`Waiting for authentication to complete... (${attempts + 1}/5)`)
            setTimeout(checkSession, 3000)
          } else {
            setMessage("Could not detect login. You can try returning to home.")
          }
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        setMessage(`Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    checkSession()
  }, [router, supabase, attempts])

  const forceRefresh = () => {
    window.location.href = '/'
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Authentication</h1>
        <p>{message}</p>
        <div className="flex space-x-4 mt-6">
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Return to Home
          </button>
          <button
            onClick={forceRefresh}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Force Page Refresh
          </button>
        </div>
      </div>
    </div>
  )
} 