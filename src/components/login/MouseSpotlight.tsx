'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect } from 'react'

export function MouseSpotlight() {
    const mouseX = useMotionValue(-300)
    const mouseY = useMotionValue(-300)

    const x = useSpring(mouseX, {
        stiffness: 120,
        damping: 25,
        mass: 0.5,
    })

    const y = useSpring(mouseY, {
        stiffness: 120,
        damping: 25,
        mass: 0.5,
    })

    useEffect(() => {
        const move = (e: MouseEvent) => {
            mouseX.set(e.clientX - 250)
            mouseY.set(e.clientY - 250)
        }

        window.addEventListener('mousemove', move)

        return () => {
            window.removeEventListener('mousemove', move)
        }
    }, [mouseX, mouseY])

    return (
        <motion.div
            animate={{
                backgroundColor: [
                    "rgba(16,185,129,.12)",
                    "rgba(34,211,238,.10)",
                    "rgba(132,204,22,.12)",
                    "rgba(16,185,129,.12)"
                ]
            }}
            transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear"
            }}
            style={{
                x,
                y
            }}
            className="
    pointer-events-none
    fixed
    z-0
    h-[500px]
    w-[500px]
    rounded-full
    blur-[140px]
    mix-blend-screen
    "
        />
    )
}