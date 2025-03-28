"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUser } from "@/lib/contexts/user-context"
import { cn } from "@/lib/utils"
import {
  Languages,
  Image,
  FileText,
  RotateCcw,
  X,
  Volume2,
  Star,
  Share2,
  ChevronDown,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
  Download,
  FileCheck
} from "lucide-react"
import { extractDetectedLanguage } from "@/components/detectLanguageAPI"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import {
  fetchUserPlanAndLimits,
  uploadAndTranslateDocument,
  resetTranslation,
} from "@/lib/redux/slices/documentTranslationSlice"
import { getLanguageNameFromCode } from "@/lib/utils/language-utils"
import { LanguageSelector } from "./language-selector"
import { LoadingDots } from "./hooks/LoadingDots"

// 언어 목록 정의
const languages = [
  { code: "detect", name: "Detect Language" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "id", name: "Indonesian" },
]

// 번역 결과에서 불필요한 텍스트 제거 함수
const cleanTranslationResult = (text: string): string => {
  const prefixPattern = /^(?:The language of the input text is [^.]+\.\s*)?(?:The translation (?:from [^ ]+ )?to [^ ]+ is:?\s*)?/i
  const cleanedText = text.replace(prefixPattern, '')
  return cleanedText.replace(/^["']|["']$/g, '').trim()
}

// 언어 이름 매핑
const langNames: { [key: string]: string } = {
  en: "English",
  ko: "Korean",
  ja: "Japanese",
  zh: "Chinese",
  es: "Spanish",
  fr: "French",
  de: "German",
  ru: "Russian",
}

// 간단한 클라이언트 측 언어 감지 함수
const simpleDetectLanguage = (text: string) => {
  const patterns = {
    en: /^[a-zA-Z\s.,!?'"-]+$/,
    ko: /[\uAC00-\uD7AF]/,
    ja: /[\u3040-\u309F\u30A0-\u30FF]/,
    zh: /[\u4E00-\u9FFF]/,
    es: /[áéíóúüñ¿¡]/i,
    fr: /[àâäæçéèêëîïôœùûüÿ]/i,
    de: /[äöüß]/i,
    ru: /[а-яА-ЯёЁ]/,
  }

  for (const [code, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return { code, name: langNames[code as keyof typeof langNames] }
    }
  }
  return { code: "en", name: langNames["en"] } // 기본값
}

// 언어 목록에서 선택된 언어를 제외한 목록 반환
const getFilteredLanguages = (languageList: Array<{code: string, name: string}>, excludeCode: string) => {
  return languageList.filter((lang) => lang.code !== excludeCode);
};

export function Translator() {
  const [activeTab, setActiveTab] = useState("text")
  const [sourceLanguage, setSourceLanguage] = useState("detect")
  const [targetLanguage, setTargetLanguage] = useState("en")
  const [showSourceLanguageDropdown, setShowSourceLanguageDropdown] = useState(false)
  const [showTargetLanguageDropdown, setShowTargetLanguageDropdown] = useState(false)
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [characterCount, setCharacterCount] = useState(0)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false)
  const [sourceTextCopied, setSourceTextCopied] = useState(false)
  const [translatedTextCopied, setTranslatedTextCopied] = useState(false)
  const [usageStats, setUsageStats] = useState<{
    limit: number
    used: number
    remaining: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detectedLanguageCode, setDetectedLanguageCode] = useState<string | null>(null)
  const [detectedLanguageName, setDetectedLanguageName] = useState<string | null>(null)
  const [languageMismatch, setLanguageMismatch] = useState<{
    detected: string
    detectedCode: string
    current: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const sourceTextareaRef = useRef<HTMLTextAreaElement>(null)
  const targetTextareaRef = useRef<HTMLTextAreaElement>(null)
  const currentInputRef = useRef<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const isTranslatingRef = useRef<boolean>(false)
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isSaved, setIsSaved] = useState(false);


  const { user } = useAuth()
  const { profile } = useUser()
  const isPremium = profile?.plan === "premium" || profile?.plan === "business"
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const dispatch = useAppDispatch()
  const {
    isUploading,
    uploadStep,
    currentTranslation,
    userPlan,
    translationsLeft,
    canTranslate,
    error: documentError,
  } = useAppSelector((state) => state.documentTranslation)

  // 최대 입력 길이 계산
  const getMaxInputLength = () => {
    if (!profile) return 500
    if (userId === "5027a0bf-89e2-4ce2-9289-336986950758") return 1000000 // 테스트용 ID
    switch (profile.plan) {
      case "Starter":
        return 1000
      case "Creator":
        return 3000
      case "Master":
        return 5000
      default:
        return 10000
    }
  }
  const maxInputLength = getMaxInputLength()

  // 초기 로드 시 textarea 높이 조절
  useEffect(() => {
    if (sourceTextareaRef.current && sourceText) {
      sourceTextareaRef.current.style.height = "auto"
      sourceTextareaRef.current.style.height = `${sourceTextareaRef.current.scrollHeight}px`
    }
  }, [])

  // 언어 감지 함수 (클라이언트 측과 서버 API 사용)
  const detectLanguage = async (text: string) => {
    setIsDetecting(true)
    const clientDetected = simpleDetectLanguage(text)
    setDetectedLanguageCode(clientDetected.code)
    setDetectedLanguageName(clientDetected.name)

    try {
      const response = await fetch("/api/detect-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.detectedLanguage && data.detectedLanguage.code) {
          console.log("감지된 언어 코드:", data.detectedLanguage.code)
          console.log("감지된 언어 이름:", data.detectedLanguage.name)
          setDetectedLanguageCode(data.detectedLanguage.code)
          setDetectedLanguageName(data.detectedLanguage.name)
        }
      }
    } catch (error) {
      console.error("서버 API 오류, 클라이언트 결과 유지:", error)
    } finally {
      setIsDetecting(false)
    }
    return clientDetected
  }

  // 감지된 언어와 타겟 언어가 같은 경우 처리
  const preventSameLanguage = (
    sourceCode: string,
    targetCode: string,
    detectedCode: string | null = null
  ) => {
    if (isDetecting) return false
    const effectiveSourceCode =
      sourceCode === "detect" && detectedCode ? detectedCode : sourceCode
    if (effectiveSourceCode === targetCode) {
      const alternativeLanguage = languages.find(
        (lang) => lang.code !== effectiveSourceCode && lang.code !== "detect"
      )
      if (alternativeLanguage) {
        setTargetLanguage(alternativeLanguage.code)
        return true
      }
    }
    return false
  }

  // 감지된 언어 코드가 있을 때 타겟 언어가 같은지 체크
  useEffect(() => {
    if (detectedLanguageCode && sourceLanguage === "detect") {
      preventSameLanguage("detect", targetLanguage, detectedLanguageCode)
    }
  }, [detectedLanguageCode, sourceLanguage, targetLanguage, isDetecting])

  // 실시간 언어 감지 (디바운스)
  useEffect(() => {
    if (sourceLanguage !== "detect" || sourceText.trim().length < 4) return
    setIsDetecting(true)
    const debounceTimeout = setTimeout(async () => {
      if (isTranslatingRef.current) return
      try {
        const response = await fetch("/api/detect-language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sourceText }),
        })
        if (response.ok) {
          const data = await response.json()
          if (data.detectedLanguage && data.detectedLanguage.code) {
            setDetectedLanguageCode(data.detectedLanguage.code)
            setDetectedLanguageName(data.detectedLanguage.name)
            console.log(`실시간 언어 감지: ${data.detectedLanguage.name}`)
            setTimeout(() => setIsDetecting(false), 100)
          }
        } else {
          console.log("API 오류, 클라이언트 측 감지 사용")
          const detected = simpleDetectLanguage(sourceText)
          setDetectedLanguageCode(detected.code)
          setDetectedLanguageName(detected.name)
          setTimeout(() => setIsDetecting(false), 100)
        }
      } catch (error) {
        console.error("언어 감지 API 오류:", error)
        const detected = simpleDetectLanguage(sourceText)
        setDetectedLanguageCode(detected.code)
        setDetectedLanguageName(detected.name)
        setTimeout(() => setIsDetecting(false), 100)
      }
    }, 800)
    return () => clearTimeout(debounceTimeout)
  }, [sourceText, sourceLanguage])

  // 자동 번역 (디바운스 처리)
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (sourceText && sourceLanguage !== targetLanguage) {
        translateText()
      }
    }, 500)
    return () => clearTimeout(debounceTimeout)
  }, [sourceText, sourceLanguage, targetLanguage])

  // 텍스트 입력 처리 (입력 시 로딩 상태는 API 호출 시에만 적용)
  const handleSourceTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (text.length > maxInputLength) return
    setSourceText(text)
    setCharacterCount(text.length)
    if (sourceTextareaRef.current) {
      sourceTextareaRef.current.style.height = "auto"
      sourceTextareaRef.current.style.height = `${sourceTextareaRef.current.scrollHeight}px`
    }
    if (text === "") {
      setTranslatedText("")
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }

  // 언어 스왑
  const handleSwapLanguages = () => {
    if (sourceLanguage === "detect") return
    const temp = sourceLanguage
    setSourceLanguage(targetLanguage)
    setTargetLanguage(temp)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
    setCharacterCount(translatedText.length)
  }

  const handleClearText = () => {
    setSourceText("")
    setTranslatedText("")
    setCharacterCount(0)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  // 텍스트 복사 기능
  const handleCopyText = async (text: string, isSource: boolean = false) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      if (isSource) {
        setSourceTextCopied(true)
        setTimeout(() => setSourceTextCopied(false), 2000)
      } else {
        setTranslatedTextCopied(true)
        setTimeout(() => setTranslatedTextCopied(false), 2000)
      }
    } catch (err) {
      console.error("텍스트 복사 실패:", err)
    }
  }

  const handleCopyTranslation = () => {
    handleCopyText(translatedText, false)
  }

  // 번역 저장
  const handleSaveTranslation = async () => {
    if (!translatedText || !userId) {
      toast({
        title: "오류",
        description: !userId
          ? "로그인이 필요합니다."
          : "저장할 번역 내용이 없습니다.",
        variant: "destructive",
      })
      return
    }
    setIsSaving(true)
    try {
      const wordCount = sourceText.trim().split(/\s+/).length
      const actualSourceLanguage =
        sourceLanguage === "detect"
          ? detectedLanguageName || "Unknown"
          : languages.find((lang) => lang.code === sourceLanguage)?.name ||
            sourceLanguage

      const { error } = await supabase.from("translation_history").insert({
        user_id: userId,
        source_language: actualSourceLanguage,
        target_language:
          languages.find((lang) => lang.code === targetLanguage)?.name ||
          targetLanguage,
        text: sourceText,
        translated_text: translatedText,
        word_count: wordCount,
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      setIsSaved(true)
      toast({
        description: "번역이 성공적으로 저장되었습니다.",
      })
    } catch (error: any) {
      console.error("번역 저장 오류:", error)
      toast({
        title: "저장 오류",
        description:
          error.message || "번역 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 타겟 언어 변경
  
  const handleTargetLanguageChange = (code: string) => {
    setTargetLanguage(code)

    // 'detect' 모드인 경우 감지된 언어를 사용, 아니면 선택된 소스 언어 사용
    const effectiveSourceCode = sourceLanguage === "detect" && detectedLanguageCode
      ? detectedLanguageCode
      : sourceLanguage

    // Prevent the target language from being the same as the source language.
    if (!preventSameLanguage(effectiveSourceCode, code)) {
      // If the languages are different, start translating.
      if (sourceText.trim()) {
        setIsLoadingTranslation(true)
        //setTranslatedText("")
        if (translationTimeoutRef.current) {
          clearTimeout(translationTimeoutRef.current)
        }
        translationTimeoutRef.current = setTimeout(() => {
          translateText()
        }, 300)
      }
    }
  };



  // 번역 API 호출 (API 호출 중에만 로딩 애니메이션이 표시됨)
  const translateText = async () => {
    if (!sourceText.trim() || sourceLanguage === targetLanguage) return
    try {
      setIsTranslating(true)
      setIsLoadingTranslation(true)
      setTranslatedText("")
      setError(null)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()
      currentInputRef.current = sourceText

      let detectedLanguageInfo = null
      if (sourceLanguage === "detect") {
        setIsDetecting(true)
        try {
          const response = await fetch("/api/detect-language", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: sourceText }),
            signal: abortControllerRef.current.signal,
          })
          if (response.ok) {
            const data = await response.json()
            if (data.detectedLanguage && data.detectedLanguage.code) {
              detectedLanguageInfo = data.detectedLanguage
              setDetectedLanguageCode(data.detectedLanguage.code)
              setDetectedLanguageName(data.detectedLanguage.name)
            }
          } else {
            const detected = simpleDetectLanguage(sourceText)
            detectedLanguageInfo = {
              code: detected.code,
              name: detected.name,
              confidence: 0.8,
            }
            setDetectedLanguageCode(detected.code)
            setDetectedLanguageName(detected.name)
          }
        } catch (error) {
          if (error instanceof Error && error.name !== "AbortError") {
            console.error("언어 감지 오류:", error)
            const detected = simpleDetectLanguage(sourceText)
            detectedLanguageInfo = {
              code: detected.code,
              name: detected.name,
              confidence: 0.8,
            }
            setDetectedLanguageCode(detected.code)
            setDetectedLanguageName(detected.name)
          } else {
            throw error
          }
        }
      }

      let inputLanguageName =
        sourceLanguage === "detect"
          ? "Detect Language"
          : languages.find((l) => l.code === sourceLanguage)?.name || "English"
      const outputLanguageName =
        languages.find((l) => l.code === targetLanguage)?.name || "English"

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputText: sourceText,
          inputLanguage: inputLanguageName,
          outputLanguage: outputLanguageName,
          detectedLanguageInfo,
        }),
        signal: abortControllerRef.current.signal,
      })

      const data = await response.json()
      const cleanedTranslation = cleanTranslationResult(data.text)
      setTranslatedText(cleanedTranslation)
      setIsSaved(false)
      if (data.usageStats) {
        setUsageStats(data.usageStats)
      }
      setIsLoadingTranslation(false)
      if (sourceLanguage === "detect" && detectedLanguageInfo?.code === targetLanguage) {
        setError("입력 언어와 출력 언어가 같습니다. 다른 출력 언어를 선택하세요.")
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError")) {
        console.error("번역 오류:", err)
        setError("번역 중 오류가 발생했습니다. 다시 시도해주세요.")
      }
      setIsLoadingTranslation(false)
    } finally {
      setIsTranslating(false)
    }
  }

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (showSourceLanguageDropdown || showTargetLanguageDropdown) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (
          !target.closest(".dropdown-content") &&
          !target.closest(".dropdown-trigger")
        ) {
          setShowSourceLanguageDropdown(false)
          setShowTargetLanguageDropdown(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showSourceLanguageDropdown, showTargetLanguageDropdown])

  // textarea 높이 자동 조정 및 동기화
  useEffect(() => {
    const adjustTextareaHeight = () => {
      if (sourceTextareaRef.current && targetTextareaRef.current) {
        sourceTextareaRef.current.style.height = "auto"
        targetTextareaRef.current.style.height = "auto"
        const sourceScrollHeight = sourceTextareaRef.current.scrollHeight
        const targetScrollHeight = targetTextareaRef.current.scrollHeight
        const minHeight = 300
        const sourceHeight = Math.max(sourceScrollHeight, minHeight)
        const targetHeight = Math.max(targetScrollHeight, minHeight)
        const maxHeight = Math.max(sourceHeight, targetHeight)
        sourceTextareaRef.current.style.height = `${maxHeight}px`
        targetTextareaRef.current.style.height = `${maxHeight}px`
      }
    }
    adjustTextareaHeight()
    window.addEventListener("resize", adjustTextareaHeight)
    return () => window.removeEventListener("resize", adjustTextareaHeight)
  }, [sourceText, translatedText])

  // 디버깅: 언어 감지 상태 확인
  useEffect(() => {
    console.log("감지 상태 변경:", {
      detectedLanguageCode,
      detectedLanguageName,
      isDetecting,
    })
  }, [detectedLanguageCode, detectedLanguageName, isDetecting])

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (data.session) {
        const { data: userData } = await supabase.auth.getUser()
        setUserId(userData.user?.id || null)
      }
    }
    fetchUser()
  }, [supabase])

  // 문서 번역 제한 정보 업데이트
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserPlanAndLimits(userId))
    }
  }, [userId, dispatch])

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (!userId || !canTranslate) return
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const fileExtension = file.name.split(".").pop()?.toLowerCase()
      if (["pdf", "docx", "txt"].includes(fileExtension || "")) {
        handleFileUpload(file)
      } else {
        console.log("지원하지 않는 파일 형식")
        toast({
          title: "지원되지 않는 파일 형식",
          description: "PDF, DOCX, TXT 형식의 파일만 지원합니다.",
          variant: "destructive",
        })
      }
    }
  }

  // 파일 업로드 처리
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // 간단한 알림 함수
  const showAlert = (message: string) => {
    const alertElement = document.createElement("div")
    alertElement.style.position = "fixed"
    alertElement.style.bottom = "20px"
    alertElement.style.right = "20px"
    alertElement.style.padding = "10px 20px"
    alertElement.style.backgroundColor = "#333"
    alertElement.style.color = "white"
    alertElement.style.borderRadius = "4px"
    alertElement.style.zIndex = "9999"
    alertElement.textContent = message

    document.body.appendChild(alertElement)

    setTimeout(() => {
      alertElement.style.opacity = "0"
      alertElement.style.transition = "opacity 0.5s"
      setTimeout(() => {
        document.body.removeChild(alertElement)
      }, 500)
    }, 3000)
  }

  // 파일 업로드 핸들러 (문서 번역)
  const handleFileUpload = (file: File) => {
    if (!userId) return
    dispatch(
      uploadAndTranslateDocument({
        file,
        userId,
        sourceLanguage,
        targetLanguage,
        userPlan,
      })
    )
      .unwrap()
      .then(() => {
        showAlert("문서 번역이 완료되었습니다.")
      })
      .catch((error) => {
        showAlert(`오류: ${error || "문서 번역 중 오류가 발생했습니다."}`)
      })
  }

  // 번역 문서 다운로드
  const handleDocumentDownload = async (fileUrl: string) => {
    try {
      const response = await fetch(fileUrl)
      if (!response.ok) throw new Error("파일을 가져오는 데 실패했습니다")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download =
        currentTranslation?.document_name.replace(/\.[^.]+$/, "") +
        "_translated" +
        currentTranslation?.document_name.substring(
          currentTranslation.document_name.lastIndexOf(".")
        )
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (error: any) {
      console.error("Download error:", error)
      toast({
        title: "다운로드 오류",
        description:
          error.message || "파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // Redux 디버깅
  useEffect(() => {
    console.log("Redux 문서 번역 상태:", {
      userId,
      userPlan,
      canTranslate,
      translationsLeft,
    })
  }, [userId, userPlan, canTranslate, translationsLeft])

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id)
      console.log("사용자 ID 설정됨:", user.id)
      dispatch(fetchUserPlanAndLimits(user.id))
    }
  }, [user, dispatch])

  useEffect(() => {
    if (userId) {
      console.log("문서 번역 상태 확인:", {
        userId,
        userPlan,
        canTranslate,
        translationsLeft,
      })
    }
  }, [userId, userPlan, canTranslate, translationsLeft])

  useEffect(() => {
    console.log("Toast 함수 확인:", toast)
    try {
      toast({
        title: "테스트 알림",
        description: "이 메시지가 보이면 toast가 작동합니다.",
      })
      console.log("Toast 호출 성공")
    } catch (error) {
      console.error("Toast 호출 실패:", error)
    }
  }, [toast])

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-sm border">
      <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-2">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <span>텍스트</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span>이미지</span>
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>문서</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Source Text 영역 */}
            <div className="border-r relative">
              <div className="p-3 border-b flex justify-between items-center h-14 relative">
                <div className="relative">
                  <button
                    type="button"
                    className="dropdown-trigger flex items-center gap-1 text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowSourceLanguageDropdown(!showSourceLanguageDropdown)
                      setShowTargetLanguageDropdown(false)
                    }}
                  >
                    {sourceLanguage === "detect" ? (
                      <>
                        {detectedLanguageName ? (
                          <span className="flex items-center">
                            감지됨: <span className="font-medium text-green-600 ml-1">{detectedLanguageName}</span>
                          </span>
                        ) : (
                          "언어 감지"
                        )}
                        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showSourceLanguageDropdown ? "rotate-180" : ""}`} />
                      </>
                    ) : (
                      <>
                        {languages.find((l) => l.code === sourceLanguage)?.name || "소스 언어"}
                        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showSourceLanguageDropdown ? "rotate-180" : ""}`} />
                      </>
                    )}
                  </button>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSwapLanguages} className="h-8 w-8">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {showSourceLanguageDropdown && (
                <div
                  className="dropdown-content absolute top-[56px] left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
                  style={{ maxHeight: "400px", overflowY: "auto" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-3 p-4 gap-2">
                    <button
                      type="button"
                      className={`text-left p-3 text-sm rounded-md ${
                        sourceLanguage === "detect"
                          ? "bg-green-50 border border-green-200 text-green-700"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSourceLanguage("detect")
                        setShowSourceLanguageDropdown(false)
                      }}
                    >
                      <span className="flex items-center">
                        {sourceLanguage === "detect" && <span className="text-green-500 mr-2">✓</span>}
                        언어 감지
                      </span>
                    </button>
                    {getFilteredLanguages(languages.filter((lang) => lang.code !== "detect"), targetLanguage).map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        className={`text-left p-3 text-sm rounded-md ${
                          sourceLanguage === lang.code
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "border border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSourceLanguage(lang.code)
                          setShowSourceLanguageDropdown(false)
                          if (sourceText) translateText()
                        }}
                      >
                        <span className="flex items-center">
                          {sourceLanguage === lang.code && <span className="text-green-500 mr-2">✓</span>}
                          {lang.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                {sourceText && (
                  <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
                    onClick={handleClearText}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <textarea
                  ref={sourceTextareaRef}
                  placeholder="번역할 텍스트를 입력하세요"
                  className="w-full pr-10 p-4 pb-16 min-h-[300px] resize-none border-0 focus:ring-0 focus:outline-none"
                  value={sourceText}
                  onChange={handleSourceTextChange}
                  maxLength={maxInputLength}
                />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {characterCount} / {maxInputLength}
                  </div>
                  {sourceText && (
                    <div className="flex gap-2">
                      <button className="text-gray-500 hover:text-gray-700">
                        <Volume2 className="h-5 w-5" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700" onClick={() => handleCopyText(sourceText, true)}>
                        {sourceTextCopied ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Translated Text 영역 */}
            <div className="relative">
              <div className="p-3 border-b flex justify-between items-center h-14 relative">
                <div className="relative">
                  <button
                    type="button"
                    className="dropdown-trigger flex items-center gap-1 text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowTargetLanguageDropdown(!showTargetLanguageDropdown)
                      setShowSourceLanguageDropdown(false)
                    }}
                  >
                    {languages.find((l) => l.code === targetLanguage)?.name || "타겟 언어"}
                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showTargetLanguageDropdown ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {showTargetLanguageDropdown && (
                <div
                  className="dropdown-content absolute top-[56px] left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
                  style={{ maxHeight: "400px", overflowY: "auto" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-3 p-4 gap-2">
                    {getFilteredLanguages(languages.filter(lang => lang.code !== "detect"), sourceLanguage).map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        className={`text-left p-3 text-sm rounded-md ${
                          targetLanguage === lang.code
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "border border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTargetLanguageChange(lang.code)
                          setShowTargetLanguageDropdown(false)
                          if (sourceText) translateText()
                        }}
                      >
                        <span className="flex items-center">
                          {targetLanguage === lang.code && <span className="text-green-500 mr-2">✓</span>}
                          {lang.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                {isLoadingTranslation ? (
                  <div className="w-full min-h-[300px] flex items-center justify-center">
                    <LoadingDots count={3} interval={300} dotSize="h-3 w-3" dotColor="bg-primary/60" />
                  </div>
                ) : (
                  <textarea
                    ref={targetTextareaRef}
                    readOnly
                    placeholder={isTranslating ? "번역 중..." : "번역 결과가 여기에 표시됩니다"}
                    className="w-full p-4 pb-16 min-h-[300px] resize-none border-0 focus:ring-0 focus:outline-none bg-white"
                    value={translatedText}
                  />
                )}
                {translatedText && (
                  <div className="absolute bottom-3 right-3 flex gap-3">
                    <button className="text-gray-500 hover:text-gray-700">
                      <Volume2 className="h-5 w-5" />
                    </button>
                    <button className="text-gray-500 hover:text-gray-700" onClick={() => handleCopyText(translatedText, false)}>
                      {translatedTextCopied ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={handleSaveTranslation}
                      disabled={isSaving || isSaved || !userId}
                      title={!userId ? "로그인이 필요합니다" : "번역 기록 저장"}
                    >
                      <Star className={`h-5 w-5 ${isSaved ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </button>
                    <button className="text-gray-500 hover:text-gray-700">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 m-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {usageStats && (
            <div className="text-xs text-gray-500 p-3 border-t">
              일일 번역 사용량: {usageStats.used}/{usageStats.limit} (남은 횟수: {usageStats.remaining})
            </div>
          )}

          {languageMismatch && (
            <div className="bg-yellow-50 text-yellow-800 p-3 my-2 rounded-md text-sm flex justify-between items-center">
              <div>
                입력된 텍스트는 {languageMismatch.current}가 아닌 {languageMismatch.detected}로 감지되었습니다.
              </div>
              <button
                className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded"
                onClick={() => {
                  setSourceLanguage(languageMismatch.detectedCode)
                  setLanguageMismatch(null)
                  if (sourceText) translateText()
                }}
              >
                {languageMismatch.detected}로 변경
              </button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="image" className="mt-0">
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              번역할 이미지를 업로드하세요
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              지원 형식: JPG, PNG, GIF
            </p>
            <Button>이미지 업로드</Button>
            {!isPremium && (
              <p className="text-xs text-amber-600 mt-4">
                고급 OCR 번역 기능을 사용하려면 Pro로 업그레이드하세요
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="document" className="mt-0">
          <LanguageSelector
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            onSourceLanguageChange={setSourceLanguage}
            onTargetLanguageChange={handleTargetLanguageChange}
            onReloadClick={() => console.log("Reload clicked")}
            activeTab="document"
          />
          {isUploading ? (
            <div className="text-center py-16 border-2 rounded-lg">
              <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {uploadStep === "uploading" && "문서 업로드 중..."}
                {uploadStep === "extracting" && "텍스트 추출 중..."}
                {uploadStep === "translating" && "번역 중..."}
                {uploadStep === "generating" && "번역 문서 생성 중..."}
              </h3>
              <p className="text-sm text-gray-500">
                파일 크기에 따라 다소 시간이 걸릴 수 있습니다.
              </p>
            </div>
          ) : currentTranslation ? (
            <div className="p-6 space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <FileCheck className="h-5 w-5 mr-2 text-green-500" />
                  번역 완료
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">원본 문서</p>
                    <p className="text-sm text-muted-foreground">{currentTranslation.document_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">언어</p>
                    <p className="text-sm text-muted-foreground">
                      {currentTranslation.source_language} → {currentTranslation.target_language}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Button onClick={() => dispatch(resetTranslation())} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    새 문서 번역
                  </Button>
                  <Button onClick={() => handleDocumentDownload(currentTranslation.translated_file_url)} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    번역 문서 다운로드
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "text-center py-12 border-2 border-dashed rounded-lg transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20",
                !userId || !canTranslate ? "opacity-60" : ""
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="document-upload"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleDocumentUpload}
                ref={fileInputRef}
              />
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {isDragging ? "파일을 여기에 놓으세요" : "번역할 문서를 업로드하세요"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                지원 형식: PDF, DOCX, TXT
              </p>
              <div className="space-y-4">
                <Button onClick={() => fileInputRef.current?.click()} disabled={!userId || !canTranslate}>
                  문서 업로드
                </Button>
                {!userId ? (
                  <p className="text-xs text-amber-600 mt-4">
                    문서 번역을 위해 로그인이 필요합니다.
                  </p>
                ) : userPlan === "Explorer" ? (
                  <p className="text-xs text-amber-600 mt-4">
                    Explorer 플랜에서는 문서 번역을 사용할 수 없습니다. 업그레이드하세요.
                  </p>
                ) : userPlan === "Starter" ? (
                  <p className="text-xs text-amber-600 mt-4">
                    {translationsLeft > 0
                      ? `무료 티어는 하루 2번, 최대 1MB 문서로 제한됩니다. 오늘 남은 횟수: ${translationsLeft}`
                      : "오늘 문서 번역 횟수를 모두 사용했습니다. 내일 다시 시도하세요."}
                  </p>
                ) : userPlan === "Creator" ? (
                  <p className="text-xs text-amber-600 mt-4">
                    Creator 플랜은 최대 5MB 문서까지 지원합니다.
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 mt-4">
                    Master 플랜은 최대 20MB 문서까지 지원합니다.
                  </p>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
