import React, { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface MedicalHeroVisualProps {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  className?: string;
}

/**
 * Subject-aware dimensional medical illustration, drawn entirely in code
 * (SVG + CSS + Framer Motion).  No raster images.
 *
 * Each FMGE subject maps to ONE prominent, anatomically-shaped object with
 * subtle, living motion (a heartbeat, breathing lungs, pulsing brain, ...).
 *
 * Unknown subject IDs fall back to an editorial subject-tinted generic.
 */
export const MedicalHeroVisual: React.FC<MedicalHeroVisualProps> = ({
  subjectId,
  subjectName,
  subjectColor,
  className = '',
}) => {
  const reducedMotion = useReducedMotion();

  const accent = subjectColor;
  const ink = '#0f172a';

  const halo = useMemo(
    () => ({
      background: `radial-gradient(ellipse at 50% 44%, ${accent}12 0%, ${accent}06 40%, transparent 70%)`,
    }),
    [accent],
  );

  const variants = useMemo(
    () => ({
      medicine: <HeartVisual accent={accent} ink={ink} reduced={reducedMotion} />, // Cardiology
      anatomy: <AnatomyVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      physiology: <LungsVisual accent={accent} ink={ink} reduced={reducedMotion} />, // pulmo
      pathology: <KidneyVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      pharmacology: <PharmaVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      microbiology: <MicroVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      biochemistry: <BiochemVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      ophthalmology: <EyeVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      ent: <EarVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      surgery: <SurgeryVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      obg: <ObgVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      pediatrics: <PediatricsVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      orthopedics: <BoneVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      dermatology: <SkinVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      psychiatry: <BrainVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      radiology: <RadiologyVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      anesthesia: <AnesthesiaVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      fmt: <ForensicVisual accent={accent} ink={ink} reduced={reducedMotion} />,
      psm: <CommunityVisual accent={accent} ink={ink} reduced={reducedMotion} />,
    }),
    [accent, ink, reducedMotion],
  );

  const Scene = variants[subjectId] || <GenericVisual accent={accent} ink={ink} reduced={reducedMotion} />;

  const enter = reducedMotion
    ? { initial: false, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 12, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -12, scale: 0.96 },
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className={`relative overflow-hidden select-none ${className}`}>
      <div className="absolute inset-0 pointer-events-none" style={halo} />

      <div className="relative flex items-center justify-center w-full h-full p-3 sm:p-5 lg:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={subjectId}
            {...enter}
            className="w-full h-full flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {Scene}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
        <span
          className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-400/70"
          style={{ color: `${accent}66` }}
        >
          {subjectName}
        </span>
      </div>
    </div>
  );
};

/* Reusable helical shadow style for depth on organ bodies */
const organShadow = (accent: string) => ({
  filter: `drop-shadow(0 12px 26px ${accent}2a) drop-shadow(0 3px 8px ${accent}14)`,
});
/* Gentle living motion helpers */
const beat = (reduced: boolean) =>
  reduced ? {} : { scale: [1, 1.04, 0.99, 1.02, 1] };
const beatT = (reduced: boolean) =>
  reduced ? { duration: 0 } : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const };
const breathe = (reduced: boolean) =>
  reduced ? {} : { scaleX: [1, 1.04, 1], scaleY: [1, 0.98, 1] };
const breatheT = (reduced: boolean) =>
  reduced ? { duration: 0 } : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' as const };
const pulse = (reduced: boolean) => (reduced ? {} : { opacity: [0.4, 0.9, 0.4] });
const pulseT = (reduced: boolean) =>
  reduced ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const };

