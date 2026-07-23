import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PlantedTree } from '../types';

interface StatsViewProps {
  trees: PlantedTree[];
}

export const StatsView: React.FC<StatsViewProps> = ({ trees }) => {
  const [timeRange, setTimeRange] = useState<'7days' | '30days'>('7days');

  // Key metrics calculations
  const totalMinutes = useMemo(() => {
    return trees.reduce((acc, t) => acc + t.durationMinutes, 0);
  }, [trees]);

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const totalTimeStr = `${totalHours}h ${remainingMins}m`;

  const avgMinutes = useMemo(() => {
    if (trees.length === 0) return 0;
    return Math.round(totalMinutes / trees.length);
  }, [trees, totalMinutes]);

  const completionRate = useMemo(() => {
    if (trees.length === 0) return 100;
    const completed = trees.filter(t => t.status === 'completed').length;
    return Math.round((completed / trees.length) * 100);
  }, [trees]);

  // Focus time trend data (past 7 days or 30 days)
  const trendData = useMemo(() => {
    const daysCount = timeRange === '7days' ? 7 : 30;
    const result: Array<{ day: string; minutes: number }> = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const dayLabel = d.toLocaleDateString('zh-CN', { weekday: 'short', month: 'numeric', day: 'numeric' });

      // Sum minutes for this date
      const minutesOnDay = trees.reduce((acc, t) => {
        const tDate = new Date(t.timestamp);
        if (
          tDate.getFullYear() === d.getFullYear() &&
          tDate.getMonth() === d.getMonth() &&
          tDate.getDate() === d.getDate()
        ) {
          return acc + t.durationMinutes;
        }
        return acc;
      }, 0);

      result.push({
        day: daysCount === 7 ? dayLabel : `${d.getMonth() + 1}/${d.getDate()}`,
        minutes: minutesOnDay,
      });
    }

    return result;
  }, [trees, timeRange]);

  // Category breakdown chart data
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    trees.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.durationMinutes;
    });

    const COLORS: Record<string, string> = {
      工作: '#125238',
      学习: '#346942',
      阅读: '#0284c7',
      设计: '#e91e63',
      专注: '#d97706',
      兴趣: '#7a5b16',
    };

    return Object.keys(map).map(cat => ({
      name: cat,
      value: map[cat],
      color: COLORS[cat] || '#2f6b4f',
    }));
  }, [trees]);

  // 26-week activity heatmap generator (optimized: precompute date->count map)
  const heatmapColumns = useMemo(() => {
    // Build lookup map: dateKey -> count in a single pass
    const countMap = new Map<string, number>();
    trees.forEach(t => {
      const d = new Date(t.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });

    const cols = [];
    const now = new Date();
    const dayMs = 24 * 3600 * 1000;

    for (let w = 25; w >= 0; w--) {
      const daysInWeek = [];
      for (let d = 0; d < 7; d++) {
        const offset = (w * 7 + (6 - d)) * dayMs;
        const targetDate = new Date(now.getTime() - offset);
        const key = `${targetDate.getFullYear()}-${targetDate.getMonth()}-${targetDate.getDate()}`;
        const count = countMap.get(key) || 0;

        let level = 0;
        if (count >= 3) level = 3;
        else if (count === 2) level = 2;
        else if (count === 1) level = 1;

        daysInWeek.push({
          date: targetDate.toLocaleDateString('zh-CN'),
          count,
          level,
        });
      }
      cols.push(daysInWeek);
    }
    return cols;
  }, [trees]);

  return (
    <div className="w-full max-w-6xl mx-auto pb-12">
      {/* Header & Summary */}
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-bold text-2xl sm:text-3xl text-[#26332C] mb-1">我的成长旅程</h2>
            <p className="text-xs text-[#768078]">每一分钟的专注，都在森林里种下一棵树。</p>
          </div>
          {trees.length > 0 && (
            <div className="flex items-center gap-2 bg-[#2f6b4f]/10 px-3 py-2 rounded-xl border border-[#2f6b4f]/20">
              <span className="material-symbols-outlined text-[#125238] text-lg">auto_awesome</span>
              <p className="text-xs font-bold text-[#125238]">
                已累计专注 {totalHours} 小时 {remainingMins} 分钟
              </p>
            </div>
          )}
        </div>

        {/* Key Metrics Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#FFFEF8] rounded-2xl p-6 shadow-xs border border-[#125238]/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#768078] font-bold text-xs">总专注时长</span>
              <span className="material-symbols-outlined text-[#9CAD7B]">schedule</span>
            </div>
            <h3 className="text-3xl font-bold text-[#125238]">{totalTimeStr}</h3>
          </div>

          <div className="bg-[#FFFEF8] rounded-2xl p-6 shadow-xs border border-[#125238]/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#768078] font-bold text-xs">平均单次时长</span>
              <span className="material-symbols-outlined text-[#9CAD7B]">timer</span>
            </div>
            <h3 className="text-3xl font-bold text-[#125238]">{avgMinutes}m</h3>
          </div>

          <div className="bg-[#FFFEF8] rounded-2xl p-6 shadow-xs border border-[#125238]/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#768078] font-bold text-xs">种植完成率</span>
              <span className="material-symbols-outlined text-[#9CAD7B]">task_alt</span>
            </div>
            <h3 className="text-3xl font-bold text-[#125238]">{completionRate}%</h3>
          </div>
        </div>
      </section>

      {/* Visual Analytics */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Focus Time Trend Chart */}
        <div className="bg-[#FFFEF8] rounded-2xl p-6 shadow-xs border border-[#125238]/5 flex flex-col h-[380px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="font-bold text-lg text-[#26332C]">专注趋势</h4>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7days' | '30days')}
              className="bg-transparent border-none text-xs text-[#125238] font-bold focus:ring-0 cursor-pointer"
            >
              <option value="7days">过去 7 天</option>
              <option value="30days">过去 30 天</option>
            </select>
          </div>

          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorMins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#125238" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#125238" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#707972" fontSize={11} tickLine={false} />
                <YAxis stroke="#707972" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFEF8', borderRadius: '12px', borderColor: '#c0c9c1' }}
                  formatter={(val: number) => [`${val} 分钟`, '专注时长']}
                />
                <Area type="monotone" dataKey="minutes" stroke="#125238" strokeWidth={3} fillOpacity={1} fill="url(#colorMins)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Categories Donut Chart */}
        <div className="bg-[#FFFEF8] rounded-2xl p-6 shadow-xs border border-[#125238]/5 flex flex-col h-[380px]">
          <div className="mb-4">
            <h4 className="font-bold text-lg text-[#26332C]">任务分类</h4>
          </div>

          <div className="flex-1 flex items-center justify-around">
            <div className="w-44 h-44 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-bold text-xl text-[#125238]">{trees.length}</span>
                <span className="text-[10px] text-[#768078] font-bold">棵树</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-h-56 overflow-y-auto custom-scrollbar pr-2">
              {categoryData.map(item => (
                <div key={item.name} className="flex items-center gap-3 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="font-bold text-[#26332C]">{item.name}</p>
                    <p className="text-[10px] text-[#768078]">{item.value} 分钟</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Planting Consistency Heatmap */}
      <section className="mb-12">
        <div className="bg-[#FFFEF8] rounded-2xl p-6 shadow-xs border border-[#125238]/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h4 className="font-bold text-lg text-[#26332C]">种植稳定性</h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#768078]">
              <span>少</span>
              <div className="flex gap-1">
                <div className="w-3.5 h-3.5 rounded-xs bg-[#e4e3da]"></div>
                <div className="w-3.5 h-3.5 rounded-xs bg-[#b1ebba]"></div>
                <div className="w-3.5 h-3.5 rounded-xs bg-[#346942]"></div>
                <div className="w-3.5 h-3.5 rounded-xs bg-[#125238]"></div>
              </div>
              <span>多</span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar pb-3">
            <div className="inline-grid grid-cols-[auto_repeat(26,_1fr)] gap-2 min-w-max">
              <div className="flex flex-col gap-2 pr-3 justify-between text-[10px] text-[#768078] font-bold py-0.5">
                <span>周一</span>
                <span>周三</span>
                <span>周五</span>
              </div>

              {heatmapColumns.map((col, cIdx) => (
                <div key={cIdx} className="flex flex-col gap-2">
                  {col.map((day, dIdx) => {
                    const bgColors = ['bg-[#e4e3da]', 'bg-[#b1ebba]', 'bg-[#346942]', 'bg-[#125238]'];
                    return (
                      <div
                        key={dIdx}
                        title={`${day.date}: 种植 ${day.count} 棵树`}
                        className={`w-3.5 h-3.5 rounded-xs heatmap-cell cursor-pointer ${bgColors[day.level]}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {trees.length > 0 && (
            <div className="mt-6 flex items-center gap-2 p-3 bg-[#b1f0cd]/20 rounded-xl border border-[#b1f0cd]">
              <span className="material-symbols-outlined text-[#125238] text-lg">energy_savings_leaf</span>
              <p className="text-xs text-[#105137] font-medium">
                已种下 <strong>{trees.length}</strong> 棵树，继续加油！
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
