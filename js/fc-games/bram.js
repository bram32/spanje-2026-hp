/* ═══ KELDERPROEF II · VECHT MET JEZELF (Bram) — geheugen ═══
   Simon-says op de parkeerplaats: het spiegelbeeld slaat voor,
   jij slaat exact na. Elke ronde één klap langer. */
(function () {
  'use strict';
  var t = function (en, nl) { return window.FC ? window.FC.t(en, nl) : en; };

  var area, statusEl, resultEl, msgEl, rondeEl, levensEl, scoreEl, jijEl, ookJijEl;
  var pads = [];
  var reeks = [], invoer = 0, ronde = 0, levens = 3, score = 0;
  var actief = false, toonBezig = false;

  function init() {
    area = document.getElementById('bramArea');
    statusEl = document.getElementById('bramStatus');
    resultEl = document.getElementById('bramResult');
    msgEl = document.getElementById('bramMsg');
    rondeEl = document.getElementById('bramRonde');
    levensEl = document.getElementById('bramLevens');
    scoreEl = document.getElementById('bramScore');
    jijEl = document.getElementById('bramJij');
    ookJijEl = document.getElementById('bramOokJij');
    if (!area || !statusEl) return;
    pads = Array.prototype.slice.call(area.querySelectorAll('.bram-pad'));
    statusEl.addEventListener('click', start);
    pads.forEach(function (pad) {
      pad.addEventListener('click', function () { druk(parseInt(pad.dataset.move, 10), pad); });
    });
  }

  function start() {
    reeks = []; ronde = 0; levens = 3; score = 0;
    actief = true;
    window.__activeGameRunning = true;
    statusEl.style.display = 'none';
    resultEl.classList.remove('zichtbaar');
    area.style.display = 'block';
    hud();
    volgendeRonde();
  }
  window.bramGameStart = start;

  function hud() {
    if (rondeEl) rondeEl.textContent = t('round ', 'ronde ') + (ronde || 1);
    if (levensEl) levensEl.textContent = '🦷🦷🦷'.slice(0, levens * 2) || '—';
    if (scoreEl) scoreEl.textContent = score;
  }

  function volgendeRonde() {
    ronde++;
    reeks.push(Math.floor(Math.random() * 4));
    invoer = 0;
    hud();
    toonReeks();
  }

  function toonReeks() {
    toonBezig = true;
    zetPads(false);
    if (msgEl) msgEl.textContent = t('Watch your reflection…', 'Kijk naar je spiegelbeeld…');
    var i = 0;
    var stap = function () {
      if (!actief) return;
      if (i >= reeks.length) {
        toonBezig = false;
        zetPads(true);
        if (msgEl) msgEl.textContent = t('Now you. Exactly the same.', 'Nu jij. Exact hetzelfde.');
        return;
      }
      var pad = pads[reeks[i]];
      if (pad) {
        pad.classList.add('flits');
        if (ookJijEl) { ookJijEl.classList.remove('klap'); void ookJijEl.offsetWidth; ookJijEl.classList.add('klap'); }
        window.setTimeout(function () { pad.classList.remove('flits'); }, 330);
      }
      i++;
      window.setTimeout(stap, 560);
    };
    window.setTimeout(stap, 700);
  }

  function zetPads(aan) {
    pads.forEach(function (p) { p.disabled = !aan; });
  }

  function druk(move, pad) {
    if (!actief || toonBezig) return;
    if (jijEl) { jijEl.classList.remove('klap'); void jijEl.offsetWidth; jijEl.classList.add('klap'); }
    if (move === reeks[invoer]) {
      pad.classList.add('goed');
      window.setTimeout(function () { pad.classList.remove('goed'); }, 240);
      invoer++;
      if (invoer >= reeks.length) {
        score += ronde * 10;
        if (msgEl) msgEl.textContent = t('Round ' + ronde + ' survived. It gets longer.', 'Ronde ' + ronde + ' overleefd. Het wordt langer.');
        hud();
        window.setTimeout(volgendeRonde, 900);
      }
    } else {
      levens--;
      pad.classList.add('fout');
      window.setTimeout(function () { pad.classList.remove('fout'); }, 340);
      if (msgEl) msgEl.textContent = t('You hit yourself in the face. Predictable.', 'Je slaat jezelf in het gezicht. Voorspelbaar.');
      hud();
      if (levens <= 0) { einde(); return; }
      invoer = 0;
      window.setTimeout(toonReeks, 900);
    }
  }

  function einde() {
    actief = false;
    window.__activeGameRunning = false;
    area.style.display = 'none';
    resultEl.classList.add('zichtbaar');
    var grade, titel, tekst;
    if (score >= 120) {
      grade = 'T'; titel = t('YOU KNOW YOURSELF TOO WELL', 'JE KENT JEZELF TE GOED');
      tekst = t('Reflection and original are indistinguishable. That is either enlightenment or a concussion.',
                'Spiegelbeeld en origineel zijn niet meer te onderscheiden. Dat is verlichting of een hersenschudding.');
    } else if (score >= 60) {
      grade = 'A'; titel = t('A FAIR FIGHT', 'EEN EERLIJK GEVECHT');
      tekst = t('You won. You also lost. It’s complicated, we said that.', 'Je hebt gewonnen. Je hebt ook verloren. Het is ingewikkeld, dat zeiden we al.');
    } else if (score >= 20) {
      grade = 'B'; titel = t('KNOCKED DOWN BY YOURSELF', 'NEERGELEGD DOOR JEZELF');
      tekst = t('Round ' + ronde + '. Your reflection is icing its knuckles.', 'Ronde ' + ronde + '. Je spiegelbeeld legt zijn knokkels op ijs.');
    } else {
      grade = 'K'; titel = t('FIRST NIGHT', 'EERSTE NACHT');
      tekst = t('If this is your first night, you have to fight. Again.', 'If this is your first night, you have to fight. Opnieuw dus.');
    }
    document.getElementById('bramResultGrade').textContent = grade;
    document.getElementById('bramResultTitle').textContent = titel;
    document.getElementById('bramResultText').textContent = tekst;
    document.getElementById('bramResultScore').textContent = score + ' ' + t('points', 'punten') + ' · ' + t('round', 'ronde') + ' ' + ronde;
    document.getElementById('bramResultPoints').textContent = '+' + Math.min(score, 150) + ' Mayhem';
    if (window.FC) window.FC.meldScore('bram', Math.min(score, 150));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
