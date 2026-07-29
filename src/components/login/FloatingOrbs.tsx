'use client'

import { motion } from 'framer-motion'

const ORBS = [
    {
        size: 220,
        top: '12%',
        left: '8%',
        color: 'bg-emerald-500/10',
        duration: 18,
    },
    {
        size: 150,
        top: '70%',
        left: '25%',
        color: 'bg-cyan-400/10',
        duration: 14,
    },
    {
        size: 180,
        top: '22%',
        right: '12%',
        color: 'bg-lime-400/10',
        duration: 20,
    },
]
export function FloatingOrbs() {
    return (
        <>
            {ORBS.map((orb, index) => (
                <motion.div
                    key={index}
                    animate={{
                        y: [-25, 30, -25],
                        x: [-15, 20, -15],
                        scale: [1, 1.12, 1],
                    }}
                    transition={{
                        duration: orb.duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{
                        width: orb.size,
                        height: orb.size,
                        top: orb.top,
                        left: orb.left,
                        right: orb.right,
                    }}
                    className={`
            absolute
            rounded-full
            blur-[90px]
            ${orb.color}
          `}
                />
            ))}
        </>
    )
} 