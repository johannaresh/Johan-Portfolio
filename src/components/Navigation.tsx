import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Rocket, FileText } from 'lucide-react';
import HyperspeedTransition from './HyperspeedTransition';

const navItems = [
  { path: '/', label: 'Home', icon: '◈' },
  { path: '/projects', label: 'Projects', icon: '◉' },
  { path: '/experience', label: 'Experience', icon: '◎' },
];

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isHyperspeed, setIsHyperspeed] = useState(false);
  const [hyperspeedTarget, setHyperspeedTarget] = useState<string | null>(null);

  const handleNavClick = useCallback(
    (e: React.MouseEvent, path: string) => {
      // Only trigger hyperspeed for navigation TO /projects from other pages
      if (path === '/projects' && location.pathname !== '/projects') {
        e.preventDefault();

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
          navigate(path);
          return;
        }

        setHyperspeedTarget(path);
        setIsHyperspeed(true);
      }
    },
    [location.pathname, navigate]
  );

  const handleHyperspeedComplete = useCallback(() => {
    if (hyperspeedTarget) {
      navigate(hyperspeedTarget);
    }
    setIsHyperspeed(false);
    setHyperspeedTarget(null);
  }, [hyperspeedTarget, navigate]);

  return (
    <>
      {/* Hyperspeed Transition */}
      <HyperspeedTransition isActive={isHyperspeed} onComplete={handleHyperspeedComplete} />

      {/* Desktop Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 hidden md:block">
        <div className="bg-space-dark/80 backdrop-blur-md border-b border-border/30">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Rocket
                  className="text-primary transition-transform duration-300 group-hover:rotate-12"
                  size={24}
                />
                <div className="absolute inset-0 blur-md bg-primary/30 rounded-full -z-10" />
              </div>
              <span className="font-orbitron text-lg tracking-widest text-foreground">
                PORTFOLIO
              </span>
            </Link>

            {/* Nav Items */}
            <div className="hud-panel px-6 py-2">
              <ul className="flex items-center gap-8">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={(e) => handleNavClick(e, item.path)}
                        className={`
                          relative flex items-center gap-2 font-orbitron text-sm tracking-wider
                          transition-all duration-300 group
                          ${
                            isActive
                              ? 'text-primary neon-text'
                              : 'text-muted-foreground hover:text-foreground'
                          }
                        `}
                      >
                        <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                          {item.icon}
                        </span>
                        {item.label}
                        {isActive && (
                          <motion.div
                            layoutId="nav-indicator"
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}

                <li>
                  <a
                    href={`${import.meta.env.BASE_URL}resume.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-md border border-primary/30 
                               text-primary font-orbitron text-sm tracking-wider
                               hover:bg-primary/10 hover:border-primary/60 transition-all duration-300"
                  >
                    <FileText size={14} />
                    Resume
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-space-dark/80 backdrop-blur-md border-b border-border/30 px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Rocket
              className="text-primary transition-transform duration-300 group-hover:rotate-12"
              size={22}
            />
            <span className="font-orbitron text-sm tracking-widest text-foreground">
              PORTFOLIO
            </span>
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-primary hover:text-foreground transition-colors"
            aria-label="Toggle navigation"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-72 z-40 md:hidden"
          >
            <div className="h-full hud-panel rounded-none flex flex-col justify-center p-8 pt-20">
              <div className="flex items-center gap-3 mb-12">
                <Rocket className="text-primary" size={24} />
                <span className="font-orbitron text-lg text-foreground">NAVIGATOR</span>
              </div>

              <ul className="space-y-6">
                {navItems.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <motion.li
                      key={item.path}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.path}
                        onClick={(e) => {
                          handleNavClick(e, item.path);
                          setIsOpen(false);
                        }}
                        className={`
                          flex items-center gap-4 font-orbitron text-lg tracking-wider
                          transition-all duration-300 py-2
                          ${
                            isActive
                              ? 'text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:translate-x-2'
                          }
                        `}
                      >
                        <span className="text-primary text-sm">{item.icon}</span>
                        {item.label}
                        {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-primary glow-pulse" />}
                      </Link>
                    </motion.li>
                  );
                })}

                <motion.li
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <a
                    href={`${import.meta.env.BASE_URL}resume.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 font-orbitron text-lg tracking-wider
                               text-muted-foreground hover:text-foreground transition-all duration-300 py-2"
                  >
                    <FileText size={16} className="text-primary" />
                    Resume
                  </a>
                </motion.li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-space-dark/80 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
