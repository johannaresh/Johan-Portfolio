import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Github, X, ChevronRight } from 'lucide-react';
import projectsData from '@/data/projects.json';

const hasLink = (href?: string | null) => typeof href === 'string' && href.trim().length > 0;

const LABEL_GAP = 18; // pixels below asteroid
const LABEL_W_DESKTOP = 280; // fixed label width
const LABEL_H_DESKTOP = 44; // fixed label height (enough for 2 lines)

// Toggle debug hitboxes 
const DEBUG_HITBOXES = false;

interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  tech: string[];
  links: { github: string; demo: string };
  impact: string[];
  asteroid: { x: number; y: number; size: number; color: string };
}

interface Asteroid {
  project: Project;
  x: number;
  y: number;
  size: number;
  rotation: number;
  driftX: number;
  driftY: number;
  rotationSpeed: number;
  vertices: { x: number; y: number }[];
  r: number; // body collision radius
}

const AsteroidField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const animationRef = useRef<number>();
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const labelsReadyRef = useRef(false);
  const stableFramesRef = useRef(0);
  const lastStableSizeRef = useRef({ w: 0, h: 0 });


  const isIOSSafari = useRef(false);
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const ua = navigator.userAgent;
      isIOSSafari.current =
        /iP(ad|hone|od)/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    }, []);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [hoveredAsteroid, setHoveredAsteroid] = useState<string | null>(null);
  

  const getColor = useCallback((colorName: string): string => {
    const colors: Record<string, string> = {
      primary: 'hsl(185, 100%, 50%)',
      secondary: 'hsl(270, 60%, 50%)',
      accent: 'hsl(25, 100%, 55%)',
      hologram: 'hsl(185, 100%, 70%)',
    };
    return colors[colorName] || colors.primary;
  }, []);

  const generateAsteroidVertices = useCallback((size: number): { x: number; y: number }[] => {
    const points = 18;
    const vertices: { x: number; y: number }[] = [];
    const seed = Math.random() * Math.PI * 2;

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;

      const wobble =
        0.92 +
        Math.sin(angle * 2 + seed) * 0.06 +
        Math.cos(angle * 3.2 + seed * 0.7) * 0.05;

      const rr = (size / 2) * wobble;

      vertices.push({
        x: Math.cos(angle) * rr,
        y: Math.sin(angle) * rr,
      });
    }

    return vertices;
  }, []);

  // ---------- Label geometry ----------

  const getLabelDims = useCallback(() => {
    const w = window.innerWidth >= 1024 ? LABEL_W_DESKTOP : 240;
    const h = window.innerWidth >= 1024 ? LABEL_H_DESKTOP : 40;
    return { w, h };
  }, []);

  const getLabelRect = useCallback(
    (a: Asteroid) => {
      const { w, h } = getLabelDims();
      return {
        x: a.x - w / 2,
        y: a.y + a.r + LABEL_GAP,
        w,
        h,
      };
    },
    [getLabelDims]
  );


type Pt = { x: number; y: number };
type MTV = { nx: number; ny: number; overlap: number };

// ---------- Convex hull (Monotonic chain) ----------
const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

const convexHull = (pts: Pt[]): Pt[] => {
  if (pts.length <= 3) return pts.slice();

  const p = pts
    .slice()
    .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const lower: Pt[] = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) {
      lower.pop();
    }
    lower.push(pt);
  }

  const upper: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const pt = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) {
      upper.pop();
    }
    upper.push(pt);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
};

// ---------- SAT (convex polygon vs convex polygon) ----------
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;

const projectPoly = (poly: Pt[], axis: Pt) => {
  let min = dot(poly[0], axis);
  let max = min;
  for (let i = 1; i < poly.length; i++) {
    const d = dot(poly[i], axis);
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return { min, max };
};

const normalize = (v: Pt) => {
  const len = Math.hypot(v.x, v.y) || 1e-9;
  return { x: v.x / len, y: v.y / len };
};

const satMTV = (A: Pt[], B: Pt[]): MTV | null => {
  let bestOverlap = Infinity;
  let bestAxis: Pt | null = null;

  const testAxesFrom = (poly: Pt[]) => {
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };

      // perpendicular axis
      const axis = normalize({ x: -edge.y, y: edge.x });

      const pA = projectPoly(A, axis);
      const pB = projectPoly(B, axis);

      const overlap = Math.min(pA.max, pB.max) - Math.max(pA.min, pB.min);
      if (overlap <= 0) return { separated: true as const };

      if (overlap < bestOverlap) {
        bestOverlap = overlap;
        bestAxis = axis;
      }
    }
    return { separated: false as const };
  };

  const r1 = testAxesFrom(A);
  if (r1.separated) return null;
  const r2 = testAxesFrom(B);
  if (r2.separated) return null;

  if (!bestAxis) return null;

  // Ensure axis points from A -> B (consistent MTV direction)
  const ac = centroid(A);
  const bc = centroid(B);
  const dir = { x: bc.x - ac.x, y: bc.y - ac.y };
  if (dot(dir, bestAxis) < 0) bestAxis = { x: -bestAxis.x, y: -bestAxis.y };

  return { nx: bestAxis.x, ny: bestAxis.y, overlap: bestOverlap };
};

