/* ═══ KELDERPROEF IV · PROJECT SCHULDVRIJ (Marc) — beslissen ═══
   Schuld van de groep: WISSEN. Clubgeld, aanbetaling of je eigen
   schuld aan de club: BEWAREN. 40 seconden voordat de servers herstarten. */
(function () {
  'use strict';
  var t = function (en, nl) { return window.FC ? window.FC.t(en, nl) : en; };

  /* actie: 'wis' = terecht wissen, 'bewaar' = nooit wissen */
  var TRANSACTIES = [
    { en: 'Round of beers, ordered by Treb', nl: 'Rondje bier, besteld door Treb', bedrag: '€ 64', actie: 'wis' },
    { en: 'Nikki Beach — champagne shower', nl: 'Nikki Beach — champagnedouche', bedrag: '€ 480', actie: 'wis' },
    { en: 'YOUR Tikkie for the club fee', nl: 'JOUW Tikkie voor het clubgeld', bedrag: '€ 350', actie: 'bewaar' },
    { en: 'David’s taxi from Florence', nl: 'Davids taxi vanuit Florence', bedrag: '€ 212', actie: 'wis' },
    { en: 'Green fee + medication cart', nl: 'Greenfee + medicatiekar', bedrag: '€ 95', actie: 'wis' },
    { en: 'Bram’s deposit (the scar)', nl: 'De aanbetaling van Bram (het litteken)', bedrag: '€ 800', actie: 'bewaar' },
    { en: 'Pascal — diapers, night rate', nl: 'Pascal — luiers, nachttarief', bedrag: '€ 39', actie: 'wis' },
    { en: 'Casino Marbella — “an investment”', nl: 'Casino Marbella — “een investering”', bedrag: '€ 200', actie: 'wis' },
    { en: 'Gibraltar — replacement sunglasses', nl: 'Gibraltar — vervangende zonnebril', bedrag: '€ 25', actie: 'wis' },
    { en: 'Boat rental, Captain Samuel', nl: 'Boothuur, Kapitein Samuel', bedrag: '€ 350', actie: 'wis' },
    { en: 'The round YOU promised the club', nl: 'Het rondje dat JIJ de club beloofde', bedrag: '€ 72', actie: 'bewaar' },
    { en: 'Espetos at Bono’s Beach', nl: 'Espetos bij Bono’s Beach', bedrag: '€ 118', actie: 'wis' },
    { en: 'Late-night kebabs, all eight', nl: 'Nachtelijke kebab, alle acht', bedrag: '€ 56', actie: 'wis' },
    { en: 'Your bar tab, signed by you', nl: 'Jouw bartab, door jou getekend', bedrag: '€ 89', actie: 'bewaar' },
    { en: 'Costume rental: eight gorilla suits', nl: 'Kostuumhuur: acht gorillapakken', bedrag: '€ 160', actie: 'wis' },
    { en: 'The Soap Fund itself', nl: 'Het Zeepfonds zelf', bedrag: '€ ∞', actie: 'bewaar' },
    { en: 'Padel court, losers’ share', nl: 'Padelbaan, aandeel verliezers', bedrag: '€ 44', actie: 'wis' },
    { en: 'Jaap’s guitar strings (broken on stage)', nl: 'Jaaps gitaarsnaren (gesneuveld op het podium)', bedrag: '€ 23', actie: 'wis' }
  ];

  var area, statusEl, resultEl, kaartEl, labelEl, tekstEl, bedragEl, timerEl, streakEl, scoreEl, wisBtn, bewaarBtn;
  var actief = false;
  var score = 0, tijd = 40, streak = 0, kaartNr = 0, goed = 0, fout = 0;
  var klokTimer = null;
  var stapel = [], huidige = null;

  function init() {
    area = document.getElementById('marcArea');
    statusEl = document.getElementById('marcStatus');
    resultEl = document.getElementById('marcResult');
    kaartEl = document.getElementById('marcKaart');
    labelEl = document.getElementById('marcKaartLabel');
    tekstEl = document.getElementById('marcKaartTekst');
    bedragEl = document.getElementById('marcKaartBedrag');
    timerEl = document.getElementById('marcTimer');
    streakEl = document.getElementById('marcStreak');
    scoreEl = document.getElementById('marcScore');
    wisBtn = document.getElementById('marcWis');
    bewaarBtn = document.getElementById('marcBewaar');
    if (!area || !statusEl) return;
    statusEl.addEventListener('click', start);
    wisBtn.addEventListener('click', function () { kies('wis'); });
    bewaarBtn.addEventListener('click', function () { kies('bewaar'); });
    document.addEventListener('keydown', function (e) {
      if (!actief) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); kies('wis'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); kies('bewaar'); }
    });
  }

  function schud(lijst) {
    var a = lijst.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function start() {
    score = 0; tijd = 40; streak = 0; kaartNr = 0; goed = 0; fout = 0;
    stapel = schud(TRANSACTIES);
    actief = true;
    window.__activeGameRunning = true;
    statusEl.style.display = 'none';
    resultEl.classList.remove('zichtbaar');
    area.style.display = 'block';
    hud();
    volgende();
    klokTimer = window.setInterval(function () {
      tijd--;
      hud();
      if (tijd <= 0) einde();
    }, 1000);
  }
  window.marcGameStart = start;

  function hud() {
    if (timerEl) timerEl.textContent = tijd + ' s';
    if (streakEl) streakEl.textContent = t('streak: ', 'reeks: ') + streak;
    if (scoreEl) scoreEl.textContent = score;
  }

  function volgende() {
    if (!stapel.length) stapel = schud(TRANSACTIES);
    huidige = stapel.pop();
    kaartNr++;
    if (labelEl) labelEl.textContent = t('TRANSACTION', 'TRANSACTIE') + ' #' + String(kaartNr).padStart(3, '0');
    if (tekstEl) tekstEl.textContent = t(huidige.en, huidige.nl);
    if (bedragEl) bedragEl.textContent = huidige.bedrag;
  }

  function kies(actie) {
    if (!actief || !huidige) return;
    var juist = actie === huidige.actie;
    if (juist) {
      goed++;
      streak++;
      score += 10;
      if (streak > 0 && streak % 5 === 0) score += 20;
      kaartEl.classList.remove('marc-goed'); void kaartEl.offsetWidth; kaartEl.classList.add('marc-goed');
    } else {
      fout++;
      streak = 0;
      score = Math.max(0, score - 10);
      kaartEl.classList.remove('marc-fout'); void kaartEl.offsetWidth; kaartEl.classList.add('marc-fout');
    }
    hud();
    volgende();
  }

  function einde() {
    actief = false;
    window.__activeGameRunning = false;
    if (klokTimer) clearInterval(klokTimer);
    area.style.display = 'none';
    resultEl.classList.add('zichtbaar');

    var grade, titel, tekst;
    if (score >= 200) {
      grade = 'T'; titel = t('THE INSIDE MAN APPROVES', 'DE INSIDE MAN KEURT GOED');
      tekst = t('Every balance is exactly where it should be: at zero, except yours. ' + goed + ' correct.',
                'Elk saldo staat precies waar het hoort: op nul, behalve dat van jou. ' + goed + ' correct.');
    } else if (score >= 120) {
      grade = 'A'; titel = t('CLEAN SWEEP', 'SCHONE LEI');
      tekst = t('The group is debt-free. Your Tikkie survived. As it should.', 'De groep is schuldenvrij. Jouw Tikkie heeft het overleefd. Zoals het hoort.');
    } else if (score >= 60) {
      grade = 'B'; titel = t('AUDIT REQUIRED', 'CONTROLE VEREIST');
      tekst = t(fout + ' erased in error. Marc has questions.', fout + ' per ongeluk gewist. Marc heeft vragen.');
    } else {
      grade = 'K'; titel = t('ACCOUNT BLOCKED', 'REKENING GEBLOKKEERD');
      tekst = t('You erased the Soap Fund. The club will now erase your towel privileges.',
                'Je hebt het Zeepfonds gewist. De club wist nu jouw handdoekprivileges.');
    }
    document.getElementById('marcResultGrade').textContent = grade;
    document.getElementById('marcResultTitle').textContent = titel;
    document.getElementById('marcResultText').textContent = tekst;
    document.getElementById('marcResultScore').textContent = score + ' ' + t('points', 'punten') + ' · ' + goed + ' ✓ / ' + fout + ' ✗';
    var geteld = Math.min(score, 150);
    document.getElementById('marcResultPoints').textContent = '+' + geteld + ' Mayhem';
    if (window.FC) window.FC.meldScore('marc', geteld);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
