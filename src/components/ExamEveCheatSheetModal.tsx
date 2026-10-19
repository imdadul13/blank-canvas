import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  FileText,
  Star,
  Pill,
  Calculator,
  Activity,
  Sparkles,
} from 'lucide-react';
import { AppState, MedicalPearl } from '../types';

interface ExamEveCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  state?: AppState;
}

// Curated high-frequency clinical DOCs for FMGE
export const HIGH_YIELD_DOCS = [
  { condition: 'Anaphylactic Shock', doc: 'Adrenaline (1:1000 IM anterolateral thigh)', subject: 'Pharmacology' },
  { condition: 'Eclampsia / Severe Pre-eclampsia', doc: 'Magnesium Sulfate (MgSO4 - Pritchard Regimen)', subject: 'OBG' },
  { condition: 'Status Epilepticus', doc: 'Lorazepam IV (0.1 mg/kg) -> Levetiracetam / Fosphenytoin', subject: 'Medicine' },
  { condition: 'Acute Gout Attack', doc: 'NSAIDs (Indomethacin) / Colchicine (if renal safe)', subject: 'Medicine' },
  { condition: 'Primary / Secondary Syphilis', doc: 'Benzathine Penicillin G (2.4 MU IM single dose)', subject: 'Dermatology' },
  { condition: 'MRSA Bacteremia / Severe Cellulitis', doc: 'Vancomycin / Daptomycin / Linezolid', subject: 'Microbiology' },
  { condition: 'Typhoid Fever (Ceftriaxone Resistant)', doc: 'Azithromycin (500mg OD x 7d)', subject: 'Microbiology' },
  { condition: 'Pseudomembranous Colitis (C. diff)', doc: 'Oral Vancomycin (125mg QID) / Fidaxomicin', subject: 'Medicine' },
  { condition: 'Postpartum Hemorrhage (PPH Uterine Atony)', doc: 'Oxytocin (10 IU IM / IV infusion) -> Carboprost', subject: 'OBG' },
  { condition: 'Trigeminal Neuralgia', doc: 'Carbamazepine (100-200mg BD)', subject: 'Medicine' },
  { condition: 'Paracetamol (Acetaminophen) Toxicity', doc: 'N-Acetylcysteine (NAC within 8 hours)', subject: 'FMT' },
  { condition: 'Organophosphate Poisoning', doc: 'Atropine IV (until secretional dry) + Pralidoxime', subject: 'FMT' },
];

// Curated high-frequency Diagnostic Triads for FMGE
export const HIGH_YIELD_TRIADS = [
  { name: "Beck's Triad", components: 'Hypotension + Muffled Heart Sounds + JVD', diagnosis: 'Cardiac Tamponade' },
  { name: "Charcot's Cholangitis Triad", components: 'Jaundice + Fever with Chills + RUQ Pain', diagnosis: 'Acute Cholangitis' },
  { name: "Virchow's Triad", components: 'Endothelial Injury + Stasis of Blood Flow + Hypercoagulability', diagnosis: 'Thrombosis / DVT' },
  { name: "Cushing's Triad", components: 'Hypertension (Widened Pulse Pressure) + Bradycardia + Irregular Respiration', diagnosis: 'Elevated ICP' },
  { name: "Whipple's Triad", components: 'Symptoms of hypoglycemia + Low blood glucose (<50mg/dL) + Relief on glucose administration', diagnosis: 'Insulinoma' },
  { name: "Horner's Syndrome", components: 'Ptosis + Miosis + Anhidrosis (Unilateral)', diagnosis: 'Oculosympathetic disruption (Pancoast Tumor)' },
  { name: "Samter's Triad", components: 'Aspirin Sensitivity + Asthma + Nasal Polyps', diagnosis: 'Aspirin-Exacerbated Respiratory Disease' },
  { name: "Unhappy Triad (O'Donoghue)", components: 'ACL Tear + MCL Tear + Medial Meniscus Tear', diagnosis: 'Severe Lateral Impact Knee Injury' },
];

