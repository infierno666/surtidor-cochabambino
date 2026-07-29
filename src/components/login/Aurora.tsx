'use client'

import { motion } from 'framer-motion'

export function Aurora() {
    return (
        <>
            <motion.div
                animate={{
                    x: [0, 120, -80, 0],
                    y: [0, -60, 40, 0],
                    scale: [1, 1.2, 0.9, 1],
                }}
                transition={{
                    duration: 24,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="
          absolute
          -top-64
          -left-56
          h-[700px]
          w-[700px]
          rounded-full
          bg-emerald-500/12
          blur-[140px]
        "
            />

            <motion.div
                animate={{
                    x: [0, -150, 60, 0],
                    y: [0, 100, -50, 0],
                    scale: [1, 0.85, 1.15, 1],
                }}
                transition={{
                    duration: 28,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="
          absolute
          right-[-250px]
          top-[15%]
          h-[650px]
          w-[650px]
          rounded-full
          bg-cyan-500/10
          blur-[160px]
        "
            />

            <motion.div
                animate={{
                    x: [0, 60, -120, 0],
                    y: [0, 80, -80, 0],
                }}
                transition={{
                    duration: 34,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="
          absolute
          bottom-[-280px]
          left-1/3
          h-[700px]
          w-[700px]
          rounded-full
          bg-lime-400/10
          blur-[170px]
        "
            />
        </>
    )
}