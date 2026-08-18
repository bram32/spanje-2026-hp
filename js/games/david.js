/* =====================================================================
   EXAMEN 6 — 🏛️ ONTSNAPPING UIT FLORENCE (Verweer tegen de Duistere Rijen)
   ---------------------------------------------------------------------
   David zit voor werk vast in Florence — openluchtmuseum op maximale
   capaciteit — terwijl het weekend donderdag begint. Hij zou 'kijken
   of hij het kon inkorten'; het Ministerie: inkorten is geen optie,
   het is een OPDRACHT. 45s door drie steegjes naar het vliegveld:
   ontwijk 🤳 selfiesticks, ☂️ gidsen met toeristensliert, 🍦 gelato-
   karren en DE RIJ VOOR DE RIJ (2 lanes dicht). ☕ = 2s sprint ·
   🎫 = +100 · 🧳 verloren koffer = +250 (spawnt één keer).
   Duomo → Ponte Vecchio → Stazione → AEROPORTO.
   Enige global: window.davidGameStart
   ===================================================================== */
(function () {
    'use strict';

    var GAME_KEY = 'david';
    var DURATION = 45;          // seconden tot de gate sluit
    var GOAL = 1000;            // afstandseenheden Duomo → Aeroporto
    var BASE_PROG = 25;         // voortgang/s (foutloze run ≈ 40s)
    var BOOST_MULT = 1.55;      // espresso-sprint
    var BOOST_MS = 2000;
    var STUN_MS = 2000;         // struikelen = 2s stilstand
    var STUN_SCROLL = 0.3;      // de meute schuifelt door terwijl David opkrabbelt
    var LANE_X = [16.66, 50, 83.34]; // steegje-centra in %
    var DAVID_HALF = 30;        // halve botshoogte van David

    var STUN_TXT = ['SCUSI!', 'NOG EEN RONDLEIDING?!', 'FOTO? NO GRAZIE.', 'PERMESSO! PERMESSO!', 'MAMMA MIA, M’N VLUCHT!'];

    var SEGMENTS = [
        { p: 0.00, label: '🏛️ Duomo — max. capaciteit' },
        { p: 0.33, label: '🌉 Ponte Vecchio — selfiedichtheid: extreem' },
        { p: 0.66, label: '🚉 Stazione — de gate lonkt' }
    ];

    // Obstakel- en pickup-types: h = halve botshoogte in px (y = middelpunt)
    var OB = {
        selfie:   { harm: true,  h: 26, cls: 'david-ob-selfie' },
        gelato:   { harm: true,  h: 30, cls: 'david-ob-gelato' },
        guide:    { harm: true,  h: 55, cls: 'david-ob-guide' },
        wall:     { harm: true,  h: 24, cls: 'david-ob-wall' },
        espresso: { harm: false, h: 22, cls: 'david-ob-espresso', pts: 50 },
        pass:     { harm: false, h: 22, cls: 'david-ob-pass',     pts: 100 },
        koffer:   { harm: false, h: 22, cls: 'david-ob-koffer',   pts: 250 }
    };

    var GRADE_COLORS = { U: '#f4d03f', B: '#2ecc71', A: '#5dade2', Z: '#e67e22', T: '#e74c3c' };
    var TIER_POINTS = { U: 100, B: 75, A: 50, Z: 25, T: 0 };

    /* ---------------- DOM refs + state ---------------- */

    var container, area, streetEl, obsWrap, figEl, figSvg,
        scoreEl, timerEl, phaseEl, boostPill,
        progFill, progMarker,
        feedbackEl, splashEl, splashTextEl, statusEl, resultEl,
        resultGradeEl, resultTitleEl, resultTextEl, resultScoreEl, buttons;

    var state = {
        running: false, raf: 0,
        lane: 1, dist: 0, bonus: 0,
        dodged: 0, hits: 0, espressos: 0, passes: 0, gotCase: false,
        stunUntil: 0, boostUntil: 0,
        startT: 0, lastT: 0, nextSpawn: 0, nextWall: 0,
        caseAt: 0, caseSpawned: false,
        obs: [], floaters: 0, segment: 0, shownScore: -1,
        recentHarm: []
    };
    var splashHideTimer = 0, stumbleTimer = 0, leanTimer = 0;

    function $(id) { return document.getElementById(id); }
    function setText(el, txt) { if (el) el.textContent = txt; }
    function isVisible() { return !!(container && container.offsetParent !== null); }

    /* ---------------- Init ---------------- */

    function init() {
        container = $('davidGame');
        area = $('davidArea');
        if (!container || !area) return; // snippet ontbreekt: stilletjes overslaan

        streetEl = $('davidStreet');
        obsWrap = $('davidObs');
        figEl = $('davidFig');
        figSvg = $('davidFigSvg');
        scoreEl = $('davidScore');
        timerEl = $('davidTimer');
        phaseEl = $('davidPhase');
        boostPill = $('davidBoostPill');
        progFill = $('davidProgFill');
        progMarker = $('davidProgMarker');
        feedbackEl = $('davidFeedback');
        splashEl = $('davidSplash');
        splashTextEl = $('davidSplashText');
        statusEl = $('davidStatus');
        resultEl = $('davidResult');
        resultGradeEl = $('davidResultGrade');
        resultTitleEl = $('davidResultTitle');
        resultTextEl = $('davidResultText');
        resultScoreEl = $('davidResultScore');
        buttons = container.querySelectorAll('.david-lane-btn');

        // Tik op het veld: niet bezig = starten, bezig = van steegje wisselen (links/rechts helft)
        area.addEventListener('click', function (e) {
            if (e.target && e.target.closest && e.target.closest('#davidResult')) return;
            if (!state.running) { start(); return; }
            var r = area.getBoundingClientRect();
            move((e.clientX - r.left) < r.width / 2 ? -1 : 1);
        });

        // Toetsenbord: alleen reageren als DIT examen zichtbaar is
        document.addEventListener('keydown', function (e) {
            if (!isVisible() || e.metaKey || e.ctrlKey || e.altKey) return;
            var t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
            var k = (e.key || '').toLowerCase();
            if (state.running) {
                if (k === 'arrowleft' || k === 'a') {
                    if (!e.repeat) { pressVisual('left'); move(-1); }
                    e.preventDefault();
                } else if (k === 'arrowright' || k === 'd') {
                    if (!e.repeat) { pressVisual('right'); move(1); }
                    e.preventDefault();
                }
            } else if ((k === ' ' || k === 'enter') && document.activeElement === area) {
                e.preventDefault();
                start();
            }
        });

        // Steegjesknoppen: touchstart/touchend/touchcancel + mousedown/mouseup/mouseleave
        Array.prototype.forEach.call(buttons || [], function (btn) {
            var key = btn.getAttribute('data-key');
            function act() { if (state.running) { move(key === 'left' ? -1 : 1); } else { start(); } }
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

        // Scrollen blokkeren in eigen speelveld, alléén tijdens de vlucht
        area.addEventListener('touchmove', function (e) {
            if (state.running) e.preventDefault();
        }, { passive: false });

        // Ander examen actief? David blijft dan even in de rij staan.
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
        state.lane = 1; state.dist = 0; state.bonus = 0;
        state.dodged = 0; state.hits = 0; state.espressos = 0; state.passes = 0;
        state.gotCase = false; state.stunUntil = 0; state.boostUntil = 0;
        state.caseSpawned = false;
        state.caseAt = 18000 + Math.random() * 10000; // de koffer duikt één keer op
        state.segment = 0; state.shownScore = -1; state.recentHarm = [];

        if (statusEl) statusEl.style.display = 'none';
        if (resultEl) resultEl.style.display = 'none';
        setText(scoreEl, '0');
        setText(timerEl, String(DURATION));
        setText(phaseEl, SEGMENTS[0].label);
        if (progFill) progFill.style.width = '0%';
        if (progMarker) progMarker.style.left = '0%';
        if (boostPill) boostPill.style.display = 'none';
        placeFig();
        area.classList.add('running');
        area.classList.remove('boost');
        try { area.focus({ preventScroll: true }); } catch (err) { /* leeg */ }

        window.__activeGameRunning = true;
        state.startT = performance.now();
        state.lastT = state.startT;
        state.nextSpawn = state.startT + 900;
        state.nextWall = state.startT + 5200 + Math.random() * 1500;
        state.raf = requestAnimationFrame(loop);
    }

    function clearRound() {
        if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
        if (splashHideTimer) { clearTimeout(splashHideTimer); splashHideTimer = 0; }
        if (stumbleTimer) { clearTimeout(stumbleTimer); stumbleTimer = 0; }
        if (leanTimer) { clearTimeout(leanTimer); leanTimer = 0; }
        state.obs.forEach(function (o) { if (o.el && o.el.parentNode) o.el.parentNode.removeChild(o.el); });
        state.obs = [];
        if (splashEl) splashEl.style.display = 'none';
        if (figEl) figEl.classList.remove('stumble', 'lean');
        if (area) area.classList.remove('shake');
    }

    // Stil stoppen (tab-switch): geen rapport, terug naar startscherm
    function abort() {
        if (!area) return;
        var wasRunning = state.running;
        state.running = false;
        clearRound();
        area.classList.remove('running', 'boost');
        if (wasRunning) window.__activeGameRunning = false;
        if (resultEl) resultEl.style.display = 'none';
        if (statusEl) statusEl.style.display = 'flex';
        if (boostPill) boostPill.style.display = 'none';
    }

    function finish(escaped, elapsed) {
        state.running = false;
        clearRound();
        area.classList.remove('running', 'boost');
        window.__activeGameRunning = false;
        if (boostPill) boostPill.style.display = 'none';

        // Tijdsbonus: wie eerder bij de gate is, drinkt eerder in Marbella
        var timeBonus = escaped ? Math.max(0, Math.round(DURATION - elapsed)) * 15 : 0;
        var total = totalScore() + timeBonus;
        var pct = Math.min(1, state.dist / GOAL);

        var grade, title, text;
        if (escaped && total >= 2800) {
            grade = 'U';
            title = 'DECREET 30-10 VOLBRACHT — vrijdagmiddag aan het zwembad';
            text = 'Het Ministerie heft de verhindering officieel op. De snor checkt vrijdag in aan het zwembad — en nooit meer aperol voor bezemsteelprijzen.';
        } else if (escaped) {
            grade = 'B';
            title = 'Ontsnapt — de snor heeft Florence verlaten';
            text = 'Gate gehaald. Achtduizend Amerikanen zwaaien hem uit met selfiesticks; David zwaait niet terug.';
        } else if (pct >= 0.8) {
            grade = 'A';
            title = 'Nog één rondje Duomo, helaas';
            text = 'De gate sloot terwijl een gids nóg even iets over fresco’s vertelde. Morgen nieuwe kans — de rij staat er al.';
        } else {
            grade = 'T';
            title = 'Voor eeuwig in de rij — stuur maar een uil vanuit de Uffizi';
            text = 'Florence heeft er een vaste bewoner bij: vak C, rij 8.000, direct achter de man met de paraplu.';
        }

        var color = GRADE_COLORS[grade] || '#b03a2e';
        if (resultGradeEl) {
            resultGradeEl.textContent = grade;
            resultGradeEl.style.borderColor = color;
            resultGradeEl.style.color = color;
        }
        setText(resultTitleEl, title);
        setText(resultTextEl, text);
        setText(resultScoreEl, 'Eindscore: ' + total +
            ' · Florence: ' + Math.round(pct * 100) + '% afgelegd' +
            ' · Ontweken: ' + state.dodged +
            ' · ☕ ' + state.espressos + ' · 🎫 ' + state.passes +
            (state.gotCase ? ' · 🧳 terug!' : '') +
            (timeBonus > 0 ? ' · Tijdsbonus +' + timeBonus : ''));
        if (resultEl) resultEl.style.display = 'block';
        savePunten(grade);
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
        } catch (err) { /* localStorage kapot? Il Ministero haalt de schouders op. */ }
    }

    function totalScore() {
        return state.bonus + Math.round(state.dist * 2);
    }

    /* ---------------- Game loop ---------------- */

    function loop(t) {
        if (!state.running) return;
        var dt = Math.min(50, t - state.lastT);
        state.lastT = t;

        var elapsed = (t - state.startT) / 1000;
        if (elapsed >= DURATION) { finish(false, DURATION); return; }

        var streetH = streetEl ? streetEl.clientHeight : (area.clientHeight - 96);
        var davidY = streetH - 62;
        var stunned = t < state.stunUntil;
        var boosted = t < state.boostUntil;

        // Snelheid: de stad wordt drukker, espresso maakt sneller, struikelen trager
        var scroll = streetH * (0.62 + 0.18 * (elapsed / DURATION));
        if (boosted) scroll *= BOOST_MULT;
        if (stunned) scroll *= STUN_SCROLL;

        // Voortgang richting AEROPORTO (staat stil zolang David op de grond ligt)
        if (!stunned) state.dist += BASE_PROG * (boosted ? BOOST_MULT : 1) * (dt / 1000);
        if (state.dist >= GOAL) { state.dist = GOAL; finish(true, elapsed); return; }

        // HUD
        setText(timerEl, String(Math.ceil(DURATION - elapsed)));
        var total = totalScore();
        if (total !== state.shownScore) { state.shownScore = total; setText(scoreEl, String(total)); }
        var pct = state.dist / GOAL;
        if (progFill) progFill.style.width = (pct * 100).toFixed(1) + '%';
        if (progMarker) progMarker.style.left = (pct * 100).toFixed(1) + '%';
        area.classList.toggle('boost', boosted);
        if (boostPill) boostPill.style.display = boosted ? 'block' : 'none';

        // Etappe-bordjes
        var seg = 0;
        for (var s = SEGMENTS.length - 1; s >= 0; s--) {
            if (pct >= SEGMENTS[s].p) { seg = s; break; }
        }
        if (seg !== state.segment) {
            state.segment = seg;
            setText(phaseEl, SEGMENTS[seg].label);
            shout(seg === 1 ? '🌉 PONTE VECCHIO VOORBIJ!' : '🚉 STAZIONE — BIJNA!');
        }

        // Spawnen: gewone obstakels + periodiek DE RIJ VOOR DE RIJ
        if (t >= state.nextWall && elapsed > 5) {
            spawnWall(t);
            state.nextWall = t + 6500 + Math.random() * 2500;
            state.nextSpawn = Math.max(state.nextSpawn, t + 1000); // adempauze na de rij
        }
        if (t >= state.nextSpawn) {
            spawnSomething(t, elapsed);
            var iv = (640 - 200 * (elapsed / DURATION)) * (0.85 + Math.random() * 0.4);
            state.nextSpawn = t + iv;
        }
        if (!state.caseSpawned && (t - state.startT) >= state.caseAt) {
            state.caseSpawned = true;
            spawnOb('koffer', freeLane(), t);
        }

        // Obstakels bewegen + botsen
        for (var i = state.obs.length - 1; i >= 0; i--) {
            var ob = state.obs[i];
            ob.y += scroll * (dt / 1000);
            ob.el.style.transform = 'translate(-50%,' + (ob.y - ob.h).toFixed(1) + 'px)';
            if (!ob.done) {
                var dy = Math.abs(ob.y - davidY);
                if (dy < ob.h + DAVID_HALF && ob.lanes.indexOf(state.lane) !== -1) {
                    if (ob.harm) {
                        if (t > state.stunUntil + 350) { ob.done = true; hitObstacle(ob, t); }
                    } else {
                        ob.done = true;
                        collect(ob, t);
                    }
                } else if (ob.harm && ob.y > davidY + ob.h + DAVID_HALF) {
                    ob.done = true;
                    state.dodged++;
                    state.bonus += 10; // netjes langs de toerist: +10
                }
            }
            if (ob.y > streetH + 140) {
                if (ob.el.parentNode) ob.el.parentNode.removeChild(ob.el);
                state.obs.splice(i, 1);
            }
        }

        state.raf = requestAnimationFrame(loop);
    }

    /* ---------------- Spawnen ---------------- */

    // Nooit alle drie de steegjes tegelijk dichtgooien
    function pickHarmLane(t) {
        state.recentHarm = state.recentHarm.filter(function (r) { return t - r.t < 800; });
        var seen = {};
        state.recentHarm.forEach(function (r) { seen[r.lane] = true; });
        var lanes = Object.keys(seen);
        if (lanes.length >= 2) return parseInt(lanes[Math.floor(Math.random() * lanes.length)], 10);
        return Math.floor(Math.random() * 3);
    }

    // Voor pickups: liefst een steegje zonder vers obstakel bovenin
    function freeLane() {
        var lane = Math.floor(Math.random() * 3);
        for (var attempt = 0; attempt < 3; attempt++) {
            var busy = state.obs.some(function (o) { return o.harm && o.y < 60 && o.lanes.indexOf(lane) !== -1; });
            if (!busy) return lane;
            lane = (lane + 1) % 3;
        }
        return lane;
    }

    function spawnSomething(t, elapsed) {
        var r = Math.random() * 100;
        // gewichten: selfie 26 · gelato 22 · gids 14 · espresso 14 · boardingpass 12 · adempauze 12
        if (r < 26) spawnOb('selfie', pickHarmLane(t), t);
        else if (r < 48) spawnOb('gelato', pickHarmLane(t), t);
        else if (r < 62) spawnOb(elapsed > 6 ? 'guide' : 'selfie', pickHarmLane(t), t);
        else if (r < 76) spawnOb('espresso', freeLane(), t);
        else if (r < 88) spawnOb('pass', freeLane(), t);
        // anders: heel even niemand — geniet ervan, het duurt niet lang
    }

    function obHTML(type) {
        if (type === 'selfie') return '<span class="david-swing">🤳</span><i class="david-ob-tag">I ❤ FIRENZE</i>';
        if (type === 'gelato') return '<b>🍦</b><i>GELATO · €12</i>';
        if (type === 'guide') return '<span class="david-guide-um">☂️</span><span class="david-guide-t">🧢</span><span class="david-guide-t">📷</span><span class="david-guide-t">🎒</span><span class="david-guide-t">👒</span>';
        if (type === 'espresso') return '<span>☕</span>';
        if (type === 'pass') return '<span>🎫</span>';
        if (type === 'koffer') return '<span>🧳</span>';
        return '';
    }

    function spawnOb(type, lane, t) {
        if (!obsWrap || state.obs.length >= 16) return;
        var def = OB[type];
        var el = document.createElement('div');
        el.className = 'david-ob ' + def.cls;
        el.innerHTML = obHTML(type);
        el.style.left = LANE_X[lane] + '%';
        el.style.transform = 'translate(-50%,-' + (def.h * 2 + 40) + 'px)';
        obsWrap.appendChild(el);
        state.obs.push({ el: el, type: type, lanes: [lane], y: -(def.h + 40), h: def.h, harm: def.harm, done: false });
        if (def.harm) state.recentHarm.push({ lane: lane, t: t });
    }

    // DE RIJ VOOR DE RIJ: dranghek over twee steegjes, één blijft open
    function spawnWall(t) {
        if (!obsWrap || state.obs.length >= 16) return;
        var open = Math.random() < 0.5 ? 0 : 2;
        var lanes = open === 0 ? [1, 2] : [0, 1];
        var el = document.createElement('div');
        el.className = 'david-ob david-ob-wall';
        el.innerHTML = '<i>🧍🧍🧍🧍🧍</i><b>DE RIJ VOOR DE RIJ</b>';
        el.style.left = (open === 0 ? 66.66 : 33.34) + '%';
        el.style.transform = 'translate(-50%,-120px)';
        obsWrap.appendChild(el);
        state.obs.push({ el: el, type: 'wall', lanes: lanes, y: -120, h: OB.wall.h, harm: true, done: false });
        state.recentHarm.push({ lane: lanes[0], t: t });
        state.recentHarm.push({ lane: lanes[1], t: t });
    }

    /* ---------------- Botsen + rapen ---------------- */

    function hitObstacle(ob, t) {
        state.stunUntil = t + STUN_MS;
        state.boostUntil = 0; // espresso werkt niet tegen een paraplu in je gezicht
        state.hits++;
        ob.el.classList.add('bonk');
        if (figEl) {
            figEl.classList.remove('stumble');
            void figEl.offsetWidth; // reflow-truc: animatie herstarten
            figEl.classList.add('stumble');
            if (stumbleTimer) clearTimeout(stumbleTimer);
            stumbleTimer = setTimeout(function () { figEl.classList.remove('stumble'); }, STUN_MS);
        }
        splash(STUN_TXT[Math.floor(Math.random() * STUN_TXT.length)]);
    }

    function collect(ob, t) {
        var def = OB[ob.type];
        ob.el.classList.add('got');
        state.bonus += def.pts;
        if (ob.type === 'espresso') {
            state.espressos++;
            state.boostUntil = Math.max(state.boostUntil, t) + BOOST_MS;
            feedback('☕ ESPRESSO — SPRINT! +' + def.pts, '#f4d03f');
        } else if (ob.type === 'pass') {
            state.passes++;
            feedback('🎫 BOARDING PASS +' + def.pts, '#2ecc71');
        } else {
            state.gotCase = true;
            feedback('🧳 KOFFER TERUG! +' + def.pts, '#f4d03f');
        }
        floater('+' + def.pts, '#f4d03f', ob.lanes[0]);
    }

    /* ---------------- Sturen ---------------- */

    function move(dir) {
        if (!state.running) return;
        var nl = Math.max(0, Math.min(2, state.lane + dir));
        if (nl === state.lane) return;
        state.lane = nl;
        placeFig();
        if (figEl) {
            figEl.classList.remove('lean');
            void figEl.offsetWidth;
            figEl.classList.add('lean');
            if (leanTimer) clearTimeout(leanTimer);
            leanTimer = setTimeout(function () { figEl.classList.remove('lean'); }, 180);
        }
    }

    function placeFig() {
        if (figEl) figEl.style.left = LANE_X[state.lane] + '%';
    }

    /* ---------------- Effecten ---------------- */

    function feedback(msg, color) {
        if (!feedbackEl) return;
        feedbackEl.textContent = msg;
        feedbackEl.style.color = color;
        feedbackEl.style.animation = 'none';
        void feedbackEl.offsetHeight;
        feedbackEl.style.animation = 'davidPop 0.65s ease-out';
    }

    function floater(txt, color, laneIdx) {
        if (!area || !streetEl || state.floaters >= 8) return;
        state.floaters++;
        var x = streetEl.offsetLeft + streetEl.clientWidth * (LANE_X[laneIdx] / 100);
        var el = document.createElement('div');
        el.textContent = txt;
        el.style.cssText = 'position:absolute;bottom:150px;left:' + Math.round(x) +
            'px;transform:translate(-50%,0);z-index:7;pointer-events:none;font-family:Montserrat,sans-serif;' +
            'font-weight:800;font-size:1.1rem;color:' + color +
            ';text-shadow:0 2px 8px rgba(0,0,0,0.8);animation:davidFloatUp 0.85s ease-out forwards;';
        area.appendChild(el);
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
            state.floaters--;
        }, 900);
    }

    // Grote kreet dwars over de straat bij etappes
    function shout(txt) {
        if (!area || state.floaters >= 8) return;
        state.floaters++;
        var el = document.createElement('div');
        el.textContent = txt;
        el.style.cssText = 'position:absolute;top:30%;left:50%;transform:translate(-50%,0);z-index:7;' +
            'pointer-events:none;font-family:Montserrat,sans-serif;font-weight:800;font-size:1.3rem;' +
            'letter-spacing:1px;color:#f4d03f;white-space:nowrap;' +
            'text-shadow:0 2px 12px rgba(0,0,0,0.9);animation:davidShoutUp 1.1s ease-out forwards;';
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
            splashEl.style.animation = 'davidSplashFlash 0.6s ease-out';
            if (splashHideTimer) clearTimeout(splashHideTimer);
            splashHideTimer = setTimeout(function () { splashEl.style.display = 'none'; }, 620);
        }
        area.classList.remove('shake');
        void area.offsetWidth;
        area.classList.add('shake');
        feedback(msg + ' · 2s KWIJT', '#e74c3c');
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

    window.davidGameStart = function () {
        if (!area) return;
        start();
    };
})();
