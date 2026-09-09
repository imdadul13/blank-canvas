import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Activity, Sparkles, Zap, ShieldCheck, Compass, Orbit } from 'lucide-react';

export interface MedicalHeroVisualProps {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicId?: string;
  topicName?: string;
  className?: string;
  showTelemetryTag?: boolean;
}

export function getSubjectTelemetry(subjectId: string, topicName: string = '') {
  const normTopic = (topicName || '').toLowerCase();

  // Cross-specialty / Topic-based detection
  if (
    normTopic.includes('cardio') ||
    normTopic.includes('heart') ||
    normTopic.includes('ecg') ||
    normTopic.includes('stemi') ||
    normTopic.includes('arrhythmia') ||
    normTopic.includes('wpw') ||
    normTopic.includes('block')
  ) {
    return { label: '72 bpm · Sinus Rhythm', status: 'Conduction Active', dotColor: '#EF4444' };
  }
  if (
    normTopic.includes('respir') ||
    normTopic.includes('lung') ||
    normTopic.includes('pulmon') ||
    normTopic.includes('asthma') ||
    normTopic.includes('copd')
  ) {
    return { label: '16 bpm · SpO₂ 99%', status: 'Tidal Diffusion OK', dotColor: '#0EA5E9' };
  }
  if (
    normTopic.includes('neuro') ||
    normTopic.includes('brain') ||
    normTopic.includes('cranial') ||
    normTopic.includes('stroke') ||
    normTopic.includes('cns')
  ) {
    return { label: 'Alpha Rhythm · 10 Hz', status: 'Synaptic Exocytosis', dotColor: '#8B5CF6' };
  }
  if (
    normTopic.includes('knee') ||
    normTopic.includes('joint') ||
    normTopic.includes('fracture') ||
    normTopic.includes('ligament') ||
    normTopic.includes('limb') ||
    normTopic.includes('bone')
  ) {
    return { label: '120° Flexion · Intact ACL', status: 'Motor/Sensory Normal', dotColor: '#10B981' };
  }

  switch (subjectId) {
    case 'medicine':
      return { label: '72 bpm · Sinus Rhythm', status: 'Conduction Active', dotColor: '#EF4444' };
    case 'anatomy':
      return { label: '120° Flexion · Intact ACL', status: 'Motor/Sensory Normal', dotColor: '#10B981' };
    case 'physiology':
      return { label: '16 bpm · SpO₂ 99%', status: 'Tidal Diffusion OK', dotColor: '#0EA5E9' };
    case 'pathology':
      return { label: 'Cellular Dysplasia · Low Grade', status: 'Cellular Morphology', dotColor: '#EC4899' };
    case 'pharmacology':
      return { label: 'Kd: 1.2 nM · GPCR Agonist', status: 'Orthosteric Lock', dotColor: '#8B5CF6' };
    case 'microbiology':
      return { label: 'Capsid Icosahedron · 12 nm', status: 'Viral Spikes Active', dotColor: '#06B6D4' };
    case 'biochemistry':
      return { label: 'ΔG°: -30.5 kJ/mol · ATP Rotor', status: 'DNA Double Helix', dotColor: '#F59E0B' };
    case 'ophthalmology':
      return { label: 'IOP: 14 mmHg · Fovea 1.0', status: 'Optic Disc 0.3', dotColor: '#14B8A6' };
    case 'ent':
      return { label: 'Stapes Reflex · 4 kHz', status: 'Cochlear Response', dotColor: '#6366F1' };
    case 'surgery':
      return { label: 'Trocar 10mm · FAST Cleared', status: 'Hemostasis Secured', dotColor: '#EF4444' };
    case 'obg':
      return { label: 'FHR: 144 bpm · Reactive NST', status: 'Doppler S/D Ratio 2.2', dotColor: '#F43F5E' };
    case 'pediatrics':
      return { label: 'APGAR: 10/10 · 50th Percentile', status: 'Primitive Reflex OK', dotColor: '#F59E0B' };
    case 'orthopedics':
      return { label: '120° Flexion · Intact ACL', status: 'Cortical Ring Intact', dotColor: '#10B981' };
    case 'dermatology':
      return { label: 'Polarized Light · Nikolsky (-)', status: 'Dermal Papillae', dotColor: '#EC4899' };
    case 'psychiatry':
      return { label: 'Alpha Rhythm · 10 Hz', status: 'Synaptic Exocytosis', dotColor: '#8B5CF6' };
    case 'radiology':
      return { label: 'Axial CT 1mm · 42 HU', status: 'Contrast Phase Live', dotColor: '#0284C7' };
    case 'anesthesia':
      return { label: 'EtCO₂: 38 mmHg · MAC: 1.0', status: 'Airway Secured', dotColor: '#0D9488' };
    case 'fmt':
      return { label: '12 Minutiae Match Points', status: 'Biometric Verified', dotColor: '#64748B' };
    case 'psm':
      return { label: 'R₀: 0.9 · Cold Chain 4°C', status: 'Herd Threshold > 85%', dotColor: '#006B63' };
    default:
      return { label: '72 bpm · Sinus Rhythm', status: 'Clinical Blueprint', dotColor: '#EF4444' };
  }
}


/**
 * Shared SVG Lighting & Filter Definitions
 * High-definition volumetric specular lighting, ambient occlusions, and theme glows.
 */
function SharedDefs({ accent }: { accent: string }) {
  return (
    <defs>
      {/* 3D Volumetric Specular Lighting Filter */}
      <filter id="med-3d-specular" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="4" specularConstant="1.3" specularExponent="24" result="specular">
          <feDistantLight azimuth="220" elevation="45" />
        </feSpecularLighting>
        <feComposite in="specular" in2="SourceAlpha" operator="in" result="specular-cut" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="specular-cut" />
        </feMerge>
      </filter>

      {/* Volumetric Soft Depth Shadow Filter */}
      <filter id="med-depth-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#004d46" floodOpacity="0.28" />
      </filter>

      {/* Ambient Bio-Glow Filter */}
      <filter id="med-ambient-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="8" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Theme Gradients */}
      <linearGradient id="theme-teal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#006B63" />
        <stop offset="50%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>

      <linearGradient id="theme-cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="50%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#2dd4bf" />
      </linearGradient>

      <linearGradient id="theme-bone-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="40%" stopColor="#e2e8f0" />
        <stop offset="85%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>

      <linearGradient id="theme-titanium-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>

      <radialGradient id="cardiac-muscle-3d" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="35%" stopColor="#e11d48" />
        <stop offset="75%" stopColor="#9f1239" />
        <stop offset="100%" stopColor="#4c0519" />
      </radialGradient>

      <radialGradient id="specular-highlight" cx="30%" cy="25%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="vessel-aorta" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="60%" stopColor="#e11d48" />
        <stop offset="100%" stopColor="#881337" />
      </radialGradient>

      <radialGradient id="vessel-pulmonary" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="60%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0f172a" />
      </radialGradient>

      <linearGradient id="nerve-axon-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
  );
}

/**
 * HighRes3DHeroVisual
 * Renders high-definition photographic 3D medical assets with ambient floating animations,
 * specular depth, and graceful fallback to the volumetric SVG 3D models.
 */
function HighRes3DHeroVisual({
  src,
  alt,
  reduced,
  fallback,
  overlay,
}: {
  src: string;
  alt: string;
  reduced: boolean;
  fallback: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  const [loadError, setLoadError] = useState(false);

  if (loadError) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.img
        src={src}
        alt={alt}
        onError={() => setLoadError(true)}
        className="w-auto h-full max-h-[185px] xs:max-h-[205px] sm:max-h-[220px] md:max-h-[235px] lg:max-h-[245px] object-contain select-none pointer-events-none transition-transform duration-300"
        animate={
          reduced
            ? {}
            : {
                y: [-5, 5, -5],
                rotate: [-1.2, 1.4, -1.2],
                scale: [1, 1.03, 0.992, 1.03, 1],
                filter: [
                  'drop-shadow(0 14px 26px rgba(0,107,99,0.20))',
                  'drop-shadow(0 22px 40px rgba(0,107,99,0.36))',
                  'drop-shadow(0 14px 26px rgba(0,107,99,0.20))',
                ],
              }
        }
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {overlay}
    </div>
  );
}

/**
 * MedicalHeroVisual
 * Ultra-high-resolution 3D animated interactive medical visualization engine.
 * Tailored with precision to the Deep Teal (#006B63) / Turquoise (#0D9488) medical theme.
 */
