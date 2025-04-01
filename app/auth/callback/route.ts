import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    
    // 디버깅 정보 출력
    console.log('Auth callback called with URL:', request.url);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Origin:', requestUrl.origin);
    console.log('Code present:', !!code);
    console.log('Error present:', !!error);
    
    // 에러가 있는 경우 처리
    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
    }
    
    // 인증 코드가 있는 경우에만 처리
    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      try {
        // 코드를 세션으로 교환
        console.log('Exchanging code for session...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error('Session exchange error:', exchangeError);
          return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
        }
        console.log('Session exchange successful');
      } catch (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
      }
    }
    
    // 성공 시 메인 페이지로 리다이렉트
    console.log('Redirecting to homepage');
    return NextResponse.redirect(new URL('/', requestUrl.origin));
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
} 