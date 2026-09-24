// js/animation.js
export function initCanvasAnimation(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width, height;
  let currentMode = 'student'; // 'student' or 'admin'

  // Expose a method to change mode
  canvas.setMode = (mode) => {
    currentMode = mode;
  };

  function resize() {
    if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }
  }
  
  window.addEventListener('resize', resize);
  
  // Constellation Graph Nodes
  const nodes = Array.from({length: 80}, () => ({
    x: Math.random(), 
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0015,
    vy: (Math.random() - 0.5) * 0.0015,
  }));

  function draw() {
    if (canvas.width !== canvas.offsetWidth && canvas.offsetWidth > 0) {
      resize();
    }
    
    if (!width || !height) {
      requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, width, height);
    const time = Date.now() / 1000;

    // --- 1. Draw Constellation (Background) ---
    ctx.lineWidth = 1.5;
    for (let i = 0; i < nodes.length; i++) {
      let n1 = nodes[i];
      n1.x += n1.vx;
      n1.y += n1.vy;
      if (n1.x < 0 || n1.x > 1) n1.vx *= -1;
      if (n1.y < 0 || n1.y > 1) n1.vy *= -1;

      const isNodeAdmin = currentMode === 'admin';
      ctx.fillStyle = isNodeAdmin ? 'rgba(217, 107, 67, 0.4)' : 'rgba(16, 185, 129, 0.4)'; 
      ctx.beginPath();
      ctx.arc(n1.x * width, n1.y * height, 2.5, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < nodes.length; j++) {
        let n2 = nodes[j];
        let dx = (n1.x - n2.x) * width;
        let dy = (n1.y - n2.y) * height;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 130) {
          ctx.strokeStyle = isNodeAdmin 
            ? `rgba(217, 107, 67, ${0.25 * (1 - dist/130)})` 
            : `rgba(16, 185, 129, ${0.25 * (1 - dist/130)})`;
          ctx.beginPath();
          ctx.moveTo(n1.x * width, n1.y * height);
          ctx.lineTo(n2.x * width, n2.y * height);
          ctx.stroke();
        }
      }
    }

    // --- 2. Foreground Animation ---
    if (currentMode === 'student') {
      // Binary Search Tree (Student Mode)
      const cx = width * 0.75;
      const cy = height * 0.35;
      
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 70, cy + 70); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 70, cy + 70); ctx.stroke();
      
      ctx.beginPath(); ctx.moveTo(cx - 70, cy + 70); ctx.lineTo(cx - 110, cy + 140); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 70, cy + 70); ctx.lineTo(cx - 30, cy + 140); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 70, cy + 70); ctx.lineTo(cx + 30, cy + 140); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 70, cy + 70); ctx.lineTo(cx + 110, cy + 140); ctx.stroke();

      const cycle = (time * 1.5) % 4;
      const pulsePaths = [
        [{x: cx, y: cy}, {x: cx - 70, y: cy + 70}, {x: cx - 110, y: cy + 140}],
        [{x: cx, y: cy}, {x: cx + 70, y: cy + 70}, {x: cx + 30, y: cy + 140}],
        [{x: cx, y: cy}, {x: cx - 70, y: cy + 70}, {x: cx - 30, y: cy + 140}],
      ];
      
      const activePulse = pulsePaths[Math.floor(time * 0.5) % 3];
      let pNode = activePulse[Math.floor(cycle) % 3];
      if (pNode) {
        ctx.fillStyle = '#10B981';
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(pNode.x, pNode.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      const drawNode = (x, y, label, isTarget = false) => {
        ctx.fillStyle = isTarget ? '#10B981' : '#0F172A';
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = isTarget ? '#FFF' : '#10B981';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
      };

      drawNode(cx, cy, 'BST');
      drawNode(cx - 70, cy + 70, 'L');
      drawNode(cx + 70, cy + 70, 'R');
      drawNode(cx - 110, cy + 140, 'LL');
      drawNode(cx - 30, cy + 140, 'LR', Math.floor(time * 0.5) % 3 === 2);
      drawNode(cx + 30, cy + 140, 'RL', Math.floor(time * 0.5) % 3 === 1);
      drawNode(cx + 110, cy + 140, 'RR');

    } else if (currentMode === 'admin') {
      // Global Network / Radar (Admin Mode)
      const cx = width * 0.75;
      const cy = height * 0.5;
      const maxRadius = 150;

      // Radar circles
      ctx.strokeStyle = 'rgba(217, 107, 67, 0.15)'; // Terracotta
      ctx.lineWidth = 1.5;
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (maxRadius / 4) * r, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Crosshairs
      ctx.beginPath(); ctx.moveTo(cx - maxRadius, cy); ctx.lineTo(cx + maxRadius, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - maxRadius); ctx.lineTo(cx, cy + maxRadius); ctx.stroke();

      // Sweeper
      const angle = (time * 2) % (Math.PI * 2);
      ctx.fillStyle = 'rgba(217, 107, 67, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadius, angle, angle + 0.5);
      ctx.lineTo(cx, cy);
      ctx.fill();
      
      // Sweep Line
      ctx.strokeStyle = '#D96B43';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle + 0.5) * maxRadius, cy + Math.sin(angle + 0.5) * maxRadius);
      ctx.stroke();

      // Blips
      const blips = [
        { r: 40, a: 1.2 }, { r: 90, a: 3.5 }, { r: 130, a: 5.1 }, { r: 70, a: 0.8 }
      ];
      
      blips.forEach((blip) => {
        let diff = (angle + 0.5) - blip.a;
        if (diff < 0) diff += Math.PI * 2;
        if (diff < 1.0) {
          const bx = cx + Math.cos(blip.a) * blip.r;
          const by = cy + Math.sin(blip.a) * blip.r;
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - diff})`;
          ctx.beginPath();
          ctx.arc(bx, by, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Admin Core Text
      ctx.fillStyle = '#D96B43';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SYS.ADMIN', cx, cy - maxRadius - 15);
      ctx.fillText('AUTH: REQUIRED', cx, cy + maxRadius + 20);
    }

    requestAnimationFrame(draw);
  }
  
  requestAnimationFrame(draw);
}
