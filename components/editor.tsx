"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

interface EditorProps {
  content: string
  onChange: (newContent: string) => void
  showLineNumbers?: boolean
  fontSize?: number
}

export default function Editor({ content, onChange, showLineNumbers = false, fontSize = 14 }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const cursorPositionRef = useRef<{ start: number; end: number } | null>(null)
  const [lineCount, setLineCount] = useState(1)

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
        <div key={i} className="leading-6" style={{ fontSize: `${fontSize}px` }}>
          {i}
        </div>,
      )
    }
    return numbers
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

  return (
    <div ref={editorRef} className="h-full w-full bg-[#2b2b2b] flex relative">
      {showLineNumbers && (
        <div
          id="line-numbers"
          className="py-4 pr-2 pl-4 text-right bg-[#313335] text-gray-500 select-none font-mono overflow-hidden"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "50px",
            zIndex: 10,
            pointerEvents: "none",
            fontSize: `${fontSize}px`,
          }}
        >
          {renderLineNumbers()}
        </div>
      )}
      <div className="flex-1 relative">
        <pre
          className="absolute top-0 left-0 right-0 bottom-0 p-4 font-mono text-transparent whitespace-pre-wrap break-all overflow-hidden"
          style={{
            paddingLeft: showLineNumbers ? "60px" : "24px", // Increased left padding
            fontSize: `${fontSize}px`,
          }}
        >
          {content + " "} {/* Space to ensure cursor visibility at the end */}
        </pre>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onScroll={handleScroll}
          className="absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-transparent outline-none resize-none font-mono text-gray-300 p-4 leading-6 z-20"
          style={{
            paddingLeft: showLineNumbers ? "60px" : "24px", // Increased left padding
            fontSize: `${fontSize}px`,
          }}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
