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
  // Get user data from Redux
  const userData = useAppSelector((state) => state.user)
  const dispatch = useAppDispatch()
  
  // Form data state
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    preferredLanguage: "English",
    phone: "",
  })
  
  const [isSaving, setIsSaving] = useState(false)
  
  // Update form data when userData in Redux store changes
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
      // Update user profile through Redux action dispatch
      await dispatch(updateUserProfile({
        fullName: formData.userName,
        email: formData.email,
        preferredLanguage: formData.preferredLanguage,
        phone: formData.phone
      })).unwrap()
      
      toast({
        title: "Success",
        description: "Profile has been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "An error occurred while updating the profile.",
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
            <p>{userData.createdAt || 'Loading information...'}</p>
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
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  )
} 