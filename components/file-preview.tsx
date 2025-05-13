"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import type { FileType } from "@/types/file-system"

interface FilePreviewProps {
  file: FileType | null
}

export default function FilePreview({ file }: FilePreviewProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1E1F22] text-gray-300">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1E1F22] text-gray-500">
        <p>Выберите файл для предварительного просмотра</p>
      </div>
    )
  }

  // Определяем тип файла по расширению или содержимому
  const isMarkdown = file.name.endsWith(".md") || file.name.endsWith(".markdown")
  const isHtml = file.name.endsWith(".html") || file.name.endsWith(".htm")
  const isImage = /\.(jpe?g|png|gif|svg|webp)$/i.test(file.name)

  // Функция для рендеринга Markdown
  const renderMarkdown = (content: string) => {
    // Простая реализация Markdown рендеринга
    // Заголовки
    const html = content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2">$1</h3>')
      // Жирный текст
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      // Курсив
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      // Ссылки
      .replace(/\[([^\]]+)\]$$([^)]+)$$/gim, '<a href="$2" class="text-blue-400 hover:underline">$1</a>')
      // Списки
      .replace(/^\s*\*\s(.*$)/gim, '<li class="ml-4">$1</li>')
      // Параграфы
      .replace(/^(?!<h|<li)(.*$)/gim, '<p class="mb-2">$1</p>')

    return html
  }

  if (isMarkdown) {
    return (
      <div className="p-4 bg-white text-black h-full overflow-auto">
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(file.content) }} />
      </div>
    )
  }

  if (isHtml) {
    return (
      <div className="p-4 bg-white text-black h-full overflow-auto">
        <div dangerouslySetInnerHTML={{ __html: file.content }} />
      </div>
    )
  }

  if (isImage) {
    // Предполагаем, что содержимое - это URL или base64 изображения
    return (
      <div className="flex items-center justify-center h-full bg-[#1E1F22]">
        <img src={file.content || "/placeholder.svg"} alt={file.name} className="max-w-full max-h-full" />
      </div>
    )
  }

  // Для обычных текстовых файлов
  return (
    <div className="p-4 bg-white text-black h-full overflow-auto">
      <pre className="whitespace-pre-wrap">{file.content}</pre>
    </div>
  )
}