export const MedicalHeroVisual: React.FC<MedicalHeroVisualProps> = ({
  subjectId,
  subjectName,
  subjectColor,
  topicId = '',
  topicName = '',
  className = '',
  showTelemetryTag = false,
}) => {
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);

  // High-precision 3D tilt tracking for cursor & gyroscope
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Up to 16 degrees 3D rotation for fluid tactile feedback
    const rotX = ((y - centerY) / centerY) * -16;
    const rotY = ((x - centerX) / centerX) * 16;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const accent = subjectColor || '#006B63';

  // Topic-sensitive 3D high-resolution models & visual domains
  const Scene = useMemo(() => {
    const normTopic = (topicName || '').toLowerCase();

    // Clinical sub-specialty overrides for General Medicine & Cross-disciplinary Topics
    const isCardio =
      subjectId === 'medicine' ||
      normTopic.includes('cardio') ||
      normTopic.includes('heart') ||
      normTopic.includes('ecg') ||
      normTopic.includes('coronary') ||
      normTopic.includes('cvs');

    const isNeuro =
      subjectId === 'psychiatry' ||
      normTopic.includes('neuro') ||
      normTopic.includes('brain') ||
      normTopic.includes('stroke') ||
      normTopic.includes('cranial') ||
      normTopic.includes('cns');

    const isRespiratory =
      subjectId === 'physiology' ||
      normTopic.includes('respir') ||
      normTopic.includes('lung') ||
      normTopic.includes('pulmon') ||
      normTopic.includes('copd') ||
      normTopic.includes('asthma');

    if (isCardio) {
      return (
        <HighRes3DHeroVisual
          src="/images/medical/cardiology_heart_3d.png"
          alt="3D Anatomical Heart with Coronary Circulation"
          reduced={Boolean(reducedMotion)}
          fallback={<Heart3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />}
          overlay={
            !reducedMotion && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-rose-500/10 filter blur-xl animate-pulse" />
              </div>
            )
          }
        />
      );
    }

    if (isNeuro) {
      return (
        <HighRes3DHeroVisual
          src="/images/medical/neurology_brain_3d.png"
          alt="3D Cerebral Cortex and Neural Connectome"
          reduced={Boolean(reducedMotion)}
          fallback={<Brain3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />}
          overlay={
            !reducedMotion && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-cyan-500/10 filter blur-xl animate-pulse" />
              </div>
            )
          }
        />
      );
    }

    if (isRespiratory) {
      return (
        <HighRes3DHeroVisual
          src="/images/medical/respiratory_lungs_3d.png"
          alt="3D Bronchial Tree and Pulmonary Vasculature"
          reduced={Boolean(reducedMotion)}
          fallback={<Lungs3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />}
          overlay={
            !reducedMotion && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-teal-500/10 filter blur-xl animate-pulse" />
              </div>
            )
          }
        />
      );
    }

    // Specific 3D Volumetric Models for all other subjects
    switch (subjectId) {
      case 'anatomy':
      case 'orthopedics': {
        return (
          <HighRes3DHeroVisual
            src="/images/medical/anatomy_joint_3d.png"
            alt="3D Articulated Joint & Musculoskeletal Anatomy"
            reduced={Boolean(reducedMotion)}
            fallback={
              subjectId === 'orthopedics' ? (
                <Orthopedics3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />
              ) : (
                <Anatomy3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />
              )
            }
            overlay={
              !reducedMotion && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-teal-500/10 filter blur-xl animate-pulse" />
                </div>
              )
            }
          />
        );
      }
      case 'pathology':
        return <Pathology3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'pharmacology':
        return <Pharma3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'microbiology':
        return <Microbiology3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'biochemistry':
        return <Biochem3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'ophthalmology':
        return <Ophthalmology3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'ent':
        return <Ent3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'surgery':
        return <Surgery3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'obg':
        return <Obg3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'pediatrics':
        return <Pediatrics3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'dermatology':
        return <Dermatology3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'radiology':
        return <Radiology3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'anesthesia':
        return <Anesthesia3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'fmt':
        return <Forensics3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      case 'psm':
        return <Community3DModel accent={accent} topicName={topicName} reduced={Boolean(reducedMotion)} />;
      default:
        return <Generic3DModel accent={accent} subjectName={subjectName} reduced={Boolean(reducedMotion)} />;
    }
  }, [subjectId, accent, topicName, subjectName, reducedMotion]);

  // Telemetry metadata
  const telemetry = useMemo(() => {
    switch (subjectId) {
      case 'medicine':
        return { label: '72 bpm · Sinus Rhythm', status: 'Conduction Active' };
      case 'anatomy':
        return {
          label: topicName.includes('Knee') ? '120° Flexion · Intact ACL' : "Erb's Point (C5-C6) Intact",
          status: 'Motor/Sensory Normal',
        };
      case 'physiology':
        return { label: 'V/Q: 0.82 · SpO₂: 99%', status: 'Tidal Diffusion OK' };
      case 'pathology':
        return { label: 'GFR: 120 mL/min', status: 'Cellular Morphology' };
      case 'pharmacology':
        return { label: 'Kd: 1.2 nM · GPCR Agonist', status: 'Orthosteric Lock' };
      case 'microbiology':
        return { label: 'Capsid Icosahedron · 12 nm', status: 'Viral Spikes Active' };
      case 'biochemistry':
        return { label: 'ΔG°: -30.5 kJ/mol · ATP Rotor', status: 'DNA Double Helix' };
      case 'ophthalmology':
        return { label: 'IOP: 14 mmHg · Fovea 1.0', status: 'Optic Disc 0.3' };
      case 'ent':
        return { label: 'Stapes Reflex · 4 kHz', status: 'Cochlear Response' };
      case 'surgery':
        return { label: 'Trocar 10mm · FAST Normal', status: 'Hemostasis Secured' };
      case 'obg':
        return { label: 'FHR: 144 bpm · Low Resistance', status: 'Doppler S/D Ratio 2.2' };
      case 'pediatrics':
        return { label: 'APGAR: 10/10 · 50th Percentile', status: 'Primitive Reflex OK' };
      case 'orthopedics':
        return { label: 'Trabecular T-Score: -0.1', status: 'Cortical Ring Intact' };
      case 'dermatology':
        return { label: 'Stratum Basale · Nikolsky (-)', status: 'Dermal Papillae' };
      case 'psychiatry':
        return { label: 'Connectome · 5-HT/DA', status: 'Synaptic Exocytosis' };
      case 'radiology':
        return { label: 'Axial CT 1mm · 42 HU', status: 'Contrast Phase Live' };
      case 'anesthesia':
        return { label: 'EtCO₂: 38 mmHg · MAC: 1.0', status: 'Airway Secured' };
      case 'fmt':
        return { label: '12 Minutiae Match Points', status: 'Biometric Verified' };
      case 'psm':
        return { label: 'R₀: 0.9 · Cold Chain 4°C', status: 'Herd Threshold > 85%' };
      default:
        return { label: 'NBE High-Yield Model', status: 'Clinical Blueprint' };
    }
  }, [subjectId, topicName]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden rounded-3xl transition-transform duration-300 ${className}`}
      style={{
        perspective: '1200px',
        background: `radial-gradient(ellipse at 50% 45%, ${accent}12 0%, ${accent}05 45%, transparent 75%)`,
      }}
    >
      {/* Dynamic 3D Specimen Stage Container */}
      <motion.div
        animate={
          reducedMotion
            ? {}
            : {
                rotateX,
                rotateY,
                scale: isHovered ? 1.045 : 1,
                y: isHovered ? -4 : 0,
              }
        }
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full flex items-center justify-center p-1 sm:p-2"
      >
        {/* Background Volumetric Depth Aura & Isometric Grid Rings */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ transform: 'translateZ(-40px)' }}
        >
          <div
            className="w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full"
            style={{
              background: `radial-gradient(circle, ${accent}26 0%, ${accent}0c 45%, transparent 70%)`,
              filter: 'blur(24px)',
            }}
          />
        </div>

        {/* Ambient Hologram Crosshairs */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25 flex items-center justify-center"
          style={{ transform: 'translateZ(-20px)' }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-[240px] stroke-teal-500/30" fill="none">
            <circle cx="100" cy="100" r="70" strokeWidth="0.75" strokeDasharray="3 4" />
            <circle cx="100" cy="100" r="45" strokeWidth="0.75" />
            <line x1="20" y1="100" x2="180" y2="100" strokeWidth="0.5" strokeDasharray="2 3" />
            <line x1="100" y1="20" x2="100" y2="180" strokeWidth="0.5" strokeDasharray="2 3" />
          </svg>
        </div>

        {/* The Animated 3D Scene Viewport */}
        <div className="relative z-10 w-full h-full max-w-[420px] sm:max-w-[460px] max-h-[205px] sm:max-h-[225px] md:max-h-[245px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${subjectId}-${topicId}`}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotateY: 10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full flex items-center justify-center"
              style={{ transform: 'translateZ(20px)' }}
            >
              {Scene}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Optional Top-Left Telemetry Tag — Disabled by default to avoid duplicate pills in parent containers */}
      {showTelemetryTag && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="absolute top-2.5 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs pointer-events-none z-20"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: accent }}
            />
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ backgroundColor: accent }}
            />
          </span>
          <span className="text-[9.5px] font-mono font-bold text-slate-700 tracking-tight">
            {telemetry.label}
          </span>
        </motion.div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HIGH-RESOLUTION 3D ANATOMICAL & CLINICAL VISUALIZATIONS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 1. CARDIOLOGY / GENERAL MEDICINE
 * High-res 3D Anatomical Heart with Volumetric Ventricles, Aortic Arch Branches,
 * Coronary Circulation, SA/AV Electrical Conduction & Propagating Action Potential
 */