// Essential Clinical Formulas
export const HIGH_YIELD_FORMULAS = [
  { name: 'Parkland Burn Resuscitation Formula', formula: '4 mL x Body Weight (kg) x % TBSA Burned', note: '50% in first 8 hours from burn time; 50% over next 16 hours (Ringer Lactate).' },
  { name: "Winter's Formula (Respiratory Compensation)", formula: 'Expected PaCO2 = (1.5 x [HCO3-]) + 8 ± 2', note: 'If measured PaCO2 > expected -> Concomitant Respiratory Acidosis.' },
  { name: 'Serum Anion Gap', formula: '[Na+] - ([Cl-] + [HCO3-])', note: 'Normal: 8 - 12 mEq/L. High AG in MUDPILES (Methanol, Uremia, DKA, etc.).' },
  { name: 'Corrected Serum Calcium (Hypoalbuminemia)', formula: 'Total Ca + 0.8 x (4.0 - Serum Albumin [g/dL])', note: 'Always calculate before diagnosing hypocalcemia in malnourished patients.' },
  { name: 'Sodium Deficit in Severe Hyponatremia', formula: '0.6 x Weight (kg) x (Target Na [125] - Current Na)', note: 'Max correction rate: <= 8 to 10 mEq/L in 24h to avoid ODS / CPM.' },
];