/* ═══════════════════════ MEDICINE — ANATOMICAL HEART ═══════════════════════ */
function HeartVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="h-glow" cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="h-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={ink} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#h-glow)" rx="36" />

      {/* Great vessels */}
      <g stroke={accent} strokeWidth="8" strokeLinecap="round" opacity="0.85">
        <path d="M142 40 C 138 60 142 74 156 84" />
        <path d="M178 40 C 182 60 178 74 164 84" />
        <path d="M160 40 v46" />
      </g>

      <motion.g animate={beat(reduced)} transition={beatT(reduced)} style={{ transformOrigin: '160px 140px', ...organShadow(accent) }}>
        {/* Heart body — realistic four-chamber silhouette */}
        <path
          d="M160 196 C 122 166 84 140 84 100 C 84 76 102 60 122 60 C 138 60 152 68 160 80 C 168 68 182 60 198 60 C 218 60 236 76 236 100 C 236 140 198 166 160 196 Z"
          fill="url(#h-body)"
        />
        {/* chambers impression lines */}
        <path d="M160 92 v76" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="1.8" />
        <path d="M106 96 C 120 116 132 138 160 146" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1.6" fill="none" />
        <path d="M214 96 C 200 116 188 138 160 146" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1.6" fill="none" />
        {/* conduction pathway over the face */}
        <path d="M160 80 v14 M160 94 l-14 4 M160 94 l14 4 M160 96 v22 M160 118 l-10 20 M160 118 l10 20" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </motion.g>

      {/* Travelling pulse through conduction */}
      <motion.circle
        r="5"
        fill="#FFFFFF"
        initial={reduced ? false : { cx: 160, cy: 80, opacity: 0.9 }}
        animate={reduced ? { opacity: 0 } : { cx: 160, cy: 190, opacity: [0, 0.95, 0] }}
        transition={reduced ? { duration: 0 } : { duration: 2.6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.2, 1] }}
      />
      {/* vascular highlights */}
      <circle cx="196" cy="104" r="3" fill="#FFFFFF" fillOpacity="0.5" />
      <circle cx="124" cy="104" r="3" fill="#FFFFFF" fillOpacity="0.5" />
    </svg>
  );
}

/* ═══════════════════════ ANATOMY — BRACHIAL PLEXUS ═══════════════════════ */
function AnatomyVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  const branches = [
    'M160 30 C 150 60 140 84 150 104',
    'M160 30 C 170 60 186 78 204 92',
    'M160 30 C 138 70 120 104 108 130',
    'M204 92 C 216 104 226 118 230 136',
    'M150 104 C 138 120 132 136 132 152',
  ];
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="a-glow" cx="50%" cy="40%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#a-glow)" rx="36" />
      <circle cx="160" cy="34" r="8" fill={ink} style={organShadow(accent)} />
      {branches.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke={i === 0 ? accent : ink}
          strokeOpacity={i === 0 ? 1 : 0.85}
          strokeWidth={i === 0 ? 2.8 : 1.9}
          strokeLinecap="round"
          fill="none"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: i * 0.12, ease: 'easeOut' }}
        />
      ))}
      {/* Travel pulse down the visible accent branch */}
      {!reduced && (
        <motion.circle
          r="3.8"
          fill={accent}
          initial={{ cx: 160, cy: 34, opacity: 0.9 }}
          animate={{ cx: [160, 150, 140, 130, 120, 110, 100, 92, 86], cy: [34, 54, 78, 98, 112, 124, 134, 143, 152], opacity: [0, 0.95, 0.9, 0.85, 0.8, 0.7, 0.6, 0.3, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', times: [0,0.1,0.3,0.45,0.6,0.75,0.88,0.97,1] }}
        />
      )}
      <circle cx="132" cy="152" r="5" fill={accent} fillOpacity="0.6" />
      <circle cx="230" cy="136" r="5" fill={accent} fillOpacity="0.6" />
      <circle cx="108" cy="130" r="5" fill={accent} fillOpacity="0.55" />
    </svg>
  );
}

/* ═══════════════════════ PHYSIOLOGY — ANIMATED LUNGS (pulmo) ═══════════════════════ */
function LungsVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="l-glow" cx="50%" cy="46%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="l-lobe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#l-glow)" rx="36" />

      {/* Trachea */}
      <motion.path d="M160 40 v34" stroke={ink} strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round" />
      <path d="M152 40 C 152 30 168 30 168 40" stroke={ink} strokeOpacity="0.7" strokeWidth="5" fill="none" />

      <motion.g animate={breathe(reduced)} transition={breatheT(reduced)} style={{ transformOrigin: '160px 130px' }}>
        {/* Right lung */}
        <motion.path
          d="M168 74 C 200 70 232 84 234 112 C 236 142 220 180 188 194 C 160 206 152 176 152 150 C 152 122 156 84 168 74 Z"
          fill="url(#l-lobe)"
          style={organShadow(accent)}
          initial={reduced ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Left lung */}
        <motion.path
          d="M152 74 C 120 70 88 84 86 112 C 84 142 100 180 132 194 C 160 206 168 176 168 150 C 168 122 164 84 152 74 Z"
          fill="url(#l-lobe)"
          style={organShadow(accent)}
          initial={reduced ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.g>

      {/* Bronchial branch hints */}
      <path d="M160 74 C 172 84 176 100 176 116 M160 74 C 148 84 144 100 144 116" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1.8" fill="none" />

      {/* Airflow particles */}
      {!reduced && (
        <g>
          <motion.circle cx="176" cy="88" r="3" fill="#FFFFFF" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], y: [0, -18] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }} />
          <motion.circle cx="172" cy="96" r="3" fill="#FFFFFF" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], y: [0, -18] }} transition={{ duration: 2.6, repeat: Infinity, delay: 1.1, ease: 'easeOut' }} />
        </g>
      )}
    </svg>
  );
}

