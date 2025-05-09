// Определяем, находимся ли мы в среде предпросмотра
export const isPreviewEnvironment =
  process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development" || typeof window !== "undefined"

// Определяем, находимся ли мы на сервере
export const isServer = typeof window === "undefined"
