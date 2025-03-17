import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    
    // 간단한 텍스트 분석으로 언어 코드와 이름 추출
    // "en", "ko", "English", "Korean" 등의 패턴 찾기
    const codeMatch = content.match(/\b([a-z]{2})\b/i);
    const nameMatch = content.match(/\b(English|Korean|Japanese|Chinese|Spanish|French|German|Russian)\b/i);
    
    const languageCode = codeMatch ? codeMatch[0].toLowerCase() : "en";
    const languageName = nameMatch ? nameMatch[0] : "English";
    
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