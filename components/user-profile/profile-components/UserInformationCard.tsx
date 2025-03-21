import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface UserInformationCardProps {
  userID: string
  userData: {
    userName: string
    email: string
    avatarUrl: string
    createdAt: string
    preferredLanguage: string
    plan: string
    phone: string
  }
  setUserData: any
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

type UserDataType = {
  userName: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  preferredLanguage: string;
  phone: string;
  plan: string;
};

export function UserInformationCard({ userID, userData, setUserData, supabase, toast }: UserInformationCardProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    preferredLanguage: "",
    phone: ""
  })
  
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setFormData({
      fullName: userData.userName,
      email: userData.email,
      preferredLanguage: userData.preferredLanguage,
      phone: userData.phone
    })
  }, [userData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [id === 'name' ? 'fullName' : id === 'language' ? 'preferredLanguage' : id === 'phone' ? 'phone' : id]: value
    }))
  }

  const handleSaveChanges = async () => {
    if (!userID) {
      toast({
        title: "오류",
        description: "사용자 정보를 찾을 수 없습니다.",
        variant: "destructive"
      })
      return
    }
    
    setIsSaving(true)
    
    try {
      if (userData.email !== formData.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        
        if (emailError) throw emailError
      }
      
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          preferred_language: formData.preferredLanguage,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userID)
      
      if (profileError) throw profileError
      // 부모 컴포넌트의 상태 업데이트
      setUserData((prev: UserDataType) => ({
        ...prev,
        userName: formData.fullName,
        email: formData.email,
        preferredLanguage: formData.preferredLanguage,
        phone: formData.phone
      }))
      
      toast({
        title: "성공",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      })
      
    } catch (error: any) {
      console.error("프로필 업데이트 오류:", error)
      toast({
        title: "오류",
        description: error.message || "프로필을 업데이트하는 중 오류가 발생했습니다.",
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
        <CardDescription>Your personal account details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={formData.fullName} 
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
            <Label htmlFor="language">Preferred Language</Label>
            <select 
              id="language" 
              value={formData.preferredLanguage} 
              onChange={handleInputChange} 
              className="border rounded-md p-2 w-full"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
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
            <p>{userData.createdAt}</p>
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
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  )
} 