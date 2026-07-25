import React, { useState, useRef } from 'react';
import { ViewMode } from '../types';
import { generateShareCard, downloadShareCard } from '../utils/shareCard';
import { updateAvatarRemote } from '../services/api';

const AVATARS = ['🌵', '🪴', '🌿', '🍀', '🌻', '🌸', '🌺', '🐱', '🐶', '🐕', '🐈', '🐩', '🐾', '🦊', '🐰', '🐼'];

interface GardenerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar: string;
  totalTreesCount: number;
  totalMinutes: number;
  streakDays: number;
  onSelectView: (view: ViewMode) => void;
  onChangeAvatar: (avatar: string) => void;
  onLogout: () => void;
}

export const GardenerProfileModal: React.FC<GardenerProfileModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  totalTreesCount,
  totalMinutes,
  streakDays,
  onSelectView,
  onChangeAvatar,
  onLogout,
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'emoji' | 'upload'>('emoji');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomImage = userAvatar.startsWith('data:');

  if (!isOpen) return null;

  const handleSelectAvatar = (avatar: string) => {
    onChangeAvatar(avatar);
    updateAvatarRemote(avatar).catch(() => {});
    setShowAvatarPicker(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      onChangeAvatar(base64);
      updateAvatarRemote(base64).catch(() => {});
      setShowAvatarPicker(false);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleShare = async () => {
    const canvas = await generateShareCard({
      userName,
      userAvatar,
      level: Math.floor(totalTreesCount / 5) + 1,
      totalTrees: totalTreesCount,
      totalMinutes,
      streakDays,
    });
    downloadShareCard(canvas);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-surface)] rounded-3xl p-6 max-w-xs sm:max-w-sm w-full shadow-2xl border border-[var(--border)]/30 max-h-[90vh] overflow-y-auto flex flex-col my-auto relative animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="font-bold text-lg text-[#125238] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#125238]">badge</span>
            园丁名片
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center py-2 shrink-0">
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="w-20 h-20 rounded-full bg-[#b1ebba] flex items-center justify-center border-2 border-[#125238]/30 shadow-md mb-3 hover:scale-105 active:scale-95 transition-all cursor-pointer relative group overflow-hidden"
            title="点击更换头像"
          >
            {isCustomImage ? (
              <img src={userAvatar} alt="头像" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">{userAvatar}</span>
            )}
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm">edit</span>
            </div>
          </button>
          <h4 className="font-extrabold text-xl text-[var(--text-main)]">{userName}</h4>
        </div>

        {/* Avatar picker */}
        {showAvatarPicker && (
          <div className="mt-3 mb-2 p-3 bg-[var(--bg-surface2)] rounded-2xl border border-[var(--border)]/20 animate-in fade-in zoom-in-95 duration-150">
            {/* Tabs */}
            <div className="flex p-0.5 bg-[var(--bg-surface)] rounded-lg mb-3 border border-[var(--border)]/20">
              <button
                onClick={() => setAvatarTab('emoji')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                  avatarTab === 'emoji' ? 'bg-[#125238] text-white' : 'text-[var(--text-muted)]'
                }`}
              >
                😊 Emoji
              </button>
              <button
                onClick={() => setAvatarTab('upload')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                  avatarTab === 'upload' ? 'bg-[#125238] text-white' : 'text-[var(--text-muted)]'
                }`}
              >
                📷 上传
              </button>
            </div>

            {avatarTab === 'emoji' ? (
              <>
                <p className="text-[11px] font-bold text-[var(--text-muted)] text-center mb-2">选择表情头像</p>
                <div className="grid grid-cols-8 gap-1.5">
                  {AVATARS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleSelectAvatar(emoji)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all cursor-pointer ${
                        userAvatar === emoji
                          ? 'bg-[#b1ebba]/60 ring-2 ring-[#125238] scale-110'
                          : 'bg-[var(--bg-surface)] hover:bg-[#e4e2d7]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-3">
                <p className="text-[11px] font-bold text-[var(--text-muted)] mb-3">上传自定义头像</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-3 bg-[#125238] text-white rounded-xl font-bold text-xs hover:opacity-90 active:scale-98 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">upload</span>
                  选择图片
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-2">自动裁剪为正方形 · 最大 200KB</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 my-4">
          <div className="p-3 bg-[var(--bg-surface2)] rounded-2xl text-center border border-[var(--border)]/20">
            <p className="text-xs text-[var(--text-muted)] font-medium">累计种树</p>
            <p className="text-xl font-extrabold text-[#125238] mt-1">{totalTreesCount} 棵</p>
          </div>
          <div className="p-3 bg-[var(--bg-surface2)] rounded-2xl text-center border border-[var(--border)]/20">
            <p className="text-xs text-[var(--text-muted)] font-medium">园丁等级</p>
            <p className="text-xl font-extrabold text-[#125238] mt-1">Lv.{Math.floor(totalTreesCount / 5) + 1}</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-4 p-3 rounded-2xl bg-[var(--bg-surface2)] border border-[var(--border)]/20">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-[var(--text-muted)]">升级进度</span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {(() => {
                const level = Math.floor(totalTreesCount / 5) + 1;
                const inLevel = totalTreesCount - (level - 1) * 5;
                const toNext = Math.max(0, level * 5 - totalTreesCount);
                return toNext > 0 ? `再种 ${toNext} 棵升 Lv.${level + 1}` : '已满级！';
              })()}
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--border)]/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#125238] rounded-full transition-all duration-500"
              style={{ width: `${(totalTreesCount % 5) / 5 * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-[var(--text-muted)]">Lv.{Math.floor(totalTreesCount / 5) + 1}</span>
            <span className="text-[9px] text-[var(--text-muted)]">Lv.{Math.floor(totalTreesCount / 5) + 2}</span>
          </div>
        </div>

        <div className="space-y-2 mt-auto shrink-0">
          <button
            onClick={handleShare}
            className="w-full py-2.5 bg-[#b1ebba]/40 text-[#125238] rounded-xl font-bold text-xs hover:bg-[#b1ebba] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">share</span>
            分享森林卡片
          </button>
          <button
            onClick={() => {
              onClose();
              onSelectView('stats');
            }}
            className="w-full py-2.5 bg-[#125238] text-white rounded-xl font-bold text-xs hover:opacity-90 active:scale-98 transition-all cursor-pointer"
          >
            查看完整专注统计
          </button>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2 bg-[var(--bg-surface2)] text-[#ba1a1a] rounded-xl font-bold text-xs hover:bg-[#ba1a1a]/10 active:scale-98 transition-all cursor-pointer"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
};
