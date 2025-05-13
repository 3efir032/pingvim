"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Eye, Edit2 } from "lucide-react"
import FilePreview from "./file-preview"
import type { FileType } from "@/types/file-system"

interface EditorProps {
  content: string
  onChange: (newContent: string) => void
  showLineNumbers?: boolean
  fontSize?: number
  file?: FileType | null
}

export default function Editor({ content, onChange, showLineNumbers = false, fontSize = 13, file }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const cursorPositionRef = useRef<{ start: number; end: number } | null>(null)
  const [lineCount, setLineCount] = useState(1)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update line count when content changes
  useEffect(() => {
    if (!showLineNumbers) return

    // Count the number of lines in the content
    const contentLines = content.split("\n").length

    // Get the visible height of the editor
    if (textareaRef.current && editorRef.current) {
      const textarea = textareaRef.current
      const editorHeight = editorRef.current.clientHeight

      // Calculate how many lines would fit in the editor based on line height
      const computedStyle = window.getComputedStyle(textarea)
      const lineHeight = Number.parseInt(computedStyle.lineHeight) || 24 // Default to 24px if not set

      // Calculate the maximum number of visible lines
      const maxVisibleLines = Math.ceil(editorHeight / lineHeight)

      // Set the line count to the maximum of content lines and visible lines
      setLineCount(Math.max(contentLines, maxVisibleLines))
    } else {
      setLineCount(contentLines)
    }

    // Restore cursor position after content update
    if (textareaRef.current && cursorPositionRef.current) {
      const textarea = textareaRef.current

      // Only restore if the cursor position is within the content length
      if (cursorPositionRef.current.start <= content.length) {
        textarea.selectionStart = cursorPositionRef.current.start
        textarea.selectionEnd = Math.min(cursorPositionRef.current.end, content.length)
      }

      // Reset the saved position
      cursorPositionRef.current = null
    }
  }, [content, showLineNumbers])

  // Handle textarea scroll to sync line numbers
  const handleScroll = () => {
    if (!showLineNumbers || !textareaRef.current) return
    const lineNumbersElement = document.getElementById("line-numbers")
    if (lineNumbersElement) {
      lineNumbersElement.scrollTop = textareaRef.current.scrollTop
    }

    // Синхронизируем прокрутку pre с textarea
    const preElement = document.getElementById("syntax-highlight")
    if (preElement && textareaRef.current) {
      preElement.scrollTop = textareaRef.current.scrollTop
      preElement.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target

    // Save current cursor position before updating content
    cursorPositionRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    }

    const newContent = textarea.value
    onChange(newContent)
  }

  // Generate line numbers
  const renderLineNumbers = () => {
    const numbers = []
    for (let i = 1; i <= lineCount; i++) {
      numbers.push(
        <div
          key={i}
          style={{
            fontSize: `${fontSize}px`,
            height: "24px",
            lineHeight: "24px",
          }}
        >
          {i}
        </div>,
      )
    }
    return numbers
  }

  // Format content with colors
  const formatContentWithColors = () => {
    if (!content) return ""

    // Разбиваем текст на строки
    const lines = content.split("\n")
    const formattedLines = []
    let inTripleQuotes = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Проверяем, есть ли в строке открывающие или закрывающие тройные кавычки
      const hasTripleQuotes = line.includes('"""')

      // Если в строке есть тройные кавычки, меняем состояние
      if (hasTripleQuotes) {
        // Подсчитываем количество тройных кавычек в строке
        const matches = line.match(/"""/g) || []
        const count = matches.length

        // Если нечетное количество, меняем состояние
        if (count % 2 !== 0) {
          inTripleQuotes = !inTripleQuotes
        }

        // Всегда делаем строку с тройными кавычками зеленой
        formattedLines.push(`<span style="color: #4CAF50;">${escapeHtml(line)}</span>`)
      }
      // Если строка начинается с #, делаем текст желтым
      else if (line.trim().startsWith("#")) {
        formattedLines.push(`<span style="color: #FFEB3B;">${escapeHtml(line)}</span>`)
      }
      // Если мы внутри блока с тройными кавычками, делаем текст зеленым
      else if (inTripleQuotes) {
        formattedLines.push(`<span style="color: #4CAF50;">${escapeHtml(line)}</span>`)
      }
      // Обычный текст
      else {
        formattedLines.push(escapeHtml(line))
      }
    }

    return formattedLines.join("\n")
  }

  // Экранирование HTML-символов
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }

  // Add scroll event listener
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.addEventListener("scroll", handleScroll)
      return () => {
        textarea.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  // Если мы не на клиенте, показываем заглушку
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1E1F22] text-gray-300">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2E436E]"></div>
      </div>
    )
  }

  return (
    <div ref={editorRef} className="h-full w-full bg-[#1E1F22] flex flex-col relative">
      {/* Toolbar */}
      <div className="flex items-center justify-end bg-[#1B1C1F] px-2 py-1 border-b border-gray-700">
        <button
          className={`p-1 rounded ${isPreviewMode ? "bg-[#2E436E] text-white" : "hover:bg-gray-600 text-gray-400"}`}
          onClick={() => setIsPreviewMode(true)}
          title="Предварительный просмотр"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          className={`p-1 rounded ml-1 ${!isPreviewMode ? "bg-[#2E436E] text-white" : "hover:bg-gray-600 text-gray-400"}`}
          onClick={() => setIsPreviewMode(false)}
          title="Редактирование"
        >
          <Edit2 className="h-4 w-4" />
        </button>
      </div>

      {isPreviewMode ? (
        <FilePreview file={file || { id: "temp", name: "temp.txt", content, parentId: null }} />
      ) : (
        <div className="flex-1 relative">
          {showLineNumbers && (
            <div
              id="line-numbers"
              className="py-4 pr-2 pl-2 text-right bg-[#1E1F22] text-gray-500 select-none font-mono overflow-hidden border-r border-gray-700"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: "30px",
                zIndex: 10,
                pointerEvents: "none",
                fontSize: `${fontSize}px`,
                lineHeight: "24px",
              }}
            >
              {renderLineNumbers()}
            </div>
          )}
          <div className="flex-1 relative">
            <pre
              id="syntax-highlight"
              className="absolute top-0 left-0 right-0 bottom-0 font-mono whitespace-pre-wrap break-all overflow-auto"
              style={{
                paddingLeft: showLineNumbers ? "40px" : "24px",
                paddingTop: "16px", // Отступ сверху для выравнивания с номерами строк
                paddingRight: "24px",
                paddingBottom: "16px",
                fontSize: `${fontSize}px`,
                color: "#e6e6e6",
                margin: 0,
                border: "none",
                lineHeight: "24px", // Фиксированная высота строки
                backgroundColor: "#1E1F22",
              }}
              dangerouslySetInnerHTML={{ __html: formatContentWithColors() + " " }}
            />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onScroll={handleScroll}
              className="absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-transparent outline-none resize-none font-mono text-transparent caret-white"
              style={{
                paddingLeft: showLineNumbers ? "40px" : "24px",
                paddingTop: "16px", // Отступ сверху для выравнивания с номерами строк
                paddingRight: "24px",
                paddingBottom: "16px",
                fontSize: `${fontSize}px`,
                lineHeight: "24px", // Фиксированная высота строки
                caretColor: "white",
              }}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
