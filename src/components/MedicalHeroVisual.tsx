import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface MedicalHeroVisualProps {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicId?: string;
  topicName?: string;
  className?: string;
  showTelemetryTag?: boolean;
  hideInternalBackdrop?: boolean;
}

export function getSubjectTelemetry(subjectId: string, topicName: string = '') {
  const normTopic = (topicName || '').toLowerCase();
  const norm = subjectId.toLowerCase();

  if (normTopic.includes('cardio') || normTopic.includes('heart') || normTopic.includes('ecg') || normTopic.includes('stemi') || normTopic.includes('arrhythmia')) {
    return { label: '72 bpm · Sinus Rhythm', status: 'Conduction Active', dotColor: '#EF4444' };
  }
  if (normTopic.includes('respir') || normTopic.includes('lung') || normTopic.includes('pulmon') || normTopic.includes('asthma') || normTopic.includes('copd')) {
    return { label: '16 bpm · SpO₂ 99%', status: 'Tidal Diffusion OK', dotColor: '#0EA5E9' };
  }
  if (normTopic.includes('neuro') || normTopic.includes('brain') || normTopic.includes('cranial') || normTopic.includes('stroke')) {
    return { label: 'Alpha Rhythm · 10 Hz', status: 'Synaptic Exocytosis', dotColor: '#8B5CF6' };
  }

  switch (norm) {
    case 'medicine': return { label: '72 bpm · Sinus Rhythm', status: 'Conduction Active', dotColor: '#FF3B30' };
    case 'anatomy': return { label: 'Structure Mapped', status: 'Morphology Stable', dotColor: '#30D158' };
    case 'physiology': return { label: '16 bpm · SpO₂ 99%', status: 'Tidal Diffusion OK', dotColor: '#32ADE6' };
    case 'pathology': return { label: 'Tissue Analysis', status: 'Biopsy Pending', dotColor: '#FF9500' };
    case 'pharmacology': return { label: 'Drug On Board', status: 'Receptor Occupied', dotColor: '#BF5AF2' };
    case 'microbiology': return { label: '10⁶ CFU/mL', status: 'Culture Active', dotColor: '#32ADE6' };
    case 'biochemistry': return { label: 'ATP Cycling', status: 'Krebs Cycle Active', dotColor: '#FFD60A' };
    case 'ophthalmology': return { label: '20/20 Vision', status: 'Retina Mapped', dotColor: '#007AFF' };
    case 'ent': return { label: '4 kHz · 0 dBHL', status: 'Tympanum Normal', dotColor: '#5E5CE6' };
    case 'surgery': return { label: 'Sterile Field Set', status: 'Hemostasis OK', dotColor: '#FF453A' };
    case 'obg': return { label: 'Cycle Day 14', status: 'Ovulation Detected', dotColor: '#FF2D55' };
    case 'pediatrics': return { label: 'Growth Percentile 50', status: 'Milestones On Track', dotColor: '#FF9F0A' };
    case 'orthopedics': return { label: 'Bone Density T+1.2', status: 'Alignment Normal', dotColor: '#8E8E93' };
    case 'dermatology': return { label: 'TEWL 8 g/m²/h', status: 'Barrier Intact', dotColor: '#FF9500' };
    case 'psychiatry': return { label: 'Alpha Rhythm · 10 Hz', status: 'Synaptic Active', dotColor: '#BF5AF2' };
    case 'radiology': return { label: '0.1 mSv · CT Brain', status: 'Image Acquired', dotColor: '#007AFF' };
    case 'anesthesia': return { label: 'MAC 1.0 · O₂ 40%', status: 'Depth Adequate', dotColor: '#5AC8FA' };
    case 'fmt': return { label: 'COD Determined', status: 'Report Filed', dotColor: '#8E8E93' };
    case 'psm': return { label: 'R₀ = 1.2', status: 'Herd Immunity 68%', dotColor: '#30D158' };
    default: return { label: 'System Active', status: 'Data Streaming', dotColor: '#32ADE6' };
  }
}

