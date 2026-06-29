/* =====================================================================
   BELL FASTLANE — Crew / Kasse (Kitchen Display System)
   ===================================================================== */
(function () {
  'use strict';
  const { el, els, esc, icon, toast, buzz } = UI;

  const COLS = [
    { key: 'new',   title: 'Neu',          statuses: ['received'] },
    { key: 'work',  title: 'In Arbeit',    statuses: ['prep', 'grill', 'almost'] },
    { key: 'ready', title: 'Abholbereit',  statuses: ['ready'] },
    { key: 'done',  title: 'Abgeschlossen', statuses: ['done'] }
  ];
  const NEXT_LABEL = { received: 'Annehmen', prep: 'Auf den Grill 🔥', grill: 'Fast fertig', almost: 'Abholbereit', ready: 'Abschliessen' };
  const TCLASS = { received: '', prep: 't-prep', grill: 't-grill', almost: 't-almost', ready: 't-ready', done: '' };
  const PAY_LABEL = { twint: 'TWINT', applepay: 'Apple Pay', googlepay: 'Google Pay', card: 'Kreditkarte', cash: 'Bar' };
  const STAFF_QUICK = ['Alles klar 👍', 'In ~5 Min bereit', 'Ohne Zwiebeln – notiert', 'Bitte vorne abholen', 'Gerne, kannst du ergänzen'];

  const seen = new Set();
  let drawerId = null;

  function isToday(ts) { const d = new Date(ts), n = new Date(); return d.toDateString() === n.toDateString(); }
  function lastGuestMsg(o) { const g = (o.messages || []).filter(m => m.from === 'guest'); return g.length ? g[g.length - 1] : null; }

  /* ---------- Render board ---------- */
  function render() {
    const ev = BELL.currentEvent();
    el('#staff-event').textContent = '📍 ' + ev.name;
    const orders = BELL.getOrders();

    const nNew = orders.filter(o => o.status === 'received').length;
    const nWork = orders.filter(o => ['prep', 'grill', 'almost'].includes(o.status)).length;
    const nReady = orders.filter(o => o.status === 'ready').length;
    const rev = orders.filter(o => isToday(o.createdAt)).reduce((s, o) => s + o.total, 0);
    el('#st-new').textContent = nNew;
    el('#st-work').textContent = nWork;
    el('#st-ready').textContent = nReady;
    el('#st-rev').textContent = 'CHF ' + rev.toFixed(0);

    el('#board').innerHTML = COLS.map(col => {
      let items = orders.filter(o => col.statuses.includes(o.status));
      if (col.key === 'done') items = items.sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
      else items = items.sort((a, b) => a.createdAt - b.createdAt);
      return `<div class="kds-col ${col.key === 'work' ? 'col-grill' : ''}">
        <div class="col-head"><h3>${col.title}</h3><span class="cnt">${items.length}</span></div>
        ${items.length ? items.map(ticket).join('') : `<div class="kds-empty">Keine Bestellungen</div>`}
      </div>`;
    }).join('');

    orders.forEach(o => seen.add(o.id));
    if (drawerId && el('#drawer').classList.contains('show')) renderDrawer();
  }

  function ticket(o) {
    const note = lastGuestMsg(o);
    const isNew = !seen.has(o.id);
    const unread = o.unreadStaff > 0;
    return `<div class="ticket ${TCLASS[o.status]} ${unread ? 'has-unread' : ''}" ${isNew ? 'style="animation:rise .35s var(--ease)"' : ''}>
      <div class="t-top">
        <span class="pno">${esc(o.pickup)}</span>
        <span class="ago">${BELL.timeAgo(o.createdAt)}</span>
      </div>
      <span class="status-pill s-${o.status}" style="font-size:11px;padding:3px 9px">${BELL.STATUS_SHORT[o.status]}</span>
      <div class="items">
        ${o.items.map(it => `<div class="it"><b>${it.qty}×</b><span>${esc(it.name)}</span></div>`).join('')}
      </div>
      ${note ? `<div class="note">${icon('chat')}<span>${esc(note.text)}</span></div>` : ''}
      <div class="t-foot">
        <span class="pay-tag">${icon('money')} ${esc(PAY_LABEL[o.payMethod] || o.payLabel)}</span>
        <button class="btn btn-ghost btn-sm" data-act="chat" data-id="${o.id}" aria-label="Chat">
          ${icon('chat')}${unread ? `<span style="background:var(--bell-red);color:#fff;border-radius:999px;padding:0 6px;font-size:11px">${o.unreadStaff}</span>` : ''}
        </button>
        ${o.status !== 'received' && o.status !== 'done' ? `<button class="btn btn-ghost btn-sm" data-act="revert" data-id="${o.id}" title="Schritt zurück">↶</button>` : ''}
        ${o.status !== 'done' ? `<button class="btn btn-primary btn-sm adv" data-act="advance" data-id="${o.id}">${NEXT_LABEL[o.status]} ${icon('arrowRight')}</button>` : `<span class="adv pill" style="font-size:11px">${icon('check')} Erledigt</span>`}
      </div>
    </div>`;
  }

  /* ---------- Drawer (chat) ---------- */
  function openDrawer(id) {
    drawerId = id;
    BELL.markRead(id, 'staff');
    el('#scrim').classList.add('show');
    el('#drawer').classList.add('show');
    renderDrawer();
    render();
  }
  function closeDrawer() {
    el('#drawer').classList.remove('show');
    el('#scrim').classList.remove('show');
    drawerId = null;
  }
  function renderDrawer() {
    const o = BELL.getOrder(drawerId);
    if (!o) { closeDrawer(); return; }
    el('#drawer-pickup').textContent = o.pickup + ' · ' + o.standName;
    const log = (o.messages || []).map(m =>
      `<div class="bubble ${m.from === 'staff' ? 'me' : 'them'}">${esc(m.text)}<span class="tm">${m.from === 'staff' ? 'Crew' : 'Gast'} · ${BELL.clock(m.ts)}</span></div>`
    ).join('') || `<div class="t-muted center" style="font-size:var(--fs-sm);padding:var(--s-5)">Noch keine Nachrichten zu dieser Bestellung.</div>`;
    el('#drawer-body').innerHTML = `<div class="chat-log" style="max-height:none">${log}</div>`;
    el('#staff-quick').innerHTML = STAFF_QUICK.map(q => `<button class="qm" data-staffquick="${esc(q)}">${esc(q)}</button>`).join('');
    const b = el('#drawer-body .chat-log'); if (b) b.scrollTop = b.scrollHeight;
  }
  function staffSend(text) {
    if (!drawerId || !text.trim()) return;
    BELL.addMessage(drawerId, 'staff', text.trim());
    renderDrawer(); render();
    toast('Antwort gesendet', 'ok', 1400);
  }

  /* ---------- Demo walk-in order ---------- */
  function makeDemoOrder() {
    const ev = BELL.currentEvent();
    const list = BELL.eventProducts();
    const stand = ev.stands[0];
    const n = 1 + Math.floor(Math.random() * 3);
    const pool = list.slice().sort(() => Math.random() - 0.5).slice(0, n);
    const items = pool.map(p => ({ id: p.id, name: p.name, price: p.price, qty: 1 + Math.floor(Math.random() * 2) }));
    const sub = items.reduce((s, x) => s + x.price * x.qty, 0);
    const pays = ['twint', 'applepay', 'googlepay', 'card', 'cash'];
    const pm = pays[Math.floor(Math.random() * pays.length)];
    BELL.createOrder({ eventId: ev.id, standId: stand.id, standName: stand.name, items, subtotal: sub, total: sub, payMethod: pm, payLabel: PAY_LABEL[pm], source: 'demo' });
    toast('Walk-in-Bestellung erstellt', 'ok', 1500);
    buzz(20);
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]');
    if (a) {
      const id = a.dataset.id;
      if (a.dataset.act === 'advance') {
        const o = BELL.getOrder(id); const before = o.status;
        const updated = BELL.advanceStatus(id);
        toast(o.pickup + ' → ' + BELL.STATUS_SHORT[updated.status], 'ok', 1500); buzz(14);
      } else if (a.dataset.act === 'revert') {
        const o = BELL.getOrder(id); const i = BELL.STATUS.indexOf(o.status);
        if (i > 0) { BELL.setStatus(id, BELL.STATUS[i - 1]); }
      } else if (a.dataset.act === 'chat') {
        openDrawer(id);
      }
      return;
    }
    const q = e.target.closest('[data-staffquick]');
    if (q) { staffSend(q.dataset.staffquick); return; }
    if (e.target.id === 'scrim') closeDrawer();
  });

  el('#drawer-close').innerHTML = icon('close');
  el('#drawer-close').addEventListener('click', closeDrawer);
  el('#staff-send').innerHTML = icon('send');
  el('#staff-send').addEventListener('click', () => { const i = el('#staff-msg'); staffSend(i.value); i.value = ''; });
  el('#staff-msg').addEventListener('keydown', (e) => { if (e.key === 'Enter') { staffSend(e.target.value); e.target.value = ''; } });
  el('#btn-demo-order').innerHTML = icon('plus') + 'Walk-in (Demo)';
  el('#btn-demo-order').addEventListener('click', makeDemoOrder);

  BELL.onChange(render);
  render();
  setInterval(render, 10000); // refresh "vor X Min"
})();
