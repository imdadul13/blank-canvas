import { lazy, Suspense } from 'react';
import type { AppState } from '../../types';
import type { AppStats } from '../../utils/storage';
import type { ActiveTab } from '../Navbar';
import { WorkspaceLoadingState } from '../ui/AsyncState';

const NotificationCenterModal = lazy(() =>
  import('../NotificationCenterModal').then((module) => ({
    default: module.NotificationCenterModal,
  })),
);
const ShareMilestoneModal = lazy(() =>
  import('../ShareMilestoneModal').then((module) => ({
    default: module.ShareMilestoneModal,
  })),
);

function OverlayLoadingState({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-dialog grid place-items-center bg-[var(--color-scrim)] p-4 backdrop-blur-sm">
      <WorkspaceLoadingState label={label} compact />
    </div>
  );
}

export function DashboardOverlays({
  state,
  stats,
  isNotificationCenterOpen,
  isShareModalOpen,
  onCloseNotificationCenter,
  onCloseShare,
  onNavigateTab,
  onSelectSubject,
  onLaunchPracticeSession,
}: {
  state: AppState;
  stats: AppStats;
  isNotificationCenterOpen: boolean;
  isShareModalOpen: boolean;
  onCloseNotificationCenter: () => void;
  onCloseShare: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectSubject: (subjectId: string) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string,
  ) => void;
}) {
  return (
    <>
      {isNotificationCenterOpen && (
        <Suspense fallback={<OverlayLoadingState label="Opening notification center" />}>
          <NotificationCenterModal
            isOpen
            onClose={onCloseNotificationCenter}
            state={state}
            onNavigateTab={onNavigateTab}
            onSelectSubject={onSelectSubject}
            onLaunchPracticeSession={onLaunchPracticeSession}
          />
        </Suspense>
      )}

      {isShareModalOpen && (
        <Suspense fallback={<OverlayLoadingState label="Preparing your milestone" />}>
          <ShareMilestoneModal
            isOpen
            onClose={onCloseShare}
            state={state}
            stats={stats}
          />
        </Suspense>
      )}
    </>
  );
}
