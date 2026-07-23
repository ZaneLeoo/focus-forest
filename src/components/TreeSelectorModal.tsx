import React from 'react';
import { useFocus } from '../context/FocusContext';
import { TREE_SPECIES } from '../constants/trees';
import { TreeSpeciesId } from '../types';

interface TreeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TreeSelectorModal: React.FC<TreeSelectorModalProps> = ({ isOpen, onClose }) => {
  const { timer, setSelectedTree, user } = useFocus();

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FFFEF8] dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-outline-variant/20 relative max-h-[85vh] my-auto flex flex-col animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center mb-3 shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#125238] dark:text-[#96d4b2]">选择树种</h3>
            <p className="text-xs text-[#768078] dark:text-zinc-400">培育不同的树木，丰富你的数字生态森林</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#768078] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 -m-1.5 mb-3">
          <div className="grid grid-cols-2 gap-3">
            {TREE_SPECIES.map((tree) => {
              const isSelected = timer.selectedTreeId === tree.id;
              const isUnlocked = user.level >= tree.minLevelRequired;

              return (
                <button
                  key={tree.id}
                  disabled={!isUnlocked}
                  onClick={() => {
                    if (isUnlocked) {
                      setSelectedTree(tree.id as TreeSpeciesId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? 'border-[#125238] bg-[#b1f0cd]/20 dark:bg-[#2f6b4f]/40 shadow-xs'
                      : isUnlocked
                      ? 'border-outline-variant/20 hover:border-[#125238]/40 bg-[#f6f4eb] dark:bg-zinc-800'
                      : 'border-dashed border-outline-variant/30 opacity-60 bg-gray-100 dark:bg-zinc-850 cursor-not-allowed'
                  }`}
                >
                  {tree.rarity !== 'common' && (
                    <span className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {tree.rarity === 'rare' ? '稀有' : '传说'}
                    </span>
                  )}

                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0"
                      style={{ backgroundColor: tree.color + '20', color: tree.color }}
                    >
                      <span className="material-symbols-outlined text-2xl">{tree.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-[#26332C] dark:text-zinc-100 truncate">{tree.name}</h4>
                      <span className="text-[10px] text-[#768078] dark:text-zinc-400 block">
                        {isUnlocked ? '已解锁' : `需要 LVL ${tree.minLevelRequired}`}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#768078] dark:text-zinc-400 line-clamp-2 leading-tight">
                    {tree.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 sm:py-3 bg-[#125238] text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
        >
          确定
        </button>
      </div>
    </div>
  );
};
