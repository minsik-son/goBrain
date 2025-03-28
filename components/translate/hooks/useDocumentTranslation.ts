import { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import {
  uploadAndTranslateDocument,
  resetTranslation,
} from "@/lib/redux/slices/documentTranslationSlice";

/**
 * 문서 번역 기능을 제공하는 훅
 * @param userId 사용자 ID
 * @param sourceLanguage 소스 언어
 * @param targetLanguage 타겟 언어
 * @returns 문서 번역 관련 상태 및 함수
 */
export function useDocumentTranslation(
  userId: string | null,
  sourceLanguage: string,
  targetLanguage: string
) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const {
    isUploading,
    uploadStep,
    currentTranslation,
    userPlan,
    translationsLeft,
    canTranslate,
    error: documentError,
  } = useAppSelector((state) => state.documentTranslation);

  /**
   * 드래그 앤 드롭 이벤트 핸들러 - 드래그 오버
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  /**
   * 드래그 앤 드롭 이벤트 핸들러 - 드래그 리브
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  /**
   * 드래그 앤 드롭 이벤트 핸들러 - 드롭
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!userId || !canTranslate) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      
      if (["pdf", "docx", "txt"].includes(fileExtension || "")) {
        handleFileUpload(file);
      } else {
        console.log("지원하지 않는 파일 형식");
        toast({
          title: "지원되지 않는 파일 형식",
          description: "PDF, DOCX, TXT 형식의 파일만 지원합니다.",
          variant: "destructive",
        });
      }
    }
  };

  /**
   * 파일 업로드 핸들러
   */
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  /**
   * 간단한 알림 함수
   */
  const showAlert = (message: string) => {
    const alertElement = document.createElement("div");
    alertElement.style.position = "fixed";
    alertElement.style.bottom = "20px";
    alertElement.style.right = "20px";
    alertElement.style.padding = "10px 20px";
    alertElement.style.backgroundColor = "#333";
    alertElement.style.color = "white";
    alertElement.style.borderRadius = "4px";
    alertElement.style.zIndex = "9999";
    alertElement.textContent = message;

    document.body.appendChild(alertElement);

    setTimeout(() => {
      alertElement.style.opacity = "0";
      alertElement.style.transition = "opacity 0.5s";
      setTimeout(() => {
        document.body.removeChild(alertElement);
      }, 500);
    }, 3000);
  };

  /**
   * 파일 업로드 핸들러 (문서 번역)
   */
  const handleFileUpload = (file: File) => {
    if (!userId) return;
    
    dispatch(
      uploadAndTranslateDocument({
        file,
        userId,
        sourceLanguage,
        targetLanguage,
        userPlan,
      })
    )
      .unwrap()
      .then(() => {
        showAlert("문서 번역이 완료되었습니다.");
      })
      .catch((error) => {
        showAlert(`오류: ${error || "문서 번역 중 오류가 발생했습니다."}`);
      });
  };

  /**
   * 번역 문서 다운로드
   */
  const handleDocumentDownload = async (fileUrl: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("파일을 가져오는 데 실패했습니다");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        currentTranslation?.document_name.replace(/\.[^.]+$/, "") +
        "_translated" +
        currentTranslation?.document_name.substring(
          currentTranslation.document_name.lastIndexOf(".")
        );
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "다운로드 오류",
        description:
          error.message || "파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  /**
   * 번역 상태 리셋
   */
  const resetDocumentTranslation = () => {
    dispatch(resetTranslation());
  };

  return {
    isDragging,
    isUploading,
    uploadStep,
    currentTranslation,
    userPlan,
    translationsLeft,
    canTranslate,
    documentError,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
    handleDocumentDownload,
    resetDocumentTranslation,
  };
} 