function Heart3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Floating 3D Base Radial Shadow with Organic Cardiac Breathing */}
      <motion.ellipse
        cx="230"
        cy="268"
        rx="105"
        ry="18"
        fill="#004d46"
        fillOpacity="0.16"
        animate={
          reduced
            ? {}
            : {
                rx: [100, 114, 98, 110, 100],
                ry: [16, 21, 15, 19, 16],
                opacity: [0.14, 0.22, 0.12, 0.19, 0.14],
              }
        }
        transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Background Superior Vena Cava & Pulmonary Veins (Blue & Red Stems) */}
      <g opacity="0.92">
        {/* Superior Vena Cava */}
        <path
          d="M176 50 L176 110"
          stroke="url(#vessel-pulmonary)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        {/* Inferior Vena Cava base */}
        <path
          d="M182 205 L182 235"
          stroke="url(#vessel-pulmonary)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Left & Right Pulmonary Vein pairs */}
        <ellipse cx="295" cy="115" rx="8" ry="12" fill="#e11d48" opacity="0.8" />
        <ellipse cx="160" cy="115" rx="8" ry="12" fill="#e11d48" opacity="0.8" />
      </g>

      {/* Pulmonary Artery Trunk (Bifurcating behind Aorta) */}
      <g>
        <path
          d="M210 120 C 205 90 185 78 155 86"
          stroke="url(#vessel-pulmonary)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M210 120 C 220 90 250 82 275 92"
          stroke="url(#vessel-pulmonary)"
          strokeWidth="16"
          strokeLinecap="round"
        />
      </g>

      {/* 3D Aortic Arch (Volumetric curved cylinder with 3 supra-aortic branches) */}
      <g filter="url(#med-3d-specular)">
        <path
          d="M215 125 C 210 65 255 45 285 70 C 300 82 298 115 292 135"
          stroke="url(#vessel-aorta)"
          strokeWidth="24"
          strokeLinecap="round"
        />
        {/* Branch 1: Brachiocephalic Trunk */}
        <path d="M236 56 L 228 32" stroke="url(#vessel-aorta)" strokeWidth="9" strokeLinecap="round" />
        {/* Branch 2: Left Common Carotid */}
        <path d="M256 50 L 254 26" stroke="url(#vessel-aorta)" strokeWidth="8" strokeLinecap="round" />
        {/* Branch 3: Left Subclavian Artery */}
        <path d="M275 55 L 282 30" stroke="url(#vessel-aorta)" strokeWidth="8" strokeLinecap="round" />
      </g>

      {/* 3D Pulsating Ventricular & Atrial Mass (Systole / Diastole dual-beat) */}
      <motion.g
        animate={
          reduced
            ? {}
            : {
                scale: [1, 1.07, 0.97, 1.04, 1],
                rotate: [0, -0.6, 0.4, -0.3, 0],
              }
        }
        transition={{
          duration: 1.15,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.16, 0.32, 0.48, 1],
        }}
        style={{ transformOrigin: '230px 165px' }}
      >
        {/* Right Atrium Body */}
        <ellipse cx="178" cy="132" rx="34" ry="28" fill="url(#cardiac-muscle-3d)" opacity="0.95" />

        {/* Left Atrium Auricle */}
        <path
          d="M276 115 C 295 120 300 135 288 150 C 275 160 268 140 276 115 Z"
          fill="url(#cardiac-muscle-3d)"
        />

        {/* Left & Right Ventricles Anatomical Body */}
        <path
          d="M230 252 C 165 224 135 186 135 146 C 135 115 162 98 195 98 C 215 98 226 110 230 120 C 234 110 246 98 268 98 C 300 98 325 115 325 146 C 325 186 295 224 230 252 Z"
          fill="url(#cardiac-muscle-3d)"
          filter="url(#med-3d-specular)"
        />

        {/* Specular 3D Organic Light Dome */}
        <path
          d="M230 252 C 165 224 135 186 135 146 C 135 115 162 98 195 98 C 215 98 226 110 230 120 C 234 110 246 98 268 98 C 300 98 325 115 325 146 C 325 186 295 224 230 252 Z"
          fill="url(#specular-highlight)"
        />

        {/* Anterior Interventricular Sulcus & Coronary Arterial Tree (LAD & Diagonal Branches) */}
        <path
          d="M230 122 Q 222 165 234 205 Q 238 230 230 250"
          stroke="#ffe4e6"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeOpacity="0.92"
        />
        {/* Diagonal Arterial Branches */}
        <path d="M225 150 Q 198 166 182 178" stroke="#ffe4e6" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.85" />
        <path d="M228 178 Q 206 195 195 208" stroke="#ffe4e6" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.8" />
        <path d="M231 168 Q 262 180 278 190" stroke="#ffe4e6" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.85" />
        <path d="M234 195 Q 260 210 270 222" stroke="#ffe4e6" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.8" />

        {/* Cardiac Conduction Network: SA Node -> Internodal -> AV Node -> His -> Purkinje */}
        <g opacity="0.95">
          {/* SA Node (Sinoatrial) */}
          <circle cx="180" cy="112" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
          <text x="176" y="104" fill="#fef08a" fontSize="8" fontWeight="bold" fontFamily="monospace">SA</text>

          {/* AV Node (Atrioventricular) */}
          <circle cx="225" cy="140" r="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
          <text x="210" y="138" fill="#fef08a" fontSize="8" fontWeight="bold" fontFamily="monospace">AV</text>

          {/* Internodal Pathway */}
          <path d="M180 112 Q 202 124 225 140" stroke="#fef08a" strokeWidth="2.2" strokeDasharray="3 3" />

          {/* Bundle of His & Left/Right Bundle Branches */}
          <path d="M225 140 L 227 175 L 210 215 M 227 175 L 248 215" stroke="#fef08a" strokeWidth="2" strokeDasharray="4 2" />
        </g>
      </motion.g>

      {/* Action Potential Traveling Light Packet */}
      {!reduced && (
        <motion.circle
          r="4.5"
          fill="#ffffff"
          filter="url(#med-ambient-glow)"
          animate={{
            cx: [180, 225, 227, 230],
            cy: [112, 140, 175, 248],
            opacity: [0, 1, 1, 0],
            scale: [0.8, 1.4, 1.2, 0.4],
          }}
          transition={{
            duration: 1.15,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}

      {/* Floating Dynamic ECG Vector Trace (P-Q-R-S-T Lead II) */}
      <g opacity="0.55">
        <path
          d="M30 270 L 110 270 L 120 262 L 130 270 L 138 274 L 145 220 L 154 286 L 162 270 L 175 270 L 190 258 L 205 270 L 230 270"
          stroke="#0D9488"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M230 270 L 260 270 L 270 262 L 280 270 L 288 274 L 295 220 L 304 286 L 312 270 L 325 270 L 340 258 L 355 270 L 430 270"
          stroke="#0D9488"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/**
 * 2. ANATOMY
 * Biomechanical Translucent 3D Knee Joint with Cruciate Ligaments (ACL/PCL)
 * or 3D Brachial Plexus Multi-tier Neural Network (Roots, Trunks, Divisions, Cords)
 */
function Anatomy3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  const isKnee =
    topicName.toLowerCase().includes('knee') ||
    topicName.toLowerCase().includes('joint') ||
    topicName.toLowerCase().includes('ortho') ||
    topicName.toLowerCase().includes('cruciate');

  if (isKnee) {
    return (
      <svg
        viewBox="0 0 460 300"
        className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
        fill="none"
        shapeRendering="geometricPrecision"
      >
        <SharedDefs accent={accent} />

        {/* 3D Distal Femur Shaft & Condyles (Upper Bone) */}
        <g filter="url(#med-3d-specular)">
          <path
            d="M185 30 L 185 95 C 185 125 155 130 170 152 C 185 170 215 170 225 152 C 230 138 238 138 245 152 C 255 170 285 170 300 152 C 315 130 285 125 285 95 L 285 30 Z"
            fill="url(#theme-bone-gradient)"
            stroke="#475569"
            strokeWidth="3"
          />
          {/* Femoral Patellar Groove Specular Contour */}
          <path d="M210 100 Q 235 120 260 100" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* 3D Proximal Tibial Plateau & Shaft (Lower Bone) */}
        <g filter="url(#med-3d-specular)">
          <path
            d="M145 185 C 168 172 208 172 235 178 C 262 172 302 172 325 185 C 315 220 275 228 275 275 L 195 275 C 195 228 155 220 145 185 Z"
            fill="url(#theme-bone-gradient)"
            stroke="#475569"
            strokeWidth="3"
          />
          {/* Fibular Head (Lateral) */}
          <path
            d="M140 195 C 128 202 124 218 132 232 L 138 275 L 152 275 L 148 220 Z"
            fill="url(#theme-bone-gradient)"
            stroke="#475569"
            strokeWidth="2.5"
          />
        </g>

        {/* Translucent Menisci (Turquoise fibrocartilaginous pads) */}
        <ellipse cx="178" cy="172" rx="28" ry="8" fill="#0D9488" fillOpacity="0.75" stroke="#14B8A6" strokeWidth="1.5" />
        <ellipse cx="292" cy="172" rx="28" ry="8" fill="#0D9488" fillOpacity="0.75" stroke="#14B8A6" strokeWidth="1.5" />

        {/* Anterior Cruciate Ligament (ACL) & Posterior Cruciate Ligament (PCL) */}
        {/* PCL (Back) */}
        <path
          d="M255 145 L 205 182"
          stroke="#E11D48"
          strokeWidth="9"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
        {/* ACL (Front with High-Resolution Striations) */}
        <motion.path
          d="M205 145 L 265 182"
          stroke="#006B63"
          strokeWidth="10"
          strokeLinecap="round"
          animate={reduced ? {} : { strokeWidth: [10, 11, 10], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* ACL Internal Tensile Fiber Highlight */}
        <path d="M208 145 L 262 180" stroke="#5eead4" strokeWidth="2.5" strokeLinecap="round" />

        {/* Stress Vector & Tension Indicators */}
        <g opacity="0.9">
          <circle cx="235" cy="164" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
          <text x="235" y="152" fill="#006B63" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            ACL Pivot
          </text>
        </g>
      </svg>
    );
  }

  // Brachial Plexus 3D Neural Architecture (C5-T1 Roots, Trunks, Divisions, Cords, Branches)
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* 3D Vertebral Cervical Root Pillars (C5, C6, C7, C8, T1) */}
      <g>
        {['C5', 'C6', 'C7', 'C8', 'T1'].map((root, i) => (
          <g key={root}>
            <rect
              x="45"
              y={55 + i * 42}
              width="44"
              height="26"
              rx="8"
              fill="#1e293b"
              stroke="#0D9488"
              strokeWidth="2"
              filter="url(#med-3d-specular)"
            />
            <text
              x="67"
              y={72 + i * 42}
              fill="#f8fafc"
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {root}
            </text>
          </g>
        ))}
      </g>

      {/* Neural Pathway Highway with Gold Axonal Sheaths */}
      <g stroke="url(#nerve-axon-gold)" strokeWidth="4.5" strokeLinecap="round" fill="none">
        {/* C5 + C6 -> Superior Trunk */}
        <path d="M89 68 C 135 68 150 90 195 90" />
        <path d="M89 110 C 135 110 150 90 195 90" />

        {/* C7 -> Middle Trunk */}
        <path d="M89 152 L 195 152" />

        {/* C8 + T1 -> Inferior Trunk */}
        <path d="M89 194 C 135 194 150 214 195 214" />
        <path d="M89 236 C 135 236 150 214 195 214" />

        {/* Divisions & Cords (Lateral, Posterior, Medial) */}
        <path d="M195 90 C 235 90 260 110 300 110" />
        <path d="M195 90 C 235 90 260 152 300 152" strokeDasharray="5 3" />
        <path d="M195 152 L 300 152" strokeDasharray="5 3" />
        <path d="M195 214 C 235 214 260 152 300 152" strokeDasharray="5 3" />
        <path d="M195 214 C 235 214 260 195 300 195" />

        {/* Terminal Motor Branches */}
        <path d="M300 110 C 345 110 375 75 425 75" />
        <path d="M300 110 C 345 110 375 130 425 130" />
        <path d="M300 152 C 345 152 375 115 425 115" />
        <path d="M300 152 C 345 152 375 170 425 170" />
        <path d="M300 195 C 345 195 375 225 425 225" />
      </g>

      {/* Erb's Point Landmark (C5-C6 Junction) */}
      <motion.circle
        cx="195"
        cy="90"
        r="9"
        fill="#006B63"
        stroke="#ffffff"
        strokeWidth="3"
        animate={reduced ? {} : { scale: [1, 1.25, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <text
        x="195"
        y="72"
        fill="#006B63"
        fontSize="11"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        Erb's Point
      </text>

      {/* Racing Synaptic Action Potentials */}
      {!reduced && (
        <>
          <motion.circle
            r="4.5"
            fill="#ffffff"
            filter="url(#med-ambient-glow)"
            animate={{
              cx: [89, 140, 195, 250, 300, 360, 425],
              cy: [68, 79, 90, 100, 110, 92, 75],
              opacity: [0, 1, 1, 1, 1, 1, 0],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            r="4.5"
            fill="#ffffff"
            filter="url(#med-ambient-glow)"
            animate={{
              cx: [89, 140, 195, 250, 300, 360, 425],
              cy: [236, 225, 214, 204, 195, 210, 225],
              opacity: [0, 1, 1, 1, 1, 1, 0],
            }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.9, ease: 'easeInOut' }}
          />
        </>
      )}
    </svg>
  );
}

/**
 * 3. PHYSIOLOGY
 * 3D Volumetric Dual Lungs with Transparent Pleura, Bronchial Arborization & Alveolar Gas Exchange
 */
function Lungs3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Cartilaginous Trachea with 3D C-Rings */}
      <g>
        <path d="M230 30 L 230 95" stroke="#475569" strokeWidth="18" strokeLinecap="round" />
        {[40, 52, 64, 76, 88].map((y) => (
          <path key={y} d={`M221 ${y} L 239 ${y}`} stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
        ))}
        {/* Carina Bifurcation */}
        <path d="M230 92 L 195 125 M 230 92 L 265 125" stroke="#475569" strokeWidth="12" strokeLinecap="round" />
      </g>

      {/* Breathing Volumetric Lungs (Right 3 Lobes, Left 2 Lobes with Cardiac Notch) */}
      <motion.g
        animate={
          reduced
            ? {}
            : {
                scaleX: [1, 1.06, 1],
                scaleY: [1, 1.03, 1],
                y: [0, -4, 0],
              }
        }
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '230px 150px' }}
      >
        {/* Right Lung (Superior, Middle, Inferior Lobes) */}
        <g filter="url(#med-3d-specular)">
          <path
            d="M210 115 C 160 105 115 130 115 180 C 115 230 150 255 200 255 C 215 255 215 220 215 190 C 215 155 215 125 210 115 Z"
            fill="url(#theme-teal-gradient)"
            fillOpacity="0.85"
            stroke="#14B8A6"
            strokeWidth="3"
          />
          {/* Horizontal & Oblique Fissures */}
          <path d="M125 170 Q 165 175 210 162" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.65" fill="none" />
          <path d="M135 212 Q 175 200 210 190" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.65" fill="none" />
        </g>

        {/* Left Lung (Superior & Inferior Lobes with Cardiac Notch) */}
        <g filter="url(#med-3d-specular)">
          <path
            d="M250 115 C 300 105 345 130 345 180 C 345 230 310 255 260 255 C 245 255 245 220 245 190 C 245 170 236 150 250 115 Z"
            fill="url(#theme-teal-gradient)"
            fillOpacity="0.85"
            stroke="#14B8A6"
            strokeWidth="3"
          />
          {/* Oblique Fissure */}
          <path d="M252 180 Q 290 195 335 205" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.65" fill="none" />
        </g>

        {/* Bronchial Tree Arborization Inside Lungs */}
        <g stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6">
          {/* Right bronchial branches */}
          <path d="M195 125 L 165 145 L 145 170 M 165 145 L 175 175" />
          <path d="M195 125 L 180 190 L 160 220" />
          {/* Left bronchial branches */}
          <path d="M265 125 L 295 145 L 315 170 M 295 145 L 285 175" />
          <path d="M265 125 L 280 190 L 300 220" />
        </g>
      </motion.g>

      {/* Luminous O2 / CO2 Alveolar Exchange Spheres */}
      {!reduced && (
        <g>
          {/* Mint Oxygen Uptake */}
          <motion.circle
            cx="160"
            cy="165"
            r="5"
            fill="#34D399"
            filter="url(#med-ambient-glow)"
            animate={{ scale: [0.7, 1.4, 0.7], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Cyan Alveolar Diffusion */}
          <motion.circle
            cx="300"
            cy="165"
            r="5"
            fill="#38BDF8"
            filter="url(#med-ambient-glow)"
            animate={{ scale: [0.7, 1.4, 0.7], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 1.1, ease: 'easeInOut' }}
          />
        </g>
      )}

      {/* Diaphragmatic Muscle Base Excursion */}
      <motion.path
        d="M100 268 Q 230 245 360 268"
        stroke="#006B63"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        animate={
          reduced
            ? {}
            : {
                d: [
                  'M100 268 Q 230 245 360 268',
                  'M100 274 Q 230 255 360 274',
                  'M100 268 Q 230 245 360 268',
                ],
              }
        }
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

/**
 * 4. PATHOLOGY
 * 3D Microscopic Glomerular Capsule with Podocytes & Filtration Slits, or Mitotic Neoplasia
 */
function Pathology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  const isNeoplasia =
    topicName.toLowerCase().includes('neoplasia') ||
    topicName.toLowerCase().includes('cancer') ||
    topicName.toLowerCase().includes('tumor');

  if (isNeoplasia) {
    return (
      <svg
        viewBox="0 0 460 300"
        className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
        fill="none"
        shapeRendering="geometricPrecision"
      >
        <SharedDefs accent={accent} />

        {/* 3D Dividing Mitotic Cell with Pleomorphic Membrane */}
        <motion.g
          animate={reduced ? {} : { rotate: [0, 360] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '230px 150px' }}
        >
          <path
            d="M230 60 C 295 55 340 105 330 170 C 320 230 265 255 210 245 C 150 235 115 185 130 125 C 142 75 180 62 230 60 Z"
            fill="url(#cardiac-muscle-3d)"
            stroke="#fda4af"
            strokeWidth="4"
            filter="url(#med-3d-specular)"
          />

          {/* Hyperchromatic Nucleus & Chromatin Clumps */}
          <circle cx="205" cy="140" r="32" fill="#4c0519" stroke="#fda4af" strokeWidth="2.5" />
          <circle cx="255" cy="170" r="26" fill="#4c0519" stroke="#fda4af" strokeWidth="2.5" />

          {/* Mitotic Spindle Fibers */}
          <path d="M185 135 L 275 175 M 200 170 L 260 140" stroke="#fecdd3" strokeWidth="2.5" strokeDasharray="4 3" />
        </motion.g>

        {/* Neo-Angiogenesis Tumor Sprout Capillaries */}
        <path d="M50 150 Q 110 160 145 145" stroke="#E11D48" strokeWidth="4" strokeLinecap="round" />
        <path d="M410 150 Q 350 160 315 175" stroke="#E11D48" strokeWidth="4" strokeLinecap="round" />
        <circle cx="230" cy="150" r="6" fill="#fef08a" />
      </svg>
    );
  }

  // 3D Renal Glomerulus with Bowman's Capsule & Podocyte Filtration
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* 3D Bowman's Capsule Outer Shell */}
      <path
        d="M290 75 C 345 90 360 165 325 215 C 290 265 190 280 155 245 C 110 200 125 130 170 95 C 210 60 260 68 290 75 Z"
        fill="#042F2E"
        stroke="#0D9488"
        strokeWidth="4"
        filter="url(#med-3d-specular)"
      />

      {/* Capillary Tuft with Interlacing Podocyte Foot Processes */}
      <motion.circle
        cx="230"
        cy="155"
        r="42"
        fill="url(#cardiac-muscle-3d)"
        stroke="#ffffff"
        strokeWidth="3.5"
        animate={reduced ? {} : { scale: [1, 1.06, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Afferent & Efferent Arterioles */}
      <path d="M195 90 L 215 125" stroke="#E11D48" strokeWidth="7" strokeLinecap="round" />
      <path d="M265 90 L 245 125" stroke="#E11D48" strokeWidth="5.5" strokeLinecap="round" />

      {/* Filtration Stream into Proximal Convoluted Tubule */}
      <path
        d="M230 198 C 230 230 260 238 260 265"
        stroke="#38BDF8"
        strokeWidth="4.5"
        strokeDasharray="5 4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 5. PHARMACOLOGY
 * 3D Volumetric Dual-Chamber Gelatin Capsule with Micro-pellets, Molecular Ligand & Allosteric Receptor Pocket
 */
function Pharma3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Volumetric Gradients for Capsule & Ligands */}
      <defs>
        <linearGradient id="capsule-teal-body" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="35%" stopColor="#006B63" />
          <stop offset="70%" stopColor="#042f2e" />
          <stop offset="100%" stopColor="#021a19" />
        </linearGradient>
        <linearGradient id="capsule-glass-shell" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#99f6e4" stopOpacity="0.25" />
          <stop offset="85%" stopColor="#0f766e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="pellet-gold" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </radialGradient>
        <radialGradient id="pellet-cyan" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="60%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0e7490" />
        </radialGradient>
        <radialGradient id="pellet-rose" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="60%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#9f1239" />
        </radialGradient>
      </defs>

      {/* Receptor Binding Pocket Backplate with Translucent Bio-Membrane */}
      <path
        d="M60 210 C 120 225 170 190 230 195 C 290 200 340 230 400 215"
        stroke="#0D9488"
        strokeWidth="6"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
      <path
        d="M90 235 C 150 250 200 215 260 220 C 320 225 370 255 420 240"
        stroke="#14B8A6"
        strokeWidth="4"
        strokeLinecap="round"
        strokeOpacity="0.25"
      />

      {/* 3D Floating Dual-Chamber Pharmaceutical Capsule */}
      <motion.g
        animate={
          reduced
            ? {}
            : {
                y: [-4, 4, -4],
                rotate: [0, 2, 0],
              }
        }
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '230px 140px' }}
      >
        {/* Soft Drop Shadow under Capsule */}
        <ellipse cx="230" cy="205" rx="90" ry="18" fill="#004d46" fillOpacity="0.25" filter="blur(8px)" />

        {/* Rotated Capsule Assembly (tilted 18 degrees for dynamic 3D depth) */}
        <g transform="rotate(-18 230 140)">
          {/* Right Chamber: Frosted Glass / Translucent Gelatin Casing */}
          <path
            d="M 230 110 L 290 110 A 30 30 0 0 1 320 140 A 30 30 0 0 1 290 170 L 230 170 Z"
            fill="url(#capsule-glass-shell)"
            stroke="#5eead4"
            strokeWidth="2.5"
            filter="url(#med-3d-specular)"
          />

          {/* Micro-pellets Floating inside Translucent Chamber */}
          <g>
            <circle cx="250" cy="130" r="6" fill="url(#pellet-gold)" />
            <circle cx="270" cy="126" r="5" fill="url(#pellet-cyan)" />
            <circle cx="288" cy="142" r="5.5" fill="url(#pellet-rose)" />
            <circle cx="265" cy="152" r="6" fill="url(#pellet-gold)" />
            <circle cx="248" cy="148" r="5" fill="url(#pellet-cyan)" />
            <circle cx="280" cy="134" r="4.5" fill="url(#pellet-gold)" />
            <circle cx="298" cy="140" r="4" fill="url(#pellet-cyan)" />
          </g>

          {/* Left Chamber: Solid Emerald/Deep-Teal Medical Body */}
          <path
            d="M 230 108 L 170 108 A 32 32 0 0 0 138 140 A 32 32 0 0 0 170 172 L 230 172 Z"
            fill="url(#capsule-teal-body)"
            stroke="#2dd4bf"
            strokeWidth="3"
            filter="url(#med-3d-specular)"
          />

          {/* Capsule Center Locking Ring */}
          <rect x="226" y="107" width="8" height="66" rx="4" fill="#5eead4" stroke="#ffffff" strokeWidth="1.5" />

          {/* 3D Specular Light Sheen along Top Ridge */}
          <path
            d="M 160 118 L 295 118"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeOpacity="0.75"
            filter="blur(1px)"
          />
        </g>

        {/* 3D Chemical Ligand (Ball-and-stick GPCR Agonist Docking into Active Site) */}
        <g transform="translate(60, -35)">
          <line x1="280" y1="180" x2="315" y2="160" stroke="#94a3b8" strokeWidth="3" />
          <line x1="315" y1="160" x2="350" y2="175" stroke="#94a3b8" strokeWidth="3" />
          <line x1="315" y1="160" x2="320" y2="125" stroke="#94a3b8" strokeWidth="3" />

          <circle cx="280" cy="180" r="8" fill="url(#pellet-gold)" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="315" cy="160" r="10" fill="url(#pellet-cyan)" stroke="#ffffff" strokeWidth="2" filter="url(#med-ambient-glow)" />
          <circle cx="350" cy="175" r="7.5" fill="url(#pellet-rose)" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="320" cy="125" r="8" fill="url(#pellet-gold)" stroke="#ffffff" strokeWidth="1.5" />
        </g>
      </motion.g>
    </svg>
  );
}

