"use client"

import React from 'react';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaGoogle } from "react-icons/fa";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type GoogleLoginButtonProps = {
  setIsLoading: (isLoading: boolean) => void;
  onSuccess: () => void;
  isLoading: boolean;
};

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ setIsLoading, onSuccess, isLoading }) => {
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });
      
      if (signInError) {
        throw signInError;
      }
      onSuccess();
    } catch (err) {
      console.error("Error signing in with Google:", err);
      setError(err instanceof Error ? err.message : "구글 로그인 중 오류가 발생했습니다");
      setIsLoading(false); // 오류 발생 시 로딩 상태 해제
    }
    // 성공 시에는 로딩 상태를 유지하고 리다이렉트됨
  };
  
  return (
    <>
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2"
      >
        <FaGoogle className="h-4 w-4" />
        {isLoading ? "처리 중..." : "구글로 로그인"}
      </Button>
      
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </>
  );
};

export default GoogleLoginButton; 