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

// 컴포넌트 임포트
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider } from "@/lib/contexts/sidebar-context"
import { UserSidebar } from "./profile-components/UserSidebar"
import { ProfileHeader } from "./profile-components/ProfileHeader"
import { NotificationAlert } from "./profile-components/NotificationAlert"
import { SubscriptionTabContent } from "./profile-components/SubscriptionTabContent"
import { BillingTabContent } from "./profile-components/BillingTabContent"

export function UserProfilePage() {
  const [activeTab, setActiveTab] = useState("profile")
  const dispatch = useAppDispatch()
  const { isLoading, error, id, userName, avatarUrl, plan } = useAppSelector((state) => state.user)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  
  useEffect(() => {
    // 컴포넌트 마운트 시 유저 데이터 로드
    dispatch(fetchUserData())
  }, [dispatch])
  
  useEffect(() => {
    // 히스토리 탭이 선택되었을 때 번역 기록 로드
    if (activeTab === "history" && id) {
      dispatch(fetchTranslationHistory(1))
    }
  }, [activeTab, id, dispatch])
  
  // 로딩 상태 표시
  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <div className="container py-10">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full mx-auto"></div>
              <p className="text-muted-foreground">사용자 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </>
    )
  }
  
  // 에러 또는 미인증 상태 처리
  if (error || !id) {
    return (
      <>
        <SiteHeader />
        <div className="container py-10">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <p className="text-xl font-semibold">로그인이 필요합니다</p>
              <Button asChild>
                <Link href="/login">로그인하러 가기</Link>
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
            userName={userName || "사용자"} 
            avatarUrl={avatarUrl}
            darkMode={false} // 기본값 설정
            toggleDarkMode={() => {}} // 기본값 설정
          />
          <NotificationAlert />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              {activeTab === "profile" && (
                <ProfileTabContent
                  supabase={supabase}
                  toast={toast}
                />
              )}
              
              {activeTab === "subscription" && (
                <SubscriptionTabContent
                  plan={plan}
                />
              )}
              
              {activeTab === "history" && (
                <HistoryTabContent />
              )}
              
              {activeTab === "billing" && (
                <BillingTabContent />
              )}
              
              {activeTab === "security" && (
                <SecurityTabContent
                  supabase={supabase}
                  toast={toast}
                />
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </SidebarProvider>
  )
}

