import React from 'react';
import { BookOpen, HelpCircle, TrendingUp, Brain, Target } from 'lucide-react';

export const MentorValuePropsBanner: React.FC = () => {
  const props = [
    {
      icon: BookOpen,
      title: 'Detailed Explanations',
      desc: 'Understand complex concepts with clear, structured teaching.',
    },
    {
      icon: HelpCircle,
      title: 'Exam-Style Practice',
      desc: 'Get clinical vignettes, MCQs and reasoning challenges.',
    },
    {
      icon: TrendingUp,
      title: 'Personalized Guidance',
      desc: 'Aligned with your weak areas and study progress.',
    },
    {
      icon: Brain,
      title: 'Clinical Thinking',
      desc: 'Learn to approach questions like an expert.',
    },
    {
      icon: Target,
      title: 'Always Available',
      desc: 'Your AI faculty mentor, 24/7.',
    },
  ];

  return (
    <div className="pt-8 pb-4 border-t border-slate-200/80">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {props.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-[#e6f4f2] text-[#006B63] flex items-center justify-center shrink-0">
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
