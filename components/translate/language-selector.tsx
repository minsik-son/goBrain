"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { 
  ChevronDown, 
  Check, 
  ArrowRight,
  RotateCcw 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { getLanguageNameFromCode } from "@/lib/utils/language-utils"

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

interface LanguageSelectorProps {
  sourceLanguage: string
  targetLanguage: string
  onSourceLanguageChange: (language: string) => void
  onTargetLanguageChange: (language: string) => void
  onReloadClick?: () => void
  activeTab: string
}

export function LanguageSelector({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onReloadClick,
  activeTab
}: LanguageSelectorProps) {
  // 드롭다운 상태 관리
  const [showSourceLanguageDropdown, setShowSourceLanguageDropdown] = useState(false)
  const [showTargetLanguageDropdown, setShowTargetLanguageDropdown] = useState(false)
  
  // 드롭다운 외부 클릭 처리 로직
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

  // 언어 교환 함수
  const handleSwapLanguages = () => {
    if (sourceLanguage !== "detect" && sourceLanguage !== targetLanguage) {
      const temp = sourceLanguage;
      onSourceLanguageChange(targetLanguage);
      onTargetLanguageChange(temp);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-0">
      {/* 출발 언어 (왼쪽) */}
      <div className="border-r relative">
        <div className="relative">
          <button
            type="button"
            className="dropdown-trigger flex items-center gap-1 text-sm font-medium p-3 w-full h-14 text-left"
            onClick={(e) => {
              e.stopPropagation();
              setShowSourceLanguageDropdown(!showSourceLanguageDropdown);
              setShowTargetLanguageDropdown(false);
            }}
          >
            {sourceLanguage === "detect" 
              ? "Detect Language" 
              : languages.find(lang => lang.code === sourceLanguage)?.name || getLanguageNameFromCode(sourceLanguage as any)}
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showSourceLanguageDropdown ? "rotate-180" : ""}`} />
          </button>

          

          {activeTab === "text" ? (
            <button
              type="button"
              className="h-8 w-8 absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              onClick={handleSwapLanguages}
              title="언어 교환"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : (
            <ArrowRight className="h-8 w-10 absolute right-3 top-3 text-gray-400" />
          )}

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
                    onSourceLanguageChange("detect");
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
                        onSourceLanguageChange(lang.code);
                        setShowSourceLanguageDropdown(false);
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
        </div>
      </div>

      {/* 도착 언어 (오른쪽) */}
      <div className="relative">
        <div className="relative">
          <button
            type="button"
            className="dropdown-trigger flex items-center gap-1 text-sm font-medium p-3 w-full h-14 text-left"
            onClick={(e) => {
              e.stopPropagation();
              setShowTargetLanguageDropdown(!showTargetLanguageDropdown);
              setShowSourceLanguageDropdown(false);
            }}
          >
            {languages.find(lang => lang.code === targetLanguage)?.name || getLanguageNameFromCode(targetLanguage as any)}
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showTargetLanguageDropdown ? "rotate-180" : ""}`} />
          </button>

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
                        onTargetLanguageChange(lang.code);
                        setShowTargetLanguageDropdown(false);
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
        </div>
      </div>

      
    </div>
  )
} 