// Утилита для безопасного доступа к localStorage
export const safeLocalStorage = {
  getItem: (key: string, defaultValue = ""): string => {
    if (typeof window === "undefined") {
      return defaultValue
    }

    try {
      const item = localStorage.getItem(key)
      return item !== null ? item : defaultValue
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error)
      return defaultValue
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (typeof window === "undefined") {
      return false
    }

    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error)
      return false
    }
  },

  removeItem: (key: string): boolean => {
    if (typeof window === "undefined") {
      return false
    }

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error)
      return false
    }
  },
}