/* ═══════════════════════ PATHOLOGY — KIDNEY ═══════════════════════ */
function KidneyVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="k-glow" cx="50%" cy="48%" r="72%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#k-glow)" rx="36" />

      <motion.g animate={pulse(reduced)} transition={pulseT(reduced)} style={{ transformOrigin: '160px 130px' }}>
        {/* Kidney bean silhouette */}
        <motion.path
          d="M200 86 C 232 92 238 132 218 158 C 196 186 128 198 104 176 C 78 152 84 108 108 88 C 136 66 184 76 200 86 Z M108 88 C 126 96 138 118 134 140 C 130 160 118 166 100 160"
          fill={accent}
          fillOpacity="0.14"
          stroke={ink}
          strokeOpacity="0.85"
          strokeWidth="2.6"
          fillRule="evenodd"
          initial={reduced ? false : { scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={organShadow(accent)}
        />
        {/* medulla striations */}
        <g stroke={accent} strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round">
          <path d="M128 108 C 136 124 138 140 130 154" />
          <path d="M146 96 C 154 116 156 138 146 158" />
          <path d="M164 92 C 172 112 174 136 164 158" />
        </g>
        {/* ureter */}
        <path d="M150 160 c -6 18 2 26 16 30" stroke={accent} strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </motion.g>
    </svg>
  );
}

/* ═══════════════════════ PHARMACOLOGY ═══════════════════════ */
function PharmaVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="ph-glow" cx="50%" cy="48%" r="72%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#ph-glow)" rx="36" />

      {/* Capsule */}
      <motion.g animate={pulse(reduced)} transition={pulseT(reduced)} style={{ transformOrigin: '160px 120px', ...organShadow(accent) }}>
        <rect x="104" y="88" width="56" height="60" rx="14" fill="#FFFFFF" stroke={ink} strokeOpacity="0.85" strokeWidth="2.4" />
        <rect x="160" y="88" width="56" height="60" rx="14" fill={accent} fillOpacity="0.85" stroke={ink} strokeOpacity="0.85" strokeWidth="2.4" />
        <path d="M160 96 v44" stroke={ink} strokeOpacity="0.4" strokeWidth="1.6" />
        <path d="M128 110 a10 10 0 0 1 14 0 M128 124 a10 10 0 0 1 14 0" stroke={accent} strokeOpacity="0.6" strokeWidth="1.6" fill="none" />
      </motion.g>
    </svg>
  );
}