// ─── Individual subject visuals ───────────────────────────────────────────────

function HeartVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="heart-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#C0392B" />
        </radialGradient>
        <filter id="heart-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#FF3B30" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="52" ry="8" fill="#FF3B30" fillOpacity="0.12" />
      <path
        d="M100 162 C52 132 28 100 28 72 C28 48 46 34 68 34 C81 34 93 41 100 52 C107 41 119 34 132 34 C154 34 172 48 172 72 C172 100 148 132 100 162Z"
        fill="url(#heart-grad)"
        filter="url(#heart-shadow)"
      />
      <ellipse cx="74" cy="58" rx="24" ry="17" fill="white" fillOpacity="0.22" />
      <path d="M100 56 Q92 96 97 138" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.38" />
      <path d="M96 92 Q75 108 67 122" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.28" />
    </motion.svg>
  );
}

function AnatomyVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="anat-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#4CD964" />
          <stop offset="100%" stopColor="#1A6B2A" />
        </radialGradient>
        <filter id="anat-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#248A3D" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="50" ry="8" fill="#248A3D" fillOpacity="0.12" />
      {/* Cranium */}
      <ellipse cx="100" cy="86" rx="52" ry="58" fill="url(#anat-grad)" filter="url(#anat-shadow)" />
      {/* Jaw */}
      <path d="M62 120 Q64 148 100 154 Q136 148 138 120" fill="url(#anat-grad)" />
      {/* Eye sockets */}
      <ellipse cx="81" cy="96" rx="13" ry="11" fill="#1A6B2A" fillOpacity="0.55" />
      <ellipse cx="119" cy="96" rx="13" ry="11" fill="#1A6B2A" fillOpacity="0.55" />
      {/* Nasal cavity */}
      <path d="M96 116 Q100 110 104 116 Q100 124 96 116Z" fill="#1A6B2A" fillOpacity="0.5" />
      {/* Cheekbone lines */}
      <path d="M64 108 Q68 118 74 122" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
      <path d="M136 108 Q132 118 126 122" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
      {/* Specular */}
      <ellipse cx="76" cy="62" rx="22" ry="16" fill="white" fillOpacity="0.2" />
    </motion.svg>
  );
}

function PhysiologyVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="lung-grad-l" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#5AC8FA" />
          <stop offset="100%" stopColor="#1E82B4" />
        </radialGradient>
        <radialGradient id="lung-grad-r" cx="60%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#5AC8FA" />
          <stop offset="100%" stopColor="#1E82B4" />
        </radialGradient>
        <filter id="lung-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#32ADE6" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="55" ry="8" fill="#32ADE6" fillOpacity="0.12" />
      {/* Trachea */}
      <rect x="95" y="30" width="10" height="30" rx="5" fill="#5AC8FA" />
      {/* Bronchi */}
      <path d="M100 58 Q78 65 68 78" stroke="#5AC8FA" strokeWidth="8" strokeLinecap="round" />
      <path d="M100 58 Q122 65 132 78" stroke="#5AC8FA" strokeWidth="8" strokeLinecap="round" />
      {/* Left lung */}
      <ellipse cx="68" cy="118" rx="38" ry="52" fill="url(#lung-grad-l)" filter="url(#lung-shadow)" />
      {/* Right lung */}
      <ellipse cx="132" cy="118" rx="38" ry="52" fill="url(#lung-grad-r)" filter="url(#lung-shadow)" />
      {/* Branching lines left */}
      <path d="M68 88 Q60 105 58 122" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
      <path d="M68 88 Q76 108 75 128" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.25" />
      {/* Branching lines right */}
      <path d="M132 88 Q140 105 142 122" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
      <path d="M132 88 Q124 108 125 128" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.25" />
      {/* Speculars */}
      <ellipse cx="55" cy="96" rx="16" ry="12" fill="white" fillOpacity="0.2" />
      <ellipse cx="119" cy="96" rx="16" ry="12" fill="white" fillOpacity="0.2" />
    </motion.svg>
  );
}

function PathologyVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="path-grad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFB340" />
          <stop offset="100%" stopColor="#C76000" />
        </radialGradient>
        <filter id="path-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#FF9500" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="52" ry="8" fill="#FF9500" fillOpacity="0.12" />
      {/* Microscope circle border */}
      <circle cx="100" cy="100" r="72" stroke="#FFB340" strokeWidth="3" strokeOpacity="0.4" />
      {/* Cell body */}
      <ellipse cx="100" cy="102" rx="58" ry="52" fill="url(#path-grad)" filter="url(#path-shadow)" />
      {/* Nucleus */}
      <ellipse cx="96" cy="100" rx="22" ry="20" fill="#C76000" fillOpacity="0.7" />
      {/* Organelle dots */}
      <circle cx="72" cy="88" r="5" fill="#C76000" fillOpacity="0.6" />
      <circle cx="130" cy="96" r="4" fill="#C76000" fillOpacity="0.55" />
      <circle cx="118" cy="128" r="4.5" fill="#C76000" fillOpacity="0.5" />
      <circle cx="80" cy="122" r="3.5" fill="#C76000" fillOpacity="0.5" />
      {/* Specular */}
      <ellipse cx="74" cy="78" rx="20" ry="14" fill="white" fillOpacity="0.2" />
    </motion.svg>
  );
}

function PharmacologyVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="pharm-grad-l" cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#DA8FFF" />
          <stop offset="100%" stopColor="#8B00D4" />
        </radialGradient>
        <radialGradient id="pharm-grad-r" cx="70%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#EDD5FF" />
          <stop offset="100%" stopColor="#BF5AF2" />
        </radialGradient>
        <filter id="pharm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#BF5AF2" floodOpacity="0.4" />
        </filter>
        <clipPath id="pharm-clip">
          <rect x="28" y="72" width="144" height="56" rx="28" />
        </clipPath>
      </defs>
      <ellipse cx="100" cy="182" rx="52" ry="8" fill="#BF5AF2" fillOpacity="0.12" />
      {/* Capsule base shape */}
      <rect x="28" y="72" width="144" height="56" rx="28" fill="#BF5AF2" filter="url(#pharm-shadow)" />
      {/* Left half */}
      <rect x="28" y="72" width="72" height="56" rx="0" fill="url(#pharm-grad-l)" clipPath="url(#pharm-clip)" />
      {/* Right half */}
      <rect x="100" y="72" width="72" height="56" rx="0" fill="url(#pharm-grad-r)" clipPath="url(#pharm-clip)" />
      {/* Divider line */}
      <line x1="100" y1="72" x2="100" y2="128" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
      {/* Specular */}
      <ellipse cx="66" cy="86" rx="26" ry="12" fill="white" fillOpacity="0.22" />
    </motion.svg>
  );
}

function MicrobiologyVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="micro-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#70D7FF" />
          <stop offset="100%" stopColor="#1A7FA8" />
        </radialGradient>
        <filter id="micro-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#32ADE6" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="50" ry="8" fill="#32ADE6" fillOpacity="0.12" />
      {/* Spikes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 100 + Math.cos(rad) * 52;
        const y1 = 100 + Math.sin(rad) * 44;
        const x2 = 100 + Math.cos(rad) * 72;
        const y2 = 100 + Math.sin(rad) * 62;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#70D7FF" strokeWidth="7" strokeLinecap="round" />
        );
      })}
      {/* Body */}
      <ellipse cx="100" cy="100" rx="52" ry="44" fill="url(#micro-grad)" filter="url(#micro-shadow)" />
      {/* Genome circle */}
      <circle cx="100" cy="100" r="16" fill="#1A7FA8" fillOpacity="0.6" />
      {/* Specular */}
      <ellipse cx="78" cy="78" rx="20" ry="14" fill="white" fillOpacity="0.22" />
    </motion.svg>
  );
}

function BiochemistryVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="bio-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE04D" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <filter id="bio-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#FFD60A" floodOpacity="0.4" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="50" ry="8" fill="#FFD60A" fillOpacity="0.15" />
      {/* Left strand */}
      <path d="M76 28 C56 55 120 85 80 115 C50 140 108 165 88 185"
        stroke="url(#bio-grad)" strokeWidth="12" strokeLinecap="round" fill="none" filter="url(#bio-shadow)" />
      {/* Right strand */}
      <path d="M124 28 C144 55 80 85 120 115 C150 140 92 165 112 185"
        stroke="url(#bio-grad)" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* Rungs */}
      {[55, 80, 105, 130, 155].map((y, i) => (
        <line key={i} x1="82" y1={y} x2="118" y2={y}
          stroke="#FFE04D" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7" />
      ))}
      {/* Specular dots */}
      <circle cx="82" cy="42" r="6" fill="white" fillOpacity="0.3" />
      <circle cx="118" cy="42" r="6" fill="white" fillOpacity="0.3" />
    </motion.svg>
  );
}

function OphthalmologyVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="eye-iris-grad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#409CFF" />
          <stop offset="100%" stopColor="#004DAE" />
        </radialGradient>
        <filter id="eye-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#007AFF" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="55" ry="8" fill="#007AFF" fillOpacity="0.12" />
      {/* Eye white */}
      <path d="M24 100 Q62 44 100 44 Q138 44 176 100 Q138 156 100 156 Q62 156 24 100Z"
        fill="white" filter="url(#eye-shadow)" />
      {/* Iris */}
      <circle cx="100" cy="100" r="40" fill="url(#eye-iris-grad)" />
      {/* Iris rings */}
      <circle cx="100" cy="100" r="32" stroke="#007AFF" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
      <circle cx="100" cy="100" r="22" stroke="#007AFF" strokeWidth="1.5" strokeOpacity="0.3" fill="none" />
      {/* Pupil */}
      <circle cx="100" cy="100" r="14" fill="#0A0A1A" />
      {/* Highlight */}
      <circle cx="108" cy="92" r="5" fill="white" fillOpacity="0.85" />
      {/* Eyelid lines */}
      <path d="M24 100 Q62 44 100 44 Q138 44 176 100" stroke="#8E8E93" strokeWidth="2" fill="none" strokeOpacity="0.3" />
    </motion.svg>
  );
}

function ENTVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="ent-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#7D7AFF" />
          <stop offset="100%" stopColor="#3634A3" />
        </radialGradient>
        <filter id="ent-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#5E5CE6" floodOpacity="0.4" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="48" ry="8" fill="#5E5CE6" fillOpacity="0.12" />
      {/* Outer ear (auricle) */}
      <path d="M80 40 C40 40 26 70 28 100 C30 132 42 158 60 168 C68 172 76 168 78 160 C80 152 72 146 68 136 C62 120 64 108 70 100 C78 88 88 84 90 76 C92 68 90 56 88 48 Q86 40 80 40Z"
        fill="url(#ent-grad)" filter="url(#ent-shadow)" />
      {/* Inner concha curves */}
      <path d="M72 70 C52 80 46 106 50 126 C52 140 60 152 68 158"
        stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" strokeOpacity="0.3" />
      <path d="M76 82 C62 92 58 112 62 130"
        stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" strokeOpacity="0.25" />
      {/* Ear canal opening */}
      <ellipse cx="82" cy="108" rx="8" ry="12" fill="#3634A3" fillOpacity="0.7" />
      {/* Specular */}
      <ellipse cx="58" cy="58" rx="18" ry="12" fill="white" fillOpacity="0.2" />
    </motion.svg>
  );
}

function SurgeryVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="surg-handle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C7C7CC" />
          <stop offset="100%" stopColor="#8E8E93" />
        </linearGradient>
        <linearGradient id="surg-blade-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6961" />
          <stop offset="100%" stopColor="#C0392B" />
        </linearGradient>
        <filter id="surg-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#FF453A" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="100" cy="184" rx="52" ry="8" fill="#FF453A" fillOpacity="0.12" />
      {/* Handle */}
      <rect x="42" y="34" width="18" height="100" rx="9" fill="url(#surg-handle-grad)"
        filter="url(#surg-shadow)"
        transform="rotate(45 51 84)" />
      {/* Blade */}
      <path d="M110 90 L148 52 L162 62 L130 104 Q120 112 110 108 Q106 96 110 90Z"
        fill="url(#surg-blade-grad)" filter="url(#surg-shadow)" />
      {/* Blade edge highlight */}
      <path d="M148 52 L162 62" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
      {/* Handle grip lines */}
      <line x1="62" y1="82" x2="74" y2="70" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="68" y1="90" x2="80" y2="78" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="74" y1="98" x2="86" y2="86" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
    </motion.svg>
  );
}

function OBGVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="obg-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#FF6B8A" />
          <stop offset="100%" stopColor="#C0003A" />
        </radialGradient>
        <filter id="obg-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#FF2D55" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="52" ry="8" fill="#FF2D55" fillOpacity="0.12" />
      {/* Uterus body */}
      <path d="M100 160 C72 160 52 140 52 112 C52 90 64 76 80 72 L80 58 C80 50 88 44 100 44 C112 44 120 50 120 58 L120 72 C136 76 148 90 148 112 C148 140 128 160 100 160Z"
        fill="url(#obg-grad)" filter="url(#obg-shadow)" />
      {/* Left fallopian tube */}
      <path d="M72 80 Q44 72 36 60" stroke="#FF6B8A" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Right fallopian tube */}
      <path d="M128 80 Q156 72 164 60" stroke="#FF6B8A" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Ovaries */}
      <ellipse cx="34" cy="56" rx="12" ry="10" fill="url(#obg-grad)" />
      <ellipse cx="166" cy="56" rx="12" ry="10" fill="url(#obg-grad)" />
      {/* Specular */}
      <ellipse cx="78" cy="70" rx="22" ry="14" fill="white" fillOpacity="0.2" />
    </motion.svg>
  );
}

function PediatricsVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="ped-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#FFE04D" />
          <stop offset="100%" stopColor="#D4720A" />
        </radialGradient>
        <filter id="ped-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#FF9F0A" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="52" ry="8" fill="#FF9F0A" fillOpacity="0.12" />
      {/* Heel pad */}
      <ellipse cx="100" cy="148" rx="44" ry="34" fill="url(#ped-grad)" filter="url(#ped-shadow)" />
      {/* Foot arch / mid */}
      <ellipse cx="88" cy="110" rx="26" ry="22" fill="url(#ped-grad)" />
      {/* Toes */}
      <circle cx="72" cy="86" r="14" fill="url(#ped-grad)" />
      <circle cx="90" cy="78" r="13" fill="url(#ped-grad)" />
      <circle cx="108" cy="76" r="13" fill="url(#ped-grad)" />
      <circle cx="125" cy="80" r="12" fill="url(#ped-grad)" />
      <circle cx="140" cy="90" r="11" fill="url(#ped-grad)" />
      {/* Specular */}
      <ellipse cx="76" cy="92" rx="16" ry="10" fill="white" fillOpacity="0.22" />
    </motion.svg>
  );
}

function OrthopedicsVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="ortho-grad" x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#C7C7CC" />
        </linearGradient>
        <filter id="ortho-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#6E6E73" floodOpacity="0.4" />
        </filter>
      </defs>
      <ellipse cx="100" cy="184" rx="52" ry="8" fill="#8E8E93" fillOpacity="0.15" />
      {/* Femur head (ball) */}
      <circle cx="62" cy="52" r="28" fill="url(#ortho-grad)" filter="url(#ortho-shadow)" />
      {/* Neck */}
      <path d="M78 68 L98 92" stroke="url(#ortho-grad)" strokeWidth="22" strokeLinecap="round" />
      {/* Shaft */}
      <rect x="88" y="85" width="22" height="80" rx="11" fill="url(#ortho-grad)"
        transform="rotate(12 99 125)" />
      {/* Condyles at bottom */}
      <ellipse cx="118" cy="162" rx="28" ry="16" fill="url(#ortho-grad)" filter="url(#ortho-shadow)" />
      {/* Texture lines */}
      <path d="M57 42 Q62 50 60 62" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
      <path d="M65 38 Q72 46 70 58" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35" />
      {/* Specular */}
      <ellipse cx="52" cy="44" rx="14" ry="10" fill="white" fillOpacity="0.55" />
    </motion.svg>
  );
}

function DermatologyVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="derm-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C26A00" />
          <stop offset="100%" stopColor="#A0522D" />
        </linearGradient>
        <linearGradient id="derm-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFB37C" />
          <stop offset="100%" stopColor="#E8894A" />
        </linearGradient>
        <linearGradient id="derm-grad-3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD5A8" />
          <stop offset="100%" stopColor="#FFB37C" />
        </linearGradient>
        <filter id="derm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#FF9500" floodOpacity="0.3" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="55" ry="8" fill="#FF9500" fillOpacity="0.12" />
      {/* Hair follicle */}
      <line x1="100" y1="30" x2="100" y2="60" stroke="#8B4513" strokeWidth="3" strokeLinecap="round" />
      {/* Epidermis (top, wavy) */}
      <path d="M28 62 Q46 54 64 62 Q82 70 100 62 Q118 54 136 62 Q154 70 172 62 L172 94 Q154 102 136 94 Q118 86 100 94 Q82 102 64 94 Q46 86 28 94Z"
        fill="url(#derm-grad-1)" filter="url(#derm-shadow)" />
      {/* Dermis (middle) */}
      <path d="M28 92 Q46 84 64 92 Q82 100 100 92 Q118 84 136 92 Q154 100 172 92 L172 136 Q154 144 136 136 Q118 128 100 136 Q82 144 64 136 Q46 128 28 136Z"
        fill="url(#derm-grad-2)" />
      {/* Hypodermis (bottom) */}
      <path d="M28 134 Q46 126 64 134 Q82 142 100 134 Q118 126 136 134 Q154 142 172 134 L172 172 L28 172Z"
        fill="url(#derm-grad-3)" />
      {/* Layer labels as subtle lines */}
      <line x1="36" y1="108" x2="60" y2="108" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      <line x1="36" y1="152" x2="60" y2="152" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
    </motion.svg>
  );
}

function PsychiatryVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="psych-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#DA8FFF" />
          <stop offset="100%" stopColor="#8B00D4" />
        </radialGradient>
        <filter id="psych-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#BF5AF2" floodOpacity="0.4" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="55" ry="8" fill="#BF5AF2" fillOpacity="0.12" />
      {/* Brain outline — left hemisphere */}
      <path d="M44 110 C28 98 28 72 44 60 C54 52 66 50 76 54 C80 42 90 34 102 34 C118 34 130 46 132 60 C144 56 158 64 162 78 C168 94 160 112 148 118 C148 136 136 152 120 156 C110 158 100 154 96 148 C88 158 74 162 62 156 C50 150 44 136 44 122 Z"
        fill="url(#psych-grad)" filter="url(#psych-shadow)" />
      {/* Gyri / fold lines */}
      <path d="M80 58 Q72 74 76 90" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.3" />
      <path d="M102 40 Q96 58 100 76" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.3" />
      <path d="M130 64 Q134 82 128 98" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.3" />
      <path d="M52 88 Q48 106 54 122" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity="0.25" />
      <path d="M148 90 Q154 108 148 124" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity="0.25" />
      <path d="M68 130 Q76 148 90 152" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity="0.25" />
      {/* Specular */}
      <ellipse cx="72" cy="56" rx="24" ry="16" fill="white" fillOpacity="0.2" />
    </motion.svg>
  );
}

function RadiologyVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="rad-grad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#1A3A5C" />
          <stop offset="100%" stopColor="#001128" />
        </radialGradient>
        <filter id="rad-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#007AFF" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="100" cy="184" rx="60" ry="8" fill="#007AFF" fillOpacity="0.12" />
      {/* X-ray film */}
      <rect x="30" y="24" width="140" height="160" rx="8" fill="url(#rad-grad)" filter="url(#rad-shadow)" />
      {/* Spine */}
      <rect x="95" y="42" width="10" height="120" rx="5" fill="white" fillOpacity="0.15" />
      {/* Ribs — left */}
      {[58, 74, 90, 106, 122].map((y, i) => (
        <path key={`rl-${i}`} d={`M95 ${y} Q72 ${y + 6} 58 ${y + 16}`}
          stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.5" />
      ))}
      {/* Ribs — right */}
      {[58, 74, 90, 106, 122].map((y, i) => (
        <path key={`rr-${i}`} d={`M105 ${y} Q128 ${y + 6} 142 ${y + 16}`}
          stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.5" />
      ))}
      {/* Heart shadow */}
      <ellipse cx="88" cy="108" rx="18" ry="20" fill="white" fillOpacity="0.08" />
      {/* Lung fields */}
      <ellipse cx="70" cy="96" rx="22" ry="34" stroke="#409CFF" strokeWidth="1.5" fill="none" strokeOpacity="0.25" />
      <ellipse cx="130" cy="96" rx="22" ry="34" stroke="#409CFF" strokeWidth="1.5" fill="none" strokeOpacity="0.25" />
    </motion.svg>
  );
}

function AnesthesiaVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="anes-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#70D7FF" />
          <stop offset="100%" stopColor="#2E7DA8" />
        </radialGradient>
        <filter id="anes-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#5AC8FA" floodOpacity="0.4" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="52" ry="8" fill="#5AC8FA" fillOpacity="0.12" />
      {/* Mask body — rounded trapezoid */}
      <path d="M54 64 Q56 44 100 44 Q144 44 146 64 L154 132 Q152 152 100 156 Q48 152 46 132Z"
        fill="url(#anes-grad)" filter="url(#anes-shadow)" />
      {/* Mask edge / seal */}
      <path d="M54 64 Q56 44 100 44 Q144 44 146 64 L154 132 Q152 152 100 156 Q48 152 46 132Z"
        stroke="white" strokeWidth="3" strokeOpacity="0.25" fill="none" />
      {/* Breathing circuit connector */}
      <rect x="88" y="152" width="24" height="20" rx="6" fill="#2E7DA8" />
      {/* Tubing */}
      <path d="M100 172 Q100 185 84 188 Q68 192 64 184"
        stroke="#5AC8FA" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* Strap marks */}
      <line x1="54" y1="80" x2="30" y2="76" stroke="white" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1="146" y1="80" x2="170" y2="76" stroke="white" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.35" />
      {/* Specular */}
      <ellipse cx="76" cy="64" rx="24" ry="14" fill="white" fillOpacity="0.22" />
    </motion.svg>
  );
}

function FMTVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="fmt-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#AEAEB2" />
          <stop offset="100%" stopColor="#3A3A3C" />
        </radialGradient>
        <filter id="fmt-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#6E6E73" floodOpacity="0.4" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="52" ry="8" fill="#6E6E73" fillOpacity="0.15" />
      {/* Fingerprint background circle */}
      <circle cx="100" cy="100" r="74" fill="url(#fmt-grad)" filter="url(#fmt-shadow)" />
      {/* Concentric oval fingerprint loops */}
      {[10, 18, 26, 34, 42, 50, 58, 66].map((r, i) => (
        <ellipse key={i} cx="100" cy="104" rx={r * 0.9} ry={r}
          stroke="white" strokeWidth="2.2" fill="none" strokeOpacity={0.14 + i * 0.05} />
      ))}
      {/* Arch at top — whorl break */}
      <path d="M72 52 Q100 38 128 52" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" strokeOpacity="0.45" />
      {/* Specular */}
      <ellipse cx="74" cy="68" rx="20" ry="14" fill="white" fillOpacity="0.18" />
    </motion.svg>
  );
}

function PSMVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="psm-center-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#4CD964" />
          <stop offset="100%" stopColor="#1A7A30" />
        </radialGradient>
        <radialGradient id="psm-node-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#66E07A" />
          <stop offset="100%" stopColor="#30D158" />
        </radialGradient>
        <filter id="psm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#30D158" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="100" cy="182" rx="52" ry="8" fill="#30D158" fillOpacity="0.12" />
      {/* Connector lines */}
      {[
        [100, 100, 100, 34],
        [100, 100, 158, 68],
        [100, 100, 152, 148],
        [100, 100, 48, 148],
        [100, 100, 42, 68],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#4CD964" strokeWidth="4" strokeOpacity="0.45" />
      ))}
      {/* Outer nodes */}
      <circle cx="100" cy="34" r="18" fill="url(#psm-node-grad)" />
      <circle cx="158" cy="68" r="18" fill="url(#psm-node-grad)" />
      <circle cx="152" cy="148" r="18" fill="url(#psm-node-grad)" />
      <circle cx="48" cy="148" r="18" fill="url(#psm-node-grad)" />
      <circle cx="42" cy="68" r="18" fill="url(#psm-node-grad)" />
      {/* Center node */}
      <circle cx="100" cy="100" r="30" fill="url(#psm-center-grad)" filter="url(#psm-shadow)" />
      {/* Specular */}
      <ellipse cx="88" cy="88" rx="14" ry="10" fill="white" fillOpacity="0.28" />
    </motion.svg>
  );
}

// ─── Subject map ──────────────────────────────────────────────────────────────

const SUBJECT_VISUALS: Record<string, React.FC<{ reduced: boolean }>> = {
  medicine: HeartVisual,
  anatomy: AnatomyVisual,
  physiology: PhysiologyVisual,
  pathology: PathologyVisual,
  pharmacology: PharmacologyVisual,
  microbiology: MicrobiologyVisual,
  biochemistry: BiochemistryVisual,
  ophthalmology: OphthalmologyVisual,
  ent: ENTVisual,
  surgery: SurgeryVisual,
  obg: OBGVisual,
  pediatrics: PediatricsVisual,
  orthopedics: OrthopedicsVisual,
  dermatology: DermatologyVisual,
  psychiatry: PsychiatryVisual,
  radiology: RadiologyVisual,
  anesthesia: AnesthesiaVisual,
  fmt: FMTVisual,
  psm: PSMVisual,
};

function FallbackVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      shapeRendering="geometricPrecision"
      animate={reduced ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="fallback-grad" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#5AC8FA" />
          <stop offset="100%" stopColor="#007AFF" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="72" fill="url(#fallback-grad)" />
      <ellipse cx="78" cy="78" rx="22" ry="16" fill="white" fillOpacity="0.22" />
    </motion.svg>
  );
}

// ─── Exported components ──────────────────────────────────────────────────────

export const MedicalHeroVisual: React.FC<MedicalHeroVisualProps> = ({
  subjectId,
  className = '',
}) => {
  const reduced = useReducedMotion() ?? false;
  const norm = subjectId.toLowerCase();
  const Visual = SUBJECT_VISUALS[norm] ?? FallbackVisual;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Visual reduced={reduced} />
    </div>
  );
};

export const MedicalSubjectCardVisual: React.FC<{
  subjectId: string;
  subjectName?: string;
  className?: string;
}> = ({ subjectId, className = '' }) => {
  const reduced = useReducedMotion() ?? false;
  const norm = subjectId.toLowerCase();
  const Visual = SUBJECT_VISUALS[norm] ?? FallbackVisual;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Visual reduced={reduced} />
    </div>
  );
};

export const PureSubject3DModel: React.FC<{
  subjectId: string;
  topicName?: string;
  accent?: string;
  className?: string;
}> = ({ subjectId, className = '' }) => {
  const reduced = useReducedMotion() ?? false;
  const norm = subjectId.toLowerCase();
  const Visual = SUBJECT_VISUALS[norm] ?? FallbackVisual;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Visual reduced={reduced} />
    </div>
  );
};
