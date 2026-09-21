import React from 'react';
import { motion } from 'motion/react';
import {
  Target,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Award,
  ChevronRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { AppState } from '../types';
import { AppStats } from '../utils/storage';

interface PassingGapAnalyzerProps {
  state: AppState;
  stats: AppStats;
  onSelectSubject?: (subjectId: string) => void;
  onOpenAiCoach?: (initialTab?: any, subjectId?: string, topicName?: string) => void;
}

export const PassingGapAnalyzer: React.FC<PassingGapAnalyzerProps> = ({
  state,
  stats,
  onSelectSubject,
  onOpenAiCoach,
}) => {
  // FMGE Passing Threshold is 150 out of 300 marks (50%)
  // Real score projection derived from latest/average GT scores and overall syllabus readiness
  const gtScore = stats.latestGTScore || stats.averageGTScore;
  const readinessEst = Math.round((stats.overallReadinessScore / 100) * 300);
  const projectedScore = gtScore
    ? Math.round(gtScore * 0.75 + readinessEst * 0.25)
    : Math.max(90, Math.min(270, readinessEst || 158));

  const gap = projectedScore - 150;
  const isPassing = projectedScore >= 150;

  // Determine safety status
  let statusBadge = {
    label: 'Safe Passing Zone',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: ShieldCheck,
    desc: `+${gap} marks above 150 passing cutoff. Keep revising to defend buffer.`,
  };

  if (projectedScore < 130) {
    statusBadge = {
      label: 'Critical Mark Deficit',
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: AlertTriangle,
      desc: `${Math.abs(gap)} marks needed to reach 150. Focus on the 4 high-yield subjects below.`,
    };
  } else if (projectedScore < 150) {
    statusBadge = {
      label: 'Borderline Passing Gap',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      desc: `Only ${Math.abs(gap)} marks away from crossing 150. Immediate high-yield revision recommended.`,
    };
  } else if (projectedScore >= 180) {
    statusBadge = {
      label: 'High Distinction',
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: Award,
      desc: `Strong clinical foundation (+${gap} buffer). Maintain grand test stamina.`,
    };
  }

  // Top 4 High-Yield Subject Boosters (The "Big 4" of FMGE)
  const HIGH_YIELD_BOOSTERS = [
    {
      subjectId: 'obg',
      subjectName: 'Obstetrics & Gynaecology',
      examWeight: '30 Qs',
      potentialBoost: '+8 marks',
      highYieldTopics: 'PPH, Eclampsia Pritchard, Partogram',
    },
    {
      subjectId: 'pharmacology',
      subjectName: 'Pharmacology',
      examWeight: '30 Qs',
      potentialBoost: '+6 marks',
      highYieldTopics: 'Autonomic Receptors, Antimicrobials, DOCs',
    },
    {
      subjectId: 'psm',
      subjectName: 'PSM (Community Medicine)',
      examWeight: '30 Qs',
      potentialBoost: '+8 marks',
      highYieldTopics: 'Biostatistics, Vaccines, National Programs',
    },
    {
      subjectId: 'pathology',
      subjectName: 'Pathology',
      examWeight: '30 Qs',
      potentialBoost: '+6 marks',
      highYieldTopics: 'Neoplasia Oncogenes, Glomerulonephritis, Anemias',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-white via-white to-teal-50/20 rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-teal-700 text-white shadow-sm shadow-teal-700/20">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit']">
                150/300 Passing Score Gap Analyzer
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900">
                NBE Cutoff
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Dynamic exam readiness projection based on current clinical accuracy
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold font-['Outfit'] ${statusBadge.color}`}
        >
          <statusBadge.icon className="h-4 w-4 shrink-0" />
          <span>{statusBadge.label}</span>
        </div>
      </div>

      {/* Visual Meter Row */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-['Outfit']">
              {projectedScore}
            </span>
            <span className="text-sm font-bold text-slate-400 font-['Outfit']">/ 300</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                isPassing ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isPassing ? `+${gap} Safe Margin` : `${gap} Deficit`}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-700 font-['Outfit'] block">
              150 Marks = Pass
            </span>
            <span className="text-[11px] text-slate-400 font-sans">No Negative Marking</span>
          </div>
        </div>

        {/* Progress Track */}
        <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
          {/* 150 Marker line (at 50%) */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-700 z-10" />

          {/* Filled Bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (projectedScore / 300) * 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all ${
              projectedScore >= 165
                ? 'bg-gradient-to-r from-teal-600 to-emerald-500'
                : projectedScore >= 150
                ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                : 'bg-gradient-to-r from-rose-500 to-amber-500'
            }`}
          />
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 font-sans px-0.5">
          <span>0 (Starting)</span>
          <span className="font-bold text-slate-700">150 Pass Line (50%)</span>
          <span>300 (Max)</span>
        </div>
      </div>

      {/* Description Callout */}
      <p className="text-xs text-slate-600 font-sans bg-slate-50 p-3 rounded-2xl border border-slate-200/60 leading-relaxed">
        {statusBadge.desc}
      </p>

      {/* High-Yield Mark Boosters List */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-['Outfit'] flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>High-Yield Subject Mark Boosters</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-sans">Focus for maximum points</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {HIGH_YIELD_BOOSTERS.map((booster) => (
            <div
              key={booster.subjectId}
              onClick={() => onSelectSubject?.(booster.subjectId)}
              className="p-3 bg-white hover:bg-teal-50/40 rounded-2xl border border-slate-200/80 hover:border-teal-300 transition-all cursor-pointer group shadow-2xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900 font-['Outfit'] truncate">
                  {booster.subjectName}
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg shrink-0">
                  {booster.potentialBoost}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 truncate font-sans">
                {booster.highYieldTopics}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                <span>{booster.examWeight} in exam</span>
                <span className="text-teal-700 group-hover:underline flex items-center gap-0.5 font-semibold">
                  <span>Revise Now</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