/* ═══════════════════════ MICROBIOLOGY ═══════════════════════ */
function MicroVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="m-glow" cx="50%" cy="48%" r="72%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.14" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#m-glow)" rx="36" />

      <motion.g animate={reduced ? {} : { y: [0, -4, 0], rotate: [0, 1.5, 0] }} transition={reduced ? { duration: 0 } : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '160px 132px', ...organShadow(accent) }}>
        <motion.path
          d="M112 92 C 124 58 182 48 214 68 C 246 68 260 100 248 130 C 258 162 230 196 194 188 C 162 204 120 192 112 162 C 84 154 88 116 112 92 Z"
          fill={accent}
          fillOpacity="0.88"
          initial={reduced ? false : { scale: 0.84, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* pili / cilia */}
        <g stroke={accent} strokeOpacity="0.9" strokeWidth="2.4" strokeLinecap="round">
          <path d="M112 92 C 88 66 66 66 48 54" />
          <path d="M248 130 C 276 140 288 128 298 120" />
          <path d="M112 162 C 90 184 76 190 62 196" />
          <path d="M194 188 C 212 208 216 214 226 216" />
        </g>
        {/* nucleus */}
        <circle cx="168" cy="124" r="20" fill="#FFFFFF" fillOpacity="0.9" />
        <circle cx="168" cy="124" r="12" fill={ink} fillOpacity="0.7" />
      </motion.g>

      {/* orbiting satellite dots */}
      {!reduced && (
        <g>
          <circle cx="64" cy="104" r="4" fill={accent} fillOpacity="0.6" />
          <circle cx="258" cy="96" r="4" fill={accent} fillOpacity="0.6" />
          <circle cx="244" cy="176" r="4" fill={accent} fillOpacity="0.6" />
        </g>
      )}
    </svg>
  );
}

/* ═══════════════════════ BIOCHEMISTRY ═══════════════════════ */
function BiochemVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="b-glow" cx="50%" cy="46%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="b-strand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0" />
          <stop offset="50%" stopColor={accent} />
          <stop offset="100%" stopColor={accent} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#b-glow)" rx="36" />

      <motion.g animate={reduced ? {} : { rotate: [0, 2, 0] }} transition={reduced ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '160px 120px' }}>
        {[0, 140].map((ox) => (
          <motion.path
            key={ox}
            d={`M${ox + 20} 60 C ${ox + 60} 120 ${ox + 100} 0 ${ox + 140} 60 C ${ox + 180} 120 ${ox + 60} 120 ${ox} 60`}
            stroke="url(#b-strand)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        ))}
        {[40, 60, 80, 100, 120, 140, 160, 180, 200, 220].map((x) => (
          <line key={x} x1={x + 4} y1={90} x2={x + 14} y2={150} stroke={ink} strokeOpacity="0.4" strokeWidth="1.6" />
        ))}
      </motion.g>
    </svg>
  );
}

/* ═══════════════════════ OPHTHALMOLOGY — EYE ═══════════════════════ */
function EyeVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="ey-glow" cx="50%" cy="46%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ey-iris" cx="50%" cy="45%" r="62%">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={ink} />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#ey-glow)" rx="36" />

      <motion.g style={organShadow(accent)}>
        <motion.path
          d="M70 120 Q 160 60 250 120 Q 160 180 70 120 Z"
          fill="#FFFFFF"
          stroke={ink}
          strokeOpacity="0.5"
          strokeWidth="2"
          initial={reduced ? false : { scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.g>

      {/* iris + pupil */}
      <circle cx="160" cy="122" r="40" fill="url(#ey-iris)" />
      <circle cx="160" cy="122" r="16" fill={ink} />
      <circle cx="152" cy="112" r="8" fill="#FFFFFF" fillOpacity="0.85" />

      {/* iris striations */}
      {!reduced && (
        <g stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1.2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i * 45 * Math.PI) / 180;
            return <line key={i} x1={160 + Math.cos(a) * 20} y1={122 + Math.sin(a) * 20} x2={160 + Math.cos(a) * 36} y2={122 + Math.sin(a) * 36} />;
          })}
        </g>
      )}

      {/* eyelid */}
      <path d="M72 120 C 120 74 210 66 250 118" stroke={accent} strokeOpacity="0.4" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

