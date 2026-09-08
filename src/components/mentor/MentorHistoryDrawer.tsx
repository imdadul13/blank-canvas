import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { History, Plus, Search, MessageSquare, Trash2, X, Clock } from 'lucide-react';
import { CoachSession } from '../AiCoachView';

interface MentorHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSession: () => void;
  sessions: CoachSession[];
  filteredSessions: CoachSession[];
  activeSessionId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSession: (session: CoachSession) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onClearAllHistory: () => void;
  formatRelativeDate: (dateStr: string) => string;
}

export const MentorHistoryDrawer: React.FC<MentorHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onNewSession,
  sessions,
  filteredSessions,
  activeSessionId,
  searchQuery,
  onSearchChange,
  onSelectSession,
  onDeleteSession,
  onClearAllHistory,
  formatRelativeDate,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-xs">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col font-sans border-l border-slate-200 z-10"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-['Outfit'] text-slate-900">
                    Consultation History
                  </h2>
                  <p className="text-xs text-slate-500">
                    {sessions.length} saved session{sessions.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Actions: New Chat & Search */}
            <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/70">
              <button
                type="button"
                onClick={() => {
                  onNewSession();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#182329] hover:bg-[#0f171c] text-white text-xs font-bold font-['Outfit'] shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <Plus className="h-4 w-4" />
                <span>Start New Consultation</span>
              </button>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search past consultations or topics..."
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
              </div>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No matching consultations</p>
                  <p className="text-[11px] text-slate-400">Ask the Faculty Mentor a question to start your history</p>
                </div>
              ) : (
                filteredSessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const messageCount = (s.messages || []).length;
                  const firstUserMsg = s.messages?.find((m) => m.role === 'user');

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectSession(s);
                        onClose();
                      }}
                      className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-300 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-md bg-[#006B63] text-white text-[9px] font-bold font-mono">
                                ACTIVE
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatRelativeDate(s.updatedAt || s.createdAt)}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 font-['Outfit'] line-clamp-1 group-hover:text-slate-950">
                            {s.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {firstUserMsg?.content || 'Clinical consultation'}
                          </p>
                          <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400 font-mono">
                            <Clock className="h-3 w-3" />
                            <span>{messageCount} message{messageCount === 1 ? '' : 's'}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(s.id, e);
                          }}
                          className="opacity-70 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                          title="Delete consultation"
                          aria-label="Delete consultation"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer with Safe Clear Confirmation */}
            {sessions.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/90 text-xs shrink-0">
                {confirmClear ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2.5 animate-fadeIn">
                    <p className="text-xs font-bold text-rose-950 font-['Outfit']">
                      Permanently clear all {sessions.length} consultations?
                    </p>
                    <p className="text-[11px] text-rose-700">
                      This will reset saved consultation history from this workspace.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClearAllHistory();
                          setConfirmClear(false);
                          onClose();
                        }}
                        className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-['Outfit'] shadow-2xs transition-all cursor-pointer active:scale-95"
                      >
                        Yes, Clear All
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold font-['Outfit'] transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="min-h-[40px] text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Clear All History</span>
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {sessions.length} saved
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
