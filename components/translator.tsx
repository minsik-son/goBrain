"use client"

import { useState, useEffect, useRef } from "react"
import { Check, ChevronsUpDown, Copy, CheckCircle2, ArrowLeftRight } from "lucide-react"
import { franc } from "franc-min"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"


const languages = [
  { value: "detect", label: "Detect Language" },
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "italian", label: "Italian" },
  { value: "portuguese", label: "Portuguese" },
  { value: "russian", label: "Russian" },
  { value: "japanese", label: "Japanese" },
  { value: "chinese", label: "Chinese" },
  { value: "korean", label: "Korean" },
  { value: "arabic", label: "Arabic" },
]

// 언어 목록을 A-Z 순서로 정렬 (Detect Language 제외)
const sortedLanguages = [...languages]
  .filter(lang => lang.value !== "detect")
  .sort((a, b) => a.label.localeCompare(b.label));

// 입력 언어 목록 가져오기 (Detect Language가 맨 위에)
const getInputLanguages = (excludeLanguage: string) => {
  const detectLanguage = languages.find(lang => lang.value === "detect");
  const otherLanguages = sortedLanguages
    .filter(lang => lang.value !== excludeLanguage);
  
  return detectLanguage ? [detectLanguage, ...otherLanguages] : otherLanguages;
};

// 출력 언어 목록 가져오기 (Detect Language 제외)
const getOutputLanguages = (excludeLanguage: string) => {
  return sortedLanguages.filter(lang => lang.value !== excludeLanguage && lang.value !== "detect");
};

// franc uses ISO 639-3 codes. 
// These are some common mappings for your example's language set:
const codeToLabelMap: Record<string, string> = {
  eng: "English",
  spa: "Spanish",
  fra: "French",
  deu: "German",
  ita: "Italian",
  por: "Portuguese",
  rus: "Russian",
  jpn: "Japanese",
  cmn: "Chinese",
  kor: "Korean",
  ara: "Arabic",
}

