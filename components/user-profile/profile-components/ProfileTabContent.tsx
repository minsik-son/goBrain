'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserInformationCard } from "./UserInformationCard"
import { NotificationPreferencesCard } from "./NotificationPreferencesCard"
import { useAppSelector } from "@/lib/redux/hooks"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ProfileTabContentProps {
  supabase: any
  toast: any
}

export function ProfileTabContent({ supabase, toast }: ProfileTabContentProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()
  
  // Get user information from Redux
  const userData = useAppSelector((state) => state.user)
  
  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(userData.id)
      
      if (error) {
        console.error("Error deleting account:", error)
        throw error
      }
      
      // If successfully deleted, log out and redirect
      await supabase.auth.signOut()
      
      toast({
        title: "Success",
        description: "Your account has been successfully deleted.",
      })
      
      router.push('/')
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while deleting the account.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      <UserInformationCard 
        supabase={supabase}
        toast={toast}
      />
      
      <NotificationPreferencesCard 
        supabase={supabase}
        toast={toast}
      />
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting your account will permanently remove all your data and this action cannot be undone.
          </p>
          <Button 
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
      
      {/* Account deletion confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center gap-1">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl text-center">Delete Account</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-4 rounded-md my-4">
            <p className="text-sm text-muted-foreground">
              Data to be deleted:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>All translation history and settings</li>
                <li>Payment information and subscription details</li>
                <li>Profile and user information</li>
              </ul>
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="sm:flex-1"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 