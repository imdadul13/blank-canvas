import React, { useState } from 'react';
import { History, Search, MessageSquare, Trash2 } from 'lucide-react';
import { CoachSession } from '../AiCoachView';

interface MentorHistorySidebarProps {
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

export const MentorHistorySidebar: React.FC<MentorHistorySidebarProps> = ({
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

  return (
    <aside className="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3 sticky top-4 max-h-[calc(100vh-80px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">Chat History</h3>
            <p className="text-[11px] text-slate-400 font-sans">
              {sessions.length} consultation{sessions.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search chats..."
          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all font-sans"
        />
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-[220px]">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 space-y-1.5">
            <MessageSquare className="h-6 w-6 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No chats found</p>
            <p className="text-[10px] text-slate-400">Ask a question to save it here</p>
          </div>
        ) : (
          filteredSessions.map((s) => {
            const isActive = s.id === activeSessionId;

            return (
              <div
                key={s.id}
                onClick={() => onSelectSession(s)}
                className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#ebf5fb] border-sky-200 ring-1 ring-sky-200 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          isActive ? 'bg-[#006B63]' : 'bg-slate-800'
                        }`}
                      />
                      <h4 className="text-xs font-bold text-slate-900 font-['Outfit'] truncate group-hover:text-slate-950">
                        {s.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans pl-4">
                      {formatRelativeDate(s.updatedAt || s.createdAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id, e);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer shrink-0"
                    title="Delete chat"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Clear History */}
      {sessions.length > 0 && (
        <div className="pt-2 border-t border-slate-100 shrink-0">
          {confirmClear ? (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2 animate-fadeIn">
              <p className="text-[11px] font-bold text-rose-950 font-['Outfit']">
                Clear all {sessions.length} consultation chats?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllHistory();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold font-['Outfit'] transition-all cursor-pointer shadow-2xs"
                >
                  Yes, Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold font-['Outfit'] transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="w-full text-[11px] font-medium text-slate-400 hover:text-rose-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer py-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