/* ═══════════════════════ ENT — EAR ═══════════════════════ */
function EarVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="ea-glow" cx="50%" cy="48%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#ea-glow)" rx="36" />

      <motion.g
        animate={reduced ? {} : { scaleY: [1, 1.015, 1] }}
        transition={reduced ? { duration: 0 } : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '160px 130px', ...organShadow(accent) }}
      >
        <motion.path
          d="M184 54 C 150 54 124 72 124 100 C 124 116 134 130 152 132 C 160 133 162 140 156 148 C 170 158 180 170 178 186 C 190 178 194 188 194 198 C 208 182 220 160 220 138 C 220 82 204 54 184 54 Z"
          fill={accent}
          fillOpacity="0.16"
          stroke={ink}
          strokeOpacity="0.85"
          strokeWidth="2.4"
          initial={reduced ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <path d="M178 82 C 166 98 166 126 182 140" stroke={accent} strokeOpacity="0.7" strokeWidth="2" fill="none" />
        {/* sound waves */}
        {!reduced && (
          <g stroke={accent} strokeOpacity="0.6" strokeWidth="1.8" fill="none">
            <motion.path d="M96 108 a18 18 0 0 1 0 24" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.path d="M84 100 a30 30 0 0 1 0 40" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }} />
          </g>
        )}
      </motion.g>
    </svg>
  );
}

/* ═══════════════════════ SURGERY ═══════════════════════ */
function SurgeryVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="su-glow" cx="50%" cy="48%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#su-glow)" rx="36" />

      {/* Scalpel */}
      <motion.g
        animate={reduced ? {} : { rotate: [0, -3, 0] }}
        transition={reduced ? { duration: 0 } : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '160px 140px', ...organShadow(accent) }}
      >
        <path d="M92 196 L 206 82" stroke={ink} strokeOpacity="0.9" strokeWidth="5" strokeLinecap="round" />
        <path d="M206 82 L 74 82" stroke={accent} strokeOpacity="0.3" strokeWidth="1" fill="none" />
        {/* blade */}
        <polygon points="206,82 228,92 210,100 200,90" fill={ink} />
        <circle cx="160" cy="140" r="14" fill={accent} fillOpacity="0.2" stroke={accent} strokeOpacity="0.8" strokeWidth="2" />
        <circle cx="160" cy="140" r="5" fill={accent} />
      </motion.g>
    </svg>
  );
}

/* ═══════════════════════ OBGYN — UTERUS ═══════════════════════ */
function ObgVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="ob-glow" cx="50%" cy="48%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#ob-glow)" rx="36" />

      <motion.g
        animate={reduced ? {} : { scale: [1, 1.02, 1] }}
        transition={reduced ? { duration: 0 } : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '160px 132px', ...organShadow(accent) }}
      >
        {/* Fallopian + uterus */}
        <path d="M96 84 C 130 92 150 110 158 132" stroke={accent} strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M224 84 C 190 92 170 110 162 132" stroke={accent} strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <circle cx="92" cy="80" r="6" fill={accent} fillOpacity="0.6" />
        <circle cx="228" cy="80" r="6" fill={accent} fillOpacity="0.6" />
        <motion.path
          d="M118 120 C 118 84 202 84 202 120 C 202 152 176 170 160 182 C 144 170 118 152 118 120 Z"
          fill={accent}
          fillOpacity="0.16"
          stroke={ink}
          strokeOpacity="0.85"
          strokeWidth="2.6"
          initial={reduced ? false : { scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <circle cx="160" cy="142" r="6" fill={accent} fillOpacity="0.85" />
        <path d="M160 148 v34" stroke={accent} strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="150" cy="110" r="8" fill="#FFFFFF" fillOpacity="0.5" />
      </motion.g>
    </svg>
  );
}