/**
 * 6. MICROBIOLOGY
 * 3D Faceted Icosahedral Viral Capsid with Glycoprotein Spikes & Nucleic Acid
 */
function Microbiology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <motion.g
        animate={reduced ? {} : { rotate: 360 }}
        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '230px 150px' }}
      >
        {/* Radial Glycoprotein Spikes */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 230 + Math.cos(rad) * 62;
          const y1 = 150 + Math.sin(rad) * 62;
          const x2 = 230 + Math.cos(rad) * 94;
          const y2 = 150 + Math.sin(rad) * 94;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#14B8A6" strokeWidth="4" strokeLinecap="round" />
              <circle cx={x2} cy={y2} r="6" fill="#E11D48" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          );
        })}

        {/* 3D Icosahedral Core Sphere */}
        <circle
          cx="230"
          cy="150"
          r="66"
          fill="url(#theme-teal-gradient)"
          stroke="#5eead4"
          strokeWidth="3.5"
          filter="url(#med-3d-specular)"
        />

        {/* Encapsidated Viral Genome Strand */}
        <path
          d="M195 130 Q 230 150 195 170 Q 230 190 265 170 Q 230 150 265 130"
          stroke="#fef08a"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </motion.g>
    </svg>
  );
}

/**
 * 7. BIOCHEMISTRY
 * 3D Volumetric DNA Double Helix with Helical Depth, Spherical Nucleotides & ATP Synthase Energy Matrix
 */
