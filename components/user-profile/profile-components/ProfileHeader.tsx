import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { User } from "lucide-react"

interface ProfileHeaderProps {
  userName: string
  avatarUrl?: string | null
  darkMode: boolean
  toggleDarkMode: () => void
}

export function ProfileHeader({ userName, avatarUrl, darkMode, toggleDarkMode }: ProfileHeaderProps) {
  // 첫 글자를 따서 아바타 폴백 생성
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
      <Avatar className="h-20 w-20">
        <AvatarImage src={avatarUrl || ""} />
        <AvatarFallback className="text-lg">
          {avatarUrl ? "" : getInitials(userName) || <User />}
        </AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-3xl font-bold">{userName}</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
    </div>
  )
} 