import React, { useState, useEffect } from 'react';

const CHANGELOG_VERSION = 'v2.1';
const STORAGE_KEY = 'focus_forest_changelog_seen';

export const ChangelogModal: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== CHANGELOG_VERSION) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, CHANGELOG_VERSION);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[var(--border)]/30 animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[var(--green-brand)]/10 text-[var(--green-brand)] px-3 py-1 rounded-full text-xs font-bold mb-3 border border-[var(--green-brand)]/20">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            新版本发布
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-main)]">
            Focus Forest
            <span className="text-[var(--green-brand)] ml-2">{CHANGELOG_VERSION}</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">新树种来啦，你的森林更茂盛了 🌲</p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-3 mb-6">
          {/* Feature 1: New Trees */}
          <div className="flex gap-4 p-4 rounded-2xl bg-[var(--bg-surface2)] border border-[var(--border)]/20">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/15 flex items-center justify-center shrink-0 text-xl">
              🎋
            </div>
            <div>
              <p className="font-bold text-sm text-[var(--text-main)]">全新树种</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                新增<strong>翠竹</strong>与<strong>黄金神木</strong>两个稀有树种！翠竹虚怀若谷，黄金神木散发金色光辉。进入树种选择即可解锁 🌟
              </p>
            </div>
          </div>

          {/* Feature 2: Species Lock */}
          <div className="flex gap-4 p-4 rounded-2xl bg-[var(--bg-surface2)] border border-[var(--border)]/20">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0 text-xl">
              🔒
            </div>
            <div>
              <p className="font-bold text-sm text-[var(--text-main)]">树种解锁机制</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                稀有树种需要达到最低专注时长才能培育！树种按建议时长排序，一目了然。不满足条件时点击会抖动提醒，请先调高专注时长再试。
              </p>
            </div>
          </div>

          {/* Feature 3: Audio Fix */}
          <div className="flex gap-4 p-4 rounded-2xl bg-[var(--bg-surface2)] border border-[var(--border)]/20">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center shrink-0 text-xl">
              🎵
            </div>
            <div>
              <p className="font-bold text-sm text-[var(--text-main)]">环境音体验优化</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                修复了环境音引擎切换混乱的问题，现在雨林、微风、溪流、鸟鸣四种音效稳定流畅，设置即生效 ✨
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={dismiss}
          className="w-full py-3.5 bg-[var(--green-brand)] text-white rounded-2xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-black/10"
        >
          去看看新树种
        </button>

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-3">
          感谢你的每一次专注 🌱
        </p>
      </div>
    </div>
  );
};
