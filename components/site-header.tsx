"use client"
/**
 * 
앞으로 해야할부분. 
1. 유저 이름 public users에서 가져오기
2. signup 페이지에서 preffered_language public users 테이블에 추가하기
 */
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchUserData } from "@/lib/redux/slices/userSlice"
import LoginButton from "@/components/auth/LoginButton"
import { Menu, Home, BookOpen, CreditCard, Settings, LogOut, X } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/contexts/auth-context"

export function SiteHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { theme, setTheme } = useTheme()
  
  const { user, signOut: contextSignOut, isLoading: authLoading } = useAuth();
  const { userName, avatarUrl } = useAppSelector((state) => state.user)
  const dispatch = useAppDispatch()
  
  useEffect(() => {
    if (user && !userName && !authLoading) {
      dispatch(fetchUserData())
    }
  }, [user, userName, authLoading, dispatch])
  
  const handleSignOut = async () => {
    await contextSignOut(); 
    router.push('/');
  }
  
  const handleNavigation = (path: string, requiresAuth: boolean = false) => {
    if (requiresAuth && !user) { 
      setMobileMenuOpen(false);
      const loginButton = document.querySelector('[data-login-button]') as HTMLButtonElement;
      if (loginButton) {
        loginButton.click();
      }
      return;
    }
    router.push(path);
    setMobileMenuOpen(false);
  };
  
  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
  }
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }
  
  const toggleDarkMode = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  }
  
  // 로그인 버튼 트리거 함수
  const triggerLoginDialog = () => {
    const loginButton = document.querySelector('[data-login-button]') as HTMLButtonElement;
    if (loginButton) {
      loginButton.click();
    }
    setMobileMenuOpen(false); // 메뉴 닫기
  };
  
  return (
    <header className="w-full border-b bg-background z-10 sticky top-0">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold inline-block">GoBrain</span>
          </Link>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      pathname === "/" && "text-primary font-medium"
                    )}
                  >
                    Translator
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink 
                    className={cn(
                      navigationMenuTriggerStyle(),
                      pathname === "/pricing" && "text-primary font-medium"
                    )}
                  >
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ModeToggle className="hidden md:flex" />
          
          {/* 모바일 메뉴 토글 버튼 */}
          <Button variant="ghost" className="md:hidden p-2" onClick={toggleMobileMenu}>
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* 데스크탑 로그인 상태에 따라 다른 UI 표시 */}
          <div className="hidden md:block">
            {user ? (
              <div className="relative">
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl || user.user_metadata?.avatar_url || ""} alt={userName || user.user_metadata?.full_name || "User"} />
                        <AvatarFallback>{getInitials(userName || user.user_metadata?.full_name)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {userName || user.user_metadata?.full_name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <LoginButton data-login-button />
            )}
          </div>
        </div>
      </div>
      
      {/* 모바일 메뉴 - 슬라이드 오버레이 */}
      <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
           onClick={toggleMobileMenu}>
      </div>
      
      {/* 모바일 메뉴 - 슬라이드 패널 */}
      <div className={`
        fixed top-0 right-0 bottom-0 z-50 
        w-72 bg-background dark:bg-[#1a1a1a]
        transition-transform duration-300 ease-in-out
        md:hidden flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* 통합된 헤더/사용자 프로필 영역 */} 
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 relative flex-shrink-0">
          {/* X 버튼 (오른쪽 상단) */} 
          <button 
            onClick={toggleMobileMenu} 
            className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 p-2"
          >
            <X className="h-5 w-5" />
          </button>
          
          {user ? (
            <Link href="/profile" className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" onClick={toggleMobileMenu}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl || user.user_metadata?.avatar_url || ""} alt={userName || user.user_metadata?.full_name || "User"} />
                <AvatarFallback>{getInitials(userName || user.user_metadata?.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{userName || user.user_metadata?.full_name || "User"}</p>
                <p className="text-sm text-muted-foreground">로그인 되어 있습니다</p>
              </div>
            </Link>
          ) : (
            /* 로그인 유도 영역 (클릭 가능) */ 
            <button 
              className="flex items-center space-x-3 p-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md" 
              onClick={triggerLoginDialog}
            >
              <Avatar className="h-12 w-12 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {/* 기본 아이콘 또는 이니셜 등 */} 
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-gray-500 dark:text-gray-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </Avatar>
              <div>
                <p className="text-sm font-medium">로그인 해주세요</p>
              </div>
            </button>
          )}
        </div>
        
        {/* 메뉴 내용 (스크롤 가능 영역) */}
        <div className="flex-grow overflow-y-auto">
          <div className="py-2">
            <button
              className="flex w-full items-center space-x-3 p-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => handleNavigation("/")}
            >
              <Home className="h-5 w-5" />
              <span>GoBrain 홈</span>
            </button>
            <button
              className="flex w-full items-center space-x-3 p-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => handleNavigation("/profile", true)}
            >
              <BookOpen className="h-5 w-5" />
              <span>번역 기록</span>
            </button>
            <button
              className="flex w-full items-center space-x-3 p-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => handleNavigation("/pricing")}
            >
              <CreditCard className="h-5 w-5" />
              <span>Pricing</span>
            </button>
          </div>
          
          {/* 설정 및 로그아웃 */}
          {user && (
            <div className="border-t border-gray-200 dark:border-gray-800 py-2">
              <button
                className="flex w-full items-center space-x-3 p-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleNavigation("/settings")}
              >
                <Settings className="h-5 w-5" />
                <span>설정</span>
              </button>
              <button 
                onClick={() => {
                  handleSignOut();
                  toggleMobileMenu();
                }} 
                className="flex w-full items-center space-x-3 p-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <LogOut className="h-5 w-5" />
                <span>로그아웃</span>
              </button>
            </div>
          )}
        </div>
        
        {/* 다크모드 토글 (패널 하단 고정) */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm">다크모드</span>
            <Switch 
              id="mobile-dark-mode-toggle"
              checked={theme === 'dark'} 
              onCheckedChange={toggleDarkMode} 
            />
          </div>
        </div>
      </div>
    </header>
  )
}
