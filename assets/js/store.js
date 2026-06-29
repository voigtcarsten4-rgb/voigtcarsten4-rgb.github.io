/* =====================================================================
   BELL FASTLANE — Shared Store (Demo)
   localStorage als Demo-"Datenbank", Cross-Tab-Sync, Produktkatalog,
   Event-Modi, Bestell-/Status-/Chat-Logik, Favoriten, Personalisierung.
   KEINE echte Zahlung · KEINE echten Kundendaten.
   ===================================================================== */
(function (global) {
  'use strict';

  const KEYS = {
    orders:   'bellfl_orders_v1',
    settings: 'bellfl_settings_v1',
    seq:      'bellfl_seq_v1',
    seeded:   'bellfl_seeded_v1',
    crewHb:   'bellfl_crew_hb',
    fav:      'bellfl_fav_v1',
    name:     'bellfl_name_v1'
  };

  /* ---------- Status flow ---------- */
  const STATUS = ['received', 'prep', 'grill', 'almost', 'ready', 'done'];
  const STATUS_LABEL = {
    received: 'Bestellung eingegangen',
    prep:     'In Vorbereitung',
    grill:    'Auf dem Grill',
    almost:   'Fast fertig',
    ready:    'Abholbereit',
    done:     'Abgeschlossen'
  };
  const STATUS_SHORT = {
    received: 'Eingegangen', prep: 'In Vorbereitung', grill: 'Auf dem Grill',
    almost: 'Fast fertig', ready: 'Abholbereit', done: 'Abgeschlossen'
  };
  const STATUS_SYM = {
    received: 'sym-received', prep: 'sym-prep', grill: 'sym-prep',
    almost: 'sym-prep', ready: 'sym-pickup', done: 'sym-received'
  };
  const STATUS_GUEST_LINE = {
    received: 'Bei der Crew eingegangen',
    prep:     'Zutaten werden vorbereitet',
    grill:    'Frisch auf dem Grill',
    almost:   'Wird angerichtet',
    ready:    'Bereit zur Abholung',
    done:     'Abgeschlossen – en Guete!'
  };
  const STATUS_SYS = {
    prep:   '👨‍🍳 Deine Bestellung wird zubereitet.',
    grill:  '🔥 Jetzt frisch auf dem Grill!',
    almost: '⏳ Fast fertig – gleich abholbereit.',
    ready:  '✅ Abholbereit! Komm zum Stand und zeig deine Abholnummer.'
  };

  /* ---------- Product artwork (SVG fallback) ---------- */
  function art(id) {
    const bg = (c1, c2) => `<defs><radialGradient id="g_${id}" cx="50%" cy="30%" r="80%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></radialGradient></defs><rect width="96" height="96" rx="14" fill="url(#g_${id})"/>`;
    const A = {
      kloepfer: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">${bg('#FFE7D2','#FFD0A8')}<rect x="18" y="40" width="60" height="15" rx="7.5" fill="#B8542A"/></svg>`,
      joggeli: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">${bg('#FFE7D2','#FFCB9E')}<rect x="14" y="40" width="68" height="13" rx="6.5" fill="#DA8551"/></svg>`,
      kalbsbratwurst: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">${bg('#FFEEDD','#FFD9B3')}<rect x="16" y="38" width="64" height="19" rx="9.5" fill="#EAD3A9"/></svg>`,
      schnitzelbrot: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">${bg('#FFEAD6','#FFCFA6')}<ellipse cx="48" cy="50" rx="28" ry="12" fill="#E7A85F"/></svg>`,
      sandwich: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">${bg('#FFF0DC','#FFD9AE')}<rect x="26" y="44" width="44" height="12" fill="#C7553B"/></svg>`,
      wasser: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">${bg('#DCF1FB','#B6E0F5')}<rect x="38" y="30" width="20" height="44" rx="8" fill="#7FC3E6"/></svg>`,
      cola: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">${bg('#FBE0DE','#F4C0BC')}<path d="M34 36 h28 l-4 38 H38Z" fill="#6B3A2E"/></svg>`,
      feldi: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">${bg('#FFF3D6','#FBE0A6')}<rect x="36" y="34" width="24" height="44" rx="6" fill="#F4B731"/></svg>`,
      feldi_af: `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">${bg('#EAF6E9','#C9E9C6')}<rect x="36" y="34" width="24" height="44" rx="6" fill="#E9C24A"/></svg>`
    };
    return A[id] || `<svg viewBox="0 0 96 96">${bg('#EEE','#DDD')}</svg>`;
  }

  /* ---------- Product catalog (CHF, inkl. MwSt) ---------- */
  const PRODUCTS = [
    { id: 'kloepfer',       name: 'Klöpfer',                  cat: 'grill', price: 6.50, desc: 'Schweizer Cervelat-Klassiker, frisch vom Grill – mit knusprigem Bürli.', story: 'Der Klassiker vom Grill – herzhaft, heiss und perfekt für die Matchpause.', tags: ['Klassiker'] },
    { id: 'joggeli',        name: 'Joggeli-Wurst',            cat: 'grill', price: 6.00, desc: 'Feine Brüh-Spezialität, knackig grilliert.', story: 'Der Event-Favorit: kräftig, unkompliziert und frisch vom Grill.', tags: [] },
    { id: 'kalbsbratwurst', name: 'Kalbsbratwurst',           cat: 'grill', price: 7.50, desc: 'St. Galler Art aus zartem Schweizer Kalbfleisch – mit Bürli.', story: 'Fein, mild und hochwertig – frisch grilliert und direkt auf die Hand.', tags: ['Beliebt'] },
    { id: 'schnitzelbrot',  name: 'Schnitzelbrot',            cat: 'snack', price: 9.50, desc: 'Knuspriges Schnitzel im frischen Brot, mit Salat und Sauce.', story: 'Knusprig, sättigend und ideal für grosse Eventmomente.', tags: ['hot'] },
    { id: 'sandwich',       name: 'Sandwich',                 cat: 'snack', price: 7.00, desc: 'Frisches Sandwich mit feiner Bell Charcuterie und Salat.', story: 'Frisch belegt mit feiner Bell-Charcuterie – der schnelle Genuss zwischendurch.', tags: [] },
    { id: 'wasser',         name: 'Wasser',                   cat: 'drink', price: 3.50, desc: 'Schweizer Mineralwasser – mit oder ohne Kohlensäure.', story: 'Eiskalt und erfrischend – die Pause zwischendurch.', tags: ['cold'] },
    { id: 'cola',           name: 'Cola / Softdrink',         cat: 'drink', price: 4.00, desc: 'Eisgekühlte Erfrischung in verschiedenen Sorten.', story: 'Eisgekühlte Erfrischung – der Klassiker zum Grillgenuss.', tags: ['cold'] },
    { id: 'feldi',          name: 'Feldschlösschen Bier',     cat: 'beer',  price: 5.50, desc: 'Original, eisgekühlt gezapft. 4.8 % vol.', story: 'Eiskalt gezapft – das Original zum Match.', tags: ['18+'] },
    { id: 'feldi_af',       name: 'Feldschlösschen alkoholfrei', cat: 'beer', price: 5.00, desc: 'Voller Biergenuss, alkoholfrei. Auch für die Fahrer:innen.', story: 'Voller Biergenuss, alkoholfrei – auch für die Fahrer:innen.', tags: ['0.0'] }
  ];

  const IMG_BASE = 'https://cdn.leonardo.ai/users/ca700add-e52f-4b37-abf9-34f43a292e67/generations/';
  const IMAGES = {
    kloepfer:       IMG_BASE + '806186d0-914a-4675-953a-78daa8d316f2/segments/1:1:1/Phoenix_09_Premium_advertising_food_photography_a_juicy_grille_0.jpg',
    joggeli:        IMG_BASE + 'cd7f1db5-2d01-4a8c-88f1-bcc15c969a2e/segments/1:1:1/Phoenix_09_two_grilled_Swiss_Cervelat_Joggeli_sausages_with_gr_0.jpg',
    kalbsbratwurst: IMG_BASE + '8e337105-810a-406c-9b49-2e037d8c982e/segments/1:1:1/Phoenix_09_grilled_Swiss_veal_bratwurst_St_Galler_Kalbsbratwur_0.jpg',
    schnitzelbrot:  IMG_BASE + '2be59ca0-b6d4-466d-839c-cc32e555a2b3/segments/1:1:1/Phoenix_09_crispy_breaded_schnitzel_in_a_fresh_crusty_bread_ro_0.jpg',
    sandwich:       IMG_BASE + '0b3f11f5-71ce-4228-b1a5-af12592c71cd/segments/1:1:1/Phoenix_09_fresh_gourmet_sandwich_with_Swiss_charcuterie_lettu_0.jpg',
    wasser:         IMG_BASE + '5ddaeba9-a50f-4c54-8bc0-53d705038d04/segments/1:1:1/Phoenix_09_a_glass_bottle_of_Swiss_sparkling_mineral_water_wit_0.jpg',
    cola:           IMG_BASE + 'e86e78a2-f8a7-4390-b7c5-0c788f5ee1d8/segments/1:1:1/Phoenix_09_a_tall_cup_of_icecold_cola_with_ice_cubes_and_conde_0.jpg',
    feldi:          IMG_BASE + '9a647b8b-2b0e-478c-a19a-5f2b6b9f6678/segments/1:1:1/Phoenix_09_a_frosted_glass_of_golden_Swiss_lager_beer_with_thi_0.jpg',
    feldi_af:       IMG_BASE + 'f0a78089-827d-4290-b2ed-5dc0df02b9d5/segments/1:1:1/Phoenix_09_a_frosted_glass_of_golden_non_alcoholic_beer_with_f_0.jpg'
  };
  const HERO = IMG_BASE + '38be89c7-356b-473e-8156-6149c8401eeb/segments/1:1:1/Phoenix_09_cinematic_wide_shot_of_a_premium_Swiss_BBQ_event_gr_0.jpg';
  PRODUCTS.forEach(p => { p.art = art(p.id); p.img = IMAGES[p.id] || ''; });

  const CATEGORIES = [
    { id: 'grill', name: 'Vom Grill',        icon: '🔥' },
    { id: 'snack', name: 'Snacks & Brote',   icon: '🥪' },
    { id: 'drink', name: 'Alkoholfrei',      icon: '🥤' },
    { id: 'beer',  name: 'Bier',             icon: '🍺' }
  ];

  /* ---------- Event modes ---------- */
  const EVENTS = {
    football: {
      id: 'football', name: 'Fussballmatch', venue: 'St. Jakob-Park', city: 'Basel',
      tagline: 'Heimspiel-Genuss – ohne den Anpfiff zu verpassen.',
      stands: [
        { id: 'st-n', name: 'Bell Grillstand · Sektor B', meta: 'Nordtribüne, Gate 4' },
        { id: 'st-s', name: 'Bell Brutzelwagen · Fanzone', meta: 'Süd-Esplanade' }
      ],
      products: ['kloepfer', 'joggeli', 'kalbsbratwurst', 'cola', 'wasser', 'feldi', 'feldi_af']
    },
    stadium: {
      id: 'stadium', name: 'Stadionverkauf', venue: 'Stadion', city: 'Schweiz',
      tagline: 'Schnell versorgt – mehr vom Spiel.',
      stands: [
        { id: 'st-o', name: 'Bell Grillstand · Oberrang', meta: 'Ebene 3, Block O' },
        { id: 'st-u', name: 'Bell Grillstand · Unterrang', meta: 'Ebene 1, Block C' }
      ],
      products: ['kloepfer', 'joggeli', 'kalbsbratwurst', 'cola', 'wasser', 'feldi', 'feldi_af']
    },
    jodlerfest: {
      id: 'jodlerfest', name: 'Jodlerfest', venue: 'Festgelände', city: 'Innerschweiz',
      tagline: 'Tradition trifft Genuss – e güeti Gabe vom Bell-Stand.',
      stands: [
        { id: 'st-fz', name: 'Bell Festzelt-Stand', meta: 'Beim Hauptzelt' },
        { id: 'st-pl', name: 'Bell Brutzelwagen · Festplatz', meta: 'Beim Festplatz-Eingang' }
      ],
      products: ['sandwich', 'schnitzelbrot', 'kloepfer', 'wasser', 'cola', 'feldi_af', 'feldi']
    },
    corporate: {
      id: 'corporate', name: 'Firmenevent', venue: 'Firmenareal', city: 'Zürich',
      tagline: 'Mitarbeiter-Catering vom Feinsten – schnell und unkompliziert.',
      stands: [
        { id: 'st-hof', name: 'Bell Eventteam · Innenhof', meta: 'Beim Haupteingang' },
        { id: 'st-ter', name: 'Bell Grillstation · Terrasse', meta: 'Dachterrasse' }
      ],
      products: ['kalbsbratwurst', 'sandwich', 'cola', 'wasser']
    },
    festival: {
      id: 'festival', name: 'Festival / Open Air', venue: 'Open-Air-Gelände', city: 'Schweiz',
      tagline: 'Festival-Hunger? Scannen, bestellen, weiterfeiern.',
      stands: [
        { id: 'st-main', name: 'Bell Foodtruck · Mainstage', meta: 'Links der Hauptbühne' },
        { id: 'st-camp', name: 'Bell Grillwagen · Campingzone', meta: 'Beim Camping-Eingang' }
      ],
      products: ['kloepfer', 'joggeli', 'kalbsbratwurst', 'schnitzelbrot', 'sandwich', 'wasser', 'cola', 'feldi', 'feldi_af']
    }
  };

  /* ---------- Sync layer ---------- */
  const listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(fn => { try { fn(); } catch (e) {} }); }

  let bc = null;
  try { bc = new BroadcastChannel('bellfl'); bc.onmessage = function () { emit(); }; } catch (e) { bc = null; }

  function read(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    try { localStorage.setItem('bellfl_ping', String(Date.now())); } catch (e) {}
    try { if (bc) bc.postMessage(1); } catch (e) {}
    emit();
  }
  global.addEventListener('storage', (e) => {
    if (e.key && (e.key.indexOf('bellfl_') === 0)) emit();
  });

  /* ---------- Crew-Heartbeat ---------- */
  function setCrewActive() { try { localStorage.setItem(KEYS.crewHb, String(Date.now())); } catch (e) {} }
  function isCrewActive() {
    try { return (Date.now() - (parseInt(localStorage.getItem(KEYS.crewHb), 10) || 0)) < 15000; }
    catch (e) { return false; }
  }

  /* ---------- Favoriten + Name (lokal, datensparsam) ---------- */
  function getFav() { return read(KEYS.fav, null); }
  function setFav(fav) { write(KEYS.fav, fav); }
  function clearFav() { try { localStorage.removeItem(KEYS.fav); } catch (e) {} emit(); }
  function getName() { try { return localStorage.getItem(KEYS.name) || ''; } catch (e) { return ''; } }
  function setName(n) { try { if (n) localStorage.setItem(KEYS.name, n); else localStorage.removeItem(KEYS.name); } catch (e) {} }

  /* ---------- Settings ---------- */
  function getSettings() {
    return read(KEYS.settings, { eventId: 'football', standId: null, mode: 'payment' });
  }
  function setSettings(patch) {
    const s = Object.assign(getSettings(), patch);
    write(KEYS.settings, s);
    return s;
  }
  function currentEvent() { return EVENTS[getSettings().eventId] || EVENTS.football; }
  function eventProducts(evId) {
    const ev = EVENTS[evId || getSettings().eventId] || EVENTS.football;
    return ev.products.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  }

  /* ---------- Orders ---------- */
  function getOrders() { return read(KEYS.orders, []); }
  function saveOrders(list) { write(KEYS.orders, list); }
  function getOrder(id) { return getOrders().find(o => o.id === id) || null; }

  function nextPickup() {
    let n = read(KEYS.seq, 104);
    write(KEYS.seq, n + 1);
    return 'B-' + n;
  }

  function uid() { return 'o_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function createOrder(data) {
    const now = Date.now();
    const order = {
      id: uid(),
      pickup: nextPickup(),
      eventId: data.eventId,
      standId: data.standId,
      standName: data.standName,
      items: data.items,
      subtotal: data.subtotal,
      total: data.total,
      payMethod: data.payMethod,
      payLabel: data.payLabel,
      guestName: data.guestName || '',
      pickupWhen: data.pickupWhen || 'sofort',
      status: 'received',
      statusTimes: { received: now },
      createdAt: now,
      messages: [],
      unreadStaff: 0,
      unreadGuest: 0,
      source: data.source || 'guest'
    };
    const list = getOrders();
    list.push(order);
    saveOrders(list);
    return order;
  }

  function setStatus(id, status) {
    const list = getOrders();
    const o = list.find(x => x.id === id);
    if (!o) return null;
    const oldI = STATUS.indexOf(o.status), newI = STATUS.indexOf(status);
    o.status = status;
    o.statusTimes = o.statusTimes || {};
    if (!o.statusTimes[status]) o.statusTimes[status] = Date.now();
    if (newI > oldI && STATUS_SYS[status]) {
      o.messages = o.messages || [];
      o.messages.push({ from: 'system', text: STATUS_SYS[status], ts: Date.now(), read: true });
      o.unreadGuest = (o.unreadGuest || 0) + 1;
    }
    saveOrders(list);
    return o;
  }
  function advanceStatus(id) {
    const o = getOrder(id);
    if (!o) return null;
    const i = STATUS.indexOf(o.status);
    if (i < STATUS.length - 1) return setStatus(id, STATUS[i + 1]);
    return o;
  }

  function addMessage(id, from, text) {
    const list = getOrders();
    const o = list.find(x => x.id === id);
    if (!o) return null;
    o.messages = o.messages || [];
    o.messages.push({ from, text, ts: Date.now(), read: false });
    if (from === 'guest') o.unreadStaff = (o.unreadStaff || 0) + 1;
    else o.unreadGuest = (o.unreadGuest || 0) + 1;
    saveOrders(list);
    return o;
  }
  function markRead(id, side) {
    const list = getOrders();
    const o = list.find(x => x.id === id);
    if (!o) return;
    if (side === 'staff') o.unreadStaff = 0; else o.unreadGuest = 0;
    (o.messages || []).forEach(m => {
      if (side === 'staff' && m.from === 'guest') m.read = true;
      if (side === 'guest' && m.from !== 'guest') m.read = true;
    });
    saveOrders(list);
  }

  function resetDemo() {
    [KEYS.orders, KEYS.seq, KEYS.seeded].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
    seed(true);
    write(KEYS.orders, getOrders());
  }

  /* ---------- Seed demo orders ---------- */
  function seed(force) {
    if (!force && read(KEYS.seeded, false)) return;
    const ev = currentEvent();
    const sName = (ev.stands[0] || {}).name || 'Bell Grillstand';
    const P = id => PRODUCTS.find(p => p.id === id);
    const mk = (pickup, items, status, mins, pay, payLabel, msgs, guestName) => {
      const created = Date.now() - mins * 60000;
      const li = items.map(([id, q]) => { const p = P(id); return { id, name: p.name, price: p.price, qty: q }; });
      const sub = li.reduce((s, x) => s + x.price * x.qty, 0);
      const times = {}; let acc = created;
      const idx = STATUS.indexOf(status);
      for (let i = 0; i <= idx; i++) { times[STATUS[i]] = acc; acc += Math.round(mins * 60000 / (idx + 1.5)); }
      return {
        id: uid(), pickup, eventId: ev.id, standId: (ev.stands[0] || {}).id, standName: sName,
        items: li, subtotal: sub, total: sub, payMethod: pay, payLabel, guestName: guestName || '', pickupWhen: 'sofort',
        status, statusTimes: times, createdAt: created,
        messages: msgs || [], unreadStaff: (msgs || []).filter(m => m.from === 'guest' && !m.read).length, unreadGuest: 0,
        source: 'demo'
      };
    };
    const orders = [
      mk('B-101', [['kloepfer', 2], ['feldi', 1]], 'grill', 7, 'twint', 'TWINT', [], 'Sandra'),
      mk('B-102', [['kalbsbratwurst', 1], ['cola', 1]], 'ready', 11, 'applepay', 'Apple Pay', [], ''),
      mk('B-103', [['schnitzelbrot', 1], ['feldi_af', 1]], 'received', 2, 'card', 'Kreditkarte',
         [{ from: 'guest', text: 'Bitte ohne Zwiebeln 🙏', ts: Date.now() - 90000, read: false }], 'Marco')
    ];
    write(KEYS.seq, 104);
    write(KEYS.orders, orders);
    write(KEYS.seeded, true);
  }

  /* ---------- Formatting utils ---------- */
  function chf(n) { return 'CHF ' + Number(n).toFixed(2); }
  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'gerade eben';
    const m = Math.floor(s / 60);
    if (m < 60) return 'vor ' + m + ' Min';
    const h = Math.floor(m / 60);
    return 'vor ' + h + ' Std';
  }
  function clock(ts) {
    const d = new Date(ts);
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function minsAgo(ts) { return Math.floor((Date.now() - ts) / 60000); }

  /* ---------- Quick messages ---------- */
  const QUICK_MSGS = [
    'Ohne Senf', 'Ohne Brot', 'Bitte 5 Minuten später', 'Wo ist die Ausgabe?',
    'Ich bin gleich da', 'Kann ich noch etwas ergänzen?'
  ];

  /* ---------- Expose ---------- */
  global.BELL = {
    KEYS, STATUS, STATUS_LABEL, STATUS_SHORT, STATUS_SYM, STATUS_GUEST_LINE,
    PRODUCTS, CATEGORIES, EVENTS, QUICK_MSGS,
    art, IMAGES, HERO,
    getSettings, setSettings, currentEvent, eventProducts,
    getOrders, getOrder, createOrder, setStatus, advanceStatus,
    addMessage, markRead, resetDemo, seed,
    setCrewActive, isCrewActive,
    getFav, setFav, clearFav, getName, setName,
    onChange, chf, timeAgo, clock, minsAgo
  };

  seed(false);

})(window);
