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
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/docs"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">
                            Documentation
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Learn how to use our API and integration options.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          href="/examples"
                        >
                          <div className="text-sm font-medium leading-none">
                            Examples
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            See practical translation examples.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          href="/tutorials"
                        >
                          <div className="text-sm font-medium leading-none">
                            Tutorials
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Step-by-step guides for common tasks.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          href="/support"
                        >
                          <div className="text-sm font-medium leading-none">
                            Support
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Get help with your translation needs.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
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
        overflow-y-auto transition-transform duration-300 ease-in-out
        md:hidden
        ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* 모바일 메뉴 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <button onClick={toggleMobileMenu} className="text-gray-500 dark:text-gray-400 p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* 사용자 프로필 영역 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
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
            <div className="p-2">
              <p className="text-sm mb-2">로그인 해주세요</p>
              <LoginButton data-login-button />
            </div>
          )}
        </div>
        
        {/* 모바일 메뉴 항목 */}
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
        
        {/* 다크모드 토글 */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-auto p-4">
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
