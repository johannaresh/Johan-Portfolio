import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface HudCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  delay?: number;
  className?: string;
  glowColor?: 'primary' | 'secondary' | 'accent' | 'hologram';
}

const glowColors = {
  primary: 'border-primary/30 hover:border-primary/60 hover:shadow-neon',
  secondary: 'border-secondary/30 hover:border-secondary/60 hover:shadow-[0_0_20px_hsl(var(--secondary)/0.5)]',
  accent: 'border-accent/30 hover:border-accent/60 hover:shadow-[0_0_20px_hsl(var(--accent)/0.5)]',
  hologram: 'border-hologram/30 hover:border-hologram/60 hover:shadow-hologram',
};

const HudCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  delay = 0, 
  className = '',
  glowColor = 'primary'
}: HudCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`
        hud-panel p-6 transition-all duration-500
        ${glowColors[glowColor]}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {Icon && (
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <Icon size={20} />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-orbitron text-sm tracking-wider text-foreground uppercase">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary glow-pulse" />
          <span className="text-[10px] text-muted-foreground font-mono">ACTIVE</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

      {/* Content */}
      <div className="text-muted-foreground text-sm leading-relaxed">
        {children}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary/40 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary/40 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />
    </motion.div>
  );
};

export default HudCard;
