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

// Define language list
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

// Function to remove unnecessary text from translation result
const cleanTranslationResult = (text: string): string => {
  const prefixPattern = /^(?:The language of the input text is [^.]+\.\s*)?(?:The translation (?:from [^ ]+ )?to [^ ]+ is:?\s*)?/i
  const cleanedText = text.replace(prefixPattern, '')
  return cleanedText.replace(/^["']|["']$/g, '').trim()
}

// Language name mapping
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

// Language list excluding selected language
const getFilteredLanguages = (languageList: Array<{code: string, name: string}>, excludeCode: string) => {
  // excludeCode is 'detect', so no filtering
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

  // Text copy hook usage
  const {
    sourceTextCopied,
    translatedTextCopied,
    handleCopyText,
    handleCopyTranslation
  } = useTextCopy()

  // Language detection hook usage
  const {
    detectedLanguageCode,
    detectedLanguageName,
    isDetecting,
    error: detectError,
    detectLanguage,
  } = useDetectLanguage(sourceText, true, sourceLanguage)

  // Actual source language code decision for internal logic
  const effectiveSourceLanguageCode = sourceLanguage === 'detect' && detectedLanguageCode ? detectedLanguageCode : sourceLanguage;

  // Same language prevention hook usage
  const { preventSameLanguage } = useSameLanguagePrevention(
    sourceLanguage,
    targetLanguage,
    detectedLanguageCode,
    isDetecting,
    languages,
    setTargetLanguage
  )

  // Translation save hook usage
  const {
    isSaving,
    isSaved,
    saveTranslation,
    resetSaveState
  } = useTranslationSave(userId)

  // Document translation hook usage
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

  // If detected language error exists, set global error
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

  // Calculate maximum input length
  const getMaxInputLength = () => {
    if (!profile) return 500
    if (userId === "5027a0bf-89e2-4ce2-9289-336986950758") return 1000000 // Test ID
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

  // Adjust textarea height on initial load
  useEffect(() => {
    if (sourceTextareaRef.current && sourceText) {
      sourceTextareaRef.current.style.height = "auto"
      sourceTextareaRef.current.style.height = `${sourceTextareaRef.current.scrollHeight}px`
    }
  }, [])

  // Auto-translate (with debounce)
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (sourceText && sourceLanguage !== targetLanguage) {
        translateText()
      }
    }, 500)
    return () => clearTimeout(debounceTimeout)
  }, [sourceText, sourceLanguage, targetLanguage])

  // Text input processing
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
    
    // Reset save state when new text is entered
    resetSaveState()
  }

  // Language swap
  const handleSwapLanguages = () => {
    // Get current effective source language code
    const currentEffectiveSource = effectiveSourceLanguageCode;
    
    // If 'detect' state and not yet detected, swap not possible
    if (currentEffectiveSource === 'detect') {
        toast({
          title: "Cannot swap",
          description: "Please enter text for language detection or select a specific source language.",
          variant: "destructive"
        })
        return;
    }

    const currentTarget = targetLanguage;
    
    // New source language is current target language
    setSourceLanguage(currentTarget); 
    
    // New target language is current effective source language
    setTargetLanguage(currentEffectiveSource); 
    
    // Text swap logic modification
    if (sourceText && translatedText) {
      // If both values exist, move output to input and input is emptied
      setSourceText(translatedText);
      setTranslatedText("");
      setCharacterCount(translatedText.length);
    } else {
      // Original logic: value swap
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
    
    // Reset save state when text is cleared
    resetSaveState()
  }

  // Translation save wrapper function
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

  // Target language change
  const handleTargetLanguageChange = (code: string) => {
    setTargetLanguage(code)
    
    // If 'detect' mode, use detected language, otherwise use selected source language
    const effectiveSourceCode = sourceLanguage === "detect" && detectedLanguageCode
      ? detectedLanguageCode
      : sourceLanguage

    // Prevent the target language from being the same as the source language.
    if (effectiveSourceCode !== code) {
      // If languages are different, start translating.
      if (sourceText.trim()) {
        setIsLoadingTranslation(true)
        //setTranslatedText("") // To clarify that translation is in progress (optional)
        if (translationTimeoutRef.current) {
          clearTimeout(translationTimeoutRef.current)
        }
        translationTimeoutRef.current = setTimeout(() => {
          translateText()
        }, 300)
      }
    } else {
      // If languages are the same, error handling or UI feedback provided
      console.warn("Target language cannot be the same as the source language.");
      // If needed, toast message display
      // toast({ title: "Same Language", description: "Source and target languages cannot be the same.", variant: "warning" });
    }
  }

  // Translation API call
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
        // Use already detected language if available, or detect
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
      resetSaveState() // Reset save state when new translation result appears
      if (data.usageStats) {
        setUsageStats(data.usageStats)
      }
      setIsLoadingTranslation(false)
      if (sourceLanguage === "detect" && detectedLanguageInfo?.code === targetLanguage) {
        setError("Input language and output language are the same. Please select a different output language.")
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError")) {
        console.error("Translation error:", err)
        setError("An error occurred during translation. Please try again.")
      }
      setIsLoadingTranslation(false)
    } finally {
      setIsTranslating(false)
    }
  }

  // Dropdown outside click to close
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

  // Auto-adjust textarea height (wrap with useCallback)
  const adjustTextareaHeight = useCallback(() => {
    if (sourceTextareaRef.current && targetTextareaRef.current) {
      // Reset height
      sourceTextareaRef.current.style.height = "auto"
      targetTextareaRef.current.style.height = "auto"
      
      // Calculate actual scroll height
      const sourceScrollHeight = sourceTextareaRef.current.scrollHeight
      const targetScrollHeight = targetTextareaRef.current.scrollHeight
      const minHeight = 300 // Minimum height setting
      
      // Calculate required height for each textarea (considering minimum height)
      const sourceHeight = Math.max(sourceScrollHeight, minHeight)
      const targetHeight = Math.max(targetScrollHeight, minHeight)
      
      // Synchronize with the larger height between the two textareas
      const maxHeight = Math.max(sourceHeight, targetHeight)
      
      sourceTextareaRef.current.style.height = `${maxHeight}px`
      targetTextareaRef.current.style.height = `${maxHeight}px`
    }
  }, []); // Empty dependency array (refs don't change)

  // Auto-adjust textarea height and synchronization (text change)
  useEffect(() => {
    adjustTextareaHeight();
  }, [sourceText, translatedText, adjustTextareaHeight]); // adjustTextareaHeight added

  // Adjust height on window resize
  useEffect(() => {
    window.addEventListener("resize", adjustTextareaHeight);
    return () => window.removeEventListener("resize", adjustTextareaHeight);
  }, [adjustTextareaHeight]); // adjustTextareaHeight added

  // Adjust height on tab change
  useEffect(() => {
    if (activeTab === 'text') {
      // Adjust height after slight delay when text tab is activated
      // (due to tab switching animation, etc., immediate calculation may not be accurate)
      const timeoutId = setTimeout(() => {
        adjustTextareaHeight();
      }, 0); // Asynchronous execution to calculate height after rendering
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, adjustTextareaHeight]); // activeTab, adjustTextareaHeight added

  // Debug: Check language detection status
  useEffect(() => {
    console.log("Detection status change:", {
      detectedLanguageCode,
      detectedLanguageName,
      isDetecting,
    })
  }, [detectedLanguageCode, detectedLanguageName, isDetecting])

  // Get user information
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

  // Update document translation limit information
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserPlanAndLimits(userId))
    }
  }, [userId, dispatch])

  // Update target language when preferred language is loaded
  useEffect(() => {
    if (preferredLanguage && !isLoadingPreferredLanguage) {
      console.log("Preferred language update:", preferredLanguage);
      setTargetLanguage(preferredLanguage);
    }
  }, [preferredLanguage, isLoadingPreferredLanguage]);

  // Debug: Detect target language changes
  useEffect(() => {
    console.log("Current target language:", targetLanguage);
    console.log("Target language name:", languages.find(l => l.code === targetLanguage)?.name || "Not found");
  }, [targetLanguage]);


  return (
    <div className="w-full max-w-7xl mx-auto bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border dark:border-gray-800">
      <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-2 dark:bg-gray-800">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <span>Text</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span>Image</span>
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Document</span>
          </TabsTrigger>
        </TabsList>

        {/* Text Translation Tab */}
        <TabsContent value="text" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Source Text Area */}
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
                            Detected: <span className="font-medium text-green-600 ml-1 dark:text-[#9ddbe6]">{detectedLanguageName}</span>
                          </span>
                        ) : (
                          "Detect Language"
                        )}
                        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showSourceLanguageDropdown ? "rotate-180" : ""}`} />
                      </>
                    ) : (
                      <>
                        {languages.find((l) => l.code === sourceLanguage)?.name || "Source Language"}
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
                        Detect Language
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
                  placeholder="Enter text to translate"
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

            {/* Translated Text Area */}
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
                    {languages.find((l) => l.code === targetLanguage)?.name || "Target Language"}
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
                    placeholder={isTranslating ? "Translating..." : "Translation results will appear here"}
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
                      title={!userId ? "Login required" : "Save translation history"}
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
              Daily translation usage: {usageStats.used}/{usageStats.limit} (Remaining: {usageStats.remaining})
            </div>
          )}

          {languageMismatch && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-3 my-2 rounded-md text-sm flex justify-between items-center">
              <div>
                The input text was detected as {languageMismatch.detected}, not {languageMismatch.current}.
              </div>
              <button
                className="text-sm bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded"
                onClick={() => {
                  setSourceLanguage(languageMismatch.detectedCode)
                  setLanguageMismatch(null)
                  if (sourceText) translateText()
                }}
              >
                Change to {languageMismatch.detected}
              </button>
            </div>
          )}
        </TabsContent>

        {/* Image Tab */}
        <TabsContent value="image" className="mt-0">
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Upload an image to translate
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Supported formats: JPG, PNG, GIF
            </p>
            <Button>Upload Image</Button>
            {!isPremium && (
              <p className="text-xs text-amber-600 mt-4">
                Upgrade to Pro to use advanced OCR translation features
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
                {uploadStep === "uploading" && "Uploading document..."}
                {uploadStep === "extracting" && "Extracting text..."}
                {uploadStep === "translating" && "Translating..."}
                {uploadStep === "generating" && "Generating translated document..."}
              </h3>
              <p className="text-sm text-gray-500">
                This may take some time depending on the file size.
              </p>
            </div>
          ) : currentTranslation ? (
            <div className="p-6 space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <FileCheck className="h-5 w-5 mr-2 text-green-500" />
                  Translation Complete
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Original Document</p>
                    <p className="text-sm text-muted-foreground">{currentTranslation.document_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Languages</p>
                    <p className="text-sm text-muted-foreground">
                      {currentTranslation.source_language} → {currentTranslation.target_language}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Button onClick={resetDocumentTranslation} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Translate New Document
                  </Button>
                  <Button onClick={() => handleDocumentDownload(currentTranslation.translated_file_url)} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Translated Document
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
                {isDragging ? "Drop file here" : "Upload a document to translate"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Supported formats: PDF, DOCX, TXT
              </p>
              <div className="space-y-4">
                <Button onClick={() => fileInputRef.current?.click()} disabled={!userId || !canTranslate}>
                  Upload Document
                </Button>
                {!userId ? (
                  <p className="text-xs text-amber-600 mt-4">
                    Login required for document translation.
                  </p>
                ) : userPlan === "Explorer" ? (
                  <p className="text-xs text-amber-600 mt-4">
                    Document translation is not available on the Explorer plan. Please upgrade.
                  </p>
                ) : userPlan === "Starter" ? (
                  <p className="text-xs text-amber-600 mt-4">
                    {translationsLeft > 0
                      ? `The free tier is limited to 2 documents per day, max 1MB each. Remaining today: ${translationsLeft}`
                      : "You've used all document translations for today. Try again tomorrow."}
                  </p>
                ) : userPlan === "Creator" ? (
                  <p className="text-xs text-amber-600 mt-4">
                    Creator plan supports documents up to 5MB.
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 mt-4">
                    Master plan supports documents up to 20MB.
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
