import React from 'react';
import { useFocus } from '../context/FocusContext';
import { CATEGORIES } from '../constants/trees';
import { CategoryTag } from '../types';

interface CategorySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategorySelectorModal: React.FC<CategorySelectorModalProps> = ({ isOpen, onClose }) => {
  const { timer, setSelectedCategory } = useFocus();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#FFFEF8] dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant/20 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#125238] dark:text-[#96d4b2]">选择专注分类</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#768078] hover:text-black dark:hover:text-white"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {CATEGORIES.map(cat => {
            const isSelected = timer.selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name as CategoryTag);
                  onClose();
                }}
                className={`p-3 rounded-2xl flex items-center gap-3 transition-all border ${
                  isSelected
                    ? 'border-[#125238] bg-[#b1f0cd]/30 dark:bg-[#2f6b4f]/40 font-bold scale-[1.02]'
                    : 'border-outline-variant/20 hover:border-[#125238]/30 bg-[#f6f4eb] dark:bg-zinc-800'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                </div>
                <span className="text-xs text-[#26332C] dark:text-zinc-100 font-semibold">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
