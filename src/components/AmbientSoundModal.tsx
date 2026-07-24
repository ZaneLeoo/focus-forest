import React from 'react';
import { UserSettings } from '../types';
import { audioSynth } from '../services/audioSynthesizer';

interface AmbientSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export const AmbientSoundModal: React.FC<AmbientSoundModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const soundOptions = [
    { id: 'none', label: '无', icon: 'volume_off', desc: '保持安宁肃静' },
    { id: 'rainforest', label: '雨林', icon: 'rainy', desc: '滋润温暖的雨林滴落声' },
    { id: 'breeze', label: '微风山丘', icon: 'air', desc: '山谷微风拂过树叶的轻响' },
    { id: 'stream', label: '静谧小溪', icon: 'water', desc: '潺潺流动的舒缓溪水' },
    { id: 'birds', label: '晨鸟鸣叫', icon: 'nest_cam_indoor', desc: '清晨森林里的清脆鸟鸣' },
  ] as const;

  const handleSelectSound = (soundId: UserSettings['ambientSound']) => {
    const updated = { ...settings, ambientSound: soundId };
    onUpdateSettings(updated);
    audioSynth.playSound(soundId as any, settings.ambientVolume);
  };

  const handleVolumeChange = (vol: number) => {
    const updated = { ...settings, ambientVolume: vol };
    onUpdateSettings(updated);
    audioSynth.setVolume(vol);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-surface)] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-[var(--border)]/30 max-h-[85vh] my-auto flex flex-col relative animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#125238] text-2xl">graphic_eq</span>
            <h3 className="font-bold text-lg sm:text-xl text-[var(--text-main)]">环境音选择</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 -m-1.5 space-y-2.5 mb-3">
          {soundOptions.map((opt) => {
            const isSelected = settings.ambientSound === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => handleSelectSound(opt.id)}
                className={`p-3 sm:p-3.5 rounded-2xl cursor-pointer border-2 transition-all flex items-center gap-3.5 ${
                  isSelected
                    ? 'border-[#125238] bg-[#125238]/5 shadow-xs'
                    : 'border-[var(--border)]/25 hover:border-[#125238]/40 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#125238] text-white' : 'bg-[var(--bg-surface2)] text-[var(--text-muted)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl">{opt.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <p className={`font-bold text-xs sm:text-sm truncate ${isSelected ? 'text-[#125238]' : 'text-[var(--text-main)]'}`}>
                      {opt.label}
                    </p>
                    {isSelected && (
                      <span className="text-[10px] bg-[#125238] text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                        播放中
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{opt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {settings.ambientSound !== 'none' && (
          <div className="p-3 bg-[var(--bg-surface2)] rounded-2xl mb-3 shrink-0 border border-[var(--border)]/20">
            <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-[var(--text-main)]">
              <span>音量调节</span>
              <span>{Math.round(settings.ambientVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.ambientVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-[#125238] cursor-pointer"
            />
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 sm:py-3 bg-[#125238] text-white rounded-2xl font-bold text-sm hover:opacity-90 active:scale-98 transition-all shrink-0 cursor-pointer shadow-md shadow-[#125238]/20"
        >
          完成
        </button>
      </div>
    </div>
  );
};
