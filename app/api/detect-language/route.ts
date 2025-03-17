import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { getLanguageNameFromCode } from "@/lib/utils/language-utils";

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 언어 코드를 이름으로 변환하는 매핑 객체
const languageNames = {
  'en': 'English',
  'ko': 'Korean',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'ru': 'Russian',
  'pt': 'Portuguese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'vi': 'Vietnamese',
  'th': 'Thai',
  'tr': 'Turkish',
  'id': 'Indonesian',
  'it': 'Italian'
};

// 유효한 언어 코드 목록
const validLangCodes = ["en", "ko", "ja", "zh", "es", "fr", "de", "ru", "it", "pt", "ar", "hi", "vi", "th", "tr", "id"];

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "텍스트가 제공되지 않았습니다" },
        { status: 400 }
      );
    }

    // 짧은 텍스트 샘플 사용
    const promptText = text.length > 50 ? text.substring(0, 50) : text;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Detect the language of the given text and provide the ISO 639-1 code and language name briefly."
        },
        {
          role: "user",
          content: `What language is this text?: "${promptText}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 50,
    });

    const content = response.choices[0].message.content || "";
    console.log("API 응답 원본:", content);
    
    // 언어 코드와 이름의 패턴을 더 엄격하게 매칭
    const codeMatch = content.match(/\blanguage\s+code\s*(?:is|:)?\s*['"]?([a-z]{2})['"]?/i) || 
                     content.match(/\bcode\s*(?:is|:)?\s*['"]?([a-z]{2})['"]?/i) ||
                     content.match(/\b([a-z]{2})\b(?=\s*-\s*[A-Z])/i); // "ko - Korean" 패턴 매칭

    const languageCode = codeMatch ? codeMatch[1].toLowerCase() : "en";

    // 유틸리티 함수를 사용하여 언어 이름 가져오기
    const languageName = getLanguageNameFromCode(languageCode);
    
    return NextResponse.json({
      detectedLanguage: {
        code: languageCode,
        name: languageName,
        confidence: 0.8
      }
    });
  } catch (error) {
    console.error("언어 감지 API 오류:", error);
    return NextResponse.json(
      { error: "언어 감지 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 