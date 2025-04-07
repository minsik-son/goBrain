import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface SubscriptionTabContentProps {
  plan: string
}

export function SubscriptionTabContent({ plan }: SubscriptionTabContentProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Current Plan</CardTitle>
            <Badge>{plan || "Free"}</Badge>
          </div>
          <CardDescription>Your subscription details and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Usage this month</span>
              <span className="text-sm text-muted-foreground">45/100 translations</span>
            </div>
            <Progress value={45} />
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-1">Plan Features</h3>
            <ul className="text-sm space-y-1">
              <li>• 100 translations per month</li>
              <li>• 5 MB document size limit</li>
              <li>• Basic OCR capabilities</li>
              <li>• Email support</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Upgrade Plan</Button>
        </CardFooter>
      </Card>
      
      {/* Plan comparison card */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Choose the plan that works for you</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Plan comparison content */}
        </CardContent>
      </Card>
    </div>
  )
} 