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
  
  // Set initial values from userData
  useEffect(() => {
    setEmailNotifications(userData.email_notifications)
    setMarketingEmails(userData.marketing_emails)
    setProductUpdates(userData.product_updates)
  }, [userData])
  
  const handleSavePreferences = async () => {
    if (!userData.id) {
      toast({
        title: "Error",
        description: "User information not found.",
        variant: "destructive"
      })
      return
    }
    
    setIsSaving(true)
    
    try {
      // Update user data through Redux
      await dispatch(updateUserProfile({
        email_notifications: emailNotifications,
        marketing_emails: marketingEmails,
        product_updates: productUpdates
      })).unwrap()
      
      toast({
        title: "Success",
        description: "Notification settings have been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "An error occurred while saving settings.",
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
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  )
} 