/* =====================================================================
   BELL FASTLANE — Guest App
   ===================================================================== */
(function () {
  'use strict';
  const { el, els, esc, icon, payLogo, toast, buzz } = UI;

  let cart = {};
  let payMethod = null;
  let activeOrderId = null;
  let currentView = 'start';
  let backTarget = 'start';
  let persoName = '';
  let persoWhen = 'sofort';
  const lastIdxById = {};

  const MINE = 'bellfl_mine_v1';
  const getMine = () => { try { return JSON.parse(localStorage.getItem(MINE)) || []; } catch (e) { return []; } };
  const addMine = (id) => { const m = getMine(); if (m.indexOf(id) < 0) { m.push(id); localStorage.setItem(MINE, JSON.stringify(m)); } };

  const PAY_LABEL = { twint: 'TWINT', applepay: 'Apple Pay', googlepay: 'Google Pay', card: 'Kreditkarte', cash: 'Bar am Stand', bon: 'Bell Bon' };
  const SYM = { received: 'sym-received', prep: 'sym-prep', grill: 'sym-prep', almost: 'sym-prep', ready: 'sym-pickup', done: 'sym-received' };
  const SH = { received: 'sh-received', prep: 'sh-prep', grill: 'sh-grill', almost: 'sh-almost', ready: 'sh-ready', done: 'sh-done' };

  const isBonMode = () => BELL.getSettings().mode === 'bon';
  const sig = items => (items || []).map(i => i.id + ':' + i.qty).sort().join(',');

  function products() { return BELL.eventProducts(); }
  function prod(id) { return BELL.PRODUCTS.find(p => p.id === id); }
  function cartCount() { return Object.values(cart).reduce((a, b) => a + b, 0); }
  function cartTotal() { return Object.keys(cart).reduce((s, id) => s + prod(id).price * cart[id], 0); }

  function tagHtml(t) {
    if (t === 'hot') return '<span class="tag hot">Warm</span>';
    if (t === 'cold') return '<span class="tag cold">Kalt</span>';
    if (t === '18+') return '<span class="tag">🔞 18+</span>';
    if (t === '0.0') return '<span class="tag veg">0.0 %</span>';
    return '<span class="tag">' + esc(t) + '</span>';
  }

  function playGlow() {
    const g = el('#fx-glow'); if (!g) return;
    if (window.gsap) {
      window.gsap.killTweensOf(g);
      window.gsap.fromTo(g, { opacity: 0 }, { opacity: 1, duration: .16, ease: 'power2.out',
        onComplete: () => window.gsap.to(g, { opacity: 0, duration: .5, ease: 'power2.in' }) });
    }
  }
  function show(view) {
    currentView = view;
    els('.view').forEach(v => v.classList.add('hide'));
    const node = el('#view-' + view);
    if (node) {
      node.classList.remove('hide');
      if (window.gsap) window.gsap.fromTo(node, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, ease: 'power3.out' });
      else { node.classList.add('anim-up'); setTimeout(() => node.classList.remove('anim-up'), 600); }
    }
    playGlow();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    updateCartBar();
    const ev = BELL.currentEvent();
    el('#hdr-context').textContent = (view === 'start') ? 'Gast' : ev.name;
  }

  function renderStart() {
    const ev = BELL.currentEvent();
    const s = BELL.getSettings();
    const stand = (ev.stands.find(x => x.id === s.standId)) || ev.stands[0];
    el('#hero-event').textContent = ev.name;
    el('#hero-stand').textContent = '📍 ' + stand.name + ' · ' + ev.venue + ', ' + ev.city;
    el('#hero-kicker').innerHTML = '🔥 Bell BBQ &amp; Event';
    const hb = el('#hero-bg'); if (hb && BELL.HERO) hb.style.backgroundImage = 'url("' + BELL.HERO + '")';
    renderWelcomeBack();
  }

  function renderWelcomeBack() {
    const wb = el('#welcome-back'); if (!wb) return;
    const fav = BELL.getFav();
    const mine = getMine().map(id => BELL.getOrder(id)).filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
    const last = mine[0];
    const src = fav ? { fav: true, items: fav.items } : (last ? { fav: false, items: last.items } : null);
    const nm = BELL.getName();
    if (!src || !src.items || !src.items.length) { wb.innerHTML = ''; return; }
    const names = src.items.map(i => i.qty + '× ' + i.name).join(', ');
    wb.innerHTML = `
      <div class="container">
        <div class="welcome">
          <div class="wc-ic">${src.fav ? '★' : '🔥'}</div>
          <div class="wc-tx">
            <b>${src.fav ? (nm ? esc(nm) + 's Favorit' : 'Dein Matchpause-Favorit') : 'Willkommen zurück' + (nm ? ', ' + esc(nm) : '')}</b>
            <span>${esc(names)}</span>
          </div>
          <button class="btn btn-primary btn-sm" data-act="order-fav">Nochmal</button>
        </div>
      </div>`;
  }

  function renderStands() {
    const ev = BELL.currentEvent();
    el('#stand-title').textContent = 'Bell-Stand wählen';
    el('#stand-sub').textContent = ev.name + ' · ' + ev.venue + ', ' + ev.city;
    const back = el('#view-stand [data-nav="start"]');
    if (back) back.innerHTML = icon('arrowLeft') + 'Zurück';
    el('#stand-list').innerHTML = ev.stands.map(st => `
      <button class="card pad row between" data-act="pick-stand" data-id="${st.id}" style="width:100%;text-align:left;gap:var(--s-4)">
        <span class="row" style="gap:var(--s-4)">
          <span style="width:46px;height:46px;border-radius:14px;background:rgba(226,0,26,.1);color:var(--bell-red);display:grid;place-items:center;flex:none">${icon('pin')}</span>
          <span>
            <span style="display:block;font-weight:800;font-size:var(--fs-md)">${esc(st.name)}</span>
            <span class="t-muted" style="font-size:var(--fs-sm)">${esc(st.meta)}</span>
          </span>
        </span>
        <span style="color:var(--ink-3)">${icon('chevR')}</span>
      </button>`).join('');
  }

  function buyCtrl(id) {
    const q = cart[id] || 0;
    if (q <= 0) return `<button class="btn-add" data-act="add" data-id="${id}" aria-label="Hinzufügen">${icon('plus')}</button>`;
    return `<div class="stepper">
        <button data-act="dec" data-id="${id}" aria-label="Weniger">${icon('minus')}</button>
        <span class="q">${q}</span>
        <button data-act="inc" data-id="${id}" aria-label="Mehr">${icon('plus')}</button>
      </div>`;
  }

  function renderMenu() {
    const ev = BELL.currentEvent();
    const s = BELL.getSettings();
    const stand = (ev.stands.find(x => x.id === s.standId)) || ev.stands[0];
    el('#menu-event').textContent = ev.name;
    el('#menu-stand').textContent = stand.name;

    const list = products();
    const cats = BELL.CATEGORIES.filter(c => list.some(p => p.cat === c.id));

    el('#cat-scroll').innerHTML = cats.map((c, i) =>
      `<button class="chip ${i === 0 ? 'active' : ''}" data-act="cat" data-cat="${c.id}">${c.icon} ${esc(c.name)}</button>`
    ).join('');

    el('#menu').innerHTML = cats.map(c => `
      <h3 class="menu-cat-title" id="cat-${c.id}">${c.icon} ${esc(c.name)}</h3>
      <div class="menu-grid">
        ${list.filter(p => p.cat === c.id).map(p => `
          <div class="product" data-id="${p.id}">
            <div class="thumb">${p.img ? `<img src="${p.img}" alt="${esc(p.name)} – frisch vom Bell-Grill" loading="lazy">` : p.art}</div>
            <div class="info">
              <h3>${esc(p.name)}</h3>
              <div class="desc">${esc(p.story || p.desc)}</div>
              <div class="tags">${(p.tags || []).map(tagHtml).join('')}</div>
            </div>
            <div class="buy">
              <span class="price">${BELL.chf(p.price)}</span>
              <span class="buy-ctrl">${buyCtrl(p.id)}</span>
            </div>
          </div>`).join('')}
      </div>`).join('') + `
      <button class="bw-entry" data-act="bell-world">🔥 <span><b>Bell-Welt entdecken</b> · Qualität, Herkunft & Grillmomente</span> <span class="bw-arrow">↗</span></button>`;

    setupSpy(cats);
    updateCartBar();
  }

  let spyObserver = null;
  function setupSpy(cats) {
    if (typeof IntersectionObserver === 'undefined') return;
    if (spyObserver) spyObserver.disconnect();
    spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const id = en.target.id.replace('cat-', '');
          els('#cat-scroll .chip').forEach(ch => ch.classList.toggle('active', ch.dataset.cat === id));
        }
      });
    }, { rootMargin: '-120px 0px -70% 0px' });
    cats.forEach(c => { const n = el('#cat-' + c.id); if (n) spyObserver.observe(n); });
  }

  function refreshProductRow(id) {
    const row = el('.product[data-id="' + id + '"] .buy-ctrl');
    if (row) row.innerHTML = buyCtrl(id);
  }

  function updateCartBar() {
    const n = cartCount();
    el('#cart-count').textContent = n;
    el('#cart-sum').textContent = BELL.chf(cartTotal());
    const bar = el('#cartbar');
    bar.classList.toggle('show', n > 0 && currentView === 'menu');
  }

  function renderCart() {
    const ids = Object.keys(cart).filter(id => cart[id] > 0);
    const body = el('#cart-body'), foot = el('#cart-foot');
    if (!ids.length) {
      body.innerHTML = `<div class="center t-muted" style="padding:var(--s-7) 0">
        <div style="font-size:42px">🔥</div><p style="margin-top:8px">Noch nichts auf dem Grill – wähle deinen Grillmoment.</p></div>`;
      foot.innerHTML = `<button class="btn btn-ghost btn-block" data-close-sheet>Weiter auswählen</button>`;
      return;
    }
    body.innerHTML = ids.map(id => {
      const p = prod(id), q = cart[id];
      return `<div class="cart-line" data-id="${id}">
        <div class="thumb">${p.img ? `<img src="${p.img}" alt="${esc(p.name)}" loading="lazy">` : p.art}</div>
        <div>
          <div class="nm">${esc(p.name)}</div>
          <div class="cl-story">${esc(p.story || p.desc)}</div>
          <button class="rm" data-act="remove" data-id="${id}">Entfernen</button>
        </div>
        <div style="text-align:right">
          <div class="lp">${BELL.chf(p.price * q)}</div>
          <div class="stepper" style="margin-top:8px">
            <button data-act="dec" data-id="${id}">${icon('minus')}</button>
            <span class="q">${q}</span>
            <button data-act="inc" data-id="${id}">${icon('plus')}</button>
          </div>
        </div>
      </div>`;
    }).join('') + `
      <div class="totals">
        <div class="ln"><span>Zwischensumme</span><span class="num">${BELL.chf(cartTotal())}</span></div>
        <div class="ln"><span>Service</span><span>Inklusive</span></div>
        <div class="ln grand"><span>Total</span><span class="num">${BELL.chf(cartTotal())}</span></div>
      </div>`;

    const ahead = BELL.getOrders().filter(o => o.status !== 'done' && o.status !== 'ready').length;
    const saved = Math.max(3, cartCount() * 2 + ahead * 2);
    const bon = isBonMode();
    foot.innerHTML = `
      <div class="fl-advantage">
        <span class="fl-ic">⚡</span>
        <div><b>FastLane-Vorteil</b><span>Du sparst ca. ${saved} Min Anstehen – das Grillteam sieht deine Bestellung sofort.</span></div>
      </div>
      <div class="demo-note" style="margin:10px 0 12px">${icon('info')}<span>${bon
        ? 'Bon-Modus – du erhältst einen digitalen Bell-Bon und zahlst am Stand.'
        : 'Fast geschafft – im nächsten Schritt bereiten wir deine Bestellung vor (Demo).'}</span></div>
      <button class="btn btn-primary btn-block btn-lg" data-act="checkout">${bon
        ? '🎟️ Bon erstellen · ' + BELL.chf(cartTotal())
        : 'Bestellen · ' + BELL.chf(cartTotal())}</button>`;
  }

  /* ---------- Personalisierung im Checkout ---------- */
  function persoBlock() {
    return `<div class="perso">
      <label class="perso-l">Wie dürfen wir dich aufrufen? <span>(optional)</span></label>
      <input id="perso-name" class="perso-inp" type="text" maxlength="24" autocomplete="off" placeholder="Vorname / Spitzname" value="${esc(BELL.getName())}" />
      <div class="perso-when">
        <button type="button" class="chip-when ${persoWhen === 'sofort' ? 'active' : ''}" data-act="when" data-when="sofort">⚡ Sofort abholen</button>
        <button type="button" class="chip-when ${persoWhen === '10min' ? 'active' : ''}" data-act="when" data-when="10min">⏱️ In ~10 Min</button>
      </div>
      <div class="perso-note">${icon('info')} Freiwillig · nur für diese Demo · lokal auf diesem Gerät</div>
    </div>`;
  }
  const trustLine = () => `<div class="trust">${icon('check')} <span>Bell Qualität – frisch vorbereitet für deinen Eventmoment.</span></div>`;
  function capturePerso() { const i = el('#perso-name'); persoName = i ? i.value.trim() : (BELL.getName() || ''); BELL.setName(persoName); }

  /* ---------- Payment ---------- */
  function openPay() {
    el('#pay-title').textContent = 'Bestellung abschliessen';
    payMethod = null;
    const methods = [
      ['twint', 'TWINT'], ['applepay', 'Apple Pay'], ['googlepay', 'Google Pay'],
      ['card', 'Kreditkarte'], ['cash', 'Bar am Stand']
    ];
    el('#pay-body').innerHTML = persoBlock() + `
      <div class="pay-grid">
        ${methods.map(([m, n]) => `
          <button class="pay-method" data-act="pay-select" data-method="${m}">
            <span class="pm-logo">${payLogo(m)}</span>
            <span class="pm-name">${esc(n)}</span>
          </button>`).join('')}
      </div>
      ${trustLine()}
      <div class="demo-note" style="margin-top:12px">${icon('info')}
        <span><strong>Demo-Version – es wird keine echte Zahlung durchgeführt.</strong></span>
      </div>`;
    el('#pay-foot').innerHTML = `<button class="btn btn-primary btn-block btn-lg" id="pay-now" data-act="pay-now" disabled>Zahlungsart wählen</button>`;
    openSheet('sheet-pay');
  }

  function selectPay(m) {
    payMethod = m;
    els('#pay-body .pay-method').forEach(b => b.classList.toggle('sel', b.dataset.method === m));
    const btn = el('#pay-now');
    btn.disabled = false;
    btn.textContent = (m === 'cash' ? 'Bestellung aufgeben' : 'Demo-Zahlung bestätigen') + ' · ' + BELL.chf(cartTotal());
  }

  function processPay() {
    if (!payMethod) return;
    capturePerso();
    const total = cartTotal();
    el('#pay-foot').innerHTML = '';
    el('#pay-title').textContent = 'Zahlung';
    el('#pay-body').innerHTML = `
      <div class="pay-stage">
        <div class="pay-spinner"><div class="ring"></div><div class="amt num">${BELL.chf(total)}</div></div>
        <h3>${payMethod === 'cash' ? 'Bestellung wird übermittelt…' : 'Zahlung wird verarbeitet…'}</h3>
        <p class="t-muted" style="margin-top:6px">${esc(PAY_LABEL[payMethod])}</p>
        <div class="demo-note" style="margin-top:var(--s-5);text-align:left">${icon('info')}<span>Demo – es wird keine echte Zahlung durchgeführt.</span></div>
      </div>`;
    buzz(18);
    setTimeout(() => {
      el('#pay-body').innerHTML = `
        <div class="pay-stage">
          <div class="pay-check">
            <svg viewBox="0 0 52 52" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path class="draw" d="M14 27l8 8 16-18"/></svg>
          </div>
          <h3>Bestellung bestätigt</h3>
          <p class="t-muted" style="margin-top:6px">Dein Bell-Moment ist unterwegs auf den Grill · <span class="num">${BELL.chf(total)}</span></p>
        </div>`;
      buzz(24);
      setTimeout(() => finalizeOrder(payMethod), 950);
    }, 1750);
  }

  /* ---------- Bon-System ---------- */
  function openBon() {
    const total = cartTotal();
    el('#pay-title').textContent = 'Bell Bon erstellen';
    el('#pay-body').innerHTML = persoBlock() + `
      <div class="bon-preview">
        <div class="bon-strip">🎟️ BELL BON · DEMO</div>
        <div class="bon-mid">
          <div class="bon-val">${BELL.chf(total)}</div>
          <div class="bon-sub">Einlösbar am Bell-Stand</div>
        </div>
        <div class="bon-note">Im Bon-System zahlst du <strong>nicht digital</strong>. Du bekommst einen digitalen Bon mit Abholnummer und löst ihn am Stand ein – bar oder mit Festival-Bons.</div>
      </div>
      ${trustLine()}`;
    el('#pay-foot').innerHTML = `<button class="btn btn-primary btn-block btn-lg" data-act="bon-create">🎟️ Bon erstellen · ${BELL.chf(total)}</button>`;
    openSheet('sheet-pay');
  }

  function processBon() {
    capturePerso();
    const total = cartTotal();
    el('#pay-foot').innerHTML = '';
    el('#pay-title').textContent = 'Bell Bon';
    el('#pay-body').innerHTML = `
      <div class="pay-stage">
        <div class="bon-stamp">🎟️</div>
        <h3>Bon wird erstellt…</h3>
        <p class="t-muted" style="margin-top:6px">Einlösbar am Stand · ${BELL.chf(total)}</p>
      </div>`;
    buzz(18);
    setTimeout(() => {
      el('#pay-body').innerHTML = `
        <div class="pay-stage">
          <div class="pay-check">
            <svg viewBox="0 0 52 52" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path class="draw" d="M14 27l8 8 16-18"/></svg>
          </div>
          <h3>Bell Bon erstellt</h3>
          <p class="t-muted" style="margin-top:6px">Dein Bell-Moment ist unterwegs auf den Grill · <span class="num">${BELL.chf(total)}</span></p>
        </div>`;
      buzz(24);
      setTimeout(() => finalizeOrder('bon'), 950);
    }, 1500);
  }

  function finalizeOrder(method) {
    const ev = BELL.currentEvent();
    const s = BELL.getSettings();
    const stand = (ev.stands.find(x => x.id === s.standId)) || ev.stands[0];
    const items = Object.keys(cart).filter(id => cart[id] > 0).map(id => {
      const p = prod(id); return { id, name: p.name, price: p.price, qty: cart[id] };
    });
    const subtotal = cartTotal();
    const pm = method || payMethod || 'card';
    const order = BELL.createOrder({
      eventId: ev.id, standId: stand.id, standName: stand.name,
      items, subtotal, total: subtotal, payMethod: pm, payLabel: PAY_LABEL[pm],
      guestName: persoName, pickupWhen: persoWhen
    });
    addMine(order.id);
    cart = {}; payMethod = null;
    closeSheets();
    activeOrderId = order.id; backTarget = 'start';
    renderOrder(order.id, 'success');
    show('success');
    toast('Danke' + (persoName ? ', ' + persoName : '') + ' – dein Bell-Moment ' + order.pickup + ' läuft', 'ok');
    buzz(30);
  }

  /* ---------- Bell-Welt Drawer ---------- */
  function openBell() {
    el('#bell-title').textContent = 'Bell-Welt entdecken';
    el('#bell-body').innerHTML = `
      <div class="bw-hero">
        <span class="bw-claim">„Dafür wurde Feuer entdeckt."</span>
        <span class="bw-sub">Bell BBQ-Welt</span>
      </div>
      <div class="bw-mod"><div class="bw-ic">🔥</div><div><b>Qualität, die man schmeckt.</b><span>Schweizer Fleisch, Geflügel & Charcuterie – Handwerk und Herkunft, denen Gäste vertrauen.</span></div></div>
      <div class="bw-mod"><div class="bw-ic">🍖</div><div><b>Grillmomente für Events.</b><span>Vom Stadion bis zum Firmenfest: frisch grilliert, schnell serviert.</span></div></div>
      <div class="bw-mod"><div class="bw-ic">⚡</div><div><b>Schneller Service, frisch vom Grill.</b><span>Bell FastLane bringt die Bell-Qualität ohne Anstehen zu deinem Eventmoment.</span></div></div>
      <div class="bw-links">
        <a class="btn btn-soft btn-block" href="https://www.bell.ch/de/themenwelten/bbq/" target="_blank" rel="noopener">Bell BBQ-Welt entdecken ↗</a>
        <a class="btn btn-ghost btn-block" href="https://www.bell.ch/de/kochwissen/bbq-tipps/" target="_blank" rel="noopener">BBQ-Ratgeber & Grilltipps ↗</a>
        <a class="btn btn-ghost btn-block" href="https://www.bell.ch/de/ueber-bell/unsere-werte/" target="_blank" rel="noopener">Über Bell & Werte ↗</a>
      </div>
      <div class="perso-note" style="margin-top:12px">${icon('info')} Externe Links zur offiziellen Bell-Webseite (öffnen in neuem Tab).</div>`;
    openSheet('sheet-bell');
  }

  /* ---------- Journey ---------- */
  function flowHtml(o, idx) {
    return `
      <div class="card pad flow">
        <div class="flow-head">
          <h3>Bestellablauf</h3>
          <span class="flow-live"><span class="lv-dot"></span>live</span>
        </div>
        <div class="flow-steps">
          ${BELL.STATUS.map((st, i) => {
            const state = i < idx ? 'done' : (i === idx ? 'cur' : 'todo');
            return `<div class="flow-step ${state}">
              <span class="fs-ico"><img src="assets/img/${SYM[st]}.svg?v=6" alt=""></span>
              <span class="fs-body"><b>${BELL.STATUS_LABEL[st]}</b><span>${BELL.STATUS_GUEST_LINE[st]}</span></span>
              <span class="fs-mark">${i < idx ? icon('check') : (i === idx ? '<span class="fs-pulse"></span>' : '')}</span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  function renderOrder(id, view) {
    const o = BELL.getOrder(id);
    if (!o) { show('start'); return; }
    BELL.markRead(id, 'guest');
    const idx = BELL.STATUS.indexOf(o.status);
    const isReady = o.status === 'ready';
    const isDone = o.status === 'done';
    const isBon = o.payMethod === 'bon';
    const fav = BELL.getFav();
    const isFav = !!(fav && sig(fav.items) === sig(o.items));
    const nm = o.guestName || '';

    const prev = lastIdxById[o.id];
    const justAdvanced = (typeof prev === 'number' && idx > prev);
    lastIdxById[o.id] = idx;

    const showWait = !isReady && !isDone;
    const aheadActive = BELL.getOrders().filter(x => x.status !== 'done' && x.status !== 'ready' && x.createdAt < o.createdAt).length;
    const estWait = Math.max(2, aheadActive * 2 + 3);

    const subt = {
      received: (nm ? 'Danke, ' + nm + '! ' : '') + 'Wir haben deine Bestellung erhalten.',
      prep: 'Deine Bestellung wird vorbereitet.',
      grill: 'Frisch auf dem Grill 🔥',
      almost: 'Gleich fertig – nur noch einen Moment.',
      ready: (nm ? nm + ', komm' : 'Komm') + ' zum ' + o.standName + (isBon ? ', zeig deinen Bon und hol ab!' : ' und zeig deine Nummer!'),
      done: 'Abgeschlossen – en Guete! 😋'
    }[o.status];

    const itemsHtml = o.items.map(it =>
      `<div class="r-line"><span><span class="q">${it.qty}×</span> ${esc(it.name)}</span><span class="num">${BELL.chf(it.price * it.qty)}</span></div>`
    ).join('');

    const chatLog = (o.messages || []).map(m => {
      if (m.from === 'system') return `<div class="sys-msg">${esc(m.text)}<span class="tm">${BELL.clock(m.ts)}</span></div>`;
      return `<div class="bubble ${m.from === 'guest' ? 'me' : 'them'}">${esc(m.text)}<span class="tm">${m.from === 'guest' ? 'Du' : 'Bell-Crew'} · ${BELL.clock(m.ts)}</span></div>`;
    }).join('') || `<div class="t-muted center" style="font-size:var(--fs-sm);padding:8px">Noch keine Nachrichten. Schreib dem Grillteam bei Sonderwünschen.</div>`;

    const receiptCard = isBon ? `
      <div class="card bon-receipt" style="margin-top:var(--s-5);overflow:hidden">
        <div class="bon-r-top"><span class="bon-r-kicker">🎟️ BELL BON · DEMO</span><strong style="color:#fff;font-style:italic;font-family:Georgia,'Times New Roman',serif">Bell</strong></div>
        <div class="bon-r-no">${esc(o.pickup)}</div>
        <div class="bon-r-val">Wert: ${BELL.chf(o.total)}</div>
        <div class="bon-perf"></div>
        <div class="bon-r-body">${itemsHtml}</div>
        <div class="bon-r-foot ${isDone ? 'paid' : ''}">${isDone ? '✅ Bon eingelöst · am Stand bezahlt' : '⏳ Offen – Bon am Stand vorweisen & einlösen'}</div>
        <div class="r-meta" style="padding:0 20px 16px">Bon-Nr. ${esc(o.pickup)} · ${new Date(o.createdAt).toLocaleString('de-CH')} · Demo-Bon, kein Zahlungsmittel.</div>
      </div>` : `
      <div class="card" style="margin-top:var(--s-5);overflow:hidden">
        <div class="receipt">
          <div class="r-head">
            <div><div class="t-eyebrow">Quittung · Demo</div><strong style="font-size:var(--fs-md)">${esc(o.standName)}</strong></div>
            <span class="bell-mark sm">Bell</span>
          </div>
          <div class="r-body">
            ${itemsHtml}
            <div class="r-line" style="font-weight:800;border-top:1px solid var(--line);margin-top:6px;padding-top:10px"><span>Total</span><span class="num">${BELL.chf(o.total)}</span></div>
          </div>
          <div class="r-foot">
            <div class="row between"><span class="t-muted" style="font-size:var(--fs-sm)">Bezahlt mit</span><strong style="font-size:var(--fs-sm)">${esc(o.payLabel)}</strong></div>
            <div class="barcode"></div>
            <div class="r-meta">Beleg-Nr. ${esc(o.pickup)} · ${new Date(o.createdAt).toLocaleString('de-CH')} · Demo-Beleg, keine echte Zahlung.</div>
          </div>
        </div>
      </div>`;

    const target = view === 'success' ? '#success-content' : '#track-content';
    el(target).innerHTML = `
      ${view === 'track' ? `<button class="btn btn-ghost btn-sm" data-nav="track" style="margin-bottom:var(--s-4)">${icon('arrowLeft')}Alle Bestellungen</button>` : ''}

      <div class="status-hero ${SH[o.status]}">
        <div class="symwrap"><img src="assets/img/${SYM[o.status]}.svg?v=6" alt="" /></div>
        <div class="bl">${BELL.STATUS_LABEL[o.status]}</div>
        <div class="sl">${esc(subt)}</div>
      </div>

      <div class="pickup-card" style="margin-top:var(--s-4)">
        <div class="lbl">${isBon ? 'Dein Bon · Abholnummer' : 'Deine Abholnummer'}${nm ? ' · ' + esc(nm) : ''}</div>
        <div class="no">${esc(o.pickup)}</div>
        ${showWait
          ? `<div style="margin-top:10px"><span style="display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);padding:8px 16px;border-radius:999px;font-weight:800">⏱️ Bereit in ≈ ${estWait} Min</span></div>`
          : `<div class="hint">${isDone ? 'Abgeschlossen – en Guete! 😋' : (isBon ? '🎟️ Zeig diesen Bon am ' + esc(o.standName) : '🎉 Zeig diese Nummer am ' + esc(o.standName))}</div>`}
        ${isReady ? `<button class="btn btn-block btn-lg" data-act="order-received" data-id="${o.id}" style="margin-top:var(--s-4);background:#fff;color:var(--bell-red)">${icon('check')} ${isBon ? 'Bon eingelöst & erhalten' : 'Bestellung erhalten'}</button>` : ''}
      </div>

      <div class="bell-pass">
        <div class="bp-l"><span class="bp-k">🎟️ Dein Bell Moment</span><span class="bp-no">${esc(o.pickup)}</span><span class="bp-sub">Danke${nm ? ', ' + esc(nm) : ''} für deinen Bell-Moment. Beim nächsten Scan direkt erneut bestellen.</span></div>
        <button class="btn ${isFav ? 'btn-primary' : 'btn-soft'} btn-sm" data-act="fav-toggle" data-id="${o.id}">${isFav ? '★ Favorit' : '☆ Favorit merken'}</button>
      </div>

      ${flowHtml(o, idx)}

      ${receiptCard}

      <div class="card pad" style="margin-top:var(--s-5)">
        <div class="row" style="gap:8px;margin-bottom:var(--s-3)">${icon('chat')}<h3 style="font-size:var(--fs-lg)">Nachricht ans Grillteam</h3></div>
        <div class="quick-msgs">
          ${BELL.QUICK_MSGS.map(q => `<button class="qm" data-act="quick-msg" data-id="${o.id}" data-text="${esc(q)}">${esc(q)}</button>`).join('')}
        </div>
        <div class="chat-log" id="chat-log-${view}">${chatLog}</div>
        <div class="chat-input">
          <input type="text" id="chat-inp-${view}" placeholder="Eigene Nachricht…" maxlength="140" />
          <button class="chat-send" data-act="send-msg" data-id="${o.id}" data-view="${view}" aria-label="Senden">${icon('send')}</button>
        </div>
      </div>

      <div class="stack" style="margin-top:var(--s-6)">
        <button class="btn btn-primary btn-block btn-lg" data-act="new-order">${icon('bag')} Neue Bestellung starten</button>
        <button class="btn btn-soft btn-block" data-act="reorder" data-id="${o.id}">${icon('refresh')} Diese Bestellung nochmal</button>
        <button class="btn btn-ghost btn-block" data-act="bell-world">${icon('info')} Mehr über Bell entdecken</button>
        <button class="btn btn-ghost btn-block" data-nav="${view === 'success' ? 'start' : 'track'}">${view === 'success' ? 'Zur Startseite' : 'Zurück zur Übersicht'}</button>
      </div>`;

    const log = el('#chat-log-' + view); if (log) log.scrollTop = log.scrollHeight;

    if (justAdvanced) {
      const c = el(target);
      const hero = c && c.querySelector('.status-hero');
      if (hero) { hero.classList.add('just'); setTimeout(() => hero.classList.remove('just'), 900); }
      const curStep = c && c.querySelector('.flow-step.cur');
      if (curStep) { curStep.classList.add('just'); setTimeout(() => curStep.classList.remove('just'), 900); }
      toast('Update vom Stand: ' + BELL.STATUS_LABEL[o.status], 'ok', 1900);
      buzz(26);
    }
  }

  function renderTrack() {
    const mine = getMine().map(id => BELL.getOrder(id)).filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
    const c = el('#track-content');
    if (!mine.length) {
      c.innerHTML = `<div class="center" style="padding:var(--s-9) var(--s-4)">
        <div style="font-size:54px">📋</div>
        <h2 style="margin-top:var(--s-3)">Noch keine Bestellungen</h2>
        <p class="t-muted" style="margin-top:8px;margin-bottom:var(--s-5)">Sobald du bestellst, siehst du hier deinen Live-Status.</p>
        <button class="btn btn-primary btn-lg" data-act="new-order">Jetzt bestellen</button>
      </div>`;
      return;
    }
    c.innerHTML = `<div class="sec-head" style="margin-top:0"><h2>Meine Bestellungen</h2></div>` + mine.map(o => `
      <button class="card pad row between" data-act="track-open" data-id="${o.id}" style="width:100%;text-align:left;margin-bottom:var(--s-3);gap:var(--s-3)">
        <span class="row" style="gap:var(--s-4)">
          <span style="font-size:var(--fs-2xl);font-weight:900;letter-spacing:-.02em;color:var(--bell-red)">${esc(o.pickup)}</span>
          <span>
            <span style="display:block;font-weight:700">${o.items.reduce((s, i) => s + i.qty, 0)} Artikel · ${BELL.chf(o.total)}${o.payMethod === 'bon' ? ' · 🎟️ Bon' : ''}</span>
            <span class="t-muted" style="font-size:var(--fs-sm)">${esc(o.standName)} · ${BELL.timeAgo(o.createdAt)}</span>
          </span>
        </span>
        <span class="status-pill s-${o.status}">${BELL.STATUS_SHORT[o.status]}</span>
      </button>`).join('');
  }

  function openSheet(id) { el('#scrim').classList.add('show'); el('#' + id).classList.add('show'); document.body.style.overflow = 'hidden'; }
  function closeSheets() {
    el('#scrim').classList.remove('show');
    els('.sheet').forEach(s => s.classList.remove('show'));
    document.body.style.overflow = '';
  }

  function changeQty(id, delta) {
    cart[id] = Math.max(0, (cart[id] || 0) + delta);
    if (cart[id] === 0) delete cart[id];
    refreshProductRow(id);
    updateCartBar();
    if (el('#sheet-cart').classList.contains('show')) renderCart();
    if (delta > 0) buzz(8);
  }

  function loadItemsToCart(items) {
    const avail = {}; products().forEach(p => avail[p.id] = true);
    cart = {}; let n = 0;
    (items || []).forEach(it => { if (avail[it.id]) { cart[it.id] = (cart[it.id] || 0) + it.qty; n += it.qty; } });
    return n;
  }

  function refreshLive() {
    if (currentView === 'success' && activeOrderId) {
      const inp = el('#chat-inp-success'); const focused = inp && document.activeElement === inp; const val = focused ? inp.value : '';
      renderOrder(activeOrderId, 'success');
      if (focused) { const ni = el('#chat-inp-success'); if (ni) { ni.value = val; ni.focus(); } }
    } else if (currentView === 'track') {
      if (el('#track-content [data-act="send-msg"]') && activeOrderId) {
        const inp = el('#chat-inp-track'); const focused = inp && document.activeElement === inp; const val = focused ? inp.value : '';
        renderOrder(activeOrderId, 'track');
        if (focused) { const ni = el('#chat-inp-track'); if (ni) { ni.value = val; ni.focus(); } }
      } else {
        renderTrack();
      }
    } else if (currentView === 'start') {
      renderWelcomeBack();
    }
  }

  const AUTO = { received: 8, prep: 12, grill: 16, almost: 10 };
  function autoTick() {
    if (!BELL.isCrewActive()) {
      let changed = false;
      BELL.getOrders().forEach(o => {
        if (o.source !== 'guest' || o.status === 'ready' || o.status === 'done') return;
        const t = (o.statusTimes && o.statusTimes[o.status]) || o.createdAt;
        if ((Date.now() - t) / 1000 >= (AUTO[o.status] || 12)) { BELL.advanceStatus(o.id); changed = true; }
      });
      if (changed) return;
    }
    refreshLive();
  }

  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) { goNav(navBtn.dataset.nav); return; }
    if (e.target.closest('[data-close-sheet]')) { closeSheets(); return; }
    if (e.target.id === 'scrim') { closeSheets(); return; }

    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act, id = a.dataset.id;

    switch (act) {
      case 'add': changeQty(id, 1); break;
      case 'inc': changeQty(id, 1); break;
      case 'dec': changeQty(id, -1); break;
      case 'remove': delete cart[id]; refreshProductRow(id); updateCartBar(); renderCart(); break;
      case 'cat': { const n = el('#cat-' + a.dataset.cat); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); break; }
      case 'pick-stand': BELL.setSettings({ standId: id }); renderMenu(); show('menu'); break;
      case 'checkout': closeSheets(); setTimeout(() => { (isBonMode() ? openBon : openPay)(); }, 180); break;
      case 'pay-select': selectPay(a.dataset.method); break;
      case 'pay-now': processPay(); break;
      case 'bon-create': processBon(); break;
      case 'when': persoWhen = a.dataset.when; els('.chip-when').forEach(c => c.classList.toggle('active', c.dataset.when === persoWhen)); break;
      case 'bell-world': openBell(); break;
      case 'order-received': BELL.setStatus(id, 'done'); toast('Abgeschlossen – en Guete!', 'ok'); break;
      case 'new-order': cart = {}; closeSheets(); renderMenu(); show('menu'); toast('Neuer Grillmoment – das Menü ist bereit'); break;
      case 'reorder': {
        const ord = BELL.getOrder(id); if (!ord) break;
        const n = loadItemsToCart(ord.items);
        closeSheets(); renderMenu(); show('menu');
        if (n > 0) { renderCart(); openSheet('sheet-cart'); toast('In den Warenkorb übernommen', 'ok'); }
        else toast('Diese Artikel sind im aktuellen Event nicht verfügbar', 'warn');
        break;
      }
      case 'order-fav': {
        const fav = BELL.getFav();
        const mine = getMine().map(x => BELL.getOrder(x)).filter(Boolean).sort((x, y) => y.createdAt - x.createdAt);
        const items = fav ? fav.items : (mine[0] ? mine[0].items : null);
        if (!items) break;
        const n = loadItemsToCart(items);
        renderMenu(); show('menu');
        if (n > 0) { renderCart(); openSheet('sheet-cart'); toast('Dein Favorit ist im Warenkorb', 'ok'); }
        else toast('Diese Artikel sind im aktuellen Event nicht verfügbar', 'warn');
        break;
      }
      case 'fav-toggle': {
        const ord = BELL.getOrder(id); if (!ord) break;
        const fav = BELL.getFav();
        if (fav && sig(fav.items) === sig(ord.items)) { BELL.clearFav(); toast('Favorit entfernt'); }
        else { BELL.setFav({ items: ord.items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })), standName: ord.standName }); toast('Als Favorit gemerkt ★', 'ok'); }
        renderOrder(id, currentView === 'success' ? 'success' : 'track');
        break;
      }
      case 'track-open': activeOrderId = id; backTarget = 'track'; renderOrder(id, 'track'); show('track'); break;
      case 'quick-msg': sendMsg(id, a.dataset.text, currentView === 'success' ? 'success' : 'track'); break;
      case 'send-msg': {
        const v = a.dataset.view; const inp = el('#chat-inp-' + v);
        if (inp && inp.value.trim()) { sendMsg(id, inp.value.trim(), v); inp.value = ''; }
        break;
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const t = e.target;
    if (t && t.id === 'pg-name') { persoGo(); return; }
    if (t && t.id && t.id.indexOf('chat-inp-') === 0 && t.value.trim()) {
      const v = t.id.replace('chat-inp-', '');
      sendMsg(activeOrderId, t.value.trim(), v); t.value = '';
    }
  });

  function sendMsg(id, text, view) {
    if (!id) return;
    BELL.addMessage(id, 'guest', text);
    renderOrder(id, view);
    toast('Nachricht gesendet', 'ok', 1400);
  }

  function goNav(view) {
    if (view === 'start') { renderStart(); show('start'); }
    else if (view === 'stand') { renderStands(); show('stand'); }
    else if (view === 'menu') { renderMenu(); show('menu'); }
    else if (view === 'track') { activeOrderId = null; renderTrack(); show('track'); }
  }

  el('#cta-order').addEventListener('click', () => {
    const ev = BELL.currentEvent();
    if (ev.stands.length > 1 && !BELL.getSettings().standId) { renderStands(); show('stand'); }
    else { if (!BELL.getSettings().standId) BELL.setSettings({ standId: ev.stands[0].id }); renderMenu(); show('menu'); }
  });
  el('#cta-track').addEventListener('click', () => goNav('track'));
  el('#cart-open').addEventListener('click', () => { renderCart(); openSheet('sheet-cart'); });

  BELL.onChange(() => { refreshLive(); });

  /* ---------- Personalisierungs-Gate (nach Intro, steuerbar) ---------- */
  function persoGo() {
    const v = ((el('#pg-name') || {}).value || '').trim();
    BELL.setName(v);
    closePerso();
    renderStart();
    toast(v ? ('Willkommen, ' + v + ' 🔥') : 'Los geht\'s – viel Genuss 🔥', 'ok', 1700);
  }
  function runPerso(force) {
    const g = el('#perso-gate'); if (!g) return;
    let done = false; try { done = !!localStorage.getItem('bellfl_perso_v1'); } catch (e) {}
    if (done && !force) return;
    const inp = el('#pg-name'); if (inp) inp.value = BELL.getName() || '';
    g.classList.remove('out'); g.classList.add('show');
    setTimeout(() => { try { inp && inp.focus(); } catch (e) {} }, 380);
  }
  function closePerso() {
    const g = el('#perso-gate'); if (!g) return;
    try { localStorage.setItem('bellfl_perso_v1', '1'); } catch (e) {}
    g.classList.add('out');
    setTimeout(() => { g.classList.remove('show'); g.classList.remove('out'); }, 430);
  }
  function wirePerso() {
    const go = el('#pg-go'); if (go) go.addEventListener('click', persoGo);
    const an = el('#pg-anon'); if (an) an.addEventListener('click', () => { BELL.setName(''); closePerso(); renderStart(); toast('Alles klar – anonym unterwegs', 'ok', 1500); });
    const bp = el('#btn-perso'); if (bp) bp.addEventListener('click', () => runPerso(true));
  }

  /* ---------- Intro (1. Besuch, skippbar) → danach Perso-Gate ---------- */
  function runIntro() {
    const introEl = el('#intro');
    let seen = false; try { seen = !!localStorage.getItem('bellfl_intro_v1'); } catch (e) {}
    if (!introEl) { runPerso(false); return; }
    if (seen) { introEl.parentNode && introEl.parentNode.removeChild(introEl); runPerso(false); return; }
    introEl.classList.add('show');
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      try { localStorage.setItem('bellfl_intro_v1', '1'); } catch (e) {}
      introEl.classList.add('out');
      setTimeout(() => { introEl.parentNode && introEl.parentNode.removeChild(introEl); }, 600);
      setTimeout(() => runPerso(false), 360);
    };
    introEl.addEventListener('click', finish);
    setTimeout(finish, 2600);
  }

  function boot() {
    wirePerso();
    runIntro();
    renderStart();
    const h = location.hash;
    if (h.indexOf('order=') > -1) {
      const id = h.split('order=')[1];
      if (BELL.getOrder(id)) { activeOrderId = id; backTarget = 'track'; renderOrder(id, 'track'); show('track'); return; }
    }
    if (h === '#track') { goNav('track'); return; }
    show('start');
    setInterval(autoTick, 3000);
    setInterval(() => { if (currentView === 'track' && !activeOrderId) renderTrack(); }, 8000);
  }
  boot();

})();
