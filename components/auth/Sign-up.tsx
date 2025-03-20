"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SignUpFormProps = {
  className?: string
  setIsLoading: (isLoading: boolean) => void
  onSuccess: () => void
  onLogin: () => void
}

export default function SignUpForm({
  className,
  setIsLoading,
  onSuccess,
  onLogin
}: SignUpFormProps) {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [preferredLanguage, setPreferredLanguage] = useState("English")
  const [emailExists, setEmailExists] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoadingState] = useState(false)

  const languages = [
    { code: "English", name: "영어" },
    { code: "Korean", name: "한국어" },
    { code: "Japanese", name: "일본어" },
    { code: "Chinese", name: "중국어" },
    { code: "Spanish", name: "스페인어" },
    { code: "French", name: "프랑스어" },
    { code: "German", name: "독일어" },
    { code: "Russian", name: "러시아어" }
  ]

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 비밀번호 유효성 검사
    if (password.length < 8) {
      toast({
        title: "오류",
        description: "비밀번호는 최소 8자 이상이어야 합니다",
        variant: "destructive"
      })
      return
    }

    if (password.length > 25) {
        toast({
            title: "오류",
            description: "비밀번호는 최대 25자 이하여야 합니다",
            variant: "destructive"
          })
          return
    }
        
    if (password !== confirmPassword) {
      toast({
        title: "오류",
        description: "비밀번호가 일치하지 않습니다",
        variant: "destructive"
      })
      return
    }
    
    setIsLoadingState(true)
    setEmailExists(false)

    try {
      // 이메일 중복 확인
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .limit(1)
      
      if (checkError) throw checkError
      
      if (existingUsers && existingUsers.length > 0) {
        setEmailExists(true)
        setIsLoadingState(false)
        return
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name : username,
            preferred_language: preferredLanguage
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.log(error)
        throw error
      }

      if (data?.user) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ preferred_language: preferredLanguage }) // 테이블의 컬럼 이름에 맞게 수정
          .eq("id", data.user.id);
          console.log(data.user.id, preferredLanguage)
      
        if (updateError) {
          console.error("preferred_language 업데이트 실패:", updateError);
        } else {
          console.log("preferred_language 업데이트 성공!");
        }
      }
      
      toast({
        title: "가입 성공",
        description: "계정 확인을 위해 이메일을 확인해 주세요",
      })
      onSuccess()
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "회원가입에 실패했습니다",
        variant: "destructive"
      })
    } finally {
      setIsLoadingState(false)
    }
  }

  return (
    <form onSubmit={handleSignUp} className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">새 계정 만들기</h1>
        <p className="text-balance text-sm text-muted-foreground">
          아래 정보를 입력하여 새 계정을 만드세요
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="signup-email">이메일</Label>
          <Input 
            id="signup-email" 
            type="email" 
            placeholder="m@example.com" 
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailExists(false)
            }}
          />
          {emailExists && (
            <p className="text-sm text-red-500 mt-1">
              이미 존재하는 이메일입니다
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="username">사용자 이름</Label>
          <Input 
            id="username" 
            type="text" 
            placeholder="사용자 이름" 
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="signup-password">비밀번호 (최소 8자)</Label>
          <Input 
            id="signup-password" 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password.length > 0 && password.length < 8 && (
            <p className="text-sm text-red-500 mt-1">
              비밀번호는 최소 8자 이상이어야 합니다
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-password">비밀번호 확인</Label>
          <Input 
            id="confirm-password" 
            type="password" 
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {confirmPassword.length > 0 && confirmPassword !== password && (
            <p className="text-sm text-red-500 mt-1">
              비밀번호가 일치하지 않습니다
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="preferred-language">선호하는 언어</Label>
          <Select 
            value={preferredLanguage} 
            onValueChange={setPreferredLanguage}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="언어 선택" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? '처리 중...' : '회원가입'}
        </Button>

        {/**
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            또는 다음으로 계속하기
          </span>
        </div>
        
        <GoogleLoginButton setIsLoading={setIsLoadingState} onSuccess={onSuccess} isLoading={isLoading} />

        */}
      </div>
      <div className="text-center text-sm">
        이미 계정이 있으신가요?{" "}
        <button 
          type="button" 
          onClick={onLogin}
          className="underline underline-offset-4"
        >
          로그인
        </button>
      </div>
    </form>
  )
}