/* ═══════════════════════ PEDIATRICS ═══════════════════════ */
function PediatricsVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="pe-glow" cx="50%" cy="48%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#pe-glow)" rx="36" />

      <motion.g
        animate={reduced ? {} : { y: [0, -3, 0] }}
        transition={reduced ? { duration: 0 } : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '160px 130px', ...organShadow(accent) }}
      >
        <circle cx="160" cy="130" r="58" fill={accent} fillOpacity="0.14" stroke={ink} strokeOpacity="0.8" strokeWidth="2.4" />
        <circle cx="112" cy="88" r="15" fill={accent} fillOpacity="0.2" stroke={ink} strokeOpacity="0.6" strokeWidth="1.6" />
        <circle cx="208" cy="88" r="15" fill={accent} fillOpacity="0.2" stroke={ink} strokeOpacity="0.6" strokeWidth="1.6" />
        <circle cx="140" cy="116" r="5" fill={ink} />
        <circle cx="180" cy="116" r="5" fill={ink} />
        <path d="M144 150 Q 160 160 176 150" stroke={ink} strokeOpacity="0.8" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <circle cx="160" cy="136" r="6" fill={accent} fillOpacity="0.8" />
      </motion.g>
    </svg>
  );
}

/* ═══════════════════════ ORTHOPEDICS — BONE ═══════════════════════ */
function BoneVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="bo-glow" cx="50%" cy="48%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bo-glow)" rx="36" />

      <motion.g animate={reduced ? {} : { rotate: [0, 2, 0] }} transition={reduced ? { duration: 0 } : { duration: 4.4, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '160px 120px', ...organShadow(accent) }}>
        <rect x="142" y="40" width="36" height="150" rx="18" fill="#FFFFFF" stroke={ink} strokeOpacity="0.85" strokeWidth="2.4" />
        <ellipse cx="160" cy="46" rx="26" ry="20" fill={accent} fillOpacity="0.5" stroke={ink} strokeOpacity="0.85" strokeWidth="2" />
        <ellipse cx="160" cy="184" rx="26" ry="20" fill={accent} fillOpacity="0.5" stroke={ink} strokeOpacity="0.85" strokeWidth="2" />
        <line x1="160" y1="78" x2="160" y2="150" stroke={accent} strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
        {/* growth plate hints */}
        <path d="M150 120 h20 M150 128 h20" stroke={accent} strokeOpacity="0.4" strokeWidth="1.6" />
      </motion.g>
    </svg>
  );
}

/* ═══════════════════════ DERMATOLOGY — SKIN ═══════════════════════ */
function SkinVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="sk-glow" cx="50%" cy="46%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#sk-glow)" rx="36" />

      <motion.g animate={reduced ? {} : { scaleY: [1, 1.012, 1] }} transition={reduced ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '160px 120px' }}>
        {[
          { y: 72, h: 34, o: 0.85 },
          { y: 106, h: 40, o: 0.65 },
          { y: 146, h: 48, o: 0.5 },
        ].map((l, i) => (
          <path
            key={i}
            d={`M70 ${l.y} C 120 ${l.y - 12} 200 ${l.y + 12} 250 ${l.y} L250 ${l.y + l.h} C 200 ${l.y + l.h + 12} 120 ${l.y + l.h - 8} 70 ${l.y + l.h} Z`}
            fill={accent}
            fillOpacity={0.16 * (i + 1)}
            stroke={ink}
            strokeOpacity={l.o}
            strokeWidth="2"
            style={{ filter: `drop-shadow(0 6px 14px ${accent}1a)` }}
          />
        ))}
        <g fill={accent} fillOpacity="0.7">
          <circle cx="130" cy="84" r="3" />
          <circle cx="180" cy="78" r="3" />
          <circle cx="212" cy="88" r="3" />
        </g>
      </motion.g>
    </svg>
  );
}

