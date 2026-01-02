import { useEffect, useRef, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface StarfieldProps {
  starCount?: number;
  speed?: number;
  hyperspeed?: boolean;
}

const Starfield = ({ starCount = 200, speed = 0.5, hyperspeed = false }: StarfieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // "World" size used for simulation + projection (kept stable during pinch)
  const worldRef = useRef({ w: 0, h: 0 });

  // Canvas backing store config
  const dprRef = useRef(1);

  // Zoom detection + debounced apply
  const zoomingRef = useRef(false);
  const pendingResizeRef = useRef<{ w: number; h: number; dpr: number } | null>(null);
  const resizeTimerRef = useRef<number | null>(null);

  const initStars = useCallback(
    (width: number, height: number) => {
      starsRef.current = Array.from({ length: starCount }, () => ({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * 1000,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    },
    [starCount]
  );

  const drawStar = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      opacity: number,
      isHyperspeed: boolean,
      z: number
    ) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(200, 230, 255, ${opacity * 0.5})`);
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();

      if (isHyperspeed) {
        const streakLength = Math.max(50, (1000 - z) / 5);
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + streakLength);
        ctx.strokeStyle = `rgba(200, 230, 255, ${opacity * 0.8})`;
        ctx.lineWidth = size;
        ctx.stroke();
      } else {
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // More stable than innerHeight on iOS; does NOT track visualViewport zoom changes directly
    const getLayoutSize = () => {
      const el = document.documentElement;
      return { w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) };
    };

    const setCanvasBackingStore = (w: number, h: number, dpr: number) => {
      dprRef.current = dpr;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const applyResizeNow = (next: { w: number; h: number; dpr: number }, preserve = true) => {
      const prev = worldRef.current;

      // Preserve star positions relative to the world
      if (preserve && prev.w > 0 && prev.h > 0 && starsRef.current.length) {
        const sx = next.w / prev.w;
        const sy = next.h / prev.h;
        for (const star of starsRef.current) {
          star.x *= sx;
          star.y *= sy;
        }
      }

      worldRef.current = { w: next.w, h: next.h };
      setCanvasBackingStore(next.w, next.h, next.dpr);
    };

    const scheduleApply = () => {
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = window.setTimeout(() => {
        zoomingRef.current = false;

        const pending = pendingResizeRef.current;
        pendingResizeRef.current = null;

        if (pending) {
          applyResizeNow(pending, true);
        }
      }, 160);
    };

    const requestResize = (reason: 'normal' | 'zoom') => {
      const { w, h } = getLayoutSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (!worldRef.current.w || !worldRef.current.h) {
        // first paint
        worldRef.current = { w, h };
        setCanvasBackingStore(w, h, dpr);
        initStars(w, h);
        return;
      }

      // During zoom: do NOT apply immediately (avoids black flashing).
      // Keep animating against last stable world.
      if (reason === 'zoom') {
        zoomingRef.current = true;
        pendingResizeRef.current = { w, h, dpr };
        scheduleApply();
        return;
      }

      // Normal resize: apply immediately
      applyResizeNow({ w, h, dpr }, true);
    };

    // Initial setup
    requestResize('normal');

    const onWindowResize = () => requestResize('normal');
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', onWindowResize);

    const vv = window.visualViewport;
    const onVVChange = () => {
      // Detect pinch zoom; iOS Safari spams these
      if (vv && vv.scale && Math.abs(vv.scale - 1) > 0.001) {
        requestResize('zoom');
      } else {
        // URL bar changes etc: treat as zoom-ish to avoid thrash
        requestResize('zoom');
      }
    };

    if (vv) {
      vv.addEventListener('resize', onVVChange);
      vv.addEventListener('scroll', onVVChange);
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = () => {
      const { w: width, h: height } = worldRef.current;
      if (!width || !height) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const centerX = width / 2;
      const centerY = height / 2;

      // Keep drawing every frame (even during zoom). We use stable world size.
      ctx.clearRect(0, 0, width, height);
      timeRef.current += 0.016;

      const currentSpeed = hyperspeed ? speed * 20 : speed;

      for (const star of starsRef.current) {
        star.z -= currentSpeed * 2;

        if (star.z <= 0) {
          star.z = 1000;
          star.x = Math.random() * width - centerX;
          star.y = Math.random() * height - centerY;
        }

        const perspective = 300 / star.z;
        const screenX = centerX + star.x * perspective;
        const screenY = centerY + star.y * perspective;

        if (screenX < 0 || screenX > width || screenY < 0 || screenY > height) continue;

        const depth = 1 - star.z / 1000;
        const size = star.size * (1 + depth * 2);

        const twinkle =
          Math.sin(timeRef.current * star.twinkleSpeed * 60 + star.twinkleOffset) * 0.3 + 0.7;
        const opacity = star.opacity * twinkle * (0.3 + depth * 0.7);

        drawStar(ctx, screenX, screenY, size, opacity, hyperspeed, star.z);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    if (!prefersReducedMotion) {
      animate();
    } else {
      const { w: width, h: height } = worldRef.current;
      const centerX = width / 2;
      const centerY = height / 2;

      for (const star of starsRef.current) {
        const perspective = 300 / star.z;
        const screenX = centerX + star.x * perspective;
        const screenY = centerY + star.y * perspective;

        const depth = 1 - star.z / 1000;
        const size = star.size * (1 + depth * 2);

        drawStar(ctx, screenX, screenY, size, star.opacity * 0.7, false, star.z);
      }
    }

    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('orientationchange', onWindowResize);

      const vvCleanup = window.visualViewport;
      if (vvCleanup) {
        vvCleanup.removeEventListener('resize', onVVChange);
        vvCleanup.removeEventListener('scroll', onVVChange);
      }

      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [speed, hyperspeed, initStars, drawStar]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};

export default Starfield;
