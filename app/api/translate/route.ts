import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { langCodeToName } from "@/lib/utils/language-utils";

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
    const messages = [
      {
        role: "system",
        content: "정확하고 자연스럽게 번역해주세요. 번역된 텍스트만 반환하고 다른 설명이나 주석은 포함하지 마세요."
      },
      {
        role: "user",
        content: `다음 텍스트를 ${effectiveInputLanguage}에서 ${outputLanguage}로 번역해주세요: ${inputText}`
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
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OpenAI } from "openai";
import Redis from "ioredis";

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Redis 클라이언트 초기화 (rate limiting)
const redis = new Redis(process.env.REDIS_URL || "");

// 사용자 계획별 한도 설정
const PLAN_LIMITS = {
  guest: { charLimit: 500, requestsPerDay: 5 },
  free: { charLimit: 1000, requestsPerDay: 10 },
  pro: { charLimit: 5000, requestsPerDay: 50 },
  premium: { charLimit: Infinity, requestsPerDay: Infinity },
};

export async function POST(req: NextRequest) {
  try {
    const { inputText, inputLanguage, outputLanguage } = await req.json();

    if (!inputText || !inputLanguage || !outputLanguage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 클라이언트 IP 주소 가져오기
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const ipKey = `ip:${ip}:translations`;
    
    // 사용자 인증 확인
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    let userPlan = "guest";
    let userId = null;

    if (user) {
      userId = user.id;
      const { data: userData } = await supabase
        .from("users")
        .select("plan")
        .eq("id", user.id)
        .single();

      userPlan = userData?.plan || "free";
    }

    // 사용자 한도 가져오기
    const { charLimit, requestsPerDay } = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS];

    // 문자 길이 확인
    if (inputText.length > charLimit) {
      return NextResponse.json(
        {
          error: `Character limit exceeded: Maximum ${charLimit} characters allowed (current: ${inputText.length})`,
        },
        { status: 400 }
      );
    }

    // 사용자 또는 IP 기반 레디스 키 설정
    const rateKey = userId ? `user:${userId}:translations` : ipKey;

    // 오늘 남은 일일 요청 수 확인
    const currentRequests = await redis.get(rateKey) || "0";
    const requestsUsed = parseInt(currentRequests, 10);

    if (requestsUsed >= requestsPerDay) {
      return NextResponse.json(
        {
          error: "Daily request limit reached. Please try again tomorrow.",
          limit: requestsPerDay,
          used: requestsUsed,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // OpenAI API 호출하여 번역 실행
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate the text accurately and naturally. Only return the translated text without any additional comments or explanations."
        },
        {
          role: "user",
          content: `Translate the following text from ${inputLanguage} to ${outputLanguage}: "${inputText}"`,
        },
      ],
      temperature: 0.3,
    });

    const translatedText = response.choices[0]?.message.content || "";

    // 사용량 증가 및 만료시간 설정 (하루 - 86400초)
    const ttl = 86400;
    await redis.setex(rateKey, ttl, (requestsUsed + 1).toString());

    // 번역 로그 저장
    if (userId) {
      await supabase.from("translations").insert([
        {
          user_id: userId,
          input_text: inputText,
          input_language: inputLanguage,
          output_language: outputLanguage,
          output_text: translatedText,
          character_count: inputText.length,
        },
      ]);
    }

    // 성공 응답 반환 (남은 요청 정보 포함)
    return NextResponse.json({
      text: translatedText,
      limit: requestsPerDay,
      used: requestsUsed + 1,
      remaining: requestsPerDay - (requestsUsed + 1),
    });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: "Error processing translation" },
      { status: 500 }
    );
  }
} 


*/

