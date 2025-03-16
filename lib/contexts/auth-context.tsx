"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 초기 세션 확인
    const checkSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (err) {
        console.error("Error checking auth session:", err);
        setError(err instanceof Error ? err.message : "인증 세션 확인 중 오류가 발생했습니다");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
        
        // 로그인/로그아웃 이벤트에 따른 추가 처리
        if (event === 'SIGNED_IN' && newSession) {
          // 사용자 프로필 확인/생성 로직은 여기서 구현 가능
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  
  // 로그아웃 함수
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        throw signOutError;
      }
      
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error("Error signing out:", err);
      setError(err instanceof Error ? err.message : "로그아웃 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
    user,
    session,
    isLoading,
    error,
    signOut
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}; 