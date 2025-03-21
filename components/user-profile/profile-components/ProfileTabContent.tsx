'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserInformationCard } from "./UserInformationCard"
import { NotificationPreferencesCard } from "./NotificationPreferencesCard"
import { useAppSelector } from "@/lib/redux/hooks"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ProfileTabContentProps {
  supabase: any
  toast: any
}

export function ProfileTabContent({ supabase, toast }: ProfileTabContentProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()
  
  // Redux에서 사용자 정보 가져오기
  const userData = useAppSelector((state) => state.user)
  
  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(userData.id)
      
      if (error) {
        console.error("Error deleting account:", error)
        throw error
      }
      
      // 성공적으로 삭제된 경우 로그아웃 및 리디렉션
      await supabase.auth.signOut()
      
      toast({
        title: "성공",
        description: "계정이 성공적으로 삭제되었습니다.",
      })
      
      router.push('/')
      
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "계정 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      <UserInformationCard 
        supabase={supabase}
        toast={toast}
      />
      
      <NotificationPreferencesCard 
        supabase={supabase}
        toast={toast}
      />
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 이 작업은 되돌릴 수 없습니다.
          </p>
          <Button 
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
      
      {/* 계정 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center gap-1">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl text-center">계정 삭제</DialogTitle>
            <DialogDescription className="text-center">
              정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며 모든 데이터가 영구적으로 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-4 rounded-md my-4">
            <p className="text-sm text-muted-foreground">
              삭제되는 데이터:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>모든 번역 기록 및 설정</li>
                <li>결제 정보 및 구독 정보</li>
                <li>프로필 및 사용자 정보</li>
              </ul>
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="sm:flex-1"
            >
              취소
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="sm:flex-1"
            >
              {isDeleting ? "삭제 중..." : "계정 영구 삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 