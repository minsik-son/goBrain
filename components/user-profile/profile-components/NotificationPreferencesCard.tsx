import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface NotificationPreferencesCardProps {
  userID: string
  userData: {
    email_notifications: boolean
    marketing_emails: boolean
    product_updates: boolean
  }
  setUserData: any
  supabase: any
  toast: any
}

export function NotificationPreferencesCard({ 
  userID, 
  userData, 
  setUserData, 
  supabase, 
  toast 
}: NotificationPreferencesCardProps) {
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
      const { error } = await supabase
        .from('users')
        .update({
          email_notifications: emailNotifications,
          marketing_emails: marketingEmails,
          product_updates: productUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userID)
      
      if (error) throw error
      
      // 부모 컴포넌트의 상태 업데이트
      setUserData((prev: any) => ({
        ...prev,
        email_notifications: emailNotifications,
        marketing_emails: marketingEmails,
        product_updates: productUpdates
      }))
      
      toast({
        title: "성공",
        description: "알림 설정이 성공적으로 업데이트되었습니다.",
      })
      
    } catch (error: any) {
      console.error("알림 설정 업데이트 오류:", error)
      toast({
        title: "오류",
        description: error.message || "알림 설정을 업데이트하는 중 오류가 발생했습니다.",
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
      <CardContent className="space-y-4">
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
          disabled={isSaving}
        >
          {isSaving ? "저장 중..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  )
} 