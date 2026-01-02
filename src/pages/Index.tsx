import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User,
  Rocket,
  Mail,
  Code,
  Compass,
  ArrowRight,
  Github,
  Linkedin,
} from "lucide-react";
import Starfield from "@/components/Starfield";
import Navigation from "@/components/Navigation";
import HudCard from "@/components/HudCard";
import HyperspeedTransition from "@/components/HyperspeedTransition";
import DevpostIcon from "@/components/icons/DevpostIcon";

const Index = () => {
  const navigate = useNavigate();
  const [isHyperspeed, setIsHyperspeed] = useState(false);

  const handleProjectsClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        navigate("/projects");
        return;
      }

      setIsHyperspeed(true);
    },
    [navigate]
  );

  const handleHyperspeedComplete = useCallback(() => {
    navigate("/projects");
    setIsHyperspeed(false);
  }, [navigate]);

  return (
    <div className="relative min-h-screen min-h-[100dvh]">
      {/* Background */}
      <Starfield />
      <Navigation />

      {/* Hyperspeed Transition Overlay */}
      <HyperspeedTransition
        isActive={isHyperspeed}
        onComplete={handleHyperspeedComplete}
      />

      {/* Hero Section */}
      <main
        className="relative z-20 min-h-screen flex items-center justify-center px-4 pt-24 overscroll-none"
        style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-6xl w-full">
          {/* Main intro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                        border border-primary/30 bg-primary/5 text-primary text-sm
                        mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-primary glow-pulse" />
              <span className="font-mono">TRANSMISSION INCOMING</span>
            </motion.div>

            {/* ✅ simple, stable title line */}
            <p
              className="
                font-orbitron uppercase tracking-[0.22em]
                text-[11px] sm:text-xs md:text-sm
                text-white/70
                drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]
                mb-3
              "
            >
              Software Engineer
            </p>

            <h1 className="flex justify-center font-orbitron text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4">
              <span className="neon-text-soft opacity-95">Johan Naresh</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Senior Software Engineer navigating the digital cosmos. Building
              exceptional web experiences, one star system at a time.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-4 mt-8"
            >
              <button
                onClick={handleProjectsClick}
                className="group flex items-center gap-2 px-6 py-3 rounded-lg
                          bg-primary text-primary-foreground font-orbitron text-sm
                          hover:bg-primary/90 transition-all duration-300
                          shadow-neon hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)]"
              >
                <Rocket size={18} className="group-hover:animate-bounce" />
                Explore Projects
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>

              <a
                href="/experience"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/experience");
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg
                          border border-secondary/50 text-foreground font-orbitron text-sm
                          hover:border-secondary hover:bg-secondary/10 transition-all duration-300"
              >
                <Compass size={18} />
                View Experience
              </a>
            </motion.div>
          </motion.div>

          {/* HUD Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <HudCard
              title="Mission Control"
              subtitle="About Me"
              icon={User}
              delay={0.3}
              glowColor="primary"
            >
              <p className="mb-3">
                Computer Science and Finance student with 3+ years crafting
                digital experiences. Experienced in React, TypeScript, and
                building scalable systems and data pipelines.
              </p>
              <p className="text-foreground/80">
                When not coding, you'll find me exploring astronomy, aviation, or
                at a pool table.
              </p>
            </HudCard>

            <HudCard
              title="Technical Arsenal"
              subtitle="Core Technologies"
              icon={Code}
              delay={0.4}
              glowColor="secondary"
            >
              <div className="flex flex-wrap gap-2">
                {[
                  "React",
                  "TypeScript",
                  "Node.js",
                  "PostgreSQL",
                  "Python",
                  "Dart",
                  "Java",
                  "Git",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 rounded text-xs font-medium
                              bg-secondary/10 text-secondary-foreground border border-secondary/20
                              hover:border-secondary/50 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </HudCard>

            <HudCard
              title="Hailing Frequencies"
              subtitle="Get in Touch"
              icon={Mail}
              delay={0.5}
              glowColor="hologram"
              className="md:col-span-2 lg:col-span-1"
            >
              <p className="mb-4">
                Open to new opportunities and collaborations. Let's build
                something amazing together.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://github.com/johannaresh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md text-muted-foreground hover:text-primary
                            hover:bg-primary/10 transition-all duration-300"
                  aria-label="GitHub"
                >
                  <Github size={20} />
                </a>
                <a
                  href="https://www.linkedin.com/in/johan-naresh/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md text-muted-foreground hover:text-primary
                            hover:bg-primary/10 transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href="https://devpost.com/johannaresh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md text-muted-foreground hover:text-primary
                            hover:bg-primary/10 transition-all duration-300"
                  aria-label="Devpost"
                >
                  <DevpostIcon size={20} />
                </a>
                <a
                  href="mailto:johannaresh@gmail.com"
                  className="p-2 rounded-md text-muted-foreground hover:text-primary
                            hover:bg-primary/10 transition-all duration-300"
                  aria-label="Email"
                >
                  <Mail size={20} />
                </a>
              </div>
            </HudCard>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16"
          >
            {[
              { value: "1M", label: "Rows Analysed" },
              { value: "20k", label: "Students Impacted" },
              { value: "30%", label: "Portfolio Outperformance" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-orbitron text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Status strip */}



          <div
            className="mt-10 flex justify-center"
            style={{ marginBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="hud-panel px-6 py-3 flex items-center gap-6 text-[10px] font-mono text-muted-foreground/70">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/70 glow-pulse" />
                <span>SYS: ONLINE</span>
              </div>
              <div className="w-px h-3 bg-border/60" />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent/70" />
                <span>NAV: ACTIVE</span>
              </div>
              <div className="w-px h-3 bg-border/60" />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-hologram/70" />
                <span>COMM: READY</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
