import { motion } from 'framer-motion';
import { Radio, Download } from 'lucide-react';
import HologramTimeline from '@/components/HologramTimeline';

const Experience = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Optional: subtle tint overlay WITHOUT hiding stars */}
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, hsl(var(--space-dark) / 0.55), hsl(var(--space-deep) / 0.35), hsl(var(--space-dark) / 0.6))',
        }}
      />

      {/* Content */}
      <main className="relative z-20 pt-28 md:pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 text-hologram text-xs font-mono mb-4">
              <Radio size={14} className="animate-pulse" />
              <span>// ACCESSING FLIGHT LOGS</span>
            </div>

            <h1 className="font-orbitron text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
              Mission History
            </h1>

            <p className="text-muted-foreground max-w-xl mx-auto">
              A chronological record of my professional journey through the software galaxy.
              Each mission has shaped my skills and expanded my horizons.
            </p>

            <motion.a
              href={`${import.meta.env.BASE_URL}resume.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-lg
                        border border-hologram/40 text-hologram font-medium text-sm
                        hover:bg-hologram/10 hover:border-hologram/60 transition-all duration-300
                        group"
            >
              <Download size={16} className="group-hover:animate-bounce" />
              Download Full Resume
            </motion.a>
          </motion.div>

          {/* Timeline */}
          <HologramTimeline />

          {/* Skills Summary */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <div className="hologram-card max-w-3xl mx-auto">
              <div className="flex items-center gap-2 text-hologram text-xs font-mono mb-6">
                <span className="w-2 h-2 rounded-full bg-hologram animate-pulse" />
                <span>// SYSTEM CAPABILITIES</span>
              </div>

              <h2 className="font-orbitron text-xl text-foreground mb-6">Core Competencies</h2>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                    Frontend
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'TypeScript', 'Next.js', 'Vue.js', 'Tailwind CSS', 'Framer Motion'].map(
                      (skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 rounded-md text-sm
                                  bg-primary/10 text-primary border border-primary/20"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                    Backend
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Node.js', 'Python', 'PostgreSQL', 'GraphQL', 'Redis', 'Docker'].map(
                      (skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 rounded-md text-sm
                                  bg-secondary/10 text-secondary-foreground border border-secondary/20"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                    Cloud & DevOps
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['AWS', 'GCP', 'Kubernetes', 'CI/CD', 'Terraform'].map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-md text-sm
                                  bg-accent/10 text-accent border border-accent/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                    Soft Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Leadership', 'Mentoring', 'Architecture', 'Communication'].map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-md text-sm
                                  bg-hologram/10 text-hologram border border-hologram/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Experience;
