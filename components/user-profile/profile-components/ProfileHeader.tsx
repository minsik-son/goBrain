import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface ProfileHeaderProps {
  userName: string
  avatarUrl: string
  darkMode: boolean
  toggleDarkMode: () => void
}

export function ProfileHeader({ userName, avatarUrl, darkMode, toggleDarkMode }: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">{userName || "User"}</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Avatar>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{userName?.slice(0, 2) || "U"}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
} 