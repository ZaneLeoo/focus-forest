import React from 'react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  treesCount: number;
  level?: number;
  onUnlockSpeciesClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  currentView,
  onSelectView,
  treesCount,
  level = Math.floor(treesCount / 5) + 1,
  onUnlockSpeciesClick,
}) => {
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full z-40 bg-[var(--bg-surface)] w-64 rounded-r-2xl shadow-xl shadow-[#125238]/5 pt-24 pb-8 px-4 border-r border-[var(--border)]/20">
      <div className="mb-8 px-4">
        <h2 className="text-[#125238] font-bold text-2xl tracking-tight">园丁</h2>
      </div>

      <nav className="space-y-2">
        <button
          onClick={() => onSelectView('timer')}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
            currentView === 'timer'
              ? 'bg-[#b1ebba] text-[#376c45] font-bold shadow-xs translate-x-1'
              : 'text-[var(--text-dim)] hover:bg-[#e4e3da]/50'
          }`}
        >
          <span className={`material-symbols-outlined ${currentView === 'timer' ? 'fill-1' : ''}`}>timer</span>
          <span>专注</span>
        </button>

        <button
          onClick={() => onSelectView('forest')}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
            currentView === 'forest'
              ? 'bg-[#b1ebba] text-[#376c45] font-bold shadow-xs translate-x-1'
              : 'text-[var(--text-dim)] hover:bg-[#e4e3da]/50'
          }`}
        >
          <span className={`material-symbols-outlined ${currentView === 'forest' ? 'fill-1' : ''}`}>forest</span>
          <span>森林</span>
        </button>

        <button
          onClick={() => onSelectView('stats')}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
            currentView === 'stats'
              ? 'bg-[#b1ebba] text-[#376c45] font-bold shadow-xs translate-x-1'
              : 'text-[var(--text-dim)] hover:bg-[#e4e3da]/50'
          }`}
        >
          <span className={`material-symbols-outlined ${currentView === 'stats' ? 'fill-1' : ''}`}>bar_chart</span>
          <span>统计</span>
        </button>

        <button
          onClick={() => onSelectView('ranking')}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
            currentView === 'ranking'
              ? 'bg-[#b1ebba] text-[#376c45] font-bold shadow-xs translate-x-1'
              : 'text-[var(--text-dim)] hover:bg-[#e4e3da]/50'
          }`}
        >
          <span className={`material-symbols-outlined ${currentView === 'ranking' ? 'fill-1' : ''}`}>leaderboard</span>
          <span>排行</span>
        </button>

        <button
          onClick={() => onSelectView('settings')}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
            currentView === 'settings'
              ? 'bg-[#b1ebba] text-[#376c45] font-bold shadow-xs translate-x-1'
              : 'text-[var(--text-dim)] hover:bg-[#e4e3da]/50'
          }`}
        >
          <span className={`material-symbols-outlined ${currentView === 'settings' ? 'fill-1' : ''}`}>settings</span>
          <span>设置</span>
        </button>
      </nav>

      <div className="mt-auto p-4 bg-[#2f6b4f]/10 rounded-2xl border border-[#2f6b4f]/20">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[#125238] font-bold text-xs uppercase tracking-wider">优质种子包</p>

          <span className="material-symbols-outlined text-[#d97706] text-sm">workspace_premium</span>
        </div>
        <p className="text-[var(--text-muted)] text-xs mb-3 leading-relaxed">
          解锁珍稀樱花树与金黄银杏树。
        </p>
        <button
          onClick={() => {
            if (onUnlockSpeciesClick) onUnlockSpeciesClick();
            else onSelectView('timer');
          }}
          className="w-full bg-[#125238] text-white py-2 rounded-xl font-semibold text-xs hover:opacity-90 active:scale-98 transition-all shadow-sm"
        >
          探索树种
        </button>
      </div>
    </aside>
  );
});
