import React, { useState } from 'react';
import { useFocus } from '../context/FocusContext';
import { TREE_SPECIES } from '../constants/trees';
import { CATEGORIES } from '../constants/trees';
import { TreeSelectorModal } from './TreeSelectorModal';
import { CategorySelectorModal } from './CategorySelectorModal';

export const FocusView: React.FC = () => {
  const {
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    giveUpTimer,
    completeTimer,
    setCustomTime,
    user,
    toggleAmbientSound,
    currentSoundType,
  } = useFocus();

  const [showTreeModal, setShowTreeModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInput, setCustomInput] = useState('25');

  const selectedTree = TREE_SPECIES.find(t => t.id === timer.selectedTreeId) || TREE_SPECIES[0];
  const selectedCat = CATEGORIES.find(c => c.name === timer.selectedCategory) || CATEGORIES[0];

  // Time format helper (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate SVG stroke dashoffset
  const progressPercent = timer.totalTime > 0 ? (timer.totalTime - timer.timeRemaining) / timer.totalTime : 0;
  const strokeDashoffset = 1000 - progressPercent * 1000;

  // Sprout growth icon based on percentage complete
  const getGrowthIcon = () => {
    if (progressPercent < 0.25) return 'spa'; // Seedling sprout
    if (progressPercent < 0.5) return 'eco'; // Young plant
    if (progressPercent < 0.8) return 'nature'; // Growing tree
    return selectedTree.icon; // Full tree
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-between h-full py-1 space-y-2 sm:space-y-3">
      {/* Greeting Section */}
      <section className="w-full text-center flex flex-col items-center gap-1 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#b1ebba]/30 dark:bg-[#2f6b4f]/30 rounded-full border border-outline-variant/30 shadow-2xs">
          <span className="material-symbols-outlined text-[#346942] dark:text-[#96d4b2] text-sm font-bold">eco</span>
          <span className="text-[#346942] dark:text-[#96d4b2] font-semibold text-xs md:text-sm">
            今日已种下 {timer.sessionsCompletedToday} 棵树 • 连续 {user.streakDays} 天
          </span>
        </div>
      </section>

      {/* Hero Unified Timer Dial */}
      <div className="relative flex items-center justify-center my-1">
        <div className="absolute inset-0 bg-[#b1f0cd]/25 dark:bg-[#2f6b4f]/20 blur-[45px] rounded-full animate-pulse" />

        <div className="relative flex items-center justify-center">
          <svg className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 transform -rotate-90">
            <circle
              className="text-[#c0c9c1]/30 dark:text-zinc-700"
              cx="50%"
              cy="50%"
              r="44%"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
            />
            <circle
              className="text-[#125238] dark:text-[#96d4b2] transition-all duration-1000 ease-linear"
              cx="50%"
              cy="50%"
              r="44%"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray="1000"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center select-none p-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#FFFEF8] dark:bg-zinc-800 rounded-full shadow-md flex items-center justify-center border-2 border-white/80 dark:border-zinc-700 mb-1 transition-all duration-500">
              <span
                className="material-symbols-outlined fill-1 text-2xl sm:text-3xl"
                style={{ color: selectedTree.color }}
              >
                {getGrowthIcon()}
              </span>
            </div>

            <span className="font-bold text-4xl sm:text-5xl md:text-6xl text-[#26332C] dark:text-zinc-100 tracking-tighter font-mono my-0.5">
              {formatTime(timer.timeRemaining)}
            </span>

            <span className="text-[11px] font-bold text-[#768078] dark:text-zinc-400 bg-[#f6f4eb]/80 dark:bg-zinc-800/80 px-2.5 py-0.5 rounded-md mt-0.5 tracking-widest uppercase">
              {timer.status === 'running' ? '专注成长中...' : timer.status === 'paused' ? '已暂停' : '准备就绪'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Selection Presets (Only if idle) */}
      {timer.status === 'idle' && (
        <div className="flex gap-2 justify-center items-center my-0.5">
          {[15, 25, 45, 60].map(mins => (
            <button
              key={mins}
              onClick={() => setCustomTime(mins)}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs ${
                timer.totalTime === mins * 60
                  ? 'bg-[#b1ebba] text-[#00210c] dark:bg-[#2f6b4f] dark:text-white scale-105 border border-[#125238]'
                  : 'bg-[#FFFEF8] dark:bg-zinc-800 border border-outline-variant/30 text-[#404943] dark:text-zinc-300 hover:bg-[#f0eee5]'
              }`}
            >
              {mins}m
            </button>
          ))}
          <button
            onClick={() => setShowCustomModal(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FFFEF8] dark:bg-zinc-800 border border-outline-variant/30 text-[#404943] dark:text-zinc-300 hover:bg-[#f0eee5]"
            title="自定义时长"
          >
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
        </div>
      )}

      {/* Badges & Actions Container */}
      <div className="w-full max-w-sm flex flex-col items-center gap-2 pt-1">
        {/* Badges Row */}
        <div className="flex items-center justify-center gap-2 w-full">
          <button
            onClick={() => setShowCatModal(true)}
            className="flex-1 py-1.5 px-3 rounded-xl bg-[#FFFEF8] dark:bg-zinc-800 border border-outline-variant/30 hover:border-[#125238] transition-all shadow-2xs flex items-center justify-center gap-1.5 text-xs font-bold text-[#26332C] dark:text-zinc-200"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCat.color }} />
            <span>{selectedCat.name}</span>
            <span className="material-symbols-outlined text-sm text-[#768078]">expand_more</span>
          </button>

          <button
            onClick={() => setShowTreeModal(true)}
            className="flex-1 py-1.5 px-3 rounded-xl bg-[#FFFEF8] dark:bg-zinc-800 border border-outline-variant/30 hover:border-[#125238] transition-all shadow-2xs flex items-center justify-center gap-1.5 text-xs font-bold text-[#26332C] dark:text-zinc-200"
          >
            <span className="material-symbols-outlined text-base" style={{ color: selectedTree.color }}>
              {selectedTree.icon}
            </span>
            <span>{selectedTree.name}</span>
            <span className="material-symbols-outlined text-sm text-[#768078]">expand_more</span>
          </button>
        </div>

        {/* Action Buttons */}
        {timer.status === 'idle' && (
          <button
            onClick={startTimer}
            className="w-full py-3 sm:py-3.5 bg-[#125238] dark:bg-[#2f6b4f] hover:bg-[#125238]/90 text-white rounded-2xl font-bold text-base shadow-lg shadow-[#125238]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">play_arrow</span>
            开始专注
          </button>
        )}

        {timer.status === 'running' && (
          <div className="flex gap-2 w-full">
            <button
              onClick={pauseTimer}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">pause</span>
              暂停
            </button>
            <button
              onClick={completeTimer}
              className="flex-1 py-3 bg-[#346942] hover:bg-[#346942]/90 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              完成
            </button>
          </div>
        )}

        {timer.status === 'paused' && (
          <div className="flex gap-2 w-full">
            <button
              onClick={resumeTimer}
              className="flex-1 py-3 bg-[#125238] hover:bg-[#125238]/90 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              继续
            </button>
            <button
              onClick={giveUpTimer}
              className="flex-1 py-3 bg-[#ba1a1a] hover:bg-[#ba1a1a]/90 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
              放弃
            </button>
          </div>
        )}

        {/* Ambient Sound Bar Toolbar */}
        <div className="w-full flex items-center justify-between gap-1 bg-[#FFFEF8] dark:bg-zinc-800 p-1 px-3 rounded-full border border-outline-variant/20 shadow-2xs">
          {[
            { id: 'rain', label: '雨林', icon: 'rainy' },
            { id: 'wind', label: '微风', icon: 'air' },
            { id: 'creek', label: '小溪', icon: 'water_drop' },
            { id: 'birds', label: '鸟鸣', icon: 'forest' },
            { id: 'fire', label: '篝火', icon: 'local_fire_department' },
          ].map(snd => (
            <button
              key={snd.id}
              onClick={() => toggleAmbientSound(snd.id as any)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${
                currentSoundType === snd.id
                  ? 'bg-[#125238] text-white font-bold shadow-2xs'
                  : 'text-[#404943] dark:text-zinc-300 hover:bg-[#f0eee5] dark:hover:bg-zinc-700'
              }`}
            >
              <span className="material-symbols-outlined text-xs">{snd.icon}</span>
              {snd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <TreeSelectorModal isOpen={showTreeModal} onClose={() => setShowTreeModal(false)} />
      <CategorySelectorModal isOpen={showCatModal} onClose={() => setShowCatModal(false)} />

      {/* Custom Duration Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#FFFEF8] dark:bg-zinc-900 rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-outline-variant/20">
            <h3 className="text-lg font-bold text-[#125238] dark:text-[#96d4b2] mb-3">设置专注时长 (分钟)</h3>
            <input
              type="number"
              min="1"
              max="180"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              className="w-full text-center text-3xl font-bold p-3 border rounded-2xl bg-white dark:bg-zinc-800 text-[#125238] dark:text-[#96d4b2] mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-[#768078]"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const num = parseInt(customInput, 10);
                  if (!isNaN(num) && num > 0) {
                    setCustomTime(num);
                    setShowCustomModal(false);
                  }
                }}
                className="flex-1 py-2.5 bg-[#125238] text-white rounded-xl text-xs font-bold"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
