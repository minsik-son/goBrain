import { useState, useEffect, useRef } from "react";

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
};

/**
 * 텍스트의 언어를 감지하는 훅
 * @param text 감지할 텍스트
 * @param autoDetect 자동 감지 활성화 여부 (입력 language가 "detect"인 경우)
 * @param language 현재 선택된 언어 코드
 * @returns 감지된 언어 정보 및 관련 함수
 */
export function useDetectLanguage(
  text: string,
  autoDetect: boolean = false,
  language: string = "detect"
) {
  const [detectedLanguageCode, setDetectedLanguageCode] = useState<string | null>(null);
  const [detectedLanguageName, setDetectedLanguageName] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    };

    for (const [code, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return { code, name: langNames[code as keyof typeof langNames] };
      }
    }
    return { code: "en", name: langNames["en"] }; // 기본값
  };

  // API를 통한 언어 감지 함수
  const detectLanguage = async (text: string) => {
    if (!text || text.trim().length < 2) {
      return null;
    }

    setIsDetecting(true);
    setError(null);

    try {
      // 먼저 클라이언트 측에서 간단히 감지
      const clientDetected = simpleDetectLanguage(text);
      setDetectedLanguageCode(clientDetected.code);
      setDetectedLanguageName(clientDetected.name);

      // API를 통한 보다 정확한 감지
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/detect-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: abortControllerRef.current.signal,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.detectedLanguage && data.detectedLanguage.code) {
          setDetectedLanguageCode(data.detectedLanguage.code);
          setDetectedLanguageName(data.detectedLanguage.name);
          return data.detectedLanguage;
        }
      } else {
        console.log("API 오류, 클라이언트 측 감지 결과 사용");
        return {
          code: clientDetected.code,
          name: clientDetected.name,
          confidence: 0.8,
        };
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("언어 감지 요청 중단됨");
      } else {
        console.error("언어 감지 오류:", err);
        setError("언어 감지 중 오류가 발생했습니다");
      }
      return null;
    } finally {
      setIsDetecting(false);
    }
  };

  // 실시간 언어 감지 (디바운스 처리)
  useEffect(() => {
    if (!autoDetect || language !== "detect" || !text || text.trim().length < 4) {
      return;
    }

    setIsDetecting(true);
    const debounceTimeout = setTimeout(async () => {
      await detectLanguage(text);
    }, 800);

    return () => {
      clearTimeout(debounceTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [text, autoDetect, language]);

  // 언어 감지 모드가 꺼지면 감지 상태 초기화
  useEffect(() => {
    if (language !== "detect") {
      setDetectedLanguageCode(null);
      setDetectedLanguageName(null);
    }
  }, [language]);

  return {
    detectedLanguageCode,
    detectedLanguageName,
    isDetecting,
    error,
    detectLanguage,
    simpleDetectLanguage,
  };
} 