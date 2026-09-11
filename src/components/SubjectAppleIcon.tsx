import React from 'react';
import {
  Layers,
  HeartPulse,
  Dna,
  Microscope,
  Pill,
  Bug,
  Scale,
  Globe,
  Eye,
  Ear,
  Stethoscope,
  Scissors,
  Baby,
  ShieldPlus,
  Bone,
  Fingerprint,
  Brain,
  ScanLine,
  Gauge,
  BookOpen,
  LucideIcon,
} from 'lucide-react';

export interface SubjectVisualTheme {
  icon: LucideIcon;
  label: string;
  color: string;
  bgGradient: string;
  border: string;
  ring: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  badgeType: 'high' | 'important' | 'core';
}

/**
 * High-definition Apple HIG-style clinical icon themes for all 19 FMGE subjects.
 * Each specialty has an authentic medical SVG icon, a frosted squircle container,
 * and specular edge lighting that harmonizes with Deep Teal #006B63.
 */
export const SUBJECT_VISUAL_THEMES: Record<string, SubjectVisualTheme> = {
  anatomy: {
    icon: Layers,
    label: 'Anatomy',
    color: '#E11D48',
    bgGradient: 'bg-gradient-to-br from-white via-rose-50/75 to-rose-100/40',
    border: 'border-rose-200/70',
    ring: 'ring-rose-950/5',
    text: 'text-rose-600',
    badgeBg: 'bg-rose-50/90 border-rose-200/70',
    badgeText: 'text-rose-700',
    badgeType: 'high',
  },
  physiology: {
    icon: HeartPulse,
    label: 'Physiology',
    color: '#0284C7',
    bgGradient: 'bg-gradient-to-br from-white via-sky-50/75 to-sky-100/40',
    border: 'border-sky-200/70',
    ring: 'ring-sky-950/5',
    text: 'text-sky-600',
    badgeBg: 'bg-sky-50/90 border-sky-200/70',
    badgeText: 'text-sky-700',
    badgeType: 'high',
  },
  biochemistry: {
    icon: Dna,
    label: 'Biochemistry',
    color: '#7C3AED',
    bgGradient: 'bg-gradient-to-br from-white via-violet-50/75 to-violet-100/40',
    border: 'border-violet-200/70',
    ring: 'ring-violet-950/5',
    text: 'text-violet-600',
    badgeBg: 'bg-violet-50/90 border-violet-200/70',
    badgeText: 'text-violet-700',
    badgeType: 'high',
  },
  pathology: {
    icon: Microscope,
    label: 'Pathology',
    color: '#0D9488',
    bgGradient: 'bg-gradient-to-br from-white via-teal-50/75 to-teal-100/40',
    border: 'border-teal-200/70',
    ring: 'ring-teal-950/5',
    text: 'text-teal-600',
    badgeBg: 'bg-teal-50/90 border-teal-200/70',
    badgeText: 'text-teal-700',
    badgeType: 'high',
  },
  pharmacology: {
    icon: Pill,
    label: 'Pharmacology',
    color: '#D97706',
    bgGradient: 'bg-gradient-to-br from-white via-amber-50/75 to-amber-100/40',
    border: 'border-amber-200/70',
    ring: 'ring-amber-950/5',
    text: 'text-amber-600',
    badgeBg: 'bg-amber-50/90 border-amber-200/70',
    badgeText: 'text-amber-800',
    badgeType: 'important',
  },
  microbiology: {
    icon: Bug,
    label: 'Microbiology',
    color: '#4F46E5',
    bgGradient: 'bg-gradient-to-br from-white via-indigo-50/75 to-indigo-100/40',
    border: 'border-indigo-200/70',
    ring: 'ring-indigo-950/5',
    text: 'text-indigo-600',
    badgeBg: 'bg-indigo-50/90 border-indigo-200/70',
    badgeText: 'text-indigo-700',
    badgeType: 'important',
  },
  fmt: {
    icon: Scale,
    label: 'Forensic Medicine',
    color: '#BE123C',
    bgGradient: 'bg-gradient-to-br from-white via-red-50/75 to-red-100/40',
    border: 'border-rose-200/70',
    ring: 'ring-rose-950/5',
    text: 'text-rose-700',
    badgeBg: 'bg-rose-50/90 border-rose-200/70',
    badgeText: 'text-rose-800',
    badgeType: 'core',
  },
  psm: {
    icon: Globe,
    label: 'Community Medicine (PSM)',
    color: '#059669',
    bgGradient: 'bg-gradient-to-br from-white via-emerald-50/75 to-emerald-100/40',
    border: 'border-emerald-200/70',
    ring: 'ring-emerald-950/5',
    text: 'text-emerald-600',
    badgeBg: 'bg-emerald-50/90 border-emerald-200/70',
    badgeText: 'text-emerald-700',
    badgeType: 'high',
  },
  ophthalmology: {
    icon: Eye,
    label: 'Ophthalmology',
    color: '#0891B2',
    bgGradient: 'bg-gradient-to-br from-white via-cyan-50/75 to-cyan-100/40',
    border: 'border-cyan-200/70',
    ring: 'ring-cyan-950/5',
    text: 'text-cyan-700',
    badgeBg: 'bg-cyan-50/90 border-cyan-200/70',
    badgeText: 'text-cyan-800',
    badgeType: 'high',
  },
  ent: {
    icon: Ear,
    label: 'ENT',
    color: '#9333EA',
    bgGradient: 'bg-gradient-to-br from-white via-purple-50/75 to-purple-100/40',
    border: 'border-purple-200/70',
    ring: 'ring-purple-950/5',
    text: 'text-purple-600',
    badgeBg: 'bg-purple-50/90 border-purple-200/70',
    badgeText: 'text-purple-700',
    badgeType: 'important',
  },
  medicine: {
    icon: Stethoscope,
    label: 'General Medicine',
    color: '#006B63',
    bgGradient: 'bg-gradient-to-br from-white via-teal-50/80 to-teal-100/50',
    border: 'border-teal-200/70',
    ring: 'ring-teal-950/5',
    text: 'text-[#006B63]',
    badgeBg: 'bg-teal-50/90 border-teal-200/80',
    badgeText: 'text-teal-800',
    badgeType: 'high',
  },
  surgery: {
    icon: Scissors,
    label: 'General Surgery',
    color: '#DC2626',
    bgGradient: 'bg-gradient-to-br from-white via-red-50/75 to-red-100/40',
    border: 'border-red-200/70',
    ring: 'ring-red-950/5',
    text: 'text-red-600',
    badgeBg: 'bg-red-50/90 border-red-200/70',
    badgeText: 'text-red-700',
    badgeType: 'high',
  },
  obg: {
    icon: Baby,
    label: 'Obstetrics & Gynaecology',
    color: '#DB2777',
    bgGradient: 'bg-gradient-to-br from-white via-pink-50/75 to-pink-100/40',
    border: 'border-pink-200/70',
    ring: 'ring-pink-950/5',
    text: 'text-pink-600',
    badgeBg: 'bg-pink-50/90 border-pink-200/70',
    badgeText: 'text-pink-700',
    badgeType: 'high',
  },
  pediatrics: {
    icon: ShieldPlus,
    label: 'Pediatrics',
    color: '#EA580C',
    bgGradient: 'bg-gradient-to-br from-white via-orange-50/75 to-orange-100/40',
    border: 'border-orange-200/70',
    ring: 'ring-orange-950/5',
    text: 'text-orange-600',
    badgeBg: 'bg-orange-50/90 border-orange-200/70',
    badgeText: 'text-orange-700',
    badgeType: 'important',
  },
  orthopedics: {
    icon: Bone,
    label: 'Orthopedics',
    color: '#2563EB',
    bgGradient: 'bg-gradient-to-br from-white via-blue-50/75 to-blue-100/40',
    border: 'border-blue-200/70',
    ring: 'ring-blue-950/5',
    text: 'text-blue-600',
    badgeBg: 'bg-blue-50/90 border-blue-200/70',
    badgeText: 'text-blue-700',
    badgeType: 'core',
  },
  dermatology: {
    icon: Fingerprint,
    label: 'Dermatology',
    color: '#C2410C',
    bgGradient: 'bg-gradient-to-br from-white via-amber-50/75 to-amber-100/40',
    border: 'border-amber-200/70',
    ring: 'ring-amber-950/5',
    text: 'text-amber-700',
    badgeBg: 'bg-amber-50/90 border-amber-200/70',
    badgeText: 'text-amber-800',
    badgeType: 'core',
  },
  psychiatry: {
    icon: Brain,
    label: 'Psychiatry',
    color: '#6D28D9',
    bgGradient: 'bg-gradient-to-br from-white via-purple-50/75 to-purple-100/40',
    border: 'border-purple-200/70',
    ring: 'ring-purple-950/5',
    text: 'text-purple-600',
    badgeBg: 'bg-purple-50/90 border-purple-200/70',
    badgeText: 'text-purple-700',
    badgeType: 'core',
  },
  radiology: {
    icon: ScanLine,
    label: 'Radiology',
    color: '#0F766E',
    bgGradient: 'bg-gradient-to-br from-white via-teal-50/75 to-teal-100/40',
    border: 'border-teal-200/70',
    ring: 'ring-teal-950/5',
    text: 'text-teal-700',
    badgeBg: 'bg-teal-50/90 border-teal-200/70',
    badgeText: 'text-teal-800',
    badgeType: 'core',
  },
  anesthesia: {
    icon: Gauge,
    label: 'Anesthesia',
    color: '#475569',
    bgGradient: 'bg-gradient-to-br from-white via-slate-50/80 to-slate-100/50',
    border: 'border-slate-200/70',
    ring: 'ring-slate-950/5',
    text: 'text-slate-700',
    badgeBg: 'bg-slate-100/90 border-slate-200/80',
    badgeText: 'text-slate-700',
    badgeType: 'core',
  },
};

