"use client"
/**
 * 
앞으로 해야할부분. 
1. 유저 이름 public users에서 가져오기
2. signup 페이지에서 preffered_language public users 테이블에 추가하기
 */
import { useState, useEffect } from "react"
import { siteConfig } from "@/config/site"
import { MainNav } from "@/components/main-nav"
import LoginButton from "@/components/auth/LoginButton"
import LogoutButton from "@/components/auth/LogoutButton"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ChevronDown, ChevronUp } from "lucide-react"

export function SiteHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false) // 드롭다운 상태 관리
  const supabase = createClientComponentClient()


  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession()
      console.log(data)
      setIsLoggedIn(!!data.session)

      if (data.session) {
        const { data: userData } = await supabase.auth.getUser()
        setUser(userData.user)
        setAvatarUrl(userData.user?.user_metadata.avatar_url)
        console.log(userData.user?.user_metadata.avatar_url)
      }
    }

    fetchSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoggedIn(!!session)
      if (session) {
        const { data: userData } = await supabase.auth.getUser()
        setUser(userData.user)
      } else {
        setUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])


  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = document.getElementById("dropdown-menu");
      const button = document.getElementById("dropdown-button");

      // 드롭다운 버튼이나 드롭다운 메뉴 외부를 클릭했을 때 드롭다운 닫기
      if (dropdownOpen && dropdown && button && !dropdown.contains(target) && !button.contains(target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 bg-cyan-950 text-white px-10">
        <MainNav items={siteConfig.mainNav}/>
        <div className="flex flex-1 items-center justify-end space-x-4 relative">
          <nav className="flex items-center space-x-2">
            {isLoggedIn && (
              <div className="relative">
                {/* 유저 정보 버튼 */}
                <button
                  id="dropdown-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white-100 rounded-lg focus:outline-none text-white"
                >
                  <span>Hello, {user?.user_metadata?.name || "User"}</span>
                  {dropdownOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </button>

                {/* 드롭다운 메뉴 */}
                {dropdownOpen && (
                  <div id="dropdown-menu" className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
                    <ul className="py-2 text-sm text-gray-700">
                      <li>
                        <a href="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</a>
                      </li>
                      <li>
                        <a href="/subscription" className="block px-4 py-2 hover:bg-gray-100">Subscribe</a>
                      </li>
                      <li>
                        <button
                          onClick={async () => {
                            await supabase.auth.signOut()
                            setIsLoggedIn(false)
                            setUser(null)
                          }}
                          className="w-full text-left block px-4 py-2 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            {isLoggedIn ? null : <LoginButton />}
          </nav>
        </div>
      </div>
    </header>
  )
}
