/* ============================================================
   Hogwarts aan Zee 2026 — De O.W.L.-examens
   Examen 4 — 👻 "Spook op Locatie" (Jaap, locatiemanager)
   Zweef als geest-Jaap (mét gitaar) over Nederland en stempel
   filmlocaties GESCOUT voor "Hogwarts: De Serie".
   Enige global: window.jaapGameStart
   ============================================================ */
(function () {
  'use strict';

  // ---------- constanten ----------
  const DURATION = 60;          // seconden per examen
  const BRIEF_TIME = 8;         // seconden per productie-brief
  const STAMP_COOLDOWN = 0.25;  // anti-spam op de stempel
  const MAX_PROPS = 6;
  const MAX_OBS = 2;
  const GHOST_HW = 43;          // halve breedte geest (px)
  const GHOST_HH = 54;          // halve hoogte geest (px)

  // ---------- decor: filmlocaties (inline SVG, geen assets nodig) ----------
  const PROPS = {
    molen: {
      w: 110, h: 130,
      joke: 'Molen — dubbelt als Beukwilg',
      svg: `<svg viewBox="0 0 110 130" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="55" cy="124" rx="42" ry="5" fill="#132018"/>
        <path d="M40 56 L70 56 L64 120 L46 120 Z" fill="#5d4630" stroke="#332414" stroke-width="1.5"/>
        <path d="M40 56 Q55 36 70 56 Z" fill="#7d5c39" stroke="#332414" stroke-width="1.5"/>
        <rect x="50" y="66" width="9" height="11" rx="2" fill="#ffb84d" stroke="#332414"/>
        <rect x="49" y="102" width="11" height="18" rx="4" fill="#3b2f1e" stroke="#201509"/>
        <g class="jaap-wieken">
          <g transform="rotate(45 55 46)"><rect x="53.5" y="10" width="3" height="36" fill="#8a6a42"/><rect x="48" y="12" width="12" height="24" rx="1" fill="rgba(217,194,148,.28)" stroke="#d9c294" stroke-width="1.6"/><path d="M48 18 h12 M48 24 h12 M48 30 h12" stroke="#d9c294" stroke-width="1"/></g>
          <g transform="rotate(135 55 46)"><rect x="53.5" y="10" width="3" height="36" fill="#8a6a42"/><rect x="48" y="12" width="12" height="24" rx="1" fill="rgba(217,194,148,.28)" stroke="#d9c294" stroke-width="1.6"/><path d="M48 18 h12 M48 24 h12 M48 30 h12" stroke="#d9c294" stroke-width="1"/></g>
          <g transform="rotate(225 55 46)"><rect x="53.5" y="10" width="3" height="36" fill="#8a6a42"/><rect x="48" y="12" width="12" height="24" rx="1" fill="rgba(217,194,148,.28)" stroke="#d9c294" stroke-width="1.6"/><path d="M48 18 h12 M48 24 h12 M48 30 h12" stroke="#d9c294" stroke-width="1"/></g>
          <g transform="rotate(315 55 46)"><rect x="53.5" y="10" width="3" height="36" fill="#8a6a42"/><rect x="48" y="12" width="12" height="24" rx="1" fill="rgba(217,194,148,.28)" stroke="#d9c294" stroke-width="1.6"/><path d="M48 18 h12 M48 24 h12 M48 30 h12" stroke="#d9c294" stroke-width="1"/></g>
        </g>
        <circle cx="55" cy="46" r="3.5" fill="#332414"/>
        <path d="M34 121 v-6 M40 121 v-7 M76 121 v-6" stroke="#2c4a2b" stroke-width="1.5"/>
        <circle cx="34" cy="113" r="2.6" fill="#c0392b"/><circle cx="40" cy="112" r="2.6" fill="#f4d03f"/><circle cx="76" cy="113" r="2.6" fill="#c0392b"/>
      </svg>`,
    },
    kasteel: {
      w: 150, h: 120,
      joke: "Kasteel — 'te herkenbaar', zegt de regisseur",
      svg: `<svg viewBox="0 0 150 120" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="75" cy="114" rx="62" ry="5" fill="#132018"/>
        <rect x="38" y="62" width="74" height="50" fill="#6f7b8c" stroke="#3a4350" stroke-width="1.5"/>
        <path d="M40 62 v-8 h8 v8 M56 62 v-8 h8 v8 M72 62 v-8 h8 v8 M88 62 v-8 h8 v8 M104 62 v-8 h6 v8" fill="#6f7b8c" stroke="#3a4350" stroke-width="1.5"/>
        <rect x="24" y="42" width="24" height="70" fill="#7d8798" stroke="#3a4350" stroke-width="1.5"/>
        <rect x="102" y="42" width="24" height="70" fill="#7d8798" stroke="#3a4350" stroke-width="1.5"/>
        <path d="M22 42 L36 16 L50 42 Z" fill="#8e1b1b" stroke="#5a0f0f" stroke-width="1.5"/>
        <path d="M100 42 L114 16 L128 42 Z" fill="#8e1b1b" stroke="#5a0f0f" stroke-width="1.5"/>
        <line x1="36" y1="16" x2="36" y2="6" stroke="#4d3a1f" stroke-width="1.5"/><path d="M36 6 l11 3 -11 3 z" fill="#f4d03f"/>
        <line x1="114" y1="16" x2="114" y2="6" stroke="#4d3a1f" stroke-width="1.5"/><path d="M114 6 l11 3 -11 3 z" fill="#f4d03f"/>
        <path d="M64 112 v-18 a11 11 0 0 1 22 0 v18 z" fill="#241a10" stroke="#14100a" stroke-width="1.5"/>
        <path d="M69 112 v-24 M75 112 v-27 M81 112 v-24" stroke="#3b2f1e" stroke-width="1.4"/>
        <rect x="31" y="58" width="8" height="13" rx="4" fill="#ffb84d"/><rect x="111" y="58" width="8" height="13" rx="4" fill="#ffb84d"/>
        <rect x="31" y="82" width="8" height="13" rx="4" fill="#ffb84d"/><rect x="111" y="82" width="8" height="13" rx="4" fill="#ffb84d"/>
        <rect x="49" y="70" width="7" height="11" rx="3.5" fill="#ffb84d"/><rect x="94" y="70" width="7" height="11" rx="3.5" fill="#ffb84d"/>
      </svg>`,
    },
    gracht: {
      w: 130, h: 120,
      joke: 'Grachtenpand — dubbelt als Grimboudplein 12',
      svg: `<svg viewBox="0 0 130 120" width="100%" height="100%" aria-hidden="true">
        <rect x="0" y="104" width="130" height="16" fill="#1c3a52"/>
        <path d="M6 111 q8 -3 16 0 M40 114 q8 -3 16 0 M84 110 q8 -3 16 0" stroke="rgba(207,216,227,.35)" stroke-width="1.4" fill="none"/>
        <rect x="0" y="98" width="130" height="6" fill="#4a4034"/>
        <rect x="12" y="34" width="32" height="64" fill="#71392e" stroke="#3a1d16" stroke-width="1.5"/>
        <path d="M12 34 h6 v-5 h6 v-5 h8 v5 h6 v5 h6" fill="#71392e" stroke="#3a1d16" stroke-width="1.5"/>
        <rect x="48" y="42" width="34" height="56" fill="#a8763e" stroke="#54390f" stroke-width="1.5"/>
        <path d="M48 42 q6 -14 17 -14 q11 0 17 14 z" fill="#a8763e" stroke="#54390f" stroke-width="1.5"/>
        <line x1="65" y1="28" x2="65" y2="20" stroke="#54390f" stroke-width="2"/><path d="M65 20 q4 2 3 6" stroke="#54390f" stroke-width="1.5" fill="none"/>
        <rect x="86" y="38" width="32" height="60" fill="#445069" stroke="#232a3a" stroke-width="1.5"/>
        <path d="M86 38 h8 v-8 h16 v8 h8" fill="#445069" stroke="#232a3a" stroke-width="1.5"/>
        <g fill="#ffb84d" stroke="#e8e2d0" stroke-width="1">
          <rect x="17" y="44" width="8" height="11"/><rect x="31" y="44" width="8" height="11"/><rect x="17" y="62" width="8" height="11"/><rect x="31" y="62" width="8" height="11"/>
          <rect x="53" y="50" width="8" height="11"/><rect x="69" y="50" width="8" height="11"/><rect x="53" y="68" width="8" height="11"/><rect x="69" y="68" width="8" height="11"/>
          <rect x="91" y="46" width="8" height="11"/><rect x="105" y="46" width="8" height="11"/><rect x="91" y="64" width="8" height="11"/><rect x="105" y="64" width="8" height="11"/>
        </g>
        <rect x="24" y="82" width="9" height="16" fill="#241a10"/><rect x="60" y="82" width="9" height="16" fill="#241a10"/><rect x="97" y="82" width="9" height="16" fill="#241a10"/>
        <g stroke="#14100a" stroke-width="1.4" fill="none">
          <circle cx="44" cy="94" r="4.5"/><circle cx="56" cy="94" r="4.5"/>
          <path d="M44 94 l6 -7 h5 l1 7 M47 87 h6"/>
        </g>
      </svg>`,
    },
    kerk: {
      w: 95, h: 140,
      joke: 'Kerktoren — galmt goed, zegt de geluidsman',
      svg: `<svg viewBox="0 0 95 140" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="48" cy="134" rx="40" ry="5" fill="#132018"/>
        <rect x="32" y="42" width="30" height="90" fill="#6e4a3f" stroke="#3a2118" stroke-width="1.5"/>
        <path d="M30 42 L47 8 L64 42 Z" fill="#3d4451" stroke="#20242c" stroke-width="1.5"/>
        <line x1="47" y1="8" x2="47" y2="1" stroke="#4d3a1f" stroke-width="1.4"/>
        <path d="M47 1 l5 2 -5 2 z" fill="#f4d03f"/>
        <circle cx="47" cy="56" r="8" fill="#f0e2c0" stroke="#3b2f1e" stroke-width="1.4"/>
        <path d="M47 56 l0 -5 M47 56 l4 2" stroke="#3b2f1e" stroke-width="1.4"/>
        <rect x="38" y="72" width="7" height="12" fill="#241a10"/><rect x="50" y="72" width="7" height="12" fill="#241a10"/>
        <path d="M38 75 h7 M38 78 h7 M38 81 h7 M50 75 h7 M50 78 h7 M50 81 h7" stroke="#6e4a3f" stroke-width="1"/>
        <rect x="62" y="94" width="30" height="38" fill="#7a5a4a" stroke="#3a2118" stroke-width="1.5"/>
        <path d="M62 94 L77 82 L92 94 Z" fill="#3d4451" stroke="#20242c" stroke-width="1.5"/>
        <path d="M70 132 v-14 a4 4 0 0 1 8 0 v14 z" fill="#ffb84d"/>
        <path d="M83 118 a3.5 3.5 0 0 1 7 0 v6 h-7 z" fill="#ffb84d"/>
        <path d="M12 132 v-9 a4 4 0 0 1 8 0 v9 z M24 132 v-6 a3 3 0 0 1 6 0 v6 z" fill="#57616f" stroke="#2b323d" stroke-width="1"/>
        <path d="M38 100 a9 9 0 0 1 18 0 v32 h-18 z" fill="#241a10" stroke="#14100a" stroke-width="1.4"/>
      </svg>`,
    },
    koe: {
      w: 150, h: 90,
      joke: 'Koeienwei — de koeien willen wél een eigen trailer',
      svg: `<svg viewBox="0 0 150 90" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="75" cy="84" rx="66" ry="5" fill="#132018"/>
        <g stroke="#4d3a1f" stroke-width="2"><path d="M8 82 v-16 M42 82 v-16 M76 82 v-16 M110 82 v-16 M144 82 v-16"/><path d="M8 70 h136 M8 77 h136" stroke-width="1.6"/></g>
        <g>
          <ellipse cx="45" cy="56" rx="18" ry="10" fill="#f5f2ea" stroke="#22252b" stroke-width="1.3"/>
          <path d="M34 50 q6 -3 10 1 q-2 7 -9 6 q-4 -3 -1 -7 z" fill="#1d1d1d"/>
          <path d="M52 58 q5 -2 7 2 q-1 5 -6 4 q-3 -3 -1 -6 z" fill="#1d1d1d"/>
          <ellipse cx="29" cy="64" rx="6.5" ry="5" fill="#f5f2ea" stroke="#22252b" stroke-width="1.2"/>
          <path d="M24 61 l-3 -3 M34 61 l3 -3" stroke="#22252b" stroke-width="1.2"/>
          <path d="M38 64 v10 M46 64 v10 M52 62 v10 M58 60 v10" stroke="#22252b" stroke-width="1.6"/>
          <path d="M62 54 q6 1 5 7" stroke="#22252b" stroke-width="1.3" fill="none"/>
          <ellipse cx="50" cy="65" rx="3.5" ry="2.5" fill="#e8b4b8"/>
        </g>
        <g>
          <ellipse cx="106" cy="54" rx="17" ry="10" fill="#f5f2ea" stroke="#22252b" stroke-width="1.3"/>
          <path d="M112 48 q7 -2 8 4 q-2 6 -9 4 q-3 -4 1 -8 z" fill="#1d1d1d"/>
          <path d="M96 56 q-5 -1 -5 4 q2 4 6 3 q2 -4 -1 -7 z" fill="#1d1d1d"/>
          <circle cx="106" cy="41" r="7" fill="#f5f2ea" stroke="#22252b" stroke-width="1.2"/>
          <path d="M100 36 l-3 -4 M112 36 l3 -4" stroke="#22252b" stroke-width="1.2"/>
          <circle cx="103.5" cy="40" r="1" fill="#22252b"/><circle cx="108.5" cy="40" r="1" fill="#22252b"/>
          <ellipse cx="106" cy="45" rx="3.4" ry="2.2" fill="#d8a3a3"/>
          <path d="M99 62 v11 M105 63 v10 M112 62 v11 M118 60 v11" stroke="#22252b" stroke-width="1.6"/>
        </g>
        <circle cx="75" cy="74" r="6" fill="#e67e22" stroke="#8f4d10" stroke-width="1.2"/>
        <path d="M72 69 q3 5 0 10 M78 69 q-3 5 0 10" stroke="#8f4d10" stroke-width="1" fill="none"/>
        <path d="M75 68 q0 -4 3 -4" stroke="#2c4a2b" stroke-width="1.6" fill="none"/>
        <path d="M16 80 q2 -6 4 0 M64 80 q2 -6 4 0 M132 80 q2 -6 4 0" stroke="#2c4a2b" stroke-width="1.4" fill="none"/>
      </svg>`,
    },
    station: {
      w: 150, h: 100,
      joke: 'Station — Platform 9¾ doen we in de nabewerking',
      svg: `<svg viewBox="0 0 150 100" width="100%" height="100%" aria-hidden="true">
        <rect x="6" y="86" width="138" height="8" fill="#55504a" stroke="#33302c" stroke-width="1.2"/>
        <path d="M10 86 h12 M32 86 h12 M54 86 h12 M76 86 h12 M98 86 h12 M120 86 h12" stroke="#d9c294" stroke-width="1.6"/>
        <rect x="14" y="54" width="44" height="32" fill="#6e5a44" stroke="#3a2f22" stroke-width="1.5"/>
        <rect x="20" y="62" width="10" height="12" rx="2" fill="#ffb84d" stroke="#3a2f22"/>
        <rect x="40" y="62" width="11" height="24" rx="3" fill="#241a10" stroke="#14100a"/>
        <rect x="10" y="44" width="130" height="7" fill="#3d4451" stroke="#20242c" stroke-width="1.4"/>
        <path d="M10 51 l6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6" fill="none" stroke="#8e1b1b" stroke-width="2"/>
        <rect x="72" y="58" width="52" height="15" rx="7" fill="#1d5fa8" stroke="#f0e2c0" stroke-width="1.6"/>
        <text x="98" y="69" text-anchor="middle" font-size="9" font-family="Montserrat, sans-serif" font-weight="700" letter-spacing="1.5" fill="#f0e2c0">STATION</text>
        <rect x="128" y="51" width="3" height="35" fill="#2c3440"/><rect x="66" y="51" width="3" height="35" fill="#2c3440"/>
        <g><rect x="88" y="78" width="26" height="3" rx="1.5" fill="#6e5a44"/><path d="M91 81 v5 M111 81 v5" stroke="#3a2f22" stroke-width="2"/></g>
        <line x1="138" y1="86" x2="138" y2="58" stroke="#2c3440" stroke-width="2.4"/>
        <circle cx="138" cy="55" r="4" fill="#ffb84d"/><circle cx="138" cy="55" r="8" fill="rgba(255,184,77,.25)"/>
      </svg>`,
    },
    efteling: {
      w: 100, h: 140,
      joke: 'Efteling — te duur, rechten',
      svg: `<svg viewBox="0 0 100 140" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="50" cy="134" rx="38" ry="5" fill="#132018"/>
        <path d="M35 132 L37 50 Q50 40 63 50 L65 132 Z" fill="#d9c9ac" stroke="#7a6a4f" stroke-width="1.5"/>
        <path d="M30 54 C38 18 62 18 70 54 Q50 40 30 54 Z" fill="#3f7f8c" stroke="#24505a" stroke-width="1.5"/>
        <line x1="50" y1="24" x2="50" y2="12" stroke="#24505a" stroke-width="1.6"/>
        <circle cx="50" cy="10" r="3.4" fill="#f4d03f" stroke="#b8930b" stroke-width="1"/>
        <path d="M50 12 l-22 14 M50 12 l22 14" stroke="#8a7a5c" stroke-width="1" fill="none"/>
        <path d="M39 18 l6 2 -5 3 z" fill="#c0392b"/><path d="M62 19 l6 3 -6 2 z" fill="#f4d03f"/>
        <path d="M43 132 v-16 a7 7 0 0 1 7 -6 a7 7 0 0 1 7 6 v16 z" fill="#8e1b1b" stroke="#5a0f0f" stroke-width="1.4"/>
        <circle cx="50" cy="70" r="6" fill="#ffb84d" stroke="#7a6a4f" stroke-width="1.2"/>
        <circle cx="44" cy="92" r="4" fill="#ffb84d" stroke="#7a6a4f" stroke-width="1"/><circle cx="56" cy="92" r="4" fill="#ffb84d" stroke="#7a6a4f" stroke-width="1"/>
        <path d="M20 40 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" fill="#f4d03f" opacity=".9"/>
        <path d="M80 62 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 z" fill="#f4d03f" opacity=".75"/>
      </svg>`,
    },
  };

  const OBS = {
    vogel: {
      w: 54, h: 34,
      svg: `<svg viewBox="0 0 54 34" width="100%" height="100%" aria-hidden="true">
        <path class="jaap-wing-l" d="M26 16 Q12 2 2 8 Q12 12 20 20 Z" fill="#1a2230"/>
        <path class="jaap-wing-r" d="M28 16 Q42 2 52 8 Q42 12 34 20 Z" fill="#1a2230"/>
        <ellipse cx="27" cy="19" rx="9" ry="6" fill="#232c3f"/>
        <circle cx="33" cy="17" r="3.4" fill="#232c3f"/>
        <path d="M36 17 l6 2 -6 2 z" fill="#e6a23c"/>
        <circle cx="34" cy="16" r="1" fill="#f0e2c0"/>
      </svg>`,
    },
    drone: {
      w: 72, h: 40,
      svg: `<svg viewBox="0 0 72 40" width="100%" height="100%" aria-hidden="true">
        <path d="M28 16 L14 9 M44 16 L58 9" stroke="#39424f" stroke-width="2.5"/>
        <ellipse class="jaap-rotor" cx="14" cy="8" rx="11" ry="2.6" fill="#9fb3c8" opacity=".85"/>
        <ellipse class="jaap-rotor" cx="58" cy="8" rx="11" ry="2.6" fill="#9fb3c8" opacity=".85"/>
        <rect x="26" y="14" width="20" height="10" rx="4" fill="#2c3440" stroke="#171d26" stroke-width="1.4"/>
        <circle cx="36" cy="28" r="4.4" fill="#171d26"/><circle cx="36" cy="28" r="1.8" fill="#5dade2"/>
        <circle class="jaap-led" cx="44" cy="16" r="1.8" fill="#ff4d4d"/>
        <path d="M29 24 v5 h6 M43 24 v5 h-6" stroke="#39424f" stroke-width="1.6" fill="none"/>
      </svg>`,
    },
  };

  // ---------- productie-briefs (escaleren in vaagheid) ----------
  const BRIEFS = [
    [ // 0–20s: concreet
      { text: 'kasteel voor scène 12', accepts: ['kasteel'] },
      { text: 'molen voor de Beukwilg-stunt', accepts: ['molen'] },
      { text: 'grachtenpand als Grimboudplein 12', accepts: ['gracht'] },
      { text: 'kerktoren voor de middernachtscène', accepts: ['kerk'] },
      { text: 'koeienwei voor de Patronus-scène', accepts: ['koe'] },
      { text: 'station voor Platform 9¾', accepts: ['station'] },
    ],
    [ // 20–40s: half vaag
      { text: 'iets met wieken', accepts: ['molen'] },
      { text: 'iets waar een draak op past', accepts: ['kasteel', 'kerk', 'efteling'] },
      { text: 'iets met loeiende figuranten', accepts: ['koe'] },
      { text: 'iets met torentjes', accepts: ['kasteel', 'kerk', 'efteling'] },
      { text: 'iets aan het water', accepts: ['gracht', 'molen'] },
    ],
    [ // 40–60s: de regisseur is moe
      { text: 'iets met sfeer', accepts: 'any' },
      { text: '"verras me" — de regisseur', accepts: 'any' },
      { text: 'iets ouds, maar niet té oud', accepts: ['molen', 'kasteel', 'kerk', 'gracht'] },
      { text: 'iets typisch Nederlands', accepts: 'any' },
    ],
  ];

  const SPAWN_WEIGHTS = [
    ['molen', 1], ['kasteel', 1], ['gracht', 1], ['kerk', 1],
    ['koe', 1], ['station', 0.9], ['efteling', 0.25],
  ];

  const RANKS = [
    { min: 300, grade: 'U', word: 'Uitmuntend', title: 'Locatiemanager van het Jaar (Gouden Kalf)' },
    { min: 200, grade: 'B', word: 'Boven Verwachting', title: 'Eerste Assistent Spoken' },
    { min: 120, grade: 'A', word: 'Acceptabel', title: 'Scout Tweede Klas' },
    { min: 60, grade: 'Z', word: 'Zwak', title: 'Figurant (onbetaald)' },
    { min: -Infinity, grade: 'T', word: 'Trol', title: 'Teruggestuurd naar de set van GTST' },
  ];
  const WIN_TEXT = 'De hele serie is gescout, geregeld en getekend. Jaap spookt tevreden een solo.';
  const FAIL_TEXT = 'Zelfs als geest krijg je deze locatie niet rond.';
  const GRADE_PUNTEN = { U: 100, B: 75, A: 50, Z: 25, T: 0 };

  // ---------- state ----------
  const el = {};
  const S = {
    state: 'ready', raf: null, lastTs: null, elapsed: 0, endedAt: 0,
    W: 640, H: 450, x: 200, y: 200, vx: 0, vy: 0,
    held: { up: false, down: false, left: false, right: false },
    drag: null, mouseDown: false,
    props: [], obs: [], nextGap: 90, lastType: null, forceType: null,
    brief: null, briefEnds: 0, briefWait: 0, lastBrief: null, availCheck: 0,
    nextObs: 5, blurUntil: 0, blurCd: 0,
    score: 0, scouted: 0, lastStamp: -9, lastSec: -1,
    hotProp: null, actx: null,
    toastT: null, rockT: null, shakeT: null,
  };

  // ---------- helpers ----------
  const $id = (i) => document.getElementById(i);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function isVisible() { return !!(el.game && el.game.style.display !== 'none'); }

  function isTypingTarget(t) {
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }

  function measure() {
    if (!el.area) return;
    S.W = el.area.clientWidth || 640;
    S.H = el.area.clientHeight || 450;
  }

  function resetInputs() {
    S.held.up = S.held.down = S.held.left = S.held.right = false;
    S.drag = null;
    S.mouseDown = false;
  }

  // ---------- decor spawnen ----------
  function weightedType() {
    let total = 0;
    for (const wEntry of SPAWN_WEIGHTS) total += wEntry[1];
    let roll = Math.random() * total;
    for (const [type, weight] of SPAWN_WEIGHTS) {
      roll -= weight;
      if (roll <= 0) return type;
    }
    return 'molen';
  }

  function spawnProp(atX) {
    if (!el.world || S.props.length >= MAX_PROPS) return;
    let type = S.forceType;
    S.forceType = null;
    if (!type) {
      let guard = 0;
      do { type = weightedType(); } while (type === S.lastType && ++guard < 6);
    }
    S.lastType = type;
    const def = PROPS[type];
    if (!def) return;
    const node = document.createElement('div');
    node.className = 'jaap-prop';
    node.style.width = def.w + 'px';
    node.style.height = def.h + 'px';
    node.innerHTML = def.svg;
    el.world.appendChild(node);
    S.props.push({
      type, el: node, w: def.w, h: def.h,
      x: (typeof atX === 'number') ? atX : S.W + 24,
      stamped: false,
    });
  }

  function moveProps(dt, spd) {
    for (let i = S.props.length - 1; i >= 0; i--) {
      const p = S.props[i];
      p.x -= spd * dt;
      if (p.x + p.w < -30) {
        if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
        if (S.hotProp === p) S.hotProp = null;
        S.props.splice(i, 1);
      } else if (p.el) {
        p.el.style.transform = 'translate3d(' + p.x.toFixed(1) + 'px,0,0)';
      }
    }
  }

  function trySpawn() {
    let rightmost = -Infinity;
    for (const p of S.props) if (p.x + p.w > rightmost) rightmost = p.x + p.w;
    if (rightmost < S.W - S.nextGap) {
      spawnProp();
      S.nextGap = rnd(60, 170);
    }
  }

  // ---------- obstakels (je bent een geest: er dwars doorheen, maar je zicht beslaat) ----------
  function spawnObstacle() {
    if (!el.world || S.obs.length >= MAX_OBS) return;
    const type = Math.random() < 0.55 ? 'vogel' : 'drone';
    const def = OBS[type];
    const node = document.createElement('div');
    node.className = 'jaap-obs';
    node.style.width = def.w + 'px';
    node.style.height = def.h + 'px';
    node.innerHTML = def.svg;
    el.world.appendChild(node);
    S.obs.push({
      type, el: node, w: def.w, h: def.h,
      x: S.W + 50, y: rnd(46, Math.max(90, S.H - 180)),
      seed: Math.random() * 100, spd: rnd(140, 210),
    });
  }

  function updateObstacles(dt, worldSpd) {
    if (S.elapsed > S.nextObs) {
      spawnObstacle();
      S.nextObs = S.elapsed + rnd(5.5, 9);
    }
    for (let i = S.obs.length - 1; i >= 0; i--) {
      const o = S.obs[i];
      o.x -= (o.spd + worldSpd * 0.4) * dt;
      const yy = o.y + Math.sin((o.x + o.seed) * 0.02) * 12;
      if (o.x < -90) {
        if (o.el && o.el.parentNode) o.el.parentNode.removeChild(o.el);
        S.obs.splice(i, 1);
        continue;
      }
      if (o.el) o.el.style.transform = 'translate3d(' + o.x.toFixed(1) + 'px,' + yy.toFixed(1) + 'px,0)';
      if (Math.abs(o.x + o.w / 2 - S.x) < 36 && Math.abs(yy + o.h / 2 - S.y) < 32) ghostBlur(o.type);
    }
  }

  function ghostBlur(type) {
    if (S.elapsed < S.blurCd) return;
    S.blurCd = S.elapsed + 2.5;
    S.blurUntil = S.elapsed + 1;
    if (el.world) el.world.classList.add('jaap-blurred');
    toast(type === 'drone'
      ? '🛸 Een drone zónder vergunning! Je zicht beslaat even…'
      : '🐦 Recht door een duif. Sorry, duif.');
  }

  // ---------- briefs ----------
  function newBrief() {
    const phase = S.elapsed < 20 ? 0 : S.elapsed < 40 ? 1 : 2;
    const pool = BRIEFS[phase];
    let b = pool[0];
    let guard = 0;
    do { b = pick(pool); } while (b === S.lastBrief && ++guard < 8);
    S.lastBrief = b;
    S.brief = b;
    S.briefEnds = S.elapsed + BRIEF_TIME;
    S.availCheck = S.elapsed + 1;
    if (el.briefText) el.briefText.textContent = 'GEZOCHT: ' + b.text;
    if (el.briefBar) el.briefBar.classList.remove('jaap-urgent');
    if (b.accepts !== 'any') {
      const live = S.props.some((p) => !p.stamped && b.accepts.indexOf(p.type) > -1 && p.x + p.w > 90);
      if (!live) S.forceType = pick(b.accepts);
    }
  }

  function updateBrief() {
    if (!S.brief) {
      if (S.elapsed >= S.briefWait) newBrief();
      return;
    }
    if (S.elapsed >= S.briefEnds) {
      toast('⏳ Te laat — de scène is geschrapt.');
      newBrief();
      return;
    }
    if (S.brief.accepts !== 'any' && S.elapsed > S.availCheck) {
      S.availCheck = S.elapsed + 1;
      const acc = S.brief.accepts;
      const live = S.props.some((p) => !p.stamped && acc.indexOf(p.type) > -1 && p.x + p.w > 80);
      if (!live && !S.forceType) S.forceType = pick(acc);
    }
    const frac = clamp((S.briefEnds - S.elapsed) / BRIEF_TIME, 0, 1);
    if (el.briefFill) el.briefFill.style.transform = 'scaleX(' + frac.toFixed(3) + ')';
    if (el.briefBar) el.briefBar.classList.toggle('jaap-urgent', frac < 0.35);
  }

  // ---------- stempelen ----------
  function findPropUnderGhost() {
    let best = null;
    let bestD = Infinity;
    for (const p of S.props) {
      if (S.x < p.x + 4 || S.x > p.x + p.w - 4) continue;
      const top = S.H - 26 - p.h;
      if (S.y < top - 85) continue; // te hoog — je zweeft er ver boven
      const d = Math.abs(S.x - (p.x + p.w / 2));
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  function updateHot() {
    const hot = S.state === 'running' ? findPropUnderGhost() : null;
    if (hot !== S.hotProp) {
      if (S.hotProp && S.hotProp.el) S.hotProp.el.classList.remove('jaap-hot');
      if (hot && !hot.stamped && hot.el) hot.el.classList.add('jaap-hot');
      S.hotProp = hot;
    }
  }

  function doStamp() {
    if (S.state !== 'running') return;
    if (S.elapsed - S.lastStamp < STAMP_COOLDOWN) return;
    S.lastStamp = S.elapsed;
    rock();
    const p = findPropUnderGhost();
    if (!p) { penalty(null); return; }
    if (p.stamped) { toast('👻 Die is al gescout, Jaap.'); return; }
    const ok = !!S.brief && (S.brief.accepts === 'any' || S.brief.accepts.indexOf(p.type) > -1);
    if (ok) success(p); else penalty(p);
  }

  function success(p) {
    p.stamped = true;
    if (p.el) {
      p.el.classList.remove('jaap-hot');
      p.el.classList.add('jaap-gescout');
      addStamp(p.el, 'GESCOUT', false);
    }
    const bonus = clamp(Math.ceil(S.briefEnds - S.elapsed), 0, 8);
    const pts = 20 + bonus;
    S.score += pts;
    S.scouted += 1;
    floatText('+' + pts, S.x, S.y - 46, false);
    toast('✅ ' + PROPS[p.type].joke);
    riff(true);
    updateHud();
    S.brief = null;
    S.briefWait = S.elapsed + 0.55;
    if (el.briefText) el.briefText.textContent = 'GESCOUT! 🎬';
    if (el.briefFill) el.briefFill.style.transform = 'scaleX(1)';
  }

  function penalty(p) {
    S.score -= 10;
    if (p && p.el) addStamp(p.el, 'AFGEKEURD', true);
    floatText('−10', S.x, S.y - 46, true);
    toast(p
      ? '❌ De regisseur belt. Hij is niet blij.'
      : '❌ Je stempelt de lucht. De regisseur belt. Hij is niet blij.');
    shake();
    riff(false);
    updateHud();
  }

  function addStamp(parent, text, bad) {
    const d = document.createElement('div');
    d.className = 'jaap-stempel' + (bad ? ' jaap-stempel-bad' : '');
    d.textContent = text;
    parent.appendChild(d);
    if (bad) setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 950);
  }

  // ---------- feedback ----------
  function floatText(text, x, y, bad) {
    if (!el.floats) return;
    while (el.floats.children.length > 5) el.floats.removeChild(el.floats.firstChild);
    const d = document.createElement('div');
    d.className = 'jaap-float' + (bad ? ' jaap-float-bad' : '');
    d.textContent = text;
    d.style.left = Math.round(x) + 'px';
    d.style.top = Math.round(y) + 'px';
    el.floats.appendChild(d);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 950);
  }

  function toast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.classList.add('jaap-show');
    clearTimeout(S.toastT);
    S.toastT = setTimeout(() => { if (el.toast) el.toast.classList.remove('jaap-show'); }, 1900);
  }

  function rock() {
    if (!el.ghost) return;
    el.ghost.classList.add('jaap-rocking');
    clearTimeout(S.rockT);
    S.rockT = setTimeout(() => { if (el.ghost) el.ghost.classList.remove('jaap-rocking'); }, 620);
  }

  function shake() {
    if (!el.area) return;
    el.area.classList.add('jaap-shake');
    clearTimeout(S.shakeT);
    S.shakeT = setTimeout(() => { if (el.area) el.area.classList.remove('jaap-shake'); }, 360);
  }

  // Klein gitaarriffje via WebAudio (geen assets; pas ná user gesture)
  function riff(good) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!S.actx) S.actx = new AC();
      if (S.actx.state === 'suspended') S.actx.resume();
      const t0 = S.actx.currentTime;
      const notes = good ? [82.41, 123.47, 164.81] : [110, 92.5];
      notes.forEach((f, i) => {
        const o = S.actx.createOscillator();
        const g = S.actx.createGain();
        o.type = 'sawtooth';
        const st = t0 + i * (good ? 0.07 : 0.12);
        o.frequency.setValueAtTime(f, st);
        if (good) o.frequency.exponentialRampToValueAtTime(f * 2, st + 0.18);
        else o.frequency.exponentialRampToValueAtTime(f * 0.5, st + 0.25);
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.05, st + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, st + (good ? 0.25 : 0.32));
        o.connect(g);
        g.connect(S.actx.destination);
        o.start(st);
        o.stop(st + 0.4);
      });
    } catch (e) { /* stilte is ook muziek */ }
  }

  function updateHud() {
    if (el.score) el.score.textContent = String(S.score);
    if (el.scouted) el.scouted.textContent = String(S.scouted);
  }

  // ---------- hoofdloop ----------
  function tick(ts) {
    if (S.state !== 'running') { S.raf = null; return; }
    if (S.lastTs == null) S.lastTs = ts;
    let dt = (ts - S.lastTs) / 1000;
    S.lastTs = ts;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    S.elapsed += dt;

    const spd = 80 + 45 * (S.elapsed / DURATION);

    // geest-fysica: impuls + lage wrijving (spookdrift)
    let ax = 0;
    let ay = 0;
    if (S.held.left) ax -= 1;
    if (S.held.right) ax += 1;
    if (S.held.up) ay -= 1;
    if (S.held.down) ay += 1;
    if (ax && ay) { ax *= 0.7071; ay *= 0.7071; }
    S.vx += ax * 1150 * dt;
    S.vy += ay * 1150 * dt;
    if (S.drag) {
      S.vx += (S.drag.x - S.x) * 9 * dt;
      S.vy += (S.drag.y - S.y) * 9 * dt;
    }
    const fr = Math.exp(-3.4 * dt);
    S.vx *= fr;
    S.vy *= fr;
    const sp = Math.hypot(S.vx, S.vy);
    if (sp > 460) { S.vx *= 460 / sp; S.vy *= 460 / sp; }
    S.x = clamp(S.x + S.vx * dt, 26, S.W - 26);
    S.y = clamp(S.y + S.vy * dt, 34, S.H - 60);
    if (S.x <= 26 || S.x >= S.W - 26) S.vx = 0;
    if (S.y <= 34 || S.y >= S.H - 60) S.vy = 0;
    if (el.ghost) {
      const tilt = clamp(S.vx * 0.028, -14, 14);
      el.ghost.style.transform = 'translate3d(' + (S.x - GHOST_HW).toFixed(1) + 'px,' + (S.y - GHOST_HH).toFixed(1) + 'px,0) rotate(' + tilt.toFixed(1) + 'deg)';
    }

    moveProps(dt, spd);
    trySpawn();
    updateObstacles(dt, spd);
    updateBrief();
    updateHot();

    if (S.blurUntil && S.elapsed > S.blurUntil) {
      S.blurUntil = 0;
      if (el.world) el.world.classList.remove('jaap-blurred');
    }

    const sec = Math.max(0, Math.ceil(DURATION - S.elapsed));
    if (sec !== S.lastSec) {
      S.lastSec = sec;
      if (el.timer) el.timer.textContent = String(sec);
    }
    if (S.elapsed >= DURATION) { endGame(); return; }
    S.raf = requestAnimationFrame(tick);
  }

  // ---------- start / einde ----------
  function start() {
    if (!el.area || !el.world || !el.ghost) return;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; }
    measure();
    el.world.innerHTML = '';
    el.world.classList.remove('jaap-blurred');
    if (el.floats) el.floats.innerHTML = '';
    S.props = [];
    S.obs = [];
    S.hotProp = null;
    S.lastType = null;
    S.forceType = null;
    S.state = 'running';
    S.elapsed = 0;
    S.lastTs = null;
    S.score = 0;
    S.scouted = 0;
    S.lastStamp = -9;
    S.lastSec = -1;
    S.brief = null;
    S.briefWait = 0;
    S.lastBrief = null;
    S.availCheck = 0;
    S.nextObs = rnd(4, 6);
    S.blurUntil = 0;
    S.blurCd = 0;
    S.nextGap = rnd(60, 150);
    S.x = S.W * 0.3;
    S.y = S.H * 0.42;
    S.vx = 0;
    S.vy = 0;
    resetInputs();
    spawnProp(S.W * 0.5);
    spawnProp(S.W * 0.92);
    newBrief();
    updateHud();
    if (el.timer) el.timer.textContent = String(DURATION);
    if (el.overlay) el.overlay.style.display = 'none';
    if (el.result) el.result.classList.remove('jaap-open');
    window.__activeGameRunning = true;
    try { el.area.focus({ preventScroll: true }); } catch (e) { /* oude browser */ }
    S.raf = requestAnimationFrame(tick);
  }

  function startFromUser() {
    if (!isVisible() || S.state === 'running') return;
    if (S.state === 'ended' && performance.now() - S.endedAt < 700) return;
    start();
  }

  function rankFor(score) {
    for (const r of RANKS) if (score >= r.min) return r;
    return RANKS[RANKS.length - 1];
  }

  function endGame() {
    S.state = 'ended';
    S.endedAt = performance.now();
    window.__activeGameRunning = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; }
    resetInputs();
    const r = rankFor(S.score);
    if (el.resultGrade) {
      el.resultGrade.textContent = r.grade;
      el.resultGrade.className = 'jaap-grade jaap-grade-' + r.grade;
    }
    if (el.resultWord) el.resultWord.textContent = r.grade + ' — ' + r.word;
    if (el.resultTitle) el.resultTitle.textContent = r.title;
    if (el.resultText) el.resultText.textContent = (r.grade === 'U' || r.grade === 'B' || r.grade === 'A') ? WIN_TEXT : FAIL_TEXT;
    if (el.finalScore) el.finalScore.textContent = String(S.score);
    if (el.finalScouted) el.finalScouted.textContent = String(S.scouted);
    if (el.result) el.result.classList.add('jaap-open');
    if (el.briefText) el.briefText.textContent = 'Einde opnamedag. 🎬';
    savePunten(r.grade);
  }

  function abortGame() {
    if (S.state !== 'running') return;
    S.state = 'ready';
    window.__activeGameRunning = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; }
    resetInputs();
    if (el.world) el.world.classList.remove('jaap-blurred');
    if (el.result) el.result.classList.remove('jaap-open');
    if (el.overlay) el.overlay.style.display = '';
    if (el.toast) el.toast.classList.remove('jaap-show');
  }

  // ---------- House Points (gedeeld scoreboard, zie §6.0 van de brief) ----------
  function savePunten(grade) {
    try {
      const pts = GRADE_PUNTEN[grade] || 0;
      const raw = localStorage.getItem('zweinstein_punten');
      let data = raw ? JSON.parse(raw) : {};
      if (!data || typeof data !== 'object') data = {};
      if ((data.jaap || 0) < pts) {
        data.jaap = pts;
        localStorage.setItem('zweinstein_punten', JSON.stringify(data));
      }
      document.dispatchEvent(new CustomEvent('punten:update', { detail: { game: 'jaap', points: pts } }));
    } catch (e) { /* privémodus: de kobolden noteren niets */ }
  }

  // ---------- input ----------
  function holdBtn(btn, key) {
    if (!btn) return;
    const down = (e) => { e.preventDefault(); S.held[key] = true; };
    const up = () => { S.held[key] = false; };
    btn.addEventListener('touchstart', down, { passive: false });
    btn.addEventListener('touchend', up);
    btn.addEventListener('touchcancel', up);
    btn.addEventListener('mousedown', down);
    btn.addEventListener('mouseup', up);
    btn.addEventListener('mouseleave', up);
  }

  function setDragClient(cx, cy) {
    if (!el.area) return;
    const r = el.area.getBoundingClientRect();
    S.drag = {
      x: clamp(cx - r.left, 0, S.W),
      y: clamp(cy - r.top, 0, S.H),
    };
  }

  const KEYMAP = {
    arrowup: 'up', w: 'up',
    arrowdown: 'down', s: 'down',
    arrowleft: 'left', a: 'left',
    arrowright: 'right', d: 'right',
  };

  function onKeyDown(e) {
    if (!isVisible() || isTypingTarget(e.target)) return;
    const k = (e.key || '').toLowerCase();
    const isSpace = k === ' ' || e.code === 'Space';
    if (S.state === 'running') {
      if (KEYMAP[k]) {
        S.held[KEYMAP[k]] = true;
        e.preventDefault();
      } else if (isSpace) {
        e.preventDefault();
        if (!e.repeat) doStamp();
      }
    } else if ((isSpace || k === 'enter') && document.activeElement === el.area) {
      /* idle-start alleen met focus op het speelveld (tabindex=0) —
         spatiebalk-scrollen elders mag geen ronde starten */
      e.preventDefault();
      startFromUser();
    }
  }

  function onKeyUp(e) {
    if (!isVisible()) return;
    const k = (e.key || '').toLowerCase();
    if (KEYMAP[k]) S.held[KEYMAP[k]] = false;
  }

  // ---------- init ----------
  function init() {
    el.game = $id('jaapGame');
    if (!el.game) return; // snippet ontbreekt: spook blijft stil
    el.area = $id('jaapArea');
    el.world = $id('jaapWorld');
    el.ghost = $id('jaapGhost');
    el.briefBar = $id('jaapBriefBar');
    el.briefText = $id('jaapBriefText');
    el.briefFill = $id('jaapBriefFill');
    el.score = $id('jaapScore');
    el.scouted = $id('jaapScouted');
    el.timer = $id('jaapTimer');
    el.toast = $id('jaapToast');
    el.floats = $id('jaapFloats');
    el.overlay = $id('jaapOverlay');
    el.result = $id('jaapResult');
    el.resultGrade = $id('jaapResultGrade');
    el.resultWord = $id('jaapResultWord');
    el.resultTitle = $id('jaapResultTitle');
    el.resultText = $id('jaapResultText');
    el.finalScore = $id('jaapFinalScore');
    el.finalScouted = $id('jaapFinalScouted');
    measure();
    window.addEventListener('resize', measure);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    holdBtn($id('jaapUpBtn'), 'up');
    holdBtn($id('jaapDownBtn'), 'down');
    holdBtn($id('jaapLeftBtn'), 'left');
    holdBtn($id('jaapRightBtn'), 'right');

    const stampBtn = $id('jaapStampBtn');
    if (stampBtn) {
      const press = (e) => {
        e.preventDefault();
        if (S.state === 'running') doStamp();
        else startFromUser();
      };
      stampBtn.addEventListener('touchstart', press, { passive: false });
      stampBtn.addEventListener('mousedown', press);
    }

    if (el.area) {
      el.area.addEventListener('click', startFromUser);
      // touch: slepen om te zweven; preventDefault ALLEEN in eigen area en ALLEEN tijdens spel
      el.area.addEventListener('touchstart', (e) => {
        if (S.state !== 'running') return;
        e.preventDefault();
        if (e.touches && e.touches[0]) setDragClient(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: false });
      el.area.addEventListener('touchmove', (e) => {
        if (S.state !== 'running') return;
        e.preventDefault();
        if (e.touches && e.touches[0]) setDragClient(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: false });
      el.area.addEventListener('touchend', () => { S.drag = null; });
      el.area.addEventListener('touchcancel', () => { S.drag = null; });
      // muis: slepen mag ook
      el.area.addEventListener('mousedown', (e) => {
        if (S.state !== 'running') return;
        S.mouseDown = true;
        setDragClient(e.clientX, e.clientY);
      });
      document.addEventListener('mousemove', (e) => {
        if (S.mouseDown && S.state === 'running') setDragClient(e.clientX, e.clientY);
      });
      document.addEventListener('mouseup', () => {
        S.mouseDown = false;
        S.drag = null;
      });
    }

    document.addEventListener('game:switch', (ev) => {
      const key = ev && ev.detail ? ev.detail.key : null;
      if (key === 'jaap') {
        try { if (el.area) el.area.focus({ preventScroll: true }); } catch (e) { /* ok */ }
      } else {
        abortGame();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Enige global — replay-knop en tab-systeem gebruiken deze
  window.jaapGameStart = function () {
    if (!el.game || !isVisible() || S.state === 'running') return;
    start();
  };
})();