function Biochem3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <defs>
        <linearGradient id="dna-strand-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#042f2e" />
        </linearGradient>
        <linearGradient id="dna-strand-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <radialGradient id="base-a" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="70%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#164e63" />
        </radialGradient>
        <radialGradient id="base-t" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="70%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#713f12" />
        </radialGradient>
      </defs>

      {/* 3D Volumetric DNA Helical Assembly with Depth Occlusion */}
      <motion.g
        animate={
          reduced
            ? {}
            : {
                y: [-3, 3, -3],
              }
        }
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Ambient Bio-Energy Glow behind Helix */}
        <ellipse cx="230" cy="150" rx="140" ry="50" fill="#0d9488" fillOpacity="0.12" filter="blur(16px)" />

        {/* 11 Helical Rung Steps across the DNA Axis */}
        {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((step, i) => {
          const cx = 230 + step * 32;
          const phase = (step * Math.PI) / 3;
          const y1 = 150 + Math.sin(phase) * 65;
          const y2 = 150 - Math.sin(phase) * 65;
          const zDepth = Math.cos(phase);

          const isFront = zDepth > 0;
          const rungOpacity = isFront ? 0.95 : 0.45;
          const rungWidth = isFront ? 4.5 : 2.5;

          return (
            <g key={i} opacity={rungOpacity}>
              {/* Hydrogen Bond Base-Pair Connector */}
              <line
                x1={cx}
                y1={y1}
                x2={cx}
                y2={y2}
                stroke={isFront ? '#e2e8f0' : '#64748b'}
                strokeWidth={rungWidth}
                strokeDasharray={isFront ? '4 3' : '2 2'}
                strokeLinecap="round"
              />

              {/* Spherical Nucleotide Base at Strand 1 */}
              <circle
                cx={cx}
                cy={y1}
                r={isFront ? 8.5 : 5.5}
                fill="url(#base-a)"
                stroke="#ffffff"
                strokeWidth={isFront ? 2 : 1}
                filter={isFront ? 'url(#med-3d-specular)' : undefined}
              />

              {/* Spherical Nucleotide Base at Strand 2 */}
              <circle
                cx={cx}
                cy={y2}
                r={isFront ? 8.5 : 5.5}
                fill="url(#base-t)"
                stroke="#ffffff"
                strokeWidth={isFront ? 2 : 1}
                filter={isFront ? 'url(#med-3d-specular)' : undefined}
              />
            </g>
          );
        })}

        {/* Continuous 3D Outer Sugar-Phosphate Backbone Ribbon 1 (Cyan/Teal) */}
        <path
          d="M 70,150 Q 102,215 134,150 Q 166,85 198,150 Q 230,215 262,150 Q 294,85 326,150 Q 358,215 390,150"
          stroke="url(#dna-strand-1)"
          strokeWidth="7"
          strokeLinecap="round"
          filter="url(#med-3d-specular)"
        />

        {/* Continuous 3D Outer Sugar-Phosphate Backbone Ribbon 2 (Gold/Amber) */}
        <path
          d="M 70,150 Q 102,85 134,150 Q 166,215 198,150 Q 230,85 262,150 Q 294,215 326,150 Q 358,85 390,150"
          stroke="url(#dna-strand-2)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#med-3d-specular)"
        />

        {/* High-Energy ATP Phosphate Rotor Core in Center */}
        <g transform="translate(230, 150)">
          <circle cx="0" cy="0" r="16" fill="#006B63" stroke="#5eead4" strokeWidth="3" filter="url(#med-ambient-glow)" />
          <text x="0" y="4.5" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            ATP
          </text>
        </g>
      </motion.g>
    </svg>
  );
}

