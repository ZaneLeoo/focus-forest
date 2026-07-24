import React, { useState, useMemo } from 'react';
import { useFocus } from '../context/FocusContext';
import { TREE_SPECIES } from '../constants/trees';
import { FocusSession } from '../types';

export const ForestView: React.FC = () => {
  const { sessions, setNavTab, deleteSession } = useFocus();
  const [timeTab, setTimeTab] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<FocusSession | null>(null);

  // Filter sessions based on time tab and search query
  const filteredSessions = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return sessions.filter(session => {
      // Time filter
      if (timeTab === 'day' && now - session.createdAt > dayMs) return false;
      if (timeTab === 'week' && now - session.createdAt > 7 * dayMs) return false;
      if (timeTab === 'month' && now - session.createdAt > 30 * dayMs) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCat = session.category.toLowerCase().includes(query);
        const matchTree = session.treeName.toLowerCase().includes(query);
        const matchNote = session.note?.toLowerCase().includes(query) || false;
        return matchCat || matchTree || matchNote;
      }

      return true;
    });
  }, [sessions, timeTab, searchQuery]);

  const completedSessions = useMemo(
    () => sessions.filter(s => s.completed),
    [sessions]
  );

  const totalTreesCount = filteredSessions.filter(s => s.completed).length;
  const rareTreesCount = filteredSessions.filter(s => s.completed && s.isRare).length;
  const totalDurationMinutes = filteredSessions.reduce((acc, s) => acc + (s.completed ? s.durationMinutes : 0), 0);

  // Calculate actual streak from session data
  const streakDays = useMemo(() => {
    if (completedSessions.length === 0) return 0;
    // Collect unique dates (YYYY-MM-DD) with completed sessions
    const dates = new Set<string>();
    completedSessions.forEach(s => {
      dates.add(new Date(s.createdAt).toISOString().slice(0, 10));
    });
    // Count consecutive days ending at today
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      if (dates.has(key)) {
        streak++;
      } else if (i === 0) {
        // Today not yet completed, skip and continue checking
        continue;
      } else {
        break;
      }
    }
    return streak;
  }, [completedSessions]);

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const now = Date.now();
    const weekStart = now - 7 * 86400000;
    const weekSessions = sessions.filter(s => s.completed && s.createdAt > weekStart);
    const weekMinutes = weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const weekCount = weekSessions.length;

    // Favorite category this week
    const catCount: Record<string, number> = {};
    weekSessions.forEach(s => {
      catCount[s.category] = (catCount[s.category] || 0) + 1;
    });
    let favCategory = '';
    let maxCount = 0;
    Object.entries(catCount).forEach(([cat, count]) => {
      if (count > maxCount) { maxCount = count; favCategory = cat; }
    });

    return { weekMinutes, weekCount, favCategory };
  }, [sessions]);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-24 pt-4">
      {/* Header Section */}
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="font-bold text-3xl text-[var(--text-main)] dark:text-zinc-100 mb-2">我的森林</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)] dark:text-zinc-400">
              <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] dark:bg-zinc-800 px-3 py-1 rounded-full shadow-sm border border-outline-variant/30">
                <span className="material-symbols-outlined text-[#125238] dark:text-[#96d4b2] text-lg">park</span>
                <span className="font-semibold text-xs text-[var(--text-main)] dark:text-zinc-200">
                  已种植 {totalTreesCount} 棵树
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] dark:bg-zinc-800 px-3 py-1 rounded-full shadow-sm border border-outline-variant/30">
                <span className="material-symbols-outlined text-amber-500 text-lg">star</span>
                <span className="font-semibold text-xs text-[var(--text-main)] dark:text-zinc-200">
                  {rareTreesCount} 种稀有树种
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] dark:bg-zinc-800 px-3 py-1 rounded-full shadow-sm border border-outline-variant/30">
                <span className="material-symbols-outlined text-[#346942] dark:text-[#96d4b2] text-lg">schedule</span>
                <span className="font-semibold text-xs text-[var(--text-main)] dark:text-zinc-200">
                  {Math.floor(totalDurationMinutes / 60)}h {totalDurationMinutes % 60}m 累计专注
                </span>
              </div>
            </div>
          </div>

          {/* Time Dimension Tabs */}
          <div className="flex p-1 bg-[var(--bg-surface2)] dark:bg-zinc-800 rounded-full w-fit border border-outline-variant/20">
            {[
              { id: 'day', label: '日' },
              { id: 'week', label: '周' },
              { id: 'month', label: '月' },
              { id: 'all', label: '全部' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeTab(tab.id as any)}
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  timeTab === tab.id
                    ? 'bg-[var(--bg-surface)] dark:bg-zinc-700 shadow-md text-[#125238] dark:text-[#96d4b2]'
                    : 'text-[var(--text-dim)] dark:text-zinc-400 hover:text-[#125238]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="mb-8">
        <div className="relative max-w-xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索项目或分类 (如: 工作, 阅读, 樱花)..."
            className="w-full bg-[var(--bg-surface)] dark:bg-zinc-800 border border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#125238]/30 shadow-sm text-[var(--text-main)] dark:text-zinc-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-black"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </section>

      {/* Forest Grid Landscape */}
      <section className="relative mb-12">
        {/* Background Landscape Elements */}
        <div className="absolute -z-10 inset-0 overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#b1f0cd] blur-[80px] rounded-full" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#b6f0bf] blur-[100px] rounded-full" />
        </div>

        {/* Tree Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Planted Trees List */}
          {filteredSessions.map(session => {
            const species = TREE_SPECIES.find(t => t.id === session.treeId) || TREE_SPECIES[0];

            return (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="group flex flex-col items-center cursor-pointer transform hover:-translate-y-1 transition-transform"
              >
                <div
                  className={`w-full aspect-square rounded-2xl shadow-sm flex items-center justify-center relative overflow-hidden border border-outline-variant/20 transition-all ${
                    session.isRare
                      ? 'bg-gradient-to-br from-pink-50 to-amber-50 dark:from-zinc-800 dark:to-zinc-850'
                      : 'bg-[var(--bg-surface)] dark:bg-zinc-800'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-5xl transition-transform group-hover:scale-110"
                    style={{ color: species.color }}
                  >
                    {species.icon}
                  </span>

                  {session.isRare && (
                    <div className="absolute top-2 right-2">
                      <span className="material-symbols-outlined text-amber-500 text-sm font-bold">star</span>
                    </div>
                  )}

                  {!session.completed && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold bg-red-600 px-2 py-0.5 rounded-full">
                        枯萎
                      </span>
                    </div>
                  )}
                </div>

                <span className="text-xs text-[var(--text-main)] dark:text-zinc-100 mt-2 font-bold flex items-center gap-1">
                  {session.treeName}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] dark:text-zinc-400">
                  {session.durationMinutes}分钟 • {session.category}
                </span>
              </div>
            );
          })}

          {/* Plant New Tree Button Slot */}
          <div
            onClick={() => setNavTab('focus')}
            className="flex flex-col items-center cursor-pointer group opacity-70 hover:opacity-100 transition-opacity"
          >
            <div className="w-full aspect-square bg-[#8B6B4A]/10 rounded-2xl flex flex-col items-center justify-center gap-1 border border-dashed border-[#8B6B4A]/30 group-hover:bg-[#8B6B4A]/20 transition-colors">
              <span className="material-symbols-outlined text-[#8B6B4A] text-3xl">add_circle</span>
              <span className="text-[11px] text-[#8B6B4A] font-bold">种植新树</span>
            </div>
            <span className="text-xs text-[var(--text-muted)] dark:text-zinc-400 mt-2 font-medium">开始新专注</span>
          </div>
        </div>

        {filteredSessions.length === 0 && (
          <div className="text-center py-12 bg-[var(--bg-surface)] dark:bg-zinc-800 rounded-3xl border border-outline-variant/20 mt-4">
            <span className="material-symbols-outlined text-4xl text-[var(--text-muted)] mb-2">forest</span>
            <p className="text-sm font-bold text-[var(--text-main)] dark:text-zinc-300">该时间段内暂无森林记录</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">开启一次新的专注，为你的生态园添加一棵树吧。</p>
            <button
              onClick={() => setNavTab('focus')}
              className="px-6 py-2.5 bg-[#125238] text-white text-xs font-bold rounded-2xl shadow-md"
            >
              立即专注
            </button>
          </div>
        )}
      </section>

      {/* Growth Highlights Bento */}
      <section>
        <h3 className="font-bold text-xl text-[var(--text-main)] dark:text-zinc-100 mb-4">成长亮点</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-surface)] dark:bg-zinc-800 p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
            <p className="text-[var(--text-muted)] dark:text-zinc-400 text-xs font-bold mb-2">当前连续天数</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[#125238] dark:text-[#96d4b2]">{streakDays}</span>
              <span className="text-xs font-bold text-[var(--text-main)] dark:text-zinc-300">天</span>
            </div>
            <div className="mt-4 flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < streakDays % 7 || (streakDays % 7 === 0 && streakDays > 0 && i < 7)
                      ? 'bg-[#125238] dark:bg-[#96d4b2]'
                      : 'bg-[#c0c9c1]/30 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] dark:bg-zinc-800 p-6 rounded-3xl border border-outline-variant/20 shadow-sm md:col-span-2 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[var(--text-muted)] dark:text-zinc-400 text-xs font-bold mb-2">本周专注统计</p>
              {weeklyStats.weekCount > 0 ? (
                <>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-extrabold text-[#346942] dark:text-[#96d4b2]">{weeklyStats.weekCount}</span>
                    <span className="text-xs font-bold text-[var(--text-main)] dark:text-zinc-300">次专注</span>
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-[#b1f0cd] flex items-center justify-center border-2 border-white">
                        <span className="material-symbols-outlined text-xs text-[#125238]">schedule</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#b6f0bf] flex items-center justify-center border-2 border-white">
                        <span className="material-symbols-outlined text-xs text-[#346942]">local_fire_department</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] dark:text-zinc-400 mt-2 leading-relaxed">
                    本周累计专注 <strong className="text-[#125238]">{Math.floor(weeklyStats.weekMinutes / 60)}h {weeklyStats.weekMinutes % 60}m</strong>
                    {weeklyStats.favCategory && <>，最常投入 <strong className="text-[#125238]">{weeklyStats.favCategory}</strong></>}。
                    继续保持！
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-extrabold text-[#c0c9c1] dark:text-zinc-600">0</span>
                    <span className="text-xs font-bold text-[var(--text-muted)] dark:text-zinc-400">次专注</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] dark:text-zinc-400 mt-2 leading-relaxed">
                    本周还没有专注记录，现在就开始种下第一棵树吧 🌱
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface)] dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant/20 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#125238] dark:text-[#96d4b2]">专注树木详情</h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-[var(--bg-surface)]/10 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex flex-col items-center py-4 bg-[var(--bg-surface2)] dark:bg-zinc-800 rounded-2xl mb-4">
              <span className="material-symbols-outlined text-6xl mb-2 text-[#125238] dark:text-[#96d4b2]">
                {selectedSession.treeName.includes('樱花')
                  ? 'local_florist'
                  : selectedSession.treeName.includes('松树')
                  ? 'forest'
                  : 'park'}
              </span>
              <h4 className="font-bold text-base text-[var(--text-main)] dark:text-zinc-100">{selectedSession.treeName}</h4>
              <p className="text-xs text-[var(--text-muted)] dark:text-zinc-400">
                {new Date(selectedSession.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>

            <div className="space-y-2 text-xs mb-6 text-[var(--text-main)] dark:text-zinc-200">
              <div className="flex justify-between py-1 border-b border-outline-variant/10">
                <span className="text-[var(--text-muted)]">专注分类</span>
                <span className="font-bold">{selectedSession.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/10">
                <span className="text-[var(--text-muted)]">专注时长</span>
                <span className="font-bold">{selectedSession.durationMinutes} 分钟</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/10">
                <span className="text-[var(--text-muted)]">状态</span>
                <span className={`font-bold ${selectedSession.completed ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedSession.completed ? '已成功种植' : '中途放弃'}
                </span>
              </div>
              {selectedSession.note && (
                <div className="pt-2">
                  <span className="text-[var(--text-muted)]">备注:</span>
                  <p className="mt-1 p-2 bg-[var(--bg-surface2)] dark:bg-zinc-800 rounded-xl italic">{selectedSession.note}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  deleteSession(selectedSession.id);
                  setSelectedSession(null);
                }}
                className="w-full py-2.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-2xl font-bold text-xs hover:bg-red-200 transition-colors"
              >
                删除记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
