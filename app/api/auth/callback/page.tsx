'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // 쿼리 파라미터에서 오류와 코드를 추출합니다
    const handleAuthCallback = async () => {
      const { searchParams } = new URL(window.location.href)
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        console.error('Auth error:', error)
        router.push('/')
        return
      }

      if (code) {
        try {
          // 쿠키에 세션을 설정합니다
          await supabase.auth.exchangeCodeForSession(code)
          router.push('/') // 로그인 성공 후 리다이렉트할 페이지
        } catch (error) {
          console.error('Session error:', error)
          router.push('/')
        }
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return <div>로그인 처리 중...</div>
}


/*
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

*/

