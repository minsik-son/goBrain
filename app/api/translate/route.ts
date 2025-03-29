import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { langCodeToName } from "@/lib/utils/language-utils";

// 최신 Next.js 구성 방식으로 업데이트
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 처리 시간이 길어질 수 있으므로 60초로 설정

// OpenAI 클라이언트 타입 정의
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

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
          docxData: body.docxData,
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
  const { text, sourceLanguage, targetLanguage, fileType, fileUrl } = body;

  if (!text || !targetLanguage) {
    return NextResponse.json(
      { error: "필수 필드가 누락되었습니다" },
      { status: 400 }
    );
  }
  
  let contextPrompt = "텍스트 파일의 줄바꿈과 단락 구조를 유지하며 정확하고 자연스럽게 번역하세요. 번역된 텍스트만 반환하세요.";
  
  const messages: ChatMessage[] = [
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
    messages: messages as any,
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
  const { text, docxData, sourceLanguage, targetLanguage, fileType, fileUrl } = body;

  console.log("DOCX 번역 요청 데이터:", { 
    hasDocxData: !!docxData, 
    hasTextNodes: docxData?.textNodes ? true : false,
    textNodesLength: docxData?.textNodes?.length || 0,
    targetLanguage 
  });

  // docxData가 없거나 textNodes가 빈 배열이거나 targetLanguage가 없는 경우
  if (!docxData || !targetLanguage) {
    return NextResponse.json(
      { error: "DOCX 데이터나 언어 정보가 누락되었습니다" },
      { status: 400 }
    );
  }

  // textNodes가 없거나 빈 배열인 경우 일반 텍스트 번역으로 대체
  if (!docxData.textNodes || docxData.textNodes.length === 0) {
    console.log("텍스트 노드가 없어 일반 텍스트 번역으로 대체합니다.");
    
    // 텍스트 필드가 있으면 사용, 없으면 빈 문자열
    const textToTranslate = text || docxData.extractedText || "";
    
    if (!textToTranslate) {
      return NextResponse.json(
        { error: "번역할 텍스트가 없습니다" },
        { status: 400 }
      );
    }
    
    // 일반 텍스트 번역 수행
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: "문서 텍스트를 정확하고 자연스럽게 번역하세요. 번역된 텍스트만 반환하세요."
      },
      {
        role: "user",
        content: `다음 텍스트를 ${sourceLanguage || '자동 감지된 언어'}에서 ${targetLanguage}로 번역하세요: ${textToTranslate}`
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      temperature: 0.1,
    });

    const translatedText = response.choices[0].message.content || "";
    
    // 번역된 텍스트를 docxData에 추가
    const translatedDocxData = {
      ...docxData,
      translatedTextNodes: [translatedText], // 단일 노드로 처리
      extractedText: textToTranslate,
      translatedText: translatedText
    };
    
    return NextResponse.json({
      translatedText,
      translatedDocxData,
      sourceLanguage,
      targetLanguage,
      fileType,
      fileUrl
    });
  }

  // JSZip으로 추출한 데이터를 사용하여 XML 구조 기반 번역
  console.log("JSZip 추출 데이터 기반 번역 처리 중...");
  console.log(`텍스트 노드 수: ${docxData.textNodes.length}`);
  
  // 텍스트 노드 배열을 단일 텍스트로 변환 (번역을 위해)
  const combinedText = docxData.textNodes.join("\n[[SPLIT]]\n");
  
  // 번역 요청
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "텍스트 조각들을 번역하되, 각 조각을 개별적으로 번역하세요. 각 조각은 [[SPLIT]] 구분자로 구분됩니다. 구분자를 보존하고 텍스트만 번역하세요. 원본 구조와 형식을 유지해야 합니다."
    },
    {
      role: "user",
      content: `다음 Word 문서의 텍스트 조각들을 ${sourceLanguage || '자동 감지된 언어'}에서 ${targetLanguage}로 번역하세요. 각 조각은 [[SPLIT]] 구분자로 구분됩니다. 구분자를 유지하고 텍스트만 정확하게 번역하세요: ${combinedText}`
    }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages as any,
    temperature: 0.1,
  });

  const translatedCombinedText = response.choices[0].message.content || "";
  
  // 번역된 텍스트를 다시 배열로 분할
  const translatedTextNodes = translatedCombinedText.split("\n[[SPLIT]]\n");
  
  // 원본 docxData 객체 복사 후 번역된 텍스트 배열 추가
  const translatedDocxData = {
    ...docxData,
    translatedTextNodes: translatedTextNodes
  };
  
  return NextResponse.json({
    translatedText: translatedTextNodes.join("\n"), // 호환성을 위해 기본 텍스트도 제공
    translatedDocxData, // 서식 유지를 위한 XML 구조 데이터
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
      { error: "텍스트 Text 필드가 누락되었습니다" },
      { status: 400 }
    );
  }
  
  let contextPrompt = "PDF 문서의 텍스트를 정확하게 번역하되, 레이아웃과 형식을 최대한 유지하세요.";
  
  const messages: ChatMessage[] = [
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
    messages: messages as any,
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
  const messages: ChatMessage[] = [
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
    messages: messages as any,
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

