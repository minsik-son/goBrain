import { supabase } from "@/lib/supabaseClient"

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })
  
  if (error) throw error
  return data // 로그인 URL 반환
}

export async function getUser() {
  const { data: user, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}
//이메일 로그인 기능
export async function signInWithEmail(email: string, password: string) {
    const { data: user, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return user
  }
  
//비밀번호 없는 Magic Link 로그인 (이메일로 링크 전송)
  export async function signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
  }
  
//로그아웃 기능
  export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    window.location.reload() // 로그아웃 후 새로고침
  }
  