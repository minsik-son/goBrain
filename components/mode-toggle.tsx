// src/components/mode-toggle.tsx
'use client'

import { useEffect, useState } from 'react'

export function ModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <button
      onClick={() => setIsDark(prev => !prev)}
      className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded"
    >
      {isDark ? '🌙 Dark' : '☀️ Light'}
    </button>
  )
}
