"use client"

import { useAuth } from "@/hooks/use-auth"
import { LogOut, Settings, Lock } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserMenuProps {
  onChangePassword: () => void
  onLockEditor: () => void
}

export default function UserMenu({ onChangePassword, onLockEditor }: UserMenuProps) {
  const { user, signOut } = useAuth()

  // Получаем инициалы пользователя из email или имени
  const getUserInitials = () => {
    if (!user) return "U"

    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }

    return "U"
  }

  // Получаем аватар пользователя
  const getUserAvatar = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    return ""
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 hover:bg-gray-600 rounded-full" title="Меню пользователя">
          <Avatar className="h-6 w-6">
            <AvatarImage src={getUserAvatar() || "/placeholder.svg"} alt="User" />
            <AvatarFallback className="bg-[#2E436E] text-xs">{getUserInitials()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1B1C1F] border-gray-700 text-gray-300">
        {user && (
          <div className="px-2 py-1.5 border-b border-gray-700">
            <p className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</p>
            {user.user_metadata?.full_name && user.email && <p className="text-xs text-gray-400">{user.email}</p>}
          </div>
        )}
        <DropdownMenuItem
          onClick={onChangePassword}
          className="hover:bg-[#2E436E] cursor-pointer focus:bg-[#2E436E] focus:text-gray-300"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Сменить пароль</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onLockEditor}
          className="hover:bg-[#2E436E] cursor-pointer focus:bg-[#2E436E] focus:text-gray-300"
        >
          <Lock className="mr-2 h-4 w-4" />
          <span>Заблокировать редактор</span>
        </DropdownMenuItem>
        {user && (
          <DropdownMenuItem
            onClick={() => signOut()}
            className="hover:bg-[#2E436E] cursor-pointer focus:bg-[#2E436E] focus:text-gray-300"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Выйти</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
