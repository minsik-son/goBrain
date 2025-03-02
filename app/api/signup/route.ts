import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { email, password, ip } = await req.json();
    const supabase = createRouteHandlerClient({ cookies });

    // IP 기반 회원가입 제한 확인
    const { data: existingUser } = await supabase
      .from("user_signups")
      .select("id")
      .eq("ip_address", ip)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "This IP address has already been used for registration." },
        { status: 400 }
      );
    }

    // 사용자 등록
    const { data, error: signUpError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${req.nextUrl.origin}/auth/callback`
      }
    });
    
    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    // 사용자 ID 확인
    const userId = data?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Signup failed. User ID not found." },
        { status: 400 }
      );
    }

    // IP 주소 데이터베이스에 저장
    const { error: insertError } = await supabase
      .from("user_signups")
      .insert([{ user_id: userId, ip_address: ip }]);

    if (insertError) {
      return NextResponse.json(
        { error: "Error saving IP address." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Signup successful!" });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup." },
      { status: 500 }
    );
  }
} 