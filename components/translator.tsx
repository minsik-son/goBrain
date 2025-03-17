"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUser } from "@/lib/contexts/user-context"
import { Languages, Image, FileText, RotateCcw, X, Volume2, Star, Share2, ChevronDown, CheckCircle2, Copy } from "lucide-react"
import { extractDetectedLanguage } from "@/components/detectLanguageAPI"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const prefixPattern = /^(?:The language of the input text is [^.]+\.\s*)?(?:The translation (?:from [^ ]+ )?to [^ ]+ is:?\s*)?/i;
  const cleanedText = text.replace(prefixPattern, '');
  return cleanedText.replace(/^["']|["']$/g, '').trim();
};

// 간단한 클라이언트 측 언어 감지 함수
const simpleDetectLanguage = (text: string) => {
  const patterns = {
    'en': /^[a-zA-Z\s.,!?'"-]+$/,
    'ko': /[\uAC00-\uD7AF]/,
    'ja': /[\u3040-\u309F\u30A0-\u30FF]/,
    'zh': /[\u4E00-\u9FFF]/,
    'es': /[áéíóúüñ¿¡]/i,
    'fr': /[àâäæçéèêëîïôœùûüÿ]/i,
    'de': /[äöüß]/i,
    'ru': /[а-яА-ЯёЁ]/
  };
  
  for (const [code, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      const langNames = {
        'en': 'English',
        'ko': 'Korean',
        'ja': 'Japanese',
        'zh': 'Chinese',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'ru': 'Russian'
      };
      return { code, name: langNames[code] };
    }
  }
  
  return { code: 'en', name: 'English' }; // 기본값
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

  const sourceTextareaRef = useRef<HTMLTextAreaElement>(null)
  const targetTextareaRef = useRef<HTMLTextAreaElement>(null)
  const currentInputRef = useRef<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const isTranslatingRef = useRef<boolean>(false)

  const { user } = useAuth()
  const { profile } = useUser()
  const isPremium = profile?.plan === "premium" || profile?.plan === "business"

  const getMaxInputLength = () => {
    if (!profile) return 10000
    switch(profile.plan) {
      case 'premium': return 3000
      case 'business': return 5000
      default: return 10000
    }
  }

  const maxInputLength = getMaxInputLength()

  const handleSourceTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (text.length > maxInputLength) return
    setSourceText(text)
    setCharacterCount(text.length)
    if (text === "") {
      setTranslatedText("")
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }

  // 언어 감지 과정 제어를 위한 상태 추가
  const [isDetecting, setIsDetecting] = useState(false);

  // 언어 감지 함수 - 클라이언트 측 감지와 서버 API 모두 사용
  const detectLanguage = async (text: string) => {
    setIsDetecting(true);
    
    // 1. 클라이언트 측 감지 먼저 시도 (즉시 결과 제공)
    const clientDetected = simpleDetectLanguage(text);
    setDetectedLanguageCode(clientDetected.code);
    setDetectedLanguageName(clientDetected.name);
    
    try {
      // 2. 더 정확한 서버 API 결과를 기다림 (백그라운드에서)
      const response = await fetch('/api/detect-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // 서버 API 결과로 업데이트 (더 정확함)
        if (data.detectedLanguage && data.detectedLanguage.code) {
          console.log("감지된 언어 코드:", data.detectedLanguage.code);
          console.log("감지된 언어 이름:", data.detectedLanguage.name);
          setDetectedLanguageCode(data.detectedLanguage.code);
          setDetectedLanguageName(data.detectedLanguage.name);
        }
      }
    } catch (error) {
      console.error("서버 API 오류, 클라이언트 결과 유지:", error);
    } finally {
      setIsDetecting(false);
    }
    
    return clientDetected; // 클라이언트 측 결과 즉시 반환
  };

  // 언어 감지 결과를 처리하는 코드 개선
  useEffect(() => {
    // 감지된 언어 코드가 있고, 현재 소스 언어가 "detect"인 경우
    if (detectedLanguageCode && sourceLanguage === "detect" && !isDetecting) {
      // 감지된 언어와 타겟 언어가 같은지 확인하고 필요시 타겟 언어 변경
      preventSameLanguage("detect", targetLanguage, detectedLanguageCode);
    }
  }, [detectedLanguageCode, sourceLanguage, targetLanguage, isDetecting]);

  // 실시간 언어 감지 함수 개선
  useEffect(() => {
    // 이미 감지된 언어가 있거나 텍스트가 너무 짧으면 실행 안함
    if (sourceLanguage !== "detect" || sourceText.trim().length < 4) {
      return;
    }
    
    // 감지 중 상태로 설정 - 이 상태인 동안은 preventSameLanguage가 작동하지 않음
    setIsDetecting(true);
    
    const debounceTimeout = setTimeout(async () => {
      // 이미 번역 중이면 언어 감지 스킵
      if (isTranslatingRef.current) return;
      
      try {
        const response = await fetch('/api/detect-language', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: sourceText }),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.detectedLanguage && data.detectedLanguage.code) {
            setDetectedLanguageCode(data.detectedLanguage.code);
            setDetectedLanguageName(data.detectedLanguage.name);
            console.log(`실시간 언어 감지: ${data.detectedLanguage.name}`);
            // 감지가 완료된 후 감지 상태 해제
            setTimeout(() => setIsDetecting(false), 100);
          }
        } else {
          console.log("API 오류, 클라이언트 측 감지 사용");
          const detected = simpleDetectLanguage(sourceText);
          setDetectedLanguageCode(detected.code);
          setDetectedLanguageName(detected.name);
          // 감지가 완료된 후 감지 상태 해제
          setTimeout(() => setIsDetecting(false), 100);
        }
      } catch (error) {
        console.error("언어 감지 API 오류:", error);
        // 백업 방법 사용
        const detected = simpleDetectLanguage(sourceText);
        setDetectedLanguageCode(detected.code);
        setDetectedLanguageName(detected.name);
        // 감지가 완료된 후 감지 상태 해제
        setTimeout(() => setIsDetecting(false), 100);
      }
    }, 800); // 텍스트 입력이 멈춘 후 800ms 기다림
    
    return () => clearTimeout(debounceTimeout);
  }, [sourceText, sourceLanguage]);

  // Debounce를 통한 자동 번역
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (sourceText && sourceLanguage !== targetLanguage) {
        translateText()
      }
    }, 500)
    return () => clearTimeout(debounceTimeout)
  }, [sourceText, sourceLanguage, targetLanguage])

  // 언어 스왑 핸들러 (감지 모드에서는 동작하지 않음)
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

  const handleSaveTranslation = () => {
    console.log("Save translation:", { sourceText, translatedText, sourceLanguage, targetLanguage })
  }

  // 같은 언어 선택 방지를 위한 함수 개선
  const preventSameLanguage = (
    sourceCode: string,
    targetCode: string,
    detectedCode: string | null = null
  ) => {
    // 감지 중일 때는 함수 실행 안함
    if (isDetecting) return false;
    
    // 실제 소스 코드 결정 (감지된 언어가 있으면 그것을 사용)
    const effectiveSourceCode = sourceCode === "detect" && detectedCode ? detectedCode : sourceCode;
    
    // 소스와 타겟이 같은 언어이면 타겟 언어를 변경
    if (effectiveSourceCode === targetCode) {
      // 타겟 언어 변경 로직
      const alternativeLanguage = languages.find(
        (lang) => lang.code !== effectiveSourceCode && lang.code !== "detect"
      );
      
      if (alternativeLanguage) {
        setTargetLanguage(alternativeLanguage.code);
        return true;
      }
    }
    return false;
  };

  // 언어 감지 결과를 처리하는 코드 개선
  useEffect(() => {
    // 감지된 언어 코드가 있고, 현재 소스 언어가 "detect"인 경우
    if (detectedLanguageCode && sourceLanguage === "detect") {
      // 감지된 언어와 타겟 언어가 같은지 확인하고 필요시 타겟 언어 변경
      preventSameLanguage("detect", targetLanguage, detectedLanguageCode);
    }
  }, [detectedLanguageCode, sourceLanguage, targetLanguage]);

  // 소스 언어 변경 시 이벤트 핸들러 개선
  const handleSourceLanguageChange = (code: string) => {
    setSourceLanguage(code);
    
    // 'detect' 모드가 아닌 경우 또는 'detect' 모드지만 이미 감지된 언어가 있는 경우
    if (code !== "detect" || (code === "detect" && detectedLanguageCode)) {
      const effectiveCode = code === "detect" ? detectedLanguageCode : code;
      preventSameLanguage(effectiveCode, targetLanguage);
    }
  };

  // 타겟 언어 변경 시 이벤트 핸들러 개선
  const handleTargetLanguageChange = (code: string) => {
    setTargetLanguage(code);
    
    // 'detect' 모드인 경우 감지된 언어를 사용, 아니면 선택된 소스 언어 사용
    const effectiveSourceCode = sourceLanguage === "detect" && detectedLanguageCode
      ? detectedLanguageCode
      : sourceLanguage;
      
    preventSameLanguage(effectiveSourceCode, code);
  };

  // 번역 함수 수정
  const translateText = async () => {
    if (!sourceText.trim()) {
      setTranslatedText("");
      return;
    }
    
    setIsTranslating(true);
    setError(null);
    isTranslatingRef.current = true;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    currentInputRef.current = sourceText;
    
    try {
      // 먼저 detectedLanguageInfo 변수 선언 및 초기화
      let detectedLanguageInfo = null;
      
      // 언어 감지 처리
      if (sourceLanguage === "detect") {
        // 감지 중 상태로 설정
        setIsDetecting(true);
        
        try {
          const response = await fetch('/api/detect-language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: sourceText }),
            signal: abortControllerRef.current.signal
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.detectedLanguage && data.detectedLanguage.code) {
              detectedLanguageInfo = data.detectedLanguage;
              setDetectedLanguageCode(data.detectedLanguage.code);
              setDetectedLanguageName(data.detectedLanguage.name);
            }
          } else {
            // API 오류 시 클라이언트 측 감지 사용
            const detected = simpleDetectLanguage(sourceText);
            detectedLanguageInfo = {
              code: detected.code,
              name: detected.name,
              confidence: 0.8
            };
            setDetectedLanguageCode(detected.code);
            setDetectedLanguageName(detected.name);
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error("언어 감지 오류:", error);
            // 오류 시 클라이언트 측 감지 사용
            const detected = simpleDetectLanguage(sourceText);
            detectedLanguageInfo = {
              code: detected.code,
              name: detected.name,
              confidence: 0.8
            };
            setDetectedLanguageCode(detected.code);
            setDetectedLanguageName(detected.name);
          } else {
            throw error; // AbortError는 상위로 전파
          }
        }
      }
      
      // 언어 이름 가져오기
      let inputLanguageName = sourceLanguage === "detect" 
        ? "Detect Language" 
        : languages.find(l => l.code === sourceLanguage)?.name || "English";
      
      const outputLanguageName = languages.find(l => l.code === targetLanguage)?.name || "English";

      // 번역 API 호출
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputText: sourceText,
          inputLanguage: inputLanguageName,
          outputLanguage: outputLanguageName,
          detectedLanguageInfo // 감지된 언어 정보 전달
        }),
        signal: abortControllerRef.current.signal
      });
      
      const data = await response.json();
      
      // 번역 결과 정제
      const cleanedTranslation = cleanTranslationResult(data.text);
      setTranslatedText(cleanedTranslation);
      
      // 감지 상태 해제 및 같은 언어 체크
      setIsDetecting(false);
      
      // 감지된 언어가 있고 타겟 언어와 같은 경우 처리
      if (sourceLanguage === "detect" && detectedLanguageInfo?.code === targetLanguage) {
        setError("입력 언어와 출력 언어가 같습니다. 다른 출력 언어를 선택하세요.");
      }
      
      // 사용 통계 업데이트
      if (data.usageStats) {
        setUsageStats(data.usageStats);
      }
    } catch (err) {
      setIsDetecting(false);
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("번역 오류:", err);
        setError("번역 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsTranslating(false);
      isTranslatingRef.current = false;
    }
  };
  
  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (showSourceLanguageDropdown || showTargetLanguageDropdown) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.dropdown-content') && !target.closest('.dropdown-trigger')) {
          setShowSourceLanguageDropdown(false);
          setShowTargetLanguageDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSourceLanguageDropdown, showTargetLanguageDropdown]);

  // textarea 높이 자동 조정 및 동기화
  useEffect(() => {
    const adjustTextareaHeight = () => {
      if (sourceTextareaRef.current && targetTextareaRef.current) {
        sourceTextareaRef.current.style.height = 'auto';
        targetTextareaRef.current.style.height = 'auto';
        const sourceScrollHeight = sourceTextareaRef.current.scrollHeight;
        const targetScrollHeight = targetTextareaRef.current.scrollHeight;
        const minHeight = 300;
        const sourceHeight = Math.max(sourceScrollHeight, minHeight);
        const targetHeight = Math.max(targetScrollHeight, minHeight);
        const maxHeight = Math.max(sourceHeight, targetHeight);
        sourceTextareaRef.current.style.height = `${maxHeight}px`;
        targetTextareaRef.current.style.height = `${maxHeight}px`;
      }
    };
    adjustTextareaHeight();
    window.addEventListener('resize', adjustTextareaHeight);
    return () => window.removeEventListener('resize', adjustTextareaHeight);
  }, [sourceText, translatedText]);

  // 언어 감지 상태를 감시하는 디버깅 로직 추가
  useEffect(() => {
    console.log("감지 상태 변경:", {
      detectedLanguageCode,
      detectedLanguageName,
      isDetecting
    });
  }, [detectedLanguageCode, detectedLanguageName, isDetecting]);

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
            {/* Source Text */}
            <div className="border-r relative">
              <div className="p-3 border-b flex justify-between items-center h-14 relative">
                <div className="relative">
                  <button
                    type="button"
                    className="dropdown-trigger flex items-center gap-1 text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSourceLanguageDropdown(!showSourceLanguageDropdown);
                      setShowTargetLanguageDropdown(false);
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
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
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
                        e.stopPropagation();
                        setSourceLanguage("detect");
                        setShowSourceLanguageDropdown(false);
                      }}
                    >
                      <span className="flex items-center">
                        {sourceLanguage === "detect" && <span className="text-green-500 mr-2">✓</span>}
                        언어 감지
                      </span>
                    </button>
                    {languages
                      .filter(lang => lang.code !== "detect")
                      .map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          className={`text-left p-3 text-sm rounded-md ${
                            sourceLanguage === lang.code 
                              ? "bg-green-50 border border-green-200 text-green-700" 
                              : "border border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSourceLanguageChange(lang.code);
                            setShowSourceLanguageDropdown(false);
                            if (sourceText) translateText();
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
                  className="w-full p-4 pb-16 min-h-[300px] resize-none border-0 focus:ring-0 focus:outline-none"
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
                      <button 
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => handleCopyText(sourceText, true)}
                      >
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

            {/* Translated Text */}
            <div className="relative">
              <div className="p-3 border-b flex justify-between items-center h-14 relative">
                <div className="relative">
                  <button
                    type="button"
                    className="dropdown-trigger flex items-center gap-1 text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTargetLanguageDropdown(!showTargetLanguageDropdown);
                      setShowSourceLanguageDropdown(false);
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
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-3 p-4 gap-2">
                    {languages
                      .filter(lang => lang.code !== "detect")
                      .map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          className={`text-left p-3 text-sm rounded-md ${
                            targetLanguage === lang.code 
                              ? "bg-green-50 border border-green-200 text-green-700" 
                              : "border border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTargetLanguageChange(lang.code);
                            setShowTargetLanguageDropdown(false);
                            if (sourceText) translateText();
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
                <textarea
                  ref={targetTextareaRef}
                  readOnly
                  placeholder={isTranslating ? "번역 중..." : "번역 결과가 여기에 표시됩니다"}
                  className="w-full p-4 pb-16 min-h-[300px] resize-none border-0 focus:ring-0 focus:outline-none bg-white"
                  value={translatedText}
                />
                {translatedText && (
                  <div className="absolute bottom-3 right-3 flex gap-3">
                    <button className="text-gray-500 hover:text-gray-700">
                      <Volume2 className="h-5 w-5" />
                    </button>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => handleCopyText(translatedText, false)}
                    >
                      {translatedTextCopied ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={handleSaveTranslation}
                    >
                      <Star className="h-5 w-5" />
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
                  setSourceLanguage(languageMismatch.detectedCode);
                  setLanguageMismatch(null);
                  if (sourceText) translateText();
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
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              번역할 문서를 업로드하세요
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              지원 형식: PDF, DOCX, TXT
            </p>
            <Button>문서 업로드</Button>
            {!isPremium && (
              <p className="text-xs text-amber-600 mt-4">
                무료 티어는 1MB 문서로 제한됩니다. 더 큰 파일은 업그레이드하세요.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
