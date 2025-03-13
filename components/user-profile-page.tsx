"use client"

import { useEffect, useState } from "react"
import { Bell, CreditCard, FileText, Globe, Home, LogOut, Moon, Settings, Sun, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function UserProfilePage() {
  const [darkMode, setDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [avartarUrl, setAvatarUrl] = useState("")
  const [userName, setUserName] = useState("")


 

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className={`min-h-screen bg-background ${darkMode ? "dark" : ""}`}>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar>
            <SidebarHeader className="flex items-center gap-2 px-4 py-2">
            <Link href="/"> {/* Link 컴포넌트로 감싸기 */}
                <div className="flex items-center gap-2 cursor-pointer"> {/* 클릭 가능하게 하기 위해 cursor-pointer 추가 */}
                <Globe className="h-6 w-6 text-primary" />
                <div className="font-semibold text-lg">TranslateAI</div>
                </div>
            </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Home className="h-4 w-4 mr-2" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive>
                        <User className="h-4 w-4 mr-2" />
                        <span>Profile</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Translations</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span>Billing</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Settings className="h-4 w-4 mr-2" />
                        <span>Settings</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4">
              <Button variant="outline" className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 w-full p-6 md:p-8 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Profile Name</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
              </div>
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
            </div>

            <Alert className="mb-6">
              <AlertTitle className="flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Subscription Expiring Soon
              </AlertTitle>
              <AlertDescription>
                Your Pro plan will expire in 7 days. Renew now to avoid interruption.
                <Button variant="link" className="p-0 h-auto font-semibold ml-2">
                  Renew Now
                </Button>
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="profile" className="space-y-6" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full max-w-3xl">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Information</CardTitle>
                    <CardDescription>Your personal account details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue="John Doe" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" defaultValue="john.doe@example.com" />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="language">Preferred Language</Label>
                        <Input id="language" defaultValue="English" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="joined">Account Created</Label>
                        <Input id="joined" defaultValue="January 15, 2023" disabled />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Save Changes</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Manage how you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive updates about your account</p>
                      </div>
                      <Switch id="email-notifications" defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="marketing-emails">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">Receive promotional offers and updates</p>
                      </div>
                      <Switch id="marketing-emails" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="translation-complete">Translation Complete Alerts</Label>
                        <p className="text-sm text-muted-foreground">Get notified when translations are ready</p>
                      </div>
                      <Switch id="translation-complete" defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subscription Tab */}
              <TabsContent value="subscription" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Current Plan</CardTitle>
                        <CardDescription>Your subscription details</CardDescription>
                      </div>
                      <Badge className="bg-primary">Pro Plan</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Translation Quota</Label>
                        <span className="text-sm font-medium">3,450 / 5,000 words</span>
                      </div>
                      <Progress value={69} className="h-2" />
                      <p className="text-sm text-muted-foreground">Resets on April 30, 2025</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Document Translations</Label>
                        <span className="text-sm font-medium">7 / 10 documents</span>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border p-3">
                        <div className="text-sm font-medium">Plan Price</div>
                        <div className="text-2xl font-bold">$15.99</div>
                        <div className="text-xs text-muted-foreground">per month</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-sm font-medium">Next Billing</div>
                        <div className="text-2xl font-bold">Apr 30</div>
                        <div className="text-xs text-muted-foreground">2025</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-sm font-medium">Active Since</div>
                        <div className="text-2xl font-bold">Jan 15</div>
                        <div className="text-xs text-muted-foreground">2023</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-3">
                    <Button className="w-full sm:w-auto">Upgrade Plan</Button>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Manage Subscription
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Available Plans</CardTitle>
                    <CardDescription>Compare and upgrade your subscription</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border p-4">
                        <div className="font-medium">Basic</div>
                        <div className="mt-2 text-3xl font-bold">$5.99</div>
                        <div className="text-sm text-muted-foreground">per month</div>
                        <Separator className="my-3" />
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />
                            1,000 words per month
                          </li>
                          <li className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />3 document translations
                          </li>
                          <li className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />
                            Standard support
                          </li>
                        </ul>
                        <Button variant="outline" className="mt-4 w-full">
                          Downgrade
                        </Button>
                      </div>
                      <div className="rounded-lg border border-primary p-4 relative">
                        <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                          Current
                        </div>
                        <div className="font-medium">Pro</div>
                        <div className="mt-2 text-3xl font-bold">$15.99</div>
                        <div className="text-sm text-muted-foreground">per month</div>
                        <Separator className="my-3" />
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />
                            5,000 words per month
                          </li>
                          <li className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />
                            10 document translations
                          </li>
                          <li className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />
                            Priority support
                          </li>
                        </ul>
                        <Button disabled className="mt-4 w-full">
                          Current Plan
                        </Button>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="font-medium">Premium</div>
                        <div className="mt-2 text-3xl font-bold">$29.99</div>
                        <div className="text-sm text-muted-foreground">per month</div>
                        <Separator className="my-3" />
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />
                            Unlimited words
                          </li>
                          <li className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />
                            Unlimited documents
                          </li>
                          <li className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />
                            24/7 dedicated support
                          </li>
                        </ul>
                        <Button className="mt-4 w-full">Upgrade</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Translation History</CardTitle>
                    <CardDescription>Your recent translation activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Words</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Mar 7, 2025</TableCell>
                          <TableCell>English</TableCell>
                          <TableCell>Spanish</TableCell>
                          <TableCell>450</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Completed
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Mar 5, 2025</TableCell>
                          <TableCell>French</TableCell>
                          <TableCell>English</TableCell>
                          <TableCell>1,200</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Completed
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Mar 3, 2025</TableCell>
                          <TableCell>English</TableCell>
                          <TableCell>German</TableCell>
                          <TableCell>800</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Completed
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Feb 28, 2025</TableCell>
                          <TableCell>Japanese</TableCell>
                          <TableCell>English</TableCell>
                          <TableCell>1,000</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Completed
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Document Translations</CardTitle>
                    <CardDescription>Your translated documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Languages</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>business_proposal.pdf</span>
                            </div>
                          </TableCell>
                          <TableCell>Mar 6, 2025</TableCell>
                          <TableCell>EN → FR</TableCell>
                          <TableCell>2.4 MB</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>legal_contract.docx</span>
                            </div>
                          </TableCell>
                          <TableCell>Mar 2, 2025</TableCell>
                          <TableCell>EN → ES</TableCell>
                          <TableCell>1.8 MB</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>product_manual.pdf</span>
                            </div>
                          </TableCell>
                          <TableCell>Feb 25, 2025</TableCell>
                          <TableCell>EN → DE</TableCell>
                          <TableCell>4.2 MB</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Manage your payment information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-8 w-8 text-primary" />
                          <div>
                            <div className="font-medium">Visa ending in 4242</div>
                            <div className="text-sm text-muted-foreground">Expires 04/2026</div>
                          </div>
                        </div>
                        <Badge>Default</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Add Payment Method
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>Your recent transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Mar 1, 2025</TableCell>
                          <TableCell>Pro Plan - Monthly</TableCell>
                          <TableCell>$15.99</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Paid
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Feb 1, 2025</TableCell>
                          <TableCell>Pro Plan - Monthly</TableCell>
                          <TableCell>$15.99</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Paid
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Jan 1, 2025</TableCell>
                          <TableCell>Pro Plan - Monthly</TableCell>
                          <TableCell>$15.99</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Paid
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Billing Address</CardTitle>
                    <CardDescription>Your billing information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company (Optional)</Label>
                        <Input id="company" defaultValue="Acme Inc." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" defaultValue="123 Main St" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" defaultValue="San Francisco" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State/Province</Label>
                        <Input id="state" defaultValue="CA" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP/Postal Code</Label>
                        <Input id="zip" defaultValue="94103" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" defaultValue="United States" />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Save Address</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>Change your password</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Update Password</Button>
                  </CardFooter>
                </Card>

                <Card>
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
                      <Switch id="2fa" />
                    </div>
                    <div className="rounded-lg border p-4 bg-muted/50">
                      <p className="text-sm">
                        Two-factor authentication adds an additional layer of security to your account by requiring more
                        than just a password to sign in.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline">Set Up 2FA</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sessions</CardTitle>
                    <CardDescription>Manage your active sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Device</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="font-medium">Chrome / macOS</div>
                            <div className="text-xs text-muted-foreground">Current session</div>
                          </TableCell>
                          <TableCell>San Francisco, CA</TableCell>
                          <TableCell>192.168.1.1</TableCell>
                          <TableCell>Now</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" disabled>
                              Current
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-medium">Safari / iOS</div>
                          </TableCell>
                          <TableCell>San Francisco, CA</TableCell>
                          <TableCell>192.168.1.2</TableCell>
                          <TableCell>2 days ago</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Sign Out
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-medium">Firefox / Windows</div>
                          </TableCell>
                          <TableCell>New York, NY</TableCell>
                          <TableCell>192.168.1.3</TableCell>
                          <TableCell>5 days ago</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Sign Out
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Sign Out All Other Sessions
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Delete Account</CardTitle>
                    <CardDescription>Permanently delete your account and all data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Once you delete your account, there is no going back. This action cannot be undone and all your
                      data will be permanently deleted.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your
                            data from our servers.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="confirm-delete">Type "DELETE" to confirm</Label>
                            <Input id="confirm-delete" placeholder="DELETE" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive">Delete Account</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}

