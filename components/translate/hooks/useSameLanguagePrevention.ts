import { useState, useEffect } from "react";

/**
 * 감지된 언어와 타겟 언어가 같은 경우 처리하기 위한 훅
 * @param sourceLanguage 소스 언어 코드
 * @param targetLanguage 타겟 언어 코드
 * @param detectedLanguageCode 감지된 언어 코드
 * @param isDetecting 언어 감지 중인지 여부
 * @param availableLanguages 사용 가능한 언어 목록
 * @param setTargetLanguage 타겟 언어 변경 함수
 * @returns 언어 중복 방지 관련 함수
 */
export function useSameLanguagePrevention(
  sourceLanguage: string,
  targetLanguage: string,
  detectedLanguageCode: string | null,
  isDetecting: boolean,
  availableLanguages: Array<{ code: string; name: string }>,
  setTargetLanguage: (code: string) => void
) {
  // 감지된 언어와 타겟 언어가 같은 경우 처리
  const preventSameLanguage = (
    sourceCode: string,
    targetCode: string,
    detectedCode: string | null = null
  ): boolean => {
    if (isDetecting) return false;
    
    const effectiveSourceCode =
      sourceCode === "detect" && detectedCode ? detectedCode : sourceCode;
    
    if (effectiveSourceCode === targetCode) {
      const alternativeLanguage = availableLanguages.find(
        (lang) => lang.code !== effectiveSourceCode && lang.code !== "detect"
      );
      
      if (alternativeLanguage) {
        setTargetLanguage(alternativeLanguage.code);
        return true;
      }
    }
    
    return false;
  };

  // 감지된 언어 코드가 있을 때 타겟 언어가 같은지 체크
  useEffect(() => {
    if (detectedLanguageCode && sourceLanguage === "detect") {
      preventSameLanguage("detect", targetLanguage, detectedLanguageCode);
    }
  }, [detectedLanguageCode, sourceLanguage, targetLanguage, isDetecting]);

  return { preventSameLanguage };
} 