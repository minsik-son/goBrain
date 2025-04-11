"use client";

import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from "@/lib/contexts/auth-context";
import { UserProvider } from "@/lib/contexts/user-context";
import { Providers as ReduxProvider } from './providers'
import { ThemeProvider } from "next-themes";
import { ReactNode } from 'react';
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Analytics/>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReduxProvider>
            <AuthProvider>
              <UserProvider>
                {children}
              </UserProvider>
            </AuthProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