/**
 * 8. OPHTHALMOLOGY
 * 3D Optical Eyeball with Cornea, Crystalline Lens & Retinal Vasculature
 */
function Ophthalmology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Sclera & Optical Globe */}
      <circle
        cx="220"
        cy="150"
        r="92"
        fill="url(#theme-bone-gradient)"
        stroke="#475569"
        strokeWidth="3.5"
        filter="url(#med-3d-specular)"
      />

      {/* Anterior Clear Cornea Dome */}
      <path
        d="M130 108 C 95 128 95 172 130 192"
        stroke="#38BDF8"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Iris & Pupil Sphincter */}
      <ellipse cx="146" cy="150" rx="18" ry="46" fill="url(#theme-teal-gradient)" />
      <ellipse cx="144" cy="150" rx="8" ry="24" fill="#020617" />

      {/* Crystalline Biconvex Lens */}
      <path
        d="M172 115 C 182 132 182 168 172 185 C 162 168 162 132 172 115 Z"
        fill="#e0f2fe"
        stroke="#38BDF8"
        strokeWidth="2.5"
      />

      {/* Optical Light Rays Converging on Fovea */}
      <g stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.9">
        <line x1="40" y1="105" x2="130" y2="124" />
        <line x1="130" y1="124" x2="172" y2="132" />
        <line x1="172" y1="132" x2="312" y2="150" />

        <line x1="40" y1="195" x2="130" y2="176" />
        <line x1="130" y1="176" x2="172" y2="168" />
        <line x1="172" y1="168" x2="312" y2="150" />
      </g>

      {/* Foveal Macular Target */}
      <circle cx="312" cy="150" r="7" fill="#E11D48" stroke="#ffffff" strokeWidth="2" />
      {/* Optic Nerve Head */}
      <path d="M305 168 L 355 186" stroke="#f59e0b" strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 9. ENT (OTORHINOLARYNGOLOGY)
 * 3D Middle Ear Ossicles (Malleus, Incus, Stapes) & Spiral Cochlea
 */
function Ent3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Tympanic Membrane (Eardrum) */}
      <ellipse cx="105" cy="150" rx="12" ry="60" fill="#334155" stroke="#64748b" strokeWidth="3" />

      {/* Ossicular Chain (Malleus, Incus, Stapes) */}
      <path
        d="M110 128 L 160 115 L 160 165"
        stroke="url(#theme-bone-gradient)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M160 115 L 205 130 L 212 165"
        stroke="url(#theme-bone-gradient)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M212 165 L 240 158 L 240 172 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2" />

      {/* 3D Spiral Cochlea Shell */}
      <path
        d="M255 165 C 270 125 320 120 340 150 C 355 180 340 215 305 215 C 275 215 270 195 285 180 C 300 165 315 172 315 188"
        stroke="url(#theme-teal-gradient)"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />

      {/* Acoustic Sound Pressure Waves */}
      {!reduced && (
        <motion.path
          d="M45 120 Q 65 150 45 180 M 65 112 Q 85 150 65 188"
          stroke="#38BDF8"
          strokeWidth="4"
          strokeLinecap="round"
          animate={{ opacity: [0.3, 1, 0.3], x: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

/**
 * 10. SURGERY & GASTROENTEROLOGY
 * 3D Anatomical Gastrointestinal System (Stomach, Duodenum & Intestinal Convolutions)
 */
function Surgery3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_14px_28px_rgba(0,107,99,0.22)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Esophagus tube */}
      <path d="M210 30 L 210 75" stroke="#f43f5e" strokeWidth="18" strokeLinecap="round" filter="url(#med-3d-specular)" />
      
      {/* 3D Anatomical Stomach (Fundus, Greater & Lesser Curvature) */}
      <path
        d="M210 75 C 265 60 310 90 310 135 C 310 180 260 200 215 195 C 190 192 180 175 190 155 C 205 130 200 100 175 88 C 190 75 200 75 210 75 Z"
        fill="url(#cardiac-muscle-3d)"
        stroke="#fda4af"
        strokeWidth="4"
        filter="url(#med-3d-specular)"
      />
      {/* Specular Highlight on Fundus */}
      <path
        d="M235 90 C 270 85 295 105 295 130 C 295 145 280 160 250 160"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Duodenum C-loop */}
      <path
        d="M215 195 C 170 205 160 240 200 260 C 235 275 270 260 270 235"
        stroke="#fb7185"
        strokeWidth="14"
        strokeLinecap="round"
        filter="url(#med-3d-specular)"
      />

      {/* Intestinal Loops / Convolutions */}
      <path
        d="M175 220 Q 230 240 285 220 Q 230 260 175 240"
        stroke="#e11d48"
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Micro Surgical Laser Reticle Indicator */}
      <circle cx="215" cy="140" r="16" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="215" cy="140" r="3" fill="#10B981" />
    </svg>
  );
}

/**
 * 11. OBSTETRICS & GYNECOLOGY (OBG)
 * 3D Volumetric Uterus, Bilateral Fallopian Tubes & Ovaries
 */
