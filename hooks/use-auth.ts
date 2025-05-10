"use client"

import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import type { User, AuthError } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabase()

  useEffect(() => {
    // Проверяем текущую сессию
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error("Error checking auth session:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Подписываемся на изменения аутентификации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Функция для получения понятного сообщения об ошибке
  const getErrorMessage = (error: AuthError): string => {
    // Обрабатываем известные коды ошибок
    switch (error.message) {
      case "Invalid login credentials":
        return "Неверный email или пароль. Если вы только что зарегистрировались, проверьте почту для подтверждения аккаунта."
      case "Email not confirmed":
        return "Email не подтвержден. Пожалуйста, проверьте вашу почту и перейдите по ссылке подтверждения."
      case "User already registered":
        return "Пользователь с таким email уже зарегистрирован. Попробуйте войти или восстановить пароль."
      case "Password should be at least 6 characters":
        return "Пароль должен содержать не менее 6 символов."
      default:
        return error.message || "Произошла ошибка при авторизации."
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { data: null, error: getErrorMessage(error) }
      }

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || "Произошла ошибка при входе" }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) {
        return { data: null, error: getErrorMessage(error) }
      }

      // Проверяем, требуется ли подтверждение email
      if (data?.user && !data.user.confirmed_at) {
        return {
          data,
          error: null,
          message:
            "На ваш email отправлена ссылка для подтверждения. Пожалуйста, проверьте почту и подтвердите регистрацию.",
        }
      }

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || "Произошла ошибка при регистрации" }
    }
  }

  const signInWithGitHub = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        return { data: null, error: getErrorMessage(error) }
      }

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || "Произошла ошибка при входе через GitHub" }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        return { error: getErrorMessage(error) }
      }

      return { error: null }
    } catch (error: any) {
      return { error: error.message || "Произошла ошибка при отправке ссылки для сброса пароля" }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      console.error("Error signing out:", error.message)
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGitHub,
    resetPassword,
    signOut,
  }
}
