import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { PlantedTree, TreeSpeciesId, UserSettings } from '../types';
import { TREE_SPECIES, CATEGORIES } from '../constants/trees';
import { audioSynth } from '../services/audioSynthesizer';
import { Tree3DCanvas } from './Tree3DCanvas';

interface FocusTimerProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onTreeCompleted: (tree: Omit<PlantedTree, 'id' | 'plantedAt' | 'timestamp'>) => void;
  todayTreesCount: number;
  onOpenAmbientModal: () => void;
  onOpenSpeciesModal: () => void;
  selectedSpeciesId: TreeSpeciesId;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  settings,
  onTreeCompleted,
  todayTreesCount,
  onOpenAmbientModal,
  onOpenSpeciesModal,
  selectedSpeciesId,
}) => {
  const [targetMinutes, setTargetMinutes] = useState<number>(settings.focusDuration);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(settings.focusDuration * 60);
  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'paused' | 'break'>('idle');
  const [selectedCategory, setSelectedCategory] = useState<string>('工作');
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [customInputMinutes, setCustomInputMinutes] = useState(25);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [is3DMode, setIs3DMode] = useState(true);

  // Precise timer refs: use wall-clock diff instead of setInterval decrement
  const startTimeRef = useRef<number>(Date.now());
  const totalSecondsRef = useRef<number>(settings.focusDuration * 60);
  const timerStatusRef = useRef<'idle' | 'running' | 'paused' | 'break'>('idle');
  const timerModeRef = useRef<'focus' | 'break'>('focus');

  // Restore saved timer state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('focus_forest_timer_state');
      if (!saved) return;
      const state = JSON.parse(saved);
      if (!state || state.status === 'idle') return;

      setTargetMinutes(state.targetMinutes || settings.focusDuration);
      setSelectedCategory(state.category || '工作');
      if (state.speciesId) {
        // selectedSpeciesId is controlled by parent, can't set here - but we save for reference
      }

      const now = Date.now();
      if (state.status === 'running' || state.status === 'break') {
        const elapsed = (now - state.startTime) / 1000;
        const remaining = Math.max(0, state.totalSeconds - elapsed);
        if (remaining <= 0) {
          // Timer would have finished while away - just go idle
          setTimerStatus('idle');
          setRemainingSeconds(state.targetMinutes * 60);
          localStorage.removeItem('focus_forest_timer_state');
          return;
        }
        startTimeRef.current = state.startTime;
        totalSecondsRef.current = state.totalSeconds;
        timerModeRef.current = state.mode || 'focus';
        setTimerStatus(state.status);
        setRemainingSeconds(Math.ceil(remaining));
      } else if (state.status === 'paused') {
        totalSecondsRef.current = state.totalSeconds;
        timerModeRef.current = state.mode || 'focus';
        setTimerStatus('paused');
        setRemainingSeconds(Math.ceil(state.totalSeconds));
      }
    } catch { /* ignore corrupt saved state */ }
  }, []);

  // Persist timer state whenever relevant values change
  useEffect(() => {
    if (timerStatus === 'idle') {
      localStorage.removeItem('focus_forest_timer_state');
      return;
    }
    localStorage.setItem('focus_forest_timer_state', JSON.stringify({
      status: timerStatus,
      mode: timerModeRef.current,
      startTime: startTimeRef.current,
      totalSeconds: totalSecondsRef.current,
      targetMinutes,
      category: selectedCategory,
      speciesId: selectedSpeciesId,
    }));
  }, [timerStatus, targetMinutes, selectedCategory, selectedSpeciesId]);

  const activeSpecies = TREE_SPECIES.find(s => s.id === selectedSpeciesId) || TREE_SPECIES[0];
  const selectedCatObj = CATEGORIES.find(c => c.name === selectedCategory) || CATEGORIES[0];

  // Calculate tree growth progress (0.0 to 1.0)
  const growthProgress =
    timerStatus === 'idle'
      ? 1.0
      : Math.max(0.05, Math.min(1.0, (targetMinutes * 60 - remainingSeconds) / (targetMinutes * 60)));

  // Sync default duration when settings change while idle
  useEffect(() => {
    if (timerStatus === 'idle') {
      setTargetMinutes(settings.focusDuration);
      setRemainingSeconds(settings.focusDuration * 60);
    }
  }, [settings.focusDuration, timerStatus]);

  // Keep timerStatusRef in sync
  useEffect(() => {
    timerStatusRef.current = timerStatus;
  }, [timerStatus]);

  // Precise timer loop using requestAnimationFrame + wall clock
  useEffect(() => {
    if (timerStatus !== 'running' && timerStatus !== 'break') return;

    let rafId: number;
    let lastDisplaySec = -1;

    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, totalSecondsRef.current - elapsed);
      const displaySec = Math.ceil(remaining);

      if (displaySec !== lastDisplaySec) {
        lastDisplaySec = displaySec;
        setRemainingSeconds(displaySec);
      }

      if (remaining <= 0) {
        setRemainingSeconds(0);
        return; // completion handled by the effect below
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [timerStatus]);

  // Detect timer completion
  useEffect(() => {
    if (remainingSeconds === 0 && (timerStatus === 'running' || timerStatus === 'break')) {
      const statusAtComplete = timerStatusRef.current;

      if (statusAtComplete === 'running') {
        audioSynth.playChime();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        onTreeCompleted({
          speciesId: activeSpecies.id,
          name: activeSpecies.name,
          icon: activeSpecies.icon,
          color: activeSpecies.color,
          durationMinutes: targetMinutes,
          category: selectedCategory,
          isRare: activeSpecies.isRare,
          status: 'completed',
        });

        if (settings.autoStartBreak) {
          startTimeRef.current = Date.now();
          totalSecondsRef.current = settings.breakDuration * 60;
          timerModeRef.current = 'break';
          setTimerStatus('break');
          setRemainingSeconds(settings.breakDuration * 60);
        } else {
          localStorage.removeItem('focus_forest_timer_state');
          setTimerStatus('idle');
          setRemainingSeconds(targetMinutes * 60);
        }
      } else if (statusAtComplete === 'break') {
        audioSynth.playChime();
        localStorage.removeItem('focus_forest_timer_state');
        setTimerStatus('idle');
        setRemainingSeconds(targetMinutes * 60);
      }
    }
  }, [remainingSeconds, timerStatus]);

  const startFocus = () => {
    startTimeRef.current = Date.now();
    totalSecondsRef.current = targetMinutes * 60;
    timerModeRef.current = 'focus';
    setRemainingSeconds(targetMinutes * 60);
    setTimerStatus('running');
    if (settings.ambientSound !== 'none') {
      audioSynth.playSound(settings.ambientSound, settings.ambientVolume);
    }
  };

  const pauseTimer = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    totalSecondsRef.current = Math.max(0, totalSecondsRef.current - elapsed);
    setTimerStatus('paused');
  };

  const resumeTimer = () => {
    startTimeRef.current = Date.now();
    setTimerStatus('running');
    if (settings.ambientSound !== 'none') {
      audioSynth.playSound(settings.ambientSound, settings.ambientVolume);
    }
  };

  const giveUpTimer = () => {
    setShowGiveUpModal(true);
  };

  const finishEarly = () => {
    audioSynth.stopSound();
    localStorage.removeItem('focus_forest_timer_state');
    const actualMinutes = targetMinutes - Math.ceil(remainingSeconds / 60);
    if (actualMinutes >= 1) {
      audioSynth.playChime();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      onTreeCompleted({
        speciesId: activeSpecies.id,
        name: activeSpecies.name,
        icon: activeSpecies.icon,
        color: activeSpecies.color,
        durationMinutes: actualMinutes,
        category: selectedCategory,
        isRare: activeSpecies.isRare,
        status: 'completed',
      });
    }
    setTimerStatus('idle');
    setRemainingSeconds(targetMinutes * 60);
  };

  const confirmGiveUp = () => {
    audioSynth.stopSound();
    localStorage.removeItem('focus_forest_timer_state');
    setTimerStatus('idle');
    setRemainingSeconds(targetMinutes * 60);
    setShowGiveUpModal(false);
  };

  const setPresetMinutes = (mins: number) => {
    if (timerStatus !== 'idle') return;
    setTargetMinutes(mins);
    setRemainingSeconds(mins * 60);
  };

  const applyCustomMinutes = () => {
    if (customInputMinutes > 0 && customInputMinutes <= 180) {
      setPresetMinutes(customInputMinutes);
      setShowCustomTimeModal(false);
    }
  };

  // Greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早安，园丁';
    if (hour < 18) return '午安，园丁';
    return '晚安，园丁';
  };

  // Formatted timer text
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Timer ring stroke calculation (exact SVG radius = 120, circumference = 2 * PI * 120 ≈ 753.98)
  const RING_RADIUS = 120;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const totalSeconds = (timerStatus === 'break' ? settings.breakDuration : targetMinutes) * 60;
  const progressRatio = totalSeconds > 0 ? Math.max(0, Math.min(1, (totalSeconds - remainingSeconds) / totalSeconds)) : 0;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progressRatio);

  // Tree growth scale icon & size calculation
  let treeIcon = activeSpecies.icon;
  let treeSize = 'text-[80px]';
  if (timerStatus === 'running' || timerStatus === 'paused') {
    if (progressRatio < 0.25) {
      treeIcon = 'spa'; // Sprout
      treeSize = 'text-[50px]';
    } else if (progressRatio < 0.6) {
      treeIcon = 'eco'; // Sapling
      treeSize = 'text-[65px]';
    } else {
      treeIcon = activeSpecies.icon;
      treeSize = 'text-[85px]';
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center py-1 space-y-2 sm:space-y-3">
      {/* Greeting Header */}
      <section className="w-full text-center flex flex-col items-center gap-1 pt-2 sm:pt-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#b1ebba]/30 rounded-full border border-[#2f6b4f]/20 shadow-2xs">
          <span className="material-symbols-outlined text-[#346942] fill-1 text-base">eco</span>
          <span className="text-[#346942] font-semibold text-xs md:text-sm">
            今日已种下 {todayTreesCount} 棵树
          </span>
        </div>
      </section>

      {/* Hero Unified Timer Dial */}
      <div className="relative flex items-center justify-center my-1">
        {/* 3D / 2D View Switcher Badge — only when idle */}
        {timerStatus === 'idle' && (
        <button
          onClick={() => setIs3DMode(!is3DMode)}
          className="absolute -top-2 -right-2 z-20 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFFEF8]/90 backdrop-blur-2xs border border-[#c0c9c1]/40 text-[#125238] hover:bg-white active:scale-95 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
          title="切换 3D/2D 模式"
        >
          <span className="material-symbols-outlined text-sm">{is3DMode ? '3d_rotation' : 'forest'}</span>
          <span>{is3DMode ? '3D 树木' : '2D 极简'}</span>
        </button>
        )}

        {/* Animated Glow Halo */}
        <div className="absolute inset-0 bg-[#b1f0cd]/25 blur-[45px] rounded-full organic-float"></div>

        {/* SVG Progress Ring */}
        <div className="relative flex items-center justify-center">
          <svg
            className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-80 transform -rotate-90"
            viewBox="0 0 280 280"
          >
            <circle
              className="text-[#c0c9c1]/25"
              cx="140"
              cy="140"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
            />
            <circle
              className="text-[#125238] transition-all duration-300 ease-linear"
              cx="140"
              cy="140"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="8"
            />
          </svg>

          {/* Dial Interior Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none p-4">
            {is3DMode ? (
              /* 3D Tree Canvas Mode */
              <div className="flex flex-col items-center justify-center w-full h-full relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 flex items-center justify-center">
                  <Tree3DCanvas
                    speciesId={selectedSpeciesId}
                    progress={growthProgress}
                    isCompleted={timerStatus === 'idle' ? false : remainingSeconds === 0}
                  />
                </div>
                {/* Countdown Display overlaid below tree */}
                <span className="font-bold text-xl sm:text-2xl md:text-3xl text-[#26332C] tracking-tighter font-mono bg-[#FFFEF8]/95 backdrop-blur-2xs px-3 py-0.5 rounded-xl shadow-2xs border border-[#c0c9c1]/30 z-10 -mt-1">
                  {timerText}
                </span>
              </div>
            ) : (
              /* 2D Minimal Icon Mode */
              <>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#FFFEF8] rounded-full shadow-md flex items-center justify-center border-2 border-white/80 mb-1 transition-all duration-500 transform hover:scale-110">
                  <span
                    className="material-symbols-outlined fill-1 text-2xl sm:text-3xl transition-all duration-300"
                    style={{ color: activeSpecies.color }}
                  >
                    {treeIcon}
                  </span>
                </div>

                <span className="font-bold text-3xl sm:text-4xl md:text-5xl text-[#26332C] tracking-tighter font-mono my-0.5">
                  {timerText}
                </span>
              </>
            )}

            {/* Mode / Status Tag */}
            <span className="text-[11px] text-[#768078] tracking-widest uppercase font-bold bg-[#f6f4eb] px-2.5 py-0.5 rounded-full mt-1 border border-[#c0c9c1]/20">
              {timerStatus === 'break' ? '休息时间' : timerStatus === 'running' ? '深度专注中' : '剩余时间'}
            </span>
          </div>
        </div>
      </div>
      {timerStatus === 'idle' && (
        <div className="w-full max-w-sm bg-[#FFFEF8]/90 backdrop-blur-xs p-3 sm:p-4 rounded-3xl border border-[#c0c9c1]/30 shadow-xs flex flex-col gap-2 sm:gap-3">
          {/* Quick Setting Triggers Row (Category, Tree Species, Ambient Sound) */}
          <div className="grid grid-cols-3 gap-2">
            {/* Category Trigger */}
            <button
              onClick={() => setShowCategoryModal(true)}
              className="py-2 px-2.5 rounded-xl bg-white border border-[#c0c9c1]/30 hover:border-[#125238]/40 active:scale-95 transition-all shadow-2xs flex items-center justify-between text-xs text-[#26332C]"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-sm text-[#125238] shrink-0">
                  {selectedCatObj.icon}
                </span>
                <span className="font-bold truncate text-xs">{selectedCatObj.name}</span>
              </div>
              <span className="material-symbols-outlined text-xs text-[#768078] shrink-0">expand_more</span>
            </button>

            {/* Tree Species Trigger */}
            <button
              onClick={onOpenSpeciesModal}
              className="py-2 px-2.5 rounded-xl bg-white border border-[#c0c9c1]/30 hover:border-[#125238]/40 active:scale-95 transition-all shadow-2xs flex items-center justify-between text-xs text-[#26332C]"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined fill-1 text-sm shrink-0" style={{ color: activeSpecies.color }}>
                  {activeSpecies.icon}
                </span>
                <span className="font-bold truncate text-xs">{activeSpecies.name}</span>
              </div>
              <span className="material-symbols-outlined text-xs text-[#768078] shrink-0">expand_more</span>
            </button>

            {/* Ambient Sound Trigger */}
            <button
              onClick={onOpenAmbientModal}
              className="py-2 px-2.5 rounded-xl bg-white border border-[#c0c9c1]/30 hover:border-[#125238]/40 active:scale-95 transition-all shadow-2xs flex items-center justify-between text-xs text-[#26332C]"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-sm text-[#125238] shrink-0">
                  {settings.ambientSound === 'none' ? 'volume_off' : 'rainy'}
                </span>
                <span className="font-bold truncate text-xs">
                  {settings.ambientSound === 'none' ? '环境音' : '播放中'}
                </span>
              </div>
              <span className="material-symbols-outlined text-xs text-[#768078] shrink-0">expand_more</span>
            </button>
          </div>

          {/* Segmented Preset Time Controller */}
          <div className="bg-[#f0eee5] p-1 rounded-2xl flex items-center justify-between border border-[#c0c9c1]/20">
            {[15, 25, 45, 60].map(mins => (
              <button
                key={mins}
                onClick={() => setPresetMinutes(mins)}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  targetMinutes === mins
                    ? 'bg-white text-[#125238] shadow-2xs scale-[1.02]'
                    : 'text-[#505a53] hover:text-[#125238]'
                }`}
              >
                {mins}m
              </button>
            ))}
            <button
              onClick={() => {
                setCustomInputMinutes(targetMinutes);
                setShowCustomTimeModal(true);
              }}
              className="w-8 h-7 flex items-center justify-center rounded-xl text-[#505a53] hover:text-[#125238] hover:bg-white/50 active:scale-95 transition-all"
              title="自定义"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={startFocus}
            className="w-full py-3.5 bg-[#125238] text-white rounded-2xl font-bold text-base shadow-lg shadow-[#125238]/20 hover:bg-[#125238]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined fill-1 text-xl">play_arrow</span>
            开始专注
          </button>
        </div>
      )}

      {/* Action Buttons for Running / Paused / Break States */}
      {timerStatus !== 'idle' && (
        <div className="w-full max-w-sm flex flex-col items-center gap-2 pt-1">
          {timerStatus === 'running' && (
            <div className="w-full flex gap-3">
              <button
                onClick={pauseTimer}
                className="flex-1 py-3 bg-[#2f6b4f] text-[#ffffff] rounded-2xl font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">pause</span>
                暂停
              </button>
              <button
                onClick={finishEarly}
                className="flex-1 py-3 bg-[#346942] text-white rounded-2xl font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">check</span>
                提前结束
              </button>
              <button
                onClick={giveUpTimer}
                className="py-3 px-4 bg-[#FFFEF8] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-2xl font-bold text-sm hover:bg-[#ba1a1a]/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">stop</span>
                开摆
              </button>
            </div>
          )}

          {timerStatus === 'paused' && (
            <div className="w-full flex gap-3">
              <button
                onClick={resumeTimer}
                className="flex-1 py-3 bg-[#125238] text-white rounded-2xl font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined fill-1 text-lg">play_arrow</span>
                继续
              </button>
              <button
                onClick={finishEarly}
                className="flex-1 py-3 bg-[#346942] text-white rounded-2xl font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">check</span>
                提前结束
              </button>
              <button
                onClick={giveUpTimer}
                className="py-3 px-4 bg-[#FFFEF8] border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-2xl font-bold text-sm hover:bg-[#ba1a1a]/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">stop</span>
                开摆
              </button>
            </div>
          )}

          {timerStatus === 'break' && (
            <button
              onClick={() => {
                localStorage.removeItem('focus_forest_timer_state');
                setTimerStatus('idle');
                setRemainingSeconds(targetMinutes * 60);
              }}
              className="w-full py-3 bg-[#346942] text-white rounded-2xl font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              结束休息
            </button>
          )}
        </div>
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFEF8] rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-[#c0c9c1]/30 relative">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-[#125238]">选择专注分类</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-[#768078] hover:text-black transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setShowCategoryModal(false);
                    }}
                    className={`p-2.5 rounded-2xl flex items-center gap-2 transition-all border ${
                      isSelected
                        ? 'border-[#125238] bg-[#b1ebba]/40 font-bold scale-[1.02] text-[#125238]'
                        : 'border-[#c0c9c1]/30 hover:border-[#125238]/30 bg-[#f6f4eb] text-[#26332C]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base" style={{ color: cat.color }}>
                      {cat.icon}
                    </span>
                    <span className="text-xs font-semibold">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Custom Duration Modal */}
      {showCustomTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-[#FFFEF8] rounded-2xl p-6 max-w-xs w-full shadow-2xl border border-[#c0c9c1]/30">
            <h3 className="font-bold text-lg text-[#26332C] mb-3">设置专注时长 (分钟)</h3>
            <input
              type="number"
              min="1"
              max="180"
              value={customInputMinutes}
              onChange={(e) => setCustomInputMinutes(parseInt(e.target.value) || 1)}
              className="w-full py-3 px-4 rounded-xl bg-[#f0eee5] border border-[#c0c9c1]/40 text-center font-bold text-xl mb-4 focus:ring-2 focus:ring-[#125238]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomTimeModal(false)}
                className="flex-1 py-2.5 bg-[#f0eee5] text-[#404943] rounded-xl font-bold text-xs"
              >
                取消
              </button>
              <button
                onClick={applyCustomMinutes}
                className="flex-1 py-2.5 bg-[#125238] text-white rounded-xl font-bold text-xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Give Up Confirmation Modal */}
      {showGiveUpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#FFFEF8] rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-[#c0c9c1]/30 max-h-[85vh] my-auto flex flex-col text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#ba1a1a]/10 flex items-center justify-center text-[#ba1a1a] mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="font-bold text-lg text-[#26332C] mb-1">确认开摆？</h3>
            <p className="text-xs text-[#768078] mb-5 leading-relaxed">
              开摆后当前的树木种植将中断，此阶段的专注成果将无法保存。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGiveUpModal(false)}
                className="flex-1 py-2.5 bg-[#f0eee5] text-[#26332C] rounded-xl font-bold text-xs hover:bg-[#e4e2d7] transition-colors cursor-pointer"
              >
                继续专注
              </button>
              <button
                onClick={confirmGiveUp}
                className="flex-1 py-2.5 bg-[#ba1a1a] text-white rounded-xl font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-[#ba1a1a]/20"
              >
                确认开摆
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
