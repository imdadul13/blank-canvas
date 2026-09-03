import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Activity, Sparkles, Eye, Zap, Compass, ShieldCheck } from 'lucide-react';

export interface MedicalHeroVisualProps {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicId?: string;
  topicName?: string;
  className?: string;
}

/**
 * MedicalHeroVisual
 * Premium 3D-styled animated interactive anatomical and diagnostic models.
 * 
 * Features:
 * - 3D isometric perspective with interactive gyroscope/cursor tilt physics
 * - Multi-layer volumetric depth (specular rim lighting, depth shadows, glow aura)
 * - Topic-aware and subject-aware anatomical fidelity
 * - Organic physiological animations (cardiac beat, conduction wave, breathing, neural firing)
 * - Clinical telemetry readout with live status indicator
 * - Full reduced-motion accessibility support
 */
export const MedicalHeroVisual: React.FC<MedicalHeroVisualProps> = ({
  subjectId,
  subjectName,
  subjectColor,
  topicId = '',
  topicName = '',
  className = '',
}) => {
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);

  // 3D Tilt State for cursor interaction
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

    // Max 10 deg tilt
    const rotX = ((y - centerY) / centerY) * -10;
    const rotY = ((x - centerX) / centerX) * 10;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const accent = subjectColor || '#0284c7';
  const ink = '#0f172a';

  // Topic-sensitive variants
  const Scene = useMemo(() => {
    switch (subjectId) {
      case 'medicine':
        return <Heart3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'anatomy':
        return <Anatomy3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'physiology':
        return <Lungs3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'pathology':
        return <Pathology3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'pharmacology':
        return <Pharma3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'microbiology':
        return <Microbiology3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'biochemistry':
        return <Biochem3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'ophthalmology':
        return <Ophthalmology3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'ent':
        return <Ent3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'surgery':
        return <Surgery3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'obg':
        return <Obg3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'pediatrics':
        return <Pediatrics3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'orthopedics':
        return <Orthopedics3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'dermatology':
        return <Dermatology3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'psychiatry':
        return <Brain3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'radiology':
        return <Radiology3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'anesthesia':
        return <Anesthesia3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'fmt':
        return <Forensics3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      case 'psm':
        return <Community3DModel accent={accent} topicName={topicName} reduced={reducedMotion} />;
      default:
        return <Generic3DModel accent={accent} subjectName={subjectName} reduced={reducedMotion} />;
    }
  }, [subjectId, accent, topicName, subjectName, reducedMotion]);

  // Clinical telemetry badge calculation
  const telemetry = useMemo(() => {
    switch (subjectId) {
      case 'medicine':
        return { label: 'Sinus Conduction · 72 bpm', status: 'Active Rhythm', metric: 'Lead II Normal' };
      case 'anatomy':
        return { label: topicName.includes('Knee') ? 'Cruciate Axis · 120° Flex' : "Erb's Point (C5-C6) · Motor", status: 'Intact Innervation', metric: 'Brachial Trunk' };
      case 'physiology':
        return { label: 'V/Q Ratio: 0.8 · SpO₂: 99%', status: 'Tidal Flow 500 mL', metric: 'Alveolar Diffusion' };
      case 'pathology':
        return { label: 'GFR: 115 mL/min · Bowman', status: 'Cellular Morphology', metric: 'Clear Margins' };
      case 'pharmacology':
        return { label: 'Kd: 1.4 nM · GPCR Agonist', status: 'Receptor Locked', metric: 'Efficacy 98%' };
      case 'microbiology':
        return { label: 'Capsular Glycoprotein · Spikes', status: 'Gram (+) Wall', metric: 'Serotype Active' };
      case 'biochemistry':
        return { label: 'ΔG°: -30.5 kJ/mol · ATP Rotor', status: 'Helix Stability', metric: '10.5 bp/turn' };
      case 'ophthalmology':
        return { label: 'Refraction: 0.0 D · IOP: 14', status: 'Foveal Alignment', metric: 'Optic Disc 0.3' };
      case 'ent':
        return { label: 'Ossicular Stapes · 4000 Hz', status: 'Acoustic Reflex', metric: 'Cochlear Scale' };
      case 'surgery':
        return { label: 'Trocar Port 10 mm · FAST Scan', status: 'Tissue Plane 01', metric: 'Hemostasis OK' };
      case 'obg':
        return { label: 'FHR: 142 bpm · Low Resist', status: 'Spiral Arteriole', metric: 'Doppler Phase' };
      case 'pediatrics':
        return { label: 'APGAR: 9/10 · 50th Percentile', status: 'Milestone Normal', metric: 'Primitive Reflex' };
      case 'orthopedics':
        return { label: 'T-Score: -0.2 · Trabecular', status: 'Stress Vector', metric: 'Cortical Ring' };
      case 'dermatology':
        return { label: 'Stratum Basale · Nikolsky (-)', status: 'Dermal Papillae', metric: 'Keratin Index' };
      case 'psychiatry':
        return { label: 'Synaptic Vesicles · 5-HT/DA', status: 'Reuptake Active', metric: 'Cortical Synapse' };
      case 'radiology':
        return { label: 'Mediastinal Window · 40 HU', status: 'Axial Slicer 1mm', metric: 'Volumetric CT' };
      case 'anesthesia':
        return { label: 'EtCO₂: 38 mmHg · MAC: 1.0', status: 'Airway Secured', metric: 'Sevo Vaporizer' };
      case 'fmt':
        return { label: 'Whorl Loop · 12 Match Points', status: 'Dactyloscopic ID', metric: 'Forensic Ridge' };
      case 'psm':
        return { label: 'R₀: 1.1 · Cold Chain: 4.2°C', status: 'Herd Threshold', metric: 'Surveillance' };
      default:
        return { label: `${subjectName} Core Model`, status: 'Clinical Blueprint', metric: 'NBE High-Yield' };
    }
  }, [subjectId, subjectName, topicName]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden rounded-3xl transition-transform duration-300 ${className}`}
      style={{
        perspective: '1000px',
        background: `radial-gradient(ellipse at 50% 40%, ${accent}0d 0%, ${accent}04 50%, transparent 75%)`,
      }}
    >
      {/* 3D Model Specimen Container */}
      <motion.div
        animate={
          reducedMotion
            ? {}
            : {
                rotateX,
                rotateY,
                scale: isHovered ? 1.02 : 1,
                y: isHovered ? -2 : 0,
              }
        }
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full flex items-center justify-center p-2 sm:p-4"
      >
        {/* Background 3D Isometric Hologram Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 flex items-center justify-center"
          style={{ transform: 'translateZ(-30px)' }}
        >
          <div
            className="w-48 h-48 sm:w-56 sm:h-56 rounded-full"
            style={{
              background: `radial-gradient(circle, ${accent}22 0%, ${accent}08 40%, transparent 70%)`,
              filter: 'blur(16px)',
            }}
          />
        </div>

        {/* The Animated 3D Scene */}
        <div className="relative z-10 w-full h-full max-w-[340px] max-h-[220px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${subjectId}-${topicId}`}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotateY: -8 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotateY: 8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full flex items-center justify-center"
              style={{ transform: 'translateZ(15px)' }}
            >
              {Scene}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 3D Telemetry HUD Badge — High-precision Medical Aesthetic */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="absolute bottom-2.5 left-3 right-3 sm:left-4 sm:right-4 flex items-center justify-between pointer-events-none z-20"
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: accent }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: accent }}
            />
          </span>
          <span className="text-[10px] font-bold font-mono tracking-tight text-slate-800">
            {telemetry.label}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/5 text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider">
          <Activity className="h-2.5 w-2.5" style={{ color: accent }} />
          <span>{subjectName}</span>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   3D ANATOMICAL MODELS & PROCEDURAL SHADERS
   ═══════════════════════════════════════════════════════════════════════════ */

