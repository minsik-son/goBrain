"use client"

import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      toast({
        title: "Success",
        description: "You have been signed out successfully",
      })
      
      // Trigger storage event to notify other components
      window.localStorage.removeItem('supabase.auth.token')
      window.dispatchEvent(new Event('storage'))
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleSignOut}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </>
      ) : (
        "Sign Out"
      )}
    </Button>
  )
}
