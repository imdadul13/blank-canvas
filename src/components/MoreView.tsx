import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cloud,
  Download,
  GraduationCap,
  Send,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { AppState, ErrorNotebookItem } from '../types';
import { downloadBackupFile } from '../utils/storage';
import { TelegramHubView } from './TelegramHubView';
import { ActiveTab } from './Navbar';
import { Button, Card, Pill } from './ui/Button';
import { IconTile } from './ui/surface';

interface MoreViewProps {
  state: AppState;
  onOpenSettings: () => void;
  onOpenProfile?: () => void;
  onOpenCloudSync?: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onOpenAiCoach?: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
  onAddErrorItem?: (item: ErrorNotebookItem) => void;
  onUpdateAppState?: (updater: (prev: AppState) => AppState) => void;
}

type MoreSection = 'hub' | 'telegram';

const blueprintGroups = [
  {
    label: 'Pre-clinical',
    value: 51,
    percentage: '17%',
    tone: 'blue',
    subjects: [
      ['Anatomy', 17],
      ['Physiology', 17],
      ['Biochemistry', 17],
    ],
  },
  {
    label: 'Para-clinical',
    value: 79,
    percentage: '26.3%',
    tone: 'indigo',
    subjects: [
      ['Pathology', 13],
      ['Pharmacology', 13],
      ['Microbiology', 13],
      ['Forensic Medicine', 10],
      ['PSM / Community Medicine', 30],
    ],
  },
  {
    label: 'Clinical disciplines',
    value: 170,
    percentage: '56.7%',
    tone: 'green',
    subjects: [
      ['General Medicine', 33],
      ['General Surgery', 32],
      ['Obstetrics & Gynaecology', 30],
      ['Paediatrics', 15],
      ['Minor Specialties', 60],
    ],
  },
] as const;

function activateWithKeyboard(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.currentTarget.click();
  }
}

function IntelligenceCard({
  icon,
  title,
  description,
  meta,
  action,
  tone,
  onActivate,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  meta: string;
  action: string;
  tone: 'sky' | 'purple';
  onActivate: () => void;
}) {
  return (
    <Card
      interactive
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={activateWithKeyboard}
      className={`utility-intelligence-card is-${tone}`}
    >
      <div className="flex items-start justify-between gap-4">
        <IconTile icon={icon} size={44} color="var(--utility-tone)" className="utility-tool-icon" />
        <Pill tone="neutral">{meta}</Pill>
      </div>
      <div className="mt-5">
        <div className="utility-card-title">{title}</div>
        <div className="utility-card-copy mt-2">{description}</div>
      </div>
      <div className="utility-card-action mt-5">
        <span>{action}</span>
        <ChevronRight className="size-4" />
      </div>
    </Card>
  );
}

function ControlRow({
  icon,
  title,
  description,
  status,
  tone,
  onActivate,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  status: React.ReactNode;
  tone: 'blue' | 'green' | 'amber';
  onActivate: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={activateWithKeyboard}
      className={`utility-control-row is-${tone}`}
    >
      <IconTile icon={icon} size={42} color="var(--utility-tone)" className="utility-tool-icon" />
      <div className="min-w-0 flex-1">
        <div className="utility-control-title">{title}</div>
        <div className="utility-control-copy">{description}</div>
      </div>
      <div className="utility-control-status">
        {status}
        <ChevronRight className="size-4" />
      </div>
    </div>
  );
}

