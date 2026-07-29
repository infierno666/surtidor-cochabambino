'use client'

import { Aurora } from './Aurora'
import { FloatingOrbs } from './FloatingOrbs'
import { GradientLines } from './GradientLines'
import { GridPattern } from './GridPattern'
import { MouseSpotlight } from './MouseSpotlight'
import { NoiseTexture } from './NoiseTexture'

export function AnimatedBackground() {
    return (
        <>
            <div className="fixed inset-0 -z-50 overflow-hidden bg-zinc-950">
                <Aurora />

                <FloatingOrbs />

                <GridPattern />

                <GradientLines />

                <NoiseTexture />
            </div>

            <MouseSpotlight />
        </>
    )
}