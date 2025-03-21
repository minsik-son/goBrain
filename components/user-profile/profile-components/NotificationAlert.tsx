import { Bell } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface NotificationAlertProps {
  plan: string
}

export function NotificationAlert({ plan }: NotificationAlertProps) {
  // 무료 플랜이 아닐 때만 알림 표시
  if (plan !== "pro" && plan !== "premium") return null
  
  return (
    <Alert className="mb-6">
      <AlertTitle className="flex items-center">
        <Bell className="h-4 w-4 mr-2" />
        Subscription Expiring Soon
      </AlertTitle>
      <AlertDescription>
        Your {plan === "pro" ? "Pro" : "Premium"} plan will expire in 7 days. Renew now to avoid interruption.
        <Button variant="link" className="p-0 h-auto font-semibold ml-2">
          Renew Now
        </Button>
      </AlertDescription>
    </Alert>
  )
} 