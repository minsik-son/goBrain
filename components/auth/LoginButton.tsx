"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import EmailLoginForm from "@/components/auth/EmailLoginForm"
import GoogleLoginButton from "@/components/auth/GoogleLoginButton"
import React from 'react'

interface LoginButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function LoginButton(props: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-transparent text-black dark:text-white"
          {...props}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <EmailLoginForm setIsLoading={setIsLoading} onSuccess={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
