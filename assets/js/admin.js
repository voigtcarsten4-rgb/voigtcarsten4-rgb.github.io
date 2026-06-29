/* =====================================================================
   BELL FASTLANE — Admin / Management Dashboard
   ===================================================================== */
(function () {
  'use strict';
  const { el, els, esc, icon, toast } = UI;
  const PAY_LABEL = { twint: 'TWINT', applepay: 'Apple Pay', googlepay: 'Google Pay', card: 'Kreditkarte', cash: 'Bar', bon: 'Bell Bon' };

  let presenting = false, presentTimer = null;
  let counted = false;

  function isToday(ts) { const d = new Date(ts), n = new Date(); return d.toDateString() === n.toDateString(); }

  function updateModeBtn() {
    const b = el('#btn-mode'); if (!b) return;
    const bon = BELL.getSettings().mode === 'bon';
    b.innerHTML = '<span class="mode-dot"></span>' + (bon ? 'Modus: Bon-System' : 'Modus: Zahlung');
    b.classList.toggle('btn-primary', bon);
    b.classList.toggle('btn-soft', !bon);
  }

  function renderMetrics() {
    const orders = BELL.getOrders();
    const today = orders.filter(o => isToday(o.createdAt));
    const rev = today.reduce((s, o) => s + o.total, 0);
    const count = today.length;
    const avg = count ? rev / count : 0;
    const open = orders.filter(o => o.status !== 'done').length;

    const cards = [
      { ic: 'money', cl: 'red', v: 'CHF ' + rev.toFixed(0), l: 'Tagesumsatz (Demo)', d: 'Live aggregiert' },
      { ic: 'bag', cl: 'blue', v: count, l: 'Bestellungen heute', d: 'inkl. Walk-ins' },
      { ic: 'receipt', cl: 'amber', v: 'CHF ' + avg.toFixed(2), l: 'Ø Warenkorb', d: 'pro Bestellung' },
      { ic: 'bolt', cl: 'green', v: open, l: 'Aktive Bestellungen', d: 'in Bearbeitung' }
    ];
    el('#metrics').innerHTML = cards.map(c => `
      <div class="metric">
        <div class="ico ${c.cl}">${icon(c.ic)}</div>
        <div class="v num">${c.v}</div>
        <div class="l">${c.l}</div>
        <div class="delta up">${esc(c.d)}</div>
      </div>`).join('');
  }

  function renderTop() {
    const orders = BELL.getOrders();
    const agg = {};
    orders.forEach(o => o.items.forEach(it => {
      agg[it.id] = agg[it.id] || { name: it.name, qty: 0, rev: 0 };
      agg[it.id].qty += it.qty; agg[it.id].rev += it.qty * it.price;
    }));
    const rows = Object.values(agg).sort((a, b) => b.qty - a.qty).slice(0, 6);
    const max = rows.length ? rows[0].qty : 1;
    el('#panel-top').innerHTML = `<h3>Beliebteste Produkte</h3>` + (rows.length ? rows.map(r => `
      <div class="bar-row">
        <span class="nm">${esc(r.name)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(r.qty / max * 100)}%"></div></div>
        <span class="vv">${r.qty}×</span>
      </div>`).join('') : `<p class="t-muted">Noch keine Verkäufe.</p>`);
  }

  function renderStatus() {
    const orders = BELL.getOrders();
    const counts = {}; BELL.STATUS.forEach(s => counts[s] = 0);
    orders.forEach(o => counts[o.status]++);
    el('#panel-status').innerHTML = `<h3>Operativer Überblick</h3>` + BELL.STATUS.map(s => `
      <div class="row between" style="padding:9px 0;border-bottom:1px solid var(--line)">
        <span class="row" style="gap:10px"><span class="pill s-${s} status-pill" style="font-size:11px;padding:3px 9px">${BELL.STATUS_SHORT[s]}</span></span>
        <strong class="num" style="font-size:var(--fs-md)">${counts[s]}</strong>
      </div>`).join('');
  }

  /* ---------- Warum Bell FastLane zur Bell-Welt passt ---------- */
  function renderWhy() {
    const elw = el('#panel-why'); if (!elw) return;
    const args = [
      ['⚡', 'Weniger Warteschlange', 'Mehr Bestellungen und Umsatz pro Stunde – Gäste bestellen schon in der Schlange.'],
      ['🔥', 'Bell-Qualität sichtbar', 'Frisch vom Grill, emotional inszeniert – die Bell-Welt digital erlebbar.'],
      ['📲', 'Kein App-Zwang', 'QR scannen, sofort bestellen – ohne Installation, ohne Login.'],
      ['💬', 'Direkte Kommunikation', 'Gast und Grillteam sprechen in Echtzeit – Sonderwünsche inklusive.'],
      ['📊', 'Volle Auswertung', 'Jedes Event digital messbar: Umsatz, Topseller, Durchlauf.']
    ];
    elw.innerHTML = `<h3>Warum Bell FastLane zur Bell-Welt passt</h3>` +
      args.map(a => `<div class="why-row"><span class="why-ic">${a[0]}</span><div class="why-tx"><b>${a[1]}</b><span>${esc(a[2])}</span></div></div>`).join('');
  }

  function renderEvents() {
    const cur = BELL.getSettings().eventId;
    el('#event-seg').innerHTML = Object.values(BELL.EVENTS).map(ev =>
      `<button class="${ev.id === cur ? 'active' : ''}" data-ev="${ev.id}">${esc(ev.name)}</button>`).join('');
    const ev = BELL.currentEvent();
    el('#admin-event-sub').textContent = '📍 ' + ev.name + ' · ' + ev.venue + ', ' + ev.city;
    const bon = BELL.getSettings().mode === 'bon';
    el('#event-info').innerHTML = `
      <div class="card pad" style="background:var(--surface-2)">
        <div class="row between"><strong>${esc(ev.venue)}, ${esc(ev.city)}</strong><span class="pill">${ev.products.length} Produkte</span></div>
        <p class="t-muted" style="font-size:var(--fs-sm);margin-top:8px">${esc(ev.tagline)}</p>
        <div style="margin-top:10px">${ev.stands.map(s => `<div class="row" style="gap:8px;padding:4px 0;font-size:var(--fs-sm)">${icon('pin')}<span><strong>${esc(s.name)}</strong> · <span class="t-muted">${esc(s.meta)}</span></span></div>`).join('')}</div>
        <div class="row between" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
          <span style="font-weight:700;font-size:var(--fs-sm)">Betriebsmodus</span>
          <span class="pill" style="font-weight:800">${bon ? '🎟️ Bon-System' : '💳 Digitale Zahlung'}</span>
        </div>
      </div>`;
  }

  function renderRecent() {
    const orders = BELL.getOrders().slice().sort((a, b) => b.createdAt - a.createdAt);
    el('#orders-count').textContent = orders.length + ' Bestellungen total';
    el('#recent').innerHTML = orders.slice(0, 10).map(o => `
      <div class="row between" style="padding:11px 0;border-bottom:1px solid var(--line);gap:var(--s-3)">
        <span class="row" style="gap:var(--s-4)">
          <strong style="color:var(--bell-red);min-width:48px">${esc(o.pickup)}</strong>
          <span>
            <span style="display:block;font-weight:600;font-size:var(--fs-sm)">${o.items.reduce((s, i) => s + i.qty, 0)} Artikel · ${esc(o.items.map(i => i.qty + '× ' + i.name).join(', '))}</span>
            <span class="t-muted" style="font-size:var(--fs-xs)">${(o.guestName ? '👤 ' + esc(o.guestName) + ' · ' : '') + (o.payMethod === 'bon' ? '🎟️ ' : '') + esc(PAY_LABEL[o.payMethod] || o.payLabel)} · ${BELL.timeAgo(o.createdAt)}${o.source === 'demo' ? ' · Walk-in' : ''}</span>
          </span>
        </span>
        <span class="row" style="gap:var(--s-3)">
          <strong class="num">${BELL.chf(o.total)}</strong>
          <span class="status-pill s-${o.status}" style="font-size:11px;padding:3px 9px">${BELL.STATUS_SHORT[o.status]}</span>
        </span>
      </div>`).join('') || '<p class="t-muted">Keine Bestellungen.</p>';
  }

  function renderQR() {
    const url = new URL('index.html', location.href).href;
    try {
      const qr = qrcode(0, 'M'); qr.addData(url); qr.make();
      el('#qr-target').innerHTML = qr.createSvgTag({ cellSize: 6, margin: 4, scalable: true });
      const svg = el('#qr-target svg'); if (svg) { svg.style.width = '100%'; svg.style.height = '100%'; }
    } catch (e) { el('#qr-target').textContent = 'QR'; }
    if (el('#qr-url')) el('#qr-url').textContent = url.replace(/^https?:\/\//, '');
    if (el('#qr-open')) el('#qr-open').href = url;
  }

  function animateCounts() {
    if (!window.gsap) return;
    els('#metrics .v').forEach(elm => {
      const txt = elm.textContent; const m = txt.match(/-?\d[\d.]*/);
      if (!m) return;
      const target = parseFloat(m[0]); if (isNaN(target)) return;
      const pre = txt.slice(0, m.index), post = txt.slice(m.index + m[0].length);
      const dec = m[0].indexOf('.') > -1 ? 2 : 0; const o = { v: 0 };
      window.gsap.to(o, { v: target, duration: 1, ease: 'power2.out', onUpdate: () => { elm.textContent = pre + o.v.toFixed(dec) + post; } });
    });
  }

  function render() {
    updateModeBtn();
    renderMetrics(); renderTop(); renderStatus(); renderEvents(); renderWhy(); renderRecent();
    if (!counted) { counted = true; animateCounts(); }
  }

  function makeDemoOrder() {
    const ev = BELL.currentEvent();
    const list = BELL.eventProducts();
    const stand = ev.stands[Math.floor(Math.random() * ev.stands.length)];
    const n = 1 + Math.floor(Math.random() * 3);
    const pool = list.slice().sort(() => Math.random() - 0.5).slice(0, n);
    const items = pool.map(p => ({ id: p.id, name: p.name, price: p.price, qty: 1 + Math.floor(Math.random() * 2) }));
    const sub = items.reduce((s, x) => s + x.price * x.qty, 0);
    const bon = BELL.getSettings().mode === 'bon';
    const pays = ['twint', 'applepay', 'googlepay', 'card', 'cash'];
    const pm = bon ? 'bon' : pays[Math.floor(Math.random() * pays.length)];
    const names = ['', 'Lena', 'Tobias', 'Sina', 'Marco', ''];
    let all = BELL.getOrders();
    if (all.length > 40) { const done = all.filter(o => o.status === 'done').sort((a, b) => a.createdAt - b.createdAt); if (done[0]) { all = all.filter(o => o.id !== done[0].id); localStorage.setItem(BELL.KEYS.orders, JSON.stringify(all)); } }
    BELL.createOrder({ eventId: ev.id, standId: stand.id, standName: stand.name, items, subtotal: sub, total: sub, payMethod: pm, payLabel: PAY_LABEL[pm], source: 'demo', guestName: names[Math.floor(Math.random() * names.length)] });
  }

  function presentTick() {
    const orders = BELL.getOrders();
    const active = orders.filter(o => o.status !== 'done');
    if (active.length < 7 && Math.random() < 0.65) {
      makeDemoOrder();
    } else if (active.length) {
      const o = active[Math.floor(Math.random() * active.length)];
      BELL.advanceStatus(o.id);
    }
  }
  function togglePresent() {
    presenting = !presenting;
    el('#btn-present').innerHTML = presenting ? '⏸ Präsentation stoppen' : '▶ Präsentationsmodus';
    el('#btn-present').classList.toggle('btn-primary', presenting);
    el('#btn-present').classList.toggle('btn-ghost', !presenting);
    if (presenting) { presentTimer = setInterval(presentTick, 4500); toast('Präsentationsmodus aktiv – Daten laufen automatisch', 'ok'); presentTick(); }
    else { clearInterval(presentTimer); toast('Präsentationsmodus gestoppt'); }
  }

  document.addEventListener('click', (e) => {
    const ev = e.target.closest('[data-ev]');
    if (ev) {
      BELL.setSettings({ eventId: ev.dataset.ev, standId: null });
      counted = false;
      render();
      toast('Event gewechselt: ' + BELL.currentEvent().name, 'ok');
    }
  });
  el('#btn-present').innerHTML = '▶ Präsentationsmodus';
  el('#btn-present').addEventListener('click', togglePresent);
  el('#btn-reset').addEventListener('click', () => {
    BELL.resetDemo();
    try { localStorage.removeItem('bellfl_mine_v1'); } catch (e) {}
    counted = false;
    render();
    toast('Demo-Daten zurückgesetzt', 'ok');
  });
  const mb = el('#btn-mode');
  if (mb) mb.addEventListener('click', () => {
    const m = BELL.getSettings().mode === 'bon' ? 'payment' : 'bon';
    BELL.setSettings({ mode: m });
    render();
    toast('Betriebsmodus: ' + (m === 'bon' ? '🎟️ Bon-System' : '💳 Digitale Zahlung'), 'ok', 2000);
  });

  BELL.onChange(render);
  renderQR();
  render();
  setInterval(render, 8000);
})();