export function Translator() {
  const [inputLanguage, setInputLanguage] = useState(languages[0]) // Default: Detect
  const [outputLanguage, setOutputLanguage] = useState(sortedLanguages[0]) // Default: English
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [inputOpen, setInputOpen] = useState(false)
  const [outputOpen, setOutputOpen] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [usageStats, setUsageStats] = useState<{
    limit: number
    used: number
    remaining: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // 현재 번역 중인 텍스트를 추적하기 위한 ref
  const currentInputRef = useRef<string>("")
  // 번역 요청의 취소를 위한 AbortController
  const abortControllerRef = useRef<AbortController | null>(null)
  // 번역 요청이 진행 중인지 추적하는 ref
  const isTranslatingRef = useRef<boolean>(false)

  // Debounce to avoid excessive API calls
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (inputText && inputLanguage.value !== outputLanguage.value) {
        translateText()
      }
    }, 500)
    return () => clearTimeout(debounceTimeout)
  }, [inputText, inputLanguage, outputLanguage])

  // 입력값이 변경될 때마다 호출되어 이전 번역 요청을 취소
  useEffect(() => {
    // 입력값이 없으면 출력값도 초기화
    if (!inputText.trim()) {
      setOutputText("")
    }
    
    // 이전 번역 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [inputText])

  const translateText = async () => {
    if (!inputText.trim()) {
      setOutputText("")
      return
    }

    try {
      // 이전 번역 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // 새로운 AbortController 생성
      abortControllerRef.current = new AbortController()
      
      setIsTranslating(true)
      isTranslatingRef.current = true
      setError(null)
      
      // 현재 입력값 저장
      currentInputRef.current = inputText

      // If Detect Language is selected, attempt to detect with franc
      if (inputLanguage.value === "detect") {
        const detectedCode = franc(inputText)
        if (detectedCode !== "und" && codeToLabelMap[detectedCode]) {
          const detectedLabel = codeToLabelMap[detectedCode]
          const matchedLanguage = languages.find((l) => l.label === detectedLabel)
      
          if (matchedLanguage) {
            // Output 언어와 동일할 경우 다음 언어로 변경
            if (matchedLanguage.value === outputLanguage.value) {
              const currentIndex = sortedLanguages.findIndex((l) => l.value === matchedLanguage.value)
              const nextIndex = (currentIndex + 1) % sortedLanguages.length // 마지막이면 처음으로 돌아감
              const nextLanguage = sortedLanguages[nextIndex]
      
              setOutputLanguage(nextLanguage)
            } else {
              setInputLanguage(matchedLanguage)
            }
          } else {
            setError(`Detected language code "${detectedCode}" is not in the language list.`)
            setIsTranslating(false)
            isTranslatingRef.current = false
            setOutputText("")
            return
          }
        } else {
          // setError("Unable to detect language.")
          setIsTranslating(false)
          isTranslatingRef.current = false
          setOutputText("")
          return
        }
      }
      
      // 현재 상태의 입력값 캡처
      const translationInput = inputText
      
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("supabase.auth.token")}`,
        },
        body: JSON.stringify({
          inputText,
          inputLanguage: inputLanguage.label,
          outputLanguage: outputLanguage.label,
        }),
        signal: abortControllerRef.current.signal
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Translation request failed")
      }
      
      // 번역 결과를 받은 시점에서 입력값이 변경되었는지 확인
      // 입력값이 비어있으면 번역 결과를 표시하지 않음
      if (inputText.trim() === "") {
        setOutputText("")
      } else {
        setOutputText(data.text)
      }

      if (data.limit) {
        setUsageStats({
          limit: data.limit,
          used: data.used,
          remaining: data.remaining,
        })
      }
    } catch (err) {
      // AbortError는 에러 메시지를 표시하지 않음
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('Translation request aborted')
        return
      }
      
      console.error("Translation error:", err)
      setError(err instanceof Error ? err.message : "An error occurred during translation.")
      setOutputText("")
    } finally {
      setIsTranslating(false)
      isTranslatingRef.current = false
    }
  }

  const swapLanguages = () => {
    // Detect Language가 선택된 경우 스왑 기능 비활성화
    if (inputLanguage.value === "detect") {
      return;
    }
    setInputLanguage(outputLanguage)
    setOutputLanguage(inputLanguage)
    setInputText(outputText)
    setOutputText(inputText)
  }

  const inputTextClear = () => {
    setInputText("")
    setOutputText("")
    
    // 진행 중인 번역 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const copyToClipboard = async () => {
    if (!outputText) return
    try {
      await navigator.clipboard.writeText(outputText)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setInputText(text)
    
    // 입력값이 비어있으면 출력값도 초기화
    if (text === ""){
      setOutputText("")
      
      // 진행 중인 번역 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
    
    e.target.style.height = "auto" // 초기화
    e.target.style.height = `${e.target.scrollHeight}px` 
  }

  // Output Textarea의 높이 조정
  useEffect(() => {
    const outputTextarea = document.getElementById("output-textarea") as HTMLTextAreaElement;
    if (outputTextarea) {
      outputTextarea.style.height = "auto"; // 초기화
      outputTextarea.style.height = `${outputTextarea.scrollHeight}px`; // 내용에 따라 높이 조정
    }
  }, [outputText]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Language Selection Controls */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <Popover open={inputOpen} onOpenChange={setInputOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={inputOpen}
                className="w-full justify-between"
              >
                {inputLanguage.label}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            {/**Input Language Popover */}
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search language..." />
                <CommandList>
                  <CommandEmpty>No language found.</CommandEmpty>
                  <CommandGroup>
                    {getInputLanguages(outputLanguage.value).map((lang) => (
                      <CommandItem
                        key={lang.value}
                        value={lang.value}
                        onSelect={() => {
                          setInputLanguage(lang)
                          setInputOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            inputLanguage.value === lang.value ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {lang.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Swap Button - Now between language selectors */}
        <Button variant="outline" size="icon" onClick={swapLanguages} className="rounded-full">
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
        
        <div className="flex-1">
          <Popover open={outputOpen} onOpenChange={setOutputOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={outputOpen}
                className="w-full justify-between"
              >
                {outputLanguage.label}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            {/**Output Language Popover */}
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search language..." />
                <CommandList>
                  <CommandEmpty>No language found.</CommandEmpty>
                  <CommandGroup>
                    {getOutputLanguages(inputLanguage.value).map((lang) => (
                      <CommandItem
                        key={lang.value}
                        value={lang.value}
                        onSelect={() => {
                          setOutputLanguage(lang)
                          setOutputOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            outputLanguage.value === lang.value ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {lang.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Input Text */}
        <div className="relative w-full md:w-[49%]">
          <Textarea
            placeholder="Enter text to translate..."
            className="w-full resize-y overflow-hidden pr-8"
            style={{ minHeight: "400px", height: "auto"}}
            value={inputText}
            onChange={handleInputChange}
          />
          {inputText && (
            <Button 
              id="clear-input"
              size="icon"
              variant="ghost"
              onClick={inputTextClear}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white-200 border-gray-300 hover:bg-gray-300 text-black"
            >
            X
            </Button>
          )}
        </div>

        {/* Output Text */}
        <div className="w-full md:w-[49%]">
          <div className="relative">
            <Textarea
              id="output-textarea"
              placeholder={isTranslating ? "Translating..." : "Translation will appear here..."}
              className="w-full resize-y overflow-hidden pb-12" // 하단에 패딩 추가
              style={{ minHeight: "400px", height: "auto" }}
              value={outputText}
              readOnly
            />
            {outputText && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={copyToClipboard}
                title="Copy to clipboard"
              >
                {isCopied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Usage Statistics */}
      {usageStats && (
        <div className="text-sm text-muted-foreground">
          Daily translation usage: {usageStats.used}/{usageStats.limit} (Remaining: {usageStats.remaining})
        </div>
      )}
    </div>
  )
}