const centroid = (poly: Pt[]) => {
  let x = 0,
    y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  return { x: x / poly.length, y: y / poly.length };
};


  const asteroidWorldPoly = useCallback(
    (a: Asteroid): Pt[] => {
      const rad = (a.rotation * Math.PI) / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);

      // asteroid polygon vertices (world)
      const rock = a.vertices.map((v) => ({
        x: a.x + v.x * c - v.y * s,
        y: a.y + v.x * s + v.y * c,
      }));

      // label rectangle corners (world)
      const r = getLabelRect(a);
      const label: Pt[] = [
        { x: r.x, y: r.y },
        { x: r.x + r.w, y: r.y },
        { x: r.x + r.w, y: r.y + r.h },
        { x: r.x, y: r.y + r.h },
      ];

      // One convex collider covering both rock + label (stable)
      return convexHull([...rock, ...label]);
    },
    [getLabelRect]
  );


  // ---------- Wall bounds ----------

  const clampToBounds = useCallback(
    (a: Asteroid, width: number, height: number) => {
      const REST = 0.98;
      const padding = 40;
      const topBiasMaxY = height * 0.72;

      const { w, h } = getLabelDims();
      const halfW = w / 2;

      const extentX = Math.max(a.r, halfW);
      const extentYTop = a.r;
      const extentYBottom = a.r + LABEL_GAP + h;

      const minX = padding + extentX;
      const maxX = width - padding - extentX;
      const minY = padding + extentYTop;
      const maxY = Math.max(minY + 50, topBiasMaxY - extentYBottom);

      const EPS = 0.35;

      if (a.x < minX) {
        const pen = minX - a.x;
        a.x = minX + pen + EPS;
        a.driftX = Math.abs(a.driftX) * REST;
      } else if (a.x > maxX) {
        const pen = a.x - maxX;
        a.x = maxX - pen - EPS;
        a.driftX = -Math.abs(a.driftX) * REST;
      }

      if (a.y < minY) {
        const pen = minY - a.y;
        a.y = minY + pen + EPS;
        a.driftY = Math.abs(a.driftY) * REST;
      } else if (a.y > maxY) {
        const pen = a.y - maxY;
        a.y = maxY - pen - EPS;
        a.driftY = -Math.abs(a.driftY) * REST;
      }
    },
    [getLabelDims]
  );

    const positionLabels = useCallback(() => {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const snap = (v: number) => (Math.round(v * dpr) / dpr);

  for (const a of asteroidsRef.current) {
    const el = labelRefs.current[a.project.id];
    if (!el) continue;

    // compute target
    let x = a.x;
    let y = a.y + a.size / 2 + LABEL_GAP;

    // only snap on iOS Safari to avoid subpixel shimmer
    if (isIOSSafari.current) {
      x = snap(x);
      y = snap(y);
    }

    // hide until we have stabilized layout
    if (!labelsReadyRef.current) {
      el.style.opacity = '0';
    }

    el.style.transform = `translate3d(${x}px, ${y}px, 0) translateX(-50%)`;
  }
}, []);


  // ---------- Overlap solver (stable) ----------

  const resolveOverlaps = useCallback(
    (asteroids: Asteroid[], width: number, height: number, iterations: number) => {
      const SEP = 0.25;       // extra spacing to avoid re-stick
      const VEL_DAMP = 0.55;  // reduce buzz

      for (let it = 0; it < iterations; it++) {
        for (let i = 0; i < asteroids.length; i++) {
          for (let j = i + 1; j < asteroids.length; j++) {
            const A = asteroids[i];
            const B = asteroids[j];

            const polyA = asteroidWorldPoly(A);
            const polyB = asteroidWorldPoly(B);

            const mtv = satMTV(polyA, polyB);
            if (!mtv) continue;

            const nx = mtv.nx;
            const ny = mtv.ny;

            // positional correction
            const push = (mtv.overlap + SEP) * 0.5;
            A.x -= nx * push;
            A.y -= ny * push;
            B.x += nx * push;
            B.y += ny * push;

            // damp velocity into normal (prevents jitter)
           // bounce + light friction (keeps energy instead of killing drift)
            const rvx = B.driftX - A.driftX;
            const rvy = B.driftY - A.driftY;

            // normal component (closing speed)
            const relN = rvx * nx + rvy * ny;
            if (relN < 0) {
              // restitution: 0 = sticky, 1 = perfectly elastic
              const REST = 0.97;

              // impulse along normal
              const j = -(1 + REST) * relN * 0.5;

              A.driftX -= nx * j;
              A.driftY -= ny * j;
              B.driftX += nx * j;
              B.driftY += ny * j;

              // tangential friction (small, to reduce endless sliding jitter)
              const tx = -ny;
              const ty = nx;
              const relT = rvx * tx + rvy * ty;

              const FRICTION = 0.01;
              const jt = -relT * FRICTION * 0.5;

              A.driftX -= tx * jt;
              A.driftY -= ty * jt;
              B.driftX += tx * jt;
              B.driftY += ty * jt;
            }

          }
        }

        // IMPORTANT: clamp only once per iteration (not inside pair loop)
        asteroids.forEach((a) => clampToBounds(a, width, height));
      }
    },
    [asteroidWorldPoly, clampToBounds]
  );


  // ---------- Debug draw ----------

    const drawDebugHitboxes = useCallback(
    (ctx: CanvasRenderingContext2D, a: Asteroid) => {
      const poly = asteroidWorldPoly(a);
      if (poly.length < 2) return;

      ctx.save();
      ctx.strokeStyle = 'rgba(0,255,255,0.35)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    },
    [asteroidWorldPoly]
  );


  // ---------- Init asteroids ----------

  const initAsteroids = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();

    const newAsteroids: Asteroid[] = (projectsData as Project[]).map((project) => {
      const spawnY = Math.max(0.06, Math.min(0.45, project.asteroid.y * 0.75));
      const size = project.asteroid.size;

      return {
        project,
        x: project.asteroid.x * width,
        y: spawnY * height,
        size,
        rotation: Math.random() * 360,
        driftX: (Math.random() - 0.5) * 0.32,
        driftY: (Math.random() - 0.5) * 0.38,
        rotationSpeed: (Math.random() - 0.5) * 0.45,
        vertices: generateAsteroidVertices(size),
        r: size / 2,
      };
    });

    // Pre-solve overlaps on init so we do not start interlocked
    for (let k = 0; k < 60; k++) {
      resolveOverlaps(newAsteroids, width, height, 2);
      newAsteroids.forEach((a) => clampToBounds(a, width, height));
    }

    asteroidsRef.current = newAsteroids;
    lastSizeRef.current = { width, height };

    // Position labels immediately so there is no “pop-in”
    requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      positionLabels();
    });
  });


  }, [generateAsteroidVertices, resolveOverlaps, clampToBounds, positionLabels]);

  // ---------- Draw asteroid ----------

  const drawAsteroid = useCallback(
    (ctx: CanvasRenderingContext2D, asteroid: Asteroid, isHovered: boolean) => {
      const { x, y, size, rotation, project, vertices } = asteroid;
      const baseColor = getColor(project.asteroid.color);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);

      // Path
      ctx.beginPath();
      vertices.forEach((v, i) => (i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)));
      ctx.closePath();

      // Clip for inner details
      ctx.save();
      ctx.clip();

      const gradient = ctx.createRadialGradient(-size * 0.18, -size * 0.2, 0, 0, 0, size * 0.7);
      gradient.addColorStop(0, isHovered ? baseColor : 'hsl(220, 18%, 28%)');
      gradient.addColorStop(
        0.55,
        isHovered
          ? baseColor.replace(')', ', 0.65)').replace('hsl', 'hsla')
          : 'hsl(220, 14%, 18%)'
      );
      gradient.addColorStop(1, 'hsl(220, 10%, 10%)');

      ctx.fillStyle = gradient;
      ctx.fillRect(-size, -size, size * 2, size * 2);

      // Craters
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      const crater = (cx: number, cy: number, rr: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.arc(cx - rr * 0.25, cy - rr * 0.25, rr * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
      };

      crater(size * 0.14, -size * 0.08, size * 0.11);
      crater(-size * 0.16, size * 0.1, size * 0.08);
      crater(size * 0.02, size * 0.18, size * 0.06);

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(-size * 0.18, -size * 0.18, size * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // unclip

      // Border + glow
      ctx.beginPath();
      vertices.forEach((v, i) => (i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)));
      ctx.closePath();

      if (isHovered) {
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;
      } else {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'hsl(200, 30%, 35%)';
        ctx.lineWidth = 1;
      }

      ctx.stroke();
      ctx.restore();
    },
    [getColor]
  );

  // ---------- Mount init ----------

  useEffect(() => {
    initAsteroids();
  }, [initAsteroids]);

  // ---------- Animation + resize handling ----------

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resizeCanvasPreserve = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const { width, height } = container.getBoundingClientRect();

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Scale positions only if width changed (ignore iOS bar height)
      const prev = lastSizeRef.current;
      if (prev.width > 0 && prev.height > 0 && asteroidsRef.current.length > 0) {
        const sx = width / prev.width;
        const sy = height / prev.height;

        if (Math.abs(width - prev.width) >= 2) {
          asteroidsRef.current.forEach((a) => {
            a.x *= sx;
            a.y *= sy;
          });
        }
      }

      lastSizeRef.current = { width, height };

        // reset label readiness when size truly changes
        const prevStable = lastStableSizeRef.current;
        if (Math.abs(width - prevStable.w) > 1 || Math.abs(height - prevStable.h) > 1) {
          lastStableSizeRef.current = { w: width, h: height };
          stableFramesRef.current = 0;
          labelsReadyRef.current = false;
        }

    };

    resizeCanvasPreserve();

    const onViewportResize = () => {
      const { width } = container.getBoundingClientRect();
      const prevW = lastSizeRef.current.width;
      if (prevW !== 0 && Math.abs(width - prevW) < 2) return;
      resizeCanvasPreserve();
    };

    const vv = window.visualViewport;
    if (vv) vv.addEventListener('resize', onViewportResize);
    else window.addEventListener('resize', onViewportResize);

    const ro = new ResizeObserver(() => {
      const { width } = container.getBoundingClientRect();
      const prevW = lastSizeRef.current.width;
      if (prevW !== 0 && Math.abs(width - prevW) < 2) return;
      initAsteroids();
      resizeCanvasPreserve();
    });
    ro.observe(container);

    // Timing
    let frameCount = 0;
    let lastT = performance.now();

    const animate = (t: number) => {
      const { width, height } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      const dtMs = t - lastT;
      lastT = t;
      const dt = Math.min(2.0, Math.max(0.5, dtMs / 16.67)); // clamp dt multiplier

      if (!prefersReducedMotion) {
        // Integrate once
        asteroidsRef.current.forEach((a) => {
          a.x += a.driftX * dt;
          a.y += a.driftY * dt;
          a.rotation += a.rotationSpeed * dt;
        });

        // Resolve overlaps once per frame (small iterations)
        resolveOverlaps(asteroidsRef.current, width, height, 2);

        // Clamp once per frame
        asteroidsRef.current.forEach((a) => clampToBounds(a, width, height));
      }

      // Update label DOM every frame (smooth)
      positionLabels();

      // After a couple stable frames, reveal labels (prevents iPad initial jump/pop)
        if (!labelsReadyRef.current) {
          stableFramesRef.current += 1;
          if (stableFramesRef.current >= 2) {
            labelsReadyRef.current = true;
            for (const key of Object.keys(labelRefs.current)) {
              const el = labelRefs.current[key];
              if (el) el.style.opacity = '1';
            }
          }
        }



      // Draw
      asteroidsRef.current.forEach((a) => {
        drawAsteroid(ctx, a, hoveredAsteroid === a.project.id);
        if (DEBUG_HITBOXES) drawDebugHitboxes(ctx, a);
      });

      // Update HTML label positions occasionally
      

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      ro.disconnect();
      if (vv) vv.removeEventListener('resize', onViewportResize);
      else window.removeEventListener('resize', onViewportResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [hoveredAsteroid, drawAsteroid, drawDebugHitboxes, initAsteroids, resolveOverlaps, clampToBounds, positionLabels]);

  // ---------- Interaction ----------

  const hitTest = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (const a of asteroidsRef.current) {
      const dx = x - a.x;
      const dy = y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + 12) return a;
    }
    return null;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) setSelectedProject(hit.project);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const hit = hitTest(e.clientX, e.clientY);
    setHoveredAsteroid(hit ? hit.project.id : null);
  };

  // ---------- Render ----------

  return (
    <div className="relative w-full">
      {/* Mobile / Tablet: Grid */}
      <div className="block md:hidden">
        <div className="mb-3 text-center">
          <p className="text-xs text-muted-foreground/70 font-mono">
            Grid view on mobile. For the full asteroid experience, view on a laptop.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(projectsData as Project[]).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProject(p)}
              className="text-left hologram-card hover:border-primary/50 transition-colors"
            >
              <p className="font-orbitron text-sm text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.tagline}</p>

              <div className="flex flex-wrap gap-2 mt-3">
                {p.tech.slice(0, 6).map((tt) => (
                  <span
                    key={tt}
                    className="px-2 py-1 rounded text-[10px] bg-secondary/10 text-secondary-foreground border border-secondary/20"
                  >
                    {tt}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Labels (DOM positioned via refs for smooth motion) */}

      <div className="hidden md:block">
        <div className="relative w-full h-[60vh] lg:h-[55vh] min-h-[520px] flex flex-col">
          <div
            ref={containerRef}
            className="relative w-full flex-1 cursor-pointer"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoveredAsteroid(null)}
          >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {/* Labels */}
           {(projectsData as Project[]).map((project) => (

            <div
              key={project.id}
              ref={(el) => {
                labelRefs.current[project.id] = el;
              }}
              className={`
                absolute left-0 top-0 pointer-events-none
                will-change-transform transform-gpu
                ${hoveredAsteroid === project.id ? 'scale-110' : 'scale-100'}
              `}
              
              style={{
                    width: LABEL_W_DESKTOP,
                    opacity: 0, // start hidden, we reveal after first stable positioning
                    transition: 'opacity 160ms ease',
                    transform: 'translate3d(0px, 0px, 0) translateX(-50%)',
                  }}
            >
              <div className="text-center">
                <p className="font-orbitron text-xs text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                  {project.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                  {project.tagline}
                </p>
              </div>
            </div>
          ))}

          </div>

          <div className="py-4 flex justify-center pointer-events-none">
          </div>
        </div>
      </div>

      {/* Modal (shared by BOTH views) */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[200]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-space-dark/95 backdrop-blur-md"
              aria-hidden="true"
            />

            <div
              className="relative z-10 w-full h-full flex items-start justify-center px-4 pb-6"
              style={{ paddingTop: 96 }}
              onClick={() => setSelectedProject(null)}
              role="presentation"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="relative w-full max-w-2xl rounded-lg overflow-hidden"
                style={{
                  height: `min(480px, calc(100vh - ${96 + 24}px))`,
                }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                <div className="hologram-card relative h-full p-0">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="absolute top-3 right-3 p-2 rounded-md text-muted-foreground
                               hover:text-foreground hover:bg-muted/50 transition-colors z-10"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>

                  <div className="h-full overflow-y-auto px-6 py-4">
                    <div className="mb-4 pr-10">
                      <p className="text-xs text-hologram font-mono uppercase tracking-widest mb-2">
                        // PROJECT DATA
                      </p>
                      <h2 className="font-orbitron text-xl md:text-2xl text-foreground mb-2">
                        {selectedProject.name}
                      </h2>
                      <p className="text-muted-foreground">{selectedProject.tagline}</p>
                    </div>

                    <p className="text-foreground/80 mb-4 leading-relaxed text-sm md:text-base">
                      {selectedProject.description}
                    </p>

                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                        Technology Stack
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.tech.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1 rounded-full text-xs font-medium
                                       bg-primary/10 text-primary border border-primary/20"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                        Mission Impact
                      </p>
                      <ul className="space-y-2">
                        {selectedProject.impact.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                            <ChevronRight size={16} className="text-primary mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {(() => {
                      const demoOk = hasLink(selectedProject.links?.demo);
                      const codeOk = hasLink(selectedProject.links?.github);
                      if (!demoOk && !codeOk) return null;

                      const single = demoOk !== codeOk;

                      return (
                        <div className="pt-4 border-t border-hologram/20">
                          <div className={`${single ? 'flex' : 'flex flex-wrap'} gap-4`}>
                            {demoOk && (
                              <a
                                href={selectedProject.links.demo as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${single ? 'w-full justify-center' : ''} flex items-center gap-2 px-5 py-2.5 rounded-md
                                            bg-primary text-primary-foreground font-medium text-sm
                                            hover:bg-primary/90 transition-colors`}
                              >
                                <ExternalLink size={16} />
                                View Demo
                              </a>
                            )}

                            {codeOk && (
                              <a
                                href={selectedProject.links.github as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${single ? 'w-full justify-center' : ''} flex items-center gap-2 px-5 py-2.5 rounded-md
                                            border border-muted-foreground/30 text-foreground text-sm
                                            hover:border-primary hover:text-primary transition-colors`}
                              >
                                <Github size={16} />
                                Source Code
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="h-2" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AsteroidField;
