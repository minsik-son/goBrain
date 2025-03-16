"use client";

import type { Metadata } from 'next'
import './globals.css'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import { AuthProvider } from "@/lib/contexts/auth-context";
import { UserProvider } from "@/lib/contexts/user-context";

/*
export const metadata: Metadata = {
  title: 'goBrain',
  description: 'AI Translator',
  generator: 'goBrain',
}
*/
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  //Google Login Layout Code
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (data?.user) setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setUser(session.user);
      else setUser(null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);


  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
