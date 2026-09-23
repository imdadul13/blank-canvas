import React from 'react';
import { BookOpen, HelpCircle, TrendingUp, Brain, Target } from 'lucide-react';

export const MentorValuePropsBanner: React.FC = () => {
  const props = [
    {
      icon: BookOpen,
      title: 'Detailed Explanations',
      desc: 'Understand complex concepts with clear, structured teaching.',
      squircle: 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xs shadow-sky-500/25',
      aura: 'bg-gradient-to-tr from-sky-500/[0.04] via-white to-indigo-500/[0.02] border-sky-200/80',
    },
    {
      icon: HelpCircle,
      title: 'Exam-Style Practice',
      desc: 'Get clinical vignettes, MCQs and reasoning challenges.',
      squircle: 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-500/25',
      aura: 'bg-gradient-to-tr from-amber-500/[0.04] via-white to-orange-500/[0.02] border-amber-200/80',
    },
    {
      icon: TrendingUp,
      title: 'Personalized Guidance',
      desc: 'Aligned with your weak areas and study progress.',
      squircle: 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/25',
      aura: 'bg-gradient-to-tr from-emerald-500/[0.04] via-white to-teal-500/[0.02] border-emerald-200/80',
    },
    {
      icon: Brain,
      title: 'Clinical Thinking',
      desc: 'Learn to approach questions like an expert.',
      squircle: 'bg-gradient-to-tr from-purple-500 to-pink-600 text-white shadow-xs shadow-purple-500/25',
      aura: 'bg-gradient-to-tr from-purple-500/[0.04] via-white to-pink-500/[0.02] border-purple-200/80',
    },
    {
      icon: Target,
      title: 'Always Available',
      desc: 'Your AI faculty mentor, 24/7.',
      squircle: 'bg-gradient-to-tr from-teal-500 to-emerald-600 text-white shadow-xs shadow-teal-500/25',
      aura: 'bg-gradient-to-tr from-teal-500/[0.04] via-white to-emerald-500/[0.02] border-teal-200/80',
    },
  ];

  return (
    <div className="pt-8 pb-4 border-t border-slate-200/80">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {props.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-3xl border shadow-2xs space-y-3 flex flex-col justify-between ${item.aura}`}
            >
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${item.squircle}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-['Outfit']">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
