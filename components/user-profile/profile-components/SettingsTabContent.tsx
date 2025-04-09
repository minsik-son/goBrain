'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SettingsTabContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
          <CardDescription>Manage your application preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 border rounded-md">
            <div>
              <h3 className="font-medium">Dark Mode</h3>
              <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
            </div>
            <Button variant="outline">Toggle</Button>
          </div>
          
          <div className="flex justify-between items-center p-3 border rounded-md">
            <div>
              <h3 className="font-medium">Language</h3>
              <p className="text-sm text-muted-foreground">Change application language</p>
            </div>
            <Button variant="outline">English</Button>
          </div>
          
          <div className="flex justify-between items-center p-3 border rounded-md">
            <div>
              <h3 className="font-medium">Notifications</h3>
              <p className="text-sm text-muted-foreground">Manage notification settings</p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 