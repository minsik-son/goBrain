import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotificationAlert() {
  const [isVisible, setIsVisible] = useState(true)
  
  if (!isVisible) return null
  
  return (
    <Alert className="mb-6">
      <Bell className="h-4 w-4 mr-2" />
      <div className="flex-1">
        <AlertTitle>Update your notification preferences</AlertTitle>
        <AlertDescription>
          Choose how you want to be notified about account activity and product updates.
        </AlertDescription>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline">
          Settings
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => setIsVisible(false)}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
} 