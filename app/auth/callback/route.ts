import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // 인증 코드가 있는 경우에만 처리
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 코드를 세션으로 교환
    await supabase.auth.exchangeCodeForSession(code);
  }
  
  // 메인 페이지로 리다이렉트
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 