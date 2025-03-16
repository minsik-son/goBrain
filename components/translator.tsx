"use client"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUser } from "@/lib/contexts/user-context"
import { 
  Languages, Image, FileText, RotateCcw, X, Volume2, 
  File, Star, Share2, ChevronDown, CheckCircle2, Copy 
} from "lucide-react"
import { franc } from "franc-min"
import { cn } from "@/lib/utils"

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
]

// 언어 그룹 정의
const languageGroups = [
  { name: "Popular", languages: ["detect", "en", "es", "fr", "de", "zh", "ja", "ko"] },
  { name: "All Languages", languages: languages.map(l => l.code) }
]

// franc에서 사용하는 코드와 UI에서 사용하는 코드 간의 매핑
const codeToLabelMap: Record<string, string> = {
  eng: "en",
  spa: "es",
  fra: "fr",
  deu: "de",
  ita: "it",
  por: "pt",
  rus: "ru",
  jpn: "ja",
  cmn: "zh",
  kor: "ko",
  ara: "ar",
}

export function Translator() {
  // 탭 관련 상태
  const [activeTab, setActiveTab] = useState("text")
  
  // 언어 선택 관련 상태
  const [sourceLanguage, setSourceLanguage] = useState("detect")
  const [targetLanguage, setTargetLanguage] = useState("en")
  const [showSourceLanguageDropdown, setShowSourceLanguageDropdown] = useState(false)
  const [showTargetLanguageDropdown, setShowTargetLanguageDropdown] = useState(false)
  
  // 텍스트 관련 상태
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [characterCount, setCharacterCount] = useState(0)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  
  // 사용량 및 오류 상태
  const [usageStats, setUsageStats] = useState<{
    limit: number
    used: number
    remaining: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // 텍스트 영역 참조
  const sourceTextareaRef = useRef<HTMLTextAreaElement>(null)
  const targetTextareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 번역 요청 관리를 위한 참조
  const currentInputRef = useRef<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const isTranslatingRef = useRef<boolean>(false)
  
  // 사용자 정보 가져오기
  const { user } = useAuth()
  const { profile } = useUser()
  const isPremium = profile?.plan === "premium" || profile?.plan === "business"
  
  // 최대 입력 글자 수 (플랜에 따라 다름)
  const getMaxInputLength = () => {
    if (!profile) return 1000 // 기본값
    switch(profile.plan) {
      case 'premium': return 3000
      case 'business': return 5000
      default: return 1000
    }
  }
  
  const maxInputLength = getMaxInputLength()
  
  // 입력 텍스트 변경 시 처리
  const handleSourceTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (text.length > maxInputLength) return // 최대 길이 제한
    
    setSourceText(text)
    setCharacterCount(text.length)
    
    // 입력값이 비어있으면 출력값도 초기화
    if (text === "") {
      setTranslatedText("")
      
      // 진행 중인 번역 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }
  
  // Debounce를 통한 자동 번역
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (sourceText && sourceLanguage !== targetLanguage) {
        translateText()
      }
    }, 500)
    return () => clearTimeout(debounceTimeout)
  }, [sourceText, sourceLanguage, targetLanguage])
  
  // 언어 스왑 핸들러
  const handleSwapLanguages = () => {
    // 감지 언어일 경우 스왑 안함
    if (sourceLanguage === "detect") return
    
    const temp = sourceLanguage
    setSourceLanguage(targetLanguage)
    setTargetLanguage(temp)
    
    // 텍스트도 스왑
    setSourceText(translatedText)
    setTranslatedText(sourceText)
    setCharacterCount(translatedText.length)
  }
  
  // 텍스트 초기화 핸들러
  const handleClearText = () => {
    setSourceText("")
    setTranslatedText("")
    setCharacterCount(0)
    
    // 진행 중인 번역 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }
  
  // 번역 텍스트 복사 핸들러
  const handleCopyTranslation = async () => {
    if (!translatedText) return
    try {
      await navigator.clipboard.writeText(translatedText)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }
  
  // 번역 저장 핸들러 (미구현)
  const handleSaveTranslation = () => {
    // TODO: 번역 저장 기능 구현
    console.log("Save translation:", { sourceText, translatedText, sourceLanguage, targetLanguage })
  }

  // prevnetSameLanguage 함수 추가
  const prevnetSameLanguage = () => {
    if (sourceLanguage === targetLanguage) {
      // 기본값 설정
      if (sourceLanguage === "en") {
        setTargetLanguage("es");
      } else {
        setTargetLanguage("en");
      }
    }
  };

  // 언어 선택 핸들러 수정
  const handleSourceLanguageChange = (langCode: string) => {
    setSourceLanguage(langCode);
    prevnetSameLanguage(); // 언어 변경 후 호출
  };

  const handleTargetLanguageChange = (langCode: string) => {
    setTargetLanguage(langCode);
    prevnetSameLanguage(); // 언어 변경 후 호출
  };

  // 언어 감지 함수 추가
  const detectLanguage = (text: string) => {
    if (!text.trim()) return;
    
    const detectedCode = franc(text);
    if (detectedCode !== "und" && codeToLabelMap[detectedCode]) {
      const mappedCode = codeToLabelMap[detectedCode];
      console.log(`Detected language: ${mappedCode}`);
      
      // 감지된 언어와 타겟 언어가 같으면 서로 다른 언어 선택
      if (mappedCode === targetLanguage) {
        setTargetLanguage(mappedCode === "en" ? "ko" : "en");
      }
      
      // 감지된 언어로 소스 설정
      if (sourceLanguage === "detect") {
        const detectedLang = languages.find(l => l.code === mappedCode);
        if (detectedLang) {
          console.log(`Setting source language to ${detectedLang.name}`);
        }
      }
    }
  };
  
  // 번역 함수 완전 구현
  const translateText = async () => {
    if (!sourceText.trim()) {
      setTranslatedText("");
      return;
    }

    try {
      // 이전 번역 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // 새로운 AbortController 생성
      abortControllerRef.current = new AbortController();
      
      setIsTranslating(true);
      isTranslatingRef.current = true;
      setError(null);
      
      // 현재 입력값 저장
      currentInputRef.current = sourceText;

      // 언어 감지 기능
      let inputLang = sourceLanguage;
      if (sourceLanguage === "detect") {
        const detectedCode = franc(sourceText);
        if (detectedCode !== "und" && codeToLabelMap[detectedCode]) {
          inputLang = codeToLabelMap[detectedCode];
          console.log(`감지된 언어: ${inputLang}`);
        } else {
          inputLang = "en"; // 기본값
        }
      }

      // 언어 코드를 전체 언어 이름으로 변환
      const inputLanguageName = languages.find(l => l.code === inputLang)?.name || "English";
      const outputLanguageName = languages.find(l => l.code === targetLanguage)?.name || "English";

      // API 호출
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputText: sourceText,
          inputLanguage: inputLanguageName,
          outputLanguage: outputLanguageName
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '번역 중 오류가 발생했습니다');
      }
      
      const data = await response.json();
      
      // 입력값이 변경되었는지 확인 (중간에 사용자가 입력을 변경한 경우)
      if (currentInputRef.current !== sourceText) return;
      
      setTranslatedText(data.text);
      
      // 사용량 통계 업데이트 (실제 데이터가 있을 경우)
      if (data.usage) {
        setUsageStats(data.usage);
      } else {
        // 임시 사용량 데이터 (실제 구현에서는 서버에서 제공)
        setUsageStats({
          limit: maxInputLength,
          used: characterCount,
          remaining: maxInputLength - characterCount
        });
      }
    } catch (err) {
      // 요청이 취소된 경우는 오류로 처리하지 않음
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('번역 요청이 취소되었습니다');
        return;
      }
      
      console.error('번역 오류:', err);
      setError(err instanceof Error ? err.message : '번역 중 오류가 발생했습니다');
      setTranslatedText(""); // 오류 발생 시 번역 결과 초기화
    } finally {
      setIsTranslating(false);
      isTranslatingRef.current = false;
    }
  };
  
  // 언어 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (showSourceLanguageDropdown || showTargetLanguageDropdown) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // dropdown-trigger 클래스를 가진 요소는 외부 클릭으로 간주하지 않음
        if (!target.closest('.dropdown-content') && !target.closest('.dropdown-trigger')) {
          setShowSourceLanguageDropdown(false);
          setShowTargetLanguageDropdown(false);
        }
      };
      
      // 이벤트 리스너 등록
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSourceLanguageDropdown, showTargetLanguageDropdown]);

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-sm border">
      <Tabs
        defaultValue="text"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
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
              {/* Source Language Selector */}
              <div className="p-3 border-b flex justify-between items-center h-14 relative">
                <div className="relative">
                  <button
                    type="button"
                    className="dropdown-trigger flex items-center gap-1 text-sm font-medium" 
                    onClick={(e) => {
                      e.stopPropagation(); // 이벤트 버블링 방지
                      setShowSourceLanguageDropdown(!showSourceLanguageDropdown);
                      setShowTargetLanguageDropdown(false);
                    }}
                  >
                    {languages.find((l) => l.code === sourceLanguage)?.name || "소스 언어"}
                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showSourceLanguageDropdown ? "rotate-180" : ""}`} />
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSwapLanguages}
                  className="h-8 w-8"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* 소스 언어 드롭다운 메뉴 - 높이 자동 조정 */}
              {showSourceLanguageDropdown && (
                <div 
                  className="dropdown-content absolute top-[56px] left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
                  style={{ 
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}
                  onClick={(e) => e.stopPropagation()} // 내부 클릭 이벤트 버블링 방지
                >
                  <div className="grid grid-cols-3 p-4 gap-2">
                    {/* 언어 감지 옵션 */}
                    <button
                      type="button"
                      className={`text-left p-3 text-sm rounded-md ${
                        sourceLanguage === "detect" 
                          ? "bg-green-50 border border-green-200 text-green-700" 
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // 이벤트 버블링 방지
                        setSourceLanguage("detect");
                        setShowSourceLanguageDropdown(false);
                      }}
                    >
                      <span className="flex items-center">
                        {sourceLanguage === "detect" && (
                          <span className="text-green-500 mr-2">✓</span>
                        )}
                        언어 감지
                      </span>
                    </button>
                    
                    {/* 나머지 언어 옵션 */}
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
                            handleSourceLanguageChange(lang.code); // 수정된 핸들러 사용
                            setShowSourceLanguageDropdown(false);
                            
                            if (sourceText) {
                              translateText();
                            }
                          }}
                        >
                          <span className="flex items-center">
                            {sourceLanguage === lang.code && (
                              <span className="text-green-500 mr-2">✓</span>
                            )}
                            {lang.name}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Source Text Area */}
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
                  className="w-full p-4 min-h-[300px] resize-none border-0 focus:ring-0 focus:outline-none"
                  value={sourceText}
                  onChange={handleSourceTextChange}
                  maxLength={maxInputLength}
                />

                {/* Character count and action buttons */}
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
                        onClick={() => navigator.clipboard.writeText(sourceText)}
                      >
                        <File className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Translated Text */}
            <div className="relative">
              {/* Target Language Selector */}
              <div className="p-3 border-b flex justify-between items-center h-14 relative">
                <div className="relative">
                  <button
                    type="button"
                    className="dropdown-trigger flex items-center gap-1 text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation(); // 이벤트 버블링 방지
                      setShowTargetLanguageDropdown(!showTargetLanguageDropdown);
                      setShowSourceLanguageDropdown(false);
                    }}
                  >
                    {languages.find((l) => l.code === targetLanguage)?.name || "타겟 언어"}
                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showTargetLanguageDropdown ? "rotate-180" : ""}`} />
                  </button>
                </div>

                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-2">자동</span>
                  <div className="w-10 h-5 bg-gray-200 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div>
                  </div>
                </div>
              </div>

              {/* 타겟 언어 드롭다운 메뉴 - 높이 자동 조정 */}
              {showTargetLanguageDropdown && (
                <div 
                  className="dropdown-content absolute top-[56px] left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
                  style={{ 
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}
                  onClick={(e) => e.stopPropagation()} // 내부 클릭 이벤트 버블링 방지
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
                            handleTargetLanguageChange(lang.code); // 수정된 핸들러 사용
                            setShowTargetLanguageDropdown(false);
                            
                            if (sourceText) {
                              translateText();
                            }
                          }}
                        >
                          <span className="flex items-center">
                            {targetLanguage === lang.code && (
                              <span className="text-green-500 mr-2">✓</span>
                            )}
                            {lang.name}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Target Text Area */}
              <div className="relative">
                <textarea
                  ref={targetTextareaRef}
                  readOnly
                  placeholder={isTranslating ? "번역 중..." : "번역 결과가 여기에 표시됩니다"}
                  className="w-full p-4 min-h-[300px] resize-none border-0 focus:ring-0 focus:outline-none bg-white"
                  value={translatedText}
                />

                {/* Action buttons */}
                {translatedText && (
                  <div className="absolute bottom-3 right-3 flex gap-3">
                    <button className="text-gray-500 hover:text-gray-700">
                      <Volume2 className="h-5 w-5" />
                    </button>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={handleCopyTranslation}
                    >
                      <File className="h-5 w-5" />
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
          
          {/* Error Messages */}
          {error && (
            <div className="bg-red-50 text-red-500 p-3 m-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Usage Statistics */}
          {usageStats && (
            <div className="text-xs text-gray-500 p-3 border-t">
              일일 번역 사용량: {usageStats.used}/{usageStats.limit} (남은 횟수: {usageStats.remaining})
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
