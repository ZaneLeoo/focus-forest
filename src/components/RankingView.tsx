import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { RankingEntry } from '../types';
import { fetchRankings } from '../services/api';

export const RankingView: React.FC = () => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'minutes' | 'sessions'>('minutes');
  const [celebrating, setCelebrating] = useState<string | null>(null);

  useEffect(() => {
    fetchRankings()
      .then(data => setRankings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => {
    const list = [...rankings];
    if (sortBy === 'minutes') {
      list.sort((a, b) => b.totalMinutes - a.totalMinutes);
    } else {
      list.sort((a, b) => b.totalSessions - a.totalSessions);
    }
    return list;
  }, [rankings, sortBy]);

  const celebrate = (userId: string) => {
    if (celebrating === userId) return;
    setCelebrating(userId);
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5, x: 0.5 },
      colors: ['#FFD700', '#FFA500', '#125238', '#b1f0cd', '#f472b6'],
      shapes: ['star', 'circle'],
      ticks: 150,
    });
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.3, x: 0.3 },
        colors: ['#FFD700', '#FFA500'],
        shapes: ['star'],
      });
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.3, x: 0.7 },
        colors: ['#FFD700', '#FFA500'],
        shapes: ['star'],
      });
    }, 200);
    setTimeout(() => setCelebrating(null), 2000);
  };

  const getMedal = (index: number) => {
    if (index === 0) return { emoji: '🥇', bg: 'bg-amber-100 border-amber-300' };
    if (index === 1) return { emoji: '🥈', bg: 'bg-gray-100 border-gray-300' };
    if (index === 2) return { emoji: '🥉', bg: 'bg-orange-100 border-orange-300' };
    return { emoji: '', bg: 'bg-[var(--bg-surface)] border-outline-variant/20' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-[#125238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 pt-4">
      <section className="mb-6">
        <h2 className="font-bold text-3xl text-[var(--text-main)] mb-1">专注排行</h2>
        <p className="text-xs text-[var(--text-muted)]">看看谁是最专注的园丁 🌟</p>
      </section>

      {/* Sort Toggle */}
      <div className="flex p-1 bg-[var(--bg-surface2)] rounded-full w-fit mb-6 border border-outline-variant/20">
        <button
          onClick={() => setSortBy('minutes')}
          className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
            sortBy === 'minutes'
              ? 'bg-[var(--bg-surface)] shadow-md text-[#125238]'
              : 'text-[var(--text-dim)] hover:text-[#125238]'
          }`}
        >
          按总时长
        </button>
        <button
          onClick={() => setSortBy('sessions')}
          className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
            sortBy === 'sessions'
              ? 'bg-[var(--bg-surface)] shadow-md text-[#125238]'
              : 'text-[var(--text-dim)] hover:text-[#125238]'
          }`}
        >
          按种树数
        </button>
      </div>

      {/* Ranking List */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-surface)] rounded-3xl border border-outline-variant/20">
          <span className="material-symbols-outlined text-4xl text-[var(--text-muted)] mb-2">leaderboard</span>
          <p className="text-sm font-bold text-[var(--text-main)]">暂无排行数据</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">开始专注，成为排行榜第一名吧！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((entry, index) => {
            const medal = getMedal(index);
            const hours = Math.floor(entry.totalMinutes / 60);
            const mins = entry.totalMinutes % 60;

            const isFirst = index === 0;
            return (
              <div
                key={entry.userId}
                onClick={() => isFirst && entry.totalSessions > 0 && celebrate(entry.userId)}
                className={`flex items-center gap-4 p-4 rounded-2xl border shadow-sm transition-all ${medal.bg} ${
                  isFirst && entry.totalSessions > 0
                    ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg active:scale-95'
                    : ''
                } ${celebrating === entry.userId ? 'ring-4 ring-amber-400 scale-[1.03] shadow-2xl' : ''}`}
              >
                {/* Rank */}
                <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${celebrating === entry.userId ? 'animate-bounce' : ''}`}>
                  {medal.emoji ? (
                    <span className={`text-2xl ${celebrating === entry.userId ? 'animate-ping' : ''}`}>{medal.emoji}</span>
                  ) : (
                    <span className="text-sm font-bold text-[var(--text-muted)]">{index + 1}</span>
                  )}
                </div>

                {/* Avatar + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    {isFirst && entry.totalSessions > 0 && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-amber-500 z-10 material-symbols-outlined text-lg fill-1">
                        crown
                      </span>
                    )}
                    <div className="w-10 h-10 rounded-full bg-[#b1ebba]/40 flex items-center justify-center text-xl">
                      {entry.avatar}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[var(--text-main)] truncate">{entry.username}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      种树 {entry.totalSessions} 棵
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-lg text-[#125238]">
                    {hours}h {mins}m
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">专注时长</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
