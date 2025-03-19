"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GoogleLoginButton from "./GoogleLoginButton"
import SignUpForm from "./Sign-up"

type EmailLoginFormProps = {
  className?: string
  setIsLoading: (isLoading: boolean) => void
  onSuccess: () => void
}

export default function EmailLoginForm({ 
  className, 
  setIsLoading, 
  onSuccess 
}: EmailLoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoadingState] = useState(false)
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin")
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingState(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "You have been signed in successfully",
      })
      onSuccess()
      
      // Trigger storage event to notify other components
      window.localStorage.setItem('supabase.auth.token', 'updated')
      window.dispatchEvent(new Event('storage'))
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive"
      })
    } finally {
      setIsLoadingState(false)
    }
  }

  // Sign Up 버튼 클릭 시 탭 전환
  const handleSignUpClick = () => {
    console.log("Sign Up 버튼 클릭됨 - 탭 전환");
    setActiveTab("signup");
  };

  // 로그인으로 돌아가기
  const handleLoginClick = () => {
    console.log("로그인으로 돌아가기");
    setActiveTab("signin");
  };


  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full">
      <TabsList className="hidden">
        <TabsTrigger value="signin">로그인</TabsTrigger>
        <TabsTrigger value="signup">회원가입</TabsTrigger>
      </TabsList>
      
      <TabsContent value="signin">
        <form onSubmit={handleSignIn} className={cn("flex flex-col gap-6", className)}>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Log in to your account</h1>
            <p className="text-balance text-sm text-muted-foreground">
              Enter your email below to log in to your account
            </p>
          </div>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input 
                id="password" 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
            
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
            
            <GoogleLoginButton setIsLoading={setIsLoadingState} onSuccess={onSuccess} isLoading={isLoading} />
          </div>
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <button 
              type="button" 
              onClick={handleSignUpClick}
              className="underline underline-offset-4"
            >
              Sign up
            </button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="signup">
        <SignUpForm 
          setIsLoading={setIsLoadingState} 
          onSuccess={onSuccess} 
          onLogin={handleLoginClick}
        />
      </TabsContent>
    </Tabs>
  )
} 