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
    const { inputText, inputLanguage, outputLanguage, detectedLanguageInfo } = await req.json();
    
    if (!inputText || !outputLanguage) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
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
  } catch (error) {
    console.error("번역 API 오류:", error);
    return NextResponse.json(
      { error: "번역 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/*
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
    const { inputText, inputLanguage, outputLanguage, detectedLanguageInfo } = await req.json();
    
    if (!inputText || !outputLanguage) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
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
  } catch (error) {
    console.error("번역 API 오류:", error);
    return NextResponse.json(
      { error: "번역 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
  */