/**
 * Normalizes any subject ID, code, or title alias to a canonical key.
 */
export const normalizeSubjectKey = (rawId: string): string => {
  const norm = (rawId || '').toLowerCase().trim().replace(/_/g, '-');
  if (norm.includes('forensic') || norm === 'fmt') return 'fmt';
  if (norm.includes('community') || norm === 'psm') return 'psm';
  if (norm.includes('gyn') || norm === 'obg' || norm === 'obgyn') return 'obg';
  if (norm.includes('surg') || norm === 'general-surgery') return 'surgery';
  if (norm.includes('med') && !norm.includes('comm') && !norm.includes('forens')) return 'medicine';
  if (norm.includes('pediat')) return 'pediatrics';
  if (norm.includes('ortho')) return 'orthopedics';
  if (norm.includes('derm')) return 'dermatology';
  if (norm.includes('psych')) return 'psychiatry';
  if (norm.includes('radio')) return 'radiology';
  if (norm.includes('anes')) return 'anesthesia';
  if (norm.includes('ophthal')) return 'ophthalmology';
  if (norm.includes('ent')) return 'ent';
  if (norm.includes('anat')) return 'anatomy';
  if (norm.includes('physio')) return 'physiology';
  if (norm.includes('biochem')) return 'biochemistry';
  if (norm.includes('patho')) return 'pathology';
  if (norm.includes('pharm')) return 'pharmacology';
  if (norm.includes('micro')) return 'microbiology';
  return norm;
};

