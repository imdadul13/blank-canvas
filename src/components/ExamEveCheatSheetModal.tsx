import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  FileText,
  Star,
  CheckCircle2,
  Pill,
  Calculator,
  Activity,
  AlertTriangle,
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

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-slate-950/80 backdrop-blur-md font-['Plus_Jakarta_Sans'] select-none">
      {/* Top Header - Screen Only */}
      <header className="print:hidden flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-400/30">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
              <span>Exam-Eve High-Yield Revision Sheet</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                PRINT &amp; PDF READY
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              High-density, multi-column print layout optimized for final 48h recall
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Trigger */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Filter Tabs - Screen Only */}
      <div className="print:hidden px-4 sm:px-6 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
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
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Printable Sheet Viewport */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:m-0 text-slate-900">
        <div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-xl print:shadow-none print:border-none print:p-4 border border-slate-200 text-slate-900">
          {/* Printable Document Header */}
          <div className="border-b-2 border-teal-800 pb-3 mb-6 flex items-center justify-between">
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                ONE SHOT <span className="text-[#006B63]">FMGE</span> — CLINICAL CHEAT SHEET
              </div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                Target: 150+ Passing Buffer • Essential Drugs of Choice, Triads, Diagnostic Signs &amp; Formulas
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-mono">
              <div>Session: FMGE Rapid Recall</div>
              <div>Printed: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Section 1: Drugs of Choice */}
          {(activeFilter === 'all' || activeFilter === 'docs') && (
            <section className="mb-6 break-inside-avoid">
              <div className="flex items-center gap-1.5 text-xs font-black text-teal-900 uppercase tracking-wider mb-2 border-b border-teal-700 pb-1">
                <Pill className="h-3.5 w-3.5 text-teal-700" />
                <span>Top High-Frequency Drugs of Choice (DOC)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {HIGH_YIELD_DOCS.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 print:bg-white print:border-slate-300 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                      <span>{doc.condition}</span>
                      <span className="text-[10px] font-mono text-teal-700">{doc.subject}</span>
                    </div>
                    <div className="font-semibold text-teal-800 print:text-teal-900 bg-teal-50 print:bg-transparent p-1 rounded">
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
              <div className="flex items-center gap-1.5 text-xs font-black text-teal-900 uppercase tracking-wider mb-2 border-b border-teal-700 pb-1">
                <Activity className="h-3.5 w-3.5 text-teal-700" />
                <span>Classic Clinical Triads &amp; Syndromes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {HIGH_YIELD_TRIADS.map((triad, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 print:bg-white print:border-slate-300"
                  >
                    <div className="font-bold text-slate-950 mb-0.5">{triad.name}</div>
                    <div className="text-slate-700 mb-1 text-[11px] leading-relaxed">
                      {triad.components}
                    </div>
                    <div className="text-[11px] font-bold text-amber-800 print:text-amber-900 bg-amber-50 print:bg-transparent px-1 py-0.5 rounded inline-block">
                      Diagnosis: {triad.diagnosis}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Essential Clinical Formulas */}
          {(activeFilter === 'all' || activeFilter === 'formulas') && (
            <section className="mb-6 break-inside-avoid">
              <div className="flex items-center gap-1.5 text-xs font-black text-teal-900 uppercase tracking-wider mb-2 border-b border-teal-700 pb-1">
                <Calculator className="h-3.5 w-3.5 text-teal-700" />
                <span>Essential Clinical Formulas &amp; Telemetry</span>
              </div>
              <div className="space-y-2 text-xs">
                {HIGH_YIELD_FORMULAS.map((formula, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 print:bg-white print:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-slate-950">{formula.name}: </span>
                      <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1 py-0.5 rounded">
                        {formula.formula}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 italic sm:max-w-xs">{formula.note}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Starred Weak Spots (Personal Vault) */}
          {(activeFilter === 'all' || activeFilter === 'starred') && starredPearls.length > 0 && (
            <section className="mb-6 break-inside-avoid">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wider mb-2 border-b border-amber-600 pb-1">
                <Star className="h-3.5 w-3.5 text-amber-600 fill-amber-600" />
                <span>Personal Starred Weak Spots ({starredPearls.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {starredPearls.map((pearl, idx) => (
                  <div
                    key={pearl.id || idx}
                    className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40 print:bg-white print:border-slate-300"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
                      <span>{pearl.title}</span>
                      <span className="text-[10px] font-mono text-amber-700">{pearl.subjectId}</span>
                    </div>
                    <div className="text-[11px] font-semibold text-teal-800 mb-1">
                      Key Takeaway: {pearl.highYieldKey}
                    </div>
                    <div className="text-[10px] text-slate-600 leading-snug line-clamp-2">
                      {pearl.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>,
    document.body
  );
};
