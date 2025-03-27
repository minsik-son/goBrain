import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { langCodeToName } from "@/lib/utils/language-utils";
import ChatCompletionMessageParam from "openai";

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("요청된 JSON 바디:", body);
    
    // 파일 확장자와 요청 필드를 기반으로 번역 유형 결정
    if (body.fileType) {  // fileType이 있으면 문서 번역으로 처리
      if (body.fileType === "txt") {
        console.log("TXT 문서 번역 요청 감지");
        return handleTxtDocumentTranslation({
          text: body.inputText,
          sourceLanguage: body.inputLanguage,
          targetLanguage: body.outputLanguage,
          fileType: body.fileType,
          fileUrl: body.fileUrl
        });
      }
      else if (body.fileType === 'docx') {
        console.log("DOCX 문서 번역 요청 감지");
        return handleDocxDocumentTranslation({
          text: body.inputText,
          html: body.html, // HTML 구조 정보
          sourceLanguage: body.inputLanguage,
          targetLanguage: body.outputLanguage,
          fileType: body.fileType,
          fileUrl: body.fileUrl
        });
      }
      else if (body.fileType === 'pdf') {
        console.log("PDF 문서 번역 요청 감지");
        // PDF 처리 로직은 추후 구현
        return handlePdfDocumentTranslation({
          text: body.inputText,
          sourceLanguage: body.inputLanguage,
          targetLanguage: body.outputLanguage,
          fileType: body.fileType,
          fileUrl: body.fileUrl
        });
      }
    } else if (body.inputText !== undefined) {
      console.log("일반 텍스트 번역 요청 감지");
      return handleTextTranslation(body);
    } else {
      console.log("알 수 없는 번역 요청 유형:", body);
      return NextResponse.json(
        { error: "올바른 번역 요청 형식이 아닙니다" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("번역 API 오류:", error);
    return NextResponse.json(
      { error: "번역 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// TXT 문서 번역 처리 함수
async function handleTxtDocumentTranslation(body: any) {
  // 기존 handleDocumentTranslation 함수 내용을 여기로 이동
  const { text, sourceLanguage, targetLanguage, fileType, fileUrl } = body;

  if (!text || !targetLanguage) {
    return NextResponse.json(
      { error: "필수 필드가 누락되었습니다" },
      { status: 400 }
    );
  }
  
  let contextPrompt = "텍스트 파일의 줄바꿈과 단락 구조를 유지하며 정확하고 자연스럽게 번역하세요. 번역된 텍스트만 반환하세요.";
  
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: contextPrompt
    },
    {
      role: "user",
      content: `다음 텍스트 파일 내용을 ${sourceLanguage || '자동 감지된 언어'}에서 ${targetLanguage}로 번역하세요: ${text}`
    }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.1,
  });

  const translatedText = response.choices[0].message.content || "";

  return NextResponse.json({
    translatedText,
    sourceLanguage,
    targetLanguage,
    fileType,
    fileUrl
  });
}

// DOCX 문서 번역 처리 함수
async function handleDocxDocumentTranslation(body: any) {
  const { text, html, sourceLanguage, targetLanguage, fileType, fileUrl } = body;

  if (!text || !targetLanguage) {
    return NextResponse.json(
      { error: "필수 필드가 누락되었습니다" },
      { status: 400 }
    );
  }
  
  let contextPrompt = "Word 문서 텍스트를 번역하되, 원래 문서의 서식과 구조는 유지합니다. 텍스트만 번역하고 HTML 태그나 마크업은 수정하지 마세요.";
  
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: contextPrompt
    },
    {
      role: "user",
      content: `다음 Word 문서 텍스트를 ${sourceLanguage || '자동 감지된 언어'}에서 ${targetLanguage}로 번역하세요. 번역된 텍스트만 반환하고 서식이나 구조는 건드리지 마세요: ${text}`
    }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.1,
  });

  const translatedText = response.choices[0].message.content || "";
  
  // 원본 HTML과 번역된 텍스트를 함께 반환
  return NextResponse.json({
    translatedText,
    originalHtml: html, // 원본 HTML 구조 유지
    sourceLanguage,
    targetLanguage,
    fileType,
    fileUrl
  });
}

// PDF 문서 번역 처리 함수 (추후 구현)
async function handlePdfDocumentTranslation(body: any) {
  const { text, sourceLanguage, targetLanguage, fileType, fileUrl } = body;
  
  // PDF 번역 로직은 추후 구현 예정
  // 현재는 기본 번역만 수행
  
  if (!text || !targetLanguage) {
    return NextResponse.json(
      { error: "필수 필드가 누락되었습니다" },
      { status: 400 }
    );
  }
  
  let contextPrompt = "PDF 문서의 텍스트를 정확하게 번역하되, 레이아웃과 형식을 최대한 유지하세요.";
  
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: contextPrompt
    },
    {
      role: "user",
      content: `다음 PDF 문서 텍스트를 ${sourceLanguage || '자동 감지된 언어'}에서 ${targetLanguage}로 번역하세요: ${text}`
    }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.1,
  });

  const translatedText = response.choices[0].message.content || "";
  
  return NextResponse.json({
    translatedText,
    sourceLanguage,
    targetLanguage,
    fileType,
    fileUrl
  });
}

// 일반 텍스트 번역을 처리하는 함수 (기존 코드)
async function handleTextTranslation(body: any) {
  const { inputText, inputLanguage, outputLanguage, detectedLanguageInfo } = body;
  
  if (!inputText || !outputLanguage) {
    return NextResponse.json(
      {
        error: "필수 필드가 누락되었습니다",
        missingFields: {
          inputText: !inputText,
          outputLanguage: !outputLanguage
        }
      },
      { status: 400 }
    );
  }

  /*
  console.log("텍스트 번역 요청:", {
    textLength: inputText.length,
    inputLanguage,
    outputLanguage
  });
  */

  // 입력 언어 결정 (detectedLanguageInfo가 있으면 사용)
  let effectiveInputLanguage = inputLanguage;
  let detectedLanguage = null;
  
  if (detectedLanguageInfo && inputLanguage === "Detect Language") {
    detectedLanguage = detectedLanguageInfo;
    const detectedCode = detectedLanguageInfo.code;
    effectiveInputLanguage = langCodeToName[detectedCode] || detectedLanguageInfo.name;
    console.log(`클라이언트에서 전달받은 감지 언어로 번역: ${effectiveInputLanguage}`);
  }

  // 번역 실행
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "Translate the text accurately and naturally. Only return the translated text without any explanations or comments."
    },
    {
      role: "user",
      content: `Translate the following text from ${effectiveInputLanguage} to ${outputLanguage}: ${inputText}`
    }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.1,
  });

  const translatedText = response.choices[0].message.content || "";


  // 번역 결과와 감지 정보 반환
  return NextResponse.json({
    text: translatedText,
    detectedLanguage,
    effectiveInputLanguage
  });
}