export const ExamEveCheatSheetModal: React.FC<ExamEveCheatSheetModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'docs' | 'triads' | 'formulas' | 'starred'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const starredPearls: MedicalPearl[] = (state?.customPearls || []).filter((p) => p.isBookmarked);

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans antialiased animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative bg-white/98 backdrop-blur-3xl rounded-3xl max-w-4xl w-full shadow-[0_24px_64px_rgba(0,0,0,0.22),0_2px_8px_rgba(0,0,0,0.06)] border border-[rgba(60,60,67,0.12)] overflow-hidden flex flex-col max-h-[92dvh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular Edge */}
        <div
          className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Header - Apple Glass */}
        <header className="print:hidden flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(60,60,67,0.08)] bg-white/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#AF52DE] to-[#5856D6] text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/25">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] tracking-tight">
                  High-Yield Clinical Revision Sheet
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#AF52DE]/10 text-[#AF52DE] border border-[#AF52DE]/20 shrink-0">
                  PRINT &amp; PDF READY
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] truncate">
                Curated drugs of choice, clinical triads &amp; critical formulas for final FMGE recall
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-[#AF52DE] to-[#5856D6] hover:brightness-105 shadow-sm shadow-purple-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close revision sheet"
              className="h-8 w-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#3A3A3C] flex items-center justify-center transition-colors cursor-pointer"
              title="Close (ESC)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Filter Tabs */}
        <div className="print:hidden px-5 sm:px-6 py-2.5 border-b border-[rgba(60,60,67,0.06)] flex items-center gap-1.5 overflow-x-auto bg-[#F2F2F7]/50 shrink-0 scrollbar-none">
          {[
            { id: 'all', label: 'All High-Yield' },
            { id: 'docs', label: 'Drugs of Choice (DOC)' },
            { id: 'triads', label: 'Diagnostic Triads' },
            { id: 'formulas', label: 'Clinical Formulas' },
            { id: 'starred', label: `Starred Weak Spots (${starredPearls.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-white text-[#AF52DE] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-[rgba(60,60,67,0.08)]'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Printable Sheet Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 print:bg-white print:p-0">
          <div className="bg-white p-5 sm:p-7 rounded-2xl shadow-xs border border-[rgba(60,60,67,0.08)] space-y-6 print:border-none print:shadow-none print:p-0">

            {/* Document Header */}
            <div className="border-b border-[#AF52DE]/30 pb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight">
                  ONE SHOT FMGE — CLINICAL CHEAT SHEET
                </div>
                <div className="text-xs text-[#6E6E73] font-medium mt-0.5">
                  Target: 150+ Passing Buffer • Essential Drugs of Choice, Triads, Diagnostic Signs &amp; Formulas
                </div>
              </div>
              <div className="text-left sm:text-right text-[11px] text-[#8E8E93] font-mono">
                <div>Session: FMGE Rapid Recall</div>
                <div>Printed: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Section 1: Drugs of Choice */}
            {(activeFilter === 'all' || activeFilter === 'docs') && (
              <section className="break-inside-avoid">
                <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-[#30D158]/30">
                  <Pill className="h-4 w-4 text-[#30D158]" />
                  <span className="text-xs sm:text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">
                    Top High-Frequency Drugs of Choice (DOC)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {HIGH_YIELD_DOCS.map((doc, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-[#F2F2F7]/70 hover:bg-[#F2F2F7] p-3 flex flex-col gap-1.5 border border-[rgba(60,60,67,0.06)] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#1D1D1F]">{doc.condition}</span>
                        <span className="text-[10px] text-[#8E8E93] font-mono shrink-0">{doc.subject}</span>
                      </div>
                      <div className="text-xs font-semibold text-[#288544] bg-[#EDFDF5] rounded-lg px-2.5 py-1.5 border border-[#30D158]/20">
                        {doc.doc}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section 2: Diagnostic Triads & Pathognomonic Signs */}
            {(activeFilter === 'all' || activeFilter === 'triads') && (
              <section className="break-inside-avoid">
                <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-[#AF52DE]/30">
                  <Activity className="h-4 w-4 text-[#AF52DE]" />
                  <span className="text-xs sm:text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">
                    Classic Clinical Triads &amp; Syndromes
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {HIGH_YIELD_TRIADS.map((triad, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-[#F2F2F7]/70 hover:bg-[#F2F2F7] p-3 border border-[rgba(60,60,67,0.06)] flex flex-col justify-between gap-2 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#1D1D1F] mb-1">{triad.name}</div>
                        <div className="text-[11.5px] text-[#3A3A3C] leading-relaxed">{triad.components}</div>
                      </div>
                      <div className="bg-[#F5EAFF] text-[#AF52DE] text-[11px] font-bold rounded-lg px-2.5 py-1 inline-block border border-[#AF52DE]/20 w-fit">
                        {triad.diagnosis}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section 3: Essential Clinical Formulas */}
            {(activeFilter === 'all' || activeFilter === 'formulas') && (
              <section className="break-inside-avoid">
                <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-[#FF9500]/30">
                  <Calculator className="h-4 w-4 text-[#FF9500]" />
                  <span className="text-xs sm:text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">
                    Essential Clinical Formulas &amp; Telemetry
                  </span>
                </div>
                <div className="space-y-2.5">
                  {HIGH_YIELD_FORMULAS.map((formula, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-[#F2F2F7]/70 hover:bg-[#F2F2F7] p-3 border border-[rgba(60,60,67,0.06)] transition-colors"
                    >
                      <div className="text-xs font-bold text-[#1D1D1F] mb-1.5">{formula.name}</div>
                      <div className="font-mono text-xs font-bold text-[#C97000] bg-[#FFF8EE] rounded-lg px-2.5 py-1.5 inline-block mb-1.5 border border-[#FF9500]/20">
                        {formula.formula}
                      </div>
                      <div className="text-[11px] text-[#6E6E73] italic leading-relaxed">{formula.note}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section 4: Starred Weak Spots (Personal Vault) */}
            {(activeFilter === 'all' || activeFilter === 'starred') && starredPearls.length > 0 && (
              <section className="break-inside-avoid">
                <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-[#FF9500]/30">
                  <Star className="h-4 w-4 text-[#FF9500] fill-[#FF9500]" />
                  <span className="text-xs sm:text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">
                    Personal Starred Weak Spots ({starredPearls.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {starredPearls.map((pearl, idx) => (
                    <div
                      key={pearl.id || idx}
                      className="rounded-xl bg-[#F2F2F7]/70 p-3 border-l-4 border-[#FF9500] border-t border-r border-b border-[rgba(60,60,67,0.06)]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#1D1D1F]">{pearl.title}</span>
                        <span className="text-[10px] font-mono text-[#8E8E93]">{pearl.subjectId}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#AF52DE] mb-1">
                        Key Takeaway: {pearl.highYieldKey}
                      </div>
                      <div className="text-[10.5px] text-[#6E6E73] leading-snug line-clamp-2">
                        {pearl.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>,
    document.body
  );
};
