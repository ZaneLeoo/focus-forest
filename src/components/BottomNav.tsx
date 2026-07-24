import React from 'react';
import { ViewMode } from '../types';

interface BottomNavProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
}

export const BottomNav: React.FC<BottomNavProps> = React.memo(({ currentView, onSelectView }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#FFFEF8]/90 backdrop-blur-lg border-t border-[#c0c9c1]/20 rounded-t-2xl shadow-[0_-4px_20px_rgba(47,107,79,0.08)]">
      <button
        onClick={() => onSelectView('timer')}
        className={`flex flex-col items-center justify-center transition-all ${
          currentView === 'timer'
            ? 'bg-[#2f6b4f] text-white rounded-full px-5 py-1 scale-95 shadow-sm font-bold'
            : 'text-[#768078] hover:text-[#125238] active:scale-90'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'timer' ? 'fill-1' : ''}`}>timer</span>
        <span className="text-[11px] font-medium">专注</span>
      </button>

      <button
        onClick={() => onSelectView('forest')}
        className={`flex flex-col items-center justify-center transition-all ${
          currentView === 'forest'
            ? 'bg-[#2f6b4f] text-white rounded-full px-5 py-1 scale-95 shadow-sm font-bold'
            : 'text-[#768078] hover:text-[#125238] active:scale-90'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'forest' ? 'fill-1' : ''}`}>forest</span>
        <span className="text-[11px] font-medium">森林</span>
      </button>

      <button
        onClick={() => onSelectView('stats')}
        className={`flex flex-col items-center justify-center transition-all ${
          currentView === 'stats'
            ? 'bg-[#2f6b4f] text-white rounded-full px-5 py-1 scale-95 shadow-sm font-bold'
            : 'text-[#768078] hover:text-[#125238] active:scale-90'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'stats' ? 'fill-1' : ''}`}>bar_chart</span>
        <span className="text-[11px] font-medium">统计</span>
      </button>

      <button
        onClick={() => onSelectView('ranking')}
        className={`flex flex-col items-center justify-center transition-all ${
          currentView === 'ranking'
            ? 'bg-[#2f6b4f] text-white rounded-full px-5 py-1 scale-95 shadow-sm font-bold'
            : 'text-[#768078] hover:text-[#125238] active:scale-90'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'ranking' ? 'fill-1' : ''}`}>leaderboard</span>
        <span className="text-[11px] font-medium">排行</span>
      </button>

      <button
        onClick={() => onSelectView('settings')}
        className={`flex flex-col items-center justify-center transition-all ${
          currentView === 'settings'
            ? 'bg-[#2f6b4f] text-white rounded-full px-5 py-1 scale-95 shadow-sm font-bold'
            : 'text-[#768078] hover:text-[#125238] active:scale-90'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'settings' ? 'fill-1' : ''}`}>settings</span>
        <span className="text-[11px] font-medium">设置</span>
      </button>
    </nav>
  );
});
