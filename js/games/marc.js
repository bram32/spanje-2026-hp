/* ============================================================
   EXAMEN 3 — 🏦 "GOUDGRIJP FRAUDEWACHT" (Marc)
   Vak: Verweer tegen de Zwarte Betalingen
   Tinder-stijl fraudewacht: veeg betaalopdrachten goed/fout,
   vang de Niffler, laat You-Know-Who géén internetbankieren krijgen.
   Enige global: window.marcGameStart
   ============================================================ */
(function () {
  'use strict';

  var GAME_KEY = 'marc';
  var ROUND_MS = 60000;          // 60s dienst
  var NIFF_WINDOW_MS = 2200;     // vangvenster Niffler
  var NIFF_FIRST_AT = 8000;      // eerste Niffler na ~8s
  var SWIPE_DREMPEL = 70;        // px voordat een veeg telt
  var MAX_FLOATERS = 8;

  // ---------- transactie-data (copy per final-brief) ----------
  var LEGIT = [
    { afz: 'A. Dumbledore (Schoolhoofd)', oms: 'Rondje cerveza', bedrag: '12 Galjoenen', kluis: 'Kluis 713' },
    { afz: 'Weasleys Bezemservice', oms: 'Bezemonderhoud', bedrag: '3 Sikkels', kluis: 'Kluis 394' },
    { afz: 'B. Potter (De Jongen Die Boekte)', oms: 'Schoolgeld Kluis 713 (met sleutel)', bedrag: '150 Galjoenen', kluis: 'Kluis 713' },
    { afz: 'S. Snape', oms: 'Greenfee Santa Clara', bedrag: '45 Galjoenen', kluis: 'Kluis 12' },
    { afz: 'De Drie Bezemstelen', oms: '7× cerveza, halfway house', bedrag: '21 Galjoenen', kluis: 'Kluis 88' },
    { afz: 'Terreinknecht Samuel', oms: 'Pompoenen (verdacht groot, wel legaal)', bedrag: '8 Sikkels', kluis: 'Kluis 4' },
    { afz: 'Madame Rosmerta', oms: 'Statiegeld cervezakratten', bedrag: '2 Sikkels', kluis: 'Kluis 21' },
    { afz: 'D. Malfoy', oms: 'Nieuwe snorkam', bedrag: '5 Galjoenen', kluis: 'Kluis 1691' }
  ];
  // fraudesignalen (≥1 per fraudekaart, verbatim per brief)
  var TELLS = [
    { veld: 'afz',    v: 'V. Oldemort' },
    { veld: 'bedrag', v: '666 Galjoenen' },
    { veld: 'bijz',   v: 'Niffler gesignaleerd op pasfoto' },
    { veld: 'bijz',   v: "'Gringotts-Support' vraagt om uw kluissleutel" },
    { veld: 'kluis',  v: 'betaalverzoek.tovernet.ru' },
    { veld: 'oms',    v: 'gewoon een vriend helpen' }
  ];

  // ---------- state ----------
  var el = {};
  var state = 'idle';            // idle | running | ended
  var running = false;
  var isActive = false;          // is dit de actieve game-tab?
  var rafId = 0;
  var startT = 0;
  var lastShownSec = -1;
  var score = 0, streak = 0, bestStreak = 0;
  var currentCard = null, dealNr = 0;
  var fraudeOpRij = 0, legitOpRij = 0;
  var stats = null;
  var nextNiffAt = NIFF_FIRST_AT;
  var niffActive = false, niffGevangenNu = false, niffDeadline = 0;
  var drag = { bezig: false, startX: 0, dx: 0 };
  var timeouts = [];

  function $(id) { return document.getElementById(id); }

  function later(fn, ms) {
    var id = setTimeout(function () {
      var i = timeouts.indexOf(id);
      if (i > -1) timeouts.splice(i, 1);
      fn();
    }, ms);
    timeouts.push(id);
    return id;
  }

  function clearTimeouts() {
    for (var i = 0; i < timeouts.length; i++) clearTimeout(timeouts[i]);
    timeouts.length = 0;
  }

  function isVisible() {
    return !!(el.game && el.game.offsetParent !== null);
  }

  // ---------- kaartgenerator ----------
  function maakKaart() {
    var basis = LEGIT[(Math.random() * LEGIT.length) | 0];
    var fraude = Math.random() < 0.45;
    if (fraudeOpRij >= 3) fraude = false;      // nooit te voorspelbaar streaky
    if (legitOpRij >= 3) fraude = true;
    var kaart = { fraude: fraude, afz: basis.afz, oms: basis.oms, bedrag: basis.bedrag, kluis: basis.kluis, bijz: null };
    if (fraude) {
      fraudeOpRij++; legitOpRij = 0;
      var aantal = Math.random() < 0.3 ? 2 : 1;
      var pool = TELLS.slice();
      for (var i = 0; i < aantal && pool.length; i++) {
        var t = pool.splice((Math.random() * pool.length) | 0, 1)[0];
        if (t.veld === 'bijz') kaart.bijz = kaart.bijz ? kaart.bijz + ' · ' + t.v : t.v;
        else kaart[t.veld] = t.v;
      }
    } else {
      legitOpRij++; fraudeOpRij = 0;
    }
    return kaart;
  }

  function deelKaart() {
    currentCard = maakKaart();
    dealNr++;
    if (el.cardNr) el.cardNr.textContent = dealNr;
    if (el.cardAfz) el.cardAfz.textContent = currentCard.afz;
    if (el.cardBedrag) el.cardBedrag.textContent = currentCard.bedrag;
    if (el.cardKluis) el.cardKluis.textContent = currentCard.kluis;
    if (el.cardOms) el.cardOms.textContent = currentCard.oms;
    if (el.cardBijzRow) {
      el.cardBijzRow.hidden = !currentCard.bijz;
      if (el.cardBijz) el.cardBijz.textContent = currentCard.bijz || '';
    }
    if (el.card) {
      el.card.style.transition = 'none';
      el.card.style.transform = '';
      el.card.classList.remove('marc-deal', 'marc-stamped-ok', 'marc-stamped-no');
      void el.card.offsetWidth; // reflow-truc: herstart animatie
      el.card.classList.add('marc-deal');
    }
    zetStempelPreview(0);
  }

  // ---------- feedback ----------
  function floater(txt, cls, xPct, yPct) {
    if (!el.toasts) return;
    while (el.toasts.children.length >= MAX_FLOATERS) el.toasts.removeChild(el.toasts.firstChild);
    var d = document.createElement('div');
    d.className = 'marc-floater' + (cls ? ' ' + cls : '');
    d.textContent = txt;
    d.style.left = (xPct != null ? xPct : 50 + (Math.random() * 16 - 8)) + '%';
    d.style.top = (yPct != null ? yPct : 38 + (Math.random() * 10 - 5)) + '%';
    el.toasts.appendChild(d);
    later(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1250);
  }

  function marcReactie(cls) {
    if (!el.goblin) return;
    el.goblin.classList.remove('marc-nod', 'marc-slam', 'marc-shock');
    void el.goblin.offsetWidth;
    el.goblin.classList.add(cls);
  }

  function updateHud() {
    if (el.score) el.score.textContent = score;
    if (el.streakWrap) {
      el.streakWrap.hidden = streak < 2;
      if (el.streakN) el.streakN.textContent = streak;
      if (streak >= 2) {
        el.streakWrap.classList.remove('marc-pulse');
        void el.streakWrap.offsetWidth;
        el.streakWrap.classList.add('marc-pulse');
      }
    }
  }

  function grootFraudeStempel() {
    if (el.fraudeStamp) {
      el.fraudeStamp.classList.remove('marc-toon');
      void el.fraudeStamp.offsetWidth;
      el.fraudeStamp.classList.add('marc-toon');
      later(function () { if (el.fraudeStamp) el.fraudeStamp.classList.remove('marc-toon'); }, 850);
    }
    if (el.area) {
      el.area.classList.remove('marc-schud');
      void el.area.offsetWidth;
      el.area.classList.add('marc-schud');
      later(function () { if (el.area) el.area.classList.remove('marc-schud'); }, 500);
    }
  }

  // ---------- beslissen (veeg / knoppen / pijltjes) ----------
  function beslis(goedkeuren) {
    if (!running || !currentCard) return;
    var isFraude = currentCard.fraude;
    var correct = goedkeuren ? !isFraude : isFraude;
    stats.verwerkt++;

    if (correct) {
      streak++;
      if (streak > bestStreak) bestStreak = streak;
      var bonus = Math.min(streak - 1, 5) * 5;
      score += 10 + bonus;
      if (goedkeuren) {
        floater('✔️ +' + (10 + bonus), '', null, 34);
        marcReactie('marc-nod');
      } else {
        stats.fraudeOnderschept++;
        floater('🛡️ +' + (10 + bonus) + ' fraude onderschept!', '', null, 34);
        marcReactie('marc-slam');
      }
      if (streak === 5) floater('Marc knikt.', 'marc-praat', 50, 22);
      else if (streak === 10) floater('Marc knikt. Twéé keer. Historisch.', 'marc-praat', 50, 22);
    } else if (goedkeuren && isFraude) {
      score -= 25;
      streak = 0;
      stats.fraudeDoorgelaten++;
      grootFraudeStempel();
      marcReactie('marc-shock');
      floater('−25', 'marc-min', null, 30);
    } else {
      score -= 5;
      streak = 0;
      stats.onterechtGeblokkeerd++;
      floater('❌ −5 dat was een échte betaling — de kobold-klant briest', 'marc-min', 50, 30);
      marcReactie('marc-shock');
    }

    updateHud();
    vliegKaart(goedkeuren);
    deelKaart();
  }

  function vliegKaart(goedkeuren) {
    if (!el.card || !el.cardZone) return;
    var kloon = el.card.cloneNode(true);
    kloon.removeAttribute('id');
    var ids = kloon.querySelectorAll('[id]');
    for (var i = 0; i < ids.length; i++) ids[i].removeAttribute('id');
    kloon.className = 'marc-card ' +
      (goedkeuren ? 'marc-stamped-ok marc-fly-r' : 'marc-stamped-no marc-fly-l');
    el.cardZone.appendChild(kloon);
    later(function () { if (kloon.parentNode) kloon.parentNode.removeChild(kloon); }, 450);
  }

  // ---------- Niffler ----------
  function spawnNiff() {
    if (!el.niff || !el.area || !running) return;
    niffActive = true;
    niffGevangenNu = false;
    niffDeadline = performance.now() + NIFF_WINDOW_MS;
    var vanLinks = Math.random() < 0.5;
    el.niff.classList.remove('marc-gevangen');
    el.niff.classList.toggle('marc-flip', !vanLinks);
    el.niff.style.transition = 'none';
    el.niff.style.left = (vanLinks ? -130 : el.area.clientWidth + 10) + 'px';
    el.niff.hidden = false;
    void el.niff.offsetWidth;
    el.niff.style.transition = 'left 2.4s linear';
    el.niff.style.left = (vanLinks ? el.area.clientWidth + 10 : -130) + 'px';
  }

  function verbergNiff() {
    niffActive = false;
    if (el.niff) el.niff.hidden = true;
  }

  function vangNiff() {
    if (!running || !niffActive || niffGevangenNu) return;
    niffGevangenNu = true;
    niffActive = false;
    score += 50;
    stats.niffGevangen++;
    updateHud();
    floater('🦡 +50 Niffler gevangen!', 'marc-munt', 50, 60);
    marcReactie('marc-slam');
    if (el.niff) {
      el.niff.classList.add('marc-gevangen');
      later(function () { if (el.niff) { el.niff.hidden = true; el.niff.classList.remove('marc-gevangen'); } }, 380);
    }
  }

  function ontsnapNiff() {
    verbergNiff();
    score -= 30;
    stats.niffGemist++;
    updateHud();
    floater('💸 −30 de Niffler heeft je fooi', 'marc-min', 50, 60);
    marcReactie('marc-shock');
  }

  // ---------- stempel-preview tijdens slepen ----------
  function zetStempelPreview(dx) {
    var okOp = Math.max(0, Math.min(1, dx / 90));
    var noOp = Math.max(0, Math.min(1, -dx / 90));
    if (el.stampOk) el.stampOk.style.opacity = okOp || '';
    if (el.stampNo) el.stampNo.style.opacity = noOp || '';
  }

  function dragStart(x) {
    if (!running || !el.card) return;
    drag.bezig = true;
    drag.startX = x;
    drag.dx = 0;
    el.card.style.transition = 'none';
    el.card.classList.remove('marc-deal');
  }

  function dragMove(x) {
    if (!drag.bezig || !el.card) return;
    drag.dx = x - drag.startX;
    el.card.style.transform = 'translateX(' + drag.dx + 'px) rotate(' + (drag.dx * 0.07) + 'deg)';
    zetStempelPreview(drag.dx);
  }

  function dragEnd() {
    if (!drag.bezig) return;
    drag.bezig = false;
    var dx = drag.dx;
    drag.dx = 0;
    zetStempelPreview(0);
    if (running && Math.abs(dx) > SWIPE_DREMPEL) {
      beslis(dx > 0);
    } else if (el.card) {
      el.card.style.transition = 'transform .25s ease';
      el.card.style.transform = '';
    }
  }

  // ---------- rondeverloop ----------
  function loop(now) {
    if (!running) return;
    var verstreken = now - startT;
    var restSec = Math.max(0, Math.ceil((ROUND_MS - verstreken) / 1000));
    if (restSec !== lastShownSec) {
      lastShownSec = restSec;
      if (el.timer) el.timer.textContent = restSec;
    }
    if (niffActive && performance.now() > niffDeadline) ontsnapNiff();
    if (!niffActive && verstreken >= nextNiffAt && ROUND_MS - verstreken > 3500) {
      spawnNiff();
      nextNiffAt = verstreken + 12000 + Math.random() * 6000; // ~elke 15s
    }
    if (verstreken >= ROUND_MS) { eindeRonde(); return; }
    rafId = requestAnimationFrame(loop);
  }

  function rangVoor(s) {
    if (s >= 500) return { g: 'U', titel: 'Hoofd Beveiliging (Marc knikt. Eén keer.)', punten: 100 };
    if (s >= 350) return { g: 'B', titel: 'Kluismeester Eerste Klas', punten: 75 };
    if (s >= 200) return { g: 'A', titel: 'Senior Kobold-Analist', punten: 50 };
    if (s >= 100) return { g: 'Z', titel: 'Balie-stagiair', punten: 25 };
    return { g: 'T', titel: 'Slachtoffer van een Tikkie-scam', punten: 0 };
  }

  function bewaarPunten(punten) {
    try {
      var raw = localStorage.getItem('zweinstein_punten');
      var data = raw ? JSON.parse(raw) : {};
      if (!data || typeof data !== 'object') data = {};
      if (!(GAME_KEY in data) || punten > data[GAME_KEY]) {
        data[GAME_KEY] = punten;
        localStorage.setItem('zweinstein_punten', JSON.stringify(data));
      }
    } catch (e) { /* privémodus: geen punten, wel plezier */ }
    try {
      document.dispatchEvent(new CustomEvent('punten:update', { detail: { game: GAME_KEY, points: punten } }));
    } catch (e) { /* stil */ }
  }

  function eindeRonde() {
    running = false;
    state = 'ended';
    window.__activeGameRunning = false;
    cancelAnimationFrame(rafId);
    verbergNiff();
    drag.bezig = false;

    var rang = rangVoor(score);
    var gewonnen = rang.g === 'U' || rang.g === 'B' || rang.g === 'A';
    if (el.gradeLetter) el.gradeLetter.textContent = rang.g;
    if (el.gradeCircle) el.gradeCircle.classList.toggle('marc-grade-slecht', !gewonnen);
    if (el.rankText) el.rankText.textContent = rang.g + ' — ' + rang.titel + ' · ' + score + ' punten';
    if (el.flavor) {
      el.flavor.textContent = gewonnen
        ? 'Geen Knoet verloren. De kobolden knikken goedkeurend — dat doen ze nóóit.'
        : 'Gefeliciteerd, je hebt You-Know-Who zojuist internetbankieren gegeven.';
    }
    if (el.statsLine) {
      el.statsLine.textContent = '📜 ' + stats.verwerkt + ' verwerkt · 🛡️ ' + stats.fraudeOnderschept +
        ' fraude onderschept · 🦡 ' + stats.niffGevangen + ' Niffler(s) gevangen · 🔥 beste reeks x' + bestStreak;
    }
    if (el.statsFraude) {
      el.statsFraude.hidden = stats.fraudeDoorgelaten === 0;
      el.statsFraude.textContent = '🔓 ' + stats.fraudeDoorgelaten +
        '× fraude doorgelaten — You-Know-Who bedankt u hartelijk.';
    }
    if (el.punten) {
      el.punten.textContent = '⌛ +' + rang.punten + ' House Points voor het Puntenglas';
    }
    if (el.result) el.result.hidden = false;
    bewaarPunten(rang.punten);
  }

  function startGame() {
    if (!el.area || !el.card) return;
    clearTimeouts();
    cancelAnimationFrame(rafId);
    score = 0; streak = 0; bestStreak = 0; dealNr = 0;
    fraudeOpRij = 0; legitOpRij = 0;
    lastShownSec = -1;
    stats = { verwerkt: 0, fraudeOnderschept: 0, fraudeDoorgelaten: 0, onterechtGeblokkeerd: 0, niffGevangen: 0, niffGemist: 0 };
    nextNiffAt = NIFF_FIRST_AT;
    verbergNiff();
    if (el.toasts) el.toasts.innerHTML = '';
    if (el.intro) el.intro.hidden = true;
    if (el.result) el.result.hidden = true;
    if (el.timer) el.timer.textContent = Math.round(ROUND_MS / 1000);
    updateHud();
    state = 'running';
    running = true;
    window.__activeGameRunning = true;
    deelKaart();
    startT = performance.now();
    rafId = requestAnimationFrame(loop);
    try { el.area.focus({ preventScroll: true }); } catch (e) { /* oude Safari */ }
  }

  // stoppen zonder rapport (tab-wissel): terug naar briefing
  function stopStil() {
    running = false;
    state = 'idle';
    window.__activeGameRunning = false;
    cancelAnimationFrame(rafId);
    clearTimeouts();
    verbergNiff();
    drag.bezig = false;
    if (el.toasts) el.toasts.innerHTML = '';
    if (el.result) el.result.hidden = true;
    if (el.intro) el.intro.hidden = false;
    if (el.card) { el.card.style.transition = 'none'; el.card.style.transform = ''; }
    zetStempelPreview(0);
  }

  // ---------- bediening ----------
  function wireActieKnop(btn, fn) {
    if (!btn) return;
    var indrukken = function (ev) {
      if (ev.cancelable) ev.preventDefault(); // geen spookklik na touch
      btn.classList.add('marc-ingedrukt');
      fn();
    };
    var loslaten = function () { btn.classList.remove('marc-ingedrukt'); };
    btn.addEventListener('touchstart', indrukken, { passive: false });
    btn.addEventListener('touchend', loslaten);
    btn.addEventListener('touchcancel', loslaten);
    btn.addEventListener('mousedown', function (ev) { if (ev.button === 0) indrukken(ev); });
    btn.addEventListener('mouseup', loslaten);
    btn.addEventListener('mouseleave', loslaten);
  }

  function onKeyDown(e) {
    if (!isActive || !isVisible() || e.repeat) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    var k = e.key;
    if (state === 'running') {
      if (k === 'ArrowRight') { e.preventDefault(); beslis(true); }
      else if (k === 'ArrowLeft') { e.preventDefault(); beslis(false); }
      else if (k === ' ' || k === 'Spacebar') { e.preventDefault(); vangNiff(); }
    } else if ((k === ' ' || k === 'Spacebar' || k === 'Enter') && document.activeElement === el.area) {
      /* idle-start alleen met focus op het speelveld (tabindex=0) —
         spatiebalk-scrollen elders mag geen ronde starten */
      e.preventDefault();
      startGame();
    }
  }

  function onDocMouseMove(e) { dragMove(e.clientX); }
  function onDocMouseUp() {
    dragEnd();
    document.removeEventListener('mousemove', onDocMouseMove);
    document.removeEventListener('mouseup', onDocMouseUp);
  }

  // ---------- init ----------
  function init() {
    el.game = $('marcGame');
    if (!el.game) return; // snippet ontbreekt: pagina overleeft

    el.area = $('marcArea');
    el.timer = $('marcTimer');
    el.score = $('marcScore');
    el.streakWrap = $('marcStreak');
    el.streakN = $('marcStreakN');
    el.goblin = $('marcGoblin');
    el.cardZone = $('marcCardZone');
    el.card = $('marcCard');
    el.cardNr = $('marcCardNr');
    el.cardAfz = $('marcCardAfz');
    el.cardBedrag = $('marcCardBedrag');
    el.cardKluis = $('marcCardKluis');
    el.cardOms = $('marcCardOms');
    el.cardBijzRow = $('marcCardBijzRow');
    el.cardBijz = $('marcCardBijz');
    el.stampOk = $('marcStampOk');
    el.stampNo = $('marcStampNo');
    el.niff = $('marcNiff');
    el.toasts = $('marcToasts');
    el.fraudeStamp = $('marcFraudeStamp');
    el.intro = $('marcIntro');
    el.result = $('marcResult');
    el.gradeCircle = $('marcGradeCircle');
    el.gradeLetter = $('marcGradeLetter');
    el.rankText = $('marcRankText');
    el.flavor = $('marcFlavor');
    el.statsLine = $('marcStats');
    el.statsFraude = $('marcStatsFraude');
    el.punten = $('marcPunten');
    el.blockBtn = $('marcBlockBtn');
    el.approveBtn = $('marcApproveBtn');

    isActive = el.game.classList.contains('active') || isVisible();

    // tab-wissel: eigen loops stoppen als een andere game actief wordt
    document.addEventListener('game:switch', function (e) {
      var key = e && e.detail && e.detail.key;
      isActive = key === GAME_KEY;
      if (!isActive && (running || state === 'running')) stopStil();
    });

    // toetsenbord (alleen actief wanneer eigen game zichtbaar is)
    document.addEventListener('keydown', onKeyDown);

    // tik op speelveld = starten (knoppen in overlays bubbelen hierheen; state-check vangt dat af)
    if (el.area) {
      el.area.addEventListener('click', function () {
        if (state !== 'running') startGame();
      });
      // alleen in eigen speelveld scrollen blokkeren, en alleen tijdens het spelen
      el.area.addEventListener('touchmove', function (e) {
        if (running && e.cancelable) e.preventDefault();
      }, { passive: false });
    }

    // vegen op de kaartenstapel (touch + muis)
    if (el.cardZone) {
      el.cardZone.addEventListener('touchstart', function (e) {
        if (!running || !e.touches.length) return;
        dragStart(e.touches[0].clientX);
      }, { passive: true });
      el.cardZone.addEventListener('touchmove', function (e) {
        if (e.touches.length) dragMove(e.touches[0].clientX);
      }, { passive: true });
      el.cardZone.addEventListener('touchend', dragEnd);
      el.cardZone.addEventListener('touchcancel', dragEnd);
      el.cardZone.addEventListener('mousedown', function (e) {
        if (e.button !== 0 || !running) return;
        e.preventDefault();
        dragStart(e.clientX);
        document.addEventListener('mousemove', onDocMouseMove);
        document.addEventListener('mouseup', onDocMouseUp);
      });
    }

    // Niffler zelf aantikken
    if (el.niff) {
      el.niff.addEventListener('touchstart', function (e) {
        if (e.cancelable) e.preventDefault();
        vangNiff();
      }, { passive: false });
      el.niff.addEventListener('click', vangNiff);
    }

    // grote knoppen: volledige touch+muis-bedrading (contract)
    wireActieKnop(el.approveBtn, function () { beslis(true); });
    wireActieKnop(el.blockBtn, function () { beslis(false); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // enige global: replay-/startknoppen in het snippet gebruiken deze
  window.marcGameStart = startGame;
})();
