import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Orbit, ExternalLink, Github, X, ChevronRight } from 'lucide-react';
import Starfield from '@/components/Starfield';
import Navigation from '@/components/Navigation';
import AsteroidField from '@/components/AsteroidField';
import projectsData from '@/data/projects.json';

type ViewMode = 'asteroid' | 'grid';
type Project = (typeof projectsData)[number];

const hasLink = (href?: string | null) => typeof href === 'string' && href.trim().length > 0;


const Projects = () => {
  // mobile/tablet => grid only
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('asteroid');

  // Modal state (used by GRID view; asteroid view can stay separate for now)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Approx fixed nav height to avoid modal being hidden under it
  const NAV_OFFSET_PX = 96;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)'); // <= tablet
    const apply = () => setIsMobile(mq.matches);
    apply();

    if (mq.addEventListener) mq.addEventListener('change', apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', apply);
      else mq.removeListener(apply);
    };
  }, []);

  // enforce grid whenever we're on mobile/tablet
  useEffect(() => {
    if (isMobile && viewMode !== 'grid') setViewMode('grid');
  }, [isMobile, viewMode]);

  // lock page scroll when modal open
  useEffect(() => {
    if (!selectedProject) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedProject]);

  // ESC closes modal
  useEffect(() => {
    if (!selectedProject) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProject(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedProject]);

  const headerSubtitle = useMemo(() => {
    return isMobile
      ? 'Browse projects in grid view. For the cinematic view, open on a laptop/desktop.'
      : 'Navigate through my constellation of projects (tap Asteroid/Card to expand project details)';
  }, [isMobile]);

  return (
     <div className="relative min-h-screen overflow-hidden">
    {/* Background */}

    {/* Nav always on top */}
    <div className="fixed top-0 left-0 right-0 z-[350]">
      <Navigation />
    </div>

    {/* Header */}
    <div className="relative z-20 pt-28 md:pt-32 pb-8 px-4">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-mono mb-2">
                <Orbit size={14} className="animate-spin" style={{ animationDuration: '8s' }} />
                <span>// SECTOR: PROJECTS</span>
              </div>

              <h1 className="font-orbitron text-3xl md:text-4xl text-foreground">Asteroid Field</h1>

              <p className="text-muted-foreground mt-2">{headerSubtitle}</p>

              {isMobile && (
                <p className="text-xs text-muted-foreground/70 font-mono mt-3">
                  // TIP: For the cinematic view, open on a laptop/desktop
                </p>
              )}
            </div>

            {/* View toggle (desktop only) */}
            {!isMobile && (
              <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/30 border border-border/50">
                <button
                  onClick={() => setViewMode('asteroid')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${
                      viewMode === 'asteroid'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Orbit size={16} />
                  <span className="hidden sm:inline">Cinematic</span>
                </button>

                <button
                  onClick={() => setViewMode('grid')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${
                      viewMode === 'grid'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Grid size={16} />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-20 flex-1">
        {!isMobile && viewMode === 'asteroid' ? (
          <div className="h-[calc(100vh-220px)] min-h-[500px]">
            {/* Cinematic stays as-is */}
            <AsteroidField />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto px-4 pb-16"
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsData.map((project, index) => (
              <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                  whileHover={{ y: -8, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="hud-panel p-5 hover:border-primary/50 transition-all duration-0 group cursor-pointer
                            hover:shadow-2xl hover:shadow-primary/10 will-change-transform"
                  onClick={() => setSelectedProject(project)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedProject(project);
                  }}
                >

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-orbitron text-lg text-foreground group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{project.tagline}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-primary/50 glow-pulse" />
                  </div>

                  <p className="text-sm text-foreground/70 mb-3 line-clamp-2">{project.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.tech.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded text-[10px] font-mono uppercase
                                   bg-primary/10 text-primary/80 border border-primary/20"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.tech.length > 4 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-muted-foreground">
                        +{project.tech.length - 4}
                      </span>
                    )}
                  </div>

                  {(() => {
  const demoOk = hasLink(project.links?.demo);
  const codeOk = hasLink(project.links?.github);

  if (!demoOk && !codeOk) return null;

  // if only one exists, it takes full width
  const single = demoOk !== codeOk;

  return (
    <div className="flex gap-3 pt-3 border-t border-border/50">
      {demoOk && (
        <a
          href={project.links.demo as string}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`${single ? 'w-full' : 'flex-1'} text-center py-2 rounded-md text-sm font-medium
                      bg-primary/10 text-primary hover:bg-primary/20 transition-colors`}
        >
          Demo
        </a>
      )}

      {codeOk && (
        <a
          href={project.links.github as string}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`${single ? 'w-full' : 'flex-1'} text-center py-2 rounded-md text-sm font-medium
                      border border-muted-foreground/30 text-foreground
                      hover:border-primary hover:text-primary transition-colors`}
        >
          Code
        </a>
      )}
    </div>
                      );
                })()}

                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal (GRID view) */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[200]">
            {/* Background overlay (visual only now, wrapper handles the click close reliably) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-space-dark/95 backdrop-blur-md"
              aria-hidden="true"
            />

            {/* IMPORTANT: clicking anywhere in this full-screen wrapper closes the modal */}
            <div
              className="relative z-10 w-full h-full flex items-start justify-center px-4 pb-6"
              style={{ paddingTop: NAV_OFFSET_PX }}
              onClick={() => setSelectedProject(null)}
              role="presentation"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="relative w-full max-w-2xl rounded-lg overflow-hidden"
                // Shorter modal: cap from 640 -> 560 (and still responsive to viewport)
                style={{
                  height: `min(480px, calc(100vh - ${NAV_OFFSET_PX + 24}px))`,
                }}
                // Prevent inside clicks from bubbling to wrapper-close
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                <div className="hologram-card relative h-full p-0">
                  {/* Close button still available */}
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="absolute top-3 right-3 p-2 rounded-md text-muted-foreground
                               hover:text-foreground hover:bg-muted/50 transition-colors z-10"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>

                  {/* Inner scroll area (slightly tighter) */}
                  <div className="h-full overflow-y-auto px-6 py-4">
                    {/* Header */}
                    <div className="mb-4 pr-10">
                      <p className="text-xs text-hologram font-mono uppercase tracking-widest mb-2">
                        // PROJECT DATA
                      </p>
                      <h2 className="font-orbitron text-xl md:text-2xl text-foreground mb-2">
                        {selectedProject.name}
                      </h2>
                      <p className="text-muted-foreground">{selectedProject.tagline}</p>
                    </div>

                    {/* Description */}
                    <p className="text-foreground/80 mb-4 leading-relaxed text-sm md:text-base">
                      {selectedProject.description}
                    </p>

                    {/* Tech stack */}
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

                    {/* Impact */}
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

                    {/* Links */}
                    {(() => {
  const demoOk = hasLink(selectedProject.links?.demo);
  const codeOk = hasLink(selectedProject.links?.github);

  if (!demoOk && !codeOk) return null;

  const single = demoOk !== codeOk;

  return (
    <div className={`pt-4 border-t border-hologram/20 ${single ? '' : ''}`}>
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

export default Projects;