function Obg3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_14px_28px_rgba(0,107,99,0.22)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Left & Right Fallopian Tubes */}
      <path
        d="M130 110 C 130 70 190 85 230 90 C 270 85 330 70 330 110"
        stroke="#fda4af"
        strokeWidth="14"
        strokeLinecap="round"
        filter="url(#med-3d-specular)"
      />

      {/* Left & Right Ovaries */}
      <ellipse cx="120" cy="125" rx="18" ry="24" fill="url(#cardiac-muscle-3d)" stroke="#fecdd3" strokeWidth="3" filter="url(#med-3d-specular)" />
      <ellipse cx="340" cy="125" rx="18" ry="24" fill="url(#cardiac-muscle-3d)" stroke="#fecdd3" strokeWidth="3" filter="url(#med-3d-specular)" />

      {/* 3D Pear-Shaped Uterine Body */}
      <path
        d="M230 85 C 290 85 305 135 295 190 C 285 240 255 260 230 260 C 205 260 175 240 165 190 C 155 135 170 85 230 85 Z"
        fill="url(#cardiac-muscle-3d)"
        stroke="#fecdd3"
        strokeWidth="4"
        filter="url(#med-3d-specular)"
      />

      {/* Cervix & Endometrial Cavity */}
      <path
        d="M230 115 L 210 145 L 250 145 Z"
        fill="#4c0519"
        opacity="0.6"
      />
      <path d="M230 145 L 230 230" stroke="#fda4af" strokeWidth="5" strokeLinecap="round" />

      {/* Umbilical / Doppler Vital Glow */}
      <circle cx="230" cy="180" r="10" fill="#38BDF8" stroke="#ffffff" strokeWidth="3" filter="url(#med-ambient-glow)" />
    </svg>
  );
}

/**
 * 12. PEDIATRICS
 * 3D Infant Growth Arc & Vital Milestone Sphere
 */
function Pediatrics3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Growth Percentile Grid (50th, 97th percentile arcs) */}
      <path d="M60 240 Q 200 210 400 60" stroke="#475569" strokeWidth="2.5" strokeDasharray="5 4" />
      <path d="M60 255 Q 200 232 400 105" stroke="#0D9488" strokeWidth="4" />

      {/* 3D Vital Milestone Sphere */}
      <circle
        cx="230"
        cy="172"
        r="50"
        fill="url(#theme-teal-gradient)"
        stroke="#ffffff"
        strokeWidth="4"
        filter="url(#med-3d-specular)"
      />
      <path d="M212 172 Q 230 190 248 172" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="218" cy="158" r="4" fill="#ffffff" />
      <circle cx="242" cy="158" r="4" fill="#ffffff" />
    </svg>
  );
}

/**
 * 13. ORTHOPEDICS
 * 3D Volumetric Proximal Femur Bone with Ward's Triangle & Titanium Dynamic Compression Fixation Plate
 */
function Orthopedics3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <defs>
        <linearGradient id="femur-bone-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#f1f5f9" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <radialGradient id="femoral-head" cx="38%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#e2e8f0" />
          <stop offset="85%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>
        <linearGradient id="titanium-plate" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="45%" stopColor="#f8fafc" />
          <stop offset="75%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>

      <motion.g
        animate={reduced ? {} : { y: [-2, 2, -2] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '230px 150px' }}
      >
        {/* Ambient Bone Shadow */}
        <ellipse cx="230" cy="245" rx="85" ry="16" fill="#0f172a" fillOpacity="0.22" filter="blur(8px)" />

        {/* 3D Proximal Femur Bone: Greater Trochanter, Neck & Shaft */}
        <path
          d="M 195 88 C 220 85 240 102 245 125 L 255 175 C 258 205 260 235 258 265 L 208 265 C 208 230 205 200 198 175 L 180 152 C 165 145 155 130 162 108 C 170 88 185 88 195 88 Z"
          fill="url(#femur-bone-gradient)"
          stroke="#475569"
          strokeWidth="3.5"
          filter="url(#med-3d-specular)"
        />

        {/* Spherical 3D Femoral Head articulating into Acetabulum */}
        <circle
          cx="142"
          cy="85"
          r="34"
          fill="url(#femoral-head)"
          stroke="#475569"
          strokeWidth="3.5"
          filter="url(#med-3d-specular)"
        />

        {/* Femoral Neck Connecting Head to Trochanter */}
        <path
          d="M 165 98 C 178 108 190 115 205 118 L 195 145 C 178 135 162 118 152 105 Z"
          fill="url(#femur-bone-gradient)"
          stroke="#475569"
          strokeWidth="2.5"
        />

        {/* Ward's Triangle & Trabecular Stress Lines (Principal Compressive & Tensile) */}
        <g stroke="#0D9488" strokeWidth="2.2" strokeLinecap="round" opacity="0.8">
          <line x1="145" y1="80" x2="195" y2="135" />
          <line x1="158" y1="72" x2="208" y2="125" />
          <line x1="172" y1="68" x2="218" y2="115" />
        </g>

        {/* Titanium Orthopedic Dynamic Compression Plate (DCP) along Lateral Cortex */}
        <rect
          x="248"
          y="155"
          width="18"
          height="105"
          rx="6"
          fill="url(#titanium-plate)"
          stroke="#ffffff"
          strokeWidth="1.5"
          filter="url(#med-3d-specular)"
        />

        {/* Cortical Bone Screws */}
        {[172, 198, 224, 250].map((y) => (
          <g key={y}>
            <circle cx="257" cy={y} r="4.5" fill="#334155" stroke="#f8fafc" strokeWidth="1.2" />
            <line x1="254" y1={y} x2="260" y2={y} stroke="#ffffff" strokeWidth="1.2" />
          </g>
        ))}

        {/* Biomechanical Compressive Load Vector */}
        <g>
          <path d="M 120 32 L 140 65" stroke="#e11d48" strokeWidth="4" strokeLinecap="round" />
          <polygon points="140,65 128,58 135,50" fill="#e11d48" />
        </g>
      </motion.g>
    </svg>
  );
}

/**
 * 14. DERMATOLOGY
 * 3D Tri-layer Cutaneous Architecture (Stratum Corneum, Epidermis, Dermis & Papillary Loops)
 */
function Dermatology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* Stratum Corneum & Epidermis */}
      <polygon
        points="60,90 400,90 370,128 30,128"
        fill="#fbcfe8"
        stroke="#f472b6"
        strokeWidth="2"
        filter="url(#med-3d-specular)"
      />
      {/* Dermis with Papillae */}
      <polygon
        points="30,128 370,128 340,210 0,210"
        fill="#fda4af"
        stroke="#fb7185"
        strokeWidth="2"
      />
      {/* Subcutis (Adipose Lobules) */}
      <polygon
        points="0,210 340,210 310,270 -30,270"
        fill="#fef08a"
        stroke="#fde047"
        strokeWidth="2"
      />

      {/* Hair Shaft & Follicle Root */}
      <path d="M230 240 L 200 60" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
      <circle cx="230" cy="240" r="10" fill="#78350f" />

      {/* Dermal Capillary Loop */}
      <path d="M130 210 C 130 142 160 142 160 210" stroke="#E11D48" strokeWidth="3.5" fill="none" />
    </svg>
  );
}

/**
 * 15. PSYCHIATRY & NEUROLOGY
 * 3D Cortical Brain Hemispheres with Connectome Tractography & Synaptic Spark
 */
