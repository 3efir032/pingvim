"use client"

import { useEffect, useRef } from "react"

interface SpaceBackgroundProps {
  className?: string
}

export default function SpaceBackground({ className = "" }: SpaceBackgroundProps) {
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

    // Создаем звезды
    const stars: { x: number; y: number; radius: number; speed: number; opacity: number; twinkle: number }[] = []
    const numStars = Math.floor((canvas.width * canvas.height) / 1000) // Количество звезд зависит от размера экрана

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.05,
        opacity: Math.random() * 0.8 + 0.2,
        twinkle: Math.random() * 0.01,
      })
    }

    // Создаем туманности
    const nebulae: { x: number; y: number; radius: number; color: string; opacity: number }[] = []
    const numNebulae = 3

    const colors = ["rgba(41, 121, 255, 0.1)", "rgba(255, 41, 117, 0.1)", "rgba(128, 41, 255, 0.1)"]

    for (let i = 0; i < numNebulae; i++) {
      nebulae.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 300 + 200,
        color: colors[i % colors.length],
        opacity: Math.random() * 0.2 + 0.1,
      })
    }

    // Анимация
    let animationFrameId: number
    let time = 0

    const animate = () => {
      time += 0.01
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Рисуем фон
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#0a0a1a")
      gradient.addColorStop(1, "#1a0a2a")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Рисуем туманности
      nebulae.forEach((nebula) => {
        const grd = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius)
        grd.addColorStop(0, nebula.color)
        grd.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = grd
        ctx.globalAlpha = nebula.opacity * (0.7 + 0.3 * Math.sin(time * 0.2))
        ctx.beginPath()
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalAlpha = 1

      // Рисуем звезды
      stars.forEach((star) => {
        // Обновляем позицию звезды
        star.y += star.speed
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }

        // Мерцание звезд
        star.opacity = Math.max(0.2, Math.min(1, star.opacity + (Math.random() - 0.5) * star.twinkle))

        // Рисуем звезду
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()

        // Добавляем свечение для некоторых звезд
        if (star.radius > 1) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius * 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.3})`
          ctx.fill()
        }
      })

      // Периодически добавляем падающие звезды
      if (Math.random() < 0.01) {
        const shootingStar = {
          x: Math.random() * canvas.width,
          y: 0,
          length: Math.random() * 80 + 20,
          speed: Math.random() * 10 + 5,
          angle: Math.PI / 4 + Math.random() * (Math.PI / 4),
        }

        const drawShootingStar = () => {
          const tailX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length
          const tailY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length

          const gradient = ctx.createLinearGradient(shootingStar.x, shootingStar.y, tailX, tailY)
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)")
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

          ctx.beginPath()
          ctx.moveTo(shootingStar.x, shootingStar.y)
          ctx.lineTo(tailX, tailY)
          ctx.strokeStyle = gradient
          ctx.lineWidth = 2
          ctx.stroke()

          // Обновляем позицию
          shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed
          shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed

          // Продолжаем анимацию, пока звезда не выйдет за пределы экрана
          if (
            shootingStar.x < canvas.width + shootingStar.length &&
            shootingStar.y < canvas.height + shootingStar.length
          ) {
            requestAnimationFrame(drawShootingStar)
          }
        }

        drawShootingStar()
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}
      style={{ pointerEvents: "none" }}
    />
  )
}
