import React from 'react';
import { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  totalTreesCount: number;
  userName?: string;
  userAvatar?: string;
  onOpenProfileModal?: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  currentView,
  onSelectView,
  totalTreesCount,
  userName = '森林园丁',
  userAvatar = '🌳',
  onOpenProfileModal,
}) => {
  const gardenerLevel = Math.floor(totalTreesCount / 5) + 1;

  return (
    <header className="flex justify-between items-center px-4 md:px-12 py-3 w-full z-40 fixed top-0 bg-[var(--bg-page)]/90 backdrop-blur-md border-b border-[var(--border)]/20">
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => onSelectView('timer')}
      >
        <span className="material-symbols-outlined text-[#125238] text-3xl fill-1">park</span>
        <h1 className="font-bold text-xl md:text-2xl text-[#125238] tracking-tight">Focus Forest</h1>
      </div>

      {/* Desktop Quick Nav Links */}
      <div className="hidden md:flex gap-8 items-center">
        <button
          onClick={() => onSelectView('timer')}
          className={`font-semibold text-sm transition-colors ${
            currentView === 'timer' ? 'text-[#125238] font-bold border-b-2 border-[#125238] pb-0.5' : 'text-[var(--text-muted)] hover:text-[#125238]'
          }`}
        >
          专注
        </button>
        <button
          onClick={() => onSelectView('forest')}
          className={`font-semibold text-sm transition-colors ${
            currentView === 'forest' ? 'text-[#125238] font-bold border-b-2 border-[#125238] pb-0.5' : 'text-[var(--text-muted)] hover:text-[#125238]'
          }`}
        >
          森林
        </button>
        <button
          onClick={() => onSelectView('stats')}
          className={`font-semibold text-sm transition-colors ${
            currentView === 'stats' ? 'text-[#125238] font-bold border-b-2 border-[#125238] pb-0.5' : 'text-[var(--text-muted)] hover:text-[#125238]'
          }`}
        >
          统计
        </button>
        <button
          onClick={() => onSelectView('settings')}
          className={`font-semibold text-sm transition-colors ${
            currentView === 'settings' ? 'text-[#125238] font-bold border-b-2 border-[#125238] pb-0.5' : 'text-[var(--text-muted)] hover:text-[#125238]'
          }`}
        >
          设置
        </button>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Info Bar (to the left of avatar) */}
        <button
          onClick={() => onOpenProfileModal?.()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface2)] border border-[var(--border)]/30 hover:bg-[#e4e2d7] transition-all text-xs text-[var(--text-main)] font-semibold active:scale-95 cursor-pointer"
          title="查看园丁卡片"
        >
          <span className="material-symbols-outlined text-[#125238] text-base">eco</span>
          <span className="hidden sm:inline font-bold">{userName}</span>
        </button>

        {/* Avatar */}
        <div
          onClick={() => onOpenProfileModal?.()}
          className="w-9 h-9 rounded-full bg-[#b1ebba] flex items-center justify-center overflow-hidden border-2 border-white shadow-xs cursor-pointer hover:ring-2 hover:ring-[#125238]/30 transition-all shrink-0 text-lg"
        >
          {userAvatar}
        </div>
      </div>
    </header>
  );
});
