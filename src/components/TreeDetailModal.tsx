import React from 'react';
import { FocusSession, TreeSpeciesId } from '../types';
import { Tree3DCanvas } from './Tree3DCanvas';

interface TreeDetailModalProps {
  session: FocusSession | null;
  onClose: () => void;
  onDeleteSession?: (id: string) => void;
}

export const TreeDetailModal: React.FC<TreeDetailModalProps> = ({
  session,
  onClose,
  onDeleteSession,
}) => {
  if (!session) return null;

  const dateFormatted = new Date(session.createdAt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const speciesId: TreeSpeciesId = (session.treeId as TreeSpeciesId) || 'oak';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-surface)] rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-[var(--border)]/30 max-h-[85vh] my-auto flex flex-col relative animate-in zoom-in-95 duration-200 overflow-y-auto custom-scrollbar"
      >
        <div className="flex justify-between items-center mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#125238] text-2xl">eco</span>
            <h3 className="font-bold text-lg text-[var(--text-main)]">3D 树木档案</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tree 3D Interactive Card Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-[var(--bg-surface2)] rounded-2xl mb-5 relative overflow-hidden">
          {session.isRare && (
            <div className="absolute top-3 right-3 bg-[#ffdea5] text-[#261900] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
              <span className="material-symbols-outlined text-xs fill-1">star</span>
              稀有
            </div>
          )}

          <div className="w-40 h-40 flex items-center justify-center my-1">
            <Tree3DCanvas
              speciesId={speciesId}
              progress={session.completed ? 1.0 : 0.3}
              isCompleted={session.completed}
            />
          </div>

          <h4 className="font-bold text-xl text-[var(--text-main)] mt-1">{session.treeName}</h4>
          <span className="text-xs text-[var(--text-muted)] mt-0.5">
            {session.durationMinutes} 分钟 • {session.category}
          </span>
        </div>

        <div className="space-y-2.5 text-xs text-[#404943] mb-6">
          <div className="flex justify-between py-1.5 border-b border-[var(--border)]/20">
            <span className="text-[var(--text-muted)]">种植时间</span>
            <span className="font-semibold text-[var(--text-main)]">{dateFormatted}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--border)]/20">
            <span className="text-[var(--text-muted)]">专注分类</span>
            <span className="font-semibold text-[#125238] bg-[#b1ebba]/40 px-2 py-0.5 rounded-md">
              {session.category}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--border)]/20">
            <span className="text-[var(--text-muted)]">状态</span>
            <span className="font-semibold text-[#125238]">
              {session.completed ? '成功长成 🌱' : '已中止 🍂'}
            </span>
          </div>
          {session.note && (
            <div className="pt-2">
              <span className="text-[var(--text-muted)]">备注:</span>
              <p className="mt-1 p-2 bg-[var(--bg-surface2)] rounded-xl italic">{session.note}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {onDeleteSession && (
            <button
              onClick={() => {
                if (confirm('确定要从森林中移除这棵树吗？')) {
                  onDeleteSession(session.id);
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
