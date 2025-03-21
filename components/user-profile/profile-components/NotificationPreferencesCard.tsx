'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { updateUserProfile } from "@/lib/redux/slices/userSlice"

interface NotificationPreferencesCardProps {
  supabase: any
  toast: any
}

export function NotificationPreferencesCard({ 
  supabase, 
  toast 
}: NotificationPreferencesCardProps) {
  const userData = useAppSelector(state => state.user)
  const dispatch = useAppDispatch()
  
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [productUpdates, setProductUpdates] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // userData에서 초기값 설정
  useEffect(() => {
    setEmailNotifications(userData.email_notifications)
    setMarketingEmails(userData.marketing_emails)
    setProductUpdates(userData.product_updates)
  }, [userData])
  
  const handleSavePreferences = async () => {
    if (!userData.id) {
      toast({
        title: "오류",
        description: "사용자 정보를 찾을 수 없습니다.",
        variant: "destructive"
      })
      return
    }
    
    setIsSaving(true)
    
    try {
      // Redux를 통한 사용자 데이터 업데이트
      await dispatch(updateUserProfile({
        email_notifications: emailNotifications,
        marketing_emails: marketingEmails,
        product_updates: productUpdates
      })).unwrap()
      
      toast({
        title: "성공",
        description: "알림 설정이 성공적으로 업데이트되었습니다.",
      })
    } catch (error: any) {
      toast({
        title: "오류",
        description: error || "설정 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive translations and account notifications via email
            </p>
          </div>
          <Switch 
            id="email-notifications" 
            checked={emailNotifications} 
            onCheckedChange={setEmailNotifications}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="marketing-emails">Marketing Emails</Label>
            <p className="text-sm text-muted-foreground">
              Receive emails about new features, special offers, and surveys
            </p>
          </div>
          <Switch 
            id="marketing-emails" 
            checked={marketingEmails} 
            onCheckedChange={setMarketingEmails}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="product-updates">Product Updates</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when we release new features and updates
            </p>
          </div>
          <Switch 
            id="product-updates" 
            checked={productUpdates} 
            onCheckedChange={setProductUpdates}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSavePreferences}
          disabled={isSaving || userData.isLoading}
        >
          {isSaving ? "저장 중..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  )
} 