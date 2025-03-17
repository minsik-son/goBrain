import { OpenAI } from "openai";

// 언어 코드 인터페이스
export interface DetectedLanguage {
  code: string;
  name: string;
  confidence: number;
}

// 언어 감지 함수 - 서버 컴포넌트에서 호출하는 방식
export async function detectLanguageWithAPI(text: string): Promise<DetectedLanguage | null> {
  try {
    if (!text || text.trim().length < 3) {
      return null;
    }

    // 언어 감지를 위한 API 엔드포인트 호출
    const response = await fetch('/api/detect-language', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('언어 감지 API 오류');
    }

    const data = await response.json();
    return data.detectedLanguage;
  } catch (error) {
    console.error('API를 통한 언어 감지 오류:', error);
    return null;
  }
}

// 번역 결과에서 언어 감지 정보 추출 함수 개선
export function extractDetectedLanguage(translationResponse: any): DetectedLanguage | null {
  try {
    // 직접 detectedLanguage 객체가 있는 경우
    if (
      translationResponse && 
      translationResponse.detectedLanguage && 
      translationResponse.detectedLanguage.code
    ) {
      console.log("API에서 언어 감지 정보 찾음:", translationResponse.detectedLanguage);
      return translationResponse.detectedLanguage;
    }
    
    // API 응답 형식 로깅 (디버깅용)
    console.log("API 응답 구조 확인:", JSON.stringify(translationResponse, null, 2));
    
    return null;
  } catch (error) {
    console.error('번역 응답에서 언어 감지 정보 추출 실패:', error);
    return null;
  }
}

// 언어 코드를 UI 언어 이름으로 변환
export function getLanguageNameFromCode(code: string): string | null {
  // ISO 639-1 언어 코드 매핑
  const languageMap: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'zh': 'Chinese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'vi': 'Vietnamese',
    'th': 'Thai',
    'tr': 'Turkish',
    'id': 'Indonesian',
    // 필요에 따라 더 많은.언어 추가
  };
  
  return languageMap[code] || null;
}
