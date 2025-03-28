"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ArrowRight, RotateCcw } from "lucide-react"
import { getLanguageNameFromCode } from "@/lib/utils/language-utils"

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
  activeTab,
}: LanguageSelectorProps) {
  const [showSourceLanguageDropdown, setShowSourceLanguageDropdown] = useState(false)
  const [showTargetLanguageDropdown, setShowTargetLanguageDropdown] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".dropdown-content") && !target.closest(".dropdown-trigger")) {
        setShowSourceLanguageDropdown(false)
        setShowTargetLanguageDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showSourceLanguageDropdown, showTargetLanguageDropdown])

  const handleSwapLanguages = () => {
    if (sourceLanguage !== "detect" && sourceLanguage !== targetLanguage) {
      onSourceLanguageChange(targetLanguage)
      onTargetLanguageChange(sourceLanguage)
    }
  }

  const getFilteredLanguages = (excludeCode: string) => {
    return languages.filter((lang) => lang.code !== excludeCode)
  }

  return (
    <div className="grid grid-cols-2 gap-0">
      <div className="border-r relative">
        <div className="relative">
          <button
            type="button"
            className="dropdown-trigger flex items-center gap-1 text-sm font-medium p-3 w-full h-14 text-left"
            onClick={(e) => {
              e.stopPropagation()
              setShowSourceLanguageDropdown(!showSourceLanguageDropdown)
              setShowTargetLanguageDropdown(false)
            }}
          >
            {sourceLanguage === "detect"
              ? "Detect Language"
              : languages.find((l) => l.code === sourceLanguage)?.name || getLanguageNameFromCode(sourceLanguage)}
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showSourceLanguageDropdown ? "rotate-180" : ""}`} />
          </button>

          {activeTab === "text" ? (
            <button
              type="button"
              className="h-8 w-8 absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              onClick={handleSwapLanguages}
              title="Swap Languages"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : (
            <ArrowRight className="h-8 w-10 absolute right-3 top-3 text-gray-400" />
          )}

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
                  onClick={() => {
                    onSourceLanguageChange("detect")
                    setShowSourceLanguageDropdown(false)
                  }}
                >
                  <span className="flex items-center">
                    {sourceLanguage === "detect" && <span className="text-green-500 mr-2">✓</span>}
                    Detect Language
                  </span>
                </button>
                {getFilteredLanguages(targetLanguage).map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className={`text-left p-3 text-sm rounded-md ${
                      sourceLanguage === lang.code
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      onSourceLanguageChange(lang.code)
                      setShowSourceLanguageDropdown(false)
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

      <div className="relative">
        <div className="relative">
          <button
            type="button"
            className="dropdown-trigger flex items-center gap-1 text-sm font-medium p-3 w-full h-14 text-left"
            onClick={(e) => {
              e.stopPropagation()
              setShowTargetLanguageDropdown(!showTargetLanguageDropdown)
              setShowSourceLanguageDropdown(false)
            }}
          >
            {languages.find((l) => l.code === targetLanguage)?.name || getLanguageNameFromCode(targetLanguage)}
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showTargetLanguageDropdown ? "rotate-180" : ""}`} />
          </button>

          {showTargetLanguageDropdown && (
            <div
              className="dropdown-content absolute top-[56px] left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
              style={{ maxHeight: "400px", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-3 p-4 gap-2">
                {getFilteredLanguages(sourceLanguage).filter((l) => l.code !== "detect").map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className={`text-left p-3 text-sm rounded-md ${
                      targetLanguage === lang.code
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      onTargetLanguageChange(lang.code)
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
        </div>
      </div>
    </div>
  )
}
