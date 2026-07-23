import React from 'react';
import { PlantedTree, TreeSpeciesId } from '../types';
import { Tree3DCanvas } from './Tree3DCanvas';

interface TreeDetailModalProps {
  tree: PlantedTree | null;
  onClose: () => void;
  onDeleteTree?: (id: string) => void;
}

export const TreeDetailModal: React.FC<TreeDetailModalProps> = ({
  tree,
  onClose,
  onDeleteTree,
}) => {
  if (!tree) return null;

  const dateFormatted = new Date(tree.timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const speciesId: TreeSpeciesId = (tree.speciesId as TreeSpeciesId) || 'oak';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FFFEF8] rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-[#c0c9c1]/30 max-h-[85vh] my-auto flex flex-col relative animate-in zoom-in-95 duration-200 overflow-y-auto custom-scrollbar"
      >
        <div className="flex justify-between items-center mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#125238] text-2xl">eco</span>
            <h3 className="font-bold text-lg text-[#26332C]">3D 树木档案</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#768078] hover:text-[#26332C] p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tree 3D Interactive Card Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#f0eee5] rounded-2xl mb-5 relative overflow-hidden">
          {tree.isRare && (
            <div className="absolute top-3 right-3 bg-[#ffdea5] text-[#261900] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
              <span className="material-symbols-outlined text-xs fill-1">star</span>
              稀有
            </div>
          )}

          <div className="w-40 h-40 flex items-center justify-center my-1">
            <Tree3DCanvas
              speciesId={speciesId}
              progress={tree.status === 'completed' ? 1.0 : 0.3}
              isCompleted={tree.status === 'completed'}
            />
          </div>

          <h4 className="font-bold text-xl text-[#26332C] mt-1">{tree.name}</h4>
          <span className="text-xs text-[#768078] mt-0.5">
            {tree.durationMinutes} 分钟 • {tree.category}
          </span>
        </div>

        <div className="space-y-2.5 text-xs text-[#404943] mb-6">
          <div className="flex justify-between py-1.5 border-b border-[#c0c9c1]/20">
            <span className="text-[#768078]">种植时间</span>
            <span className="font-semibold text-[#26332C]">{dateFormatted}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#c0c9c1]/20">
            <span className="text-[#768078]">专注分类</span>
            <span className="font-semibold text-[#125238] bg-[#b1ebba]/40 px-2 py-0.5 rounded-md">
              {tree.category}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#c0c9c1]/20">
            <span className="text-[#768078]">状态</span>
            <span className="font-semibold text-[#125238]">
              {tree.status === 'completed' ? '成功长成 🌱' : '已中止 🍂'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          {onDeleteTree && (
            <button
              onClick={() => {
                if (confirm('确定要从森林中移除这棵树吗？')) {
                  onDeleteTree(tree.id);
                  onClose();
                }
              }}
              className="flex-1 py-2.5 border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-xl font-bold text-xs hover:bg-[#ba1a1a]/10 transition-all flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              移除
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#125238] text-white rounded-xl font-bold text-xs hover:opacity-90 active:scale-98 transition-all"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
