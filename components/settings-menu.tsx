"use client"

import { useState, useRef, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface SettingsMenuProps {
  open: boolean
  onClose: () => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  anchorEl: HTMLElement | null
}

export default function SettingsMenu({ open, onClose, fontSize, onFontSizeChange, anchorEl }: SettingsMenuProps) {
  const [tempFontSize, setTempFontSize] = useState(fontSize)
  const menuRef = useRef<HTMLDivElement>(null)

  // Apply changes when slider is adjusted
  useEffect(() => {
    onFontSizeChange(tempFontSize)
  }, [tempFontSize, onFontSizeChange])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && anchorEl !== event.target) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onClose, anchorEl])

  if (!open || !anchorEl) return null

  // Calculate position based on anchor element
  const rect = anchorEl.getBoundingClientRect()

  // Calculate available space
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Default position (below the button)
  let top = rect.bottom + window.scrollY
  let left = rect.left + window.scrollX

  // Check if menu would go off-screen to the right
  const menuWidth = 256 // w-64 = 16rem = 256px
  if (left + menuWidth > viewportWidth) {
    left = viewportWidth - menuWidth - 8 // 8px margin from edge
  }

  // Check if menu would go off-screen to the bottom
  const estimatedMenuHeight = 150 // Approximate height of the menu
  if (top + estimatedMenuHeight > viewportHeight) {
    // Position above the button instead
    top = rect.top - estimatedMenuHeight + window.scrollY
    if (top < 0) {
      // If there's not enough space above either, just position it at the top of the viewport
      top = 8 // 8px margin from top
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#3c3f41] border border-gray-700 shadow-lg p-4 rounded-none w-64"
      style={{ top: `${top}px`, left: `${left}px` }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Editor Settings</h3>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="font-size">Font Size: {tempFontSize}px</Label>
          </div>
          <Slider
            id="font-size"
            min={10}
            max={24}
            step={1}
            value={[tempFontSize]}
            onValueChange={(value) => setTempFontSize(value[0])}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
