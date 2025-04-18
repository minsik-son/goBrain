'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAppSelector } from "@/lib/redux/hooks"

interface SecurityTabContentProps {
  supabase: any
  toast: any
}

export function SecurityTabContent({ supabase, toast }: SecurityTabContentProps) {
  const userData = useAppSelector(state => state.user)
  const [current, setCurrent] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirm) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive"
      })
      return
    }
    
    setIsChangingPassword(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      toast({
        title: "Success",
        description: "Password has been successfully changed.",
      })
      
      setCurrent("")
      setNewPassword("")
      setConfirm("")
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while changing the password.",
        variant: "destructive"
      })
    } finally {
      setIsChangingPassword(false)
    }
  }
  
  return (
    <div className="space-y-6 w-full">
      <Card className="w-full">
        <form onSubmit={handlePasswordChange}>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password" 
                type="password" 
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? "Updating..." : "Update Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="2fa">Enable 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Protect your account with two-factor authentication
              </p>
            </div>
            <Switch 
              id="2fa" 
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-sm">
              Two-factor authentication adds an additional layer of security to your account by requiring more
              than just a password to sign in.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" disabled={!twoFactorEnabled}>Set Up 2FA</Button>
        </CardFooter>
      </Card>
    </div>
  )
} 