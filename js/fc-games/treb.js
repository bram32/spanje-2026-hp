/* ═══ KELDERPROEF I · DE TOESPRAAK (Treb) — timing ═══
   Stop de naald in de roze zone. Acht zinnen moeten landen.
   De zinnen zelf zijn de referenties en blijven dus Engels. */
(function () {
  'use strict';
  var t = function (en, nl) { return window.FC ? window.FC.t(en, nl) : en; };

  var LINES = [
    'You are not your job.',
    'You are not how much money you have in the bank.',
    'You are not the car you drive.',
    'You are not the contents of your wallet.',
    'You are not your golf handicap.',
    'This is your weekend, and it’s ending one round at a time.',
    'It’s only after we’ve lost everything (± €350) that we’re free to do anything.',
    'The first rule: you do not talk about this weekend.'
  ];

  var area, statusEl, resultEl, meterEl, zoneEl, naaldEl, lineEl, roundEl, levensEl, scoreEl;
  var actief = false, raf = null;
  var pos = 0, richting = 1, snelheid = 0.9;
  var zoneStart = 40, zoneBreedte = 20;
  var ronde = 0, levens = 3, score = 0, perfect = 0;

  function init() {
    area = document.getElementById('trebArea');
    statusEl = document.getElementById('trebStatus');
    resultEl = document.getElementById('trebResult');
    meterEl = document.getElementById('trebMeter');
    zoneEl = document.getElementById('trebZone');
    naaldEl = document.getElementById('trebNaald');
    lineEl = document.getElementById('trebLine');
    roundEl = document.getElementById('trebRound');
    levensEl = document.getElementById('trebLevens');
    scoreEl = document.getElementById('trebScore');
    if (!area || !statusEl) return;
    statusEl.addEventListener('click', start);
    area.addEventListener('click', tik);
    document.addEventListener('keydown', function (e) {
      if (!actief) return;
      if (e.code === 'Space') { e.preventDefault(); tik(); }
    });
  }

  function start() {
    ronde = 0; levens = 3; score = 0; perfect = 0;
    snelheid = 0.9;
    actief = true;
    window.__activeGameRunning = true;
    statusEl.style.display = 'none';
    resultEl.classList.remove('zichtbaar');
    area.style.display = 'block';
    if (lineEl) lineEl.textContent = t('Silence. The bulb swings. Speak.', 'Stilte. Het peertje zwaait. Spreek.');
    hud();
    nieuweZone();
    loop();
  }
  window.trebGameStart = start;

  function nieuweZone() {
    zoneBreedte = Math.max(9, 22 - ronde * 1.8);
    zoneStart = 12 + Math.random() * (76 - zoneBreedte);
    if (zoneEl) {
      zoneEl.style.left = zoneStart + '%';
      zoneEl.style.width = zoneBreedte + '%';
    }
    pos = 0; richting = 1;
  }

  function loop() {
    if (!actief) return;
    pos += richting * snelheid;
    if (pos >= 100) { pos = 100; richting = -1; }
    if (pos <= 0) { pos = 0; richting = 1; }
    if (naaldEl) naaldEl.style.left = pos + '%';
    raf = requestAnimationFrame(loop);
  }

  function hud() {
    if (roundEl) roundEl.textContent = Math.min(ronde + 1, 8) + ' / 8';
    if (levensEl) levensEl.textContent = '🔥🔥🔥'.slice(0, levens * 2) || '—';
    if (scoreEl) scoreEl.textContent = score;
  }

  function tik() {
    if (!actief) return;
    var centrum = zoneStart + zoneBreedte / 2;
    var inZone = pos >= zoneStart && pos <= zoneStart + zoneBreedte;
    var isPerfect = Math.abs(pos - centrum) <= zoneBreedte * 0.18;
    if (inZone) {
      score += isPerfect ? 15 : 10;
      if (isPerfect) perfect++;
      if (lineEl) lineEl.textContent = '“' + LINES[ronde] + '”' + (isPerfect ? ' ✨' : '');
      area.classList.add('treb-hit');
      window.setTimeout(function () { area.classList.remove('treb-hit'); }, 250);
      ronde++;
      snelheid += 0.22;
      if (ronde >= 8) { einde(true); return; }
      nieuweZone();
    } else {
      levens--;
      if (lineEl) lineEl.textContent = t('…the line dies mid-air. The basement coughs.', '…de zin sterft halverwege. De kelder kucht.');
      area.classList.add('treb-miss');
      window.setTimeout(function () { area.classList.remove('treb-miss'); }, 320);
      if (levens <= 0) { einde(false); return; }
    }
    hud();
  }

  function einde(gehaald) {
    actief = false;
    window.__activeGameRunning = false;
    if (raf) cancelAnimationFrame(raf);
    area.style.display = 'none';
    resultEl.classList.add('zichtbaar');

    var grade, titel, tekst;
    if (gehaald && score >= 100) {
      grade = 'T'; titel = t('THE VOICE OF THE BASEMENT', 'DE STEM VAN DE KELDER');
      tekst = t('Every line landed. Men are quitting their jobs as we speak. ' + perfect + ' breakthrough(s).',
                'Elke zin landde. Mannen zeggen nu al hun baan op. ' + perfect + ' doorbraak/-braken.');
    } else if (gehaald && score >= 70) {
      grade = 'A'; titel = t('CONVINCING', 'OVERTUIGEND');
      tekst = t('The basement nods. Somebody even put his beer down.', 'De kelder knikt. Iemand zette zelfs zijn bier neer.');
    } else if (gehaald) {
      grade = 'B'; titel = t('A DECENT SPEECH', 'EEN NETTE TOESPRAAK');
      tekst = t('The words arrived. Roughly in order.', 'De woorden kwamen aan. Grofweg in de goede volgorde.');
    } else {
      grade = 'K'; titel = t('A MAN ON A CRATE', 'EEN MAN OP EEN KRAT');
      tekst = t('The basement went back to arm-wrestling. Try again.', 'De kelder ging terug naar het armworstelen. Probeer het opnieuw.');
    }
    document.getElementById('trebResultGrade').textContent = grade;
    document.getElementById('trebResultTitle').textContent = titel;
    document.getElementById('trebResultText').textContent = tekst;
    document.getElementById('trebResultScore').textContent = score + ' ' + t('points', 'punten');
    document.getElementById('trebResultPoints').textContent = '+' + score + ' Mayhem';
    if (window.FC) window.FC.meldScore('treb', Math.min(score, 130));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
