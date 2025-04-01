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

export function ModeToggle() {
  const [isDark, setIsDark] = useState(false)
  const supabase = createClientComponentClient()
  const { user } = useAuth()

  useEffect(() => {
    const loadDarkModePreference = async () => {
      const savedTheme = localStorage.getItem('theme') || 'light'
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initialTheme = savedTheme === 'system' ? (prefersDark ? 'dark' : 'light') : savedTheme
      
      setIsDark(initialTheme === 'dark')
      
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('is_dark_mode_enabled')
          .eq('id', user.id)
          .single()

        if (data && !error) {
          setIsDark(data.is_dark_mode_enabled)
          if (data.is_dark_mode_enabled) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
          } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
          }
        }
      }
    }

    loadDarkModePreference()
  }, [user, supabase])

  const toggleTheme = async () => {
    setIsDark(prev => {
      const newTheme = !prev
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
      
      if (newTheme) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      if (user) {
        supabase
          .from('users')
          .update({ is_dark_mode_enabled: newTheme })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) {
              console.error('다크모드 설정 저장 실패:', error)
            }
          })
      }
      
      return newTheme
    })
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md transition-colors bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
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

