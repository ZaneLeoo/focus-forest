// Generate a share card PNG using Canvas
export async function generateShareCard(data: {
  userName: string;
  userAvatar: string;
  level: number;
  totalTrees: number;
  totalMinutes: number;
  streakDays: number;
}): Promise<HTMLCanvasElement> {
  const W = 600;
  const H = 800;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a3a28');
  bg.addColorStop(0.5, '#125238');
  bg.addColorStop(1, '#0d2e1e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Decorative dots
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 80; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top border line
  ctx.strokeStyle = 'rgba(177, 235, 186, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 60);
  ctx.lineTo(W - 40, 60);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#b1ebba';
  ctx.font = 'bold 24px "Manrope", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌳 Focus Forest', W / 2, 120);

  // Username + Level
  ctx.font = 'bold 28px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(data.userName, W / 2, 295);
  ctx.font = 'bold 16px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = '#96d4b2';
  ctx.fillText(`Lv.${data.level} · 园丁`, W / 2, 325);

  // Divider
  ctx.strokeStyle = 'rgba(177, 235, 186, 0.2)';
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
    ctx.fillStyle = '#ffffff';
    ctx.fillText(stat.value, cx, statsY + 10);

    ctx.font = '14px "Manrope", "PingFang SC", sans-serif';
    ctx.fillStyle = '#96d4b2';
    ctx.fillText(stat.label, cx, statsY + 40);
  });

  // Level progress bar
  const barY = 545;
  const levelProgress = (data.totalTrees % 5) / 5;
  const barW = W - 120;
  const barH = 12;
  const barX = 60;

  ctx.font = 'bold 14px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = '#b1ebba';
  ctx.textAlign = 'center';
  ctx.fillText('升级进度', W / 2, barY - 20);

  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, barH / 2);
  ctx.fill();

  ctx.fillStyle = '#b1ebba';
  ctx.beginPath();
  ctx.roundRect(barX, barY, Math.max(barH, barW * levelProgress), barH, barH / 2);
  ctx.fill();

  ctx.font = '11px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = '#96d4b2';
  ctx.textAlign = 'left';
  ctx.fillText(`Lv.${data.level}`, barX, barY + 38);
  ctx.textAlign = 'right';
  ctx.fillText(`Lv.${data.level + 1}`, barX + barW, barY + 38);

  // Footer
  const footerY = 665;
  ctx.strokeStyle = 'rgba(177, 235, 186, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, footerY);
  ctx.lineTo(W - 60, footerY);
  ctx.stroke();

  ctx.font = 'bold 20px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('来 Focus Forest 一起种树吧！', W / 2, footerY + 50);

  ctx.font = '13px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = '#96d4b2';
  ctx.fillText('把专注变成种树，建造一片数字森林 🌱', W / 2, footerY + 80);

  ctx.font = '11px "Manrope", "PingFang SC", sans-serif';
  ctx.fillStyle = 'rgba(177, 235, 186, 0.4)';
  ctx.textAlign = 'right';
  ctx.fillText('focus-forest.app', W - 60, H - 30);

  // Avatar (drawn last, on top)
  await drawAvatar(ctx, data.userAvatar, W / 2, 195, 55);

  // Avatar ring
  ctx.beginPath();
  ctx.arc(W / 2, 195, 56, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(177, 235, 186, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  return canvas;
}

function drawAvatar(ctx: CanvasRenderingContext2D, avatar: string, cx: number, cy: number, r: number): Promise<void> {
  return new Promise((resolve) => {
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
