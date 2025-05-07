"use client"

import { useEffect, useRef } from "react"

interface PixelAnimationProps {
  className?: string
}

export default function PixelAnimation({ className = "" }: PixelAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Устанавливаем размер canvas равным размеру окна
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Определяем размер пикселя
    const pixelSize = 4
    const cols = Math.ceil(canvas.width / pixelSize)
    const rows = Math.ceil(canvas.height / pixelSize)

    // Создаем массив пикселей
    interface Pixel {
      x: number
      y: number
      targetX: number | null
      targetY: number | null
      color: string
      speed: number
      size: number
      state: "free" | "forming" | "formed" | "releasing"
      formationTime: number
      stayTime: number
    }

    const pixels: Pixel[] = []
    const numPixels = Math.floor((canvas.width * canvas.height) / 400) // Количество пикселей

    // Цвета пикселей
    const colors = ["#2E436E", "#3A5488", "#4A6CA8", "#5A82C8", "#6A98E8"]

    // Создаем пиксели
    for (let i = 0; i < numPixels; i++) {
      pixels.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        targetX: null,
        targetY: null,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 0.5 + Math.random() * 1.5,
        size: pixelSize,
        state: "free",
        formationTime: 0,
        stayTime: 0,
      })
    }

    // Определяем формы букв P и V и пингвина
    const letterP: [number, number][] = []
    const letterV: [number, number][] = []
    const penguin: [number, number][] = []

    // Создаем букву P (7x10 пикселей)
    for (let y = 0; y < 10; y++) {
      letterP.push([0, y]) // Вертикальная линия
      if (y === 0 || y === 4) {
        // Горизонтальные линии сверху и посередине
        for (let x = 1; x < 5; x++) {
          letterP.push([x, y])
        }
      } else if (y < 5) {
        // Правая сторона верхней части
        letterP.push([5, y])
      }
    }

    // Создаем букву V (7x10 пикселей)
    for (let y = 0; y < 10; y++) {
      const offset = Math.floor(y / 2)
      if (y < 8) {
        letterV.push([offset, y]) // Левая диагональ
        letterV.push([6 - offset, y]) // Правая диагональ
      } else {
        // Нижняя точка
        letterV.push([3, y])
      }
    }

    // Создаем пингвина (15x15 пикселей)
    // Тело
    for (let y = 2; y < 15; y++) {
      for (let x = 5; x < 10; x++) {
        penguin.push([x, y])
      }
    }
    // Голова
    for (let y = 0; y < 5; y++) {
      for (let x = 3; x < 12; x++) {
        penguin.push([x, y])
      }
    }
    // Крылья
    for (let y = 5; y < 12; y++) {
      penguin.push([2, y])
      penguin.push([3, y])
      penguin.push([11, y])
      penguin.push([12, y])
    }
    // Ноги
    penguin.push([4, 14])
    penguin.push([5, 14])
    penguin.push([9, 14])
    penguin.push([10, 14])
    // Глаза
    penguin.push([5, 2])
    penguin.push([9, 2])
    // Клюв
    penguin.push([7, 3])

    // Функция для создания формации
    const createFormation = () => {
      // Выбираем случайную форму (P, V или пингвин)
      const formType = Math.random()
      let shape: [number, number][]

      if (formType < 0.4) {
        shape = letterP
      } else if (formType < 0.8) {
        shape = letterV
      } else {
        shape = penguin
      }

      // Выбираем случайное положение на экране
      const offsetX = Math.floor(Math.random() * (canvas.width - shape.length * pixelSize - 100)) + 50
      const offsetY = Math.floor(Math.random() * (canvas.height - shape.length * pixelSize - 100)) + 50

      // Выбираем свободные пиксели для формирования
      const freePixels = pixels.filter((p) => p.state === "free")
      const neededPixels = Math.min(shape.length, freePixels.length)

      if (neededPixels < shape.length * 0.8) {
        // Недостаточно свободных пикселей, пропускаем
        return
      }

      // Назначаем цели для свободных пикселей
      for (let i = 0; i < neededPixels; i++) {
        const pixel = freePixels[i]
        const [shapeX, shapeY] = shape[i]

        pixel.targetX = offsetX + shapeX * pixelSize
        pixel.targetY = offsetY + shapeY * pixelSize
        pixel.state = "forming"
        pixel.formationTime = 0
      }
    }

    // Функция для освобождения пикселей из формации
    const releaseFormation = () => {
      const formedPixels = pixels.filter((p) => p.state === "formed")
      if (formedPixels.length > 0) {
        formedPixels.forEach((pixel) => {
          pixel.state = "releasing"
          pixel.targetX = null
          pixel.targetY = null
        })
      }
    }

    // Планируем создание и освобождение формаций
    let lastFormationTime = 0
    let lastReleaseTime = 0
    const formationInterval = 5000 // 5 секунд между формированиями
    const releaseInterval = 8000 // 8 секунд между освобождениями

    // Анимация
    let animationFrameId: number
    let time = 0

    const animate = (timestamp: number) => {
      time = timestamp
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Проверяем, нужно ли создать новую формацию
      if (time - lastFormationTime > formationInterval) {
        createFormation()
        lastFormationTime = time
      }

      // Проверяем, нужно ли освободить пиксели
      if (time - lastReleaseTime > releaseInterval) {
        releaseFormation()
        lastReleaseTime = time
      }

      // Обновляем и рисуем пиксели
      pixels.forEach((pixel) => {
        // Обновляем положение пикселя в зависимости от его состояния
        if (pixel.state === "forming" && pixel.targetX !== null && pixel.targetY !== null) {
          // Двигаемся к цели
          const dx = pixel.targetX - pixel.x
          const dy = pixel.targetY - pixel.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 1) {
            // Достигли цели
            pixel.x = pixel.targetX
            pixel.y = pixel.targetY
            pixel.state = "formed"
            pixel.stayTime = time
          } else {
            // Двигаемся к цели
            pixel.x += (dx / distance) * pixel.speed
            pixel.y += (dy / distance) * pixel.speed
          }

          pixel.formationTime++
        } else if (pixel.state === "formed") {
          // Остаемся на месте, слегка дрожим
          pixel.x += (Math.random() - 0.5) * 0.2
          pixel.y += (Math.random() - 0.5) * 0.2

          // Проверяем, не пора ли освободить пиксель
          if (time - pixel.stayTime > 10000 + Math.random() * 5000) {
            pixel.state = "releasing"
            pixel.targetX = null
            pixel.targetY = null
          }
        } else if (pixel.state === "releasing" || pixel.state === "free") {
          // Свободное движение
          pixel.state = "free"

          // Случайное движение с небольшим дрейфом
          pixel.x += (Math.random() - 0.5) * pixel.speed
          pixel.y += (Math.random() - 0.5 + 0.1) * pixel.speed // Небольшой дрейф вниз

          // Проверяем границы
          if (pixel.x < 0) pixel.x = canvas.width
          if (pixel.x > canvas.width) pixel.x = 0
          if (pixel.y < 0) pixel.y = canvas.height
          if (pixel.y > canvas.height) pixel.y = 0
        }

        // Рисуем пиксель
        ctx.fillStyle = pixel.color
        ctx.fillRect(Math.floor(pixel.x), Math.floor(pixel.y), pixel.size, pixel.size)
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full ${className}`}
      style={{ pointerEvents: "none", zIndex: 0 }}
    />
  )
}
