import React, { useState, useEffect, useMemo } from 'react';
import { RankingEntry } from '../types';
import { fetchRankings } from '../services/api';

export const RankingView: React.FC = () => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'minutes' | 'sessions'>('minutes');

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

  const getMedal = (index: number) => {
    if (index === 0) return { emoji: '🥇', bg: 'bg-amber-100 border-amber-300' };
    if (index === 1) return { emoji: '🥈', bg: 'bg-gray-100 border-gray-300' };
    if (index === 2) return { emoji: '🥉', bg: 'bg-orange-100 border-orange-300' };
    return { emoji: '', bg: 'bg-[#FFFEF8] border-outline-variant/20' };
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
        <h2 className="font-bold text-3xl text-[#26332C] mb-1">专注排行</h2>
        <p className="text-xs text-[#768078]">看看谁是最专注的园丁 🌟</p>
      </section>

      {/* Sort Toggle */}
      <div className="flex p-1 bg-[#f0eee5] rounded-full w-fit mb-6 border border-outline-variant/20">
        <button
          onClick={() => setSortBy('minutes')}
          className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
            sortBy === 'minutes'
              ? 'bg-white shadow-md text-[#125238]'
              : 'text-[#404943] hover:text-[#125238]'
          }`}
        >
          按总时长
        </button>
        <button
          onClick={() => setSortBy('sessions')}
          className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
            sortBy === 'sessions'
              ? 'bg-white shadow-md text-[#125238]'
              : 'text-[#404943] hover:text-[#125238]'
          }`}
        >
          按种树数
        </button>
      </div>

      {/* Ranking List */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 bg-[#FFFEF8] rounded-3xl border border-outline-variant/20">
          <span className="material-symbols-outlined text-4xl text-[#768078] mb-2">leaderboard</span>
          <p className="text-sm font-bold text-[#26332C]">暂无排行数据</p>
          <p className="text-xs text-[#768078] mt-1">开始专注，成为排行榜第一名吧！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((entry, index) => {
            const medal = getMedal(index);
            const hours = Math.floor(entry.totalMinutes / 60);
            const mins = entry.totalMinutes % 60;

            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-4 rounded-2xl border shadow-sm transition-all ${medal.bg}`}
              >
                {/* Rank */}
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  {medal.emoji ? (
                    <span className="text-2xl">{medal.emoji}</span>
                  ) : (
                    <span className="text-sm font-bold text-[#768078]">{index + 1}</span>
                  )}
                </div>

                {/* Avatar + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#b1ebba]/40 flex items-center justify-center text-xl shrink-0">
                    {entry.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#26332C] truncate">{entry.username}</p>
                    <p className="text-[10px] text-[#768078]">
                      种树 {entry.totalSessions} 棵
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-lg text-[#125238]">
                    {hours}h {mins}m
                  </p>
                  <p className="text-[10px] text-[#768078]">专注时长</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
