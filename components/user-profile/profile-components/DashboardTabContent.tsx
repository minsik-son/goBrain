'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardTabContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Your account overview and recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Recent Activities</h3>
              <p className="text-sm text-muted-foreground">You have translated 45 texts this month</p>
            </Card>
            
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Usage Statistics</h3>
              <p className="text-sm text-muted-foreground">45% of your monthly quota used</p>
            </Card>
            
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Account Status</h3>
              <p className="text-sm text-muted-foreground">Your account is in good standing</p>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 