import React, { useState } from 'react';
import { ViewMode } from '../types';

const AVATARS = ['🌵', '🪴', '🌿', '🍀', '🌻', '🌸', '🌺', '🐱', '🐶', '🐕', '🐈', '🐩', '🐾', '🦊', '🐰', '🐼'];

interface GardenerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar: string;
  totalTreesCount: number;
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
  onSelectView,
  onChangeAvatar,
  onLogout,
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  if (!isOpen) return null;

  const handleSelectAvatar = (avatar: string) => {
    onChangeAvatar(avatar);
    setShowAvatarPicker(false);
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
            className="w-20 h-20 rounded-full bg-[#b1ebba] flex items-center justify-center text-4xl border-2 border-[#125238]/30 shadow-md mb-3 hover:scale-105 active:scale-95 transition-all cursor-pointer relative group"
            title="点击更换头像"
          >
            {userAvatar}
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm">edit</span>
            </div>
          </button>
          <h4 className="font-extrabold text-xl text-[var(--text-main)]">{userName}</h4>
        </div>

        {/* Avatar picker */}
        {showAvatarPicker && (
          <div className="mt-3 mb-2 p-3 bg-[var(--bg-surface2)] rounded-2xl border border-[var(--border)]/20 animate-in fade-in zoom-in-95 duration-150">
            <p className="text-[11px] font-bold text-[var(--text-muted)] text-center mb-2">选择头像</p>
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
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 my-4">
          <div className="p-3 bg-[var(--bg-surface2)] rounded-2xl text-center border border-[var(--border)]/20">
            <p className="text-xs text-[var(--text-muted)] font-medium">累计完成树木</p>
            <p className="text-xl font-extrabold text-[#125238] mt-1">{totalTreesCount} 棵</p>
          </div>
          <div className="p-3 bg-[var(--bg-surface2)] rounded-2xl text-center border border-[var(--border)]/20">
            <p className="text-xs text-[var(--text-muted)] font-medium">生态头衔</p>
            <p className="text-sm font-extrabold text-[#346942] mt-1">绿色守护者</p>
          </div>
        </div>

        <div className="space-y-2 mt-auto shrink-0">
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
