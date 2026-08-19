/* ═══ KELDERPROEF III · DE ZEEPZIEDERIJ (Peeg) — reflex ═══
   Whack-a-mole in de kelderkeuken: zeep pakken, ratten wegtikken,
   loog alléén blussen mét handschoenen. 45 seconden nachtdienst. */
(function () {
  'use strict';
  var t = function (en, nl) { return window.FC ? window.FC.t(en, nl) : en; };

  var area, statusEl, resultEl, veld, glovesBtn, timerEl, scoreEl;
  var kuipen = [];
  var actief = false;
  var score = 0, tijd = 45;
  var spawnTimer = null, klokTimer = null, glovesTimer = null;
  var gloves = false;
  var stats = { zeep: 0, rat: 0, geblust: 0, brand: 0 };

  var TYPES = [
    { type: 'zeep', emoji: '🧼', kans: 0.5, leeft: 1500 },
    { type: 'rat',  emoji: '🐀', kans: 0.27, leeft: 1200 },
    { type: 'loog', emoji: '⚗️', kans: 0.23, leeft: 1700 }
  ];

  function init() {
    area = document.getElementById('peegArea');
    statusEl = document.getElementById('peegStatus');
    resultEl = document.getElementById('peegResult');
    veld = document.getElementById('peegField');
    glovesBtn = document.getElementById('peegGloves');
    timerEl = document.getElementById('peegTimer');
    scoreEl = document.getElementById('peegScore');
    if (!area || !statusEl || !veld) return;
    kuipen = Array.prototype.slice.call(veld.querySelectorAll('.peeg-kuip'));
    statusEl.addEventListener('click', start);
    glovesBtn.addEventListener('click', wisselGloves);
    kuipen.forEach(function (kuip) {
      kuip.addEventListener('click', function () { tik(kuip); });
    });
  }

  function start() {
    score = 0; tijd = 45;
    stats = { zeep: 0, rat: 0, geblust: 0, brand: 0 };
    gloves = false;
    zetGloves(false);
    actief = true;
    window.__activeGameRunning = true;
    statusEl.style.display = 'none';
    resultEl.classList.remove('zichtbaar');
    area.style.display = 'block';
    hud();
    plan();
    klokTimer = window.setInterval(function () {
      tijd--;
      hud();
      if (tijd <= 0) einde();
    }, 1000);
  }
  window.peegGameStart = start;

  function hud() {
    if (timerEl) timerEl.textContent = tijd + ' s';
    if (scoreEl) scoreEl.textContent = score;
  }

  function wisselGloves() {
    if (!actief) return;
    zetGloves(!gloves);
    if (gloves) {
      if (glovesTimer) clearTimeout(glovesTimer);
      glovesTimer = window.setTimeout(function () { zetGloves(false); }, 6000);
    }
  }
  function zetGloves(aan) {
    gloves = aan;
    if (glovesBtn) glovesBtn.setAttribute('aria-pressed', aan ? 'true' : 'false');
  }

  function plan() {
    if (!actief) return;
    spawn();
    var tempo = Math.max(520, 950 - (45 - tijd) * 10);
    spawnTimer = window.setTimeout(plan, tempo);
  }

  function kiesType() {
    var r = Math.random(), som = 0;
    for (var i = 0; i < TYPES.length; i++) {
      som += TYPES[i].kans;
      if (r <= som) return TYPES[i];
    }
    return TYPES[0];
  }

  function spawn() {
    var vrij = kuipen.filter(function (k) { return !k.classList.contains('actief'); });
    if (!vrij.length) return;
    var kuip = vrij[Math.floor(Math.random() * vrij.length)];
    var def = kiesType();
    kuip.dataset.type = def.type;
    kuip.dataset.sinds = String(Date.now());
    kuip.querySelector('.peeg-item').textContent = def.emoji;
    kuip.classList.remove('gepakt');
    kuip.classList.add('actief');
    window.setTimeout(function () {
      if (kuip.classList.contains('actief') && kuip.dataset.sinds && Date.now() - parseInt(kuip.dataset.sinds, 10) >= def.leeft - 40) {
        kuip.classList.remove('actief');
        kuip.dataset.type = '';
      }
    }, def.leeft);
  }

  function tik(kuip) {
    if (!actief || !kuip.classList.contains('actief')) return;
    var type = kuip.dataset.type;
    var leeftijd = Date.now() - parseInt(kuip.dataset.sinds || '0', 10);
    var punten = 0;
    if (type === 'zeep') { punten = 25; stats.zeep++; }
    else if (type === 'rat') {
      if (leeftijd <= 1200) { punten = 15; stats.rat++; }
    }
    else if (type === 'loog') {
      if (gloves) { punten = 20; stats.geblust++; }
      else {
        punten = -15; stats.brand++;
        area.classList.add('peeg-au');
        window.setTimeout(function () { area.classList.remove('peeg-au'); }, 360);
      }
    }
    score = Math.max(0, score + punten);
    kuip.classList.add('gepakt');
    window.setTimeout(function () {
      kuip.classList.remove('actief', 'gepakt');
      kuip.dataset.type = '';
    }, 260);
    hud();
  }

  function einde() {
    actief = false;
    window.__activeGameRunning = false;
    if (spawnTimer) clearTimeout(spawnTimer);
    if (klokTimer) clearInterval(klokTimer);
    if (glovesTimer) clearTimeout(glovesTimer);
    kuipen.forEach(function (k) { k.classList.remove('actief', 'gepakt'); k.dataset.type = ''; });
    area.style.display = 'none';
    resultEl.classList.add('zichtbaar');

    var grade, titel, tekst;
    if (score >= 300) {
      grade = 'T'; titel = t('MASTER SOAP MAKER', 'MEESTERZEEPZIEDER');
      tekst = t('The Chemist nods once. From him, that is a standing ovation.', 'De Chemicus knikt één keer. Van hem is dat een staande ovatie.');
    } else if (score >= 180) {
      grade = 'A'; titel = t('NIGHT SHIFT SURVIVED', 'NACHTDIENST OVERLEEFD');
      tekst = t('Decent yield, minor burns. The bars are almost straight.', 'Nette oogst, lichte brandwonden. De blokken zijn bijna recht.');
    } else if (score >= 80) {
      grade = 'B'; titel = t('APPRENTICE', 'LEERLING-ZIEDER');
      tekst = t('The rats respect you. The lye does not.', 'De ratten respecteren je. De loog niet.');
    } else {
      grade = 'K'; titel = t('CHEMICAL INCIDENT', 'CHEMISCH INCIDENT');
      tekst = t('The kitchen survives. Barely. Wear the gloves.', 'De keuken staat er nog. Net. Draag de handschoenen.');
    }
    document.getElementById('peegResultGrade').textContent = grade;
    document.getElementById('peegResultTitle').textContent = titel;
    document.getElementById('peegResultText').textContent = tekst;
    document.getElementById('peegResultScore').textContent = score + ' ' + t('points', 'punten');
    var statsEl = document.getElementById('peegResultStats');
    if (statsEl) {
      statsEl.innerHTML = '';
      [
        ['🧼 ' + t('soap collected: ', 'zeep geoogst: ') + stats.zeep],
        ['🐀 ' + t('rats dispatched: ', 'ratten weggetikt: ') + stats.rat],
        ['🧤 ' + t('lye quenched: ', 'loog geblust: ') + stats.geblust],
        ['🔥 ' + t('chemical burns: ', 'brandwonden: ') + stats.brand]
      ].forEach(function (regel) {
        var li = document.createElement('li');
        li.textContent = regel[0];
        statsEl.appendChild(li);
      });
    }
    var geteld = Math.min(score, 150);
    document.getElementById('peegResultPoints').textContent = '+' + geteld + ' Mayhem';
    if (window.FC) window.FC.meldScore('peeg', geteld);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