/* ═══════════════════════ PSYCHIATRY — BRAIN ═══════════════════════ */
function BrainVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="br-glow" cx="50%" cy="44%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#br-glow)" rx="36" />

      <motion.g
        animate={reduced ? {} : { scale: [1, 1.015, 1] }}
        transition={reduced ? { duration: 0 } : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '160px 132px', ...organShadow(accent) }}
      >
        <motion.path
          d="M120 66 C 150 40 200 44 214 78 C 236 84 244 116 226 138 C 236 168 210 196 182 192 C 160 208 122 204 108 184 C 84 176 78 148 92 126 C 78 104 92 74 120 66 Z"
          fill={accent}
          fillOpacity="0.12"
          stroke={ink}
          strokeOpacity="0.85"
          strokeWidth="2.4"
          initial={reduced ? false : { scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <path d="M160 48 v150" stroke={accent} strokeOpacity="0.7" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M120 80 C 128 96 122 112 130 126" stroke={ink} strokeOpacity="0.4" strokeWidth="1.6" fill="none" />
        <path d="M196 90 C 190 108 196 122 190 134" stroke={ink} strokeOpacity="0.4" strokeWidth="1.6" fill="none" />
      </motion.g>

      {/* Neural sparkles */}
      {!reduced && (
        <g fill={accent} fillOpacity="0.7">
          <motion.circle cx="120" cy="120" r="3" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="176" cy="150" r="3" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.8, ease: 'easeInOut' }} />
          <motion.circle cx="146" cy="176" r="3" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: 1.4, ease: 'easeInOut' }} />
        </g>
      )}
    </svg>
  );
}

/* ═══════════════════════ RADIOLOGY — SCAN ═══════════════════════ */
function RadiologyVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="ra-glow" cx="50%" cy="46%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#ra-glow)" rx="36" />

      <motion.line x1="70" y1="70" x2="250" y2="70" stroke={accent} strokeWidth="3" strokeLinecap="round" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: 'easeOut' }} />
      <motion.line x1="70" y1="172" x2="250" y2="172" stroke={accent} strokeWidth="3" strokeLinecap="round" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }} />

      {!reduced ? (
        <motion.rect x="70" y="70" width="180" height="102" fill={accent} fillOpacity="0.14" animate={{ y: [0, 16, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      ) : (
        <rect x="70" y="70" width="180" height="102" fill={accent} fillOpacity="0.12" />
      )}

      <path d="M90 90 Q 160 84 230 92 M90 118 Q 160 112 230 120 M90 146 Q 160 140 230 148" stroke={ink} strokeOpacity="0.35" strokeWidth="1.6" fill="none" />
      <circle cx="160" cy="118" r="26" stroke={accent} strokeOpacity="0.6" strokeWidth="1.6" fill={accent} fillOpacity="0.1" />
    </svg>
  );
}

/* ═══════════════════════ ANESTHESIA — SYRINGE ═══════════════════════ */
function AnesthesiaVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="an-glow" cx="50%" cy="48%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#an-glow)" rx="36" />

      <motion.g
        animate={reduced ? {} : { x: [0, -6, 0] }}
        transition={reduced ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '90px 140px', ...organShadow(accent) }}
      >
        <rect x="62" y="116" width="96" height="26" rx="8" fill="#FFFFFF" stroke={ink} strokeOpacity="0.85" strokeWidth="2.4" />
        <line x1="158" y1="122" x2="206" y2="122" stroke={ink} strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round" />
        <line x1="158" y1="136" x2="206" y2="136" stroke={ink} strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round" />
        <rect x="206" y="112" width="12" height="34" rx="6" fill={accent} />
        <polygon points="62,129 30,139 62,140" fill={ink} stroke={accent} strokeWidth="1.4" />
      </motion.g>

      {!reduced && (
        <g fill={accent} fillOpacity="0.7">
          <motion.circle cx="236" cy="150" r="4" animate={{ opacity: [0, 1, 0], y: [0, 10] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }} />
          <motion.circle cx="254" cy="116" r="4" animate={{ opacity: [0, 1, 0], y: [0, 10] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.9, ease: 'easeOut' }} />
        </g>
      )}
    </svg>
  );
}

