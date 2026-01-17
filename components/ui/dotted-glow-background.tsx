import React, { useEffect, useRef } from "react";

interface DottedGlowBackgroundProps {
  className?: string;
  opacity?: number;
  gap?: number;
  radius?: number;
  colorLightVar?: string;
  glowColorLightVar?: string;
  colorDarkVar?: string;
  glowColorDarkVar?: string;
  backgroundOpacity?: number;
  speedMin?: number;
  speedMax?: number;
  speedScale?: number;
}

export const DottedGlowBackground: React.FC<DottedGlowBackgroundProps> = ({
  className = "",
  opacity = 1,
  gap = 25,
  radius = 1,
  colorDarkVar = "#333333", // Default dark mode dot color
  glowColorDarkVar = "#D4AF37", // Default glow color (Gold)
  speedMin = 0.5,
  speedMax = 2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle Resize
    const resize = () => {
        const parent = canvas.parentElement;
        if(parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    };
    window.addEventListener('resize', resize);
    resize();

    // Initialize Dots
    const dots: any[] = [];
    const cols = Math.ceil(canvas.width / gap);
    const rows = Math.ceil(canvas.height / gap);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            // Create a dot for every grid intersection
            dots.push({
                x: i * gap + gap/2,
                y: j * gap + gap/2,
                baseAlpha: 0.2, // Base visibility
                glow: Math.random(), // Current glow state (0-1)
                speed: (Math.random() * (speedMax - speedMin) + speedMin) * (Math.random() > 0.5 ? 1 : -1),
                isGlowing: Math.random() > 0.8 // Only 20% of dots glow actively
            });
        }
    }

    let animationFrameId: number;

    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Resolve Colors
        // In a real scenario we might read CSS vars, but here we use the props directly or fallback
        const baseColorStr = colorDarkVar;
        const glowColorStr = glowColorDarkVar;

        dots.forEach(dot => {
            // Update Animation
            if(dot.isGlowing) {
                dot.glow += dot.speed * 0.015;
                // Bounce effect for glow
                if(dot.glow > 1 || dot.glow < 0) dot.speed *= -1;
            }

            // Calculate Opacity
            // Glowing dots oscillate between 0.3 and 0.8
            // Static dots stay at 0.2
            let currentAlpha = dot.baseAlpha;
            let drawColor = baseColorStr;

            if (dot.isGlowing) {
                const glowIntensity = Math.abs(dot.glow); // 0 to 1
                currentAlpha = 0.2 + (glowIntensity * 0.6);
                drawColor = glowColorStr;
            }

            ctx.globalAlpha = currentAlpha * opacity;
            ctx.fillStyle = drawColor;
            
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Reset global alpha
        ctx.globalAlpha = 1;
        animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [gap, radius, opacity, speedMin, speedMax, colorDarkVar, glowColorDarkVar]);

  return (
    <canvas 
        ref={canvasRef} 
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} 
    />
  );
};