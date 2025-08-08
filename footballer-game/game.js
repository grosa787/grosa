/* Penalty Shootout - simple canvas game */
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const field = { width: canvas.width, height: canvas.height };

  const ui = {
    scoreEl: document.getElementById('score'),
    shotsEl: document.getElementById('shots'),
    resetBtn: document.getElementById('resetBtn')
  };

  const MAX_SHOTS = 5;
  const GOAL_LINE_Y = 110;
  const GOAL_WIDTH = 560;
  const GOAL_X = (field.width - GOAL_WIDTH) / 2;
  const POST_THICKNESS = 10;

  const keeper = {
    x: field.width / 2,
    y: GOAL_LINE_Y + 30,
    width: 120,
    height: 20,
    vx: 2.2,
    dir: 1
  };

  const ballStart = { x: field.width / 2, y: field.height - 60 };
  const ball = {
    x: ballStart.x,
    y: ballStart.y,
    r: 10,
    vx: 0,
    vy: 0,
    shot: false,
    inPlay: false
  };

  const targetZones = [
    { x: GOAL_X + 35, y: GOAL_LINE_Y + 10, w: 90, h: 50, mult: 2.0 }, // top-left
    { x: GOAL_X + GOAL_WIDTH - 125, y: GOAL_LINE_Y + 10, w: 90, h: 50, mult: 2.0 }, // top-right
    { x: GOAL_X + 35, y: GOAL_LINE_Y + 70, w: 90, h: 50, mult: 1.5 }, // bottom-left
    { x: GOAL_X + GOAL_WIDTH - 125, y: GOAL_LINE_Y + 70, w: 90, h: 50, mult: 1.5 } // bottom-right
  ];

  let score = 0;
  let shots = 0;

  function resetRound() {
    ball.x = ballStart.x;
    ball.y = ballStart.y;
    ball.vx = 0; ball.vy = 0;
    ball.shot = false;
    ball.inPlay = false;
  }

  function resetGame() {
    score = 0;
    shots = 0;
    resetRound();
    updateUI();
  }

  ui.resetBtn.addEventListener('click', resetGame);
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') resetGame();
  });

  function updateUI() {
    ui.scoreEl.textContent = `Score: ${score}`;
    ui.shotsEl.textContent = `Shots: ${shots}/${MAX_SHOTS}`;
  }

  // Input: drag to aim and power
  const input = {
    dragging: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0
  };

  function canvasPos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) * (canvas.width / rect.width),
      y: (evt.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  canvas.addEventListener('mousedown', (e) => {
    if (shots >= MAX_SHOTS) return;
    const p = canvasPos(e);
    if (distance(p.x, p.y, ball.x, ball.y) <= 24) {
      input.dragging = true;
      input.startX = input.currX = p.x;
      input.startY = input.currY = p.y;
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!input.dragging) return;
    const p = canvasPos(e);
    input.currX = p.x;
    input.currY = p.y;
  });

  canvas.addEventListener('mouseup', () => {
    if (!input.dragging) return;
    input.dragging = false;
    if (shots >= MAX_SHOTS) return;

    const aimX = input.startX - input.currX;
    const aimY = input.startY - input.currY;
    const power = clamp(Math.hypot(aimX, aimY), 0, 180);

    const scale = 0.18; // velocity scale
    ball.vx = (aimX * scale);
    ball.vy = (aimY * scale);

    // Ensure ball heads towards goal (negative vy)
    if (ball.vy >= -2) ball.vy = -2 - Math.abs(ball.vy);

    ball.shot = true;
    ball.inPlay = true;
    shots += 1;
    updateUI();
  });

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function distance(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function drawField() {
    // Pitch
    ctx.fillStyle = '#1a5e36';
    ctx.fillRect(0, 0, field.width, field.height);

    // Stripes
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
      ctx.fillRect(0, i * 60, field.width, 60);
    }

    // Penalty box and goal
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;

    // Goal posts and bar
    ctx.fillStyle = '#e6f1ff';
    // left post
    ctx.fillRect(GOAL_X - POST_THICKNESS, GOAL_LINE_Y, POST_THICKNESS, 100);
    // right post
    ctx.fillRect(GOAL_X + GOAL_WIDTH, GOAL_LINE_Y, POST_THICKNESS, 100);
    // crossbar
    ctx.fillRect(GOAL_X - POST_THICKNESS, GOAL_LINE_Y, GOAL_WIDTH + POST_THICKNESS * 2, POST_THICKNESS);

    // Net hint
    ctx.strokeStyle = 'rgba(230,241,255,0.35)';
    for (let x = GOAL_X; x <= GOAL_X + GOAL_WIDTH; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, GOAL_LINE_Y + POST_THICKNESS);
      ctx.lineTo(x - 12, GOAL_LINE_Y + 100);
      ctx.stroke();
    }

    // Penalty spot
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(field.width / 2, field.height - 120, 3, 0, Math.PI * 2);
    ctx.fill();

    // Target zones
    targetZones.forEach((z) => {
      ctx.fillStyle = 'rgba(59,214,113,0.14)';
      ctx.strokeStyle = 'rgba(59,214,113,0.55)';
      ctx.lineWidth = 2;
      ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeRect(z.x, z.y, z.w, z.h);
    });
  }

  function drawKeeper() {
    // Move keeper laterally between posts
    keeper.x += keeper.vx * keeper.dir;
    const left = GOAL_X + 40;
    const right = GOAL_X + GOAL_WIDTH - 40;
    if (keeper.x - keeper.width / 2 < left) {
      keeper.x = left + keeper.width / 2; keeper.dir = 1;
    }
    if (keeper.x + keeper.width / 2 > right) {
      keeper.x = right - keeper.width / 2; keeper.dir = -1;
    }

    ctx.fillStyle = '#2aa8ff';
    ctx.fillRect(keeper.x - keeper.width / 2, keeper.y - keeper.height / 2, keeper.width, keeper.height);

    // gloves
    ctx.fillStyle = '#e6f1ff';
    ctx.fillRect(keeper.x - keeper.width / 2 - 12, keeper.y - 6, 12, 12);
    ctx.fillRect(keeper.x + keeper.width / 2, keeper.y - 6, 12, 12);
  }

  function updateBall(dt) {
    if (!ball.inPlay) return;

    // Apply drag to slow the ball
    ball.vx *= 0.992;
    ball.vy *= 0.992;

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Collision with posts/crossbar rectangle bounds
    const withinGoalX = ball.x > GOAL_X && ball.x < GOAL_X + GOAL_WIDTH;
    const hitCrossbar = ball.y - ball.r <= GOAL_LINE_Y + POST_THICKNESS && withinGoalX;
    const hitLeftPost = rectsOverlap(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2,
      GOAL_X - POST_THICKNESS, GOAL_LINE_Y, POST_THICKNESS, 100);
    const hitRightPost = rectsOverlap(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2,
      GOAL_X + GOAL_WIDTH, GOAL_LINE_Y, POST_THICKNESS, 100);

    if (hitCrossbar) {
      ball.vy = Math.abs(ball.vy) * 0.7; // bounce down
      ball.y = GOAL_LINE_Y + POST_THICKNESS + ball.r + 0.1;
    }
    if (hitLeftPost || hitRightPost) {
      ball.vx = -ball.vx * 0.7;
      ball.vy *= 0.9;
    }

    // Keeper save collision
    const keeperRect = { x: keeper.x - keeper.width / 2, y: keeper.y - keeper.height / 2, w: keeper.width, h: keeper.height };
    if (rectsOverlap(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2, keeperRect.x, keeperRect.y, keeperRect.w, keeperRect.h)) {
      ball.vy = Math.abs(ball.vy) * 0.9;
      ball.vx += (ball.x < keeper.x ? -1 : 1) * 1.5;
    }

    // Goal detection: ball crosses goal line into net area
    const isBetweenPosts = ball.x > GOAL_X && ball.x < GOAL_X + GOAL_WIDTH;
    const crossedLine = ball.y - ball.r <= GOAL_LINE_Y + 2;
    const insideNetDepth = ball.y < GOAL_LINE_Y + 90;

    if (ball.inPlay && isBetweenPosts && crossedLine) {
      // Determine bonus multiplier from target zones
      let mult = 1.0;
      for (const z of targetZones) {
        if (rectsOverlap(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2, z.x, z.y, z.w, z.h)) {
          mult = Math.max(mult, z.mult);
        }
      }

      // Consider it a goal if not saved by keeper rectangle at the moment of crossing
      if (!rectsOverlap(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2, keeperRect.x, keeperRect.y, keeperRect.w, keeperRect.h)) {
        const gained = Math.round(100 * mult);
        score += gained;
        flashText(`GOAL! +${gained}`, '#3bd671');
        ball.inPlay = false;
        // let the ball continue into the net
      }
    }

    // Stop conditions
    if (ball.y > field.height + 40 || (Math.abs(ball.vx) < 0.02 && Math.abs(ball.vy) < 0.02)) {
      ball.inPlay = false;
    }
  }

  function drawBall() {
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Aim guide
    if (input.dragging) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(ball.x + (ball.x - input.currX), ball.y + (ball.y - input.currY));
      ctx.stroke();

      const power = clamp(Math.hypot(input.currX - input.startX, input.currY - input.startY), 0, 180);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(20, field.height - 28, 160, 8);
      ctx.fillStyle = '#3bd671';
      ctx.fillRect(20, field.height - 28, (power / 180) * 160, 8);
    }
  }

  // Floating text feedback
  const floatTexts = [];
  function flashText(text, color) {
    floatTexts.push({ text, color, x: field.width / 2, y: GOAL_LINE_Y - 10, t: 0 });
    updateUI();
  }
  function drawFloatTexts(dt) {
    for (const ft of floatTexts) {
      ft.t += dt * 0.06;
      ft.y -= dt * 0.04;
    }
    while (floatTexts.length && floatTexts[0].t > 1.6) floatTexts.shift();

    ctx.font = '800 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const ft of floatTexts) {
      const alpha = Math.max(0, 1 - (ft.t / 1.6));
      ctx.fillStyle = withAlpha(ft.color, alpha);
      ctx.fillText(ft.text, ft.x, ft.y);
    }
  }

  function withAlpha(hex, a) {
    // hex like #rrggbb
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // Main loop
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(32, now - last);
    last = now;

    drawField();
    drawKeeper();
    updateBall(dt);
    drawBall();
    drawFloatTexts(dt);

    // End screen
    if (shots >= MAX_SHOTS && !ball.inPlay && !input.dragging) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, field.width, field.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 42px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', field.width / 2, field.height / 2 - 20);
      ctx.font = '600 24px Inter, sans-serif';
      ctx.fillText(`Final Score: ${score}`, field.width / 2, field.height / 2 + 20);
      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillText('Press R or click Restart', field.width / 2, field.height / 2 + 56);
    }

    requestAnimationFrame(loop);
  }

  updateUI();
  resetRound();
  requestAnimationFrame(loop);
})();