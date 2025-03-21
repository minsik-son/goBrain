'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { updateUserProfile } from "@/lib/redux/slices/userSlice"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserInformationCardProps {
  supabase: any
  toast: any
}

const languages = [
  { code: "English", name: "English" },
  { code: "Spanish", name: "Spanish" },
  { code: "French", name: "French" },
  { code: "German", name: "German" },
  { code: "Italian", name: "Italian" },
  { code: "Portuguese", name: "Portuguese" },
  { code: "Russian", name: "Russian" },
  { code: "Japanese", name: "Japanese" },
  { code: "Chinese", name: "Chinese" },
  { code: "Korean", name: "Korean" },
  { code: "Arabic", name: "Arabic" },
  { code: "Vietnamese", name: "Vietnamese" },
  { code: "Thai", name: "Thai" },
  { code: "Hindi", name: "Hindi" },
  { code: "Turkish", name: "Turkish" },
  { code: "Indonesian", name: "Indonesian" },
]

export function UserInformationCard({ 
  supabase, 
  toast 
}: UserInformationCardProps) {
  // Redux에서 유저 데이터 가져오기
  const userData = useAppSelector((state) => state.user)
  const dispatch = useAppDispatch()
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    preferredLanguage: "English",
    phone: "",
  })
  
  const [isSaving, setIsSaving] = useState(false)
  
  // Redux store의 userData가 변경되면 폼 데이터 업데이트
  useEffect(() => {
    if (userData) {
      setFormData({
        userName: userData.userName || "",
        email: userData.email || "",
        preferredLanguage: userData.preferredLanguage || "English",
        phone: userData.phone || "",
      })
    }
  }, [userData])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData({
      ...formData,
      [id]: value
    })
  }
  
  const handleSaveChanges = async () => {
    setIsSaving(true)
    
    try {
      // Redux 액션 디스패치를 통해 사용자 프로필 업데이트
      await dispatch(updateUserProfile({
        fullName: formData.userName,
        email: formData.email,
        preferredLanguage: formData.preferredLanguage,
        phone: formData.phone
      })).unwrap()
      
      toast({
        title: "성공",
        description: "프로필이 성공적으로 업데이트되었습니다.",
      })
    } catch (error: any) {
      toast({
        title: "오류",
        description: error || "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Information</CardTitle>
        <CardDescription>
          Update your personal information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="userName">Full Name</Label>
            <Input 
              id="userName" 
              value={formData.userName} 
              onChange={handleInputChange} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              value={formData.email} 
              onChange={handleInputChange} 
            />
          </div>
          <div className="space-y-2">
            <Label className="block" htmlFor="preferredLanguage">Preferred Language</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-between">
                  {formData.preferredLanguage}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto">
                <DropdownMenuSeparator />
                {languages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    className={cn(
                      "justify-between",
                      formData.preferredLanguage === language.code && "font-semibold"
                    )}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        preferredLanguage: language.code
                      });
                    }}
                  >
                    {language.name}
                    {formData.preferredLanguage === language.code && (
                      <Check className="h-4 w-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              value={formData.phone} 
              onChange={handleInputChange} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="joined">Account Created</Label>
            <p>{userData.createdAt || '정보를 불러오는 중...'}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <p className="font-bold text-blue-500">{userData.plan || "Basic"}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveChanges} 
          disabled={isSaving || userData.isLoading}
        >
          {isSaving ? "저장 중..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  )
} 