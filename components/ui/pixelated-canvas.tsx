import React, { useRef, useEffect, useState, useMemo } from 'react';

interface PixelatedCanvasProps {
  src: string;
  width?: number;
  height?: number;
  cellSize?: number;
  dotScale?: number;
  shape?: 'square' | 'circle';
  backgroundColor?: string;
  dropoutStrength?: number; // 0 to 1 chance of skipping a pixel per frame
  interactive?: boolean;
  distortionStrength?: number; // How far pixels move
  distortionRadius?: number;
  distortionMode?: 'swirl' | 'lens' | 'repel';
  followSpeed?: number; // 0 to 1 (1 = instant)
  jitterStrength?: number; // max pixel offset
  jitterSpeed?: number; // 0 to 1 (how often jitter updates)
  sampleAverage?: boolean; // If true, averages pixels in the cell instead of center sampling
  tintColor?: string; // Hex color to tint the image
  tintStrength?: number; // 0 to 1 tint intensity
  className?: string;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
};

export const PixelatedCanvas: React.FC<PixelatedCanvasProps> = ({
  src,
  width = 400,
  height = 500,
  cellSize = 5,
  dotScale = 0.9,
  shape = 'square',
  backgroundColor = '#000000',
  interactive = true,
  distortionStrength = 0,
  distortionRadius = 80,
  distortionMode = 'lens',
  dropoutStrength = 0,
  followSpeed = 0.1,
  jitterStrength = 0,
  jitterSpeed = 1,
  sampleAverage = true, // Default to high quality
  tintColor = '#FFFFFF',
  tintStrength = 0,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridData, setGridData] = useState<{x:number, y:number, r:number, g:number, b:number}[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Physics State
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const focusRef = useRef({ x: width/2, y: height/2 });
  const animationRef = useRef<number>(0);
  const jitterMapRef = useRef<Float32Array | null>(null);

  // Tint Color Memo
  const tintRgb = useMemo(() => hexToRgb(tintColor), [tintColor]);

  // 1. Load and Process Image Data
  useEffect(() => {
    setIsLoaded(false);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    
    img.onload = () => {
        // Create an offscreen canvas to read pixel data
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (!tempCtx) return;

        // Draw the image at the target dimensions to simplify grid logic
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCtx.drawImage(img, 0, 0, width, height);

        const imgData = tempCtx.getImageData(0, 0, width, height).data;
        const processedGrid = [];

        const cols = Math.ceil(width / cellSize);
        const rows = Math.ceil(height / cellSize);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                let r=0, g=0, b=0, a=0, count=0;

                if (sampleAverage) {
                    // Average all pixels in the cell
                    const startX = x * cellSize;
                    const startY = y * cellSize;
                    const endX = Math.min(startX + cellSize, width);
                    const endY = Math.min(startY + cellSize, height);

                    for (let py = startY; py < endY; py++) {
                        for (let px = startX; px < endX; px++) {
                            const idx = (py * width + px) * 4;
                            if (imgData[idx+3] > 20) { // Ignore transparent pixels
                                r += imgData[idx];
                                g += imgData[idx+1];
                                b += imgData[idx+2];
                                count++;
                            }
                        }
                    }
                    if (count > 0) {
                        r = Math.round(r/count);
                        g = Math.round(g/count);
                        b = Math.round(b/count);
                    }
                } else {
                    // Center Sample
                    const cx = Math.min(x * cellSize + Math.floor(cellSize/2), width-1);
                    const cy = Math.min(y * cellSize + Math.floor(cellSize/2), height-1);
                    const idx = (cy * width + cx) * 4;
                    r = imgData[idx];
                    g = imgData[idx+1];
                    b = imgData[idx+2];
                    a = imgData[idx+3];
                    count = a > 20 ? 1 : 0;
                }

                if (count > 0) {
                    // Apply Tint if needed
                    if (tintStrength > 0) {
                        r = r + (tintRgb.r - r) * tintStrength;
                        g = g + (tintRgb.g - g) * tintStrength;
                        b = b + (tintRgb.b - b) * tintStrength;
                    }

                    processedGrid.push({
                        x: x * cellSize,
                        y: y * cellSize,
                        r, g, b
                    });
                }
            }
        }
        
        setGridData(processedGrid);
        
        // Init Jitter Map
        jitterMapRef.current = new Float32Array(processedGrid.length * 2);
        
        setIsLoaded(true);
    };
  }, [src, width, height, cellSize, sampleAverage, tintStrength, tintRgb]);


  // 2. Render Loop
  useEffect(() => {
    if (!isLoaded || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Update Focus Point (Smooth Follow)
      if (interactive) {
          focusRef.current.x += (mouseRef.current.x - focusRef.current.x) * followSpeed;
          focusRef.current.y += (mouseRef.current.y - focusRef.current.y) * followSpeed;
      }

      // Update Jitter
      if (jitterStrength > 0 && jitterMapRef.current && Math.random() < jitterSpeed) {
          for (let i = 0; i < jitterMapRef.current.length; i++) {
              jitterMapRef.current[i] = (Math.random() - 0.5) * jitterStrength;
          }
      }

      const fx = focusRef.current.x;
      const fy = focusRef.current.y;

      for (let i = 0; i < gridData.length; i++) {
          const cell = gridData[i];
          
          // Dropout
          if (dropoutStrength > 0 && Math.random() < dropoutStrength) continue;

          let drawX = cell.x;
          let drawY = cell.y;
          let scale = dotScale;

          // Apply Jitter
          if (jitterStrength > 0 && jitterMapRef.current) {
              drawX += jitterMapRef.current[i*2];
              drawY += jitterMapRef.current[i*2+1];
          }

          // Apply Distortion
          if (interactive && distortionStrength > 0) {
              const centerX = cell.x + cellSize/2;
              const centerY = cell.y + cellSize/2;
              const dx = fx - centerX;
              const dy = fy - centerY;
              const dist = Math.sqrt(dx*dx + dy*dy);

              if (dist < distortionRadius) {
                  const influence = (distortionRadius - dist) / distortionRadius; // 0 to 1
                  
                  if (distortionMode === 'repel') {
                      const angle = Math.atan2(dy, dx);
                      const push = influence * distortionStrength * 10;
                      drawX -= Math.cos(angle) * push;
                      drawY -= Math.sin(angle) * push;
                  } else if (distortionMode === 'lens') {
                      // Slight Bulge
                      scale = dotScale + (influence * distortionStrength * 0.5);
                  } else if (distortionMode === 'swirl') {
                       const angle = Math.atan2(dy, dx);
                       // REDUCED ROTATION FACTOR: was 2, now 0.8 for subtle effect
                       const rotation = influence * distortionStrength * 0.8; 
                       const newAngle = angle + rotation;
                       
                       // Recalculate position relative to focus point
                       drawX = fx - (Math.cos(newAngle) * dist) - cellSize/2;
                       drawY = fy - (Math.sin(newAngle) * dist) - cellSize/2;
                  }
              }
          }

          ctx.fillStyle = `rgb(${cell.r},${cell.g},${cell.b})`;

          const drawSize = cellSize * scale;
          const offset = (cellSize - drawSize) / 2;

          if (shape === 'circle') {
              ctx.beginPath();
              ctx.arc(drawX + cellSize/2, drawY + cellSize/2, drawSize/2, 0, Math.PI * 2);
              ctx.fill();
          } else {
              ctx.fillRect(drawX + offset, drawY + offset, drawSize, drawSize);
          }
      }

      if (interactive) {
          animationRef.current = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [isLoaded, gridData, width, height, cellSize, dotScale, shape, backgroundColor, interactive, distortionMode, distortionStrength, distortionRadius, dropoutStrength, followSpeed, jitterSpeed, jitterStrength]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseLeave = () => {
    // Move focus away to reset distortion
    mouseRef.current = { x: -9999, y: -9999 };
  };

  return (
    <canvas 
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};