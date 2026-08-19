/* ═══ KELDERPROEF VI · VLUCHT UIT FLORENCE (David) — ontwijken ═══
   Drie banen, vallende rijen/selfiesticks/koffers, pak 🎫 en ☕.
   45 seconden tot de gate. Drie botsingen = achteraan aansluiten. */
(function () {
  'use strict';
  var t = function (en, nl) { return window.FC ? window.FC.t(en, nl) : en; };

  var area, statusEl, resultEl, lanes, speler, timerEl, levensEl, scoreEl;
  var actief = false;
  var baan = 1, score = 0, tijd = 45, levens = 3, pickups = 0;
  var objecten = [];
  var raf = null, spawnTimer = null, klokTimer = null;
  var laatsteTijd = 0;

  var OBSTAKELS = ['🧍', '🤳', '🛄'];
  var PICKUPS = [{ emoji: '🎫', punten: 15 }, { emoji: '☕', punten: 10 }];

  function init() {
    area = document.getElementById('davidArea');
    statusEl = document.getElementById('davidStatus');
    resultEl = document.getElementById('davidResult');
    lanes = document.getElementById('davidLanes');
    speler = document.getElementById('davidPlayer');
    timerEl = document.getElementById('davidTimer');
    levensEl = document.getElementById('davidLevens');
    scoreEl = document.getElementById('davidScore');
    if (!area || !statusEl || !lanes) return;
    statusEl.addEventListener('click', start);
    lanes.addEventListener('click', function (e) {
      if (!actief) return;
      var rect = lanes.getBoundingClientRect();
      var x = e.clientX - rect.left;
      if (x < rect.width / 2) beweeg(-1); else beweeg(1);
    });
    document.addEventListener('keydown', function (e) {
      if (!actief) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); beweeg(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); beweeg(1); }
    });
  }

  function start() {
    baan = 1; score = 0; tijd = 45; levens = 3; pickups = 0;
    objecten.forEach(function (o) { if (o.el.parentNode) o.el.parentNode.removeChild(o.el); });
    objecten = [];
    actief = true;
    window.__activeGameRunning = true;
    statusEl.style.display = 'none';
    resultEl.classList.remove('zichtbaar');
    area.style.display = 'block';
    plaatsSpeler();
    hud();
    laatsteTijd = performance.now();
    raf = requestAnimationFrame(stap);
    plan();
    klokTimer = window.setInterval(function () {
      tijd--;
      hud();
      if (tijd <= 0) einde(true);
    }, 1000);
  }
  window.davidGameStart = start;

  function hud() {
    if (timerEl) timerEl.textContent = tijd + ' s';
    if (levensEl) levensEl.textContent = levens > 0 ? new Array(levens + 1).join('👨🏼') : '—';
    if (scoreEl) scoreEl.textContent = score;
  }

  function beweeg(richting) {
    baan = Math.max(0, Math.min(2, baan + richting));
    plaatsSpeler();
  }
  function plaatsSpeler() {
    if (speler) speler.style.left = (baan * 33.33) + '%';
  }

  function plan() {
    if (!actief) return;
    spawn();
    var tempo = Math.max(430, 750 - (45 - tijd) * 8);
    spawnTimer = window.setTimeout(plan, tempo);
  }

  function spawn() {
    var isPickup = Math.random() < 0.28;
    var el = document.createElement('div');
    el.className = 'david-obj' + (isPickup ? ' pakketje' : '');
    var def = null;
    if (isPickup) {
      def = PICKUPS[Math.floor(Math.random() * PICKUPS.length)];
      el.textContent = def.emoji;
    } else {
      el.textContent = OBSTAKELS[Math.floor(Math.random() * OBSTAKELS.length)];
    }
    var objBaan = Math.floor(Math.random() * 3);
    el.style.left = (objBaan * 33.33) + '%';
    lanes.appendChild(el);
    objecten.push({ el: el, baan: objBaan, y: -50, pickup: def });
  }

  function stap(nu) {
    if (!actief) return;
    var dt = Math.min(50, nu - laatsteTijd);
    laatsteTijd = nu;
    var hoogte = lanes.clientHeight;
    var snelheid = (0.18 + (45 - tijd) * 0.003) * dt;
    var spelerZone = hoogte - 64;

    for (var i = objecten.length - 1; i >= 0; i--) {
      var o = objecten[i];
      o.y += snelheid;
      o.el.style.top = o.y + 'px';
      var raakt = o.baan === baan && o.y > spelerZone && o.y < hoogte - 6;
      if (raakt) {
        if (o.pickup) {
          score += o.pickup.punten;
          pickups++;
        } else {
          levens--;
          area.classList.add('david-au');
          window.setTimeout(function () { area.classList.remove('david-au'); }, 340);
          if (levens <= 0) {
            verwijder(i);
            hud();
            einde(false);
            return;
          }
        }
        verwijder(i);
        hud();
        continue;
      }
      if (o.y > hoogte + 20) {
        score += o.pickup ? 0 : 2; /* ontweken obstakel */
        verwijder(i);
      }
    }
    if (scoreEl) scoreEl.textContent = score;
    raf = requestAnimationFrame(stap);
  }

  function verwijder(i) {
    var o = objecten[i];
    if (o.el.parentNode) o.el.parentNode.removeChild(o.el);
    objecten.splice(i, 1);
  }

  function einde(gehaald) {
    actief = false;
    window.__activeGameRunning = false;
    if (raf) cancelAnimationFrame(raf);
    if (spawnTimer) clearTimeout(spawnTimer);
    if (klokTimer) clearInterval(klokTimer);
    objecten.forEach(function (o) { if (o.el.parentNode) o.el.parentNode.removeChild(o.el); });
    objecten = [];
    area.style.display = 'none';
    resultEl.classList.add('zichtbaar');

    if (gehaald) score += 30;

    var grade, titel, tekst;
    if (gehaald && score >= 150) {
      grade = 'T'; titel = t('GATE REACHED, HAIR INTACT', 'GATE GEHAALD, KAPSEL INTACT');
      tekst = t('Friday, 16:00, AGP. The moustache did not move a millimetre. Florence will hear about this.',
                'Vrijdag, 16:00, AGP. De snor bewoog geen millimeter. Florence zal hiervan horen.');
    } else if (gehaald && score >= 90) {
      grade = 'A'; titel = t('MADE THE FLIGHT', 'VLUCHT GEHAALD');
      tekst = t('Slightly crumpled, fully boarded. The assignment was clear and it is done.',
                'Licht gekreukt, volledig geboard. De opdracht was helder en hij is volbracht.');
    } else if (gehaald) {
      grade = 'B'; titel = t('LAST CALL', 'LAATSTE OPROEP');
      tekst = t('You made it as they closed the door. The espresso helped: ' + pickups + ' pickups.',
                'Je haalde het terwijl de deur dichtging. De espresso hielp: ' + pickups + ' pickups.');
    } else {
      grade = 'K'; titel = t('BACK OF THE QUEUE', 'ACHTERAAN AANSLUITEN');
      tekst = t('A selfie stick got you. In Florence, the queue is forever.', 'Een selfiestick werd je fataal. In Florence is de rij voorgoed.');
    }
    document.getElementById('davidResultGrade').textContent = grade;
    document.getElementById('davidResultTitle').textContent = titel;
    document.getElementById('davidResultText').textContent = tekst;
    document.getElementById('davidResultScore').textContent = score + ' ' + t('points', 'punten') + ' · ' + pickups + ' pickups';
    var geteld = Math.min(score, 150);
    document.getElementById('davidResultPoints').textContent = '+' + geteld + ' Mayhem';
    if (window.FC) window.FC.meldScore('david', geteld);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
