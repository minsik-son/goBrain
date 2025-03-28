import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/lib/contexts/auth-context";

// 언어 목록 정의 (translator.tsx와 동일하게)
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
];

/**
 * 언어 이름이나 코드를 유효한 언어 코드로 변환하는 함수
 */
const normalizeLanguageCode = (languageValue: string): string => {
  // 이미 유효한 언어 코드인 경우
  const isValidCode = languages.some(lang => lang.code === languageValue);
  if (isValidCode) {
    return languageValue;
  }
  
  // 언어 이름으로 코드 찾기 (대소문자 무시)
  const languageByName = languages.find(
    lang => lang.name.toLowerCase() === languageValue.toLowerCase()
  );
  if (languageByName) {
    return languageByName.code;
  }
  
  // 기본값 반환
  return "en";
};

/**
 * 사용자의 선호 언어를 가져오는 훅
 * @returns 사용자의 선호 언어 코드와 로딩 상태
 */
export function usePreferredLanguage() {
  const [preferredLanguage, setPreferredLanguage] = useState<string>("en");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchPreferredLanguage() {
      // 로그인하지 않은 경우 기본값 "en"으로 설정하고 로딩 완료
      if (!user) {
        setPreferredLanguage("en");
        setIsLoading(false);
        return;
      }

      try {
        // users 테이블에서 preferred_language 데이터 조회
        const { data, error } = await supabase
          .from("users")
          .select("preferred_language")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("선호 언어 조회 오류:", error);
          setIsLoading(false);
          return;
        }

        // preferred_language가 존재하고 유효한 값이면 상태 업데이트
        if (data && data.preferred_language) {
          console.log("선호 언어 원본 값:", data.preferred_language);
          
          // 언어 값을 유효한 코드로 변환
          const normalizedCode = normalizeLanguageCode(data.preferred_language);
          console.log("정규화된 언어 코드:", normalizedCode);
          
          setPreferredLanguage(normalizedCode);
        }
      } catch (error) {
        console.error("선호 언어 가져오기 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferredLanguage();
  }, [user, supabase]);

  return { preferredLanguage, isLoading };
}
