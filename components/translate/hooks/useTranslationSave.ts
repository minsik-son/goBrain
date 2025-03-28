import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";

type ToastType = ReturnType<typeof useToast>["toast"];

/**
 * 번역 저장 기능을 제공하는 훅
 * @param userId 사용자 ID
 * @returns 번역 저장 관련 상태 및 함수
 */
export function useTranslationSave(userId: string | null) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  /**
   * 번역을 저장하는 함수
   * @param sourceText 원본 텍스트
   * @param translatedText 번역된 텍스트
   * @param sourceLanguage 소스 언어
   * @param targetLanguage 타겟 언어
   * @param detectedLanguageName 감지된 언어 이름
   * @param languages 언어 목록
   */
  const saveTranslation = async (
    sourceText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string,
    detectedLanguageName: string | null,
    languages: Array<{ code: string; name: string }>
  ) => {
    if (!translatedText || !userId) {
      toast({
        title: "오류",
        description: !userId
          ? "로그인이 필요합니다."
          : "저장할 번역 내용이 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const wordCount = sourceText.trim().split(/\s+/).length;
      const actualSourceLanguage =
        sourceLanguage === "detect"
          ? detectedLanguageName || "Unknown"
          : languages.find((lang) => lang.code === sourceLanguage)?.name ||
            sourceLanguage;

      const { error } = await supabase.from("translation_history").insert({
        user_id: userId,
        source_language: actualSourceLanguage,
        target_language:
          languages.find((lang) => lang.code === targetLanguage)?.name ||
          targetLanguage,
        text: sourceText,
        translated_text: translatedText,
        word_count: wordCount,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setIsSaved(true);
      toast({
        description: "번역이 성공적으로 저장되었습니다.",
      });
    } catch (error: any) {
      console.error("번역 저장 오류:", error);
      toast({
        title: "저장 오류",
        description:
          error.message || "번역 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 저장 상태 초기화
   */
  const resetSaveState = () => {
    setIsSaved(false);
  };

  return {
    isSaving,
    isSaved,
    saveTranslation,
    resetSaveState
  };
} 