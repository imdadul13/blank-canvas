import React from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

type HeaderStat = {
  label: string;
  value: string;
  color: string;
};

interface StudyModuleHeaderProps {
  eyebrow: string;
  title: string;
  accentTitle: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  tint: string;
  progress: number;
  progressLabel: string;
  progressMeta: string;
  stats: HeaderStat[];
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const spring = { type: 'spring' as const, stiffness: 260, damping: 26 };

export const StudyModuleHeader: React.FC<StudyModuleHeaderProps> = ({
  eyebrow,
  title,
  accentTitle,
  description,
  icon: Icon,
  accent,
  tint,
  progress,
  progressLabel,
  progressMeta,
  stats,
  primaryAction,
  secondaryAction,
}) => {
  const reduceMotion = useReducedMotion();
  const safeProgress = Math.max(0, Math.min(100, progress));
  const vars = {
    '--module-accent': accent,
    '--module-tint': tint,
  } as React.CSSProperties;

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? { duration: 0 } : spring}
      className="system-page-header study-overhaul-header relative isolate overflow-hidden"
      data-header-art="aurora"
      style={vars}
    >
      <span aria-hidden="true" className="study-overhaul-disc study-overhaul-disc-one"/>
      <span aria-hidden="true" className="study-overhaul-disc study-overhaul-disc-two"/>

      <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:p-10">
        <div className="max-w-2xl">
          <div className="study-overhaul-eyebrow">
            <span className="study-overhaul-icon"><span className="study-overhaul-icon-shine"/><Icon className="h-4 w-4"/></span>
            <span>{eyebrow}</span>
          </div>

          <h1 className="study-overhaul-title">
            {title}<br/>
            <span>{accentTitle}</span>
          </h1>
          <p className="study-overhaul-description">{description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <motion.button
              type="button"
              onClick={primaryAction.onClick}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={spring}
              className="study-overhaul-primary"
            >
              {primaryAction.label}<ArrowRight className="h-4 w-4"/>
            </motion.button>
            {secondaryAction && (
              <motion.button
                type="button"
                onClick={secondaryAction.onClick}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={spring}
                className="study-overhaul-secondary"
              >
                {secondaryAction.label}
              </motion.button>
            )}
          </div>
        </div>

        <div className="study-overhaul-status">
          <div className="flex items-center justify-between gap-5">
            <div>
              <p className="study-overhaul-kicker">{progressLabel}</p>
              <p className="mt-1 text-sm font-semibold text-ink dark:text-white">{progressMeta}</p>
            </div>
            <div className="study-overhaul-ring" style={{ background: `conic-gradient(${accent} ${safeProgress * 3.6}deg, rgba(118,118,128,.14) 0deg)` }}>
              <span>{safeProgress}%</span>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-muted dark:bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${safeProgress}%` }}
              transition={reduceMotion ? { duration: 0 } : { duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ background: accent }}
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { ...spring, delay: 0.1 + index * 0.05 }}
                className="study-overhaul-stat"
              >
                <span className="study-overhaul-stat-dot" style={{ background: stat.color }}/>
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

type InsightItem = {
  eyebrow: string;
  title: string;
  value: string;
  meta: string;
  progress: number;
  color: string;
  icon: LucideIcon;
  description: string;
};

export const StudyInsightRail: React.FC<{
  title: string;
  subtitle: string;
  items: InsightItem[];
}> = ({ title, subtitle, items }) => {
  const reduceMotion = useReducedMotion();

  return (
    <section className="study-insight-rail">
      <div className="study-insight-heading">
        <div>
          <p>At a glance</p>
          <h2>{title}</h2>
        </div>
        <span>{subtitle}</span>
      </div>
      <div className="study-insight-grid">
        {items.map((item, index) => {
          const InsightIcon = item.icon;
          return (
          <motion.article
            key={item.title}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { ...spring, delay: index * 0.06 }}
            className="study-insight-item"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="study-insight-icon" style={{ '--insight-color': item.color } as React.CSSProperties}>
                  <span/>
                  <InsightIcon className="h-4 w-4"/>
                </span>
                <div className="min-w-0">
                  <p className="study-insight-eyebrow" style={{ color: item.color }}>{item.eyebrow}</p>
                  <h3>{item.title}</h3>
                </div>
              </div>
              <strong style={{ color: item.color }}>{item.value}</strong>
            </div>
            <p className="study-insight-description">{item.description}</p>
            <div className="mt-4">
              <div className="study-insight-track">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }}
                  transition={reduceMotion ? { duration: 0 } : { duration: .85, ease: [0.16, 1, 0.3, 1] }}
                  style={{ background: item.color }}
                />
              </div>
              <p className="study-insight-meta">{item.meta}</p>
            </div>
          </motion.article>
        );})}
      </div>
    </section>
  );
};
