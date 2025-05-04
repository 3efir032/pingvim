"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface EditorProps {
  content: string
  onChange: (newContent: string) => void
  showLineNumbers?: boolean
}

export default function Editor({ content, onChange, showLineNumbers = false }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [lines, setLines] = useState<string[]>([])

  useEffect(() => {
    // Set cursor at the end when content changes
    if (textareaRef.current) {
      const textarea = textareaRef.current
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length
    }

    // Update line count
    setLines(content.split("\n"))
  }, [content])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    onChange(newContent)
    setLines(newContent.split("\n"))
  }

  return (
    <div className="h-full w-full bg-[#2b2b2b] flex">
      {showLineNumbers && (
        <div className="py-4 pr-2 pl-4 text-right bg-[#313335] text-gray-500 select-none font-mono">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
          {/* Add an extra line number if the last line is not empty or if there are no lines */}
          {(lines.length === 0 || lines[lines.length - 1] !== "") && (
            <div className="leading-6">{lines.length + 1}</div>
          )}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        className="w-full h-full bg-transparent outline-none resize-none font-mono text-gray-300 p-4 leading-6"
        spellCheck={false}
      />
    </div>
  )
}