function Brain3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* 3D Cerebral Hemispheres with Cortical Sulci & Gyri */}
      <path
        d="M230 60 C 320 58 360 120 350 188 C 345 240 310 262 230 262 C 150 262 115 240 110 188 C 100 120 140 58 230 60 Z"
        fill="url(#theme-teal-gradient)"
        stroke="#99f6e4"
        strokeWidth="4"
        filter="url(#med-3d-specular)"
      />

      {/* Deep Cortical Gyral Grooves */}
      <path
        d="M175 110 Q 230 135 215 185 Q 200 225 230 248"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M260 110 Q 230 142 268 185"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Synaptic Connectome Firing Spark */}
      {!reduced && (
        <motion.circle
          cx="230"
          cy="140"
          r="6"
          fill="#fef08a"
          filter="url(#med-ambient-glow)"
          animate={{ scale: [0.8, 1.6, 0.8], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

/**
 * 16. RADIOLOGY
 * 3D Volumetric Axial CT/MRI Gantry with Rotating Laser Scanning Beam
 */
function Radiology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      {/* 3D CT Gantry Ring */}
      <ellipse
        cx="230"
        cy="150"
        rx="135"
        ry="105"
        fill="#042F2E"
        stroke="#0D9488"
        strokeWidth="6"
        filter="url(#med-3d-specular)"
      />
      <ellipse cx="230" cy="150" rx="80" ry="65" fill="#020617" />

      {/* Patient Gantry Couch */}
      <polygon
        points="175,195 285,195 315,275 145,275"
        fill="url(#theme-titanium-gradient)"
        stroke="#94a3b8"
        strokeWidth="2.5"
      />

      {/* Moving Holographic Scanning Laser Plane */}
      <motion.line
        x1="150"
        y1="105"
        x2="310"
        y2="105"
        stroke="#38BDF8"
        strokeWidth="4.5"
        strokeLinecap="round"
        filter="url(#med-ambient-glow)"
        animate={reduced ? { y1: 150, y2: 150 } : { y1: [95, 205, 95], y2: [95, 205, 95] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

/**
 * 17. ANESTHESIOLOGY
 * 3D Vaporizer Dial & Capnographic Airway
 */
function Anesthesia3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <circle cx="230" cy="150" r="80" fill="#042F2E" stroke="#0D9488" strokeWidth="6" filter="url(#med-3d-specular)" />
      <circle cx="230" cy="150" r="50" fill="#1e293b" />
      <line x1="230" y1="150" x2="265" y2="115" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M75 255 L 150 255 L 180 210 L 270 210 L 280 255 L 385 255"
        stroke="#10B981"
        strokeWidth="3.5"
        fill="none"
      />
    </svg>
  );
}

/**
 * 18. FORENSIC MEDICINE & TOXICOLOGY (FMT)
 * 3D Volumetric Cranial Calvaria & Forensic Trauma Ballistics Model
 */
function Forensics3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <defs>
        <linearGradient id="cranium-bone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="45%" stopColor="#e2e8f0" />
          <stop offset="75%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <radialGradient id="orbit-socket" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="80%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>
      </defs>

      <motion.g
        animate={reduced ? {} : { y: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '230px 145px' }}
      >
        {/* Soft Ambient Shadow under Calvaria */}
        <ellipse cx="230" cy="245" rx="110" ry="18" fill="#0f172a" fillOpacity="0.2" filter="blur(8px)" />

        {/* 3D Cranial Vault / Calvaria (Anatomical Neurocranium) */}
        <path
          d="M 130 185 C 115 150 120 95 170 65 C 220 35 285 45 320 85 C 345 115 345 160 325 195 C 310 215 285 225 255 222 C 225 220 200 235 175 225 C 145 215 135 200 130 185 Z"
          fill="url(#cranium-bone)"
          stroke="#475569"
          strokeWidth="3.5"
          filter="url(#med-3d-specular)"
        />

        {/* Anatomical Coronal Suture Line */}
        <path
          d="M 235 48 Q 230 75 240 105 Q 235 135 255 165"
          stroke="#64748b"
          strokeWidth="2.5"
          strokeDasharray="4 2"
          strokeLinecap="round"
        />

        {/* Anatomical Squamosal Suture Line */}
        <path
          d="M 205 130 C 235 115 275 125 295 155"
          stroke="#64748b"
          strokeWidth="2"
          strokeDasharray="3 2"
        />

        {/* Orbital Socket / Temporal Fossa (Volumetric Depth Cavity) */}
        <ellipse
          cx="170"
          cy="145"
          rx="22"
          ry="28"
          fill="url(#orbit-socket)"
          stroke="#475569"
          strokeWidth="2.5"
          filter="url(#med-depth-shadow)"
        />

        {/* Zygomatic Arch Contour */}
        <path
          d="M 188 160 C 215 165 245 158 265 175"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />

        {/* Precision Forensic Ballistic Trajectory Vector */}
        <g>
          <line x1="85" y1="90" x2="215" y2="125" stroke="#ef4444" strokeWidth="3" strokeDasharray="6 3" />
          {/* Entry Wound Impact Crater with Radial Fractures */}
          <circle cx="215" cy="125" r="7" fill="#dc2626" stroke="#fecaca" strokeWidth="2" filter="url(#med-ambient-glow)" />
          <path d="M 215 125 L 200 110 M 215 125 L 230 112 M 215 125 L 225 140 M 215 125 L 205 142" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Forensic Caliper / Minutiae Coordinate Target */}
        <g transform="translate(305, 115)">
          <circle cx="0" cy="0" r="16" stroke="#006B63" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="-22" y1="0" x2="22" y2="0" stroke="#006B63" strokeWidth="1" />
          <line x1="0" y1="-22" x2="0" y2="22" stroke="#006B63" strokeWidth="1" />
          <circle cx="0" cy="0" r="3.5" fill="#006B63" />
        </g>
      </motion.g>
    </svg>
  );
}

/**
 * 19. PSM / COMMUNITY MEDICINE
 * 3D Global Epidemiological Surveillance Sphere with Herd Immunity Shield
 */
function Community3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <circle
        cx="230"
        cy="150"
        r="75"
        fill="url(#theme-teal-gradient)"
        stroke="#7dd3fc"
        strokeWidth="3.5"
        filter="url(#med-3d-specular)"
      />
      <ellipse cx="230" cy="150" rx="72" ry="26" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 3" fill="none" />
      <circle cx="200" cy="128" r="6" fill="#fef08a" />
      <circle cx="260" cy="172" r="6" fill="#fef08a" />
    </svg>
  );
}

/**
 * GENERIC CLINICAL FALLBACK
 */
function Generic3DModel({ accent, subjectName, reduced }: { accent: string; subjectName: string; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,107,99,0.18)]"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <SharedDefs accent={accent} />

      <circle
        cx="230"
        cy="150"
        r="75"
        fill="url(#theme-teal-gradient)"
        stroke="#ffffff"
        strokeWidth="4"
        filter="url(#med-3d-specular)"
      />
      <path d="M200 150 L 260 150 M 230 120 L 230 180" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * MedicalSubjectCardVisual
 * High-definition compact visual for subject exploration cards, quick-study modules,
 * and high-yield topic tiles across all 19 FMGE subjects.
 */
/**
 * PureSubject3DModel
 * Renders ONLY the 3D model (PNG or volumetric SVG) without telemetry badges,
 * crosshairs, or tilt stages. Perfect for compact exploration cards, syllabus rows, and thumbnails.
 */
export const PureSubject3DModel: React.FC<{
  subjectId: string;
  topicName?: string;
  accent?: string;
  className?: string;
}> = ({ subjectId, topicName = "", accent = "#006B63", className = "w-full h-full" }) => {
  const normTopic = (topicName || (subjectId === "anatomy" ? "knee joint" : "")).toLowerCase();
  const isCardio = subjectId === "medicine" || normTopic.includes("cardio") || normTopic.includes("heart");
  const isAnatomy = subjectId === "anatomy";
  const isResp = subjectId === "physiology" || normTopic.includes("lung") || normTopic.includes("respir");
  const isNeuro = subjectId === "psychiatry" || normTopic.includes("neuro") || normTopic.includes("brain");

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      {isCardio && (
        <img
          src="/images/medical/medicine_heart_3d.png"
          alt="Heart 3D"
          className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,107,99,0.18)] select-none pointer-events-none"
        />
      )}
      {!isCardio && isAnatomy && (
        <img
          src="/images/medical/anatomy_joint_3d.png"
          alt="Joint 3D"
          className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,107,99,0.18)] select-none pointer-events-none"
        />
      )}
      {!isCardio && !isAnatomy && isResp && (
        <img
          src="/images/medical/respiratory_lungs_3d.png"
          alt="Lungs 3D"
          className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,107,99,0.18)] select-none pointer-events-none"
        />
      )}
      {!isCardio && !isAnatomy && !isResp && isNeuro && (
        <img
          src="/images/medical/neurology_brain_3d.png"
          alt="Brain 3D"
          className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,107,99,0.18)] select-none pointer-events-none"
        />
      )}
      {!isCardio && !isAnatomy && !isResp && !isNeuro && (() => {
        switch (subjectId) {
          case "pathology":
            return <Pathology3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "pharmacology":
            return <Pharma3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "microbiology":
            return <Microbiology3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "biochemistry":
            return <Biochem3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "ophthalmology":
            return <Ophthalmology3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "ent":
            return <Ent3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "surgery":
            return <Surgery3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "obg":
            return <Obg3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "pediatrics":
            return <Pediatrics3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "orthopedics":
            return <Orthopedics3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "dermatology":
            return <Dermatology3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "radiology":
            return <Radiology3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "anesthesia":
            return <Anesthesia3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "fmt":
            return <Forensics3DModel accent={accent} topicName={topicName} reduced={true} />;
          case "psm":
            return <Community3DModel accent={accent} topicName={topicName} reduced={true} />;
          default:
            return <Generic3DModel accent={accent} subjectName={subjectId} reduced={true} />;
        }
      })()}
    </div>
  );
};

/**
 * MedicalSubjectCardVisual
 * High-definition compact visual for subject exploration cards, quick-study modules,
 * and high-yield topic tiles across all 19 FMGE subjects.
 * Uses high-res transparent 3D assets & volumetric 3D models with ZERO cropped artifacts.
 */
export const MedicalSubjectCardVisual: React.FC<{
  subjectId: string;
  subjectName?: string;
  className?: string;
}> = ({ subjectId, className = "w-full h-full" }) => {
  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      <PureSubject3DModel
        subjectId={subjectId}
        topicName={subjectId === "anatomy" ? "knee joint" : ""}
        className="w-full h-full"
      />
    </div>
  );
};
