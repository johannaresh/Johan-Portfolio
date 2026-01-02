import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HyperspeedTransitionProps {
  isActive: boolean;
  onComplete?: () => void;
}

const HyperspeedTransition = ({ isActive, onComplete }: HyperspeedTransitionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const duration = 800; // ms

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create stars for hyperspeed
    const stars = Array.from({ length: 300 }, () => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * 1500 + 500,
      size: Math.random() * 2 + 1,
    }));

    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease in then accelerate
      const easeProgress = progress < 0.3 
        ? progress * progress * 10 
        : 1 + (progress - 0.3) * 3;

      ctx.fillStyle = `rgba(8, 10, 18, ${0.3 + progress * 0.7})`;
      ctx.fillRect(0, 0, width, height);

      stars.forEach((star) => {
        // Move stars toward camera
        star.z -= easeProgress * 80;

        if (star.z <= 0) {
          star.z = 1500;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        // Project to screen
        const perspective = 400 / star.z;
        const screenX = centerX + star.x * perspective;
        const screenY = centerY + star.y * perspective;

        // Previous position for streak
        const prevZ = star.z + easeProgress * 80;
        const prevPerspective = 400 / prevZ;
        const prevScreenX = centerX + star.x * prevPerspective;
        const prevScreenY = centerY + star.y * prevPerspective;

        // Calculate streak length based on speed
        const streakLength = Math.min(
          Math.sqrt(
            Math.pow(screenX - prevScreenX, 2) + 
            Math.pow(screenY - prevScreenY, 2)
          ) * (1 + progress * 3),
          200
        );

        if (screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) {
          return;
        }

        // Draw streak
        const gradient = ctx.createLinearGradient(prevScreenX, prevScreenY, screenX, screenY);
        const alpha = Math.min(0.3 + (1 - star.z / 1500) * 0.7, 1);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, `rgba(100, 200, 255, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(200, 230, 255, ${alpha})`);

        ctx.beginPath();
        ctx.moveTo(prevScreenX, prevScreenY);
        ctx.lineTo(screenX, screenY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = star.size * (0.5 + progress);
        ctx.lineCap = 'round';
        ctx.stroke();

        // Bright point at the end
        ctx.beginPath();
        ctx.arc(screenX, screenY, star.size * (0.5 + progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Flash effect at the end
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.fillRect(0, 0, width, height);
        
        setTimeout(() => {
          onComplete?.();
        }, 100);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] pointer-events-none"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ background: 'rgba(8, 10, 18, 0.9)' }}
          />
          {/* Center glow */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(100, 200, 255, 0.3) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HyperspeedTransition;
