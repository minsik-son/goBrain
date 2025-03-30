"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
import { LoadingDots } from "./LoadingDots"
import { usePreferredLanguage } from "./hooks/usePreferredLanguage"
import { useDetectLanguage } from "./hooks/useDetectLanguage"
import { useSameLanguagePrevention } from "./hooks/useSameLanguagePrevention"
import { useTextCopy } from "./hooks/useTextCopy"
import { useTranslationSave } from "./hooks/useTranslationSave"
import { useDocumentTranslation } from "./hooks/useDocumentTranslation"

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

// 언어 목록에서 선택된 언어를 제외한 목록 반환
const getFilteredLanguages = (languageList: Array<{code: string, name: string}>, excludeCode: string) => {
  // excludeCode가 'detect'인 경우는 필터링하지 않음 (모든 언어 표시)
  if (excludeCode === 'detect') {
    return languageList.filter((lang) => lang.code !== 'detect');
  }
  return languageList.filter((lang) => lang.code !== excludeCode && lang.code !== 'detect');
};

export function Translator() {
  const [activeTab, setActiveTab] = useState("text")
  const [sourceLanguage, setSourceLanguage] = useState("detect")
  const { preferredLanguage, isLoading: isLoadingPreferredLanguage } = usePreferredLanguage()
  const [targetLanguage, setTargetLanguage] = useState<string>(preferredLanguage)
  const [showSourceLanguageDropdown, setShowSourceLanguageDropdown] = useState(false)
  const [showTargetLanguageDropdown, setShowTargetLanguageDropdown] = useState(false)
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [characterCount, setCharacterCount] = useState(0)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false)
  const [usageStats, setUsageStats] = useState<{
    limit: number
    used: number
    remaining: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [languageMismatch, setLanguageMismatch] = useState<{
    detected: string
    detectedCode: string
    current: string
  } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // 텍스트 복사 훅 사용
  const {
    sourceTextCopied,
    translatedTextCopied,
    handleCopyText,
    handleCopyTranslation
  } = useTextCopy()

  // 언어 감지 훅 사용
  const {
    detectedLanguageCode,
    detectedLanguageName,
    isDetecting,
    error: detectError,
    detectLanguage,
  } = useDetectLanguage(sourceText, true, sourceLanguage)

  // 내부 로직에서 사용할 실제 소스 언어 코드 결정
  const effectiveSourceLanguageCode = sourceLanguage === 'detect' && detectedLanguageCode ? detectedLanguageCode : sourceLanguage;

  // 언어 중복 방지 훅 사용
  const { preventSameLanguage } = useSameLanguagePrevention(
    sourceLanguage,
    targetLanguage,
    detectedLanguageCode,
    isDetecting,
    languages,
    setTargetLanguage
  )

  // 번역 저장 훅 사용
  const {
    isSaving,
    isSaved,
    saveTranslation,
    resetSaveState
  } = useTranslationSave(userId)

  // 문서 번역 훅 사용
  const {
    isDragging,
    isUploading,
    uploadStep,
    currentTranslation,
    userPlan,
    translationsLeft,
    canTranslate,
    documentError,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
    handleDocumentDownload,
    resetDocumentTranslation
  } = useDocumentTranslation(userId, effectiveSourceLanguageCode, targetLanguage)

  // 감지된 언어 오류가 있으면 전역 오류에 설정
  useEffect(() => {
    if (detectError) {
      setError(detectError);
    }
  }, [detectError])

  const sourceTextareaRef = useRef<HTMLTextAreaElement>(null)
  const targetTextareaRef = useRef<HTMLTextAreaElement>(null)
  const currentInputRef = useRef<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const isTranslatingRef = useRef<boolean>(false)
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { user } = useAuth()
  const { profile } = useUser()
  const isPremium = profile?.plan === "premium" || profile?.plan === "business"
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const dispatch = useAppDispatch()

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

  // 자동 번역 (디바운스 처리)
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (sourceText && sourceLanguage !== targetLanguage) {
        translateText()
      }
    }, 500)
    return () => clearTimeout(debounceTimeout)
  }, [sourceText, sourceLanguage, targetLanguage])

  // 텍스트 입력 처리
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
    
    // 새 텍스트가 입력되면 저장 상태 초기화
    resetSaveState()
  }

  // 언어 스왑
  const handleSwapLanguages = () => {
    // 현재 유효한 소스 언어 코드를 가져옴
    const currentEffectiveSource = effectiveSourceLanguageCode;
    
    // 'detect' 상태이고 아직 감지되지 않았다면 스왑 불가
    if (currentEffectiveSource === 'detect') {
        toast({
          title: "Cannot swap",
          description: "Please enter text for language detection or select a specific source language.",
          variant: "destructive"
        })
        return;
    }

    const currentTarget = targetLanguage;
    
    // 새 소스 언어는 현재 타겟 언어가 됨
    setSourceLanguage(currentTarget); 
    
    // 새 타겟 언어는 현재 유효한 소스 언어가 됨
    setTargetLanguage(currentEffectiveSource); 
    
    // 텍스트 스왑 로직 수정
    if (sourceText && translatedText) {
      // 둘 다 값이 있으면, output을 input으로 옮기고 input은 비움
      setSourceText(translatedText);
      setTranslatedText("");
      setCharacterCount(translatedText.length);
    } else {
      // 기존 로직: 값 스왑
      const tempText = sourceText;
      setSourceText(translatedText);
      setTranslatedText(tempText);
      setCharacterCount(translatedText.length);
    }
    
    resetSaveState();
  }

  const handleClearText = () => {
    setSourceText("")
    setTranslatedText("")
    setCharacterCount(0)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    // 텍스트 클리어 시 저장 상태 초기화
    resetSaveState()
  }

  // 번역 저장 래퍼 함수
  const handleSaveTranslation = () => {
    saveTranslation(
      sourceText,
      translatedText,
      sourceLanguage,
      targetLanguage,
      detectedLanguageName,
      languages
    )
  }

  // 타겟 언어 변경
  const handleTargetLanguageChange = (code: string) => {
    setTargetLanguage(code)
    
    // 'detect' 모드인 경우 감지된 언어를 사용, 아니면 선택된 소스 언어 사용
    const effectiveSourceCode = sourceLanguage === "detect" && detectedLanguageCode
      ? detectedLanguageCode
      : sourceLanguage

    // Prevent the target language from being the same as the source language.
    if (effectiveSourceCode !== code) {
      // If the languages are different, start translating.
      if (sourceText.trim()) {
        setIsLoadingTranslation(true)
        //setTranslatedText("") // 번역 중임을 명확히 하기 위해 이전 결과 지우기 (선택 사항)
        if (translationTimeoutRef.current) {
          clearTimeout(translationTimeoutRef.current)
        }
        translationTimeoutRef.current = setTimeout(() => {
          translateText()
        }, 300)
      }
    } else {
      // 만약 언어가 같다면 에러 처리 또는 UI 피드백 제공
      console.warn("Target language cannot be the same as the source language.");
      // 필요하다면 toast 메시지 표시
      // toast({ title: "Same Language", description: "Source and target languages cannot be the same.", variant: "warning" });
    }
  }

  // 번역 API 호출
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
        // 이미 감지된 언어가 있으면 사용, 없으면 감지
        if (detectedLanguageCode && detectedLanguageName) {
          detectedLanguageInfo = {
            code: detectedLanguageCode,
            name: detectedLanguageName,
            confidence: 0.9
          }
        } else {
          detectedLanguageInfo = await detectLanguage(sourceText)
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
      resetSaveState() // 새 번역 결과가 나오면 저장 상태 초기화
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

  // textarea 높이 자동 조정 함수 (useCallback으로 감싸기)
  const adjustTextareaHeight = useCallback(() => {
    if (sourceTextareaRef.current && targetTextareaRef.current) {
      // 높이 초기화
      sourceTextareaRef.current.style.height = "auto"
      targetTextareaRef.current.style.height = "auto"
      
      // 실제 스크롤 높이 계산
      const sourceScrollHeight = sourceTextareaRef.current.scrollHeight
      const targetScrollHeight = targetTextareaRef.current.scrollHeight
      const minHeight = 300 // 최소 높이 설정
      
      // 각 textarea의 필요한 높이 계산 (최소 높이 고려)
      const sourceHeight = Math.max(sourceScrollHeight, minHeight)
      const targetHeight = Math.max(targetScrollHeight, minHeight)
      
      // 두 textarea 중 더 큰 높이로 동기화
      const maxHeight = Math.max(sourceHeight, targetHeight)
      
      sourceTextareaRef.current.style.height = `${maxHeight}px`
      targetTextareaRef.current.style.height = `${maxHeight}px`
    }
  }, []); // 의존성 배열 비움 (ref는 변경되지 않음)

  // textarea 높이 자동 조정 및 동기화 (텍스트 변경 시)
  useEffect(() => {
    adjustTextareaHeight();
  }, [sourceText, translatedText, adjustTextareaHeight]); // adjustTextareaHeight 추가

  // 창 크기 변경 시 높이 재조정
  useEffect(() => {
    window.addEventListener("resize", adjustTextareaHeight);
    return () => window.removeEventListener("resize", adjustTextareaHeight);
  }, [adjustTextareaHeight]); // adjustTextareaHeight 추가

  // 탭 변경 시 높이 재조정
  useEffect(() => {
    if (activeTab === 'text') {
      // 텍스트 탭이 활성화될 때 약간의 지연 후 높이 재조정
      // (탭 전환 애니메이션 등으로 인해 즉시 계산이 정확하지 않을 수 있음)
      const timeoutId = setTimeout(() => {
        adjustTextareaHeight();
      }, 0); // 비동기적으로 실행하여 렌더링 후 높이 계산
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, adjustTextareaHeight]); // activeTab, adjustTextareaHeight 추가

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

  // 선호 언어가 로드되면 타겟 언어 업데이트
  useEffect(() => {
    if (preferredLanguage && !isLoadingPreferredLanguage) {
      console.log("선호 언어 업데이트:", preferredLanguage);
      setTargetLanguage(preferredLanguage);
    }
  }, [preferredLanguage, isLoadingPreferredLanguage]);

  // 디버깅용: 타겟 언어 변경 감지
  useEffect(() => {
    console.log("현재 타겟 언어:", targetLanguage);
    console.log("타겟 언어 이름:", languages.find(l => l.code === targetLanguage)?.name || "찾을 수 없음");
  }, [targetLanguage]);


  return (
    <div className="w-full max-w-7xl mx-auto bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border dark:border-gray-800">
      <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-2 dark:bg-gray-800">
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

        {/* Text Translation Tab */}
        <TabsContent value="text" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Source Text 영역 */}
            <div className="border-r relative">
              <div className="p-3 border-b dark:border-gray-800 flex justify-between items-center h-14 relative">
                <div className="relative">
                  <button
                    type="button"
                    className="dropdown-trigger flex items-center gap-1 text-sm font-medium dark:text-[#e575f5]"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowSourceLanguageDropdown(!showSourceLanguageDropdown)
                      setShowTargetLanguageDropdown(false)
                    }}
                  >
                    {sourceLanguage === "detect" ? (
                      <>
                        {detectedLanguageName ? (
                          <span className="flex items-center dark:text-[#e575f5]">
                            감지됨: <span className="font-medium text-green-600 ml-1 dark:text-[#9ddbe6]">{detectedLanguageName}</span>
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
                  className="dropdown-content absolute top-[56px] left-0 right-0 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-800 shadow-lg z-50"
                  style={{ maxHeight: "400px", overflowY: "auto" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-3 p-4 gap-2">
                    <button
                      type="button"
                      className={`text-left p-3 text-sm rounded-md ${
                        sourceLanguage === "detect"
                          ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                          : "border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-[#ebc88d]"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSourceLanguage("detect")
                        setShowSourceLanguageDropdown(false)
                      }}
                    >
                      <span className="flex items-center dark:text-[#e575f5]">
                        {sourceLanguage === "detect" && <span className="text-green-500 mr-2 ">✓</span>}
                        언어 감지
                      </span>
                    </button>
                    {getFilteredLanguages(languages.filter((lang) => lang.code !== "detect"), targetLanguage).map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        className={`text-left p-3 text-sm rounded-md ${
                          sourceLanguage === lang.code
                            ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                            : "border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-[#e575f5]"
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
                  className="w-full pr-10 p-4 pb-16 min-h-[300px] resize-none border-0 focus:ring-0 focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-[#ebc88d] dark:placeholder-[#ebc88d]/50"
                  value={sourceText}
                  onChange={handleSourceTextChange}
                  maxLength={maxInputLength}
                />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <div className="text-xs text-gray-500 dark:text-[#ebc88d]/70">
                    {characterCount} / {maxInputLength}
                  </div>
                  {sourceText && (
                    <div className="flex gap-2">
                      <button className="text-gray-500 dark:text-[#d6d6dd] hover:text-gray-700 dark:hover:text-[#d6d6dd]/80">
                        <Volume2 className="h-5 w-5" />
                      </button>
                      <button className="text-gray-500 dark:text-[#d6d6dd] hover:text-gray-700 dark:hover:text-[#d6d6dd]/80" onClick={() => handleCopyText(sourceText, true)}>
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
              <div className="p-3 border-b dark:border-gray-800 flex justify-between items-center h-14 relative">
                <div className="relative">
                  <button
                    type="button"
                    className="dropdown-trigger flex items-center gap-1 text-sm font-medium dark:text-[#e575f5]"
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
                  className="dropdown-content absolute top-[56px] left-0 right-0 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-800 shadow-lg z-50"
                  style={{ maxHeight: "400px", overflowY: "auto" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-3 p-4 gap-2">
                    {getFilteredLanguages(languages.filter(lang => lang.code !== "detect"), effectiveSourceLanguageCode).map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        className={`text-left p-3 text-sm rounded-md ${
                          targetLanguage === lang.code
                            ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                            : "border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-[#e575f5]"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTargetLanguageChange(lang.code)
                          setShowTargetLanguageDropdown(false)
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
                    className="w-full p-4 pb-16 min-h-[300px] resize-none border-0 focus:ring-0 focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-[#ebc88d] dark:placeholder-[#ebc88d]/50"
                    value={translatedText}
                  />
                )}
                {translatedText && (
                  <div className="absolute bottom-3 right-3 flex gap-3">
                    <button className="text-gray-500 dark:text-[#d6d6dd] hover:text-gray-700 dark:hover:text-[#d6d6dd]/80">
                      <Volume2 className="h-5 w-5" />
                    </button>
                    <button className="text-gray-500 dark:text-[#d6d6dd] hover:text-gray-700 dark:hover:text-[#d6d6dd]/80" onClick={() => handleCopyText(translatedText, false)}>
                      {translatedTextCopied ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      className="text-gray-500 dark:text-[#d6d6dd] hover:text-gray-700 dark:hover:text-[#d6d6dd]/80"
                      onClick={handleSaveTranslation}
                      disabled={isSaving || isSaved || !userId}
                      title={!userId ? "로그인이 필요합니다" : "번역 기록 저장"}
                    >
                      <Star className={`h-5 w-5 ${isSaved ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </button>
                    <button className="text-gray-500 dark:text-[#d6d6dd] hover:text-gray-700 dark:hover:text-[#d6d6dd]/80">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-300 p-3 m-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {usageStats && (
            <div className="text-xs text-gray-500 dark:text-[#ebc88d]/70 p-3 border-t dark:border-gray-800">
              일일 번역 사용량: {usageStats.used}/{usageStats.limit} (남은 횟수: {usageStats.remaining})
            </div>
          )}

          {languageMismatch && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-3 my-2 rounded-md text-sm flex justify-between items-center">
              <div>
                입력된 텍스트는 {languageMismatch.current}가 아닌 {languageMismatch.detected}로 감지되었습니다.
              </div>
              <button
                className="text-sm bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded"
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

        {/* Image Tab */}
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

        {/* Document Tab */}
        <TabsContent value="document" className="mt-0">
          <LanguageSelector
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            onSourceLanguageChange={setSourceLanguage}
            onTargetLanguageChange={handleTargetLanguageChange}
            onReloadClick={() => console.log("Reload clicked")}
            activeTab="document"
            enableDetection={false}
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
                  <Button onClick={resetDocumentTranslation} variant="outline" size="sm">
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
