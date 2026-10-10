import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Download,
  Upload,
  HardDrive,
  ShieldCheck,
  Server,
  Activity,
  Clock,
} from 'lucide-react';
import {
  downloadBackupFile,
  normalizeAppState,
  getAvailableSnapshots,
  restoreLocalSnapshot,
  createLocalSnapshot,
  saveAppState,
  LocalSnapshot,
} from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { AppState, SyncStatus } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  syncStatus?: SyncStatus;
  onUpdateAppState?: (updater: (prev: AppState) => AppState) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  state,
  syncStatus = 'synced',
  onUpdateAppState,
}) => {
  const { user, forceSyncToCloud, isGuest } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('fmge_last_sync_timestamp');
      return stored ? new Date(stored).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not synced yet';
    } catch {
      return 'Not synced yet';
    }
  });
  const [syncFeedback, setSyncFeedback] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [snapshots, setSnapshots] = useState<LocalSnapshot[]>(() => getAvailableSnapshots());
  const canSyncToCloud = Boolean(user && !isGuest);
  const displaySyncStatus = isSyncing ? 'syncing' : canSyncToCloud ? syncStatus : 'local';
  const syncStatusLabel = {
    synced: 'Synced',
    syncing: 'Syncing',
    offline: 'Offline',
    error: 'Needs attention',
    local: 'On this device',
  }[displaySyncStatus];

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRestoreSnapshot = (snap: LocalSnapshot) => {
    if (
      window.confirm(
        `Restore local snapshot from ${new Date(snap.timestamp).toLocaleString()}? This will safely reload your study records to that point.`
      )
    ) {
      const restored = restoreLocalSnapshot(snap.id);
      if (restored && onUpdateAppState) {
        onUpdateAppState(() => restored);
        setSyncFeedback({ kind: 'success', text: `Restored snapshot: ${snap.label}.` });
        setSnapshots(getAvailableSnapshots());
      }
    }
  };

  const handleCreateSnapshot = () => {
    const snap = createLocalSnapshot(
      state,
      `Manual Checkpoint (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
    );
    if (snap) {
      setSnapshots(getAvailableSnapshots());
      setSyncFeedback({ kind: 'success', text: 'A local study snapshot was created.' });
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      if (canSyncToCloud && forceSyncToCloud) {
        await forceSyncToCloud();
        saveAppState(state);
        const timestamp = new Date().toISOString();
        localStorage.setItem('fmge_last_sync_timestamp', timestamp);
        setLastSyncTime(new Date(timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }));
        setSyncFeedback({ kind: 'success', text: 'Cloud backup completed.' });
      } else {
        saveAppState(state);
        setSyncFeedback({ kind: 'info', text: 'Saved on this device. Sign in to sync across devices.' });
      }
    } catch (err) {
      saveAppState(state);
      setSyncFeedback({ kind: 'error', text: 'Cloud sync did not finish. Your data is saved on this device; try again when the connection is available.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    downloadBackupFile(state);
    setSyncFeedback({ kind: 'success', text: 'JSON backup downloaded. Keep the file somewhere private.' });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        const imported = normalizeAppState(parsed);
        if (imported && onUpdateAppState) {
          const confirmed = window.confirm(
            'Restore this backup and replace the study data currently open in the app? Export a backup first if you want to keep both copies.'
          );
          if (!confirmed) return;
          onUpdateAppState(() => imported);
          setSyncFeedback({ kind: 'success', text: 'Study data restored from the backup file.' });
        } else {
          setSyncFeedback({ kind: 'error', text: 'This backup file does not match the expected study-data format.' });
        }
      } catch (err) {
        setSyncFeedback({ kind: 'error', text: 'Could not read this JSON backup file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Count active synced items
  const errorCount = state.errorNotebook?.length || 0;
  const gtCount = state.grandTests?.length || 0;
  const dailyTasksCount = state.dailyTasks?.length || 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-150"
      style={{
        paddingTop: 'max(0.75rem, calc(0.5rem + env(safe-area-inset-top, 0px)))',
        paddingBottom: 'max(1rem, calc(0.75rem + env(safe-area-inset-bottom, 0px)))'
      }}
    >
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full shadow-[0_24px_64px_rgba(0,0,0,0.14)] border border-slate-200/80 overflow-hidden max-h-[calc(100dvh-max(2.5rem,calc(1.5rem+env(safe-area-inset-top,0px)+env(safe-area-inset-bottom,0px))))] sm:max-h-[90vh] flex flex-col before:absolute before:inset-0 before:bg-gradient-to-tr before:from-sky-500/[0.03] before:via-white/0 before:to-indigo-500/[0.02] before:pointer-events-none animate-in zoom-in-95 duration-150">
        
        {/* Specular Top Shimmer Edge */}
        <div
          className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* ── Header ── */}
        <div className="p-5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shadow-sky-500/25 shrink-0 ring-2 ring-white">
              <Cloud className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Study data &amp; backups
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cloud sync and local recovery options
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close Cloud Sync"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-5 sm:p-6 pb-8 sm:pb-6 space-y-5 overflow-y-auto flex-1 bg-white/50">
          {/* Status Banner — Apple Inset Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                  Storage status: {syncStatusLabel}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  displaySyncStatus === 'synced' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                  displaySyncStatus === 'syncing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  displaySyncStatus === 'offline' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  displaySyncStatus === 'error' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {displaySyncStatus === 'local' ? 'Local only' : displaySyncStatus === 'offline' ? 'No connection' : displaySyncStatus === 'error' ? 'Not synced' : displaySyncStatus === 'syncing' ? 'Syncing' : 'Up to date'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {displaySyncStatus === 'local'
                  ? 'Progress is saved on this device.'
                  : displaySyncStatus === 'offline'
                  ? 'Changes stay on this device until a connection is available.'
                  : <>Last manual sync: <span className="font-semibold text-slate-700">{lastSyncTime}</span></>}
              </p>
            </div>

            <button
              type="button"
              onClick={handleForceSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.98] shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : canSyncToCloud ? 'Sync Now' : 'Save on Device'}</span>
            </button>
          </div>

          {syncFeedback && (
            <div role={syncFeedback.kind === 'error' ? 'alert' : 'status'} aria-live={syncFeedback.kind === 'error' ? 'assertive' : 'polite'} className={`p-3 rounded-2xl border text-xs flex items-center gap-2 animate-in fade-in ${
              syncFeedback.kind === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
              syncFeedback.kind === 'info' ? 'bg-slate-50 border-slate-200 text-slate-700' :
              'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="font-semibold">{syncFeedback.text}</span>
            </div>
          )}

          {/* Sync Telemetry Metrics — 4 Apple Bento Cards */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-0.5">
              Study data summary
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold text-slate-600">Curriculum</span>
                  <HardDrive className="h-4 w-4 text-teal-600" />
                </div>
                <div className="text-sm font-bold text-slate-900">19 subjects</div>
                <p className="text-[10px] text-slate-400">Available for study tracking</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold text-slate-600">Error Vault</span>
                  <Activity className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-sm font-bold text-slate-900">{errorCount} Mistakes</div>
                <p className="text-[10px] text-slate-400">Remediation records</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold text-slate-600">Grand Tests</span>
                  <ShieldCheck className="h-4 w-4 text-sky-500" />
                </div>
                <div className="text-sm font-bold text-slate-900">{gtCount} Mocks</div>
                <p className="text-[10px] text-slate-400">Saved mock results</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold text-slate-600">Daily Plan</span>
                  <Clock className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-sm font-bold text-slate-900">{dailyTasksCount} tasks</div>
                <p className="text-[10px] text-slate-400">Saved in your study plan</p>
              </div>
            </div>
          </div>

          {/* Local recovery snapshots */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-0.5">
                Local Snapshots ({snapshots.length}/5)
              </span>
              <button
                type="button"
                onClick={handleCreateSnapshot}
                className="text-xs font-bold text-[#007AFF] hover:text-teal-700 cursor-pointer"
              >
                + Create Snapshot Now
              </button>
            </div>

            {snapshots.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No local snapshots yet. Create one to keep a recovery point in this browser.</p>
            ) : (
              <div className="space-y-2">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">{snap.label}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-mono">{new Date(snap.timestamp).toLocaleDateString()} {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{snap.totalGTs} GTs</span>
                        <span>•</span>
                        <span>{snap.totalErrors} Errors</span>
                        <span>•</span>
                        <span className="font-semibold text-teal-700">{snap.readinessScore}% Ready</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestoreSnapshot(snap)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-teal-800 font-bold text-[11px] shadow-2xs transition-colors cursor-pointer shrink-0"
                      title="Restore app state to this snapshot"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Offline Data Export & Import */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-0.5">
              Portable Data Controls
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>JSON Backup</span>
              </button>

              <label className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs">
                <Upload className="h-4 w-4 text-slate-500" />
                <span>Restore File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="p-4 bg-slate-50/80 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 shrink-0"
          style={{ paddingBottom: 'max(0.875rem, calc(0.625rem + env(safe-area-inset-bottom, 0px)))' }}
        >
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${!canSyncToCloud ? 'bg-slate-400' : displaySyncStatus === 'synced' ? 'bg-emerald-500' : displaySyncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : displaySyncStatus === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`} />
            <span className="min-w-0 truncate">
              {!canSyncToCloud
                ? 'Local-only mode · sign in to enable cloud sync'
                : displaySyncStatus === 'synced'
                ? 'Cloud sync is up to date'
                : displaySyncStatus === 'syncing'
                ? 'Cloud sync in progress'
                : displaySyncStatus === 'offline'
                ? 'Changes will sync when you are back online'
                : 'Cloud sync needs attention'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
