"use client"
import { siteConfig } from "@/config/site"
import { MainNav } from "@/components/main-nav"
import LoginButton from "@/components/auth/LoginButton"
import LogoutButton from "@/components/auth/LogoutButton"
import { useState, useEffect } from "react"

export function SiteHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // 페이지 로드 시 로그인 상태 확인
  useEffect(() => {
    const authToken = localStorage.getItem('supabase.auth.token')
    setIsLoggedIn(!!authToken)
    
    // 로그인 상태 변경 감지
    const handleStorageChange = () => {
      const token = localStorage.getItem('supabase.auth.token')
      setIsLoggedIn(!!token)
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {isLoggedIn ? <LogoutButton /> : <LoginButton />}
          </nav>
        </div>
      </div>
    </header>
  )
}

