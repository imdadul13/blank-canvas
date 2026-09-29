import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Star,
  Pill,
  Calculator,
  Activity,
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

  if (!isOpen) return null;

  const starredPearls: MedicalPearl[] = (state?.customPearls || []).filter((p) => p.isBookmarked);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9450, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      className="font-sans antialiased select-none"
    >
      {/* Top Header - Screen Only */}
      <header className="print:hidden flex items-center justify-between px-4 sm:px-6 py-3 text-white shrink-0 border-b border-white/10 bg-slate-900/95 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-[#AF52DE] text-white shadow-sm shadow-purple-500/25">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Exam-Eve High-Yield Revision Sheet</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#AF52DE]/20 text-purple-300 border border-[#AF52DE]/30">
                PRINT &amp; PDF READY
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              High-density, multi-column print layout optimized for final 48h recall
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs text-white bg-[#AF52DE] hover:brightness-110 shadow-md shadow-purple-500/25 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Filter Tabs - Screen Only */}
      <div className="print:hidden px-4 sm:px-6 py-2.5 border-b border-white/10 flex items-center gap-2 overflow-x-auto bg-slate-950/80 backdrop-blur-md">
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
              activeFilter === tab.id
                ? 'bg-[#AF52DE] text-white font-bold shadow-sm shadow-purple-500/25'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Printable Sheet Viewport */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#F2F2F7] print:bg-white print:p-0 print:m-0">
        <div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-3xl shadow-xl print:shadow-none print:border-none print:p-4 border border-[rgba(60,60,67,0.12)]">

          {/* Printable Document Header */}
          <div className="border-b-2 border-[#BF5AF2] pb-3 mb-6 flex items-center justify-between">
            <div>
              <div className="text-[24px] font-black text-[#1D1D1F] tracking-tight">
                ONE SHOT FMGE — CLINICAL CHEAT SHEET
              </div>
              <div className="text-[12px] text-[#6E6E73] font-medium mt-0.5">
                Target: 150+ Passing Buffer • Essential Drugs of Choice, Triads, Diagnostic Signs &amp; Formulas
              </div>
            </div>
            <div className="text-right text-[11px] text-[#8E8E93] font-mono">
              <div>Session: FMGE Rapid Recall</div>
              <div>Printed: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Section 1: Drugs of Choice */}
          {(activeFilter === 'all' || activeFilter === 'docs') && (
            <section className="mb-6 break-inside-avoid">
              <div className="flex items-center gap-1.5 mb-3 pb-2 border-b-2 border-[#30D158]">
                <Pill className="h-3.5 w-3.5 text-[#30D158]" />
                <span className="text-[13px] font-black text-[#1D1D1F] uppercase tracking-wider">Top High-Frequency Drugs of Choice (DOC)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {HIGH_YIELD_DOCS.map((doc, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-[#F2F2F7] p-3 flex flex-col gap-1.5 print:bg-white print:border print:border-[rgba(60,60,67,0.12)]"
                  >
                    <div className="text-[12px] font-bold text-[#1D1D1F]">{doc.condition}</div>
                    <div className="text-[10px] text-[#8E8E93] font-mono">{doc.subject}</div>
                    <div className="text-[12px] font-semibold text-[#30D158] bg-[#EDFDF5] rounded-lg px-2 py-1 print:bg-transparent print:text-[#30D158]">
                      {doc.doc}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 2: Diagnostic Triads & Pathognomonic Signs */}
          {(activeFilter === 'all' || activeFilter === 'triads') && (
            <section className="mb-6 break-inside-avoid">
              <div className="flex items-center gap-1.5 mb-3 pb-2 border-b-2 border-[#BF5AF2]">
                <Activity className="h-3.5 w-3.5 text-[#BF5AF2]" />
                <span className="text-[13px] font-black text-[#1D1D1F] uppercase tracking-wider">Classic Clinical Triads &amp; Syndromes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {HIGH_YIELD_TRIADS.map((triad, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-[#F2F2F7] p-3 print:bg-white print:border print:border-[rgba(60,60,67,0.12)]"
                  >
                    <div className="text-[12px] font-bold text-[#1D1D1F] mb-0.5">{triad.name}</div>
                    <div className="text-[11px] text-[#3A3A3C] mb-1.5 leading-relaxed">{triad.components}</div>
                    <div className="bg-[#F5EAFF] text-[#BF5AF2] text-[11px] font-bold rounded-lg px-2 py-0.5 inline-block print:bg-transparent">
                      {triad.diagnosis}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Essential Clinical Formulas */}
          {(activeFilter === 'all' || activeFilter === 'formulas') && (
            <section className="mb-6 break-inside-avoid">
              <div className="flex items-center gap-1.5 mb-3 pb-2 border-b-2 border-[#FF9500]">
                <Calculator className="h-3.5 w-3.5 text-[#FF9500]" />
                <span className="text-[13px] font-black text-[#1D1D1F] uppercase tracking-wider">Essential Clinical Formulas &amp; Telemetry</span>
              </div>
              <div className="space-y-2">
                {HIGH_YIELD_FORMULAS.map((formula, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-[#F2F2F7] p-3 print:bg-white print:border print:border-[rgba(60,60,67,0.12)]"
                  >
                    <div className="text-[12px] font-bold text-[#1D1D1F] mb-1">{formula.name}</div>
                    <div className="font-mono text-[12px] font-bold text-[#FF9500] bg-[#FFF8EE] rounded-lg px-2 py-1 inline-block mb-1 print:bg-transparent">
                      {formula.formula}
                    </div>
                    <div className="text-[11px] text-[#6E6E73] italic">{formula.note}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Starred Weak Spots (Personal Vault) */}
          {(activeFilter === 'all' || activeFilter === 'starred') && starredPearls.length > 0 && (
            <section className="mb-6 break-inside-avoid">
              <div className="flex items-center gap-1.5 mb-3 pb-2 border-b-2 border-[#FF9500]">
                <Star className="h-3.5 w-3.5 text-[#FF9500] fill-[#FF9500]" />
                <span className="text-[13px] font-black text-[#1D1D1F] uppercase tracking-wider">Personal Starred Weak Spots ({starredPearls.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {starredPearls.map((pearl, idx) => (
                  <div
                    key={pearl.id || idx}
                    className="rounded-xl bg-[#F2F2F7] p-3 border-l-4 border-[#FF9500] print:bg-white print:border print:border-[rgba(60,60,67,0.12)]"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[12px] font-bold text-[#1D1D1F]">{pearl.title}</span>
                      <span className="text-[10px] font-mono text-[#8E8E93]">{pearl.subjectId}</span>
                    </div>
                    <div className="text-[11px] font-semibold text-[#BF5AF2] mb-1">
                      Key Takeaway: {pearl.highYieldKey}
                    </div>
                    <div className="text-[10px] text-[#6E6E73] leading-snug line-clamp-2">
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
  );
};
