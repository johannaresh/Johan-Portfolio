import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Home, Rocket } from "lucide-react";
import Starfield from "@/components/Starfield";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Starfield starCount={100} speed={0.1} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 text-center px-4"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="inline-block mb-8"
        >
          <AlertTriangle size={80} className="text-accent mx-auto" />
        </motion.div>

        <h1 className="font-orbitron text-6xl md:text-8xl font-bold text-foreground mb-4">
          <span className="neon-text">404</span>
        </h1>
        
        <p className="font-orbitron text-xl text-muted-foreground mb-2">
          NAVIGATION ERROR
        </p>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The coordinates you've entered lead to uncharted space. 
          This sector doesn't exist in our star maps.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 rounded-lg
                      bg-primary text-primary-foreground font-orbitron text-sm
                      hover:bg-primary/90 transition-all duration-300 shadow-neon"
          >
            <Home size={18} />
            Return to Base
          </Link>
          <Link
            to="/projects"
            className="flex items-center gap-2 px-6 py-3 rounded-lg
                      border border-secondary/50 text-foreground font-orbitron text-sm
                      hover:border-secondary hover:bg-secondary/10 transition-all duration-300"
          >
            <Rocket size={18} />
            Explore Projects
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
