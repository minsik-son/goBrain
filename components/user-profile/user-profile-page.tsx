"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

// 컴포넌트 임포트
import { UserSidebar } from "./profile-components/UserSidebar"
import { ProfileHeader } from "./profile-components/ProfileHeader"
import { NotificationAlert } from "./profile-components/NotificationAlert"
import { ProfileTabContent } from "./profile-components/ProfileTabContent"
import { SubscriptionTabContent } from "./profile-components/SubscriptionTabContent"
import { HistoryTabContent } from "./profile-components/HistoryTabContent"
import { BillingTabContent } from "./profile-components/BillingTabContent"
import { SecurityTabContent } from "./profile-components/SecurityTabContent"

export function UserProfilePage() {
  const [darkMode, setDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [user, setUser] = useState<any>(null)
  const [userID, setUserID] = useState<any>(null)
  
  // 사용자 프로필 정보
  const [userData, setUserData] = useState({
    userName: "",
    email: "",
    avatarUrl: "",
    createdAt: "",
    preferredLanguage: "",
    plan: "",
    phone: "",
    email_notifications: false,
    marketing_emails: false,
    product_updates: false,
  })
  
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    const { data, error: userSessionError } = await supabase.auth.getSession()
    if (userSessionError) {
      console.error("유저 세션을 가져오지 못함:", userSessionError);
      return;
    }

    if (!data.session) return;

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error("유저 정보를 가져오지 못함:", userError);
      return;
    }
    
    if (userData.user) {
      setUser(userData.user)
      const userId = userData.user?.id
      setUserID(userId)
      
      if (userId) {
        const { data: userInfo, error: userInfoError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
          
        if (userInfoError) {
          console.error("프로필 정보를 가져오지 못함:", userInfoError)
        } else {
          setUserData({
            userName: userInfo?.full_name || '',
            email: userInfo?.email || '',
            avatarUrl: userInfo?.avatar_url || '',
            createdAt: userInfo?.created_at || '',
            preferredLanguage: userInfo?.preferred_language || '',
            plan: userInfo?.plan || '',
            phone: userInfo?.phone || '',
            email_notifications: userInfo?.email_notifications || false,
            marketing_emails: userInfo?.marketing_emails || false,
            product_updates: userInfo?.product_updates || false,
          })
        }
      }
    }
  }

  // 다크 모드 토글
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className={`min-h-screen bg-background ${darkMode ? "dark" : ""}`}>
      <SiteHeader />
      <SidebarProvider>
        <div className="flex min-h-screen">
          <UserSidebar />

          <div className="flex-1 w-full p-6 md:p-8 overflow-auto">
            <ProfileHeader 
              userName={userData.userName} 
              avatarUrl={userData.avatarUrl} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
            />

            <NotificationAlert plan={userData.plan} />

            <Tabs defaultValue="profile" className="space-y-6" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full max-w-3xl">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <ProfileTabContent 
                  userID={userID}
                  userData={userData}
                  setUserData={setUserData}
                  supabase={supabase}
                  toast={toast}
                />
              </TabsContent>

              <TabsContent value="subscription">
                <SubscriptionTabContent plan={userData.plan} />
              </TabsContent>

              <TabsContent value="history">
                <HistoryTabContent />
              </TabsContent>

              <TabsContent value="billing">
                <BillingTabContent />
              </TabsContent>

              <TabsContent value="security">
                <SecurityTabContent userID={userID} supabase={supabase} toast={toast} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}

