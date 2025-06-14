"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import SimplePixelAnimation from "./simple-pixel-animation"

interface AuthPageProps {
  onAuth: (success: boolean) => void
  defaultPassword: string
}

export default function AuthPage({ onAuth, defaultPassword }: AuthPageProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  // Add a new state variable to track password field visibility
  const [passwordVisible, setPasswordVisible] = useState(false)

  // Обновляем обработчик нажатия клавиш, чтобы символы попадали в поле ввода пароля

  // Заменяем существующий useEffect на следующий:
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Показываем поле пароля при нажатии любой клавиши
      if (!passwordVisible) {
        setPasswordVisible(true)
      }

      // Игнорируем нажатия служебных клавиш
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return
      }

      // Обрабатываем только печатные символы и управляющие клавиши
      if (e.key.length === 1) {
        // Добавляем символ в пароль
        setPassword((prev) => prev + e.key)
        e.preventDefault() // Предотвращаем стандартное поведение
      } else if (e.key === "Backspace") {
        // Удаляем последний символ
        setPassword((prev) => prev.slice(0, -1))
        e.preventDefault()
      } else if (e.key === "Enter") {
        // Проверяем пароль при нажатии Enter
        if (password === defaultPassword) {
          setError(false)
          onAuth(true)
          localStorage.setItem("pycharm-auth", "true")
        } else {
          setError(true)
        }
        e.preventDefault()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [passwordVisible, password, defaultPassword, onAuth])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === defaultPassword) {
      setError(false)
      onAuth(true)
      // Сохраняем состояние авторизации в localStorage
      localStorage.setItem("pycharm-auth", "true")
    } else {
      setError(true)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1B1C1F] text-gray-300 relative overflow-hidden">
      <SimplePixelAnimation />
      <div className="w-72 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <form className="m-0 p-0" onSubmit={handleSubmit}>
          <div className="relative w-full m-0 p-0 group">
            <div
              className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${
                passwordVisible || error ? "opacity-70" : "opacity-0 group-hover:opacity-70"
              } transition-opacity duration-300`}
            >
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (password === defaultPassword) {
                    setError(false)
                    onAuth(true)
                    localStorage.setItem("pycharm-auth", "true")
                  } else {
                    setError(true)
                  }
                }
              }}
              className={`w-full pl-10 bg-[#1E1F22] border-gray-700 ${
                passwordVisible || error ? "opacity-70" : "opacity-0 hover:opacity-70"
              } transition-opacity duration-300 ${error ? "border-red-500" : ""}`}
              autoFocus={passwordVisible}
            />
          </div>

          <button type="submit" className="hidden">
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
