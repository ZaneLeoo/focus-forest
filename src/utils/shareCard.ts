type ShareStyle = {
  id: string;
  name: string;
  icon: string;
  bg: [string, string, string]; // gradient stops
  accent: string;
  accent2: string;
  text: string;
  muted: string;
  bar: string;
  barBg: string;
  cardAlpha: string;
};

export const SHARE_STYLES: ShareStyle[] = [
  {
    id: 'forest',
    name: '森林',
    icon: '🌲',
    bg: ['#1a3a28', '#125238', '#0d2e1e'],
    accent: '#b1ebba',
    accent2: '#96d4b2',
    text: '#ffffff',
    muted: '#96d4b2',
    bar: '#b1ebba',
    barBg: 'rgba(255,255,255,0.1)',
    cardAlpha: '0.03',
  },
  {
    id: 'sunset',
    name: '日落',
    icon: '🌅',
    bg: ['#5c1a1a', '#8b3a1a', '#3d1515'],
    accent: '#ffb380',
    accent2: '#ffcc99',
    text: '#fff5ee',
    muted: '#ffcc99',
    bar: '#ffb380',
    barBg: 'rgba(255,255,255,0.1)',
    cardAlpha: '0.03',
  },
  {
    id: 'ocean',
    name: '海洋',
    icon: '🌊',
    bg: ['#0d2847', '#0b3d5c', '#062238'],
    accent: '#7dd3fc',
    accent2: '#bae6fd',
    text: '#e0f2fe',
    muted: '#bae6fd',
    bar: '#7dd3fc',
    barBg: 'rgba(255,255,255,0.1)',
    cardAlpha: '0.03',
  },
  {
    id: 'cyberpunk',
    name: '赛博',
    icon: '🌃',
    bg: ['#0a001a', '#1a0040', '#050010'],
    accent: '#ff00ff',
    accent2: '#00ffff',
    text: '#f0e6ff',
    muted: '#00ffff',
    bar: '#ff00ff',
    barBg: 'rgba(255,0,255,0.15)',
    cardAlpha: '0.05',
  },
];

export async function generateShareCard(
  data: {
    userName: string;
    userAvatar: string;
    level: number;
    totalTrees: number;
    totalMinutes: number;
    streakDays: number;
  },
  style: ShareStyle = SHARE_STYLES[0],
): Promise<HTMLCanvasElement> {
  const W = 600;
  const H = 800;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, style.bg[0]);
  bg.addColorStop(0.5, style.bg[1]);
  bg.addColorStop(1, style.bg[2]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Decorative dots
  ctx.fillStyle = style.cardAlpha === '0.03' ? 'rgba(255,255,255,0.03)' : style.barBg;
  for (let i = 0; i < 80; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cyberpunk: add scanline effect
  if (style.id === 'cyberpunk') {
    ctx.fillStyle = 'rgba(0,255,255,0.015)';
    for (let y = 0; y < H; y += 4) {
      ctx.fillRect(0, y, W, 2);
    }
  }

  // Top border line
  ctx.strokeStyle = style.accent.replace(')', ',0.3)').replace('rgb', 'rgba');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 60);
  ctx.lineTo(W - 40, 60);
  ctx.stroke();

  // Title
  ctx.fillStyle = style.accent;
  ctx.font = 'bold 24px "Manrope", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌳 Focus Forest', W / 2, 120);

  // Username + Level
  ctx.font = 'bold 28px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = style.text;
  ctx.textAlign = 'center';
  ctx.fillText(data.userName, W / 2, 295);
  ctx.font = 'bold 16px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = style.accent2;
  ctx.fillText(`Lv.${data.level} · 园丁`, W / 2, 325);

  // Divider
  ctx.strokeStyle = style.accent.replace(')', ',0.2)').replace('rgb', 'rgba');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 365);
  ctx.lineTo(W - 60, 365);
  ctx.stroke();

  // Stats row
  const statsY = 445;
  const totalHours = Math.floor(data.totalMinutes / 60);
  const totalMins = data.totalMinutes % 60;

  const stats = [
    { value: `${data.totalTrees}`, label: '棵树木', icon: '🌲' },
    { value: `${totalHours}h ${totalMins}m`, label: '专注时长', icon: '⏱️' },
    { value: `${data.streakDays} 天`, label: '连续专注', icon: '🔥' },
  ];

  const colWidth = W / 3;
  stats.forEach((stat, i) => {
    const cx = colWidth * i + colWidth / 2;

    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(stat.icon, cx, statsY - 30);

    ctx.font = 'bold 28px "Manrope", "PingFang SC", sans-serif';
    ctx.fillStyle = style.text;
    ctx.fillText(stat.value, cx, statsY + 10);

    ctx.font = '14px "Manrope", "PingFang SC", sans-serif';
    ctx.fillStyle = style.accent2;
    ctx.fillText(stat.label, cx, statsY + 40);
  });

  // Level progress bar
  const barY = 545;
  const levelProgress = (data.totalTrees % 5) / 5;
  const barW = W - 120;
  const barH = 12;
  const barX = 60;

  ctx.font = 'bold 14px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = style.accent;
  ctx.textAlign = 'center';
  ctx.fillText('升级进度', W / 2, barY - 20);

  ctx.fillStyle = style.barBg;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, barH / 2);
  ctx.fill();

  ctx.fillStyle = style.bar;
  ctx.beginPath();
  ctx.roundRect(barX, barY, Math.max(barH, barW * levelProgress), barH, barH / 2);
  ctx.fill();

  ctx.font = '11px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = style.accent2;
  ctx.textAlign = 'left';
  ctx.fillText(`Lv.${data.level}`, barX, barY + 38);
  ctx.textAlign = 'right';
  ctx.fillText(`Lv.${data.level + 1}`, barX + barW, barY + 38);

  // Footer
  const footerY = 665;
  ctx.strokeStyle = style.accent.replace(')', ',0.2)').replace('rgb', 'rgba');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, footerY);
  ctx.lineTo(W - 60, footerY);
  ctx.stroke();

  ctx.font = 'bold 20px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = style.text;
  ctx.textAlign = 'center';
  ctx.fillText('来 Focus Forest 一起种树吧！', W / 2, footerY + 50);

  ctx.font = '13px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = style.accent2;
  ctx.fillText('把专注变成种树，建造一片数字森林 🌱', W / 2, footerY + 80);

  ctx.font = '11px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = style.accent.replace(')', ',0.4)').replace('rgb', 'rgba');
  ctx.textAlign = 'right';
  ctx.fillText('focus-forest.app', W - 60, H - 30);

  // Avatar (drawn last, on top)
  await drawAvatar(ctx, data.userAvatar, W / 2, 195, 55, style);

  // Avatar ring
  ctx.beginPath();
  ctx.arc(W / 2, 195, 56, 0, Math.PI * 2);
  ctx.strokeStyle = style.accent.replace(')', ',0.5)').replace('rgb', 'rgba');
  ctx.lineWidth = 3;
  ctx.stroke();

  return canvas;
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  avatar: string,
  cx: number,
  cy: number,
  r: number,
  style: ShareStyle,
): Promise<void> {
  return new Promise((resolve) => {
    // Avatar ring background
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = style.barBg;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    if (avatar.startsWith('data:')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
        ctx.restore();
        resolve();
      };
      img.src = avatar;
    } else {
      ctx.font = `${r * 1.1}px sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(avatar, cx, cy);
      ctx.restore();
      resolve();
    }
  });
}

export function downloadShareCard(canvas: HTMLCanvasElement) {
  const link = document.createElement('a');
  link.download = `focus-forest-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
