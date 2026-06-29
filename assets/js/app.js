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

  const MINE = 'bellfl_mine_v1';
  const getMine = () => { try { return JSON.parse(localStorage.getItem(MINE)) || []; } catch (e) { return []; } };
  const addMine = (id) => { const m = getMine(); if (m.indexOf(id) < 0) { m.push(id); localStorage.setItem(MINE, JSON.stringify(m)); } };

  const PAY_LABEL = { twint: 'TWINT', applepay: 'Apple Pay', googlepay: 'Google Pay', card: 'Kreditkarte', cash: 'Bar am Stand' };
  // Symbol + Farbverlauf je Status (visueller Status-Screen)
  const SYM = { received: 'sym-received', prep: 'sym-prep', grill: 'sym-prep', almost: 'sym-prep', ready: 'sym-pickup', done: 'sym-received' };
  const SH = { received: 'sh-received', prep: 'sh-prep', grill: 'sh-grill', almost: 'sh-almost', ready: 'sh-ready', done: 'sh-done' };

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
    el('#hero-kicker').innerHTML = '🔥 Bell Grill &amp; Event';
    const hb = el('#hero-bg'); if (hb && BELL.HERO) hb.style.backgroundImage = 'url("' + BELL.HERO + '")';
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
            <div class="thumb">${p.img ? `<img src="${p.img}" alt="${esc(p.name)}" loading="lazy">` : p.art}</div>
            <div class="info">
              <h3>${esc(p.name)}</h3>
              <div class="desc">${esc(p.desc)}</div>
              <div class="tags">${(p.tags || []).map(tagHtml).join('')}</div>
            </div>
            <div class="buy">
              <span class="price">${BELL.chf(p.price)}</span>
              <span class="buy-ctrl">${buyCtrl(p.id)}</span>
            </div>
          </div>`).join('')}
      </div>`).join('');

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
        <div style="font-size:42px">🛒</div><p style="margin-top:8px">Dein Warenkorb ist leer.</p></div>`;
      foot.innerHTML = `<button class="btn btn-ghost btn-block" data-close-sheet>Weiter auswählen</button>`;
      return;
    }
    body.innerHTML = ids.map(id => {
      const p = prod(id), q = cart[id];
      return `<div class="cart-line" data-id="${id}">
        <div class="thumb">${p.img ? `<img src="${p.img}" alt="${esc(p.name)}" loading="lazy">` : p.art}</div>
        <div>
          <div class="nm">${esc(p.name)}</div>
          <div class="ea">${BELL.chf(p.price)} / Stück</div>
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

    foot.innerHTML = `
      <div class="demo-note" style="margin-bottom:12px">${icon('info')}<span>Demo-Version – im nächsten Schritt wird keine echte Zahlung ausgelöst.</span></div>
      <button class="btn btn-primary btn-block btn-lg" data-act="checkout">Zur Demo-Zahlung · ${BELL.chf(cartTotal())}</button>`;
  }

  function openPay() {
    el('#pay-title').textContent = 'Zahlung wählen';
    payMethod = null;
    const methods = [
      ['twint', 'TWINT'], ['applepay', 'Apple Pay'], ['googlepay', 'Google Pay'],
      ['card', 'Kreditkarte'], ['cash', 'Bar am Stand']
    ];
    el('#pay-body').innerHTML = `
      <div class="pay-grid">
        ${methods.map(([m, n]) => `
          <button class="pay-method" data-act="pay-select" data-method="${m}">
            <span class="pm-logo">${payLogo(m)}</span>
            <span class="pm-name">${esc(n)}</span>
          </button>`).join('')}
      </div>
      <div class="demo-note" style="margin-top:var(--s-5)">${icon('info')}
        <span><strong>Demo-Version – es wird keine echte Zahlung durchgeführt.</strong> Alle Beträge sind fiktiv und dienen nur zur Veranschaulichung.</span>
      </div>`;
    el('#pay-foot').innerHTML = `<button class="btn btn-primary btn-block btn-lg" id="pay-now" data-act="pay-now" disabled>Zahlungsart wählen</button>`;
    openSheet('sheet-pay');
  }

  function selectPay(m) {
    payMethod = m;
    els('#pay-body .pay-method').forEach(b => b.classList.toggle('sel', b.dataset.method === m));
    const btn = el('#pay-now');
    btn.disabled = false;
    btn.textContent = (m === 'cash' ? 'Bestellung aufgeben' : 'Jetzt bezahlen') + ' · ' + BELL.chf(cartTotal());
  }

  function processPay() {
    if (!payMethod) return;
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
          <h3>${payMethod === 'cash' ? 'Bestellung aufgenommen' : 'Zahlung erfolgreich'}</h3>
          <p class="t-muted" style="margin-top:6px">${esc(PAY_LABEL[payMethod])} · <span class="num">${BELL.chf(total)}</span></p>
        </div>`;
      buzz(24);
      setTimeout(finalizeOrder, 950);
    }, 1750);
  }

  function finalizeOrder() {
    const ev = BELL.currentEvent();
    const s = BELL.getSettings();
    const stand = (ev.stands.find(x => x.id === s.standId)) || ev.stands[0];
    const items = Object.keys(cart).filter(id => cart[id] > 0).map(id => {
      const p = prod(id); return { id, name: p.name, price: p.price, qty: cart[id] };
    });
    const subtotal = cartTotal();
    const order = BELL.createOrder({
      eventId: ev.id, standId: stand.id, standName: stand.name,
      items, subtotal, total: subtotal, payMethod, payLabel: PAY_LABEL[payMethod]
    });
    addMine(order.id);
    cart = {}; payMethod = null;
    closeSheets();
    activeOrderId = order.id; backTarget = 'start';
    renderOrder(order.id, 'success');
    show('success');
    toast('Bestellung ' + order.pickup + ' aufgegeben', 'ok');
    buzz(30);
  }

  function renderOrder(id, view) {
    const o = BELL.getOrder(id);
    if (!o) { show('start'); return; }
    BELL.markRead(id, 'guest');
    const idx = BELL.STATUS.indexOf(o.status);
    const isReady = o.status === 'ready';
    const isDone = o.status === 'done';

    const showWait = !isReady && !isDone;
    const aheadActive = BELL.getOrders().filter(x => x.status !== 'done' && x.status !== 'ready' && x.createdAt < o.createdAt).length;
    const estWait = Math.max(2, aheadActive * 2 + 3);

    const subt = {
      received: 'Wir haben deine Bestellung erhalten.',
      prep: 'Deine Bestellung wird vorbereitet.',
      grill: 'Frisch auf dem Grill 🔥',
      almost: 'Gleich fertig – nur noch einen Moment.',
      ready: 'Komm zum ' + o.standName + ' und zeig deine Nummer!',
      done: 'Abgeschlossen – en Guete! 😋'
    }[o.status];
    const dots = BELL.STATUS.map((st, i) => `<i class="${i < idx ? 'done' : (i === idx ? 'cur' : '')}"></i>`).join('');

    const itemsHtml = o.items.map(it =>
      `<div class="r-line"><span><span class="q">${it.qty}×</span> ${esc(it.name)}</span><span class="num">${BELL.chf(it.price * it.qty)}</span></div>`
    ).join('');

    const chatLog = (o.messages || []).map(m =>
      `<div class="bubble ${m.from === 'guest' ? 'me' : 'them'}">${esc(m.text)}<span class="tm">${m.from === 'guest' ? 'Du' : 'Bell-Crew'} · ${BELL.clock(m.ts)}</span></div>`
    ).join('') || `<div class="t-muted center" style="font-size:var(--fs-sm);padding:8px">Noch keine Nachrichten. Schreib der Crew bei Sonderwünschen.</div>`;

    const target = view === 'success' ? '#success-content' : '#track-content';
    el(target).innerHTML = `
      ${view === 'track' ? `<button class="btn btn-ghost btn-sm" data-nav="track" style="margin-bottom:var(--s-4)">${icon('arrowLeft')}Alle Bestellungen</button>` : ''}

      <div class="status-hero ${SH[o.status]}">
        <div class="symwrap"><img src="assets/img/${SYM[o.status]}.svg?v=5" alt="" /></div>
        <div class="bl">${BELL.STATUS_LABEL[o.status]}</div>
        <div class="sl">${esc(subt)}</div>
        <div class="step-dots">${dots}</div>
      </div>

      <div class="pickup-card" style="margin-top:var(--s-4)">
        <div class="lbl">Deine Abholnummer</div>
        <div class="no">${esc(o.pickup)}</div>
        ${showWait
          ? `<div style="margin-top:10px"><span style="display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);padding:8px 16px;border-radius:999px;font-weight:800">⏱️ Bereit in ≈ ${estWait} Min</span></div>`
          : `<div class="hint">${isDone ? 'Abgeschlossen – en Guete! 😋' : '🎉 Zeig diese Nummer am ' + esc(o.standName)}</div>`}
        ${isReady ? `<button class="btn btn-block btn-lg" data-act="order-received" data-id="${o.id}" style="margin-top:var(--s-4);background:#fff;color:var(--bell-red)">${icon('check')} Bestellung erhalten</button>` : ''}
      </div>

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
      </div>

      <div class="card pad" style="margin-top:var(--s-5)">
        <div class="row" style="gap:8px;margin-bottom:var(--s-3)">${icon('chat')}<h3 style="font-size:var(--fs-lg)">Nachricht an die Crew</h3></div>
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
        <button class="btn btn-ghost btn-block" data-nav="${view === 'success' ? 'start' : 'track'}">${view === 'success' ? 'Zur Startseite' : 'Zurück zur Übersicht'}</button>
      </div>`;

    const log = el('#chat-log-' + view); if (log) log.scrollTop = log.scrollHeight;
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
            <span style="display:block;font-weight:700">${o.items.reduce((s, i) => s + i.qty, 0)} Artikel · ${BELL.chf(o.total)}</span>
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
    }
  }

  const AUTO = { received: 8, prep: 12, grill: 16, almost: 10 };
  function autoTick() {
    let changed = false;
    BELL.getOrders().forEach(o => {
      if (o.source !== 'guest' || o.status === 'ready' || o.status === 'done') return;
      const t = (o.statusTimes && o.statusTimes[o.status]) || o.createdAt;
      if ((Date.now() - t) / 1000 >= (AUTO[o.status] || 12)) { BELL.advanceStatus(o.id); changed = true; }
    });
    if (!changed) refreshLive();
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
      case 'checkout': closeSheets(); setTimeout(openPay, 180); break;
      case 'pay-select': selectPay(a.dataset.method); break;
      case 'pay-now': processPay(); break;
      case 'order-received': BELL.setStatus(id, 'done'); toast('Bestellung abgeschlossen – en Guete!', 'ok'); break;
      case 'new-order': cart = {}; closeSheets(); renderMenu(); show('menu'); toast('Neue Bestellung – Menü ist bereit'); break;
      case 'reorder': {
        const ord = BELL.getOrder(id); if (!ord) break;
        const avail = {}; products().forEach(p => avail[p.id] = true);
        cart = {}; let n = 0;
        ord.items.forEach(it => { if (avail[it.id]) { cart[it.id] = (cart[it.id] || 0) + it.qty; n += it.qty; } });
        closeSheets(); renderMenu(); show('menu');
        if (n > 0) { renderCart(); openSheet('sheet-cart'); toast('In den Warenkorb übernommen', 'ok'); }
        else toast('Diese Artikel sind im aktuellen Event nicht verfügbar', 'warn');
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

  function boot() {
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
