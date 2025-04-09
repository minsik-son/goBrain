"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileTabContent } from "./profile-components/ProfileTabContent"
import { HistoryTabContent } from "./profile-components/HistoryTabContent"
import { SecurityTabContent } from "./profile-components/SecurityTabContent"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { fetchUserData } from "@/lib/redux/slices/userSlice"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { fetchTranslationHistory } from "@/lib/redux/slices/translationHistorySlice"
import { useMediaQuery } from "@chakra-ui/react"

// Component imports
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider } from "@/lib/contexts/sidebar-context"
import { UserSidebar } from "./profile-components/UserSidebar"
import { ProfileHeader } from "./profile-components/ProfileHeader"
import { NotificationAlert } from "./profile-components/NotificationAlert"
import { SubscriptionTabContent } from "./profile-components/SubscriptionTabContent"
import { BillingTabContent } from "./profile-components/BillingTabContent"
import { DashboardTabContent } from "./profile-components/DashboardTabContent"
import { SettingsTabContent } from "./profile-components/SettingsTabContent"

export function UserProfilePage() {
  const [activeTab, setActiveTab] = useState("profile")
  const dispatch = useAppDispatch()
  const { isLoading, error, id, userName, avatarUrl, plan } = useAppSelector((state) => state.user)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  
  useEffect(() => {
    // Load user data on component mount
    dispatch(fetchUserData())
  }, [dispatch])

  function Closure(){
    let num = 0;
    return function(){
      num++;
      console.log(num);
    }
  }

  const closure = Closure();
  closure();
  closure();
  
  
  useEffect(() => {
    // Load translation history when history tab is selected
    if (activeTab === "history" && id) {
      dispatch(fetchTranslationHistory(1))
    }
  }, [activeTab, id, dispatch])
  
  // Add event listener on component mount
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      if (event.detail && event.detail.tab) {
        setActiveTab(event.detail.tab);
      }
    };
    
    // Register event listener
    document.addEventListener('tabChange', handleTabChange as EventListener);
    
    // Remove event listener on component unmount
    return () => {
      document.removeEventListener('tabChange', handleTabChange as EventListener);
    };
  }, []);
  
  // Loading state display
  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <div className="container py-10">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full mx-auto"></div>
              <p className="text-muted-foreground">Loading user information...</p>
            </div>
          </div>
        </div>
      </>
    )
  }
  
  // Error or unauthenticated state handling
  if (error || !id) {
    return (
      <>
        <SiteHeader />
        <div className="container py-10">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <p className="text-xl font-semibold">Login required</p>
              <Button asChild>
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }
  
  return (
    <SidebarProvider>
      <SiteHeader />
      
      <div className="flex">
        <UserSidebar />
        <div className="flex-1 px-4 py-8 md:px-6 lg:px-8">
          <ProfileHeader 
            userName={userName || "User"} 
            avatarUrl={avatarUrl}
            darkMode={false} // Default setting
            toggleDarkMode={() => {}} // Default setting
          />
          <NotificationAlert />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
            <TabsContent value="profile">
              <ProfileTabContent
                supabase={supabase}
                toast={toast}
              />
            </TabsContent>
            <TabsContent value="subscription">
              <SubscriptionTabContent
                plan={plan}
              />
            </TabsContent>
            <TabsContent value="history">
              <HistoryTabContent />
            </TabsContent>
            <TabsContent value="billing">
              <BillingTabContent />
            </TabsContent>
            <TabsContent value="security">
              <SecurityTabContent
                supabase={supabase}
                toast={toast}
              />
            </TabsContent>
            <TabsContent value="dashboard">
              <DashboardTabContent />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsTabContent />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarProvider>
  )
}

