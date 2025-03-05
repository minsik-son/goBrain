"use client"

import { useState, useEffect } from "react"
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
  const [outputLanguage, setOutputLanguage] = useState(languages[1]) // Default: English
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

  // Debounce to avoid excessive API calls
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (inputText && inputLanguage.value !== outputLanguage.value) {
        translateText()
      }
    }, 500)
    return () => clearTimeout(debounceTimeout)
  }, [inputText, inputLanguage, outputLanguage])

  const translateText = async () => {
    if (!inputText.trim()) {
      setOutputText("")
      return
    }

    try {
      setIsTranslating(true)
      setError(null)

      // If Detect Language is selected, attempt to detect with franc
      if (inputLanguage.value === "detect") {
        const detectedCode = franc(inputText)
        if (detectedCode !== "und" && codeToLabelMap[detectedCode]) {
          const detectedLabel = codeToLabelMap[detectedCode]
          const matchedLanguage = languages.find((l) => l.label === detectedLabel)
          if (matchedLanguage) {
            setInputLanguage(matchedLanguage)
          } else {
            setError(`Detected language code "${detectedCode}" is not in the language list.`)
            setIsTranslating(false)
            setOutputText("")
            return
          }
        } else {
          setError("Unable to detect language.")
          setIsTranslating(false)
          setOutputText("")
          return
        }
      }

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
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Translation request failed")
      }

      setOutputText(data.text)

      if (data.limit) {
        setUsageStats({
          limit: data.limit,
          used: data.used,
          remaining: data.remaining,
        })
      }
    } catch (err) {
      console.error("Translation error:", err)
      setError(err instanceof Error ? err.message : "An error occurred during translation.")
      setOutputText("")
    } finally {
      setIsTranslating(false)
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
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search language..." />
                <CommandList>
                  <CommandEmpty>No language found.</CommandEmpty>
                  <CommandGroup>
                    {languages.map((lang) => (
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
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search language..." />
                <CommandList>
                  <CommandEmpty>No language found.</CommandEmpty>
                  <CommandGroup>
                    {languages.filter(lang => lang.value !== "detect").map((lang) => (
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
        <div className="w-full md:w-[49%]">
          <Textarea
            placeholder="Enter text to translate..."
            className="w-full resize-y overflow-hidden"
            style={{ minHeight: "400px", height: "auto" }}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value)
              // 자동 높이 조정
              e.target.style.height = "auto" // 초기화
              e.target.style.height = `${e.target.scrollHeight}px` // 내용에 따라 높이 조정
            }}
          />
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
