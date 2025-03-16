"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "./auth-context";

// 사용자 프로필 타입 정의
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  preferred_language: string;
  plan: string;
  avatar_url: string;
}

// 컨텍스트 타입 정의
interface UserContextProps {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const supabase = createClientComponentClient();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0); // 마지막 조회 시간 추적

  // 프로필 정보 가져오기
  const fetchProfile = async () => {
    // 인증 로딩 중이거나 사용자가 없으면 스킵
    if (authLoading || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // 이미 최근에 조회했다면 재조회 방지 (중복 요청 방지)
    const now = Date.now();
    if (now - lastFetchTime < 2000) { // 2초 내 재요청 방지
      return;
    }
    
    setLastFetchTime(now);
    
    try {
      setLoading(true);
      setError(null);
      
      // 먼저 프로필이 있는지 확인
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      // 프로필이 있으면 설정
      if (data) {
        setProfile(data as UserProfile);
        return;
      }
      
      // 프로필이 없으면 새로 생성
      const newProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        preferred_language: 'English',
        plan: 'free',
        avatar_url: user.user_metadata?.avatar_url || ''
      };
      
      // 프로필 생성 시도
      const { error: insertError } = await supabase
        .from('users')
        .insert([newProfile]);
      
      // 중복 키 오류이면 다시 조회
      if (insertError && insertError.code === '23505') {
        console.log('Profile creation conflict, refetching...');
        const { data: retryData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (retryData) {
          setProfile(retryData as UserProfile);
        } else {
          throw new Error('Failed to retrieve profile after conflict');
        }
      } else if (insertError) {
        throw insertError;
      } else {
        setProfile(newProfile);
      }
    } catch (err) {
      console.error('Error managing user profile:', err);
      setError(err instanceof Error ? err.message : '프로필 관리 중 오류가 발생했습니다');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // 인증 상태 변경시 프로필 정보 가져오기
  useEffect(() => {
    fetchProfile();
  }, [user, authLoading]);

  // 프로필 업데이트 함수
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      setError('업데이트할 프로필이 없습니다');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);
        
      if (updateError) {
        throw updateError;
      }
      
      // 업데이트 성공 시 프로필 갱신
      setProfile({ ...profile, ...updates });
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : '프로필 업데이트 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 프로필 새로고침 함수
  const refreshProfile = async () => {
    await fetchProfile();
  };

  const value = {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// 커스텀 훅
export const useUser = () => {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
};
