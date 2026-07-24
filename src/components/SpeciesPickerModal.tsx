import React from 'react';
import { TreeSpeciesId } from '../types';
import { TREE_SPECIES } from '../constants/trees';

interface SpeciesPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpeciesId: TreeSpeciesId;
  onSelectSpecies: (speciesId: TreeSpeciesId) => void;
  currentDurationMinutes: number;
}

export const SpeciesPickerModal: React.FC<SpeciesPickerModalProps> = ({
  isOpen,
  onClose,
  selectedSpeciesId,
  onSelectSpecies,
  currentDurationMinutes,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-surface)] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-[var(--border)]/30 max-h-[85vh] my-auto flex flex-col relative animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#125238] text-2xl">park</span>
            <h3 className="font-extrabold text-lg sm:text-xl text-[var(--text-main)]">树种选择</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] mb-3 shrink-0">
          选择想要培育的树种，悬停或点击卡片可查看详细寓意与建议专注时长。
        </p>

        {/* 2-column Grid with padding to prevent border clipping */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 -m-1.5 mb-3">
          <div className="grid grid-cols-2 gap-3">
            {TREE_SPECIES.map((species) => {
              const isSelected = selectedSpeciesId === species.id;
              const isUnlocked = currentDurationMinutes >= species.minDuration;

              return (
                <div
                  key={species.id}
                  onClick={() => {
                    onSelectSpecies(species.id);
                    onClose();
                  }}
                  className={`group relative p-3.5 rounded-2xl cursor-pointer border-2 transition-all duration-150 flex flex-col items-center text-center select-none ${
                    species.bgClass || 'bg-white'
                  } ${
                    isSelected
                      ? 'border-[#125238] bg-[#125238]/5 ring-1 ring-[#125238]/30 shadow-xs'
                      : 'border-[var(--border)]/35 hover:border-[#125238]/50 hover:shadow-xs'
                  }`}
                >
                  {/* Selected Indicator or Rare Badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {species.isRare && (
                      <span className="material-symbols-outlined text-amber-500 text-sm fill-1" title="稀有品种">
                        star
                      </span>
                    )}
                    {isSelected && (
                      <div className="w-4.5 h-4.5 bg-[#125238] text-white rounded-full flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                      </div>
                    )}
                  </div>

                  {/* Tree Icon Container */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-105 shadow-xs"
                    style={{ backgroundColor: `${species.color}18` }}
                  >
                    <span
                      className="material-symbols-outlined text-3xl fill-1 transition-transform"
                      style={{ color: species.color }}
                    >
                      {species.icon}
                    </span>
                  </div>

                  {/* Name */}
                  <h4 className="font-extrabold text-xs sm:text-sm text-[var(--text-main)] mb-1">{species.name}</h4>

                  {/* Duration Badge */}
                  <div
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isUnlocked
                        ? 'bg-[#125238]/10 text-[#125238]'
                        : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[11px]">schedule</span>
                    <span>最少 {species.minDuration} 分钟</span>
                  </div>

                  {/* Hover Description Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2.5 bg-[#26332C] text-white rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 border border-white/10 text-center">
                    <p className="text-[11px] font-bold text-[#b1ebba] mb-0.5">{species.name}</p>
                    <p className="text-[10px] leading-tight text-white/90">{species.description}</p>
                    {!isUnlocked && (
                      <p className="text-[10px] text-amber-300 font-semibold mt-1">
                        ⚠️ 建议至少专注 {species.minDuration} 分钟
                      </p>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#26332C]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 sm:py-3 bg-[#125238] text-white rounded-2xl font-bold text-sm hover:bg-[#125238]/90 active:scale-98 transition-all shrink-0 cursor-pointer shadow-md shadow-[#125238]/20"
        >
          确定
        </button>
      </div>
    </div>
  );
};

