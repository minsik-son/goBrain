// src/components/mode-toggle.tsx
'use client'

/**
 * HEXCODE
 * 밝은 자주색 : #e575f5
 * 자주색 : #d794b7 (dark)
 * 노란색 : #ebc88d (light) 
 * 청록색 : #82d2ce (light)
 * 배경색 : #1a1a1a (dark)
 * 푸른색 : #9ddbe6
 */
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/lib/contexts/auth-context'
import { cn } from '@/lib/utils'

// 컴포넌트 Props 인터페이스 정의
interface ModeToggleProps {
  className?: string;
}

// className prop을 받도록 수정하고 기본값 설정
export function ModeToggle({ className }: ModeToggleProps = {}) {
  const [isDark, setIsDark] = useState(false)
  const supabase = createClientComponentClient()
  const { user } = useAuth()

  // 테마 로드 로직 (localStorage, prefers-color-scheme, Supabase DB)
  useEffect(() => {
    const loadDarkModePreference = async () => {
      let initialTheme = 'light'; // 기본값 light

      // 1. 로컬 스토리지 확인
      const savedTheme = localStorage.getItem('theme');
      
      // 2. 사용자 DB 설정 확인 (로그인 상태일 때)
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('is_dark_mode_enabled')
          .eq('id', user.id)
          .maybeSingle(); // single() 대신 maybeSingle() 사용 (데이터 없을 수 있음)

        if (!error && data !== null) { // 오류 없고 데이터가 null이 아닐 때
          initialTheme = data.is_dark_mode_enabled ? 'dark' : 'light';
        } else if (error) {
          console.error("Error fetching dark mode preference from DB:", error);
          // DB 조회 실패 시 로컬 스토리지 또는 시스템 설정 사용
          if (savedTheme && savedTheme !== 'system') {
            initialTheme = savedTheme;
          } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            initialTheme = prefersDark ? 'dark' : 'light';
          }
        } else { // DB에 사용자 설정이 없는 경우
          if (savedTheme && savedTheme !== 'system') {
            initialTheme = savedTheme;
          } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            initialTheme = prefersDark ? 'dark' : 'light';
          }
        }
      } else { // 로그아웃 상태일 때
        if (savedTheme && savedTheme !== 'system') {
          initialTheme = savedTheme;
        } else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          initialTheme = prefersDark ? 'dark' : 'light';
        }
      }

      // 상태 및 HTML 클래스 업데이트
      setIsDark(initialTheme === 'dark');
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark'); // 로컬 스토리지에도 반영
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light'); // 로컬 스토리지에도 반영
      }
    };

    loadDarkModePreference();
  }, [user, supabase]);

  // 테마 토글 로직 (상태, localStorage, Supabase DB 업데이트)
  const toggleTheme = async () => {
    const newIsDark = !isDark;
    const newTheme = newIsDark ? 'dark' : 'light';

    // 즉시 UI 업데이트
    setIsDark(newIsDark);
    localStorage.setItem('theme', newTheme);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 로그인 상태이면 DB 업데이트 시도
    if (user) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ is_dark_mode_enabled: newIsDark })
          .eq('id', user.id);
        
        if (error) {
          console.error('다크모드 설정 저장 실패:', error);
          // 실패 시 롤백 (선택적)
        }
      } catch (dbError) {
        console.error('DB 업데이트 중 예외 발생:', dbError);
      }
    }
  }

  return (
    <button
      onClick={toggleTheme}
      // cn 유틸리티를 사용하여 기본 클래스와 전달받은 className 병합
      className={cn(
        "p-2 rounded-md transition-colors bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700",
        className // 전달받은 className 적용
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  )
}

