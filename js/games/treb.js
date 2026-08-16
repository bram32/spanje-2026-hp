/* =====================================================================
   EXAMEN 6 — 🍺 TREBS SCHUHPLATTLER (Danskunde: Gastcollege uit München)
   ---------------------------------------------------------------------
   Herr Treb vliegt in uit München en plattlert de tent plat. Vier lanes
   vallen op de oempa-beat naar de slagzone: 🦵 A = Knieschlag ·
   👞 S = Schuhschlag · 🥾 D = Stampf · 🎶 F = Jodel. De Maß vult per
   combo; missen = bier klotst eruit ("PROST VERSPILD!"). BPM ramp over
   45s: Frühschoppen (100) → Blaskapelle (130) → Bierzelt (160) →
   APOCALYPS AUF DER WIESN (190). Vliegende Brezn = bonuspunten.
   Enige global: window.trebGameStart
   ===================================================================== */
(function () {
    'use strict';

    var GAME_KEY = 'treb';
    var DURATION = 45;          // seconden gastcollege
    var HIT_WINDOW = 46;        // px rond het doelwit-centrum
    var SPEED_FACTOR = 0.32;    // valsnelheid = laanhoogte * (bpm/60) * factor
    var NOTE_HALF = 22;         // noot is 44px hoog

    var PHASES = [
        { t: 0,  bpm: 100, label: '🌅 Frühschoppen (100 BPM)' },
        { t: 11, bpm: 130, label: '🎺 Blaskapelle (130 BPM)' },
        { t: 22, bpm: 160, label: '🍻 Bierzelt (160 BPM)' },
        { t: 34, bpm: 190, label: '🔥 APOCALYPS AUF DER WIESN (190 BPM)' }
    ];

    var LANES = [
        { key: 'a', cls: 'knie',   emoji: '🦵', name: 'Knieschlag' },
        { key: 's', cls: 'schuh',  emoji: '👞', name: 'Schuhschlag' },
        { key: 'd', cls: 'stampf', emoji: '🥾', name: 'Stampf' },
        { key: 'f', cls: 'jodel',  emoji: '🎶', name: 'Jodel' }
    ];
    var KEY_TO_LANE = { a: 0, s: 1, d: 2, f: 3 };

    var SHOUTS = ['OANS! ZWOA! DROI!', 'G’SUFFA!', 'ZICKE ZACKE ZICKE ZACKE!', 'HOI! HOI! HOI!', 'SCHNEIDIG, BUA!'];

    var RANKS = [
        { min: 5000, grade: 'U', title: 'ALPENKONING — München belt, ze willen je terug' },
        { min: 3500, grade: 'B', title: 'Lederhosen-Legende' },
        { min: 2000, grade: 'A', title: 'Bierzelt-Bekwaam' },
        { min: 1000, grade: 'Z', title: 'Toerist met Ritmegevoel' },
        { min: -Infinity, grade: 'T', title: 'Shuttlebus terug naar het hotel' }
    ];
    var GRADE_COLORS = { U: '#f4d03f', B: '#2ecc71', A: '#5dade2', Z: '#e67e22', T: '#e74c3c' };
    var TIER_POINTS = { U: 100, B: 75, A: 50, Z: 25, T: 0 };
    var WIN_TEXT = 'De hele tent staat op de banken. Treb bestelt nog een Maß — ‘voor het evenwicht’.';
    var FAIL_TEXT = 'De kapel stopt met spelen. Zelfs de tuba kijkt de andere kant op.';

    /* ---------------- DOM refs + state ---------------- */

    var container, area, lanesEl, notesWrap, figEl, figSvg,
        dustEl, massGlass, massFill, massLabel,
        scoreEl, timerEl, bpmEl, phaseEl,
        comboPill, comboBar, comboCountEl, multEl,
        feedbackEl, splashEl, splashTextEl, statusEl, resultEl,
        resultGradeEl, resultTitleEl, resultTextEl, resultScoreEl, buttons;

    var state = {
        running: false, raf: 0,
        score: 0, combo: 0, maxCombo: 0, movesDone: 0, pretzels: 0,
        bpm: 100, phase: 0,
        startT: 0, lastT: 0, nextSpawn: 0,
        notes: [], floaters: 0,
        lastHit: 0, lastLane: -1, laneRun: 0, tempoApplied: 0
    };
    var splashHideTimer = 0, danceTimer = 0, dustTimer = 0, sloshTimer = 0, massTimer = 0;

    function $(id) { return document.getElementById(id); }
    function setText(el, txt) { if (el) el.textContent = txt; }
    function isVisible() { return !!(container && container.offsetParent !== null); }

    /* ---------------- Init ---------------- */

    function init() {
        container = $('trebGame');
        area = $('trebArea');
        if (!container || !area) return; // snippet ontbreekt: stilletjes overslaan

        lanesEl = $('trebLanes');
        notesWrap = $('trebNotes');
        figEl = $('trebFig');
        figSvg = $('trebFigSvg');
        dustEl = $('trebDust');
        massGlass = $('trebMassGlass');
        massFill = $('trebMassFill');
        massLabel = $('trebMassLabel');
        scoreEl = $('trebScore');
        timerEl = $('trebTimer');
        bpmEl = $('trebBpm');
        phaseEl = $('trebPhase');
        comboPill = $('trebComboPill');
        comboBar = $('trebComboBar');
        comboCountEl = $('trebComboCount');
        multEl = $('trebMult');
        feedbackEl = $('trebFeedback');
        splashEl = $('trebSplash');
        splashTextEl = $('trebSplashText');
        statusEl = $('trebStatus');
        resultEl = $('trebResult');
        resultGradeEl = $('trebResultGrade');
        resultTitleEl = $('trebResultTitle');
        resultTextEl = $('trebResultText');
        resultScoreEl = $('trebResultScore');
        buttons = container.querySelectorAll('.treb-move-btn');

        // Tik op het veld = starten (maar niet via het eindrapport)
        area.addEventListener('click', function (e) {
            if (e.target && e.target.closest && e.target.closest('#trebResult')) return;
            if (!state.running) start();
        });

        // Toetsenbord: alleen reageren als DIT examen zichtbaar is
        document.addEventListener('keydown', function (e) {
            if (!isVisible() || e.metaKey || e.ctrlKey || e.altKey) return;
            var t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
            var k = (e.key || '').toLowerCase();
            if (state.running) {
                if (KEY_TO_LANE[k] !== undefined) {
                    if (!e.repeat) { pressVisual(k); hit(k); }
                    e.preventDefault();
                }
            } else if ((k === ' ' || k === 'enter') && document.activeElement === area) {
                e.preventDefault();
                start();
            }
        });

        // Dansknoppen: touchstart/touchend/touchcancel + mousedown/mouseup/mouseleave
        Array.prototype.forEach.call(buttons || [], function (btn) {
            var key = btn.getAttribute('data-key');
            function act() { if (state.running) { hit(key); } else { start(); } }
            btn.addEventListener('touchstart', function (ev) {
                ev.preventDefault(); // voorkomt ook synthetische muisevents
                btn.classList.add('pressed');
                act();
            }, { passive: false });
            btn.addEventListener('touchend', function () { btn.classList.remove('pressed'); });
            btn.addEventListener('touchcancel', function () { btn.classList.remove('pressed'); });
            btn.addEventListener('mousedown', function () { btn.classList.add('pressed'); act(); });
            btn.addEventListener('mouseup', function () { btn.classList.remove('pressed'); });
            btn.addEventListener('mouseleave', function () { btn.classList.remove('pressed'); });
        });

        // Scrollen blokkeren in eigen speelveld, alléén tijdens het college
        area.addEventListener('touchmove', function (e) {
            if (state.running) e.preventDefault();
        }, { passive: false });

        // Ander examen actief? Kapel naar huis.
        document.addEventListener('game:switch', function (e) {
            var k = e && e.detail && e.detail.key;
            if (k === GAME_KEY) {
                try { area.focus({ preventScroll: true }); } catch (err) { /* leeg */ }
                return;
            }
            abort();
        });
    }

    /* ---------------- Ronde-besturing ---------------- */

    function start() {
        if (!area) return;
        clearRound();
        state.running = true;
        state.score = 0; state.combo = 0; state.maxCombo = 0;
        state.movesDone = 0; state.pretzels = 0;
        state.bpm = PHASES[0].bpm; state.phase = 0;
        state.lastHit = 0; state.lastLane = -1; state.laneRun = 0; state.tempoApplied = 0;

        if (statusEl) statusEl.style.display = 'none';
        if (resultEl) resultEl.style.display = 'none';
        setText(scoreEl, '0');
        setText(timerEl, String(DURATION));
        setText(bpmEl, String(PHASES[0].bpm));
        setText(phaseEl, PHASES[0].label);
        updateMass(false);
        area.classList.add('running');
        area.classList.remove('wiesn');
        try { area.focus({ preventScroll: true }); } catch (err) { /* leeg */ }

        window.__activeGameRunning = true;
        state.startT = performance.now();
        state.lastT = state.startT;
        state.nextSpawn = state.startT + 700;
        applyTempo(state.bpm, true);
        state.raf = requestAnimationFrame(loop);
    }

    function clearRound() {
        if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
        if (splashHideTimer) { clearTimeout(splashHideTimer); splashHideTimer = 0; }
        if (massTimer) { clearTimeout(massTimer); massTimer = 0; }
        state.notes.forEach(function (n) { if (n.el && n.el.parentNode) n.el.parentNode.removeChild(n.el); });
        state.notes = [];
        if (splashEl) splashEl.style.display = 'none';
        if (massGlass) massGlass.classList.remove('slosh', 'chug');
        if (figEl) figEl.classList.remove('do-knie', 'do-schuh', 'do-stampf', 'do-jodel');
        if (area) area.classList.remove('shake');
    }

    // Stil stoppen (tab-switch): geen rapport, terug naar startscherm
    function abort() {
        if (!area) return;
        var wasRunning = state.running;
        state.running = false;
        clearRound();
        area.classList.remove('running', 'wiesn');
        if (wasRunning) window.__activeGameRunning = false;
        if (resultEl) resultEl.style.display = 'none';
        if (statusEl) statusEl.style.display = 'flex';
        if (comboPill) comboPill.style.display = 'none';
    }

    function finish() {
        state.running = false;
        clearRound();
        area.classList.remove('running', 'wiesn');
        window.__activeGameRunning = false;

        var rank = RANKS[RANKS.length - 1];
        for (var i = 0; i < RANKS.length; i++) {
            if (state.score >= RANKS[i].min) { rank = RANKS[i]; break; }
        }
        var color = GRADE_COLORS[rank.grade] || '#4a90d9';
        if (resultGradeEl) {
            resultGradeEl.textContent = rank.grade;
            resultGradeEl.style.borderColor = color;
            resultGradeEl.style.color = color;
        }
        setText(resultTitleEl, rank.title);
        setText(resultTextEl, state.score >= 3500 ? WIN_TEXT : FAIL_TEXT);
        setText(resultScoreEl, 'Eindscore: ' + state.score + ' · Moves geplattlert: ' + state.movesDone +
            ' · Langste serie: ×' + state.maxCombo + ' · Brezn: ' + state.pretzels);
        if (resultEl) resultEl.style.display = 'block';
        savePunten(rank.grade);
    }

    // House Points (§6.0): beste cijfer per examen in localStorage
    function savePunten(grade) {
        try {
            var pts = TIER_POINTS[grade] || 0;
            var data;
            try { data = JSON.parse(localStorage.getItem('zweinstein_punten')) || {}; }
            catch (e) { data = {}; }
            if (typeof data !== 'object' || data === null || Array.isArray(data)) data = {};
            if (!(data[GAME_KEY] >= pts)) data[GAME_KEY] = pts;
            localStorage.setItem('zweinstein_punten', JSON.stringify(data));
            document.dispatchEvent(new CustomEvent('punten:update', {
                detail: { game: GAME_KEY, points: data[GAME_KEY] }
            }));
        } catch (err) { /* localStorage kapot? Das Ministerium zuckt mit den Schultern. */ }
    }

    /* ---------------- Game loop ---------------- */

    function loop(t) {
        if (!state.running) return;
        var dt = Math.min(50, t - state.lastT);
        state.lastT = t;

        var elapsed = (t - state.startT) / 1000;
        if (elapsed >= DURATION) { finish(); return; }

        var laneH = lanesEl ? lanesEl.clientHeight : (area.clientHeight - 122);
        var hitY = laneH - 32; // centrum van de doelringen

        // Fase + BPM (soepel naar het fasedoel toe)
        var idx = 0;
        for (var p = PHASES.length - 1; p >= 0; p--) {
            if (elapsed >= PHASES[p].t) { idx = p; break; }
        }
        if (idx !== state.phase) {
            state.phase = idx;
            setText(phaseEl, PHASES[idx].label);
            shout(PHASES[idx].label.replace(/ \(\d+ BPM\)$/, ''));
            area.classList.toggle('wiesn', idx === PHASES.length - 1);
        }
        state.bpm += (PHASES[state.phase].bpm - state.bpm) * Math.min(1, dt / 700);
        var speed = laneH * (state.bpm / 60) * SPEED_FACTOR; // px/s

        // HUD
        var remain = Math.ceil(DURATION - elapsed);
        setText(timerEl, String(remain));
        var bpmShown = Math.round(state.bpm);
        if (bpmEl && bpmEl.textContent !== String(bpmShown)) bpmEl.textContent = String(bpmShown);
        applyTempo(state.bpm, false);

        // Spawnen op de oempa-beat (alleen als de noot nog kan landen)
        if (t >= state.nextSpawn) {
            var travelMs = ((hitY + 50) / speed) * 1000;
            if ((t - state.startT) + travelMs < DURATION * 1000 - 350) spawnNote(elapsed);
            var iv = (120000 / state.bpm) * (0.8 + Math.random() * 0.4);
            if (state.phase >= 3) iv *= 0.78; // op de Wiesn kent men geen genade
            state.nextSpawn = t + iv;
        }

        for (var i = state.notes.length - 1; i >= 0; i--) {
            var n = state.notes[i];
            n.y += speed * (dt / 1000);
            n.el.style.transform = 'translate(-50%,' + (n.y - NOTE_HALF).toFixed(1) + 'px)';
            if (!n.resolved && n.y > hitY + HIT_WINDOW) missNote(n);
            if (n.y > laneH + 50) {
                if (n.el.parentNode) n.el.parentNode.removeChild(n.el);
                state.notes.splice(i, 1);
            }
        }

        state.raf = requestAnimationFrame(loop);
    }

    // Trebs wieg-tempo meebewegen met de BPM (niet elke frame herstarten)
    function applyTempo(bpm, force) {
        if (!force && Math.abs(bpm - state.tempoApplied) < 6) return;
        state.tempoApplied = bpm;
        if (figEl) figEl.style.animationDuration = (120 / bpm).toFixed(3) + 's'; // wiegen per 2 tellen
    }

    /* ---------------- Noten ---------------- */

    function pickLane() {
        var li, guard = 0;
        do {
            li = Math.floor(Math.random() * LANES.length);
            guard++;
        } while (li === state.lastLane && state.laneRun >= 3 && guard < 8);
        if (li === state.lastLane) { state.laneRun++; } else { state.lastLane = li; state.laneRun = 1; }
        return li;
    }

    function spawnNote(elapsed) {
        if (!notesWrap || state.notes.length >= 14) return;
        var li = pickLane();
        var lane = LANES[li];
        var pretzel = elapsed > 5 && Math.random() < 0.09; // vliegende Brezn
        var el = document.createElement('div');
        el.className = 'treb-note treb-n-' + lane.cls + (pretzel ? ' pretzel' : '');
        el.innerHTML = '<span>' + (pretzel ? '🥨' : lane.emoji) + '</span>';
        el.style.left = (12.5 + li * 25) + '%';
        el.style.transform = 'translate(-50%,-62px)';
        notesWrap.appendChild(el);
        state.notes.push({ el: el, lane: li, y: -40, resolved: false, pretzel: pretzel });
    }

    function missNote(note) {
        note.resolved = true;
        note.el.classList.add('missed');
        state.score = Math.max(0, state.score - 10);
        setText(scoreEl, String(state.score));
        resetCombo();
        splash('PROST VERSPILD!');
    }

    /* ---------------- Plattlern ---------------- */

    function hit(key) {
        var now = performance.now();
        if (now - state.lastHit < 70) return; // anti-roffel
        state.lastHit = now;

        var li = KEY_TO_LANE[key];
        if (li === undefined) return;
        var lane = LANES[li];
        dance(lane.cls); // Treb danst áltijd mee, raak of niet

        var laneH = lanesEl ? lanesEl.clientHeight : (area.clientHeight - 122);
        var hitY = laneH - 32;
        var best = null, bestDist = Infinity;
        for (var i = 0; i < state.notes.length; i++) {
            var n = state.notes[i];
            if (n.resolved || n.lane !== li) continue;
            var d = Math.abs(n.y - hitY);
            if (d <= HIT_WINDOW && d < bestDist) { best = n; bestDist = d; }
        }

        if (!best) {
            resetCombo();
            feedback('IN DE LUCHT GEPLATTLERT!', '#aaa');
            return;
        }

        best.resolved = true;
        best.el.classList.add('done');
        state.movesDone++;
        state.combo++;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;

        var quality;
        if (bestDist <= 14) quality = { pts: 100, txt: 'PERFEKT GEPLATTLERT!', col: '#f4d03f' };
        else if (bestDist <= 28) quality = { pts: 75, txt: 'SAUBER!', col: '#2ecc71' };
        else quality = { pts: 50, txt: 'PASST SCHO!', col: '#fff' };

        var mult = state.combo >= 16 ? 3 : (state.combo >= 8 ? 2 : 1);
        var pts = quality.pts * mult + (best.pretzel ? 150 : 0);
        state.score += pts;
        setText(scoreEl, String(state.score));

        if (best.pretzel) {
            state.pretzels++;
            feedback('🥨 BREZN-BONUS! +' + pts, '#f4d03f');
        } else {
            feedback(quality.txt, quality.col);
        }
        floater('+' + pts, quality.col, li);
        if (li === 3) jodelFloater();

        if (state.combo % 20 === 0) {
            // Maß vol → achterover en weg ermee
            state.score += 250;
            setText(scoreEl, String(state.score));
            shout('DE MASS IS VOL — G’SUFFA! +250');
            if (massGlass) {
                massGlass.classList.remove('chug');
                void massGlass.offsetWidth;
                massGlass.classList.add('chug');
            }
            updateMass(true);
            if (massTimer) clearTimeout(massTimer);
            massTimer = setTimeout(function () {
                updateMass(false);
                if (massGlass) massGlass.classList.remove('chug');
            }, 500);
        } else {
            updateMass(false);
            if (state.combo >= 5 && state.combo % 5 === 0) {
                shout(SHOUTS[Math.floor(Math.random() * SHOUTS.length)]);
            }
        }
    }

    function resetCombo() {
        if (state.combo > 0 && massGlass) {
            massGlass.classList.remove('slosh');
            void massGlass.offsetWidth;
            massGlass.classList.add('slosh');
            if (sloshTimer) clearTimeout(sloshTimer);
            sloshTimer = setTimeout(function () { massGlass.classList.remove('slosh'); }, 560);
        }
        state.combo = 0;
        updateMass(false);
    }

    // De Maß is de combometer: vol bij ×20, dan drinkt Treb hem leeg
    function updateMass(forceFull) {
        var pct = forceFull ? 100 : Math.min(100, (state.combo % 20) * 5);
        if (massFill) massFill.style.height = pct + '%';
        if (comboBar) comboBar.style.width = pct + '%';
        setText(massLabel, '×' + state.combo);
        setText(comboCountEl, String(state.combo));
        var mult = state.combo >= 16 ? 3 : (state.combo >= 8 ? 2 : 1);
        setText(multEl, mult > 1 ? ' · ×' + mult : '');
        if (comboPill) comboPill.style.display = state.combo >= 2 ? 'block' : 'none';
    }

    /* ---------------- Treb danst ---------------- */

    function dance(cls) {
        if (!figEl) return;
        figEl.classList.remove('do-knie', 'do-schuh', 'do-stampf', 'do-jodel');
        void figEl.offsetWidth; // reflow-truc: animatie herstarten
        figEl.classList.add('do-' + cls);
        if (danceTimer) clearTimeout(danceTimer);
        danceTimer = setTimeout(function () {
            figEl.classList.remove('do-knie', 'do-schuh', 'do-stampf', 'do-jodel');
        }, 380);
        if (cls === 'stampf') stompDust();
    }

    function stompDust() {
        if (!dustEl) return;
        dustEl.classList.remove('puff');
        void dustEl.offsetWidth;
        dustEl.classList.add('puff');
        if (dustTimer) clearTimeout(dustTimer);
        dustTimer = setTimeout(function () { dustEl.classList.remove('puff'); }, 460);
    }

    /* ---------------- Effecten ---------------- */

    function feedback(msg, color) {
        if (!feedbackEl) return;
        feedbackEl.textContent = msg;
        feedbackEl.style.color = color;
        feedbackEl.style.animation = 'none';
        void feedbackEl.offsetHeight;
        feedbackEl.style.animation = 'trebPop 0.65s ease-out';
    }

    function floater(txt, color, laneIdx) {
        if (!area || !lanesEl || state.floaters >= 8) return;
        state.floaters++;
        var x = lanesEl.offsetLeft + lanesEl.clientWidth * (0.125 + laneIdx * 0.25);
        var el = document.createElement('div');
        el.textContent = txt;
        el.style.cssText = 'position:absolute;bottom:150px;left:' + Math.round(x) +
            'px;transform:translate(-50%,0);z-index:7;pointer-events:none;font-family:Montserrat,sans-serif;' +
            'font-weight:800;font-size:1.1rem;color:' + color +
            ';text-shadow:0 2px 8px rgba(0,0,0,0.8);animation:trebFloatUp 0.85s ease-out forwards;';
        area.appendChild(el);
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
            state.floaters--;
        }, 900);
    }

    // Grote kreet dwars over de lanes bij mooie series en fasewissels
    function shout(txt) {
        if (!area || !lanesEl || state.floaters >= 8) return;
        state.floaters++;
        var x = lanesEl.offsetLeft + lanesEl.clientWidth * 0.5;
        var el = document.createElement('div');
        el.textContent = txt;
        el.style.cssText = 'position:absolute;top:26%;left:' + Math.round(x) +
            'px;transform:translate(-50%,0);z-index:7;pointer-events:none;font-family:Montserrat,sans-serif;' +
            'font-weight:800;font-size:1.35rem;letter-spacing:1px;color:#f4d03f;white-space:nowrap;' +
            'text-shadow:0 2px 12px rgba(0,0,0,0.9);animation:trebShoutUp 1.1s ease-out forwards;';
        area.appendChild(el);
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
            state.floaters--;
        }, 1150);
    }

    // Jodel: kop in de nek en gaan
    function jodelFloater() {
        if (!area || state.floaters >= 8) return;
        state.floaters++;
        var el = document.createElement('div');
        el.textContent = '„Jodelahitiii~” 🎶';
        el.style.cssText = 'position:absolute;top:24%;right:6%;z-index:7;pointer-events:none;' +
            'font-family:Montserrat,sans-serif;font-weight:700;font-style:italic;font-size:1rem;color:#fff;' +
            'text-shadow:0 2px 8px rgba(0,0,0,0.85);animation:trebJodelFloat 1.1s ease-out forwards;';
        area.appendChild(el);
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
            state.floaters--;
        }, 1150);
    }

    function splash(msg) {
        if (splashTextEl) splashTextEl.textContent = msg;
        if (splashEl) {
            splashEl.style.display = 'flex';
            splashEl.style.animation = 'none';
            void splashEl.offsetHeight;
            splashEl.style.animation = 'trebSplashFlash 0.6s ease-out';
            if (splashHideTimer) clearTimeout(splashHideTimer);
            splashHideTimer = setTimeout(function () { splashEl.style.display = 'none'; }, 620);
        }
        area.classList.remove('shake');
        void area.offsetWidth;
        area.classList.add('shake');
        feedback(msg + ' −10', '#e74c3c');
    }

    function pressVisual(key) {
        if (!buttons) return;
        Array.prototype.forEach.call(buttons, function (btn) {
            if (btn.getAttribute('data-key') === key) {
                btn.classList.add('pressed');
                setTimeout(function () { btn.classList.remove('pressed'); }, 110);
            }
        });
    }

    /* ---------------- Bootstrap + enige global ---------------- */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.trebGameStart = function () {
        if (!area) return;
        start();
    };
})();
