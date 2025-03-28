"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Home, Settings, CreditCard, History, UserIcon, LogOut } from "lucide-react"
import Link from "next/link"
import { useSidebar } from "@/lib/contexts/sidebar-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/redux/hooks"

export function UserSidebar() {
  const { expanded, setExpanded } = useSidebar()
  const userData = useAppSelector(state => state.user)
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  
  const navItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
    },
    {
      title: "Profile",
      icon: UserIcon,
      href: "#profile",
      active: true,
    },
    {
      title: "Billing",
      icon: CreditCard,
      href: "#billing",
    },
    {
      title: "History",
      icon: History,
      href: "#history",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "#settings",
    },
  ]
  
  return (
    <aside
      className={cn(
        "h-screen bg-card border-r sticky top-0 overflow-y-auto no-scrollbar",
        expanded ? "w-64" : "w-[70px]",
        "transition-all duration-300 ease-in-out"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center justify-between p-2">
          {expanded && (
            <span className="font-semibold text-lg pl-2">User Menu</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className={cn("ml-auto")}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <nav className="flex-1 p-2">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center h-10 px-2 rounded-md hover:bg-accent transition-colors",
                    item.active && "bg-accent",
                    expanded ? "justify-start" : "justify-center"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {expanded && <span className="ml-2">{item.title}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-2 mt-auto">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              "flex items-center h-10 w-full text-red-500 hover:bg-red-50 hover:text-red-600",
              expanded ? "justify-start pl-2" : "justify-center"
            )}
          >
            <LogOut className="h-5 w-5" />
            {expanded && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
} 