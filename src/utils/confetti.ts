// Lightweight zero-dependency HTML5 Canvas Confetti Burst
export function fireConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#3B82F6', '#14B8A6'];
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    vRotation: number;
  }> = [];

  for (let i = 0; i < 70; i++) {
    particles.push({
      x: width / 2,
      y: height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 18,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 10
    });
  }

  let animationFrame: number;
  let frameCount = 0;

  function render() {
    ctx!.clearRect(0, 0, width, height);
    frameCount++;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4; // gravity
      p.vx *= 0.98; // drag
      p.rotation += p.vRotation;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rotation * Math.PI) / 180);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx!.restore();
    }

    if (frameCount < 100) {
      animationFrame = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrame);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  }

  render();
}