/* ═══════════════════════ FORENSIC — FINGERPRINT ═══════════════════════ */
function ForensicVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="fo-glow" cx="50%" cy="48%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#fo-glow)" rx="36" />

      <motion.g animate={reduced ? {} : { opacity: [0.85, 1, 0.85] }} transition={reduced ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '160px 124px', ...organShadow(accent) }}>
        <ellipse cx="160" cy="124" rx="70" ry="78" fill="none" stroke={accent} strokeOpacity="0.75" strokeWidth="2.4" />
        <ellipse cx="160" cy="124" rx="46" ry="56" fill="none" stroke={accent} strokeOpacity="0.6" strokeWidth="2.2" />
        <ellipse cx="160" cy="124" rx="22" ry="32" fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="2" />
        <circle cx="160" cy="124" r="7" fill={accent} fillOpacity="0.85" />
      </motion.g>
    </svg>
  );
}

/* ═══════════════════════ COMMUNITY (PSM) ═══════════════════════ */
function CommunityVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  const people = [
    { x: 110, y: 120, r: 17 },
    { x: 160, y: 94, r: 19 },
    { x: 210, y: 120, r: 17 },
  ];
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="cm-glow" cx="50%" cy="46%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#cm-glow)" rx="36" />

      <line x1="127" y1="120" x2="141" y2="106" stroke={accent} strokeOpacity="0.6" strokeWidth="2" />
      <line x1="179" y1="106" x2="193" y2="120" stroke={accent} strokeOpacity="0.6" strokeWidth="2" />
      <line x1="160" y1="104" x2="160" y2="78" stroke={accent} strokeOpacity="0.5" strokeWidth="1.6" />

      {people.map((p, i) => (
        <motion.g
          key={i}
          animate={reduced ? {} : { y: [0, -3, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
          style={organShadow(accent)}
        >
          <circle cx={p.x} cy={p.y} r={p.r} fill={accent} fillOpacity="0.2" stroke={ink} strokeOpacity="0.7" strokeWidth="2" />
          <circle cx={p.x} cy={p.y - p.r} r={p.r * 0.45} fill={accent} fillOpacity="0.55" stroke={ink} strokeOpacity="0.7" strokeWidth="1.6" />
        </motion.g>
      ))}
    </svg>
  );
}

/* ═══════════════════════ GENERIC ═══════════════════════ */
function GenericVisual({ accent, ink, reduced }: { accent: string; ink: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full max-w-[360px]" fill="none">
      <defs>
        <radialGradient id="ge-glow" cx="50%" cy="46%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#ge-glow)" rx="36" />
      <motion.g animate={pulse(reduced)} transition={pulseT(reduced)} style={{ transformOrigin: '160px 122px', ...organShadow(accent) }}>
        <circle cx="160" cy="122" r="66" fill={accent} fillOpacity="0.05" stroke={accent} strokeOpacity="0.55" strokeWidth="2" />
        <circle cx="160" cy="122" r="44" fill={accent} fillOpacity="0.08" stroke={accent} strokeOpacity="0.7" strokeWidth="2" />
        <circle cx="160" cy="122" r="24" fill={accent} fillOpacity="0.16" />
        <circle cx="150" cy="112" r="9" fill="#FFFFFF" fillOpacity="0.35" />
      </motion.g>
    </svg>
  );
}
