"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Github } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AuthFormProps {
  onSuccess: () => void
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const { signIn, signUp, signInWithGitHub, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      if (isResetPassword) {
        // Обработка сброса пароля
        const { error } = await resetPassword(email)
        if (error) {
          setError(error)
        } else {
          setSuccessMessage("Инструкции по сбросу пароля отправлены на ваш email.")
        }
      } else if (isSignUp) {
        // Обработка регистрации
        const { data, error, message } = await signUp(email, password)
        if (error) {
          setError(error)
        } else if (message) {
          setSuccessMessage(message)
        } else if (data?.user) {
          onSuccess()
        }
      } else {
        // Обработка входа
        const { data, error } = await signIn(email, password)
        if (error) {
          setError(error)
        } else if (data?.user) {
          onSuccess()
        }
      }
    } catch (err: any) {
      setError(err.message || "Произошла ошибка")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setError(null)
    setSuccessMessage(null)
    setIsGithubLoading(true)

    try {
      const { error } = await signInWithGitHub()
      if (error) {
        setError(error)
      }
      // Успешная авторизация через GitHub перенаправит пользователя,
      // поэтому здесь не нужно вызывать onSuccess
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при входе через GitHub")
    } finally {
      setIsGithubLoading(false)
    }
  }

  const renderForm = () => {
    if (isResetPassword) {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#2b2b2b] border-gray-700 text-gray-300"
              placeholder="your@email.com"
            />
          </div>

          <Button type="submit" className="w-full bg-[#2E436E] hover:bg-[#3A5488]" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : (
              "Отправить инструкции"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsResetPassword(false)}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              Вернуться к входу
            </button>
          </div>
        </form>
      )
    }

    return (
      <>
        <Button
          type="button"
          variant="outline"
          onClick={handleGitHubSignIn}
          disabled={isGithubLoading}
          className="w-full bg-[#24292e] hover:bg-[#2c3136] text-white border-gray-700 mb-4 flex items-center justify-center"
        >
          {isGithubLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
          Войти через GitHub
        </Button>

        <div className="relative my-4">
          <Separator className="bg-gray-700" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1B1C1F] px-2 text-xs text-gray-400">
            ИЛИ
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#2b2b2b] border-gray-700 text-gray-300"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-400">
                Пароль
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setIsResetPassword(true)}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  Забыли пароль?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#2b2b2b] border-gray-700 text-gray-300"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full bg-[#2E436E] hover:bg-[#3A5488]" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : isSignUp ? (
              "Зарегистрироваться"
            ) : (
              "Войти"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            {isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="w-full max-w-md p-6 bg-[#1B1C1F] rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-center text-gray-200">
        {isResetPassword ? "Сброс пароля" : isSignUp ? "Создать аккаунт" : "Войти в аккаунт"}
      </h2>

      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-900 text-red-300">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-4 bg-green-900/20 border-green-900 text-green-300">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {renderForm()}
    </div>
  )
}
