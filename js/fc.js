/* ============================================================
   PROJECT MARBELLA — fc.js
   De motor van de donkere realiteit. Spiegelt de systemen van
   main.js (brief-realiteit) en voegt toe: splice-frames,
   sigarettenbrand, WebAudio-kelderruis, taalwissel EN/NL en
   mobiel-veilige YouTube-facades.
   ============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function safePlay(media) {
    if (!media) return;
    var p = media.play();
    if (p && typeof p.catch === 'function') p.catch(function () { /* autoplay geblokkeerd — prima */ });
  }

  if (typeof window.__activeGameRunning === 'undefined') {
    window.__activeGameRunning = false;
  }

  /* ============================================================
     0. TAAL — EN default; NL = Nederlands met Engelse FC-quotes
     Statisch: CSS verbergt .en/.nl. Dynamisch: FC.t(en, nl).
     Attributen: data-tt-*, data-ph-*, data-title-*.
     ============================================================ */
  var LANG_KEY = 'fc_lang';
  function currentLang() {
    return document.body.getAttribute('data-lang') === 'nl' ? 'nl' : 'en';
  }
  function applyLang(lang) {
    document.body.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    var btn = $('langToggle');
    if (btn) btn.textContent = lang === 'en' ? 'NL' : 'EN';
    $$('[data-tt-en]').forEach(function (el) {
      el.setAttribute('data-tooltip', el.getAttribute(lang === 'nl' ? 'data-tt-nl' : 'data-tt-en'));
    });
    $$('[data-ph-en]').forEach(function (el) {
      el.setAttribute('placeholder', el.getAttribute(lang === 'nl' ? 'data-ph-nl' : 'data-ph-en'));
    });
    $$('[data-title-en]').forEach(function (el) {
      el.setAttribute('data-title', el.getAttribute(lang === 'nl' ? 'data-title-nl' : 'data-title-en'));
    });
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }
  function setupLangToggle() {
    var stored = null;
    try { stored = localStorage.getItem(LANG_KEY); } catch (e) {}
    applyLang(stored === 'nl' ? 'nl' : 'en');
    var btn = $('langToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        applyLang(currentLang() === 'en' ? 'nl' : 'en');
      });
    }
  }
  /* Publieke helper voor de kelderproeven */
  window.FC = window.FC || {};
  window.FC.t = function (en, nl) { return currentLang() === 'nl' ? nl : en; };
  window.FC.lang = currentLang;

  /* ============================================================
     1. DE ZEEP — openDossier() + auto-open fallback
     ============================================================ */
  var dossierOpened = false;
  function openDossier() {
    if (dossierOpened) return;
    dossierOpened = true;
    var dossier = $('dossier');
    if (dossier) dossier.dataset.state = 'open';
    spliceFlits();
  }
  window.openDossier = openDossier;

  (function initDossier() {
    if (reducedMotion()) { openDossier(); return; }
    window.setTimeout(openDossier, 5500);
    window.addEventListener('scroll', function () { openDossier(); }, { once: true, passive: true });
  })();

  /* ============================================================
     2. SPLICE-FRAMES + SIGARETTENBRAND — de projectionist rommelt
     ============================================================ */
  var SPLICE_WOORDEN = [
    'TYLER WAS HERE',
    'YOU ARE NOT YOUR INBOX',
    'SLIDE',
    'HIS NAME IS ROBERT PAULSON',
    'BREATHE',
    'THIS IS NOT A DRILL',
    'BUY THE SOAP'
  ];
  var spliceBezig = false;
  function spliceFlits() {
    if (reducedMotion() || spliceBezig) return;
    var frame = $('spliceFrame');
    var woord = $('spliceWoord');
    if (!frame) return;
    spliceBezig = true;
    if (woord) woord.textContent = SPLICE_WOORDEN[Math.floor(Math.random() * SPLICE_WOORDEN.length)];
    frame.classList.add('flits');
    window.setTimeout(function () {
      frame.classList.remove('flits');
      spliceBezig = false;
    }, 90);
  }
  function cigaretteBurn() {
    var burn = $('cigaretteBurn');
    if (!burn || reducedMotion()) return;
    burn.classList.remove('zichtbaar');
    void burn.offsetWidth; /* herstart de animatie */
    burn.classList.add('zichtbaar');
  }
  (function initProjectionist() {
    if (reducedMotion()) return;
    /* splice: zeldzaam en onaangekondigd, zoals het hoort */
    window.setInterval(function () {
      if (Math.random() < 0.18 && !document.hidden) spliceFlits();
    }, 26000);
    /* cigarette burn: markeert 'aktewissels' */
    window.setInterval(function () {
      if (!document.hidden) cigaretteBurn();
    }, 47000);
    /* en één keer vroeg, voor wie oplet */
    window.setTimeout(cigaretteBurn, 12000);
  })();

  /* ============================================================
     3. ALTER EGO'S — toggleAlterEgo(): dag → nacht (→ nacht2)
     ============================================================ */
  function toggleAlterEgo(avatarEl) {
    var member = avatarEl.closest('.crew-member');
    if (!member) return;
    var state = member.dataset.state || 'dag';
    var heeftNacht2 = !!member.querySelector('.vid-nacht2');
    var volgende;
    if (state === 'dag') volgende = 'nacht';
    else if (state === 'nacht' && heeftNacht2) volgende = 'nacht2';
    else volgende = 'dag';
    member.dataset.state = volgende;

    var mapping = { dag: '.vid-dag', nacht: '.vid-nacht', nacht2: '.vid-nacht2' };
    Object.keys(mapping).forEach(function (key) {
      var video = member.querySelector(mapping[key]);
      if (!video) return;
      if (key === volgende) {
        video.classList.add('active');
        if (!video.src && video.dataset.src) video.src = video.dataset.src;
        avatarEl.classList.add('laden');
        var onReady = function () { avatarEl.classList.remove('laden'); };
        if (video.readyState >= 2) onReady();
        else video.addEventListener('canplay', onReady, { once: true });
        safePlay(video);
      } else {
        video.classList.remove('active');
        try { video.pause(); } catch (e) {}
      }
    });
    if (volgende !== 'dag') spliceFlits();
  }
  window.toggleAlterEgo = toggleAlterEgo;

  /* ============================================================
     4. LAZY VIDEO — data-src pas laden bij zichtbaarheid
     ============================================================ */
  function loadDataSrc(video) {
    if (video.dataset.src && !video.src) {
      video.src = video.dataset.src;
      video.load();
    }
  }
  function setupLazyVideoLoading() {
    var lazyVideos = $$('video.lazy-video');
    if (!lazyVideos.length) return;
    var activate = function (video) {
      loadDataSrc(video);
      if (video.hasAttribute('autoplay')) safePlay(video);
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            activate(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '200px 0px' });
      lazyVideos.forEach(function (v) { io.observe(v); });
    } else {
      lazyVideos.forEach(activate);
    }
  }

  function setupIosFirstTouchPlay() {
    document.addEventListener('touchstart', function () {
      $$('video[autoplay]').forEach(function (video) {
        if (video.paused && video.src) safePlay(video);
      });
    }, { once: true, passive: true });
  }

  /* ============================================================
     5. DE KELDER — gemengde speler (banden + bewijsfoto's)
     ============================================================ */
  function setupKelder() {
    var player = $('kelderVideo');
    var foto = $('kelderFoto');
    var caption = $('kelderCaption');
    var thumbs = $$('.funzone-thumb');
    if (!player || !thumbs.length) return;

    thumbs.forEach(function (thumb) {
      var kies = function () {
        thumbs.forEach(function (t) { t.classList.remove('active'); });
        thumb.classList.add('active');
        var titel = thumb.getAttribute('data-title') || '';
        if (caption) caption.textContent = titel;
        if (thumb.dataset.video) {
          if (foto) foto.hidden = true;
          player.hidden = false;
          player.src = './assets/videos/fc/' + thumb.dataset.video;
          safePlay(player);
        } else if (thumb.dataset.foto && foto) {
          try { player.pause(); } catch (e) {}
          player.hidden = true;
          foto.src = './assets/images/fc/' + thumb.dataset.foto;
          foto.alt = titel;
          foto.hidden = false;
        }
      };
      thumb.addEventListener('click', kies);
      thumb.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kies(); }
      });
      var preview = thumb.querySelector('video');
      if (preview) {
        thumb.addEventListener('mouseenter', function () { loadDataSrc(preview); safePlay(preview); });
        thumb.addEventListener('mouseleave', function () {
          try { preview.pause(); preview.currentTime = 0; } catch (e) {}
        });
      }
    });
  }

  /* ============================================================
     6. DE BEWAKINGSBAND — playJourney() + getimede ondertitels
     ============================================================ */
  var JOURNEY_SUBS = [
    { t: 0,  en: '06:41. Gate D14. Eight men, one duffel bag each. Do not ask what for.', nl: '06:41. Gate D14. Acht man, één plunjezak elk. Vraag niet waarvoor.' },
    { t: 6,  en: 'A stairwell. A single bulb. The club descends.', nl: 'Een trappenhuis. Eén peertje. De club daalt af.' },
    { t: 12, en: 'Soap. Sea view. Phase one complete. You were never here.', nl: 'Zeep. Zeezicht. Fase één voltooid. Je bent hier nooit geweest.' }
  ];
  var journeyTimer = null;
  var journeyStart = 0;

  function setJourneySubtitle(text) {
    var el = $('journeySubtitle');
    if (!el) return;
    el.style.opacity = '0';
    window.setTimeout(function () {
      el.textContent = text;
      el.style.opacity = '1';
    }, 180);
  }

  function journeyTick() {
    var video = $('journeyVideo');
    if (!video) return;
    var elapsed = video.currentTime;
    var actueel = null;
    for (var i = 0; i < JOURNEY_SUBS.length; i++) {
      if (elapsed >= JOURNEY_SUBS[i].t) actueel = JOURNEY_SUBS[i];
    }
    if (actueel && actueel !== journeyTick._laatste) {
      journeyTick._laatste = actueel;
      setJourneySubtitle(window.FC.t(actueel.en, actueel.nl));
    }
  }

  function playJourney() {
    var video = $('journeyVideo');
    var blok = $('crt');
    var btn = $('journeyPlayBtn');
    if (!video) return;
    if (!video.src && video.dataset.src) video.src = video.dataset.src;

    if (!video.paused) {
      video.pause();
      if (blok) blok.classList.remove('journey-playing');
      if (btn) btn.classList.remove('playing');
      if (journeyTimer) { clearInterval(journeyTimer); journeyTimer = null; }
      return;
    }
    if (blok) blok.classList.add('journey-playing');
    if (btn) btn.classList.add('playing');
    journeyTick._laatste = null;
    safePlay(video);
    if (journeyTimer) clearInterval(journeyTimer);
    journeyTimer = window.setInterval(journeyTick, 400);
    video.addEventListener('ended', function () {
      if (blok) { blok.classList.remove('journey-playing'); blok.classList.add('journey-ended'); }
      if (btn) btn.classList.remove('playing');
      if (journeyTimer) { clearInterval(journeyTimer); journeyTimer = null; }
    }, { once: true });
  }
  window.playJourney = playJourney;

  /* ============================================================
     7. YOUTUBE-FACADES — iframe pas laden ná een tik.
     Mobiel kreeg bij embeds "confirm you're not a bot" — dus op
     touch-apparaten openen we de clip direct in de YouTube-app
     (die kent geen botmuur). Desktop krijgt de inline speler op
     www.youtube.com (niet nocookie: die triggert de check vaker).
     ============================================================ */
  function isTouchApparaat() {
    return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  }
  function setupYtFacades() {
    var mobiel = isTouchApparaat();
    $$('.yt-facade').forEach(function (facade) {
      var id = facade.dataset.yt;
      if (!id) return;
      facade.style.backgroundImage = 'url("https://i.ytimg.com/vi/' + id + '/hqdefault.jpg")';
      var laad = function () {
        if (mobiel) {
          /* opent de YouTube-app of m.youtube.com — speelt altijd af */
          window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener');
          return;
        }
        if (facade.classList.contains('geladen')) return;
        facade.classList.add('geladen');
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/' + id +
          '?autoplay=1&playsinline=1&rel=0&modestbranding=1';
        iframe.title = facade.getAttribute('aria-label') || 'Screening';
        iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        iframe.style.cssText = 'display:block;width:100%;aspect-ratio:16/9;border:none';
        facade.innerHTML = '';
        facade.appendChild(iframe);
      };
      facade.addEventListener('click', laad);
      facade.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); laad(); }
      });
    });
  }

  /* ============================================================
     8. COUNTDOWN — één minuut per keer
     ============================================================ */
  var COUNTDOWN_TARGET = new Date('2026-10-29T05:00:00');
  var countdownInterval = null;

  function updateCountdown() {
    var diff = COUNTDOWN_TARGET.getTime() - Date.now();
    if (diff <= 0) {
      var wrap = document.querySelector('.countdown-wrap');
      if (wrap) {
        wrap.innerHTML = '<p class="countdown-klaar">' +
          window.FC.t('THIS IS IT. THE BASEMENT IS OPEN. 🧼', 'HET IS ZOVER. DE KELDER IS OPEN. 🧼') + '</p>';
      }
      if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
      return;
    }
    var d = Math.floor(diff / 864e5);
    var h = Math.floor((diff % 864e5) / 36e5);
    var m = Math.floor((diff % 36e5) / 6e4);
    var s = Math.floor((diff % 6e4) / 1e3);
    if ($('days')) $('days').textContent = d;
    if ($('hours')) $('hours').textContent = pad2(h);
    if ($('minutes')) $('minutes').textContent = pad2(m);
    if ($('seconds')) $('seconds').textContent = pad2(s);
  }

  /* ============================================================
     9. GAME-TABS + TOUCH-GUARDS (zelfde contract als main.js)
     ============================================================ */
  function switchGame(key) {
    if (window.__activeGameRunning) return;
    $$('.game-tab').forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.game === key);
    });
    $$('.game-container').forEach(function (container) {
      var actief = container.id === key + 'Game';
      container.classList.toggle('active', actief);
      container.style.display = actief ? 'block' : 'none';
    });
  }
  function setupGameTabs() {
    $$('.game-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchGame(tab.dataset.game); });
    });
  }
  function setupTouchGuards() {
    var lastTouchEnd = 0;
    document.addEventListener('touchend', function (e) {
      if (!window.__activeGameRunning) return;
      if (!e.target || !e.target.closest || !e.target.closest('.games-section')) return;
      var now = Date.now();
      if (now - lastTouchEnd < 500) e.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (type) {
      document.addEventListener(type, function (e) {
        if (!window.__activeGameRunning) return;
        if (e.target && e.target.closest && e.target.closest('.games-section')) {
          e.preventDefault();
        }
      });
    });
  }

  /* ============================================================
     10. HET ZEEPTEGOED — localStorage['mayhem_tegoed'] = {game: best}
     Games dispatchen 'tegoed:update'; wij herlezen altijd de opslag.
     ============================================================ */
  var TEGOED_TIERS = [
    { min: 500, en: 'YOU ARE THE CLUB 🧼', nl: 'JIJ BENT DE CLUB 🧼' },
    { min: 400, en: 'Soap Master', nl: 'Zeepmeester' },
    { min: 300, en: 'Space Monkey', nl: 'Space Monkey' },
    { min: 200, en: 'Porch Stander', nl: 'Stoepstaander' },
    { min: 100, en: 'Support-Group Hopper', nl: 'Steungroep-hopper' },
    { min: 0,   en: 'Tourist', nl: 'Toerist' }
  ];
  var TEGOED_MAX = 500;

  function leesTegoed() {
    var data = null;
    try { data = JSON.parse(localStorage.getItem('mayhem_tegoed') || '{}'); }
    catch (e) { data = null; }
    if (!data || typeof data !== 'object') data = {};
    return data;
  }
  function updateTegoed() {
    var data = leesTegoed();
    var totaal = 0;
    Object.keys(data).forEach(function (k) {
      var v = parseInt(data[k], 10);
      if (!isNaN(v) && v > 0) totaal += v;
    });
    var totalEl = $('tegoedTotal');
    var tierEl = $('tegoedTier');
    var vulling = $('tegoedVulling');
    if (totalEl) totalEl.textContent = totaal;
    if (tierEl) {
      for (var i = 0; i < TEGOED_TIERS.length; i++) {
        if (totaal >= TEGOED_TIERS[i].min) {
          tierEl.textContent = window.FC.t(TEGOED_TIERS[i].en, TEGOED_TIERS[i].nl);
          break;
        }
      }
    }
    if (vulling) vulling.style.width = Math.min(100, Math.round(totaal / TEGOED_MAX * 100)) + '%';
  }
  window.addEventListener('tegoed:update', updateTegoed);
  /* Games gebruiken deze helper om hun beste score te registreren */
  window.FC.meldScore = function (game, punten) {
    var data = leesTegoed();
    var best = parseInt(data[game], 10) || 0;
    if (punten > best) {
      data[game] = punten;
      try { localStorage.setItem('mayhem_tegoed', JSON.stringify(data)); } catch (e) {}
    }
    window.dispatchEvent(new Event('tegoed:update'));
  };

  /* ============================================================
     11. HET MELDPUNT — EmailJS (zelfde dienst als de brief-realiteit)
     ============================================================ */
  var EMAILJS_PUBLIC_KEY = 'HDwrs0mdxQKrNz4Qs';
  var EMAILJS_SERVICE_ID = 'service_h0l9f1s';
  var EMAILJS_TEMPLATE_ID = 'template_ub6x1bh';

  function setupSuggestionForm() {
    var form = $('suggestionForm');
    if (!form) return;
    if (window.emailjs && typeof window.emailjs.init === 'function') {
      try { window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); }
      catch (e) {
        try { window.emailjs.init(EMAILJS_PUBLIC_KEY); } catch (e2) {}
      }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var naam = ($('suggesterName') && $('suggesterName').value || '').trim();
      var tekst = ($('suggestionText') && $('suggestionText').value || '').trim();
      var status = $('suggestionStatus');
      var btn = $('suggestionSubmitBtn');
      var setStatus = function (msg) { if (status) status.textContent = msg; };
      if (!tekst) return;
      if (btn) btn.disabled = true;
      setStatus(window.FC.t('Transmitting to the basement…', 'Bezig met verzenden naar de kelder…'));

      if (!window.emailjs || typeof window.emailjs.send !== 'function') {
        setStatus(window.FC.t('The pager network is down. Try again later.', 'Het piepernetwerk ligt eruit. Probeer het later opnieuw.'));
        if (btn) btn.disabled = false;
        return;
      }
      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name: naam || window.FC.t('a nameless member', 'een naamloos lid'),
        message: '[PROJECT MARBELLA] ' + tekst
      }).then(function () {
        setStatus(window.FC.t('Received. The group has nodded. 📟', 'Ontvangen. De groep heeft geknikt. 📟'));
        form.reset();
        if (btn) btn.disabled = false;
      }, function () {
        setStatus(window.FC.t('Delivery failed. The basement has no reception.', 'Bezorging mislukt. De kelder heeft geen bereik.'));
        if (btn) btn.disabled = false;
      });
    });
  }

  /* ============================================================
     12. STUURPIEPER — een pieper trilt over het scherm + mailto
     ============================================================ */
  function stuurPieper(naam) {
    var wie = naam || '';
    if (!reducedMotion()) {
      var pieper = document.createElement('div');
      pieper.className = 'pieper-vlucht';
      pieper.setAttribute('aria-hidden', 'true');
      pieper.innerHTML = '<span class="pieper-buzz">📟</span>';
      document.body.appendChild(pieper);
      window.setTimeout(function () { if (pieper.parentNode) pieper.parentNode.removeChild(pieper); }, 2800);
    }
    var adres = atob('YnJhbXBla0BnbWFpbC5jb20=');
    var onderwerp = window.FC.t(
      '📟 PAGER: ' + (wie ? wie + ' confirms' : 'confirmation') + ' — PROJECT MARBELLA 🎃',
      '📟 PIEPER: ' + (wie ? wie + ' bevestigt' : 'bevestiging') + ' — PROJECT MARBELLA 🎃'
    );
    var regels = currentLang() === 'nl' ? [
      'AAN:  Paper Street Soap Company, filiaal Marbella',
      'VAN:  ' + (wie || '[naam — optioneel, in de club heb je geen naam]'),
      '',
      'Ik bevestig hierbij mijn aanwezigheid bij PROJECT MARBELLA,',
      '29 okt – 1 nov 2026, El Rosario.',
      '',
      'Ik heb de acht regels gelezen. Ik praat er met niemand over.',
      'Mijn gekke pak is geregeld. Mijn lever is ingelicht.',
      '',
      '— verzonden per pieper, dit gesprek heeft nooit plaatsgevonden'
    ] : [
      'TO:    Paper Street Soap Company, Marbella branch',
      'FROM:  ' + (wie || '[name — optional, in the club you have no name]'),
      '',
      'I hereby confirm my attendance at PROJECT MARBELLA,',
      '29 Oct – 1 Nov 2026, El Rosario.',
      '',
      'I have read the eight rules. I will not talk about it.',
      'My ridiculous costume is arranged. My liver has been notified.',
      '',
      '— sent by pager. this conversation never took place'
    ];
    var mailto = 'mailto:' + adres +
      '?subject=' + encodeURIComponent(onderwerp) +
      '&body=' + encodeURIComponent(regels.join('\n'));
    window.setTimeout(function () { window.location.href = mailto; }, reducedMotion() ? 0 : 900);
  }
  window.stuurPieper = stuurPieper;

  /* ============================================================
     13. DE RUIS — generatieve kelderbrom (WebAudio, geen bestand)
     Laag brommen + ruisbed + trage hartslag. Geen samples nodig.
     ============================================================ */
  var ruisCtx = null;
  var ruisNodes = null;

  function bouwRuis() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    var ctx = new Ctx();
    var master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);

    /* kelderbrom: twee lichtgestemde lage oscillatoren */
    var brom1 = ctx.createOscillator();
    brom1.type = 'sawtooth'; brom1.frequency.value = 55;
    var brom1Gain = ctx.createGain(); brom1Gain.gain.value = 0.12;
    var bromFilter = ctx.createBiquadFilter();
    bromFilter.type = 'lowpass'; bromFilter.frequency.value = 160;
    brom1.connect(brom1Gain); brom1Gain.connect(bromFilter); bromFilter.connect(master);

    var brom2 = ctx.createOscillator();
    brom2.type = 'sine'; brom2.frequency.value = 54.3;
    var brom2Gain = ctx.createGain(); brom2Gain.gain.value = 0.1;
    brom2.connect(brom2Gain); brom2Gain.connect(master);

    /* ruisbed: gelooapte witte ruis door een smal filter */
    var seconden = 2;
    var buffer = ctx.createBuffer(1, ctx.sampleRate * seconden, ctx.sampleRate);
    var kanaal = buffer.getChannelData(0);
    for (var i = 0; i < kanaal.length; i++) kanaal[i] = (Math.random() * 2 - 1) * 0.35;
    var ruis = ctx.createBufferSource();
    ruis.buffer = buffer; ruis.loop = true;
    var ruisFilter = ctx.createBiquadFilter();
    ruisFilter.type = 'bandpass'; ruisFilter.frequency.value = 480; ruisFilter.Q.value = 0.6;
    var ruisGain = ctx.createGain(); ruisGain.gain.value = 0.05;
    ruis.connect(ruisFilter); ruisFilter.connect(ruisGain); ruisGain.connect(master);

    /* trage hartslag op de bas */
    var lfo = ctx.createOscillator();
    lfo.type = 'sine'; lfo.frequency.value = 0.55;
    var lfoGain = ctx.createGain(); lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain); lfoGain.connect(brom1Gain.gain);

    brom1.start(); brom2.start(); ruis.start(); lfo.start();
    return { ctx: ctx, master: master };
  }

  function toggleRuis() {
    var btn = $('ruisBtn');
    if (ruisNodes) {
      ruisNodes.ctx.close().catch(function () {});
      ruisNodes = null;
      if (btn) { btn.classList.remove('playing'); btn.textContent = '📻'; }
      return;
    }
    ruisNodes = bouwRuis();
    if (ruisNodes && btn) { btn.classList.add('playing'); btn.textContent = '🔊'; }
  }
  window.toggleRuis = toggleRuis;

  /* ============================================================
     14. SPRAY-STEMPELS — slaan neer zodra de sectie in beeld komt
     ============================================================ */
  (function initStempels() {
    var stamps = $$('.spray-stempel[data-stamp], [data-stamp]');
    if (!stamps.length) return;
    if (reducedMotion() || !('IntersectionObserver' in window)) return;
    stamps.forEach(function (s) { s.classList.add('pre'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pre');
          entry.target.classList.add('stamped');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -40px 0px' });
    stamps.forEach(function (s) { io.observe(s); });
  })();

  /* ============================================================
     15. HOVER-EFFECTEN — venue-cards met verborgen video
     ============================================================ */
  function setupHoverEffects() {
    $$('.venue-card').forEach(function (card) {
      var media = card.querySelector('.card-hover-video');
      if (!media) return;
      card.addEventListener('mouseenter', function () {
        loadDataSrc(media);
        media.style.opacity = '1';
        safePlay(media);
      });
      card.addEventListener('mouseleave', function () {
        media.style.opacity = '0';
        try { media.pause(); media.currentTime = 0; } catch (e) {}
      });
    });
  }

  /* ============================================================
     16. SMOOTH SCROLL — interne ankers
     ============================================================ */
  function setupSmoothScrolling() {
    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href || href === '#') return;
        var target = null;
        try { target = document.querySelector(href); } catch (err) { return; }
        if (target && !target.hidden) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ============================================================
     17. EASTER EGGS — Oelkunde, de loogkus, 'tyler' typen
     ============================================================ */
  function onthulOel() {
    var kaart = $('oelCard');
    if (!kaart) return;
    kaart.hidden = false;
    kaart.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
  }
  function setupEasterEggs() {
    $$('.oel-link').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) { e.preventDefault(); onthulOel(); });
    });

    /* het zeepje: 3× klikken = de loogkus */
    var zeepje = $('loogzeepje');
    var kus = $('loogkus');
    var kliks = 0, klikTimer = null;
    if (zeepje && kus) {
      zeepje.addEventListener('click', function () {
        kliks++;
        zeepje.classList.add('trilt');
        if (klikTimer) clearTimeout(klikTimer);
        klikTimer = window.setTimeout(function () {
          kliks = 0;
          zeepje.classList.remove('trilt');
        }, 1400);
        if (kliks >= 3) {
          kliks = 0;
          zeepje.classList.remove('trilt');
          kus.hidden = false;
          spliceFlits();
          window.setTimeout(function () { kus.hidden = true; }, 4200);
        }
      });
      kus.addEventListener('click', function () { kus.hidden = true; });
    }

    /* typ 'oel' of 'tyler' */
    var buffer = '';
    document.addEventListener('keydown', function (e) {
      if (!e.key || e.key.length !== 1) return;
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-8);
      if (buffer.indexOf('oel') !== -1) { buffer = ''; onthulOel(); }
      if (buffer.indexOf('tyler') !== -1) {
        buffer = '';
        var n = 0;
        var storm = window.setInterval(function () {
          spliceFlits();
          if (++n >= 4) clearInterval(storm);
        }, 350);
      }
    });
  }

  /* ============================================================
     18. REALITEITSKEUZE — onthoud dat de zeep gekozen is
     ============================================================ */
  (function bewaarRealiteit() {
    try { localStorage.setItem('spanje_realiteit', 'fc'); } catch (e) {}
    $$('#realiteitToggle, .naar-brief').forEach(function (terug) {
      terug.addEventListener('click', function () {
        try { localStorage.setItem('spanje_realiteit', 'hp'); } catch (e) {}
      });
    });
  })();

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    setupLangToggle();
    setupLazyVideoLoading();
    setupIosFirstTouchPlay();
    setupKelder();
    setupYtFacades();
    setupGameTabs();
    setupTouchGuards();
    setupSuggestionForm();
    setupHoverEffects();
    setupSmoothScrolling();
    setupEasterEggs();
    updateTegoed();
    updateCountdown();
    countdownInterval = window.setInterval(updateCountdown, 1000);
  });
})();
