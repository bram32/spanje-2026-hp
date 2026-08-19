/* ═══ KELDERPROEF V · DE STOEPWACHT (Jaap) — reactie ═══
   Drie dagen op de stoep. Tik op de deur zodra hij openzwaait.
   Te vroeg tikken is aankloppen. Aankloppen is dag één. */
(function () {
  'use strict';
  var t = function (en, nl) { return window.FC ? window.FC.t(en, nl) : en; };

  var area, statusEl, resultEl, deur, deurEl, msgEl, dagEl, bestEl, scoreEl, wachter;
  var actief = false;
  var dag = 1, score = 0, reacties = [];
  var wachtTimer = null, vensterTimer = null;
  var deurOpen = false, wachtFase = false;

  var WACHT_TEKSTEN = [
    { en: 'Day {d}. No food. No encouragement. Wait.', nl: 'Dag {d}. Geen eten. Geen aanmoediging. Wachten.' },
    { en: 'Day {d}. It rains. You do not exist yet.', nl: 'Dag {d}. Het regent. Je bestaat nog niet.' },
    { en: 'Day {d}. Someone inside laughs. Not at you. Probably.', nl: 'Dag {d}. Binnen lacht iemand. Niet om jou. Waarschijnlijk.' }
  ];

  function init() {
    area = document.getElementById('jaapArea');
    statusEl = document.getElementById('jaapStatus');
    resultEl = document.getElementById('jaapResult');
    deur = document.getElementById('jaapDeur');
    deurEl = document.getElementById('jaapDeurblad');
    msgEl = document.getElementById('jaapMsg');
    dagEl = document.getElementById('jaapDag');
    bestEl = document.getElementById('jaapBest');
    scoreEl = document.getElementById('jaapScore');
    wachter = document.getElementById('jaapWachter');
    if (!area || !statusEl || !deur) return;
    statusEl.addEventListener('click', start);
    deur.addEventListener('click', tik);
  }

  function start() {
    dag = 1; score = 0; reacties = [];
    actief = true;
    window.__activeGameRunning = true;
    statusEl.style.display = 'none';
    resultEl.classList.remove('zichtbaar');
    area.style.display = 'block';
    hud();
    nieuweDag();
  }
  window.jaapGameStart = start;

  function hud() {
    if (dagEl) dagEl.textContent = t('day ', 'dag ') + dag + ' / 3';
    if (scoreEl) scoreEl.textContent = score;
    if (bestEl) {
      var beste = reacties.length ? Math.min.apply(null, reacties) : null;
      bestEl.textContent = beste ? t('fastest: ', 'snelste: ') + beste + ' ms' : ' ';
    }
  }

  function nieuweDag() {
    deurOpen = false;
    wachtFase = true;
    deur.classList.remove('open');
    var tekst = WACHT_TEKSTEN[(dag - 1) % WACHT_TEKSTEN.length];
    if (msgEl) msgEl.textContent = t(tekst.en, tekst.nl).replace('{d}', dag);
    var wacht = 2500 + Math.random() * 4500;
    if (wachtTimer) clearTimeout(wachtTimer);
    wachtTimer = window.setTimeout(openDeDeur, wacht);
  }

  function openDeDeur() {
    if (!actief) return;
    wachtFase = false;
    deurOpen = true;
    deur.classList.add('open');
    deur.dataset.sinds = String(Date.now());
    if (msgEl) msgEl.textContent = t('THE DOOR. NOW.', 'DE DEUR. NU.');
    if (vensterTimer) clearTimeout(vensterTimer);
    vensterTimer = window.setTimeout(function () {
      if (!deurOpen) return;
      deurOpen = false;
      deur.classList.remove('open');
      reacties.push(1400);
      score += 5;
      if (msgEl) msgEl.textContent = t('The door closed again. They noted your hesitation. (+5)', 'De deur ging weer dicht. Je aarzeling is genoteerd. (+5)');
      hud();
      volgende();
    }, 1400);
  }

  function tik() {
    if (!actief) return;
    if (wachtFase) {
      /* aankloppen: alles terug naar dag één */
      if (wachtTimer) clearTimeout(wachtTimer);
      area.classList.add('jaap-fout');
      window.setTimeout(function () { area.classList.remove('jaap-fout'); }, 360);
      if (msgEl) msgEl.textContent = t('You knocked. They heard it. Day one. Again.', 'Je hebt aangeklopt. Ze hebben het gehoord. Dag één. Opnieuw.');
      dag = 1; score = 0; reacties = [];
      hud();
      window.setTimeout(nieuweDag, 1300);
      return;
    }
    if (!deurOpen) return;
    deurOpen = false;
    if (vensterTimer) clearTimeout(vensterTimer);
    var reactie = Date.now() - parseInt(deur.dataset.sinds || '0', 10);
    reacties.push(reactie);
    var punten = reactie < 220 ? 40 : reactie < 350 ? 30 : reactie < 500 ? 20 : 10;
    score += punten;
    if (msgEl) msgEl.textContent = t('Inside. ' + reactie + ' ms. (+' + punten + ')', 'Binnen. ' + reactie + ' ms. (+' + punten + ')');
    if (wachter) wachter.textContent = '🏃';
    window.setTimeout(function () { if (wachter) wachter.textContent = '🧍'; }, 700);
    hud();
    volgende();
  }

  function volgende() {
    if (dag >= 3) { window.setTimeout(einde, 1100); return; }
    dag++;
    hud();
    window.setTimeout(nieuweDag, 1400);
  }

  function einde() {
    actief = false;
    window.__activeGameRunning = false;
    if (wachtTimer) clearTimeout(wachtTimer);
    if (vensterTimer) clearTimeout(vensterTimer);
    deur.classList.remove('open');
    area.style.display = 'none';
    resultEl.classList.add('zichtbaar');

    var gemiddeld = reacties.length ? Math.round(reacties.reduce(function (a, b) { return a + b; }, 0) / reacties.length) : 9999;
    if (gemiddeld < 300) score += 20;

    var grade, titel, tekst;
    if (score >= 110) {
      grade = 'T'; titel = t('WELCOME TO THE CLUB', 'WELKOM IN DE CLUB');
      tekst = t('Three days, zero hesitation, average ' + gemiddeld + ' ms. The basement, by the way, is yours now.',
                'Drie dagen, nul aarzeling, gemiddeld ' + gemiddeld + ' ms. De kelder is trouwens nu van jou.');
    } else if (score >= 70) {
      grade = 'A'; titel = t('ADMITTED', 'TOEGELATEN');
      tekst = t('You stood. You waited. You entered. Jaap took three years; you took three days.',
                'Je stond. Je wachtte. Je stapte binnen. Jaap deed er drie jaar over; jij drie dagen.');
    } else if (score >= 35) {
      grade = 'B'; titel = t('STILL ON THE PORCH', 'NOG STEEDS OP DE STOEP');
      tekst = t('They let you in out of pity. It counts. Barely.', 'Ze lieten je binnen uit medelijden. Het telt. Net.');
    } else {
      grade = 'K'; titel = t('GO HOME', 'GA NAAR HUIS');
      tekst = t('Too eager, too slow, or both. The porch remembers.', 'Te gretig, te traag, of allebei. De stoep onthoudt het.');
    }
    document.getElementById('jaapResultGrade').textContent = grade;
    document.getElementById('jaapResultTitle').textContent = titel;
    document.getElementById('jaapResultText').textContent = tekst;
    document.getElementById('jaapResultScore').textContent = score + ' ' + t('points', 'punten') + ' · ' + t('average ', 'gemiddeld ') + gemiddeld + ' ms';
    var geteld = Math.min(score, 140);
    document.getElementById('jaapResultPoints').textContent = '+' + geteld + ' Mayhem';
    if (window.FC) window.FC.meldScore('jaap', geteld);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
