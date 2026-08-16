/* =====================================================================
   EXAMEN 2 — 🥫 PASCALS BLIKKENLIJN (Mugglekunde: Industrie)
   ---------------------------------------------------------------------
   De blikkenlijn draait op gabber-BPM. Blikken schuiven links → rechts
   de KEURZONE in: ✅ goed blik = A (OK) · 🫙 deukblik = S (AFKEUR) ·
   🍺 gouden cerveza-blik = D (BONUS, +50). BPM ramp t over 30s;
   fout stempelen of een blik missen = −10 en DE LIJN LOOPT VAST!
   Enige global: window.pascalGameStart
   ===================================================================== */
(function () {
    'use strict';

    var GAME_KEY = 'pascal';
    var DURATION = 30;          // seconden per dienst
    var ZONE_FRAC = 0.76;       // keurzone-centrum als fractie van de veldbreedte
    var HIT_WINDOW = 46;        // px rond het zone-centrum waarin gestempeld mag worden
    var SPEED_FACTOR = 0.20;    // bandsnelheid = veldbreedte * (bpm/60) * factor

    var PRESETS = {
        1: { bpm: 100, label: '🐢 Inwerkdag (100 BPM)' },
        2: { bpm: 130, label: '📦 Ochtenddienst (130 BPM)' },
        3: { bpm: 160, label: '⚙️ Normale Dienst (160 BPM)' },
        4: { bpm: 190, label: '🔩 Nachtdienst (190 BPM)' },
        5: { bpm: 220, label: '🔥 HARDCORE-DIENST (220 BPM)' }
    };

    var RANKS = [
        { min: 5000, grade: 'U', title: 'Directeur van de Blikkenlijn' },
        { min: 3000, grade: 'B', title: 'Voorman Hardcore-Afdeling' },
        { min: 1500, grade: 'A', title: 'Gecertificeerd Blikkeninspecteur' },
        { min: 500,  grade: 'Z', title: 'Uitzendkracht (proeftijd)' },
        { min: -Infinity, grade: 'T', title: 'Blikschade' }
    ];
    var GRADE_COLORS = { U: '#f4d03f', B: '#2ecc71', A: '#5dade2', Z: '#e67e22', T: '#e74c3c' };
    var TIER_POINTS = { U: 100, B: 75, A: 50, Z: 25, T: 0 };
    var WIN_TEXT = 'De lijn haalt 190 BPM en Pascal hakt goedkeurend mee!';
    var FAIL_TEXT = 'Pascal zet de lijn stil: ‘Dit is geen hardcore, dit is huilcore.’';

    /* ---------------- Blik-illustraties (inline SVG, met liefde) ---------------- */

    function svgCanGood() {
        return '<svg viewBox="0 0 60 80" aria-hidden="true">' +
            '<ellipse cx="30" cy="73" rx="21" ry="4.5" fill="rgba(0,0,0,0.35)"/>' +
            '<rect x="9" y="12" width="42" height="58" rx="3" fill="url(#pascalGradTin)" stroke="#4c5157" stroke-width="1"/>' +
            '<line x1="9" y1="19" x2="51" y2="19" stroke="rgba(0,0,0,0.18)" stroke-width="1"/>' +
            '<line x1="9" y1="63" x2="51" y2="63" stroke="rgba(0,0,0,0.18)" stroke-width="1"/>' +
            '<rect x="9" y="27" width="42" height="27" fill="#f0e2c0" stroke="#3b2f1e" stroke-width="0.8"/>' +
            '<text x="30" y="37.5" text-anchor="middle" font-size="9" font-weight="bold" fill="#2e7d4f" font-family="Montserrat,sans-serif">SNERT</text>' +
            '<text x="30" y="43.5" text-anchor="middle" font-size="3.6" fill="#3b2f1e" font-family="Montserrat,sans-serif">EXTRA DIK · MET WORST</text>' +
            '<g fill="#3b2f1e">' +
            '<rect x="14" y="47" width="1.2" height="5"/><rect x="16.4" y="47" width="0.7" height="5"/>' +
            '<rect x="18.4" y="47" width="1.6" height="5"/><rect x="21.2" y="47" width="0.7" height="5"/>' +
            '<rect x="23" y="47" width="1.1" height="5"/><rect x="25.4" y="47" width="1.8" height="5"/>' +
            '</g>' +
            '<circle cx="41" cy="49.5" r="4" fill="none" stroke="#2e7d4f" stroke-width="1"/>' +
            '<text x="41" y="51.5" text-anchor="middle" font-size="4.5" fill="#2e7d4f" font-weight="bold" font-family="Montserrat,sans-serif">33</text>' +
            '<ellipse cx="30" cy="12" rx="21" ry="5.5" fill="#d7dbe0" stroke="#4c5157" stroke-width="1"/>' +
            '<ellipse cx="30" cy="12" rx="15" ry="3.4" fill="#aab0b6"/>' +
            '<rect x="28.9" y="7.6" width="2.2" height="4.4" rx="1" fill="#8f959b"/>' +
            '<circle cx="30" cy="11.4" r="2.2" fill="none" stroke="#565b61" stroke-width="1.2"/>' +
            '<rect x="12.5" y="15" width="4" height="52" rx="2" fill="rgba(255,255,255,0.32)"/>' +
            '</svg>';
    }

    function svgCanDent() {
        return '<svg viewBox="0 0 60 80" aria-hidden="true">' +
            '<ellipse cx="30" cy="73" rx="21" ry="4.5" fill="rgba(0,0,0,0.35)"/>' +
            '<g transform="rotate(-5 30 40)">' +
            '<rect x="9" y="12" width="42" height="58" rx="3" fill="url(#pascalGradDent)" stroke="#3a3e43" stroke-width="1"/>' +
            '<path d="M51,28 Q39,38 51,50 Z" fill="rgba(0,0,0,0.38)"/>' +
            '<path d="M9,55 Q17,50 9,44 Z" fill="rgba(0,0,0,0.28)"/>' +
            '<polygon points="9,29 51,26 51,47 40,52 31,47 21,53 9,49" fill="#d9c294" stroke="#3b2f1e" stroke-width="0.8"/>' +
            '<text x="30" y="39" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#8e1b1b" font-family="Montserrat,sans-serif" transform="rotate(3 30 39)">SN—RT</text>' +
            '<text x="29" y="45" text-anchor="middle" font-size="3.4" fill="#3b2f1e" font-family="Montserrat,sans-serif">houdbaar tot: vorige week</text>' +
            '<path d="M15,60 l8,-4 M19,63 l7,-3 M38,62 l6,-4" stroke="rgba(0,0,0,0.5)" stroke-width="0.9" fill="none"/>' +
            '<ellipse cx="30" cy="12" rx="21" ry="5.5" fill="#9aa0a6" stroke="#3a3e43" stroke-width="1" transform="rotate(4 30 12)"/>' +
            '<ellipse cx="30" cy="12" rx="14" ry="3.2" fill="#7d838a" transform="rotate(4 30 12)"/>' +
            '</g>' +
            '<g transform="rotate(12 47 20)">' +
            '<rect x="39" y="15" width="17" height="8" rx="1.5" fill="#8e1b1b"/>' +
            '<text x="47.5" y="20.8" text-anchor="middle" font-size="4.2" font-weight="bold" fill="#fff" font-family="Montserrat,sans-serif">2e KEUS</text>' +
            '</g>' +
            '</svg>';
    }

    function svgCanGold() {
        return '<svg viewBox="0 0 60 80" aria-hidden="true">' +
            '<ellipse cx="30" cy="73" rx="21" ry="4.5" fill="rgba(0,0,0,0.35)"/>' +
            '<rect x="9" y="12" width="42" height="58" rx="3" fill="url(#pascalGradGold)" stroke="#8a5a00" stroke-width="1"/>' +
            '<rect x="9" y="26" width="42" height="29" fill="#3a2408" stroke="#8a5a00" stroke-width="0.8"/>' +
            '<text x="30" y="37" text-anchor="middle" font-size="6.6" font-weight="bold" fill="#f4d03f" font-family="Montserrat,sans-serif">BOTERBIER</text>' +
            '<text x="30" y="44" text-anchor="middle" font-size="3.6" fill="#f0e2c0" font-family="Montserrat,sans-serif">9¾% VOL · GOUD EERLIJK</text>' +
            '<text x="30" y="51" text-anchor="middle" font-size="3.4" fill="#d9c294" font-family="Montserrat,sans-serif" font-style="italic">brouwsel v/d Drie Bezemstelen</text>' +
            '<path d="M11,12 q4,7 8,1 q4,7 8,0 q4,7 8,0 q4,7 8,1 q3,5 6,0 l0,-6 l-38,0 Z" fill="#fff8dc" stroke="#e8d9a0" stroke-width="0.6"/>' +
            '<ellipse cx="30" cy="10.5" rx="21" ry="5" fill="#f7dc6f" stroke="#8a5a00" stroke-width="1"/>' +
            '<path class="pascal-spark" d="M14,22 l1.4,3 3,1.4 -3,1.4 -1.4,3 -1.4,-3 -3,-1.4 3,-1.4 Z" fill="#fff"/>' +
            '<path class="pascal-spark" d="M46,58 l1.1,2.4 2.4,1.1 -2.4,1.1 -1.1,2.4 -1.1,-2.4 -2.4,-1.1 2.4,-1.1 Z" fill="#fff"/>' +
            '<rect x="12.5" y="15" width="4" height="52" rx="2" fill="rgba(255,255,255,0.4)"/>' +
            '</svg>';
    }

    var CAN_TYPES = [
        { id: 'good', key: 'a', cls: 'good', weight: 55, svg: svgCanGood, mark: 'OK',     markCls: 'mk-ok' },
        { id: 'dent', key: 's', cls: 'dent', weight: 30, svg: svgCanDent, mark: 'AFKEUR', markCls: 'mk-bad' },
        { id: 'gold', key: 'd', cls: 'gold', weight: 15, svg: svgCanGold, mark: '+50',    markCls: 'mk-gold' }
    ];

    /* ---------------- DOM refs + state ---------------- */

    var container, area, cansWrap, beltEl, figEl, figSvg, headG, stampHead,
        scoreEl, timerEl, bpmEl, comboEl, comboCountEl, multEl,
        feedbackEl, jamEl, jamTextEl, statusEl, resultEl,
        resultGradeEl, resultTitleEl, resultTextEl, resultScoreEl,
        sliderEl, sliderLabelEl, buttons;

    var state = {
        running: false, raf: 0,
        score: 0, combo: 0, maxCombo: 0, cansDone: 0,
        baseBpm: 160, bpm: 130,
        startT: 0, lastT: 0, nextSpawn: 0, jamUntil: 0,
        cans: [], floaters: 0, overdrive: false,
        lastHit: 0, lastTypeId: '', typeRun: 0, tempoApplied: 0
    };
    var jamHideTimer = 0, stampTimer = 0, figTimer = 0;

    function $(id) { return document.getElementById(id); }
    function setText(el, txt) { if (el) el.textContent = txt; }
    function isVisible() { return !!(container && container.offsetParent !== null); }

    /* ---------------- Init ---------------- */

    function init() {
        container = $('pascalGame');
        area = $('pascalArea');
        if (!container || !area) return; // snippet ontbreekt: stilletjes overslaan

        cansWrap = $('pascalCans');
        beltEl = $('pascalBelt');
        figEl = $('pascalFig');
        figSvg = $('pascalFigSvg');
        headG = $('pascalHeadG');
        stampHead = $('pascalStampHead');
        scoreEl = $('pascalScore');
        timerEl = $('pascalTimer');
        bpmEl = $('pascalBpm');
        comboEl = $('pascalCombo');
        comboCountEl = $('pascalComboCount');
        multEl = $('pascalMult');
        feedbackEl = $('pascalFeedback');
        jamEl = $('pascalJam');
        jamTextEl = $('pascalJamText');
        statusEl = $('pascalStatus');
        resultEl = $('pascalResult');
        resultGradeEl = $('pascalResultGrade');
        resultTitleEl = $('pascalResultTitle');
        resultTextEl = $('pascalResultText');
        resultScoreEl = $('pascalResultScore');
        sliderEl = $('pascalSpeedSlider');
        sliderLabelEl = $('pascalSpeedLabel');
        buttons = container.querySelectorAll('.pascal-stamp-btn');

        // Tik op het veld = starten (maar niet via het eindrapport)
        area.addEventListener('click', function (e) {
            if (e.target && e.target.closest && e.target.closest('#pascalResult')) return;
            if (!state.running) start();
        });

        // Toetsenbord: alleen reageren als DIT examen zichtbaar is
        document.addEventListener('keydown', function (e) {
            if (!isVisible() || e.metaKey || e.ctrlKey || e.altKey) return;
            var t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
            var k = (e.key || '').toLowerCase();
            if (state.running) {
                if (k === 'a' || k === 's' || k === 'd') {
                    if (!e.repeat) { pressVisual(k); hit(k); }
                    e.preventDefault();
                }
            } else if ((k === ' ' || k === 'enter') && document.activeElement === area) {
                e.preventDefault();
                start();
            }
        });

        // Stempelknoppen: touchstart/touchend/touchcancel + mousedown/mouseup/mouseleave
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

        // Scrollen blokkeren in eigen speelveld, alléén tijdens de dienst
        area.addEventListener('touchmove', function (e) {
            if (state.running) e.preventDefault();
        }, { passive: false });

        // Dienst-slider
        if (sliderEl) {
            sliderEl.addEventListener('input', function () {
                var p = PRESETS[sliderEl.value] || PRESETS[3];
                state.baseBpm = p.bpm;
                setText(sliderLabelEl, p.label);
                if (!state.running) setText(bpmEl, String(p.bpm - 30));
            });
        }

        // Ander examen actief? Lijn stilzetten.
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
        state.score = 0; state.combo = 0; state.maxCombo = 0; state.cansDone = 0;
        state.overdrive = false; state.jamUntil = 0; state.lastHit = 0;
        state.lastTypeId = ''; state.typeRun = 0; state.tempoApplied = 0;
        if (sliderEl) {
            var p = PRESETS[sliderEl.value] || PRESETS[3];
            state.baseBpm = p.bpm;
        }
        state.bpm = state.baseBpm - 30;

        if (statusEl) statusEl.style.display = 'none';
        if (resultEl) resultEl.style.display = 'none';
        setText(scoreEl, '0');
        setText(timerEl, String(DURATION));
        setText(bpmEl, String(Math.round(state.bpm)));
        if (comboEl) comboEl.style.display = 'none';
        area.classList.add('running');
        area.classList.remove('overdrive');
        try { area.focus({ preventScroll: true }); } catch (err) { /* leeg */ }

        window.__activeGameRunning = true;
        state.startT = performance.now();
        state.lastT = state.startT;
        state.nextSpawn = state.startT + 500;
        applyTempo(state.bpm, true);
        state.raf = requestAnimationFrame(loop);
    }

    function clearRound() {
        if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
        if (jamHideTimer) { clearTimeout(jamHideTimer); jamHideTimer = 0; }
        state.cans.forEach(function (c) { if (c.el && c.el.parentNode) c.el.parentNode.removeChild(c.el); });
        state.cans = [];
        if (jamEl) jamEl.style.display = 'none';
        if (area) area.classList.remove('shake');
    }

    // Stil stoppen (tab-switch): geen rapport, terug naar startscherm
    function abort() {
        if (!area) return;
        var wasRunning = state.running;
        state.running = false;
        clearRound();
        area.classList.remove('running', 'overdrive');
        if (wasRunning) window.__activeGameRunning = false;
        if (resultEl) resultEl.style.display = 'none';
        if (statusEl) statusEl.style.display = 'flex';
        if (comboEl) comboEl.style.display = 'none';
    }

    function finish() {
        state.running = false;
        clearRound();
        area.classList.remove('running', 'overdrive');
        window.__activeGameRunning = false;

        var rank = RANKS[RANKS.length - 1];
        for (var i = 0; i < RANKS.length; i++) {
            if (state.score >= RANKS[i].min) { rank = RANKS[i]; break; }
        }
        var color = GRADE_COLORS[rank.grade] || '#f4d03f';
        if (resultGradeEl) {
            resultGradeEl.textContent = rank.grade;
            resultGradeEl.style.borderColor = color;
            resultGradeEl.style.color = color;
        }
        setText(resultTitleEl, rank.title);
        setText(resultTextEl, state.score >= 3000 ? WIN_TEXT : FAIL_TEXT);
        setText(resultScoreEl, 'Eindscore: ' + state.score + ' · Blikken gekeurd: ' + state.cansDone + ' · Langste serie: ×' + state.maxCombo);
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
        } catch (err) { /* localStorage kapot? Het Ministerie haalt de schouders op. */ }
    }

    /* ---------------- Game loop ---------------- */

    function loop(t) {
        if (!state.running) return;
        var dt = Math.min(50, t - state.lastT);
        state.lastT = t;

        var elapsed = (t - state.startT) / 1000;
        if (elapsed >= DURATION) { finish(); return; }

        var areaW = area.clientWidth;
        var zoneC = areaW * ZONE_FRAC;
        state.bpm = state.baseBpm - 30 + 60 * Math.min(1, elapsed / DURATION);
        var speed = areaW * (state.bpm / 60) * SPEED_FACTOR; // px/s

        // HUD
        var remain = Math.ceil(DURATION - elapsed);
        setText(timerEl, String(remain));
        var bpmShown = Math.round(state.bpm);
        if (bpmEl && bpmEl.textContent !== String(bpmShown)) bpmEl.textContent = String(bpmShown);
        applyTempo(state.bpm, false, speed);

        // Eindsprint
        if (!state.overdrive && elapsed > DURATION - 6) {
            state.overdrive = true;
            area.classList.add('overdrive');
            feedback('TEMPO OMHOOG! 🔥', '#ff6b3d');
        }

        // Spawnen op de beat (2 tellen per blik, met wat jitter)
        if (t >= state.nextSpawn) {
            var travelMs = ((zoneC + 90) / speed) * 1000;
            if ((t - state.startT) + travelMs < DURATION * 1000 - 400) spawnCan();
            state.nextSpawn = t + (120000 / state.bpm) * (0.85 + Math.random() * 0.35);
        }

        // Band beweegt niet zolang de lijn vastloopt
        var jammed = t < state.jamUntil;
        if (beltEl) beltEl.style.animationPlayState = jammed ? 'paused' : 'running';

        for (var i = state.cans.length - 1; i >= 0; i--) {
            var can = state.cans[i];
            if (!jammed) can.x += speed * (dt / 1000);
            can.el.style.transform = 'translateX(' + can.x.toFixed(1) + 'px)';
            if (!can.resolved && can.x + 27 > zoneC + HIT_WINDOW) missCan(can); // 27 = halve blikbreedte
            if (can.x > areaW + 60) {
                if (can.el.parentNode) can.el.parentNode.removeChild(can.el);
                state.cans.splice(i, 1);
            }
        }

        state.raf = requestAnimationFrame(loop);
    }

    // Hak- en bandtempo meebewegen met de BPM (niet elke frame herstarten)
    function applyTempo(bpm, force, speed) {
        if (!force && Math.abs(bpm - state.tempoApplied) < 6) return;
        state.tempoApplied = bpm;
        var beat = (60 / bpm).toFixed(3) + 's';
        if (figEl) figEl.style.animationDuration = beat;
        if (headG) headG.style.animationDuration = beat;
        if (beltEl) {
            var pxPerSec = speed || (area.clientWidth * (bpm / 60) * SPEED_FACTOR);
            var dur = Math.min(0.8, Math.max(0.12, 44 / pxPerSec));
            beltEl.style.animationDuration = dur.toFixed(3) + 's';
        }
    }

    /* ---------------- Blikken ---------------- */

    function pickType() {
        var total = 0, i;
        for (i = 0; i < CAN_TYPES.length; i++) total += CAN_TYPES[i].weight;
        var pick, guard = 0;
        do {
            var r = Math.random() * total;
            for (i = 0; i < CAN_TYPES.length; i++) {
                r -= CAN_TYPES[i].weight;
                if (r <= 0) { pick = CAN_TYPES[i]; break; }
            }
            if (!pick) pick = CAN_TYPES[0];
            guard++;
        } while (pick.id === state.lastTypeId && state.typeRun >= 3 && guard < 8);
        if (pick.id === state.lastTypeId) { state.typeRun++; } else { state.lastTypeId = pick.id; state.typeRun = 1; }
        return pick;
    }

    function spawnCan() {
        if (!cansWrap || state.cans.length >= 8) return;
        var type = pickType();
        var el = document.createElement('div');
        el.className = 'pascal-can ' + type.cls;
        el.innerHTML = type.svg();
        el.style.transform = 'translateX(-70px)';
        cansWrap.appendChild(el);
        state.cans.push({ el: el, type: type, x: -70, resolved: false });
    }

    function missCan(can) {
        can.resolved = true;
        can.el.classList.add('missed');
        state.score = Math.max(0, state.score - 10);
        setText(scoreEl, String(state.score));
        resetCombo();
        jam('DE LIJN LOOPT VAST!');
    }

    /* ---------------- Stempelen ---------------- */

    function hit(key) {
        var now = performance.now();
        if (now - state.lastHit < 90) return; // anti-dubbelklik
        state.lastHit = now;

        var areaW = area.clientWidth;
        var zoneC = areaW * ZONE_FRAC;
        var best = null, bestDist = Infinity;
        for (var i = 0; i < state.cans.length; i++) {
            var c = state.cans[i];
            if (c.resolved) continue;
            var center = c.x + 27; // blik is 54px breed
            var d = Math.abs(center - zoneC);
            if (d <= HIT_WINDOW && d < bestDist) { best = c; bestDist = d; }
        }

        if (!best) {
            resetCombo();
            feedback('TE VROEG, COLLEGA!', '#aaa');
            return;
        }

        if (key !== best.type.key) {
            best.resolved = true;
            best.el.classList.add('missed');
            addStampMark(best, '✗', 'mk-bad');
            state.score = Math.max(0, state.score - 10);
            setText(scoreEl, String(state.score));
            resetCombo();
            jam('VERKEERDE STEMPEL!');
            return;
        }

        // Correct gestempeld
        best.resolved = true;
        best.el.classList.add('done');
        addStampMark(best, best.type.mark, best.type.markCls);
        state.cansDone++;
        state.combo++;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;

        var quality;
        if (bestDist <= 14) quality = { pts: 100, txt: 'HAKKUH! PERFECT!', col: '#f4d03f' };
        else if (bestDist <= 28) quality = { pts: 75, txt: 'STRAK GESTEMPELD!', col: '#2ecc71' };
        else quality = { pts: 50, txt: 'GOED ZO!', col: '#fff' };

        var mult = state.combo >= 16 ? 3 : (state.combo >= 8 ? 2 : 1);
        var pts = quality.pts * mult + (best.type.id === 'gold' ? 50 : 0);
        state.score += pts;
        setText(scoreEl, String(state.score));

        if (best.type.id === 'gold') feedback('🍺 BOTERBIER! +' + pts, '#f4d03f');
        else feedback(quality.txt, quality.col);
        floater('+' + pts, quality.col, zoneC);
        slamStamper();
        animatePascal(key);
        showCombo(mult);
    }

    function addStampMark(can, txt, cls) {
        var mk = document.createElement('div');
        mk.className = 'pascal-stampmark ' + cls;
        mk.textContent = txt;
        can.el.appendChild(mk);
    }

    function resetCombo() {
        state.combo = 0;
        if (comboEl) comboEl.style.display = 'none';
    }

    function showCombo(mult) {
        if (!comboEl || state.combo < 2) return;
        setText(comboCountEl, String(state.combo));
        setText(multEl, mult > 1 ? ' · punten ×' + mult : '');
        comboEl.style.display = 'block';
        comboEl.style.animation = 'none';
        void comboEl.offsetHeight; // reflow-truc: animatie herstarten
        comboEl.style.animation = 'pascalComboPulse 0.3s ease';
    }

    /* ---------------- Effecten ---------------- */

    function feedback(msg, color) {
        if (!feedbackEl) return;
        feedbackEl.textContent = msg;
        feedbackEl.style.color = color;
        feedbackEl.style.animation = 'none';
        void feedbackEl.offsetHeight;
        feedbackEl.style.animation = 'pascalPop 0.65s ease-out';
    }

    function floater(txt, color, x) {
        if (!area || state.floaters >= 8) return;
        state.floaters++;
        var el = document.createElement('div');
        el.textContent = txt;
        el.style.cssText = 'position:absolute;bottom:240px;left:' + Math.round(x) +
            'px;transform:translate(-50%,0);z-index:7;pointer-events:none;font-family:Montserrat,sans-serif;' +
            'font-weight:800;font-size:1.1rem;color:' + color +
            ';text-shadow:0 2px 8px rgba(0,0,0,0.8);animation:pascalFloatUp 0.85s ease-out forwards;';
        area.appendChild(el);
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
            state.floaters--;
        }, 900);
    }

    function jam(msg) {
        state.jamUntil = performance.now() + 420;
        if (jamTextEl) jamTextEl.textContent = msg;
        if (jamEl) {
            jamEl.style.display = 'flex';
            jamEl.style.animation = 'none';
            void jamEl.offsetHeight;
            jamEl.style.animation = 'pascalJamFlash 0.6s ease-out';
            if (jamHideTimer) clearTimeout(jamHideTimer);
            jamHideTimer = setTimeout(function () { jamEl.style.display = 'none'; }, 620);
        }
        area.classList.remove('shake');
        void area.offsetWidth;
        area.classList.add('shake');
        feedback(msg + ' −10', '#e74c3c');
    }

    function slamStamper() {
        if (!stampHead) return;
        stampHead.classList.add('hit');
        if (stampTimer) clearTimeout(stampTimer);
        stampTimer = setTimeout(function () { stampHead.classList.remove('hit'); }, 110);
    }

    // Pascal hakt mee: per stempel een move (op het svg-element, want de
    // container bob-animatie zou een inline transform overschrijven)
    function animatePascal(key) {
        if (!figSvg) return;
        var tf = key === 'a' ? 'rotate(-10deg) translateY(-4px)'
            : key === 's' ? 'rotate(10deg) translateY(-4px)'
            : 'translateY(-14px) scale(1.06)';
        figSvg.style.transform = tf;
        if (figTimer) clearTimeout(figTimer);
        figTimer = setTimeout(function () { figSvg.style.transform = ''; }, 130);
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

    window.pascalGameStart = function () {
        if (!area) return;
        start();
    };
})();
