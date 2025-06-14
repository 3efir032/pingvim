"use client"

import { useEffect, useRef } from "react"

export default function SimplePixelAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Устанавливаем размер canvas равным размеру окна
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Создаем пиксели
    const pixels = []
    const pixelCount = 200
    const pixelSize = 4

    for (let i = 0; i < pixelCount; i++) {
      pixels.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: `rgba(46, 67, 110, ${Math.random() * 0.5 + 0.5})`,
      })
    }

    // Анимация
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Обновляем и рисуем пиксели
      pixels.forEach((pixel) => {
        // Обновляем позицию
        pixel.x += pixel.vx
        pixel.y += pixel.vy

        // Проверяем границы
        if (pixel.x < 0 || pixel.x > canvas.width) pixel.vx *= -1
        if (pixel.y < 0 || pixel.y > canvas.height) pixel.vy *= -1

        // Рисуем пиксель
        ctx.fillStyle = pixel.color
        ctx.fillRect(pixel.x, pixel.y, pixelSize, pixelSize)
      })

      requestAnimationFrame(animate)
    }

    animate()

    // Обработчик изменения размера окна
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full" style={{ pointerEvents: "none", zIndex: 0 }} />
  )
}
