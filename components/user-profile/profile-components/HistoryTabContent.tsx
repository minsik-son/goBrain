'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Clipboard, Eye, ChevronUp, Trash2, CheckCircle2 } from "lucide-react"
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
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { deleteTranslationHistoryItem, fetchTranslationHistory, setCurrentPage } from "@/lib/redux/slices/translationHistorySlice"

export function HistoryTabContent() {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const [copiedOriginal, setCopiedOriginal] = useState<Record<string, boolean>>({})
  const [copiedTranslated, setCopiedTranslated] = useState<Record<string, boolean>>({})
  
  const dispatch = useAppDispatch()
  const { items, isLoading, totalPages, currentPage } = useAppSelector((state) => state.translationHistory)
  const { toast } = useToast()
  
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStates(prev => ({ ...prev, [id]: true }))
    toast({
      description: "Text copied to clipboard.",
    })
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }))
    }, 2000)
  }
  
  const handleCopyOriginal = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedOriginal(prev => ({ ...prev, [id]: true }))
    toast({
      description: "Original text copied to clipboard.",
    })
    setTimeout(() => {
      setCopiedOriginal(prev => ({ ...prev, [id]: false }))
    }, 2000)
  }
  
  const handleCopyTranslated = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedTranslated(prev => ({ ...prev, [id]: true }))
    toast({
      description: "Translated text copied to clipboard.",
    })
    setTimeout(() => {
      setCopiedTranslated(prev => ({ ...prev, [id]: false }))
    }, 2000)
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
    
    try {
      await dispatch(deleteTranslationHistoryItem(deletingItemId)).unwrap()
      
      toast({
        description: "Translation history successfully deleted.",
      })
    } catch (error: any) {
      toast({
        title: "Delete Error",
        description: error || "An error occurred while deleting the item.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingItemId(null)
    }
  }
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      dispatch(setCurrentPage(newPage))
      dispatch(fetchTranslationHistory(newPage))
    }
  }
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      dispatch(setCurrentPage(newPage))
      dispatch(fetchTranslationHistory(newPage))
    }
  }
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
    } catch (error) {
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
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No translation history available.
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
                  {items.map((item) => (
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
                              title="Copy"
                              onClick={() => handleCopy(item.translated_text, item.id)}
                              className="transition-all duration-200"
                            >
                              {copiedStates[item.id] ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clipboard className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              title={expandedRows[item.id] ? "Collapse" : "Expand"}
                              onClick={() => handleExpandRow(item.id)}
                            >
                              {expandedRows[item.id] ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              title="Delete"
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
                                <h4 className="text-sm font-medium mb-1">Original Text ({item.source_language})</h4>
                                <div className="p-3 bg-white border rounded-md text-sm whitespace-pre-wrap dark:bg-[#1a1a1a]">
                                  {item.text}
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleCopyOriginal(item.text, item.id)}
                                  className="transition-all duration-200"
                                >
                                  {copiedOriginal[item.id] ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Clipboard className="h-4 w-4 mr-2" />
                                      Copy Original Text
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-1">Translated Text ({item.target_language})</h4>
                                <div className="p-3 bg-white border rounded-md text-sm whitespace-pre-wrap dark:bg-[#1a1a1a]">
                                  {item.translated_text}
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleCopyTranslated(item.translated_text, item.id)}
                                  className="transition-all duration-200"
                                >
                                  {copiedTranslated[item.id] ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Clipboard className="h-4 w-4 mr-2" />
                                      Copy Translated Text
                                    </>
                                  )}
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
        {totalPages > 1 && (
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
            </Button>
          </CardFooter>
        )}
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Translation History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this translation history? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 