// 1. CARDIOLOGY / GENERAL MEDICINE: 3D Pulsating Heart with Conduction System & Live Waveform
function Heart3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="med-heart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="50%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#9f1239" />
        </linearGradient>
        <linearGradient id="med-aorta-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
        <linearGradient id="med-pulm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <radialGradient id="med-specular" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Floating 3D Depth Rings */}
      <motion.ellipse
        cx="160"
        cy="175"
        rx="70"
        ry="14"
        fill={accent}
        fillOpacity="0.12"
        animate={reduced ? {} : { rx: [68, 76, 68], ry: [13, 16, 13], opacity: [0.1, 0.18, 0.1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Aorta Arch (3D Cylindrical Vessel) */}
      <g opacity="0.95">
        <path
          d="M152 75 C 150 42 178 30 196 46 C 206 54 204 75 200 85"
          stroke="url(#med-aorta-grad)"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
        {/* Branching Brachiocephalic & Carotid Artery Stems */}
        <path d="M165 40 L 160 26" stroke="#fb7185" strokeWidth="6" strokeLinecap="round" />
        <path d="M178 35 L 178 22" stroke="#fb7185" strokeWidth="6" strokeLinecap="round" />
        <path d="M190 38 L 196 26" stroke="#fb7185" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* Pulmonary Artery (Blue Deoxygenated Vessel behind Aorta) */}
      <path
        d="M136 78 C 130 58 116 52 104 62"
        stroke="url(#med-pulm-grad)"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />

      {/* Superior Vena Cava */}
      <path d="M125 45 L 125 75" stroke="url(#med-pulm-grad)" strokeWidth="12" strokeLinecap="round" />

      {/* 3D Anatomical Ventricular Body (Beating Organic Motion) */}
      <motion.g
        animate={
          reduced
            ? {}
            : {
                scale: [1, 1.06, 0.98, 1.04, 1],
              }
        }
        transition={{
          duration: 1.1,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.15, 0.3, 0.45, 1],
        }}
        style={{ transformOrigin: '160px 115px' }}
      >
        {/* Left & Right Ventricle Shell */}
        <path
          d="M160 168 C 120 148 95 125 95 96 C 95 76 112 64 134 64 C 148 64 156 72 160 80 C 164 72 172 64 186 64 C 208 64 225 76 225 96 C 225 125 200 148 160 168 Z"
          fill="url(#med-heart-grad)"
        />
        {/* 3D Specular Highlight Dome */}
        <path
          d="M160 168 C 120 148 95 125 95 96 C 95 76 112 64 134 64 C 148 64 156 72 160 80 C 164 72 172 64 186 64 C 208 64 225 76 225 96 C 225 125 200 148 160 168 Z"
          fill="url(#med-specular)"
        />

        {/* Anterior Interventricular Sulcus & Coronary Artery Network */}
        <path
          d="M160 82 Q 155 110 163 135 Q 166 150 160 166"
          stroke="#ffe4e6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.85"
          fill="none"
        />
        <path d="M157 100 Q 140 110 130 118" stroke="#ffe4e6" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.7" fill="none" />
        <path d="M160 118 Q 178 126 188 132" stroke="#ffe4e6" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.7" fill="none" />

        {/* Sinoatrial & Atrioventricular Conduction Pathway (SA Node -> AV Node -> Purkinje) */}
        <g opacity="0.95">
          <circle cx="132" cy="74" r="3.5" fill="#fef08a" className="drop-shadow-xs" />
          <circle cx="158" cy="92" r="3" fill="#fef08a" />
          <path d="M132 74 L 158 92 L 158 115 L 145 140 M 158 115 L 172 140" stroke="#fef08a" strokeWidth="1.8" strokeDasharray="3 2" fill="none" />
        </g>
      </motion.g>

      {/* Floating Conduction Electrical Impulse Pulse */}
      {!reduced && (
        <motion.circle
          r="4"
          fill="#ffffff"
          animate={{
            cx: [132, 158, 158, 160],
            cy: [74, 92, 115, 160],
            opacity: [0, 1, 1, 0],
            scale: [0.8, 1.4, 1.2, 0.4],
          }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      {/* Background Floating Cardiac Vector Sweep */}
      <path
        d="M20 180 L 70 180 L 78 172 L 86 184 L 92 152 L 100 190 L 106 180 L 125 180"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        fill="none"
      />
      <path
        d="M200 180 L 220 180 L 228 174 L 236 183 L 242 155 L 248 188 L 254 180 L 300 180"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        fill="none"
      />
    </svg>
  );
}

// 2. ANATOMY: 3D Brachial Plexus & Neural Spine / Knee Joint Model
function Anatomy3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  const isKnee = topicName.toLowerCase().includes('knee') || topicName.toLowerCase().includes('joint');

  if (isKnee) {
    return (
      <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
        <defs>
          <linearGradient id="bone-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="60%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="lig-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>

        {/* Femur Condyles (Upper Bone) */}
        <path
          d="M130 20 L 130 65 C 130 85 110 90 120 102 C 130 114 148 114 155 102 C 160 92 165 92 170 102 C 178 114 195 114 205 102 C 215 90 195 85 195 65 L 195 20 Z"
          fill="url(#bone-grad)"
          stroke="#475569"
          strokeWidth="2"
        />

        {/* Tibia Plateau (Lower Bone) */}
        <path
          d="M105 125 C 120 118 145 118 160 122 C 175 118 200 118 215 125 C 210 145 185 150 185 185 L 140 185 C 140 150 115 145 105 125 Z"
          fill="url(#bone-grad)"
          stroke="#475569"
          strokeWidth="2"
        />

        {/* Anterior Cruciate Ligament (ACL) & Posterior Cruciate Ligament (PCL) */}
        <motion.path
          d="M142 100 L 180 125"
          stroke="url(#lig-grad)"
          strokeWidth="7"
          strokeLinecap="round"
          animate={reduced ? {} : { opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M178 100 L 148 125"
          stroke="#f43f5e"
          strokeWidth="6"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />

        {/* Medial & Lateral Menisci */}
        <ellipse cx="125" cy="116" rx="16" ry="5" fill="#38bdf8" fillOpacity="0.75" />
        <ellipse cx="195" cy="116" rx="16" ry="5" fill="#38bdf8" fillOpacity="0.75" />

        {/* Biomechanical Rotation Pinpoints */}
        <circle cx="160" cy="112" r="4" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
      </svg>
    );
  }

  // Brachial Plexus 3D Multi-tier Neural Network (Roots, Trunks, Divisions, Cords, Branches)
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="nerve-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* 3D Vertebral Column / Cervical Roots (C5, C6, C7, C8, T1) */}
      <g opacity="0.85">
        {['C5', 'C6', 'C7', 'C8', 'T1'].map((root, i) => (
          <g key={root}>
            <rect x="35" y={35 + i * 28} width="32" height="18" rx="5" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <text x="51" y={48 + i * 28} fill="#f8fafc" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {root}
            </text>
          </g>
        ))}
      </g>

      {/* Multi-tier Neural Pathway Conduction Lines */}
      <g stroke="url(#nerve-grad)" strokeWidth="3" strokeLinecap="round" fill="none">
        {/* C5 + C6 -> Upper Trunk (Erb's Point) */}
        <path d="M67 44 C 95 44 110 58 135 58" />
        <path d="M67 72 C 95 72 110 58 135 58" />

        {/* C7 -> Middle Trunk */}
        <path d="M67 100 L 135 100" />

        {/* C8 + T1 -> Lower Trunk (Klumpke) */}
        <path d="M67 128 C 95 128 110 142 135 142" />
        <path d="M67 156 C 95 156 110 142 135 142" />

        {/* Divisions -> Cords (Lateral, Posterior, Medial) */}
        <path d="M135 58 C 160 58 175 70 200 70" />
        <path d="M135 58 C 160 58 175 100 200 100" strokeDasharray="4 2" />
        <path d="M135 100 L 200 100" strokeDasharray="4 2" />
        <path d="M135 142 C 160 142 175 100 200 100" strokeDasharray="4 2" />
        <path d="M135 142 C 160 142 175 130 200 130" />

        {/* Terminal Branches (Musculocutaneous, Axillary, Radial, Median, Ulnar) */}
        <path d="M200 70 C 230 70 250 50 280 50" />
        <path d="M200 70 C 230 70 250 90 280 90" />
        <path d="M200 100 C 230 100 250 75 280 75" />
        <path d="M200 100 C 230 100 250 115 280 115" />
        <path d="M200 130 C 230 130 250 145 280 145" />
      </g>

      {/* Erb's Point Glowing Landmark */}
      <motion.circle
        cx="135"
        cy="58"
        r="7"
        fill="#38bdf8"
        stroke="#ffffff"
        strokeWidth="2"
        animate={reduced ? {} : { scale: [1, 1.25, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <text x="135" y="44" fill="#0284c7" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
        Erb's Point (C5-C6)
      </text>

      {/* Action Potential Particles Racing Through Nerve Branches */}
      {!reduced && (
        <>
          <motion.circle
            r="3.5"
            fill="#ffffff"
            animate={{
              cx: [67, 100, 135, 175, 200, 240, 280],
              cy: [44, 52, 58, 64, 70, 60, 50],
              opacity: [0, 1, 1, 1, 1, 1, 0],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            r="3.5"
            fill="#ffffff"
            animate={{
              cx: [67, 100, 135, 175, 200, 240, 280],
              cy: [156, 148, 142, 136, 130, 138, 145],
              opacity: [0, 1, 1, 1, 1, 1, 0],
            }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.8, ease: 'easeInOut' }}
          />
        </>
      )}
    </svg>
  );
}

// 3. PHYSIOLOGY: 3D Volumetric Holographic Lungs with Respiration & Alveolar Exchange
function Lungs3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="lung-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.75" />
        </linearGradient>
        <radialGradient id="lung-depth" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Trachea & Cartilaginous Rings */}
      <g>
        <path d="M160 20 L 160 70" stroke="#94a3b8" strokeWidth="12" strokeLinecap="round" />
        {[28, 38, 48, 58].map((y) => (
          <path key={y} d={`M154 ${y} L 166 ${y}`} stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        ))}
        {/* Carina & Mainstem Bronchi */}
        <path d="M160 66 L 140 85 M 160 66 L 180 85" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
      </g>

      {/* Volumetric Breathing Lungs (3 Lobes Right, 2 Lobes Left) */}
      <motion.g
        animate={
          reduced
            ? {}
            : {
                scaleX: [1, 1.07, 1],
                scaleY: [1, 1.04, 1],
                y: [0, -3, 0],
              }
        }
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '160px 110px' }}
      >
        {/* Right Lung (3 Lobes) */}
        <g>
          <path
            d="M148 78 C 115 72 85 90 85 125 C 85 160 108 178 142 178 C 152 178 152 155 152 135 C 152 108 152 85 148 78 Z"
            fill="url(#lung-grad)"
          />
          <path
            d="M148 78 C 115 72 85 90 85 125 C 85 160 108 178 142 178 C 152 178 152 155 152 135 C 152 108 152 85 148 78 Z"
            fill="url(#lung-depth)"
          />
          {/* Fissure lines (Horizontal & Oblique) */}
          <path d="M92 118 Q 120 120 148 112" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.5" fill="none" />
          <path d="M98 148 Q 125 140 148 132" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.5" fill="none" />
        </g>

        {/* Left Lung (2 Lobes with Cardiac Notch) */}
        <g>
          <path
            d="M172 78 C 205 72 235 90 235 125 C 235 160 212 178 178 178 C 168 178 168 155 168 135 C 168 120 162 108 172 78 Z"
            fill="url(#lung-grad)"
          />
          <path
            d="M172 78 C 205 72 235 90 235 125 C 235 160 212 178 178 178 C 168 178 168 155 168 135 C 168 120 162 108 172 78 Z"
            fill="url(#lung-depth)"
          />
          {/* Oblique Fissure */}
          <path d="M175 125 Q 200 135 228 142" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.5" fill="none" />
        </g>
      </motion.g>

      {/* Luminous O2/CO2 Alveolar Exchange Micro-particles */}
      {!reduced && (
        <g>
          <motion.circle
            cx="115"
            cy="115"
            r="3"
            fill="#ffffff"
            animate={{ scale: [0.6, 1.4, 0.6], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="205"
            cy="115"
            r="3"
            fill="#ffffff"
            animate={{ scale: [0.6, 1.4, 0.6], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.9, ease: 'easeInOut' }}
          />
        </g>
      )}

      {/* Diaphragmatic Baseline Displacement */}
      <motion.path
        d="M80 188 Q 160 170 240 188"
        stroke="#cbd5e1"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        animate={reduced ? {} : { d: ['M80 188 Q 160 170 240 188', 'M80 193 Q 160 178 240 193', 'M80 188 Q 160 170 240 188'] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

// 4. PATHOLOGY: 3D Renal Glomerulus & Mitotic Oncogene Model
function Pathology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  const isNeoplasia = topicName.toLowerCase().includes('neoplasia') || topicName.toLowerCase().includes('cancer');

  if (isNeoplasia) {
    return (
      <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
        <defs>
          <radialGradient id="tumor-grad" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="70%" stopColor="#881337" />
            <stop offset="100%" stopColor="#4c0519" />
          </radialGradient>
        </defs>

        {/* 3D Dividing Mitotic Cell Nucleus */}
        <motion.g
          animate={reduced ? {} : { rotate: [0, 360] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '160px 100px' }}
        >
          {/* Atypical Pleomorphic Cell Membrane */}
          <path
            d="M160 40 C 205 38 235 70 230 115 C 225 155 185 175 145 168 C 105 160 80 125 90 85 C 98 52 125 42 160 40 Z"
            fill="url(#tumor-grad)"
            stroke="#fda4af"
            strokeWidth="3"
          />

          {/* Hyperchromatic Nuclear Chromatin */}
          <circle cx="145" cy="95" r="22" fill="#4c0519" stroke="#fda4af" strokeWidth="1.5" />
          <circle cx="178" cy="115" r="18" fill="#4c0519" stroke="#fda4af" strokeWidth="1.5" />

          {/* Spindle Fibers & Mitotic Figures */}
          <path d="M130 90 L 190 120 M 140 115 L 180 95" stroke="#fecdd3" strokeWidth="2" strokeDasharray="3 2" />
        </motion.g>

        {/* Angiogenesis Microvessels sprouting into tumor */}
        <path d="M40 100 Q 80 105 105 95" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
        <path d="M280 100 Q 240 105 218 115" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
        <circle cx="160" cy="100" r="5" fill="#fef08a" />
      </svg>
    );
  }

  // 3D Renal Glomerular Capsule & Nephron Loop
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="kidney-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#581c87" />
        </linearGradient>
      </defs>

      {/* 3D Renal Capsule Shell */}
      <path
        d="M200 50 C 240 60 250 115 225 150 C 200 185 130 195 105 170 C 75 140 85 90 115 65 C 145 40 180 45 200 50 Z M120 70 C 140 80 150 105 145 130 C 140 150 125 155 110 150"
        fill="url(#kidney-grad)"
        stroke="#c084fc"
        strokeWidth="3"
        fillRule="evenodd"
      />

      {/* Glomerular Capillary Tuft with Podocytes */}
      <motion.circle
        cx="160"
        cy="105"
        r="28"
        fill="#f43f5e"
        fillOpacity="0.85"
        stroke="#ffffff"
        strokeWidth="2.5"
        animate={reduced ? {} : { scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      {/* Afferent & Efferent Arterioles */}
      <path d="M135 60 L 150 85" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
      <path d="M185 60 L 170 85" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />

      {/* Filtration Streams down the Proximal Convoluted Tubule */}
      <path
        d="M160 133 C 160 155 180 160 180 178"
        stroke="#38bdf8"
        strokeWidth="3.5"
        strokeDasharray="4 3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// 5. PHARMACOLOGY: 3D Receptor-Ligand Lock & Key Docking Mechanism
function Pharma3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="gpcr-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        <linearGradient id="drug-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* Phospholipid Bilayer Membrane */}
      <path d="M30 110 L 290 110 M 30 145 L 290 145" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="6 4" />

      {/* GPCR 7-Transmembrane Alpha Helices */}
      {[70, 95, 120, 145, 170, 195, 220].map((x, i) => (
        <rect
          key={i}
          x={x}
          y={80}
          width="16"
          height="85"
          rx="8"
          fill="url(#gpcr-grad)"
          stroke="#6ee7b7"
          strokeWidth="1.5"
        />
      ))}

      {/* Active Binding Pocket (Extracellular Receptor Domain) */}
      <path
        d="M120 80 Q 145 105 170 80"
        stroke="#10b981"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* 3D Docking Drug Ligand Molecule */}
      <motion.g
        animate={
          reduced
            ? {}
            : {
                y: [0, 22, 0],
                rotate: [0, 6, 0],
              }
        }
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '145px 50px' }}
      >
        <polygon points="145,35 165,48 165,70 145,82 125,70 125,48" fill="url(#drug-grad)" stroke="#fde68a" strokeWidth="2.5" />
        <circle cx="145" cy="58" r="7" fill="#ffffff" fillOpacity="0.8" />
      </motion.g>

      {/* G-Protein Alpha/Beta/Gamma Subunit Activation Pulse */}
      {!reduced && (
        <motion.circle
          cx="145"
          cy="175"
          r="9"
          fill="#38bdf8"
          stroke="#ffffff"
          strokeWidth="2"
          animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

// 6. MICROBIOLOGY: 3D Viral Capsid & Glycoprotein Spikes
function Microbiology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <radialGradient id="virus-grad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="60%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#134e4a" />
        </radialGradient>
      </defs>

      {/* Rotating 3D Capsid with Surface Spikes */}
      <motion.g
        animate={reduced ? {} : { rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '160px 100px' }}
      >
        {/* Radial Glycoprotein Spikes (Hemagglutinin / Peplomers) */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 160 + Math.cos(rad) * 45;
          const y1 = 100 + Math.sin(rad) * 45;
          const x2 = 160 + Math.cos(rad) * 68;
          const y2 = 100 + Math.sin(rad) * 68;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5eead4" strokeWidth="3" strokeLinecap="round" />
              <circle cx={x2} cy={y2} r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
            </g>
          );
        })}

        {/* 3D Viral Core Sphere */}
        <circle cx="160" cy="100" r="48" fill="url(#virus-grad)" stroke="#99f6e4" strokeWidth="2.5" />

        {/* Internal Helical Viral RNA/DNA Strand */}
        <path
          d="M135 85 Q 160 100 135 115 Q 160 130 185 115 Q 160 100 185 85"
          stroke="#fef08a"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
    </svg>
  );
}

// 7. BIOCHEMISTRY: 3D DNA Double Helix & Catalytic ATP Rotor
function Biochem3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="dna-strand-1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="dna-strand-2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* 3D Double Helix Rungs and Phosphate Backbones */}
      <g>
        {[-3, -2, -1, 0, 1, 2, 3].map((step, i) => {
          const cx = 160 + step * 36;
          return (
            <g key={i}>
              <motion.line
                x1={cx}
                y1={45}
                x2={cx}
                y2={155}
                stroke="#e2e8f0"
                strokeWidth="2"
                strokeDasharray="4 2"
                animate={reduced ? {} : { y1: [45, 155, 45], y2: [155, 45, 155] }}
                transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
              />
              <motion.circle
                cx={cx}
                r="6"
                fill="url(#dna-strand-1)"
                stroke="#ffffff"
                strokeWidth="1.5"
                animate={reduced ? { cy: 60 } : { cy: [45, 155, 45] }}
                transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
              />
              <motion.circle
                cx={cx}
                r="6"
                fill="url(#dna-strand-2)"
                stroke="#ffffff"
                strokeWidth="1.5"
                animate={reduced ? { cy: 140 } : { cy: [155, 45, 155] }}
                transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// 8. OPHTHALMOLOGY: 3D Optical Eyeball with Crystalline Lens Ray Tracing & Retina
function Ophthalmology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <radialGradient id="eye-globe" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        <radialGradient id="iris-grad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="75%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>
      </defs>

      {/* Sclera & Optical Globe */}
      <circle cx="150" cy="100" r="65" fill="url(#eye-globe)" stroke="#64748b" strokeWidth="2.5" />

      {/* Cornea (Clear Anterior Dome) */}
      <path d="M85 70 C 60 85 60 115 85 130" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Iris & Pupil Sphincter */}
      <ellipse cx="98" cy="100" rx="14" ry="32" fill="url(#iris-grad)" />
      <ellipse cx="96" cy="100" rx="6" ry="16" fill="#0f172a" />

      {/* Biconvex Crystalline Lens */}
      <path d="M115 75 C 122 88 122 112 115 125 C 108 112 108 88 115 75 Z" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2" />

      {/* Optical Light Rays Converging on Fovea Centralis (Retina) */}
      <g stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" opacity="0.9">
        <line x1="20" y1="65" x2="85" y2="80" />
        <line x1="85" y1="80" x2="115" y2="85" />
        <line x1="115" y1="85" x2="215" y2="100" />

        <line x1="20" y1="135" x2="85" y2="120" />
        <line x1="85" y1="120" x2="115" y2="115" />
        <line x1="115" y1="115" x2="215" y2="100" />
      </g>

      {/* Foveal Macular Target on Posterior Retina */}
      <circle cx="215" cy="100" r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
      {/* Optic Nerve Head */}
      <path d="M210 112 L 245 125" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

// 9. ENT: 3D Auditory Middle Ear Ossicles & Spiral Cochlea
function Ent3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="cochlea-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* Tympanic Membrane (Eardrum) */}
      <ellipse cx="70" cy="100" rx="8" ry="42" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />

      {/* Middle Ear Ossicles (Malleus, Incus, Stapes) */}
      <path d="M74 85 L 110 75 L 110 110" stroke="#f8fafc" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M110 75 L 140 85 L 145 110" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" />
      <path d="M145 110 L 165 105 L 165 115 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />

      {/* 3D Spiral Cochlea Shell */}
      <path
        d="M175 110 C 185 85 220 80 235 100 C 245 120 235 145 210 145 C 190 145 185 130 195 120 C 205 110 215 115 215 125"
        stroke="url(#cochlea-grad)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Acoustic Sound Pressure Waves */}
      {!reduced && (
        <motion.path
          d="M25 80 Q 40 100 25 120 M 40 75 Q 55 100 40 125"
          stroke="#38bdf8"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          animate={{ opacity: [0.3, 1, 0.3], x: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

// 10. SURGERY: 3D Laparoscopic Instrument, Mesh & Tissue Planes
function Surgery3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>

      {/* Abdominal Wall Surgical Plane */}
      <polygon points="50,150 270,150 240,110 80,110" fill="#f43f5e" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="1.5" />

      {/* Laparoscopic Trocar Port Shaft */}
      <path d="M240 30 L 160 130" stroke="url(#metal-grad)" strokeWidth="10" strokeLinecap="round" />
      <circle cx="240" cy="30" r="10" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />

      {/* Surgical Grasper / Micro-Scissors Tip */}
      <path d="M160 130 L 145 142 M 160 130 L 152 148" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />

      {/* Laser Alignment Crosshair */}
      <circle cx="150" cy="140" r="14" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="150" cy="140" r="3" fill="#10b981" />
    </svg>
  );
}

// 11. OBSTETRICS & GYNECOLOGY: 3D Gravid Uterus & Doppler Pulse
function Obg3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <radialGradient id="uterus-grad" cx="45%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="70%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#9f1239" />
        </radialGradient>
      </defs>

      {/* Gravid Uterus Myometrium */}
      <path
        d="M160 40 C 215 40 235 90 230 140 C 225 175 195 185 160 185 C 125 185 95 175 90 140 C 85 90 105 40 160 40 Z"
        fill="url(#uterus-grad)"
        stroke="#fecdd3"
        strokeWidth="3"
      />

      {/* Amniotic Fluid & Fetal Silhouette Curve */}
      <path
        d="M160 65 C 185 65 198 90 190 115 C 185 135 165 145 150 140 C 138 135 142 118 152 115 C 162 112 165 95 155 85"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Pulsing Umbilical Doppler Waveform */}
      <motion.circle
        cx="160"
        cy="110"
        r="6"
        fill="#38bdf8"
        stroke="#ffffff"
        strokeWidth="2"
        animate={reduced ? {} : { scale: [1, 1.3, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
    </svg>
  );
}

// 12. PEDIATRICS: 3D Vital Milestone Sphere & Infant Growth Arc
function Pediatrics3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <radialGradient id="ped-grad" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </radialGradient>
      </defs>

      {/* Growth Percentile Curve Grid (50th, 97th Percentile) */}
      <path d="M40 160 Q 140 140 280 40" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M40 170 Q 140 155 280 70" stroke="#38bdf8" strokeWidth="3" fill="none" />

      {/* Glowing Milestone Core */}
      <circle cx="160" cy="115" r="34" fill="url(#ped-grad)" stroke="#ffffff" strokeWidth="3" />
      <path d="M148 115 Q 160 128 172 115" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="152" cy="105" r="3" fill="#ffffff" />
      <circle cx="168" cy="105" r="3" fill="#ffffff" />
    </svg>
  );
}

// 13. ORTHOPEDICS: 3D Trabecular Bone Architecture & Biomechanical Vectors
function Orthopedics3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="ortho-bone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>

      {/* Femur Bone Head, Neck & Shaft */}
      <path
        d="M80 50 C 95 30 125 35 130 60 C 132 75 125 90 140 100 L 220 150 C 235 160 250 150 255 135 L 265 170 L 210 180 L 130 120 C 115 110 100 115 90 100 L 70 80 Z"
        fill="url(#ortho-bone)"
        stroke="#334155"
        strokeWidth="2.5"
      />

      {/* Trabecular Stress Lines (Ward's Triangle) */}
      <g stroke="#38bdf8" strokeWidth="1.5" opacity="0.8">
        <line x1="90" y1="60" x2="125" y2="90" />
        <line x1="100" y1="50" x2="135" y2="80" />
        <line x1="110" y1="45" x2="145" y2="70" />
      </g>

      {/* Force Vector Arrow */}
      <path d="M70 15 L 105 45" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
      <polygon points="105,45 95,40 100,32" fill="#f43f5e" />
    </svg>
  );
}

// 14. DERMATOLOGY: 3D Tri-layer Cutaneous Stratum & Hair Follicle
function Dermatology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      {/* Stratum Corneum & Epidermis Layer */}
      <polygon points="40,60 280,60 260,85 20,85" fill="#fbcfe8" stroke="#f472b6" strokeWidth="1.5" />
      {/* Dermis Layer with Papillae */}
      <polygon points="20,85 260,85 240,140 0,140" fill="#fda4af" stroke="#fb7185" strokeWidth="1.5" />
      {/* Subcutis (Adipose tissue) */}
      <polygon points="0,140 240,140 220,180 -20,180" fill="#fef08a" stroke="#fde047" strokeWidth="1.5" />

      {/* Hair Shaft & Follicle Root */}
      <path d="M160 160 L 140 40" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <circle cx="160" cy="160" r="7" fill="#78350f" />

      {/* Dermal Capillary Loop */}
      <path d="M90 140 C 90 95 110 95 110 140" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

// 15. PSYCHIATRY & NEUROLOGY: 3D Cortical Brain & Synaptic Exocytosis
function Brain3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <radialGradient id="brain-grad" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="70%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#581c87" />
        </radialGradient>
      </defs>

      {/* 3D Cerebral Hemispheres with Cortical Gyri */}
      <path
        d="M160 40 C 220 38 250 80 245 125 C 240 160 215 175 160 175 C 105 175 80 160 75 125 C 70 80 100 38 160 40 Z"
        fill="url(#brain-grad)"
        stroke="#e9d5ff"
        strokeWidth="3"
      />

      {/* Sulcal & Gyral Grooves */}
      <path d="M120 75 Q 160 90 150 125 Q 140 150 160 165" stroke="#f3e8ff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M180 75 Q 160 95 185 125" stroke="#f3e8ff" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Synaptic Transmitter Sparks */}
      {!reduced && (
        <motion.circle
          cx="160"
          cy="95"
          r="4"
          fill="#fde047"
          animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

// 16. RADIOLOGY: 3D Volumetric CT Slicer with Scanning Laser Plane
function Radiology3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <linearGradient id="ct-gantry" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* 3D CT Gantry Ring */}
      <ellipse cx="160" cy="100" rx="90" ry="70" fill="url(#ct-gantry)" stroke="#64748b" strokeWidth="4" />
      <ellipse cx="160" cy="100" rx="55" ry="45" fill="#020617" />

      {/* Patient Gantry Couch */}
      <polygon points="120,130 200,130 220,185 100,185" fill="#475569" stroke="#94a3b8" strokeWidth="2" />

      {/* Moving Blue Holographic Laser Scanning Plane */}
      <motion.line
        x1="105"
        y1="70"
        x2="215"
        y2="70"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        animate={reduced ? { y1: 100, y2: 100 } : { y1: [65, 135, 65], y2: [65, 135, 65] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

// 17. ANESTHESIOLOGY: 3D Vaporizer Dial & Capnographic Airway
function Anesthesia3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <circle cx="160" cy="100" r="55" fill="#1e293b" stroke="#e2e8f0" strokeWidth="4" />
      <circle cx="160" cy="100" r="35" fill="#334155" />
      <line x1="160" y1="100" x2="185" y2="75" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 170 L 100 170 L 120 140 L 180 140 L 185 170 L 270 170" stroke="#10b981" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

// 18. FORENSIC MEDICINE: 3D Dactyloscopic Biometric Fingerprint
function Forensics3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      {[15, 28, 42, 56].map((r, i) => (
        <ellipse
          key={i}
          cx="160"
          cy="100"
          rx={r * 1.2}
          ry={r * 1.5}
          stroke="#e2e8f0"
          strokeWidth="2.5"
          strokeDasharray={`${20 + i * 10} 6`}
          fill="none"
        />
      ))}
      <circle cx="160" cy="100" r="6" fill="#f43f5e" />
    </svg>
  );
}

// 19. PSM / COMMUNITY MEDICINE: 3D Global Epidemiological Sphere
function Community3DModel({ accent, topicName, reduced }: { accent: string; topicName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <defs>
        <radialGradient id="globe-grad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="100" r="50" fill="url(#globe-grad)" stroke="#7dd3fc" strokeWidth="2.5" />
      <ellipse cx="160" cy="100" rx="48" ry="18" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 2" fill="none" />
      <circle cx="140" cy="85" r="4" fill="#fef08a" />
      <circle cx="180" cy="115" r="4" fill="#fef08a" />
    </svg>
  );
}

// GENERIC FALLBACK
function Generic3DModel({ accent, subjectName, reduced }: { accent: string; subjectName: string; reduced: boolean }) {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-md" fill="none">
      <circle cx="160" cy="100" r="50" fill={accent} fillOpacity="0.8" stroke="#ffffff" strokeWidth="3" />
      <path d="M140 100 L 180 100 M 160 80 L 160 120" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
