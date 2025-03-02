"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Copy, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

const languages = [
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

export function Translator() {
  const [inputLanguage, setInputLanguage] = useState(languages[0])
  const [outputLanguage, setOutputLanguage] = useState(languages[1])
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [inputOpen, setInputOpen] = useState(false)
  const [outputOpen, setOutputOpen] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [usageStats, setUsageStats] = useState<{
    limit: number;
    used: number;
    remaining: number;
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Debounce function to prevent too many API calls
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

    setIsTranslating(true)
    setError(null)
    
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          inputText: inputText,
          inputLanguage: inputLanguage.label,
          outputLanguage: outputLanguage.label,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Translation request failed");
      }

      setOutputText(data.text);
      
      // 사용량 통계 업데이트
      if (data.limit) {
        setUsageStats({
          limit: data.limit,
          used: data.used,
          remaining: data.remaining
        });
      }
      
    } catch (error) {
      console.error("Translation error:", error);
      setError(error instanceof Error ? error.message : "An error occurred during translation.");
      setOutputText("");
    } finally {
      setIsTranslating(false);
    }
  }

  const swapLanguages = () => {
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
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to copy text:", error)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="w-full md:w-[45%]">
          <div className="mb-2">
            <Popover open={inputOpen} onOpenChange={setInputOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={inputOpen} className="w-full justify-between">
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
                      {languages.map((language) => (
                        <CommandItem
                          key={language.value}
                          value={language.value}
                          onSelect={() => {
                            setInputLanguage(language)
                            setInputOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              inputLanguage.value === language.value ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {language.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Textarea
            placeholder="Enter text to translate..."
            className="h-[400px] w-full resize-y overflow-auto"
            style={{ minHeight: "400px", height: "auto" }}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-center">
          <Button variant="outline" size="icon" onClick={swapLanguages} className="rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="rotate-90 md:rotate-0"
            >
              <path d="m17 10-5-5-5 5" />
              <path d="M7 14l5 5 5-5" />
            </svg>
          </Button>
        </div>

        <div className="w-full md:w-[45%]">
          <div className="mb-2">
            <Popover open={outputOpen} onOpenChange={setOutputOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={outputOpen} className="w-full justify-between">
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
                      {languages.map((language) => (
                        <CommandItem
                          key={language.value}
                          value={language.value}
                          onSelect={() => {
                            setOutputLanguage(language)
                            setOutputOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              outputLanguage.value === language.value ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {language.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="relative">
            <Textarea
              placeholder={isTranslating ? "Translating..." : "Translation will appear here..."}
              className="h-[400px] w-full resize-y overflow-auto"
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
      
      {/* 오류 메시지 표시 */}
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}
      
      {/* 사용량 통계 표시 */}
      {usageStats && (
        <div className="text-sm text-muted-foreground">
          Daily translation usage: {usageStats.used}/{usageStats.limit} (Remaining: {usageStats.remaining})
        </div>
      )}
    </div>
  )
}

