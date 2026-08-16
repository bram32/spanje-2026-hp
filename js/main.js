/* ============================================================
   HOGWARTS AAN ZEE — MARBELLA 2026
   js/main.js — gedeeld script (klassiek script, geen module)
   ------------------------------------------------------------
   Bevat: tab-systeem voor de O.W.L.-examens, countdown
   (De Tijdverdrijver), crew-toggle (toggleMagic), lazy video's,
   Room of Requirement (funzone), De Pensieve (journey +
   ondertitels), De Uilenpost (EmailJS), muziekknop, smooth
   scroll, hover-effecten, touch-guards en console-eieren.
   Alle DOM-toegang is null-checked: de pagina overleeft het
   ontbreken van elk afzonderlijk element.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- kleine helpers ---------- */

  function $(id) { return document.getElementById(id); }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function safePlay(media) {
    if (!media || typeof media.play !== 'function') return;
    var p = media.play();
    if (p && typeof p.catch === 'function') p.catch(function () { /* autoplay geblokkeerd — prima */ });
  }

  /* Laadt data-src → src op een <video> en zijn <source> kinderen.
     forceLoad: roep ook .load() aan als er niets te wisselen viel
     (gebruikt door de crew-preloader). */
  function loadDataSrc(video, forceLoad) {
    if (!video) return false;
    var changed = false;
    if (video.dataset && video.dataset.src) {
      video.src = video.dataset.src;
      video.removeAttribute('data-src');
      changed = true;
    }
    $$('source[data-src]', video).forEach(function (source) {
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
      changed = true;
    });
    if (changed || forceLoad) {
      try { video.load(); } catch (e) { /* niets aan te doen */ }
    }
    return changed;
  }

  /* Gedeelde vlag: games zetten deze op true/false; main.js leest hem
     voor de touch-guards. Vroeg initialiseren zodat game-scripts
     (die ná dit bestand laden) hem altijd aantreffen. */
  if (typeof window.__activeGameRunning === 'undefined') {
    window.__activeGameRunning = false;
  }

  /* ============================================================
     1. GAME-TABS — switchGame + game:switch CustomEvent
     ============================================================ */

  function switchGame(key) {
    if (!key) return;

    $$('.game-tab').forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.game === key);
    });

    $$('.game-container').forEach(function (container) {
      var isTarget = container.id === key + 'Game';
      container.classList.toggle('active', isTarget);
      container.style.display = isTarget ? 'block' : 'none';
    });

    /* Games luisteren hiernaar om hun eigen rAF-loops/timers te stoppen. */
    document.dispatchEvent(new CustomEvent('game:switch', { detail: { key: key } }));
  }

  function setupGameTabs() {
    $$('.game-tab').forEach(function (tab) {
      if (!tab.dataset.game) return;
      /* Click alleen zelf wiren als er geen inline onclick is (dubbel
         vuren is idempotent, maar netjes is netjes). */
      if (!tab.hasAttribute('onclick')) {
        tab.addEventListener('click', function () { switchGame(tab.dataset.game); });
      }
      /* iOS-betrouwbaarheid: touchend als fallback; preventDefault
         onderdrukt de click erna zodat er precies één switch is.
         Alleen bij een échte tik (<10px beweging) — een scrollgebaar
         dat op een tab begint/eindigt mag geen game wisselen. */
      var tapStart = null;
      tab.addEventListener('touchstart', function (e) {
        var t = e.touches && e.touches[0];
        tapStart = t ? { x: t.clientX, y: t.clientY, moved: false } : null;
      }, { passive: true });
      tab.addEventListener('touchmove', function (e) {
        if (!tapStart) return;
        var t = e.touches && e.touches[0];
        if (t && (Math.abs(t.clientX - tapStart.x) > 10 || Math.abs(t.clientY - tapStart.y) > 10)) {
          tapStart.moved = true;
        }
      }, { passive: true });
      tab.addEventListener('touchend', function (e) {
        if (!tapStart || tapStart.moved) { tapStart = null; return; }
        tapStart = null;
        e.preventDefault();
        switchGame(tab.dataset.game);
      }, { passive: false });
    });
  }

  /* ============================================================
     2. DE TIJDVERDRIJVER — countdown naar vertrek
     ============================================================ */

  var COUNTDOWN_TARGET = new Date('2026-10-29T05:00:00');
  var countdownTimer = null;
  var countdownFinished = false;

  function updateCountdown() {
    var d = $('days'), h = $('hours'), m = $('minutes'), s = $('seconds');
    if (!d || !h || !m || !s) return;

    var diff = COUNTDOWN_TARGET.getTime() - Date.now();
    if (diff <= 0) {
      finishCountdown(d);
      return;
    }

    var totalSeconds = Math.floor(diff / 1000);
    d.textContent = String(Math.floor(totalSeconds / 86400));
    h.textContent = pad2(Math.floor((totalSeconds % 86400) / 3600));
    m.textContent = pad2(Math.floor((totalSeconds % 3600) / 60));
    s.textContent = pad2(totalSeconds % 60);
  }

  /* De oude site bevroor hier stilletjes. Deze niet. */
  function finishCountdown(anchorEl) {
    if (countdownFinished) return;
    countdownFinished = true;
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }

    var wrap = null;
    if (anchorEl && anchorEl.closest) {
      wrap = anchorEl.closest('.countdown-timer') ||
             anchorEl.closest('.countdown') ||
             anchorEl.closest('.countdown-grid') ||
             anchorEl.closest('#countdown');
    }
    if (!wrap && anchorEl) {
      wrap = (anchorEl.parentElement && anchorEl.parentElement.parentElement) || anchorEl.parentElement;
    }
    if (!wrap) return;

    wrap.innerHTML =
      '<div class="countdown-finished" style="font-family:\'Cinzel\', Georgia, serif;' +
      'color:#f4d03f;font-size:clamp(1.4rem,4vw,2.4rem);letter-spacing:.08em;' +
      'text-align:center;padding:1.5rem 1rem;">DE BRIEF IS VERZILVERD. 🏰</div>';
    emberBurst(wrap);
  }

  /* Korte vonkenregen; leunt op keyframe `floatUp` uit styles.css. */
  function emberBurst(container) {
    if (!container || reducedMotion()) return;
    try {
      if (window.getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
    } catch (e) { container.style.position = 'relative'; }

    var glyphs = ['✨', '🔥', '⚡', '🎃'];
    var sparks = [];
    for (var i = 0; i < 24; i++) {
      var spark = document.createElement('span');
      spark.textContent = glyphs[i % glyphs.length];
      spark.setAttribute('aria-hidden', 'true');
      spark.style.cssText =
        'position:absolute;bottom:0;pointer-events:none;z-index:5;opacity:0;' +
        'left:' + (Math.random() * 100).toFixed(1) + '%;' +
        'font-size:' + Math.round(12 + Math.random() * 14) + 'px;' +
        'animation:floatUp ' + (1.2 + Math.random() * 1.6).toFixed(2) + 's ease-out ' +
        (Math.random() * 0.9).toFixed(2) + 's forwards;';
      container.appendChild(spark);
      sparks.push(spark);
    }
    setTimeout(function () {
      sparks.forEach(function (spark) {
        if (spark.parentNode) spark.parentNode.removeChild(spark);
      });
    }, 4200);
  }

  /* ============================================================
     3. TOGGLEMAGIC — crew-avatars (normaal ↔ HP, Treb 3-staten)
     ------------------------------------------------------------
     Gestapelde video's: .vid-normal / .vid-hp / .vid-hp2 in één
     avatar; .active regelt opacity (instant switch, geen flits).
     Staten: normal → hp (gouden gloed) → [hp2 patronus, alleen
     Treb] → normal. data-state leeft op de .crew-member kaart.
     ============================================================ */

  function toggleMagic(avatarEl) {
    if (!avatarEl || !avatarEl.querySelector) return;

    var member = avatarEl.closest ? avatarEl.closest('.crew-member') : null;
    var stateHost = member || avatarEl;
    var videos = {
      normal: avatarEl.querySelector('.vid-normal'),
      hp: avatarEl.querySelector('.vid-hp'),
      hp2: avatarEl.querySelector('.vid-hp2')
    };

    var state = stateHost.dataset.state || 'normal';
    var next;
    if (state === 'normal' && videos.hp) next = 'hp';
    else if (state === 'hp' && videos.hp2) next = 'hp2';
    else next = 'normal';

    /* Alles pauzeren en verbergen, dan alleen de volgende tonen. */
    ['normal', 'hp', 'hp2'].forEach(function (k) {
      var v = videos[k];
      if (!v) return;
      v.classList.remove('active');
      if (!v.paused) { try { v.pause(); } catch (e) {} }
    });

    var show = videos[next] || videos.normal;
    if (show) {
      loadDataSrc(show); /* voor het geval de preloader hem nog niet had */
      show.classList.add('active');
      safePlay(show);
    }

    if (member) {
      member.classList.toggle('hp-mode', next === 'hp');       /* gouden gloed (CSS) */
      member.classList.toggle('patronus-mode', next === 'hp2'); /* zilverwitte gloed (CSS) */
    }
    stateHost.dataset.state = next;
  }

  /* NB: geen preloader voor de HP-video's meer — dat trok ~40MB binnen
     zodra de crew-sectie in beeld kwam. toggleMagic() laadt en speelt
     elke HP-video pas bij de eerste tik op de avatar (preload="none"). */

  /* ============================================================
     4. LAZY VIDEO'S + iOS eerste-touch play-all
     ============================================================ */

  function setupLazyVideoLoading() {
    var lazyVideos = $$('video.lazy-video');
    if (!lazyVideos.length) return;

    var activate = function (video) {
      loadDataSrc(video, true);
      /* Alleen echte autoplay-video's spelen bij in-beeld komen; overige
         muted video's (profetie, funzone-thumbs, drakenkaart) krijgen
         enkel hun src en wachten op tik/hover — scheelt tientallen MB's. */
      if (video.autoplay) {
        var p = video.play();
        if (p && typeof p.catch === 'function') {
          p.catch(function () {
            /* Autoplay geweigerd: eenmalige click-to-play fallback. */
            video.addEventListener('click', function () { safePlay(video); }, { once: true });
          });
        }
      }
    };

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            activate(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '100px', threshold: 0.1 });
      lazyVideos.forEach(function (v) { io.observe(v); });
    } else {
      lazyVideos.forEach(activate);
    }
  }

  /* iOS blokkeert autoplay tot de eerste aanraking: bij de eerste
     touchstart alle gepauzeerde autoplay-video's alsnog starten. */
  function setupIosFirstTouchPlay() {
    document.addEventListener('touchstart', function () {
      $$('video[autoplay]').forEach(function (video) {
        if (video.paused) safePlay(video);
      });
    }, { once: true, passive: true });
  }

  /* Generieke fragment-loop (erfstuk): speel [start, end] in een lus. */
  function setupVideoLoop(videoId, startTime, endTime) {
    var video = $(videoId);
    if (!video) return;
    video.addEventListener('loadedmetadata', function () {
      try { video.currentTime = startTime; } catch (e) {}
    });
    video.addEventListener('timeupdate', function () {
      if (video.currentTime >= endTime) {
        try { video.currentTime = startTime; } catch (e) {}
        safePlay(video);
      }
    });
  }

  /* ============================================================
     5. KAMER VAN HOGE NOOD — funzone-speler
     ============================================================ */

  function setupFunZone() {
    var mainVideo = $('funzoneVideo');
    var caption = $('funzoneCaption');
    var thumbs = $$('.funzone-thumb');
    if (!mainVideo || !thumbs.length) return;

    var setActiveThumb = function (activeThumb) {
      thumbs.forEach(function (thumb) {
        var isActive = thumb === activeThumb;
        thumb.classList.toggle('active', isActive);
        thumb.style.borderColor = isActive ? '#f4d03f' : '';
      });
    };

    thumbs.forEach(function (thumb) {
      var file = thumb.dataset.video;
      var title = thumb.dataset.title || '';
      var preview = thumb.querySelector('video');

      thumb.addEventListener('click', function () {
        if (!file) return;
        mainVideo.src = './assets/videos/funzone/' + file;
        try { mainVideo.load(); } catch (e) {}
        safePlay(mainVideo);
        if (caption) {
          var h3 = caption.querySelector('h3') || caption;
          h3.textContent = title;
        }
        setActiveThumb(thumb);
      });

      /* Hover-preview (desktop). */
      thumb.addEventListener('mouseenter', function () { if (preview) safePlay(preview); });
      thumb.addEventListener('mouseleave', function () {
        if (!preview) return;
        try { preview.pause(); preview.currentTime = 0; } catch (e) {}
      });
    });
  }

  /* ============================================================
     6. DE HERSENPAN — journey-video + getimede ondertitels
     ------------------------------------------------------------
     De video is ~6s en LOOPT; de ondertitels draaien daarom op
     hun eigen klok (performance.now), NIET op video.currentTime.
     41 cues, wisselende cadans, totale looptijd ~131s; daarna eindtoestand
     (muziek stopt, replay-hint) — playJourney() start opnieuw.
     ============================================================ */

  var JOURNEY_MUSIC_SRC = './assets/videos/lotr-music.m4a';
  var JOURNEY_MUSIC_VOLUME = 0.35;
  var JOURNEY_TICK_MS = 500;
  var JOURNEY_FADE_MS = 300;
  var JOURNEY_TOTAL_S = 131;

  var journeySubtitles = [
    { t: 0,   text: '🏛️ MINISTRY OF MAGIC — GEDEPONEERDE HERINNERING № 1031-HW' },
    { t: 3,   text: 'Gedeponeerd door: A. Dumbledore (Treb). Kijkwijzer: 18+, wegens cerveza.' },
    { t: 6,   text: '⚠️ WAARSCHUWING: deze herinnering is onder invloed opgenomen. De Pensieve doet zijn best.' },
    { t: 9,   text: 'De Afdeling Mysteries is niet aansprakelijk voor déjà vu.' },
    { t: 12,  text: 'Correctie: u hééft deze herinnering al eens bekeken. Dat weet u alleen niet meer.' },
    { t: 16,  text: '— BEGIN VAN DE HERINNERING —' },
    { t: 19,  text: '29 oktober, 06:12, Schiphol. Acht tovenaars, één missie, nul ochtendmensen.' },
    { t: 22,  text: 'De Hogwarts Express vertrok stipt vanaf Platform 9¾ (in de praktijk: gate D14).' },
    { t: 25,  text: 'Derk probeerde door de muur te lopen. De muur won. Alweer een Ministerieel record.' },
    { t: 28,  text: 'Boven Frankrijk: zware turbulentie. Of zoals Samuel het noemt: "gewoon Gelders weer".' },
    { t: 31,  text: 'Málaga. De vliegende Ford Anglia stond klaar. Huurklasse: economy, maar mét vleugels.' },
    { t: 34,  text: 'Marc controleerde de borg driemaal. Gringotts-gewoonte. De automaat is nu bang voor hem.' },
    { t: 37,  text: 'El Rosario. Het kasteel. Privézwembad. Uitzicht op Gibraltar — wij zeggen: Azkaban.' },
    { t: 40,  text: 'Op heldere dagen zie je Marokko. Op minder heldere dagen zie je Davids snor.' },
    { t: 44,  text: 'Dag 2: Quidditch voor Muggles, Santa Clara. Achttien holes. Verder geen details voor het dossier.' },
    { t: 47,  text: 'In Noord-Europa regende het die dag. Wij dronken overdag op het strand. Uit respect.' },
    { t: 50,  text: 'Peeg gaf Potions aan het zwembad. Eerste les: "Het is geen mixen. Het is wetenschap."' },
    { t: 53,  text: '👻 En Jaap? JAAP GING MEE. De geest verliet zijn kasteel. Historici zijn er nog niet uit.' },
    { t: 56,  text: 'Zijn gitaarsolo om 02:00 werd in drie urbanisaties gehoord. Vier sterren op Tripadvisor.' },
    { t: 59,  text: 'David verloor een weddenschap en sprak een uur uitsluitend in Slytherin-citaten. Niemand merkte verschil.' },
    { t: 62,  text: 'Samuel nam eigen pompoenen mee uit Gelderland. De douane had vragen. Samuel had antwoorden. Welke, weet niemand.' },
    { t: 65,  text: 'Bram — De Jongen Die Boekte — kreeg zijn aanbetaling terug in respect. Uitsluitend in respect.' },
    { t: 68,  text: 'Treb deelde huispunten uit met de mildheid van een schoolhoofd en de precisie van een barman.' },
    { t: 72,  text: '31 oktober. HALLOWEEN. De Great Hall werd voorbereid. De kaarsen gingen vanzelf aan. Vanzelf.' },
    { t: 76,  text: '⚠️ Vanaf hier raakt de herinnering… beschadigd.' },
    { t: 79,  text: '[FRAGMENT ONTBREEKT — 23:47 t/m 03:12]' },
    { t: 82,  text: 'Getuigen melden een dansende gedaante met een pompoen als hoofd. Het Ministerie ontkent. De pompoen ook.' },
    { t: 85,  text: 'Het zwembad lichtte groen op. Niemand heeft dat gedaan. Het zwembad deed dat zelf.' },
    { t: 88,  text: 'Iemand fluisterde "nog één rondje". Het was 04:00. Het rondje kwam er. Het rondje komt altijd.' },
    { t: 91,  text: '██████ ██ █████ — GEREDIGEERD DOOR HET MINISTRY OF MAGIC — █████ ██' },
    { t: 94,  text: 'De opblaasflamingo is nooit teruggevonden. Ziet u hem: niet benaderen. Hij weet wat er gebeurd is.' },
    { t: 97,  text: '03:33. Acht telefoons maakten tegelijk exact dezelfde foto. Er stond niemand achter de camera.' },
    { t: 101, text: 'Officiële classificatie van deze nacht: "Episch. Verder geen vragen."' },
    { t: 105, text: '1 november, checkout 10:00. Acht lichamen, zes zielen, twee zonnebrillen vermist.' },
    { t: 108, text: 'Huismeester Collin sprak: "Jullie mogen terugkomen. Na het stofzuigen."' },
    { t: 111, text: 'En ergens boven de Middellandse Zee vloog een uil met acht bevestigingen…' },
    { t: 114, text: '…want dit, heren, was slechts het BEGIN.' },
    { t: 117, text: '🔮 De glazen bol over 2027: "Erger. Veel erger. Op de goede manier."' },
    { t: 120, text: 'EINDE VAN DE HERINNERING — deponeer uw eigen versie via de Uilenpost.' },
    { t: 124, text: 'P.S. U mag nu wegkijken.' },
    { t: 127, text: '…Waarom kijkt u nog?' },
  ];

  var journey = {
    playing: false,
    ended: false,
    startStamp: 0,   /* performance.now() bij (her)start */
    accumulated: 0,  /* verstreken seconden vóór de laatste pauze */
    cueIndex: -1,
    timer: null
  };

  function journeySection() {
    var video = $('journeyVideo');
    if (!video || !video.closest) return null;
    return video.closest('.journey-section') || video.closest('section');
  }

  function setJourneySubtitle(text) {
    var sub = $('journeySubtitle');
    if (!sub) return;
    if (!sub.style.transition) {
      sub.style.transition = 'opacity ' + JOURNEY_FADE_MS + 'ms ease';
    }
    sub.style.opacity = '0';
    setTimeout(function () {
      sub.textContent = text;
      sub.style.opacity = '1';
    }, JOURNEY_FADE_MS);
  }

  function journeyElapsed() {
    return journey.accumulated + (performance.now() - journey.startStamp) / 1000;
  }

  function journeyTick() {
    var elapsed = journeyElapsed();
    if (elapsed >= JOURNEY_TOTAL_S) {
      endJourney();
      return;
    }
    var idx = -1;
    for (var i = 0; i < journeySubtitles.length; i++) {
      if (journeySubtitles[i].t <= elapsed) idx = i;
      else break;
    }
    if (idx >= 0 && idx !== journey.cueIndex) {
      journey.cueIndex = idx;
      setJourneySubtitle(journeySubtitles[idx].text);
    }
  }

  function endJourney() {
    if (journey.timer) { clearInterval(journey.timer); journey.timer = null; }
    journey.playing = false;
    journey.ended = true;
    journey.accumulated = 0;
    journey.cueIndex = -1;

    var video = $('journeyVideo');
    var music = $('journeyMusic');
    if (video) { try { video.pause(); } catch (e) {} }
    if (music) {
      try { music.pause(); music.currentTime = 0; } catch (e) {}
    }

    var section = journeySection();
    if (section) {
      section.classList.remove('journey-playing');
      section.classList.add('journey-ended');
    }
    var btn = $('journeyPlayBtn');
    if (btn) btn.classList.remove('playing');

    setJourneySubtitle('✨ Einde van de herinnering — tik met de toverstok om haar opnieuw te betreden 🔄');
  }

  /* Play/pauze-toggle; na afloop start een nieuwe aanroep opnieuw. */
  function playJourney() {
    var video = $('journeyVideo');
    if (!video) return;
    var music = $('journeyMusic');
    var section = journeySection();
    var btn = $('journeyPlayBtn');

    if (journey.playing) {
      /* pauzeren: verstreken tijd opslaan, klok stilzetten */
      journey.accumulated = journeyElapsed();
      journey.playing = false;
      if (journey.timer) { clearInterval(journey.timer); journey.timer = null; }
      try { video.pause(); } catch (e) {}
      if (music) { try { music.pause(); } catch (e) {} }
      if (section) section.classList.remove('journey-playing');
      if (btn) btn.classList.remove('playing');
      return;
    }

    if (journey.ended) {
      journey.ended = false;
      journey.accumulated = 0;
      journey.cueIndex = -1;
      if (section) section.classList.remove('journey-ended');
    }

    /* Achtergrondmuziek pauzeren: anders spelen twee kopieën van
       lotr-music.m4a tegelijk, plus de audiotrack van de video zelf. */
    var bg = $('bgMusic');
    if (bg && !bg.paused) {
      try { bg.pause(); } catch (e) {}
      var musicBtn = $('musicBtn');
      if (musicBtn) { musicBtn.textContent = '🎸'; musicBtn.classList.remove('playing'); }
    }

    video.loop = true;
    video.muted = false; /* gedempt tót de herinnering betreden wordt */
    safePlay(video);

    if (music) {
      if (!music.getAttribute('src') && !music.querySelector('source')) {
        music.src = JOURNEY_MUSIC_SRC;
      }
      music.loop = true;
      music.volume = JOURNEY_MUSIC_VOLUME;
      safePlay(music);
    }

    journey.playing = true;
    journey.startStamp = performance.now();
    if (journey.timer) clearInterval(journey.timer);
    journeyTick(); /* cue 0 (of hervatte cue) meteen tonen */
    journey.timer = setInterval(journeyTick, JOURNEY_TICK_MS);

    if (section) section.classList.add('journey-playing');
    if (btn) btn.classList.add('playing');
  }

  /* ============================================================
     7. DE UILENPOST — EmailJS-suggestieformulier
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

      var nameInput = $('suggesterName');
      var textInput = $('suggestionText');
      var status = $('suggestionStatus');
      var btn = $('suggestionSubmitBtn');

      var setStatus = function (msg) { if (status) status.textContent = msg; };
      var restoreBtn = function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '🦉 Verstuur per uil';
        }
      };

      var name = (nameInput && nameInput.value.trim()) || 'Anoniem';
      var text = textInput ? textInput.value.trim() : '';

      if (!text) {
        setStatus('⚠️ Een lege brief verstuurt zelfs onze traagste uil niet.');
        return;
      }
      if (!window.emailjs || typeof window.emailjs.send !== 'function') {
        setStatus('❌ Uil onderschept door het Ministerie: EmailJS is niet geladen.');
        return;
      }

      setStatus('🦉 Uw uil is onderweg…');
      if (btn) btn.disabled = true;

      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name: name,
        message: text,
        to_name: 'Bram',
        reply_to: 'noreply@marbella2026.com'
      }).then(function () {
        setStatus('✅ Uil geland bij het Schoolhoofd (Bram)!');
        form.reset();
        restoreBtn();
      }, function (err) {
        var reason = (err && (err.text || err.message)) || 'onbekende vluchtstoring';
        setStatus('❌ Uil onderschept door het Ministerie: ' + reason);
        restoreBtn();
      });
    });
  }

  /* ============================================================
     8. MUZIEKKNOP — #bgMusic + #musicBtn (🎸 ↔ 🪄)
     ============================================================ */

  function toggleMusic() {
    var music = $('bgMusic');
    if (!music) return;
    var btn = $('musicBtn');

    if (music.paused) {
      music.volume = 0.3;
      var p = music.play();
      if (p && typeof p.then === 'function') {
        p.then(function () {
          if (btn) { btn.textContent = '🪄'; btn.classList.add('playing'); }
        }).catch(function () { /* autoplay geblokkeerd; knop blijft 🎸 */ });
      } else if (btn) {
        btn.textContent = '🪄';
        btn.classList.add('playing');
      }
    } else {
      music.pause();
      if (btn) { btn.textContent = '🎸'; btn.classList.remove('playing'); }
    }
  }

  function setupMusicButton() {
    var btn = $('musicBtn');
    if (btn && !btn.hasAttribute('onclick')) {
      btn.addEventListener('click', toggleMusic);
    }
  }

  /* ============================================================
     9. SMOOTH SCROLL — interne ankers
     ============================================================ */

  function setupSmoothScrolling() {
    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href || href === '#') return; /* '#' alleen = geen geldige selector */
        var target = null;
        try { target = document.querySelector(href); } catch (err) { return; }
        /* verborgen doelen (bv. #oelCard) hebben hun eigen onthul-handler */
        if (target && !target.hidden) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ============================================================
     10. HOVER-EFFECTEN — .highlight-card / .venue-card
     ============================================================ */

  function setupHoverMedia(card, media) {
    if (!card || !media) return;
    var isVideo = media.tagName === 'VIDEO';
    card.addEventListener('mouseenter', function () {
      media.style.opacity = '1';
      if (isVideo) safePlay(media);
    });
    card.addEventListener('mouseleave', function () {
      media.style.opacity = '0';
      if (isVideo) {
        try { media.pause(); media.currentTime = 0; } catch (e) {}
      }
    });
  }

  function setupHoverEffects() {
    $$('.highlight-card').forEach(function (card) {
      var media = card.querySelector('video') || card.querySelector('img');
      setupHoverMedia(card, media);
    });
    $$('.venue-card').forEach(function (card) {
      var media = card.querySelector('.card-hover-video') || card.querySelector('.card-hover-img');
      setupHoverMedia(card, media);
    });
  }

  /* ============================================================
     11. TOUCH-GUARDS — alleen actief terwijl er een game draait
     ------------------------------------------------------------
     Games zetten window.__activeGameRunning true/false; wij
     blokkeren alleen dán dubbeltik-zoom en iOS pinch-gestures
     binnen .games-section. De pagina blijft verder scrollbaar.
     ============================================================ */

  function setupTouchGuards() {
    var lastTouchEnd = 0;

    document.addEventListener('touchend', function (e) {
      if (!window.__activeGameRunning) return;
      if (!e.target || !e.target.closest || !e.target.closest('.games-section')) return;
      var now = Date.now();
      if (now - lastTouchEnd < 500) e.preventDefault(); /* dubbeltik-zoom */
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
     12. HET PUNTENGLAS — House Points-scoreboard (§6.0)
     ------------------------------------------------------------
     Games schrijven localStorage['zweinstein_punten'] = {game: best}
     en dispatchen 'punten:update'. Wij herlezen ALTIJD de opslag
     (de event-payloads zijn points/punten-inconsistent) en tonen
     totaal + titel-ladder + vulhoogte van het glas.
     ============================================================ */

  var PUNTEN_TIERS = [
    { min: 500, titel: 'Order of Merlin, Eerste Klasse 🏆' },
    { min: 400, titel: 'Duelleerkampioen' },
    { min: 300, titel: 'Hoofdmonitor' },
    { min: 200, titel: 'Klassenoudste' },
    { min: 100, titel: 'Eerstejaars' },
    { min: 0,   titel: 'Muggle' }
  ];
  var PUNTEN_MAX = 500;
  var puntenLastTier = null;

  function leesPunten() {
    var data = null;
    try { data = JSON.parse(localStorage.getItem('zweinstein_punten') || '{}'); }
    catch (e) { data = null; }
    if (!data || typeof data !== 'object') data = {};
    return data;
  }

  function renderPuntenglas() {
    var totalEl = $('puntenTotal');
    var tierEl = $('puntenTier');
    if (!totalEl && !tierEl) return;

    var data = leesPunten();
    var total = 0;
    for (var key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        var n = Number(data[key]);
        if (isFinite(n) && n > 0) total += n;
      }
    }

    var tier = PUNTEN_TIERS[PUNTEN_TIERS.length - 1].titel;
    for (var i = 0; i < PUNTEN_TIERS.length; i++) {
      if (total >= PUNTEN_TIERS[i].min) { tier = PUNTEN_TIERS[i].titel; break; }
    }

    if (totalEl) totalEl.textContent = String(total);
    if (tierEl) tierEl.textContent = tier;

    var vulling = $('puntenVulling');
    if (vulling) {
      vulling.style.height = Math.min(100, Math.round((total / PUNTEN_MAX) * 100)) + '%';
    }

    /* fonkeling bij een nieuwe titel (niet bij de allereerste render) */
    var glas = $('puntenglas');
    if (glas && puntenLastTier !== null && tier !== puntenLastTier) {
      glas.classList.add('tier-up');
      setTimeout(function () { glas.classList.remove('tier-up'); }, 900);
    }
    puntenLastTier = tier;
  }

  function setupPuntenglas() {
    renderPuntenglas();
    document.addEventListener('punten:update', renderPuntenglas);
  }

  /* ============================================================
     13. EASTER EGGS — Oelkunde, Howler & spreuken-typebuffer
     ============================================================ */

  function goldToast(msg) {
    var toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.textContent = msg;
    document.body.appendChild(toastEl);
    setTimeout(function () {
      if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    }, 3200);
  }

  /* --- Egg 1: KEUZEVAK OELKUNDE (Art. 7 / typ 'oel') — VERPLICHT -------- */
  function revealOelCard() {
    var card = $('oelCard');
    if (!card) return;
    card.removeAttribute('hidden');
    try { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    catch (e) { card.scrollIntoView(); }
  }

  function setupOelTrigger() {
    var trigger = $('oelTrigger');
    if (!trigger) return;
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      revealOelCard();
    });
  }

  /* --- Egg 2: De Howler voor Jaap (3× klikken) ------------------------ */
  function setupHowler() {
    var brief = $('brulbrief');
    if (!brief) return;
    var clicks = 0;
    var opened = false;

    brief.addEventListener('click', function () {
      if (opened) return;
      clicks++;
      if (clicks < 3) {
        brief.classList.add('trilt');
        setTimeout(function () { brief.classList.remove('trilt'); }, 650);
        return;
      }

      opened = true;
      brief.classList.add('trilt');

      var scream = document.createElement('div');
      scream.className = 'brulbrief-scream';
      scream.setAttribute('role', 'alert');
      scream.textContent = 'JAAAAP! JE HAD GEWOON MEE GEMOETEN! ZELFS DE SORTEERHOED VOND ER WAT VAN! — was getekend, IEDEREEN';
      document.body.appendChild(scream);

      document.body.classList.add('screen-shake');
      setTimeout(function () { document.body.classList.remove('screen-shake'); }, 600);

      /* daarna verkruimelt de brief (zoals het hoort) */
      setTimeout(function () {
        if (scream.parentNode) scream.parentNode.removeChild(scream);
        brief.classList.remove('trilt');
        brief.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        brief.style.opacity = '0.25';
        brief.style.transform = 'scale(0.85) rotate(6deg)';
        brief.setAttribute('aria-label', 'De Howler is uitgeraasd.');
      }, 3400);
    });
  }

  /* --- Eggs 3–5: spreuken-typebuffer ------------------------------------ */
  function boterbierRegen() {
    if (reducedMotion()) return;
    var glyphs = ['🍺', '🎃', '⚡'];
    for (var i = 0; i < 24; i++) {
      (function (idx) {
        setTimeout(function () {
          var p = document.createElement('span');
          p.className = 'spreuk-particle';
          p.setAttribute('aria-hidden', 'true');
          p.textContent = glyphs[idx % glyphs.length];
          p.style.left = (2 + Math.random() * 94) + 'vw';
          p.style.top = (30 + Math.random() * 60) + 'vh';
          document.body.appendChild(p);
          setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 2700);
        }, idx * 110);
      })(i);
    }
  }

  /* +10 House Points voor hydratatie — idempotent (data.bier = 10) */
  function bierBonus() {
    var toegekend = false;
    try {
      var data = leesPunten();
      if (!data.bier) {
        data.bier = 10;
        localStorage.setItem('zweinstein_punten', JSON.stringify(data));
        toegekend = true;
      }
    } catch (e) { /* privémodus: dorst blijft */ }
    try {
      document.dispatchEvent(new CustomEvent('punten:update', { detail: { game: 'bier', points: 10 } }));
    } catch (e) { /* stil */ }
    return toegekend;
  }

  function trolInDeKelder() {
    var banner = document.createElement('div');
    banner.className = 'trol-banner';
    banner.setAttribute('role', 'alert');
    banner.textContent = '🧌 TROL IN DE KELDER!!! …dacht ik dat u even weten moest.';
    document.body.appendChild(banner);
    document.body.classList.add('screen-shake');
    setTimeout(function () { document.body.classList.remove('screen-shake'); }, 600);
    setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 3200);
  }

  function accioBier(pos) {
    var b = document.createElement('span');
    b.textContent = '🍺';
    b.setAttribute('aria-hidden', 'true');
    var x = (pos && pos.x != null) ? pos.x : Math.round(window.innerWidth / 2);
    var y = (pos && pos.y != null) ? pos.y : Math.round(window.innerHeight / 2);
    b.style.cssText = 'position:fixed;z-index:1500;left:-48px;top:' + y +
      'px;font-size:2rem;pointer-events:none;transition:transform 0.9s cubic-bezier(0.2,0.8,0.3,1);';
    document.body.appendChild(b);
    window.requestAnimationFrame(function () {
      b.style.transform = 'translateX(' + (x + 48) + 'px)';
    });
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1600);
  }

  function castSpreuk(spreuk, pos) {
    switch (spreuk) {
      case 'bier':
        boterbierRegen();
        goldToast(bierBonus()
          ? 'BOTERBIER HIER! +10 House Points voor hydratatie. 🍺'
          : 'BOTERBIER HIER! (De bar is niet onbeperkt.) 🍺');
        break;
      case 'trol':
        trolInDeKelder();
        break;
      case 'oel':
        revealOelCard();
        break;
      case 'lumos':
        document.body.classList.add('lumos');
        break;
      case 'nox':
        document.body.classList.remove('lumos');
        break;
      case 'accio bier':
        accioBier(pos);
        break;
    }
  }

  function setupSpreuken() {
    /* langste eerst: 'accio bier' moet winnen van 'bier' */
    var SPELLS = ['accio bier', 'lumos', 'trol', 'bier', 'nox', 'oel'];
    var MAX_LEN = 12;
    var buffer = '';
    var lastTap = { x: null, y: null };

    document.addEventListener('click', function (e) {
      if (typeof e.clientX === 'number') { lastTap.x = e.clientX; lastTap.y = e.clientY; }
    }, true);

    document.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var k = e.key;
      if (!k || k.length !== 1) return; /* alleen letters/spaties */
      buffer = (buffer + k.toLowerCase()).slice(-MAX_LEN);
      for (var i = 0; i < SPELLS.length; i++) {
        var spell = SPELLS[i];
        if (buffer.slice(-spell.length) === spell) {
          castSpreuk(spell, lastTap);
          buffer = '';
          break;
        }
      }
    });
  }

  /* ============================================================
     14. CONSOLE-EIEREN
     ============================================================ */

  function logConsoleEggs() {
    try {
      console.log('%cIk zweer plechtig dat ik niets goeds in de zin heb.',
        'color:#f4d03f; font-size:14px; font-family:Georgia, serif;');
      console.log('Psst. Typ ergens b-i-e-r.');
      console.log('En voor gevorderden: roep onheil() aan.');
    } catch (e) { /* console weggenomen? dan geen onheil */ }
  }

  /* onheil() — print de crew als ASCII-uilen. */
  function onheil() {
    var W = 10;
    var pad = function (str) {
      str = String(str);
      if (str.length >= W) return str;
      var total = W - str.length;
      var left = Math.floor(total / 2);
      return new Array(left + 1).join(' ') + str + new Array(total - left + 1).join(' ');
    };

    var owls = [
      { name: 'TREB',   eyes: '(O,O)' },  /* het Schoolhoofd ziet alles */
      { name: 'MARC',   eyes: '(o,o)' },
      { name: 'DERK',   eyes: '(0,0)' },  /* hij ziet álles, letterlijk */
      { name: 'SAMUEL', eyes: '(o,O)' },
      { name: 'DAVID',  eyes: '(-,o)' },  /* knipoogt naar zichzelf */
      { name: 'PEEG',   eyes: '(v,v)' },  /* oordeelt */
      { name: 'BRAM',   eyes: '(*,o)' },  /* litteken-oog */
      { name: 'JAAP',   eyes: '(^,^)' }   /* gaat mee! */
    ];

    var art = '';
    for (var r = 0; r < owls.length; r += 4) {
      var group = owls.slice(r, r + 4);
      art += [
        group.map(function ()  { return pad(',___,'); }).join(''),
        group.map(function (o) { return pad(o.eyes); }).join(''),
        group.map(function ()  { return pad('{ " }'); }).join(''),
        group.map(function ()  { return pad('-"-"-'); }).join(''),
        group.map(function (o) { return pad(o.name); }).join('')
      ].join('\n') + '\n\n';
    }

    try {
      console.log('🦉 De uilen van Hogwarts aan Zee brengen onheil:\n\n' + art);
      console.log('%cOnheil gesticht. 🎃', 'color:#f4d03f; font-weight:bold;');
    } catch (e) {}
    return 'Onheil gesticht.';
  }

  /* ============================================================
     INIT
     ============================================================ */

  function init() {
    logConsoleEggs();

    /* video's & media */
    setupLazyVideoLoading();
    setupIosFirstTouchPlay();
    setupVideoLoop('epicNightVideo', 6, 11); /* erfstuk; no-op als element ontbreekt */

    /* interactie */
    setupGameTabs();
    setupTouchGuards();
    setupHoverEffects();
    setupSmoothScrolling();
    setupMusicButton();
    setupFunZone();
    setupSuggestionForm();
    setupPuntenglas();

    /* easter eggs */
    setupOelTrigger();
    setupHowler();
    setupSpreuken();

    /* countdown — geen zinloze interval als het doel al verstreken is */
    updateCountdown();
    if (!countdownFinished) {
      countdownTimer = setInterval(updateCountdown, 1000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ============================================================
     DE ZEGELBREUK — het lakzegel van de toelatingsbrief
     Klik het zegel (of wacht 3,5s / scroll) en de brief vouwt open.
     ============================================================ */
  var letterOpened = false;

  function openLetter() {
    if (letterOpened) return;
    letterOpened = true;

    var zegelbreuk = document.getElementById('zegelbreuk');
    var seal = document.getElementById('waxSeal');
    var crack = document.getElementById('sealCrack');
    var envelope = document.getElementById('heroEnvelope');
    var letter = document.getElementById('heroLetter');

    if (crack) crack.setAttribute('opacity', '1');
    if (seal) seal.classList.add('cracked');

    window.setTimeout(function () {
      if (envelope) {
        envelope.style.transition = 'opacity 0.5s ease, transform 0.5s ease, max-height 0.6s ease 0.2s, margin 0.6s ease 0.2s';
        envelope.style.opacity = '0';
        envelope.style.transform = 'scale(0.95)';
        envelope.style.maxHeight = envelope.offsetHeight + 'px';
        envelope.style.overflow = 'hidden';
        window.requestAnimationFrame(function () {
          envelope.style.maxHeight = '0px';
          envelope.style.marginBottom = '0px';
        });
        window.setTimeout(function () { envelope.style.display = 'none'; }, 900);
      }
      if (letter) {
        letter.classList.remove('folded');
        letter.classList.add('open');
      }
      if (zegelbreuk) zegelbreuk.dataset.state = 'open';
    }, 450);
  }

  (function initZegelbreuk() {
    var letter = document.getElementById('heroLetter');
    var zegelbreuk = document.getElementById('zegelbreuk');
    if (!letter || !zegelbreuk) return;

    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      // Brief begint gewoon open; envelop verdwijnt stilletjes.
      var env = document.getElementById('heroEnvelope');
      if (env) env.style.display = 'none';
      letter.classList.add('open');
      zegelbreuk.dataset.state = 'open';
      letterOpened = true;
      return;
    }

    letter.classList.add('folded');
    // Nooit content blokkeren: auto-open na 3,5s of bij eerste scroll.
    window.setTimeout(openLetter, 3500);
    window.addEventListener('scroll', openLetter, { once: true, passive: true });
  })();

  /* ============================================================
     MINISTERIËLE STEMPELS — slaan neer zodra de sectie in beeld komt
     ============================================================ */
  (function initStempels() {
    var stamps = document.querySelectorAll('.stamp, .stempel');
    if (!stamps.length) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return; // stempels blijven gewoon staan

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
     DE UILENPOST-EXPRES — stuurUil(naam)
     Een uil vliegt met je brief over het scherm en opent daarna
     een kant-en-klare bevestigingsmail. Het adres staat nergens
     leesbaar op de site (base64, pas samengesteld bij de klik).
     ============================================================ */
  function stuurUil(naam) {
    var wie = naam || '';

    if (!reducedMotion()) {
      var uil = document.createElement('div');
      uil.className = 'uil-vlucht';
      uil.setAttribute('aria-hidden', 'true');
      uil.innerHTML = '<span class="uil-lijf">🦉</span><span class="uil-brief">✉️</span>';
      document.body.appendChild(uil);
      window.setTimeout(function () { if (uil.parentNode) uil.parentNode.removeChild(uil); }, 2800);
    }

    var adres = atob('YnJhbXBla0BnbWFpbC5jb20=');
    var onderwerp = '🦉 UILENPOST: ' + (wie ? wie + ' bevestigt' : 'bevestiging') +
      ' — Hogwarts aan Zee 🎃 Halloween-editie';
    var brief = [
      'AAN:  Het Ministry of Magic',
      '      Afdeling Muggle-vermaak, Kamer 7B',
      '      t.a.v. De Jongen Die Boekte',
      '',
      '═══ OFFICIËLE UILENPOST — BEVESTIGING VAN DEELNAME ═══',
      '',
      'Ondergetekende, ⚡ ' + (wie || '[uw tovenaarsnaam]') + ' ⚡,',
      'verklaart hierbij plechtig en onherroepelijk:',
      '',
      '  [X] IK GA MEE naar Hogwarts aan Zee',
      '      El Rosario, Marbella — 29 okt t/m 1 nov 2026',
      '      (HALLOWEEN-EDITIE 🎃)',
      '',
      '  [ ] Ik neem mijn eigen bezem mee',
      '  [ ] Ik kan een Patronus oproepen na drie cervezas',
      '  [X] Ik zweer plechtig dat ik niets goeds in de zin heb',
      '',
      'Getekend met veer en inkt,',
      '',
      '  ' + (wie || '________________________'),
      '',
      'P.S. Deze uil heeft 2.100 km gevlogen. Geef hem een koekje.',
    ].join('\n');

    window.setTimeout(function () {
      window.location.href = 'mailto:' + adres +
        '?subject=' + encodeURIComponent(onderwerp) +
        '&body=' + encodeURIComponent(brief);
    }, reducedMotion() ? 0 : 1400);
  }

  /* ============================================================
     DE LICHTBAK — klik een kasteelfoto en hij opent groot,
     met onderschrift, pijltjes en Esc/tik-om-te-sluiten.
     ============================================================ */
  (function initLichtbak() {
    var items = $$('.villa-gallery .gallery-item');
    if (!items.length) return;

    var huidig = 0;
    var bak = document.createElement('div');
    bak.className = 'lichtbak';
    bak.setAttribute('role', 'dialog');
    bak.setAttribute('aria-label', 'Fotoweergave');
    bak.innerHTML =
      '<button class="lichtbak-sluit" aria-label="Sluiten">✕</button>' +
      '<button class="lichtbak-vorige" aria-label="Vorige foto">‹</button>' +
      '<figure class="lichtbak-figuur"><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lichtbak-volgende" aria-label="Volgende foto">›</button>';
    document.body.appendChild(bak);

    var img = bak.querySelector('img');
    var cap = bak.querySelector('figcaption');

    function toon(i) {
      huidig = (i + items.length) % items.length;
      var bron = items[huidig].querySelector('img');
      var tekst = items[huidig].querySelector('figcaption');
      if (!bron) return;
      img.src = bron.src;
      img.alt = bron.alt || '';
      cap.textContent = tekst ? tekst.textContent : '';
    }

    function open(i) { toon(i); bak.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function sluit() { bak.classList.remove('open'); document.body.style.overflow = ''; }

    items.forEach(function (item, i) {
      item.style.cursor = 'zoom-in';
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('click', function () { open(i); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    bak.querySelector('.lichtbak-sluit').addEventListener('click', sluit);
    bak.querySelector('.lichtbak-vorige').addEventListener('click', function (e) { e.stopPropagation(); toon(huidig - 1); });
    bak.querySelector('.lichtbak-volgende').addEventListener('click', function (e) { e.stopPropagation(); toon(huidig + 1); });
    bak.addEventListener('click', function (e) { if (e.target === bak) sluit(); });
    document.addEventListener('keydown', function (e) {
      if (!bak.classList.contains('open')) return;
      if (e.key === 'Escape') sluit();
      if (e.key === 'ArrowLeft') toon(huidig - 1);
      if (e.key === 'ArrowRight') toon(huidig + 1);
    });
  })();

  /* ============================================================
     GLOBALS — gebruikt door onclick-attributen in de HTML
     ============================================================ */
  window.stuurUil = stuurUil;
  window.switchGame = switchGame;
  window.toggleMagic = toggleMagic;
  window.toggleMusic = toggleMusic;
  window.playJourney = playJourney;
  window.onheil = onheil;
  window.openLetter = openLetter;
})();
