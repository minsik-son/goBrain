import { useState } from "react";

/**
 * 텍스트 복사 기능을 제공하는 훅
 * @param copyDuration 복사 성공 표시 유지 시간(ms)
 * @returns 텍스트 복사 관련 상태 및 함수
 */
export function useTextCopy(copyDuration: number = 2000) {
  const [sourceTextCopied, setSourceTextCopied] = useState(false);
  const [translatedTextCopied, setTranslatedTextCopied] = useState(false);

  /**
   * 텍스트를 클립보드에 복사하는 함수
   * @param text 복사할 텍스트
   * @param isSource 소스 텍스트 여부
   */
  const handleCopyText = async (text: string, isSource: boolean = false) => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      
      if (isSource) {
        setSourceTextCopied(true);
        setTimeout(() => setSourceTextCopied(false), copyDuration);
      } else {
        setTranslatedTextCopied(true);
        setTimeout(() => setTranslatedTextCopied(false), copyDuration);
      }
    } catch (err) {
      console.error("텍스트 복사 실패:", err);
    }
  };

  /**
   * 번역된 텍스트를 복사하는 함수
   * @param translatedText 번역된 텍스트
   */
  const handleCopyTranslation = (translatedText: string) => {
    handleCopyText(translatedText, false);
  };

  return {
    sourceTextCopied,
    translatedTextCopied,
    handleCopyText,
    handleCopyTranslation
  };
} 