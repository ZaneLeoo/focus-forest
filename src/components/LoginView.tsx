import React, { useState } from 'react';
import { register, login as apiLogin } from '../services/api';

interface LoginViewProps {
  onLogin: (username: string, avatar: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fn = mode === 'login' ? apiLogin : register;
      const { user } = await fn(username.trim(), password);
      onLogin(user.username, user.avatar);
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-page)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#b1ebba]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#ffdea5]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[var(--border)]/30 relative z-10 animate-in fade-in zoom-in duration-300">
        {/* Brand */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-[#125238] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#125238]/20">
            <span className="material-symbols-outlined text-white text-2xl fill-1">park</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#125238] tracking-tight">Focus Forest</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">和朋友一起种树 🌱</p>
        </div>

        {/* Tabs */}
        <div className="bg-[var(--bg-surface2)] p-1 rounded-2xl flex mb-6 border border-[var(--border)]/20">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[var(--bg-surface)] text-[#125238] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[#125238]'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[var(--bg-surface)] text-[#125238] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[#125238]'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              required
              minLength={2}
              maxLength={20}
              className="w-full py-3 px-4 bg-[var(--bg-surface2)]/80 border border-[var(--border)]/40 rounded-xl font-semibold text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50 focus:bg-[var(--bg-surface)] focus:ring-2 focus:ring-[#125238] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '设置密码（至少4位）' : '输入密码'}
              required
              minLength={4}
              className="w-full py-3 px-4 bg-[var(--bg-surface2)]/80 border border-[var(--border)]/40 rounded-xl font-semibold text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50 focus:bg-[var(--bg-surface)] focus:ring-2 focus:ring-[#125238] outline-none transition-all"
            />
          </div>

          {error && (
            <div className="bg-[#ba1a1a]/10 text-[#ba1a1a] text-xs font-bold px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#125238] text-white rounded-2xl font-bold text-base shadow-lg shadow-[#125238]/20 hover:bg-[#0f4630] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">
                  {mode === 'login' ? 'login' : 'person_add'}
                </span>
                {mode === 'login' ? '登录' : '注册'}
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-[var(--text-muted)] mt-5">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            onClick={toggleMode}
            className="text-[#125238] font-bold ml-1 hover:underline cursor-pointer"
          >
            {mode === 'login' ? '注册新账号' : '去登录'}
          </button>
        </p>
      </div>
    </div>
  );
};
