import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Clipboard, Eye, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TranslationHistory {
  id: string
  user_id: string
  source_language: string
  target_language: string
  text: string
  translated_text: string
  word_count: number
  created_at: string
}

export function HistoryTabContent() {
  const [history, setHistory] = useState<TranslationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const itemsPerPage = 5
  
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  
  useEffect(() => {
    fetchTranslationHistory()
  }, [currentPage])
  
  const fetchTranslationHistory = async () => {
    setLoading(true)
    
    try {
      // 먼저 사용자 ID 가져오기
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      
      if (!userId) {
        throw new Error("로그인이 필요합니다.")
      }
      
      // 전체 기록 수 가져오기
      const { count, error: countError } = await supabase
        .from('translation_history')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
      
      if (countError) throw countError
      
      const total = count || 0
      setTotalPages(Math.ceil(total / itemsPerPage))
      
      // 페이지네이션된 기록 가져오기
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      
      const { data, error } = await supabase
        .from('translation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (error) throw error
      
      setHistory(data || [])
      
    } catch (error: any) {
      console.error("기록 가져오기 오류:", error)
      toast({
        title: "오류",
        description: error.message || "번역 기록을 가져오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      
      setHistory([])
    } finally {
      setLoading(false)
    }
  }
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      description: "텍스트가 클립보드에 복사되었습니다.",
    })
  }
  
  const handleExpandRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }
  
  const handleDeleteClick = (id: string) => {
    setDeletingItemId(id)
    setDeleteDialogOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!deletingItemId) return
    
    setIsDeleting(true)
    
    try {
      const { error } = await supabase
        .from('translation_history')
        .delete()
        .eq('id', deletingItemId)
      
      if (error) throw error
      
      // UI에서 삭제된 항목 제거
      setHistory(prev => prev.filter(item => item.id !== deletingItemId))
      
      toast({
        description: "번역 기록이 성공적으로 삭제되었습니다.",
      })
      
      // 현재 페이지에 항목이 더 이상 없고 이전 페이지가 있는 경우 이전 페이지로 이동
      if (history.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      } else if (history.length === 1) {
        // 다시 조회하여 0개를 표시
        fetchTranslationHistory()
      }
      
    } catch (error: any) {
      console.error("삭제 오류:", error)
      toast({
        title: "오류",
        description: error.message || "항목을 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setDeletingItemId(null)
    }
  }
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }
  
  // 날짜 형식 변환 함수
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
    } catch {
      return dateString
    }
  }
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Translation History</CardTitle>
          <CardDescription>Your recent translation activities</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              저장된 번역 기록이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[100px]">Source</TableHead>
                    <TableHead className="w-[100px]">Target</TableHead>
                    <TableHead className="w-[200px]">Original Text</TableHead>
                    <TableHead className="w-[200px]">Translated Text</TableHead>
                    <TableHead className="w-[80px]">Words</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <>
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.created_at)}</TableCell>
                        <TableCell>{item.source_language}</TableCell>
                        <TableCell>{item.target_language}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={item.text}>
                          {item.text.length > 30 ? `${item.text.substring(0, 30)}...` : item.text}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={item.translated_text}>
                          {item.translated_text.length > 30 ? `${item.translated_text.substring(0, 30)}...` : item.translated_text}
                        </TableCell>
                        <TableCell>{item.word_count}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex space-x-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              title="복사"
                              onClick={() => handleCopy(item.translated_text)}
                            >
                              <Clipboard className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              title={expandedRows[item.id] ? "접기" : "펼치기"}
                              onClick={() => handleExpandRow(item.id)}
                            >
                              {expandedRows[item.id] ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              title="삭제"
                              onClick={() => handleDeleteClick(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows[item.id] && (
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={7} className="p-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium mb-1">원본 텍스트 ({item.source_language})</h4>
                                <div className="p-3 bg-white border rounded-md text-sm whitespace-pre-wrap">
                                  {item.text}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-1">번역된 텍스트 ({item.target_language})</h4>
                                <div className="p-3 bg-white border rounded-md text-sm whitespace-pre-wrap">
                                  {item.translated_text}
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleCopy(`${item.text}\n\n${item.translated_text}`)}
                                >
                                  모두 복사
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1 || loading}
          >
            이전
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || loading}
          >
            다음
          </Button>
        </CardFooter>
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>번역 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 번역 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 