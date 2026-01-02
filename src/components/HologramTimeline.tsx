import { motion } from 'framer-motion';
import { Briefcase, MapPin, Calendar } from 'lucide-react';
import experienceData from '@/data/experience.json';

interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  description: string;
  achievements: string[];
  tech: string[];
}

const HologramTimeline = () => {
  const experiences = experienceData as Experience[];

  return (
    <div className="relative max-w-4xl mx-auto py-8">
      {/* Center rail (desktop) + left rail (mobile) */}
      <div
        className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px"
        style={{
          background:
            'linear-gradient(180deg, transparent, hsl(var(--hologram) / 0.5), transparent)',
        }}
      />

      <div className="space-y-12">
        {experiences.map((exp, index) => {
          const isLeft = index % 2 === 0;

          return (
            <div
              key={exp.id}
              className="
                relative
                grid
                grid-cols-[1fr]
                md:grid-cols-[1fr_64px_1fr]
                items-start
              "
            >
              {/* LEFT CARD (desktop) */}
              <div className="hidden md:block">
                {isLeft && (
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="pr-8"
                  >
                    <Card exp={exp} index={index} />
                  </motion.div>
                )}
              </div>

              {/* RAIL COLUMN (desktop) / DOT POSITION (mobile) */}
              <div className="relative flex justify-center">
                {/* Dot */}
                <div
                  className="
                    absolute top-6 z-30 w-4 h-4 rounded-full
                    bg-hologram border-2 border-background glow-pulse
                    left-0 -translate-x-1/2
                    md:left-1/2 md:-translate-x-1/2
                  "
                  style={{ boxShadow: '0 0 15px hsl(var(--hologram) / 0.6)' }}
                />
              </div>

              {/* RIGHT CARD (desktop) */}
              <div className="hidden md:block">
                {!isLeft && (
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="pl-8"
                  >
                    <Card exp={exp} index={index} />
                  </motion.div>
                )}
              </div>

              {/* MOBILE CARD (single column) */}
              <div className="md:hidden pl-8">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card exp={exp} index={index} />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Card = ({ exp, index }: { exp: Experience; index: number }) => {
  return (
    <div className="relative z-10 hologram-card w-full group hover:scale-[1.02] transition-transform duration-300">
      {/* Status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full animate-pulse ${index === 0 ? 'bg-hologram' : 'bg-purple-500'}`}/>
        <span className="text-[10px] font-mono text-hologram/80 uppercase">
          {index === 0 ? 'Current' : 'Complete'}
        </span>
      </div>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-hologram text-xs font-mono mb-2">
          <Briefcase size={12} />
          <span>// MISSION LOG</span>
        </div>
        <h3 className="font-orbitron text-lg text-foreground">{exp.role}</h3>
        <p className="text-primary font-medium">{exp.company}</p>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-hologram/60" />
          {exp.period}
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-hologram/60" />
          {exp.location}
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm mb-4">{exp.description}</p>

      {/* Achievements */}
      <div className="mb-4">
        <p className="text-xs text-hologram/80 uppercase tracking-wider mb-2">Key Achievements</p>
        <ul className="space-y-2">
          {exp.achievements.map((achievement, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="flex items-start gap-2 text-sm text-foreground/80"
            >
              <span className="text-hologram mt-1">▸</span>
              {achievement}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Tech stack */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-hologram/10">
        {exp.tech.map((tech) => (
          <span
            key={tech}
            className="px-2 py-0.5 rounded text-[10px] font-mono uppercase
                       bg-hologram/5 text-hologram/80 border border-hologram/20"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Scanline effect overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100
                   transition-opacity duration-500 rounded-lg overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              hsl(var(--hologram) / 0.02) 2px,
              hsl(var(--hologram) / 0.02) 4px
            )`,
          }}
        />
      </div>
    </div>
  );
};

export default HologramTimeline;
