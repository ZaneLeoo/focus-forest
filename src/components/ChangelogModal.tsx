import React, { useState, useEffect } from 'react';

const CHANGELOG_VERSION = 'v2.0';
const STORAGE_KEY = 'focus_forest_changelog_seen';

export const ChangelogModal: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== CHANGELOG_VERSION) {
      // Delay slightly so the app renders first
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
        className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[var(--border)]/30 animate-in zoom-in-95 duration-300"
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
          <p className="text-xs text-[var(--text-muted)] mt-1">你的森林变得更强大了 🌳</p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-3 mb-6">
          {/* Feature 1: Dark Mode */}
          <div className="flex gap-4 p-4 rounded-2xl bg-[var(--bg-surface2)] border border-[var(--border)]/20">
            <div className="w-10 h-10 rounded-xl bg-[var(--green-brand)]/15 flex items-center justify-center shrink-0 text-xl">
              🌙
            </div>
            <div>
              <p className="font-bold text-sm text-[var(--text-main)]">深色主题</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                深夜专注不再刺眼。进入设置 → 个性化，一键切换到深邃护眼的暗色模式，让森林在月光下陪伴你。
              </p>
            </div>
          </div>

          {/* Feature 2: Ranking */}
          <div className="flex gap-4 p-4 rounded-2xl bg-[var(--bg-surface2)] border border-[var(--border)]/20">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0 text-xl">
              🏆
            </div>
            <div>
              <p className="font-bold text-sm text-[var(--text-main)]">专注排行榜</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                看看谁是森林里最勤奋的园丁！按总时长或种树数排名，点击冠军还能撒花庆祝 🎉
              </p>
            </div>
          </div>

          {/* Feature 3: Browser Notification */}
          <div className="flex gap-4 p-4 rounded-2xl bg-[var(--bg-surface2)] border border-[var(--border)]/20">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center shrink-0 text-xl">
              🔔
            </div>
            <div>
              <p className="font-bold text-sm text-[var(--text-main)]">专注完成提醒</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                切到其他窗口也不用担心错过。专注时间到了会弹出浏览器通知，告诉你又种下了一棵树。
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={dismiss}
          className="w-full py-3.5 bg-[var(--green-brand)] text-white rounded-2xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-black/10"
        >
          开始探索
        </button>

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-3">
          感谢你的每一次专注 🌱
        </p>
      </div>
    </div>
  );
};