export const getSubjectVisualTheme = (rawId: string): SubjectVisualTheme => {
  const key = normalizeSubjectKey(rawId);
  return (
    SUBJECT_VISUAL_THEMES[key] || {
      icon: BookOpen,
      label: 'Medicine',
      color: '#006B63',
      bgGradient: 'bg-gradient-to-br from-white via-teal-50/80 to-teal-100/40',
      border: 'border-teal-200/70',
      ring: 'ring-teal-950/5',
      text: 'text-[#006B63]',
      badgeBg: 'bg-teal-50/90 border-teal-200/70',
      badgeText: 'text-teal-800',
      badgeType: 'core',
    }
  );
};

export interface SubjectAppleIconProps {
  subjectId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSpecularBorder?: boolean;
}

const SIZE_CONFIGS = {
  xs: {
    container: 'w-6 h-6 rounded-lg p-1',
    icon: 'w-3 h-3',
  },
  sm: {
    container: 'w-8 h-8 rounded-[11px] p-1.5',
    icon: 'w-4 h-4',
  },
  md: {
    container: 'w-10 h-10 rounded-[14px] p-2',
    icon: 'w-5 h-5',
  },
  lg: {
    container: 'w-12 h-12 rounded-2xl p-2.5',
    icon: 'w-6 h-6',
  },
  xl: {
    container: 'w-14 h-14 rounded-[20px] p-3',
    icon: 'w-7 h-7',
  },
};

/**
 * SubjectAppleIcon
 * Authentic Apple Human Interface Guidelines-style squircle clinical badge.
 * Features dual-tone microgradient fill, specular highlight rim, and crisp icon stroke.
 */
export const SubjectAppleIcon: React.FC<SubjectAppleIconProps> = ({
  subjectId,
  size = 'md',
  className = '',
  showSpecularBorder = true,
}) => {
  const theme = getSubjectVisualTheme(subjectId);
  const IconComponent = theme.icon;
  const sizeClasses = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses.container} ${theme.bgGradient} ${theme.border} ${theme.text} border ring-1 ${theme.ring} shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] transition-transform duration-200 group-hover:scale-105 select-none ${className}`}
      style={{
        boxShadow: `0 2px 8px ${theme.color}15, 0 1px 2px rgba(0,0,0,0.04)`,
      }}
    >
      {/* Apple specular rim highlight */}
      {showSpecularBorder && (
        <span
          className="absolute inset-[0.5px] rounded-[inherit] border border-white/80 pointer-events-none"
          aria-hidden="true"
        />
      )}
      <IconComponent className={`${sizeClasses.icon} stroke-[2] shrink-0`} />
    </div>
  );
};
