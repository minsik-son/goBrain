"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  const router = useRouter()

  useEffect(() => {
    // 5초 후 자동으로 홈페이지로 리다이렉트
    const timer = setTimeout(() => {
      router.push('/')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">인증 오류</h1>
        <p className="text-gray-600 dark:text-gray-400">
          로그인 처리 중 오류가 발생했습니다.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          5초 후 자동으로 홈페이지로 이동합니다.
        </p>
        <div className="flex space-x-4 mt-6">
          <Button 
            onClick={() => router.push('/')}
            variant="default"
          >
            홈으로 돌아가기
          </Button>
          <Button 
            onClick={() => router.push('/login')}
            variant="outline"
          >
            다시 로그인
          </Button>
        </div>
      </div>
    </div>
  )
} 