export const MoreView: React.FC<MoreViewProps> = ({
  state,
  onOpenSettings,
  onOpenProfile,
  onOpenCloudSync,
  onNavigateTab,
  onOpenAiCoach,
  onAddErrorItem,
  onUpdateAppState,
}) => {
  const [activeSection, setActiveSection] = useState<MoreSection>('hub');
  const [isBlueprintExpanded, setIsBlueprintExpanded] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const targetScore = state.settings?.targetScore || 180;
  const telegramCount = state.telegramQuestions?.length || 0;

  const handleExportBackup = () => {
    downloadBackupFile(state);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2400);
  };

  const openMentor = () => {
    if (onOpenAiCoach) onOpenAiCoach('strategy');
    else onNavigateTab?.('aicoach');
  };

  return (
    <div
      data-accent="home"
      className="utility-directory-page w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 pb-24 sm:pb-20 lg:pb-16 font-sans text-[var(--color-ink)]"
    >
      {activeSection !== 'hub' && (
        <Button variant="secondary" size="sm" onClick={() => setActiveSection('hub')}>
          <ArrowLeft className="size-4" />
          Back to Utility
        </Button>
      )}

      {activeSection === 'hub' && (
        <div className="utility-hub space-y-8">
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="utility-compact-header"
          >
            <div>
              <Pill tone="accent">
                <Settings className="size-3.5" />
                Utility
              </Pill>
              <div className="utility-page-title mt-4">Your study operating system.</div>
              <div className="utility-page-copy mt-2">
                Practice, intelligence, account controls, and exam planning—organized by what you need to do.
              </div>
            </div>
            <div className="utility-header-status">
              <ShieldCheck className="size-5" />
              <div>
                <div className="utility-status-label">Workspace protected</div>
                <div className="utility-status-copy">Local backup and cloud controls available</div>
              </div>
            </div>
          </motion.header>

          <section className="utility-zone">
            <div className="utility-zone-heading">
              <div>
                <div className="utility-section-label">Study &amp; intelligence</div>
                <div className="utility-section-title">Extend your preparation</div>
              </div>
              <Pill tone="neutral">3 connected tools</Pill>
            </div>

            <div className="utility-study-layout">
              <Card
                interactive
                role="button"
                tabIndex={0}
                onClick={() => onNavigateTab?.('grandtests')}
                onKeyDown={activateWithKeyboard}
                className="utility-practice-feature"
              >
                <div className="utility-practice-topline">
                  <IconTile icon={GraduationCap} size={52} color="var(--color-ios-indigo)" className="utility-practice-icon" />
                  <Pill tone="accent">Full-length simulation</Pill>
                </div>
                <div className="utility-practice-content">
                  <div className="utility-feature-kicker">Practice lab</div>
                  <div className="utility-feature-title">Turn exam pressure into a repeatable routine.</div>
                  <div className="utility-feature-copy">
                    Run timed mocks, log completed tests, and use score trends to decide what deserves the next revision block.
                  </div>
                </div>
                <div className="utility-exam-format">
                  <div><strong>300</strong><span>Questions</span></div>
                  <div><strong>300</strong><span>Marks</span></div>
                  <div><strong>150</strong><span>Cutoff</span></div>
                </div>
                <div className="utility-feature-action">
                  <span>Open Grand Test workspace</span>
                  <ChevronRight className="size-4" />
                </div>
              </Card>

              <div className="utility-intelligence-stack">
                <IntelligenceCard
                  icon={Send}
                  title="Medical Wire"
                  description="Peer questions and clinical spotters, cleaned into a focused recall stream."
                  meta={`${telegramCount} questions`}
                  action="Browse the wire"
                  tone="sky"
                  onActivate={() => (onNavigateTab ? onNavigateTab('telegram') : setActiveSection('telegram'))}
                />
                <IntelligenceCard
                  icon={Brain}
                  title="Clinical Faculty Mentor"
                  description="Work through differentials, vivas, and weak-topic remediation with grounded guidance."
                  meta="NBE grounded"
                  action="Start consultation"
                  tone="purple"
                  onActivate={openMentor}
                />
              </div>
            </div>
          </section>

          <section className="utility-zone">
            <div className="utility-zone-heading">
              <div>
                <div className="utility-section-label">Account &amp; resilience</div>
                <div className="utility-section-title">Your preparation, under your control</div>
              </div>
              <Pill tone="pass">
                <ShieldCheck className="size-3.5" />
                Data controls ready
              </Pill>
            </div>

            <Card className="utility-control-panel">
              <div className="utility-control-intro">
                <div>
                  <div className="utility-control-eyebrow">Candidate workspace</div>
                  <div className="utility-control-heading">Identity, sync, and recovery</div>
                  <div className="utility-control-description">
                    Keep your target accurate and your study history portable across sessions and devices.
                  </div>
                </div>
                <div className="utility-target-score">
                  <span>Target score</span>
                  <strong>{targetScore}</strong>
                </div>
              </div>

              <div className="utility-control-list">
                {onOpenProfile && (
                  <ControlRow
                    icon={User}
                    title="Candidate profile"
                    description="Exam date, target score, and preparation timeline"
                    status={<Pill tone="info">Target {targetScore}</Pill>}
                    tone="blue"
                    onActivate={onOpenProfile}
                  />
                )}
                {onOpenCloudSync && (
                  <ControlRow
                    icon={Cloud}
                    title="Cloud sync"
                    description="Keep study progress available across signed-in devices"
                    status={<Pill tone="pass">Available</Pill>}
                    tone="green"
                    onActivate={onOpenCloudSync}
                  />
                )}
                <ControlRow
                  icon={downloadSuccess ? CheckCircle2 : Download}
                  title={downloadSuccess ? 'Backup downloaded' : 'Offline backup'}
                  description="Export a portable JSON copy of your complete study workspace"
                  status={<Pill tone={downloadSuccess ? 'pass' : 'warn'}>{downloadSuccess ? 'Saved' : 'Export'}</Pill>}
                  tone="amber"
                  onActivate={handleExportBackup}
                />
              </div>
            </Card>
          </section>

          <Card
            interactive
            role="button"
            tabIndex={0}
            onClick={onOpenSettings}
            onKeyDown={activateWithKeyboard}
            className="utility-preference-strip"
          >
            <div className="utility-preference-main">
              <IconTile icon={Settings} size={46} color="var(--color-ink-2)" />
              <div>
                <div className="utility-card-title">Preferences &amp; calibration</div>
                <div className="utility-card-copy mt-1">
                  Appearance, sound, daily study hours, target score, and MCQ timer behavior.
                </div>
              </div>
            </div>
            <div className="utility-preference-action">
              <span>Customize workspace</span>
              <ChevronRight className="size-4" />
            </div>
          </Card>

          <section className="utility-zone">
            <div className="utility-zone-heading">
              <div>
                <div className="utility-section-label">Exam map</div>
                <div className="utility-section-title">Know where the 300 marks live</div>
              </div>
              <Pill tone="info">
                <BookOpen className="size-3.5" />
                NBE blueprint
              </Pill>
            </div>

            <Card className="utility-blueprint-module">
              <div className="utility-blueprint-overview">
                <div>
                  <div className="utility-blueprint-title">Subject weightage</div>
                  <div className="utility-blueprint-copy">Clinical disciplines carry more than half of the paper.</div>
                </div>
                <div className="utility-blueprint-total">
                  <strong>300</strong>
                  <span>total questions</span>
                </div>
              </div>

              <div className="utility-weightage-rail" aria-label="Exam weightage distribution">
                {blueprintGroups.map((group) => (
                  <div
                    key={group.label}
                    className={`utility-weightage-segment is-${group.tone}`}
                    style={{ width: group.percentage }}
                  />
                ))}
              </div>

              <div className="utility-blueprint-groups">
                {blueprintGroups.map((group) => (
                  <div key={group.label} className={`utility-blueprint-group is-${group.tone}`}>
                    <div className="utility-blueprint-group-label">
                      <span className="utility-blueprint-dot" />
                      <span>{group.label}</span>
                    </div>
                    <strong>{group.value}</strong>
                    <span>{group.percentage} of paper</span>
                  </div>
                ))}
              </div>

              <Button
                variant="secondary"
                block
                onClick={() => setIsBlueprintExpanded((current) => !current)}
                aria-expanded={isBlueprintExpanded}
                className="utility-blueprint-toggle"
              >
                {isBlueprintExpanded ? 'Hide subject breakdown' : 'View subject breakdown'}
                <ChevronDown className={`size-4 transition-transform ${isBlueprintExpanded ? 'rotate-180' : ''}`} />
              </Button>

              <AnimatePresence initial={false}>
                {isBlueprintExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="utility-subject-grid">
                      {blueprintGroups.map((group) => (
                        <div key={group.label} className={`utility-subject-column is-${group.tone}`}>
                          <div className="utility-subject-heading">{group.label}</div>
                          <div className="utility-subject-list">
                            {group.subjects.map(([subject, questions]) => (
                              <div key={subject}>
                                <span>{subject}</span>
                                <strong>{questions} Qs</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </section>

          <div className="utility-privacy-footer">
            <div>
              <ShieldCheck className="size-4" />
              <span>Study data saves on this device and syncs when you sign in.</span>
            </div>
            <span>NBE CBT standard aligned</span>
          </div>
        </div>
      )}

      {activeSection === 'telegram' && (
        <TelegramHubView
          onAddToErrorNotebook={onAddErrorItem || (() => {})}
          onUpdateAppState={onUpdateAppState || (() => {})}
        />
      )}
    </div>
  );
};
