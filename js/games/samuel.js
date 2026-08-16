/* ============================================================
   🎃 Samuels Schreeuwende Oogst — Examen 1 (Kruidenkunde)
   Hogwarts aan Zee · Marbella 2026 · accent #e67e22
   Eén global: window.samuelGameStart
   ============================================================ */
(function () {
  'use strict';

  // ---- Constantes ------------------------------------------------
  const ROUND_SECONDS = 45;
  const SPAWN_START_MS = 1200;   // spawn-interval bij start
  const SPAWN_END_MS = 500;      // spawn-interval aan het einde (ramp)
  const PUMPKIN_GROW_MS = 1500;  // onrijp -> rijp
  const PUMPKIN_RIPE_MS = 2600;  // rijp blijft staan, daarna zakt hij terug
  const MAND_LIFE_MS = 2600;     // mandragora blijft zichtbaar
  const GNOME_LIFE_MS = 1500;    // kaboutervenster (1,5 s)
  const STUN_MS = 1000;          // gil-verdoving

  const KEY_TO_POT = {
    q: 0, w: 1, e: 2, a: 3, s: 4, d: 5, z: 6, x: 7, c: 8,
    '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8
  };

  const GRADES = [
    { min: 400, letter: 'U', word: 'Uitmuntend', punten: 100, rang: 'Sleutelbewaarder en Terreinknecht van Hogwarts' },
    { min: 250, letter: 'B', word: 'Boven Verwachting', punten: 75, rang: 'Pompoenprins van Twente' },
    { min: 150, letter: 'A', word: 'Acceptabel', punten: 50, rang: 'Gediplomeerd Kruidenkundige' },
    { min: 75, letter: 'Z', word: 'Zwak', punten: 25, rang: 'Boerenknecht (stagiair)' },
    { min: -Infinity, letter: 'T', word: 'Trol', punten: 0, rang: 'Trol met een troffel' }
  ];
  const WIN_TEXT = 'Hagrid huilt van trots in een zakdoek ter grootte van een tafellaken!';
  const FAIL_TEXT = "De Mandragora's schreeuwen harder dan jij scoort.";

  const SPREUKEN_OOGST = [
    "Da's een beste, jong!",
    'Kiek an — pompoen van formaat!',
    'Die Spaanse stellen niks veur!',
    'Mooi wark, kearl!',
    'Bijna zo groot as in Twente!'
  ];
  const SPREUKEN_GIL = ['OORKLEPPEN, JONG!', 'Ik zei toch: oorkleppen!', 'Nee toch, niet weer...'];
  const SPREUKEN_GNOOM = ['Ontgnoomd as een prof!', 'Gooien dat ding!'];
  const SPREUK_GEJAT = 'Mien pompoen!';

  // ---- SVG-entiteiten (met liefde getekend) ----------------------
  const SVG_POMPOEN =
    '<svg viewBox="0 0 72 62" aria-hidden="true">' +
    '<path d="M38 14 Q36 5 42 3 Q40 9 42 14 Z" fill="#6a8f3c" stroke="#4c6b28" stroke-width="1.5"/>' +
    '<path d="M42 8 q9 -6 11 2 q-7 -1 -8 5" fill="none" stroke="#6a8f3c" stroke-width="2" stroke-linecap="round"/>' +
    '<ellipse cx="18" cy="38" rx="15" ry="19" fill="#cf6217" stroke="#8f4507" stroke-width="2"/>' +
    '<ellipse cx="54" cy="38" rx="15" ry="19" fill="#cf6217" stroke="#8f4507" stroke-width="2"/>' +
    '<ellipse cx="36" cy="39" rx="18" ry="21" fill="#e67e22" stroke="#8f4507" stroke-width="2"/>' +
    '<path d="M28 22 Q24 39 28 57 M44 22 Q48 39 44 57" fill="none" stroke="#c96a1b" stroke-width="2"/>' +
    '<ellipse cx="29" cy="29" rx="4.5" ry="8" fill="#f5b041" opacity=".45"/>' +
    '<g class="samuel-pompoen-grin">' +
    '<polygon points="26,33 33,36 26,40" fill="#3c1c05"/>' +
    '<polygon points="46,33 39,36 46,40" fill="#3c1c05"/>' +
    '<path d="M26 46 L30 49 L33 45 L36 49 L39 45 L42 49 L46 46 Q36 55 26 46 Z" fill="#3c1c05"/>' +
    '</g>' +
    '</svg>';

  const SVG_MAND =
    '<svg viewBox="0 0 60 74" aria-hidden="true">' +
    '<g class="samuel-mand-rings">' +
    '<path d="M8 26 Q4 18 10 12" fill="none" stroke="#cfd8e3" stroke-width="2.5" stroke-linecap="round"/>' +
    '<path d="M52 26 Q56 18 50 12" fill="none" stroke="#cfd8e3" stroke-width="2.5" stroke-linecap="round"/>' +
    '<path d="M6 34 Q0 24 8 14" fill="none" stroke="#cfd8e3" stroke-width="2" stroke-linecap="round" opacity=".6"/>' +
    '<path d="M54 34 Q60 24 52 14" fill="none" stroke="#cfd8e3" stroke-width="2" stroke-linecap="round" opacity=".6"/>' +
    '</g>' +
    '<g class="samuel-mand-leaves">' +
    '<path d="M30 20 Q20 4 10 8 Q18 14 27 21" fill="#3f9b4f" stroke="#2e7d3f" stroke-width="1.5"/>' +
    '<path d="M30 20 Q40 4 50 8 Q42 14 33 21" fill="#2e8f4a" stroke="#256f38" stroke-width="1.5"/>' +
    '<path d="M29 20 Q28 6 31 2 Q35 9 31 20" fill="#57b86a" stroke="#2e7d3f" stroke-width="1.5"/>' +
    '</g>' +
    '<path d="M21 28 Q16 18 30 17 Q44 18 39 28 Q49 32 46 46 Q43 60 30 62 Q17 60 14 46 Q11 32 21 28 Z" fill="#d6b57e" stroke="#8a6b3f" stroke-width="2"/>' +
    '<path d="M16 42 Q6 46 9 55" fill="none" stroke="#c3a06a" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M44 42 Q54 46 51 55" fill="none" stroke="#c3a06a" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M25 61 L23 70 M35 61 L37 70" stroke="#c3a06a" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path d="M20 50 q4 3 8 1 M32 52 q4 1 8 -2 M22 33 q3 -2 5 0" fill="none" stroke="#b08c53" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M21 33 l7 3 M39 33 l-7 3" stroke="#5a4526" stroke-width="2.2" stroke-linecap="round"/>' +
    '<circle cx="24" cy="39" r="1.8" fill="#3c2d16"/><circle cx="36" cy="39" r="1.8" fill="#3c2d16"/>' +
    '<path class="samuel-mand-mouth-dicht" d="M25 48 Q30 44.5 35 48" fill="none" stroke="#5a4526" stroke-width="2.2" stroke-linecap="round"/>' +
    '<g class="samuel-mand-mouth-gil">' +
    '<ellipse cx="30" cy="49" rx="6.5" ry="7.5" fill="#4a2415" stroke="#5a4526" stroke-width="1.5"/>' +
    '<ellipse cx="30" cy="53" rx="3" ry="2" fill="#c0392b"/>' +
    '</g>' +
    '</svg>';

  const SVG_GNOOM =
    '<svg viewBox="0 0 54 76" aria-hidden="true">' +
    '<path d="M20 20 Q19 4 33 5 Q28 9 33 19 Z" fill="#b03a2e" stroke="#7e281f" stroke-width="1.5"/>' +
    '<path d="M16 24 Q11 36 17 43 Q23 49 33 45 Q42 41 40 28 Q38 17 28 17 Q19 17 16 24 Z" fill="#c8a06a" stroke="#8a6b3f" stroke-width="2"/>' +
    '<circle cx="20" cy="24" r="1.5" fill="#b8905a"/><circle cx="36" cy="35" r="2" fill="#b8905a"/>' +
    '<path d="M20 27 l14 -2" stroke="#5a4526" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="23" cy="30" r="1.6" fill="#33250f"/><circle cx="32" cy="29" r="1.6" fill="#33250f"/>' +
    '<ellipse cx="27" cy="34" rx="5" ry="6" fill="#b3814e" stroke="#8a6b3f" stroke-width="1.5"/>' +
    '<path d="M20 42 q1 6 4 8 M26 44 q0 6 2 9 M32 42 q-1 6 -4 8" fill="none" stroke="#9c7743" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M18 48 L14 66 Q27 72 40 66 L36 47 Q27 52 18 48 Z" fill="#7a5a34" stroke="#57402a" stroke-width="2"/>' +
    '<rect x="24" y="55" width="7" height="6" fill="#8f6c40" stroke="#57402a" stroke-width="1" stroke-dasharray="2 2"/>' +
    '<path d="M17 50 Q8 54 10 60" fill="none" stroke="#c8a06a" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path d="M37 50 Q46 54 44 60" fill="none" stroke="#c8a06a" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path d="M21 68 L20 73 M33 68 L34 73" stroke="#c8a06a" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="18" cy="74" rx="5" ry="2.5" fill="#57402a"/><ellipse cx="36" cy="74" rx="5" ry="2.5" fill="#57402a"/>' +
    '<g class="samuel-gnoom-buit">' +
    '<ellipse cx="27" cy="58" rx="8" ry="7" fill="#e67e22" stroke="#8f4507" stroke-width="1.5"/>' +
    '<path d="M27 52 l0 -3" stroke="#6a8f3c" stroke-width="2" stroke-linecap="round"/>' +
    '</g>' +
    '</svg>';

  // ---- Status ----------------------------------------------------
  const el = {};
  let pots = [];
  let entities = [];       // actieve entiteiten
  let fx = [];             // rAF-gedreven vertraagde effecten {at, fn}
  let timeouts = [];       // cosmetische setTimeouts (alle getrackt)
  let running = false;
  let rafId = 0;
  let startAt = 0;
  let endAt = 0;
  let nextSpawnAt = 0;
  let stunnedUntil = 0;
  let score = 0;
  let muffsOn = false;
  let spokeMuffs = false;
  let lastSpeakAt = 0;
  let lastTouchTs = 0;
  let stats = null;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function $(id) { return document.getElementById(id); }
  function setText(node, v) { if (node) node.textContent = String(v); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  // ---- Init ------------------------------------------------------
  function init() {
    el.game = $('samuelGame');
    el.area = $('samuelArea');
    if (!el.game || !el.area) return; // snippet ontbreekt: stil overleven

    el.field = $('samuelField');
    el.score = $('samuelScore');
    el.timer = $('samuelTimer');
    el.muffPill = $('samuelMuffPill');
    el.muffIcon = $('samuelMuffIcon');
    el.muffState = $('samuelMuffState');
    el.muffBtn = $('samuelMuffBtn');
    el.muffBtnLabel = $('samuelMuffBtnLabel');
    el.status = $('samuelStatus');
    el.result = $('samuelResult');
    el.resultStamp = $('samuelResultStamp');
    el.resultGrade = $('samuelResultGrade');
    el.resultTitle = $('samuelResultTitle');
    el.resultText = $('samuelResultText');
    el.resultScore = $('samuelResultScore');
    el.resultStats = $('samuelResultStats');
    el.resultPoints = $('samuelResultPoints');
    el.boer = $('samuelBoer');
    el.speech = $('samuelSpeech');

    pots = el.field ? Array.prototype.slice.call(el.field.querySelectorAll('.samuel-pot')) : [];
    pots.forEach((pot) => {
      pot.__ent = null;
      pot.__plant = pot.querySelector('.samuel-plant');
      pot.addEventListener('touchstart', (e) => {
        if (!running) return;
        e.preventDefault();
        lastTouchTs = Date.now();
        tapPot(pot);
      }, { passive: false });
      pot.addEventListener('click', () => {
        if (Date.now() - lastTouchTs < 600) return; // ghost click na touch
        if (!running) return;
        tapPot(pot);
      });
    });

    // Oorkleppen-knop: toggle, maar met volledige touch+mouse bedrading
    if (el.muffBtn) {
      el.muffBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        lastTouchTs = Date.now();
        el.muffBtn.classList.add('ingedrukt');
        toggleMuffs();
      }, { passive: false });
      el.muffBtn.addEventListener('touchend', () => el.muffBtn.classList.remove('ingedrukt'));
      el.muffBtn.addEventListener('touchcancel', () => el.muffBtn.classList.remove('ingedrukt'));
      el.muffBtn.addEventListener('mousedown', () => el.muffBtn.classList.add('ingedrukt'));
      el.muffBtn.addEventListener('mouseup', () => el.muffBtn.classList.remove('ingedrukt'));
      el.muffBtn.addEventListener('mouseleave', () => el.muffBtn.classList.remove('ingedrukt'));
      el.muffBtn.addEventListener('click', () => {
        if (Date.now() - lastTouchTs < 600) return;
        toggleMuffs();
      });
    }

    // Startscherm: tik om te beginnen — bewust alléén via click (iOS vuurt
    // click na een tap): een touchstart-handler met preventDefault zou hier
    // paginascrollen kapen terwijl er nog geen spel draait.
    if (el.status) {
      el.status.addEventListener('click', () => {
        if (!running) startRound();
      });
    }

    // Alleen in eigen gebied scroll blokkeren, en alleen tijdens het spel
    el.area.addEventListener('touchmove', (e) => {
      if (running) e.preventDefault();
    }, { passive: false });

    document.addEventListener('keydown', onKeyDown);

    // Andere game actief? Netjes stoppen.
    document.addEventListener('game:switch', (e) => {
      const key = e && e.detail && e.detail.key;
      if (key !== 'samuel' && (running || entities.length)) stopRound();
    });

    setMuffs(false);
    updateHud();
  }

  function isActive() {
    return !!(el.game && (el.game.classList.contains('active') || el.game.offsetParent !== null));
  }

  // ---- Toetsenbord -----------------------------------------------
  function onKeyDown(e) {
    if (!isActive()) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const k = (e.key || '').toLowerCase();

    if (k === ' ' || k === 'spacebar') {
      if (running) {
        e.preventDefault();
        toggleMuffs();
      }
      return;
    }
    if (k === 'enter') {
      if (!running && el.result && el.result.classList.contains('open')) startRound();
      return;
    }
    if (!running || e.repeat) return;
    const idx = KEY_TO_POT[k];
    if (idx !== undefined && pots[idx]) {
      flashPot(pots[idx]);
      tapPot(pots[idx]);
    }
  }

  function flashPot(pot) {
    pot.classList.add('pressed');
    track(setTimeout(() => pot.classList.remove('pressed'), 120));
  }

  // ---- Rondebeheer -----------------------------------------------
  function startRound() {
    clearRound();
    running = true;
    window.__activeGameRunning = true;
    score = 0;
    muffsOn = false;
    spokeMuffs = false;
    lastSpeakAt = 0;
    stats = { pompoen: 0, mand: 0, gnoom: 0, gegild: 0, gejat: 0 };

    const now = performance.now();
    startAt = now;
    endAt = now + ROUND_SECONDS * 1000;
    nextSpawnAt = now + 500;
    stunnedUntil = 0;

    if (el.result) el.result.classList.remove('open');
    if (el.status) el.status.style.display = 'none';
    setMuffs(false);
    updateHud();
    setText(el.timer, ROUND_SECONDS);
    speak('Oorkleppen niet vergeten, jong!', 1800, true);
    try { el.area.focus({ preventScroll: true }); } catch (err) { /* oude Safari */ }

    rafId = requestAnimationFrame(loop);
  }

  function stopRound() {
    running = false;
    window.__activeGameRunning = false;
    clearRound();
    if (el.result) el.result.classList.remove('open');
    if (el.status) el.status.style.display = '';
    setMuffs(false);
    score = 0;
    updateHud();
    setText(el.timer, ROUND_SECONDS);
  }

  function clearRound() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    timeouts.forEach(clearTimeout);
    timeouts = [];
    fx = [];
    entities.forEach((ent) => {
      if (ent.node && ent.node.parentNode) ent.node.parentNode.removeChild(ent.node);
    });
    entities = [];
    pots.forEach((pot) => {
      pot.__ent = null;
      pot.classList.remove('pressed');
      const toasts = pot.querySelectorAll('.samuel-toast');
      for (let i = 0; i < toasts.length; i++) {
        if (toasts[i].parentNode) toasts[i].parentNode.removeChild(toasts[i]);
      }
    });
    if (el.area) el.area.classList.remove('samuel-shaking', 'samuel-stunned');
    if (el.boer) el.boer.classList.remove('schrik', 'blij');
    if (el.speech) el.speech.classList.remove('zichtbaar');
    stunnedUntil = 0;
  }

  // ---- Hoofdlus (rAF) --------------------------------------------
  function loop(now) {
    if (!running) return;
    if (now >= endAt) { finishRound(); return; }

    setText(el.timer, Math.ceil((endAt - now) / 1000));

    // Spawnen: interval loopt op van 1200 -> 500 ms
    if (now >= nextSpawnAt) {
      spawnEntity(now);
      const p = Math.min(1, (now - startAt) / (ROUND_SECONDS * 1000));
      nextSpawnAt = now + SPAWN_START_MS + (SPAWN_END_MS - SPAWN_START_MS) * p;
    }

    // Levenscyclus
    for (let i = entities.length - 1; i >= 0; i--) {
      const ent = entities[i];
      if (ent.dead) continue;
      if (ent.type === 'pompoen' && ent.stage === 1 && now >= ent.ripeAt) {
        ent.stage = 2;
        ent.node.classList.remove('stage-1');
        ent.node.classList.add('stage-2');
        ent.expireAt = now + PUMPKIN_RIPE_MS;
      } else if (now >= ent.expireAt) {
        expireEntity(ent, now);
      }
    }

    // Verdoving voorbij?
    if (stunnedUntil && now >= stunnedUntil) {
      stunnedUntil = 0;
      el.area.classList.remove('samuel-stunned');
    }

    // Vertraagde effecten
    for (let j = fx.length - 1; j >= 0; j--) {
      if (now >= fx[j].at) {
        const f = fx.splice(j, 1)[0];
        try { f.fn(); } catch (err) { /* nooit de lus breken */ }
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  // ---- Entiteiten ------------------------------------------------
  function spawnEntity(now) {
    const free = pots.filter((p) => !p.__ent);
    if (!free.length) return;
    const pot = free[(Math.random() * free.length) | 0];
    if (!pot.__plant) return;

    let type;
    if (now - startAt < 3000) {
      type = 'pompoen'; // rustig opwarmen, boer
    } else {
      const r = Math.random();
      type = r < 0.52 ? 'pompoen' : (r < 0.83 ? 'mand' : 'gnoom');
    }

    const node = document.createElement('div');
    node.className = 'samuel-entity samuel-' + type + (type === 'pompoen' ? ' stage-1' : '');
    node.innerHTML = type === 'pompoen' ? SVG_POMPOEN : (type === 'mand' ? SVG_MAND : SVG_GNOOM);
    pot.__plant.appendChild(node);

    const jitter = Math.random() * 400 - 200;
    const ent = {
      type: type,
      node: node,
      pot: pot,
      stage: 1,
      ripeAt: now + PUMPKIN_GROW_MS + jitter,
      expireAt: type === 'pompoen' ? Infinity : (type === 'mand' ? now + MAND_LIFE_MS + jitter : now + GNOME_LIFE_MS),
      dead: false
    };
    pot.__ent = ent;
    entities.push(ent);
  }

  function tapPot(pot) {
    const now = performance.now();
    if (now < stunnedUntil) return; // verdoofd: gilnasleep

    const ent = pot.__ent;
    if (!ent || ent.dead) return;

    if (ent.type === 'pompoen') {
      if (ent.stage === 1) {
        addScore(-5);
        toast(pot, 'Die was nog niet rijp, boer! −5', 'slecht');
      } else {
        addScore(25);
        stats.pompoen++;
        kill(ent, 'harvested', 500);
        toast(pot, '+25 🎃', 'goed');
        boerFx('blij', 450);
        if (Math.random() < 0.3) speak(pick(SPREUKEN_OOGST), 1600);
      }
    } else if (ent.type === 'mand') {
      if (muffsOn) {
        addScore(10);
        stats.mand++;
        kill(ent, 'pulled', 550);
        toast(pot, '+10 · gedempt gegil 🎧', 'goed');
      } else {
        // AAAAAH — geen oorkleppen
        addScore(-15);
        stats.gegild++;
        ent.node.classList.add('screaming');
        kill(ent, null, 720);
        stunnedUntil = now + STUN_MS;
        el.area.classList.add('samuel-stunned', 'samuel-shaking');
        fx.push({ at: now + 520, fn: () => el.area.classList.remove('samuel-shaking') });
        toast(pot, 'AAAAAH! −15', 'slecht');
        boerFx('schrik', 900);
        speak(pick(SPREUKEN_GIL), 1600, true);
      }
    } else { // gnoom
      addScore(15);
      stats.gnoom++;
      kill(ent, 'flung', 600);
      toast(pot, 'Ontgnoomd! +15', 'goed');
      boerFx('blij', 450);
      if (Math.random() < 0.35) speak(pick(SPREUKEN_GNOOM), 1400);
    }
  }

  function expireEntity(ent, now) {
    if (ent.type === 'pompoen') {
      kill(ent, 'sunk', 420); // gemist, geen straf — hij zakt de akker weer in
    } else if (ent.type === 'mand') {
      kill(ent, 'sunk', 420);
    } else {
      // Kabouter ontsnapt — en jat een rijpe pompoen als die er staat
      const prooi = entities.find((e2) => e2.type === 'pompoen' && e2.stage === 2 && !e2.dead);
      if (prooi) {
        stats.gejat++;
        kill(prooi, 'stolen', 460);
        toast(ent.pot, '🧌 Pompoen gejat!', 'slecht');
        speak(SPREUK_GEJAT, 1400);
      }
      kill(ent, 'escaping', 660);
    }
  }

  function kill(ent, cssClass, delayMs) {
    if (ent.dead) return;
    ent.dead = true;
    if (cssClass) ent.node.classList.add(cssClass);
    fx.push({
      at: performance.now() + delayMs,
      fn: () => {
        if (ent.node && ent.node.parentNode) ent.node.parentNode.removeChild(ent.node);
        if (ent.pot.__ent === ent) ent.pot.__ent = null;
        const i = entities.indexOf(ent);
        if (i !== -1) entities.splice(i, 1);
      }
    });
  }

  // ---- Score & HUD -----------------------------------------------
  function addScore(n) {
    score += n;
    updateHud();
    const pill = el.score && el.score.parentElement;
    if (pill) { // reflow-truc van de oude site: animatie herstarten
      pill.classList.remove('pulse');
      void pill.offsetWidth;
      pill.classList.add('pulse');
    }
  }

  function updateHud() {
    setText(el.score, score);
  }

  function toggleMuffs() {
    if (!running) return;
    setMuffs(!muffsOn);
    if (muffsOn && !spokeMuffs) {
      spokeMuffs = true;
      speak('Zo! Trek maar los, jong.', 1500);
    }
  }

  function setMuffs(on) {
    muffsOn = on;
    if (el.muffBtn) {
      el.muffBtn.classList.toggle('aan', on);
      el.muffBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    setText(el.muffBtnLabel, on ? 'AAN' : 'UIT');
    setText(el.muffState, on ? 'AAN' : 'UIT');
    setText(el.muffIcon, on ? '🎧' : '🙉');
    if (el.muffPill) el.muffPill.classList.toggle('aan', on);
    if (el.boer) el.boer.classList.toggle('muffs-aan', on);
  }

  // ---- Boer-reacties & tekst -------------------------------------
  function boerFx(cls, ms) {
    if (!el.boer) return;
    el.boer.classList.remove(cls);
    void el.boer.offsetWidth;
    el.boer.classList.add(cls);
    track(setTimeout(() => el.boer.classList.remove(cls), ms));
  }

  function speak(text, ms, force) {
    if (!el.speech) return;
    const now = performance.now();
    if (!force && now - lastSpeakAt < 2500) return;
    lastSpeakAt = now;
    el.speech.textContent = text;
    el.speech.classList.add('zichtbaar');
    track(setTimeout(() => el.speech.classList.remove('zichtbaar'), ms));
  }

  function toast(pot, text, kind) {
    if (!pot) return;
    const old = pot.querySelectorAll('.samuel-toast');
    if (old.length > 2 && old[0].parentNode) old[0].parentNode.removeChild(old[0]);
    const t = document.createElement('div');
    t.className = 'samuel-toast ' + kind;
    t.textContent = text;
    pot.appendChild(t);
    track(setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 980));
  }

  function track(id) { timeouts.push(id); }

  // ---- Einde & uitslag -------------------------------------------
  function finishRound() {
    running = false;
    window.__activeGameRunning = false;
    const eindscore = score;
    const eindstats = stats || { pompoen: 0, mand: 0, gnoom: 0, gegild: 0, gejat: 0 };
    clearRound();

    const grade = GRADES.find((g) => eindscore >= g.min) || GRADES[GRADES.length - 1];
    const geslaagd = eindscore >= 150; // A of hoger = geslaagd

    setText(el.resultGrade, grade.letter);
    if (el.resultGrade) el.resultGrade.classList.toggle('gezakt', grade.letter === 'Z' || grade.letter === 'T');
    setText(el.resultStamp, geslaagd ? 'GOEDGEKEURD' : 'AFGEKEURD');
    if (el.resultStamp) el.resultStamp.classList.toggle('gezakt', !geslaagd);
    setText(el.resultTitle, grade.letter + ' (' + grade.word + ') — ' + grade.rang);
    setText(el.resultText, geslaagd ? WIN_TEXT : FAIL_TEXT);
    setText(el.resultScore, 'Oogstscore: ' + eindscore + ' punten');

    if (el.resultStats) {
      el.resultStats.innerHTML = '';
      const rows = [
        ['🎃 Pompoenen geoogst', eindstats.pompoen],
        ["🌱 Mandragora's getrokken", eindstats.mand],
        ['🧌 Kabouters ontgnoomd', eindstats.gnoom],
        ['😱 Keer in je gezicht gegild', eindstats.gegild]
      ];
      if (eindstats.gejat > 0) rows.push(['🧌 Pompoenen gejat door kabouters', eindstats.gejat]);
      rows.forEach((row) => {
        const li = document.createElement('li');
        li.textContent = row[0] + ': ' + row[1];
        el.resultStats.appendChild(li);
      });
    }

    const record = savePunten(grade.punten);
    setText(el.resultPoints, '🏆 +' + grade.punten + ' House Points' + (record ? ' — nieuw record!' : ''));

    if (el.result) el.result.classList.add('open');
  }

  // House Points (§6.0): beste tier per game in localStorage
  function savePunten(punten) {
    let record = false;
    try {
      const raw = localStorage.getItem('zweinstein_punten');
      let data = raw ? JSON.parse(raw) : {};
      if (!data || typeof data !== 'object') data = {};
      if (!(typeof data.samuel === 'number' && data.samuel >= punten)) {
        data.samuel = punten;
        record = punten > 0;
        localStorage.setItem('zweinstein_punten', JSON.stringify(data));
      }
      document.dispatchEvent(new CustomEvent('punten:update', { detail: { game: 'samuel', punten: data.samuel } }));
    } catch (err) { /* localStorage geblokkeerd: examens tellen dan even niet mee */ }
    return record;
  }

  // ---- Eén global ------------------------------------------------
  window.samuelGameStart = function () {
    if (!el.game || !el.area) return;
    startRound();
  };
})();
