/* ═══════════════════════════════════════════════════════════════════════════
 * EXAMEN 5 — ⚡ VANG DE GOUDEN SNAAI (Quidditch — all-crew Zoeker-game)
 * Hogwarts aan Zee · Marbella 2026
 *
 * Bezit: #snitchGame (snippet). Enige global: window.snitchGameStart.
 * Stopt eigen rAF-loop op 'game:switch'. Alles null-checked.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── constanten ────────────────────────────────────────────────────────────
  const GAME_KEY = 'snitch';
  const ROUND_MS = 60000;
  const CATCH_RADIUS = 62;        // px: zó dichtbij blijven…
  const CATCH_HOLD_MS = 1000;     // …één volle seconde (de vangring vult)
  const RING_CIRC = 289.03;       // 2π·46 (viewBox-eenheden van de ring)
  const FRICTION = 0.95;          // de oude Kwal-engine, herboren als bezem
  const PLAYER_ACCEL = 0.42;
  const PLAYER_MAX = 7.5;
  const SNITCH_BASE_SPEED = 3.1;
  const STUN_MS = 2000;
  const REDUCED = typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CREW = [
    { naam: 'Treb',   emoji: '🧙‍♂️', ghost: false, lijn: 'Sorry, Schoolhoofd!' },
    { naam: 'Marc',   emoji: '👺', ghost: false, lijn: 'Marc vraagt midden in de lucht om 2FA.' },
    { naam: 'Derk',   emoji: '🐍', ghost: false, lijn: 'Derk sist iets onaardigs.' },
    { naam: 'Samuel', emoji: '🎃', ghost: false, lijn: 'Samuel gooit een pompoen naar je. Uit liefde.' },
    { naam: 'David',  emoji: '🥸', ghost: false, lijn: 'Davids snor wappert in je gezicht!' },
    { naam: 'Peeg',   emoji: '🦇', ghost: false, lijn: 'Peeg kijkt je oordelend aan. "Altijd."' },
    { naam: 'Jaap',   emoji: '👻', ghost: true,  lijn: 'Je vliegt dwars door Jaap heen. Hij vindt er wat van.' },
  ];

  const CATCH_LINES = [
    '⚡ VANGST! De tribune (het zwembad) juicht!',
    '🟡 Wéér een Snitch! Dumbledore knikt goedkeurend.',
    '🧹 Gevangen! the Daily Prophet wil een interview.',
    '⚡ VANGST! Marc controleert of het geen valse Snitch is.',
  ];

  const RANKS = [
    { min: 5, letter: 'U', naam: 'U — Zoeker van de Eeuw' },
    { min: 4, letter: 'B', naam: 'B — Aanvoerder Gryffindor' },
    { min: 3, letter: 'A', naam: 'A — Reserve-Zoeker' },
    { min: 2, letter: 'Z', naam: 'Z — Quidditch-enthousiast' },
    { min: 1, letter: 'Z', naam: 'Z — Slurk-sjouwer' },
    { min: 0, letter: 'T', naam: 'T — Bezemkastbewoner' },
  ];
  const TIER_POINTS = { U: 100, B: 75, A: 50, Z: 25, T: 0 };
  const WIN_TEXT = 'De wedstrijd is voorbij — en de cerveza is voor jou!';
  const FAIL_TEXT = 'De Snitch zit inmiddels in Marokko. Die kun je op heldere dagen zien vanaf het terras.';

  const BEUKER_SVG =
    '<svg viewBox="0 0 46 38" focusable="false" aria-hidden="true">' +
    '<g stroke="#9aa4b0" stroke-width="2" stroke-linecap="round" opacity=".5">' +
    '<line x1="2" y1="12" x2="12" y2="12"/><line x1="0" y1="19" x2="11" y2="19"/><line x1="3" y1="26" x2="12" y2="26"/></g>' +
    '<circle cx="28" cy="19" r="14" fill="#3a4048"/>' +
    '<circle cx="24" cy="14" r="9" fill="#6b7686" opacity=".55"/>' +
    '<circle cx="28" cy="19" r="14" fill="none" stroke="#15181d" stroke-width="2"/>' +
    '<circle cx="21" cy="19" r="1.6" fill="#15181d"/><circle cx="35" cy="19" r="1.6" fill="#15181d"/>' +
    '<circle cx="28" cy="12" r="1.6" fill="#15181d"/><circle cx="28" cy="26" r="1.6" fill="#15181d"/>' +
    '</svg>';

  const KAR_SVG =
    '<svg viewBox="0 0 130 84" focusable="false" aria-hidden="true">' +
    '<rect x="14" y="2" width="102" height="16" rx="3" fill="#f0e2c0" stroke="#b98c4f" stroke-width="1.5"/>' +
    '<text x="65" y="14" text-anchor="middle" font-size="11" font-weight="bold" fill="#3b2f1e">🍺 BOTERBIER HIER!</text>' +
    '<line x1="40" y1="18" x2="46" y2="40" stroke="#8a5a33" stroke-width="1.5"/>' +
    '<line x1="90" y1="18" x2="84" y2="40" stroke="#8a5a33" stroke-width="1.5"/>' +
    '<path d="M34 46 C20 34 6 34 2 42 C12 44 22 48 32 54 Z" fill="#f7ecc9" stroke="#caa94a"/>' +
    '<path d="M96 46 C110 34 124 34 128 42 C118 44 108 48 98 54 Z" fill="#f7ecc9" stroke="#caa94a"/>' +
    '<rect x="34" y="40" width="62" height="28" rx="4" fill="#6b4326" stroke="#4a2d17" stroke-width="2"/>' +
    '<line x1="34" y1="50" x2="96" y2="50" stroke="#4a2d17" stroke-width="1.5"/>' +
    '<line x1="55" y1="40" x2="55" y2="68" stroke="#4a2d17" stroke-width="1.5"/>' +
    '<line x1="76" y1="40" x2="76" y2="68" stroke="#4a2d17" stroke-width="1.5"/>' +
    '<rect x="42" y="24" width="14" height="17" rx="2" fill="#e9a13b" stroke="#8a5a1e" stroke-width="1.5"/>' +
    '<ellipse cx="49" cy="24" rx="8" ry="4" fill="#fff7e6"/>' +
    '<path d="M56 28 q7 3 0 9" fill="none" stroke="#8a5a1e" stroke-width="2"/>' +
    '<rect x="66" y="24" width="14" height="17" rx="2" fill="#e9a13b" stroke="#8a5a1e" stroke-width="1.5"/>' +
    '<ellipse cx="73" cy="24" rx="8" ry="4" fill="#fff7e6"/>' +
    '<path d="M80 28 q7 3 0 9" fill="none" stroke="#8a5a1e" stroke-width="2"/>' +
    '<circle cx="46" cy="72" r="8" fill="#2b2118" stroke="#caa94a" stroke-width="2"/>' +
    '<circle cx="84" cy="72" r="8" fill="#2b2118" stroke="#caa94a" stroke-width="2"/>' +
    '</svg>';

  const DEMENTOR_SVG =
    '<svg viewBox="0 0 70 100" focusable="false" aria-hidden="true">' +
    '<path d="M35 6 C18 10 14 30 16 48 C10 66 14 84 8 96 L18 88 L24 98 L32 88 L40 98 L48 88 L58 96 ' +
    'C52 80 58 62 54 46 C56 26 50 10 35 6 Z" fill="#0a0a12" opacity=".93"/>' +
    '<ellipse cx="35" cy="26" rx="9" ry="11" fill="#000"/>' +
    '<path d="M16 50 C10 52 6 56 4 62" fill="none" stroke="#9aa4b0" stroke-width="2" stroke-linecap="round" opacity=".8"/>' +
    '<path d="M4 62 l-3 -2 M4 62 l-1 -4 M4 62 l2 -4" stroke="#9aa4b0" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>' +
    '<path d="M20 96 q4 4 0 8 M34 98 q3 4 0 7 M48 96 q4 4 1 8" fill="none" stroke="#1a1a2e" stroke-width="2" opacity=".5"/>' +
    '</svg>';

  // ── DOM-handles (init vult ze; alles kan null zijn) ──────────────────────
  let cont, area, field, playerEl, ballEl, ringFill, stunFx, dimEl, toastEl,
    statusEl, resultEl, gradeEl, rankEl, resultTextEl, resultStatsEl,
    puntenNoteEl, scoreEl, catchesEl, timerEl, timerPill;

  // ── state ─────────────────────────────────────────────────────────────────
  const keys = { left: false, right: false, up: false, down: false };
  const S = {
    running: false,
    raf: null,
    lastFrame: 0,
    endAt: 0,
    frozen: null,          // resterende ms wanneer tab verborgen is
    W: 800, H: 450,
    score: 0,
    catches: 0,
    ring: 0,               // 0..1 vangring
    stunUntil: 0,
    graceUntil: 0,
    finger: null,          // {x,y} sleepdoel
    player: { x: 200, y: 250, vx: 0, vy: 0 },
    snitch: { x: 500, y: 150, vx: 0, vy: 0, wpX: 400, wpY: 200, wpUntil: 0, dashUntil: 0, hiddenUntil: 0 },
    crew: [],
    beukers: [],
    kar: null,
    karDone: false,
    dementor: null,
    dimUntil: 0,
    nextBludgerAt: 0,
    nextDementorAt: 0,
    lastToastAt: 0,
    lastBumpAt: 0,
    tenSecWarned: false,
    shownTimer: -1,
  };

  // ── helpers ───────────────────────────────────────────────────────────────
  const now = () => performance.now();
  const rand = (a, b) => a + Math.random() * (b - a);
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  function isVisibleGame() {
    return !!cont && getComputedStyle(cont).display !== 'none';
  }

  function measure() {
    if (!area) return;
    const r = area.getBoundingClientRect();
    if (r.width > 0) { S.W = r.width; S.H = r.height; }
  }

  function setPos(el, x, y) {
    if (el) el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  }

  function toast(msg, force) {
    if (!toastEl) return;
    const t = now();
    if (!force && t - S.lastToastAt < 350) return;
    S.lastToastAt = t;
    toastEl.textContent = msg;
    // reflow-truc zodat de animatie opnieuw start (oude combo-trick)
    toastEl.classList.remove('snitch-toast-show');
    void toastEl.offsetWidth;
    toastEl.classList.add('snitch-toast-show');
  }

  function floatText(txt, x, y) {
    if (!area) return;
    const el = document.createElement('span');
    el.className = 'snitch-float';
    el.textContent = txt;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    area.appendChild(el);
    setTimeout(() => { el.remove(); }, 1150);
  }

  function goldBurst(x, y) {
    if (!area || REDUCED) return;
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('span');
      s.className = 'snitch-spark';
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      const a = (i / 8) * Math.PI * 2;
      s.style.setProperty('--sdx', Math.round(Math.cos(a) * rand(26, 46)) + 'px');
      s.style.setProperty('--sdy', Math.round(Math.sin(a) * rand(26, 46)) + 'px');
      area.appendChild(s);
      setTimeout(() => { s.remove(); }, 750);
    }
  }

  function shakeArea() {
    if (!area || REDUCED) return;
    area.classList.remove('snitch-shake');
    void area.offsetWidth;
    area.classList.add('snitch-shake');
    setTimeout(() => { if (area) area.classList.remove('snitch-shake'); }, 500);
  }

  function updateHud() {
    if (scoreEl) scoreEl.textContent = String(S.score);
    if (catchesEl) catchesEl.textContent = String(S.catches);
  }

  function updateTimer(remaining) {
    const secs = Math.max(0, Math.ceil(remaining / 1000));
    if (secs !== S.shownTimer) {
      S.shownTimer = secs;
      if (timerEl) timerEl.textContent = String(secs);
      if (timerPill) timerPill.classList.toggle('snitch-urgent', secs <= 10 && S.running);
    }
  }

  // ── opbouw dynamische wezens ─────────────────────────────────────────────
  function buildCrew() {
    if (!field) return;
    S.crew = [];
    CREW.forEach((m) => {
      const el = document.createElement('div');
      el.className = 'snitch-crew' + (m.ghost ? ' snitch-ghost' : '');
      el.innerHTML =
        '<span class="snitch-crew-broom">🧹</span>' +
        '<span class="snitch-crew-face">' + m.emoji + '</span>' +
        '<span class="snitch-crew-name">' + m.naam + '</span>';
      field.appendChild(el);
      S.crew.push({
        el, naam: m.naam, ghost: m.ghost, lijn: m.lijn,
        x: rand(60, S.W - 60), y: rand(60, S.H - 90),
        vx: rand(-0.55, 0.55), vy: rand(-0.4, 0.4),
      });
    });
  }

  function spawnBludger() {
    if (!field || S.beukers.length >= 3) return;
    const el = document.createElement('div');
    el.className = 'snitch-beuker';
    el.innerHTML = BEUKER_SVG;
    field.appendChild(el);
    const fromLeft = Math.random() < 0.5;
    const speed = rand(4, 5.6) + S.catches * 0.25;
    const y = rand(50, S.H - 70);
    S.beukers.push({
      el,
      x: fromLeft ? -50 : S.W + 50,
      y,
      vx: fromLeft ? speed : -speed,
      vy: rand(-0.8, 0.8),
    });
    if (!fromLeft && el.firstElementChild) {
      el.firstElementChild.style.transform = 'translate(-50%,-50%) scaleX(-1)';
    }
  }

  function spawnKar() {
    if (!field || S.karDone) return;
    S.karDone = true;
    const el = document.createElement('div');
    el.className = 'snitch-kar';
    el.innerHTML = KAR_SVG;
    field.appendChild(el);
    S.kar = { el, x: -80, baseY: S.H * 0.33, vx: 2.6, collected: false, born: now() };
    toast('🍺 Daar is de bierkar! Raak hem voor +25!', true);
  }

  function spawnDementor() {
    if (!field || S.dementor) return;
    const el = document.createElement('div');
    el.className = 'snitch-dementor';
    el.innerHTML = DEMENTOR_SVG;
    field.appendChild(el);
    const fromLeft = Math.random() < 0.5;
    S.dementor = {
      el,
      x: fromLeft ? -50 : S.W + 50,
      y: rand(70, S.H * 0.5),
      vx: fromLeft ? 1.5 : -1.5,
    };
    S.dimUntil = now() + 3600;
    toast('🌫️ Dementor! Denk aan iets vrolijks (cerveza).', true);
  }

  function clearField() {
    if (field) field.innerHTML = '';
    S.crew = [];
    S.beukers = [];
    S.kar = null;
    S.dementor = null;
    S.dimUntil = 0;
    if (dimEl) {
      dimEl.classList.remove('snitch-dim-on');
      dimEl.style.background = '';
    }
  }

  // ── kernloop ─────────────────────────────────────────────────────────────
  function loop(t) {
    if (!S.running) return;
    const dtms = Math.min(50, Math.max(4, t - S.lastFrame));
    S.lastFrame = t;
    const dtn = dtms / 16.667;           // 1 = één 60fps-frame
    const nu = now();
    const remaining = S.endAt - nu;

    updateTimer(remaining);
    if (remaining <= 0) { endRound(); return; }
    if (!S.tenSecWarned && remaining <= 10000) {
      S.tenSecWarned = true;
      toast('⏳ Nog 10 seconden, Zoeker!', true);
    }

    const stunned = nu < S.stunUntil;
    if (!stunned && playerEl && playerEl.classList.contains('snitch-stunned')) {
      playerEl.classList.remove('snitch-stunned');
      if (stunFx) stunFx.hidden = true;
    }

    // ── speler: bezemfysica (impuls + wrijving) ──
    const P = S.player;
    if (!stunned) {
      let ax = 0, ay = 0;
      if (keys.left) ax -= 1;
      if (keys.right) ax += 1;
      if (keys.up) ay -= 1;
      if (keys.down) ay += 1;
      if (ax !== 0 && ay !== 0) { ax *= 0.7071; ay *= 0.7071; }
      if (S.finger) {
        const dx = S.finger.x - P.x, dy = S.finger.y - P.y;
        const d = Math.hypot(dx, dy);
        if (d > 8) { ax = dx / d; ay = dy / d; }
      }
      P.vx += ax * PLAYER_ACCEL * dtn * (S.finger ? 1.35 : 1);
      P.vy += ay * PLAYER_ACCEL * dtn * (S.finger ? 1.35 : 1);
    }
    const fr = Math.pow(stunned ? 0.9 : FRICTION, dtn);
    P.vx *= fr; P.vy *= fr;
    const spd = Math.hypot(P.vx, P.vy);
    if (spd > PLAYER_MAX) { P.vx = (P.vx / spd) * PLAYER_MAX; P.vy = (P.vy / spd) * PLAYER_MAX; }
    P.x += P.vx * dtn; P.y += P.vy * dtn;
    if (P.x < 26) { P.x = 26; P.vx *= -0.35; }
    if (P.x > S.W - 26) { P.x = S.W - 26; P.vx *= -0.35; }
    if (P.y < 26) { P.y = 26; P.vy *= -0.35; }
    if (P.y > S.H - 30) { P.y = S.H - 30; P.vy *= -0.35; }
    if (playerEl) {
      setPos(playerEl, P.x, P.y);
      if (Math.abs(P.vx) > 0.6) playerEl.classList.toggle('snitch-flip', P.vx < 0);
    }

    // ── Snitch-AI: waypoints + spurts + ontwijken ──
    const B = S.snitch;
    const ballVisible = nu >= B.hiddenUntil;
    if (ballEl) ballEl.classList.toggle('snitch-gone', !ballVisible);
    if (ballVisible) {
      if (B.hiddenUntil > 0 && B.respawnPending) {
        // net gerespawnd: ver van de speler neerzetten
        B.respawnPending = false;
        let bx, by, tries = 0;
        do {
          bx = rand(50, S.W - 50); by = rand(50, S.H - 70);
          tries++;
        } while (dist(bx, by, P.x, P.y) < Math.min(S.W, S.H) * 0.45 && tries < 12);
        B.x = bx; B.y = by; B.vx = 0; B.vy = 0; B.wpUntil = 0;
      }
      const maxSpd = Math.min(5.8, SNITCH_BASE_SPEED * (1 + 0.14 * S.catches));
      if (nu > B.wpUntil || dist(B.x, B.y, B.wpX, B.wpY) < 34) {
        B.wpX = rand(44, S.W - 44);
        B.wpY = rand(44, S.H - 66);
        B.wpUntil = nu + rand(650, 1500);
        if (Math.random() < 0.2) B.dashUntil = nu + 300;   // spurtje!
      }
      const dash = nu < B.dashUntil ? 1.6 : 1;
      let dx = B.wpX - B.x, dy = B.wpY - B.y;
      let d = Math.hypot(dx, dy) || 1;
      let dvx = (dx / d) * maxSpd * dash;
      let dvy = (dy / d) * maxSpd * dash;
      const pd = dist(B.x, B.y, P.x, P.y);
      if (pd < 130 && pd > 0.001) {
        const evade = (1 - pd / 130) * 2.8;
        dvx += ((B.x - P.x) / pd) * evade;
        dvy += ((B.y - P.y) / pd) * evade;
      }
      const steer = 1 - Math.pow(0.9, dtn);
      B.vx += (dvx - B.vx) * steer;
      B.vy += (dvy - B.vy) * steer;
      B.x += B.vx * dtn; B.y += B.vy * dtn;
      if (B.x < 30) { B.x = 30; B.vx = Math.abs(B.vx); B.wpUntil = 0; }
      if (B.x > S.W - 30) { B.x = S.W - 30; B.vx = -Math.abs(B.vx); B.wpUntil = 0; }
      if (B.y < 26) { B.y = 26; B.vy = Math.abs(B.vy); B.wpUntil = 0; }
      if (B.y > S.H - 40) { B.y = S.H - 40; B.vy = -Math.abs(B.vy); B.wpUntil = 0; }
      setPos(ballEl, B.x, B.y);
    }

    // ── vangring ──
    const inRange = ballVisible && !stunned && dist(P.x, P.y, B.x, B.y) < CATCH_RADIUS;
    if (inRange) S.ring = Math.min(1, S.ring + dtms / CATCH_HOLD_MS);
    else S.ring = Math.max(0, S.ring - dtms / 500);
    if (ballEl) ballEl.classList.toggle('snitch-near', inRange);
    if (playerEl) playerEl.classList.toggle('snitch-ringing', S.ring > 0.02);
    if (ringFill) ringFill.style.strokeDashoffset = String(RING_CIRC * (1 - S.ring));
    if (S.ring >= 1) doCatch();

    // ── crew op bezems ──
    for (const c of S.crew) {
      c.x += c.vx * dtn; c.y += c.vy * dtn;
      if (c.x < 40 || c.x > S.W - 40) c.vx *= -1;
      if (c.y < 42 || c.y > S.H - 70) c.vy *= -1;
      setPos(c.el, c.x, c.y);
      const d = dist(c.x, c.y, P.x, P.y);
      if (!c.ghost && d < 42) {
        const push = 3.2 / Math.max(d, 12);
        P.vx += (P.x - c.x) * push; P.vy += (P.y - c.y) * push;
        c.vx += (c.x - P.x) * push * 0.15; c.vy += (c.y - P.y) * push * 0.15;
        if (nu - S.lastBumpAt > 2500) { S.lastBumpAt = nu; toast(c.lijn); }
      } else if (c.ghost && d < 34 && nu - S.lastBumpAt > 4000) {
        S.lastBumpAt = nu; toast(c.lijn);
      }
    }

    // ── Bludgers ──
    if (nu >= S.nextBludgerAt) {
      spawnBludger();
      S.nextBludgerAt = nu + Math.max(3500, 7000 - S.catches * 600);
    }
    for (let i = S.beukers.length - 1; i >= 0; i--) {
      const b = S.beukers[i];
      b.x += b.vx * dtn; b.y += b.vy * dtn;
      setPos(b.el, b.x, b.y);
      if (b.x < -70 || b.x > S.W + 70) {
        b.el.remove();
        S.beukers.splice(i, 1);
        continue;
      }
      if (!stunned && nu > S.graceUntil && dist(b.x, b.y, P.x, P.y) < 34) hitByBludger();
    }

    // ── bierkar (halverwege) ──
    if (!S.karDone && remaining <= ROUND_MS / 2) spawnKar();
    if (S.kar) {
      const k = S.kar;
      k.x += k.vx * dtn;
      const y = k.baseY + Math.sin((nu - k.born) / 320) * 14;
      setPos(k.el, k.x, y);
      if (!k.collected && dist(k.x, y, P.x, P.y) < 52) {
        k.collected = true;
        S.score += 25;
        updateHud();
        floatText('+25 🍺', k.x, y - 30);
        toast('🍺 BOTERBIER HIER! Hydrateren is key. +25', true);
        goldBurst(k.x, y);
        k.el.style.opacity = '0.35';
      }
      if (k.x > S.W + 90) { k.el.remove(); S.kar = null; }
    }

    // ── Dementor + dim ──
    if (nu >= S.nextDementorAt) {
      spawnDementor();
      S.nextDementorAt = nu + 20000;
    }
    if (S.dementor) {
      const dm = S.dementor;
      dm.x += dm.vx * dtn;
      setPos(dm.el, dm.x, dm.y);
      if (dm.x < -70 || dm.x > S.W + 70) { dm.el.remove(); S.dementor = null; }
    }
    if (dimEl) {
      const dimOn = nu < S.dimUntil;
      dimEl.classList.toggle('snitch-dim-on', dimOn);
      if (dimOn) {
        // zaklamp-effect: alleen rond de Zoeker blijft het licht
        dimEl.style.background = 'radial-gradient(circle at ' + P.x.toFixed(0) + 'px ' +
          P.y.toFixed(0) + 'px, rgba(4,4,12,0) 70px, rgba(4,4,12,.93) 210px)';
      }
    }

    S.raf = requestAnimationFrame(loop);
  }

  // ── gebeurtenissen in het spel ───────────────────────────────────────────
  function doCatch() {
    const B = S.snitch;
    S.catches += 1;
    S.score += 150;
    S.ring = 0;
    updateHud();
    floatText('+150 ⚡', B.x, B.y - 26);
    goldBurst(B.x, B.y);
    toast(CATCH_LINES[(S.catches - 1) % CATCH_LINES.length], true);
    B.hiddenUntil = now() + Math.max(400, 1400 - S.catches * 160);
    B.respawnPending = true;
    if (playerEl) playerEl.classList.remove('snitch-ringing');
    if (ringFill) ringFill.style.strokeDashoffset = String(RING_CIRC);
  }

  function hitByBludger() {
    S.stunUntil = now() + STUN_MS;
    S.graceUntil = S.stunUntil + 800;
    S.ring = 0;
    if (ringFill) ringFill.style.strokeDashoffset = String(RING_CIRC);
    if (playerEl) {
      playerEl.classList.add('snitch-stunned');
      playerEl.classList.remove('snitch-ringing');
    }
    if (stunFx) stunFx.hidden = false;
    toast('🏏 BEUKER! Twee seconden sterretjes kijken.', true);
    shakeArea();
  }

  function computeRank() {
    for (const r of RANKS) if (S.catches >= r.min) return r;
    return RANKS[RANKS.length - 1];
  }

  function savePunten(tierPts) {
    let best = tierPts, improved = false;
    try {
      const obj = JSON.parse(localStorage.getItem('zweinstein_punten') || '{}') || {};
      const prev = Number(obj[GAME_KEY] || 0);
      if (tierPts > prev) {
        obj[GAME_KEY] = tierPts;
        localStorage.setItem('zweinstein_punten', JSON.stringify(obj));
        improved = tierPts > 0;
      } else {
        best = prev;
      }
    } catch (err) { /* localStorage niet beschikbaar — geen ramp */ }
    try {
      document.dispatchEvent(new CustomEvent('punten:update', {
        detail: { game: GAME_KEY, points: best },
      }));
    } catch (err) { /* stil */ }
    return { best, improved };
  }

  function endRound() {
    stopLoop();
    updateTimer(0);
    const rank = computeRank();
    const tierPts = TIER_POINTS[rank.letter] || 0;
    const punten = savePunten(tierPts);

    if (gradeEl) {
      gradeEl.textContent = rank.letter;
      gradeEl.classList.toggle('snitch-grade-T', rank.letter === 'T');
      // stempel-animatie herstarten
      gradeEl.style.animation = 'none';
      void gradeEl.offsetWidth;
      gradeEl.style.animation = '';
    }
    if (rankEl) rankEl.textContent = rank.naam;
    if (resultTextEl) {
      /* S.score bevat óók de +25 bierkar-bonus — dezelfde waarde als
         in de statsregel hieronder, dus geen tegenstrijdige uitslag */
      resultTextEl.textContent = S.catches >= 3
        ? S.score + ' punten! ' + WIN_TEXT
        : FAIL_TEXT;
    }
    if (resultStatsEl) resultStatsEl.textContent = 'Vangsten: ' + S.catches + ' · Punten: ' + S.score;
    if (puntenNoteEl) {
      if (punten.improved) puntenNoteEl.textContent = '🏆 +' + tierPts + ' House Points in het Puntenglas!';
      else if (punten.best === 0) puntenNoteEl.textContent = '0 House Points. Het Puntenglas blijft ongemakkelijk leeg.';
      else puntenNoteEl.textContent = 'Je beste resultaat (' + punten.best + ' House Points) blijft staan.';
    }
    if (resultEl) resultEl.hidden = false;
    if (statusEl) statusEl.hidden = true;
  }

  // ── start/stop ───────────────────────────────────────────────────────────
  function stopLoop() {
    S.running = false;
    window.__activeGameRunning = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; }
    keys.left = keys.right = keys.up = keys.down = false;
    S.finger = null;
    S.frozen = null;
    if (playerEl) {
      playerEl.classList.remove('snitch-stunned', 'snitch-ringing');
    }
    if (stunFx) stunFx.hidden = true;
    if (dimEl) { dimEl.classList.remove('snitch-dim-on'); dimEl.style.background = ''; }
    if (timerPill) timerPill.classList.remove('snitch-urgent');
  }

  function startGame() {
    if (!area || !playerEl || !ballEl) return;
    stopLoop();
    measure();
    clearField();
    buildCrew();

    S.score = 0;
    S.catches = 0;
    S.ring = 0;
    S.stunUntil = 0;
    S.graceUntil = 0;
    S.karDone = false;
    S.tenSecWarned = false;
    S.shownTimer = -1;
    S.player = { x: S.W * 0.28, y: S.H * 0.55, vx: 0, vy: 0 };
    S.snitch = {
      x: S.W * 0.7, y: S.H * 0.3, vx: 0, vy: 0,
      wpX: S.W * 0.5, wpY: S.H * 0.4, wpUntil: 0, dashUntil: 0,
      hiddenUntil: 0, respawnPending: false,
    };
    setPos(playerEl, S.player.x, S.player.y);
    setPos(ballEl, S.snitch.x, S.snitch.y);
    if (ballEl) ballEl.classList.remove('snitch-gone', 'snitch-near');
    if (ringFill) ringFill.style.strokeDashoffset = String(RING_CIRC);
    updateHud();

    const t = now();
    S.endAt = t + ROUND_MS;
    S.nextBludgerAt = t + 6000;
    S.nextDementorAt = t + 15000;
    S.lastToastAt = 0;
    S.lastBumpAt = 0;
    updateTimer(ROUND_MS);

    if (resultEl) resultEl.hidden = true;
    if (statusEl) statusEl.hidden = true;

    S.running = true;
    window.__activeGameRunning = true;
    try { area.focus({ preventScroll: true }); } catch (err) { /* oudere browsers */ }
    S.lastFrame = t;
    S.raf = requestAnimationFrame(loop);
  }

  function parkVisuals() {
    // rustpositie vóór de eerste start / na een tab-switch
    measure();
    S.player.x = S.W * 0.28; S.player.y = S.H * 0.55;
    S.snitch.x = S.W * 0.68; S.snitch.y = S.H * 0.32;
    setPos(playerEl, S.player.x, S.player.y);
    setPos(ballEl, S.snitch.x, S.snitch.y);
    if (ballEl) ballEl.classList.remove('snitch-gone');
  }

  function backToReady() {
    stopLoop();
    if (resultEl) resultEl.hidden = true;
    if (statusEl) statusEl.hidden = false;
  }

  // ── input ─────────────────────────────────────────────────────────────────
  const KEYMAP = {
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
  };

  function onKeyDown(e) {
    if (!isVisibleGame()) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    /* idle-start alleen als het speelveld zélf focus heeft — anders start
       de spatiebalk (paginascroll) een onzichtbare ronde onder de vouw */
    if (!S.running && (e.key === ' ' || e.key === 'Enter') && document.activeElement === area) {
      e.preventDefault();
      startGame();
      return;
    }
    const dir = KEYMAP[e.key];
    if (dir && S.running) {
      keys[dir] = true;
      e.preventDefault();
    } else if (e.key === ' ' && S.running) {
      e.preventDefault();   // geen paginascroll tijdens de wedstrijd
    }
  }

  function onKeyUp(e) {
    const dir = KEYMAP[e.key];
    if (dir) keys[dir] = false;
  }

  function wireHoldButton(el, dir) {
    if (!el) return;
    const on = (e) => { e.preventDefault(); keys[dir] = true; };
    const off = () => { keys[dir] = false; };
    el.addEventListener('touchstart', on, { passive: false });
    el.addEventListener('touchend', off);
    el.addEventListener('touchcancel', off);
    el.addEventListener('mousedown', on);
    el.addEventListener('mouseup', off);
    el.addEventListener('mouseleave', off);
  }

  function fingerFromTouch(touch) {
    const r = area.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(r.width, touch.clientX - r.left)),
      y: Math.max(0, Math.min(r.height, touch.clientY - r.top)),
    };
  }

  function wireArea() {
    area.addEventListener('click', (e) => {
      if (S.running) return;
      if (e.target && e.target.closest && e.target.closest('#snitchResult')) return;
      startGame();
    });

    area.addEventListener('touchstart', (e) => {
      if (!S.running) return;   // start loopt via click
      S.finger = fingerFromTouch(e.touches[0]);
      e.preventDefault();
    }, { passive: false });

    // preventDefault op touchmove ALLEEN binnen eigen area en ALLEEN tijdens spel
    area.addEventListener('touchmove', (e) => {
      if (!S.running) return;
      S.finger = fingerFromTouch(e.touches[0]);
      e.preventDefault();
    }, { passive: false });

    const clearFinger = () => { S.finger = null; };
    area.addEventListener('touchend', clearFinger);
    area.addEventListener('touchcancel', clearFinger);
  }

  // ── init ─────────────────────────────────────────────────────────────────
  function init() {
    cont = document.getElementById('snitchGame');
    if (!cont) return;   // snippet ontbreekt: niets doen, pagina blijft heel

    area = document.getElementById('snitchArea');
    field = document.getElementById('snitchField');
    playerEl = document.getElementById('snitchPlayer');
    ballEl = document.getElementById('snitchBall');
    ringFill = document.getElementById('snitchRingFill');
    stunFx = playerEl ? playerEl.querySelector('.snitch-stun-fx') : null;
    dimEl = document.getElementById('snitchDim');
    toastEl = document.getElementById('snitchToast');
    statusEl = document.getElementById('snitchStatus');
    resultEl = document.getElementById('snitchResult');
    gradeEl = document.getElementById('snitchGrade');
    rankEl = document.getElementById('snitchRank');
    resultTextEl = document.getElementById('snitchResultText');
    resultStatsEl = document.getElementById('snitchResultStats');
    puntenNoteEl = document.getElementById('snitchPuntenNote');
    scoreEl = document.getElementById('snitchScore');
    catchesEl = document.getElementById('snitchCatches');
    timerEl = document.getElementById('snitchTimer');
    timerPill = timerEl ? timerEl.closest('.snitch-pill-timer') : null;
    if (!area) return;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    wireHoldButton(document.getElementById('snitchLeftBtn'), 'left');
    wireHoldButton(document.getElementById('snitchRightBtn'), 'right');
    wireHoldButton(document.getElementById('snitchUpBtn'), 'up');
    wireHoldButton(document.getElementById('snitchDownBtn'), 'down');
    wireArea();

    // andere game actief → eigen loop stoppen; terug naar snitch → rustbeeld
    document.addEventListener('game:switch', (e) => {
      const key = e && e.detail ? e.detail.key : null;
      if (key === GAME_KEY) {
        if (!S.running) parkVisuals();
        return;
      }
      backToReady();
    });

    window.addEventListener('resize', () => {
      measure();
      const clamp = (o) => {
        o.x = Math.max(26, Math.min(S.W - 26, o.x));
        o.y = Math.max(26, Math.min(S.H - 30, o.y));
      };
      clamp(S.player); clamp(S.snitch);
      if (!S.running) parkVisuals();
    });

    window.addEventListener('blur', () => {
      keys.left = keys.right = keys.up = keys.down = false;
    });

    // tab verborgen: klok bevriezen zodat de ronde niet in je rug doorloopt
    document.addEventListener('visibilitychange', () => {
      if (!S.running) return;
      if (document.hidden) {
        S.frozen = S.endAt - now();
      } else if (S.frozen != null) {
        const shift = (now() + S.frozen) - S.endAt;
        S.endAt += shift;
        S.nextBludgerAt += shift;
        S.nextDementorAt += shift;
        S.snitch.hiddenUntil += shift;
        S.frozen = null;
      }
    });

    parkVisuals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // enige global — replay-knop in de snippet gebruikt hem via onclick
  window.snitchGameStart = startGame;
})();
