import React from 'react';
import { UserSettings } from '../types';
import { audioSynth } from '../services/audioSynthesizer';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onExportCSV: () => void;
  onResetData: () => void;
  onOpenAmbientModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportCSV,
  onResetData,
  onOpenAmbientModal,
}) => {
  const updateField = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);

    if (key === 'ambientSound' || key === 'ambientVolume') {
      audioSynth.setVolume(updated.ambientVolume);
    }
  };

  const ambientLabels: Record<string, string> = {
    none: '无',
    rainforest: '雨林',
    breeze: '微风山丘',
    stream: '静谧小溪',
    birds: '晨鸟鸣叫',
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-12">
      <header className="mb-8">
        <h2 className="font-bold text-3xl text-[var(--text-main)]">设置</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">培育你的专注体验，定制你的数字避风港。</p>
      </header>

      {/* Focus Settings */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[#125238]">eco</span>
          <h3 className="font-bold text-lg text-[var(--text-main)]">专注设置</h3>
        </div>
        <div className="bg-[var(--bg-surface)] rounded-2xl shadow-xs border border-[#125238]/5 p-6 space-y-6">
          {/* Timer Length */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-sm text-[var(--text-main)]">专注时长</p>
              <p className="text-xs text-[var(--text-muted)]">标准深度专注时长</p>
            </div>
            <div className="flex items-center gap-3 bg-[var(--bg-surface2)] rounded-xl p-1 border border-[var(--border)]/30">
              <button
                onClick={() => updateField('focusDuration', Math.max(5, settings.focusDuration - 5))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#b1f0cd]/40 text-[#125238] font-bold"
              >
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="font-bold text-sm w-10 text-center">{settings.focusDuration}m</span>
              <button
                onClick={() => updateField('focusDuration', Math.min(180, settings.focusDuration + 5))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#b1f0cd]/40 text-[#125238] font-bold"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>

          {/* Break Length */}
          <div className="flex justify-between items-center border-t border-[var(--border)]/20 pt-6">
            <div>
              <p className="font-bold text-sm text-[var(--text-main)]">短休息时长</p>
              <p className="text-xs text-[var(--text-muted)]">专注任务之间的间隔</p>
            </div>
            <div className="flex items-center gap-3 bg-[var(--bg-surface2)] rounded-xl p-1 border border-[var(--border)]/30">
              <button
                onClick={() => updateField('breakDuration', Math.max(1, settings.breakDuration - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#b1f0cd]/40 text-[#125238] font-bold"
              >
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="font-bold text-sm w-10 text-center">{settings.breakDuration}m</span>
              <button
                onClick={() => updateField('breakDuration', Math.min(30, settings.breakDuration + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#b1f0cd]/40 text-[#125238] font-bold"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>

          {/* Toggle: Auto-start Break */}
          <div className="flex justify-between items-center border-t border-[var(--border)]/20 pt-6">
            <div>
              <p className="font-bold text-sm text-[var(--text-main)]">自动开始休息</p>
              <p className="text-xs text-[var(--text-muted)]">专注结束后自动开始休息</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStartBreak}
                onChange={(e) => updateField('autoStartBreak', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#c0c9c1]/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--bg-surface)] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#125238]"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Personalization */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[#125238]">palette</span>
          <h3 className="font-bold text-lg text-[var(--text-main)]">个性化</h3>
        </div>
        <div className="bg-[var(--bg-surface)] rounded-2xl shadow-xs border border-[#125238]/5 p-6 space-y-6">
          {/* Theme Selector */}
          <div>
            <p className="font-bold text-sm text-[var(--text-main)] mb-3">主题设置</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => updateField('theme', 'light')}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                  settings.theme === 'light'
                    ? 'border-[#125238] bg-[#b1f0cd]/20 text-[#125238] font-bold shadow-xs'
                    : 'border-[var(--border)]/30 text-[var(--text-muted)] hover:border-[#125238]/30'
                }`}
              >
                <span className="material-symbols-outlined">light_mode</span>
                <span className="text-xs">浅色</span>
              </button>

              <button
                onClick={() => updateField('theme', 'dark')}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                  settings.theme === 'dark'
                    ? 'border-[#125238] bg-[#b1f0cd]/20 text-[#125238] font-bold shadow-xs'
                    : 'border-[var(--border)]/30 text-[var(--text-muted)] hover:border-[#125238]/30'
                }`}
              >
                <span className="material-symbols-outlined">dark_mode</span>
                <span className="text-xs">深色</span>
              </button>

              <button
                onClick={() => updateField('theme', 'system')}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                  settings.theme === 'system'
                    ? 'border-[#125238] bg-[#b1f0cd]/20 text-[#125238] font-bold shadow-xs'
                    : 'border-[var(--border)]/30 text-[var(--text-muted)] hover:border-[#125238]/30'
                }`}
              >
                <span className="material-symbols-outlined">settings_brightness</span>
                <span className="text-xs">跟随系统</span>
              </button>
            </div>
          </div>

          {/* Ambient Sound */}
          <div className="border-t border-[var(--border)]/20 pt-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-bold text-sm text-[var(--text-main)]">环境音</p>
                <p className="text-xs text-[var(--text-muted)]">大自然的声音景观</p>
              </div>
              <button
                onClick={onOpenAmbientModal}
                className="font-bold text-xs text-[#125238] bg-[#b1f0cd]/30 px-3 py-1.5 rounded-full hover:bg-[#b1f0cd]/60 transition-colors"
              >
                {ambientLabels[settings.ambientSound] || '雨林'}
              </button>
            </div>
          </div>

          {/* Animation Intensity Slider */}
          <div className="border-t border-[var(--border)]/20 pt-6">
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-sm text-[var(--text-main)]">动画强度</p>
              <span className="text-xs text-[#125238] font-bold">
                {settings.animationIntensity === 'none' ? '无' : settings.animationIntensity === 'reduced' ? '减弱' : '自然'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={settings.animationIntensity === 'none' ? 0 : settings.animationIntensity === 'reduced' ? 1 : 2}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                const mapped = val === 0 ? 'none' : val === 1 ? 'reduced' : 'natural';
                updateField('animationIntensity', mapped);
              }}
              className="w-full mb-2"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
              <span>无</span>
              <span>减弱</span>
              <span>自然</span>
            </div>
          </div>

          {/* Toggle: Sound Notifications */}
          <div className="flex justify-between items-center border-t border-[var(--border)]/20 pt-6">
            <div>
              <p className="font-bold text-sm text-[var(--text-main)]">声音提醒</p>
              <p className="text-xs text-[var(--text-muted)]">开启任务状态的声音警报</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundNotifications}
                onChange={(e) => updateField('soundNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#c0c9c1]/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--bg-surface)] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#125238]"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[#125238]">database</span>
          <h3 className="font-bold text-lg text-[var(--text-main)]">数据管理</h3>
        </div>
        <div className="bg-[var(--bg-surface)] rounded-2xl shadow-xs border border-[#125238]/5 p-6 space-y-6">
          <button
            onClick={onExportCSV}
            className="w-full flex justify-between items-center text-left group cursor-pointer"
          >
            <div>
              <p className="font-bold text-sm text-[var(--text-main)] group-hover:text-[#125238] transition-colors">
                导出专注数据
              </p>
              <p className="text-xs text-[var(--text-muted)]">以 CSV 格式下载你的专注历程</p>
            </div>
            <span className="material-symbols-outlined text-[var(--text-muted)] group-hover:text-[#125238] group-hover:translate-x-1 transition-all">
              chevron_right
            </span>
          </button>

          <button
            onClick={() => {
              if (confirm('确定要清空所有已种植树木的本地数据吗？此操作不可撤销！')) {
                onResetData();
              }
            }}
            className="w-full flex justify-between items-center text-left group border-t border-[var(--border)]/20 pt-6 cursor-pointer"
          >
            <div>
              <p className="font-bold text-sm text-[#ba1a1a]">重置所有数据</p>
              <p className="text-xs text-[var(--text-muted)]">清空本地所有历史森林与习惯记录</p>
            </div>
            <span className="material-symbols-outlined text-[#ba1a1a]">delete</span>
          </button>
        </div>
      </section>
    </div>
  );
};
