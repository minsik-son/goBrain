"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Processing authentication...")
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        // Trigger storage event to notify other components
        console.log("signed in successfully")
        window.localStorage.setItem('supabase.auth.token', 'updated')
        window.dispatchEvent(new Event('storage'))
        
        setMessage("Authentication successful. Redirecting...")
        setTimeout(() => {
          router.push('/')
        }, 1000)
      }
      else{
        console.log("signed in error")
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Authentication</h1>
        <p>{message}</p>
      </div>
    </div>
  )
} 

