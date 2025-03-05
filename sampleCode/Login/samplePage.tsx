"use client"

import { useState } from "react"
import { EmailLoginForm } from "@/components/auth/EmailLoginForm"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSuccess = () => {
    // Redirect after successful login or signup
    window.location.href = "/dashboard"
  }
  
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome
          </h1>
          <p className="text-sm text-muted-foreground">
            Log in to access the service
          </p>
        </div>
        
        <div className="grid gap-6">
          <EmailLoginForm 
            setIsLoading={setIsLoading} 
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  )
}
