import React, { useState } from "react";
import {
  Stethoscope,
  Scissors,
  Baby,
  Users,
  FlaskConical,
  Pill,
  Bug,
  Bone,
  Eye,
  Brain,
  Sparkles,
  ChevronRight,
  Activity,
  Layers
} from "lucide-react";
import { FMGE_SUBJECTS } from "../../data/fmgeSubjects";

interface TelegramSubjectCollectionsProps {
  subjectCounts: Record<string, number>;
  selectedSubject: string;
  onSelectSubject: (subjectId: string) => void;
}

// Icon mapper for medical subjects
const getSubjectIcon = (subjectId: string) => {
  switch (subjectId.toLowerCase()) {
    case "medicine":
    case "general medicine":
    case "cardiology":
      return <Stethoscope className="w-4 h-4 text-sky-600" />;
    case "surgery":
    case "general surgery":
      return <Scissors className="w-4 h-4 text-emerald-600" />;
    case "obgyn":
    case "obstetrics & gynaecology":
    case "gynecology":
      return <Baby className="w-4 h-4 text-rose-500" />;
    case "pediatrics":
      return <Baby className="w-4 h-4 text-amber-500" />;
    case "psm":
    case "community medicine":
      return <Users className="w-4 h-4 text-indigo-600" />;
    case "pathology":
      return <FlaskConical className="w-4 h-4 text-teal-600" />;
    case "pharmacology":
      return <Pill className="w-4 h-4 text-orange-600" />;
    case "microbiology":
      return <Bug className="w-4 h-4 text-purple-600" />;
    case "anatomy":
      return <Bone className="w-4 h-4 text-blue-600" />;
    case "biochemistry":
      return <Sparkles className="w-4 h-4 text-amber-600" />;
    case "ophthalmology":
      return <Eye className="w-4 h-4 text-cyan-600" />;
    case "ent":
    case "psychiatry":
      return <Brain className="w-4 h-4 text-violet-600" />;
    default:
      return <Activity className="w-4 h-4 text-slate-600" />;
  }
};

export const TelegramSubjectCollections: React.FC<TelegramSubjectCollectionsProps> = ({
  subjectCounts,
  selectedSubject,
  onSelectSubject,
}) => {
  const [showAll, setShowAll] = useState(false);

  // Take top 8 subjects for initial display, or all 19
  const displayedSubjects = showAll ? FMGE_SUBJECTS : FMGE_SUBJECTS.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
            Recently Added Subjects
          </h3>
          <p className="text-xs text-slate-500">
            Explore community-ingested content by medical discipline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-semibold text-[#00685f] hover:text-[#005049] flex items-center gap-1 cursor-pointer transition-colors"
        >
          {showAll ? "Show Less ↑" : "View All Subjects →"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {displayedSubjects.map((sub) => {
          const count =
            subjectCounts[sub.id.toLowerCase()] ||
            subjectCounts[sub.name.toLowerCase()] ||
            0;
          const isSelected =
            selectedSubject.toLowerCase() === sub.id.toLowerCase() ||
            selectedSubject.toLowerCase() === sub.name.toLowerCase();

          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
                if (isSelected) {
                  onSelectSubject("all");
                } else {
                  onSelectSubject(sub.id);
                }
              }}
              className={`h-full rounded-2xl border p-3 sm:p-3.5 text-left transition-all cursor-pointer flex items-center justify-between group ${
                isSelected
                  ? "bg-[#ECF7F5] border-[#00685f] shadow-xs ring-1 ring-[#00685f]"
                  : "bg-white border-stone-200/90 hover:border-stone-300 hover:shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                  {getSubjectIcon(sub.id)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {sub.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {count} {count === 1 ? "item" : "items"}
                  </div>
                </div>
              </div>

              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  isSelected
                    ? "text-[#00685f] translate-x-0.5"
                    : "text-stone-300 group-hover:text-stone-500"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
