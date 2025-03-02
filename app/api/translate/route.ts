import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { inputText, inputLanguage, outputLanguage } = await req.json();

    if (!inputText || !inputLanguage || !outputLanguage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate the text accurately and naturally. Only return the translated text without any additional comments or explanations."
        },
        {
          role: "user",
          content: `Translate the following text from ${inputLanguage} to ${outputLanguage}: "${inputText}"`
        }
      ],
      temperature: 0.3,
    });

    const translatedText = response.choices[0]?.message.content || "";

    return NextResponse.json({ text: translatedText });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: "Error processing translation" },
      { status: 500 }
    );
  }
}