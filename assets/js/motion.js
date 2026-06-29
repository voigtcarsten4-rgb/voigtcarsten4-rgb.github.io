/* =====================================================================
   BELL FASTLANE — Premium Motion Layer (motion.js)
   Atmosphäre, Fly-to-Cart, Animations-Schalter, Mobile-Härtung,
   Original-Bell-Logo, App-Feel-Rundungen, visueller Status-Screen,
   Bestellablauf-Journey, Live-Updates. Rein visuell.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'bellfl_motion';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var on = (localStorage.getItem(KEY) || (reduce ? 'off' : 'on')) === 'on';

  function injectStyle() {
    if (document.getElementById('bellfx-style')) return;
    var css = ''
      + '.fx-embers{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}'
      + '.fx-ember{position:absolute;bottom:-14px;border-radius:50%;background:radial-gradient(circle,#ffe6bd,#ff7a1a 55%,rgba(255,122,26,0));filter:blur(.4px);opacity:0;animation:fxRise var(--d) linear var(--dl) infinite;will-change:transform,opacity}'
      + '@keyframes fxRise{0%{transform:translate3d(0,0,0) scale(1);opacity:0}12%{opacity:.95}85%{opacity:.5}100%{transform:translate3d(var(--dx),-66vh,0) scale(.35);opacity:0}}'
      + '.fx-heat{position:absolute;left:0;right:0;bottom:0;height:44%;z-index:1;pointer-events:none;background:linear-gradient(0deg,rgba(255,122,26,.13),transparent 72%);mix-blend-mode:screen;animation:fxHeat 5s ease-in-out infinite;will-change:opacity,transform}'
      + '@keyframes fxHeat{0%,100%{opacity:.4;transform:translateY(0)}50%{opacity:.8;transform:translateY(-3px)}}'
      + '.fx-sweep{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(105deg,transparent 32%,rgba(255,255,255,.10) 46%,rgba(255,255,255,.20) 50%,transparent 64%);transform:translateX(-120%)}'
      + '.fx-fly{position:fixed;z-index:300;pointer-events:none;border-radius:16px;overflow:hidden;box-shadow:0 16px 38px rgba(0,0,0,.38)}'
      + '.fx-fly img,.fx-fly svg{width:100%;height:100%;object-fit:cover;display:block}'
      + '.fx-mtoggle.off{opacity:.5}'
      + 'body.motion-off .fx-embers,body.motion-off .fx-heat,body.motion-off .fx-sweep{display:none!important}'
      + 'body.motion-off .hero-bg{animation:none!important;transform:scale(1.04)!important}'
      + 'body.motion-off .demo-flag .dot{animation:none!important}'
      + 'body.motion-off .ticket{animation:none!important}'
      + 'body.motion-off .tl-step.current .dot{animation:none!important}'
      // ---- Original Bell-Logo statt generischer Wortmarke ----
      + '.bell-mark{background:url("assets/img/bell-logo.svg") center/contain no-repeat!important;color:transparent!important;font-size:0!important;line-height:0!important;box-shadow:none!important;border-radius:0!important;padding:0!important;aspect-ratio:200/132;width:auto}'
      + '.bell-mark.sm{height:30px}.bell-mark.md{height:40px}.bell-mark.lg{height:62px}'
      // ---- App-Feel: rundere, taktilere Elemente ----
      + '.card{border-radius:22px}.btn{border-radius:16px}.btn-lg{border-radius:18px}.product{border-radius:20px}.pay-method{border-radius:18px}.metric,.panel,.kds-stat{border-radius:20px}.sheet{border-radius:28px 28px 0 0}'
      + '.btn{transition:transform .12s var(--ease),background .2s,box-shadow .2s}.btn:active{transform:scale(.97)}'
      // ---- Mobile-Härtung: kein Abschneiden ----
      + '.product .info,.cart-line>div,.ticket,.ticket .items,.metric,.panel,.kpi,.receipt,.row>*{min-width:0}'
      + '.product .info h3,.product .info .desc,.cart-line .nm{overflow:hidden;text-overflow:ellipsis}'
      + '.ticket .t-foot{flex-wrap:wrap}'
      + '.product .thumb img{transition:transform .5s cubic-bezier(.22,.61,.36,1)}'
      + '.product:hover .thumb img{transform:scale(1.07)}'
      + '@media(max-width:560px){'
      +   '.cat-bar{margin-left:calc(-1*var(--s-4));margin-right:calc(-1*var(--s-4))}'
      +   '.cat-scroll{padding-left:var(--s-4);padding-right:var(--s-4)}'
      +   '.product{grid-template-columns:82px 1fr auto;gap:12px;padding:12px}'
      +   '.product .thumb{width:82px;height:82px}'
      +   '.appbar .inner{gap:8px}.appbar .role-tag{display:none}'
      +   '.hero .inner{min-height:54vh}.metric .v{font-size:var(--fs-xl)}'
      +   '#recent .row span{min-width:0}'
      + '}'
      // ---- Visueller Status-Screen (App-Gefühl) ----
      + '.status-hero{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:24px 20px;border-radius:24px;color:#fff;position:relative;overflow:hidden;box-shadow:var(--sh-3)}'
      + '.status-hero .symwrap{width:108px;height:108px;border-radius:50%;background:rgba(255,255,255,.16);display:grid;place-items:center;margin-bottom:4px;box-shadow:0 12px 30px rgba(0,0,0,.18)}'
      + '.status-hero .symwrap img{width:74px;height:74px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.28))}'
      + '.status-hero .bl{font-size:22px;font-weight:900;letter-spacing:-.02em}'
      + '.status-hero .sl{font-size:13.5px;opacity:.95;max-width:32ch}'
      + '.sh-received{background:linear-gradient(160deg,#6B7A8F,#4d5969)}'
      + '.sh-prep,.sh-grill,.sh-almost{background:linear-gradient(160deg,#E2001A,#7E0010)}'
      + '.sh-ready{background:linear-gradient(160deg,#16A357,#0d6b39)}'
      + '.sh-done{background:linear-gradient(160deg,#9A938C,#6f6962)}'
      + '.status-hero.sh-ready .symwrap img{animation:walk 1.05s ease-in-out infinite}'
      + '@keyframes walk{0%,100%{transform:translateX(-3px) rotate(-3deg)}50%{transform:translateX(3px) rotate(3deg)}}'
      + 'body.motion-off .status-hero .symwrap img{animation:none!important}'
      + '.step-dots{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:14px}'
      + '.step-dots i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.4);transition:all .3s}'
      + '.step-dots i.done{background:#fff}'
      + '.step-dots i.cur{background:#fff;transform:scale(1.7);box-shadow:0 0 0 4px rgba(255,255,255,.25)}'
      // ---- Bestellablauf (Journey) ----
      + '.flow .flow-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}'
      + '.flow .flow-head h3{font-size:var(--fs-lg)}'
      + '.flow-live{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;color:var(--success);text-transform:uppercase;letter-spacing:.04em}'
      + '.flow-live .lv-dot{width:8px;height:8px;border-radius:50%;background:var(--success);animation:lvpulse 1.6s infinite}'
      + '@keyframes lvpulse{0%{box-shadow:0 0 0 0 rgba(21,146,78,.5)}70%{box-shadow:0 0 0 7px rgba(21,146,78,0)}100%{box-shadow:0 0 0 0 rgba(21,146,78,0)}}'
      + '.flow-step{position:relative;display:flex;align-items:center;gap:14px;padding:9px 0}'
      + '.flow-step:not(:last-child)::after{content:"";position:absolute;left:22px;top:48px;bottom:-9px;width:2px;background:var(--line-2)}'
      + '.flow-step.done:not(:last-child)::after{background:var(--success)}'
      + '.fs-ico{width:46px;height:46px;border-radius:50%;flex:none;display:grid;place-items:center;background:var(--surface-2);box-shadow:inset 0 0 0 2px var(--line);transition:transform .3s,box-shadow .3s,background .3s;position:relative;z-index:1}'
      + '.fs-ico img{width:30px;height:30px;opacity:.45;transition:opacity .3s}'
      + '.flow-step.done .fs-ico{background:var(--success-bg);box-shadow:inset 0 0 0 2px var(--success)}'
      + '.flow-step.done .fs-ico img{opacity:.9}'
      + '.flow-step.cur .fs-ico{background:#fff;box-shadow:0 0 0 3px var(--bell-red),0 8px 18px rgba(226,0,26,.25);transform:scale(1.07)}'
      + '.flow-step.cur .fs-ico img{opacity:1}'
      + '.flow-step.cur .fs-ico img[src*="sym-pickup"]{animation:walk 1.05s ease-in-out infinite}'
      + '.fs-body{display:flex;flex-direction:column;min-width:0}'
      + '.fs-body b{font-size:var(--fs-md);font-weight:800}'
      + '.fs-body span{font-size:var(--fs-sm);color:var(--ink-2)}'
      + '.flow-step.todo .fs-body b{color:var(--ink-3)}'
      + '.flow-step.todo .fs-body span{color:var(--ink-3)}'
      + '.fs-mark{margin-left:auto;color:var(--success);display:grid;place-items:center;width:24px;height:24px;flex:none}'
      + '.fs-mark svg{width:20px;height:20px}'
      + '.fs-pulse{width:11px;height:11px;border-radius:50%;background:var(--bell-red);animation:lvpulse 1.5s infinite}'
      + 'body.motion-off .flow-step .fs-ico img{animation:none!important}'
      + 'body.motion-off .flow-live .lv-dot,body.motion-off .fs-pulse{animation:none!important}'
      // live "just advanced" pop
      + '.status-hero.just{animation:pop .6s var(--ease)}'
      + '.flow-step.just .fs-ico{animation:pop .6s var(--ease)}'
      + '@keyframes pop{0%{transform:scale(1)}30%{transform:scale(1.14)}100%{transform:scale(1)}}'
      + 'body.motion-off .status-hero.just,body.motion-off .flow-step.just .fs-ico{animation:none!important}'
      // system message (indirekte Kommunikation Crew → Gast)
      + '.sys-msg{display:block;max-width:92%;text-align:center;background:var(--surface-2);color:var(--ink-2);font-size:12.5px;font-weight:600;padding:7px 14px;border-radius:14px;margin:6px auto;border:1px solid var(--line)}'
      + '.sys-msg .tm{display:block;font-size:10px;color:var(--ink-3);font-weight:500;margin-top:1px}'
      // crew ticket stage symbol
      + '.t-stage{display:flex;align-items:center;gap:8px;margin:2px 0 4px}'
      + '.tk-sym{width:26px;height:26px;flex:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.15))}'
      // ---- Crew-Wartezeit-Ampel ----
      + '.ticket.urge-warn{box-shadow:0 0 0 2px var(--warn),var(--sh-2)}'
      + '.ticket.urge-late{box-shadow:0 0 0 2px var(--bell-red),var(--sh-2);animation:urgePulse 1.7s infinite}'
      + '@keyframes urgePulse{0%{box-shadow:0 0 0 0 rgba(226,0,26,.45),var(--sh-2)}70%{box-shadow:0 0 0 9px rgba(226,0,26,0),var(--sh-2)}100%{box-shadow:0 0 0 0 rgba(226,0,26,0),var(--sh-2)}}'
      + 'body.motion-off .ticket.urge-late{animation:none}'
      + '.wait-badge{font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;margin-left:8px}'
      + '.wait-badge.ok{background:var(--success-bg);color:var(--success)}'
      + '.wait-badge.warn{background:#FFF1DE;color:var(--warn)}'
      + '.wait-badge.late{background:rgba(226,0,26,.12);color:var(--bell-red)}';
    var s = document.createElement('style'); s.id = 'bellfx-style'; s.textContent = css;
    document.head.appendChild(s);
  }

  function apply() { document.body.classList.toggle('motion-off', !on); }

  function clearHero() {
    ['fx-embers', 'fx-heat', 'fx-sweep'].forEach(function (c) {
      var n = document.querySelector('.hero .' + c); if (n) n.remove();
    });
  }
  function buildHero() {
    var hero = document.querySelector('.hero'); if (!hero) return;
    clearHero();
    if (!on) return;
    var heat = document.createElement('div'); heat.className = 'fx-heat'; hero.appendChild(heat);
    var em = document.createElement('div'); em.className = 'fx-embers';
    for (var i = 0; i < 16; i++) {
      var e = document.createElement('span'); e.className = 'fx-ember';
      var size = 3 + Math.random() * 5;
      e.style.left = (Math.random() * 100) + '%';
      e.style.width = size + 'px'; e.style.height = size + 'px';
      e.style.setProperty('--d', (4 + Math.random() * 5).toFixed(2) + 's');
      e.style.setProperty('--dl', (-Math.random() * 7).toFixed(2) + 's');
      e.style.setProperty('--dx', (Math.random() * 44 - 22).toFixed(0) + 'px');
      em.appendChild(e);
    }
    hero.appendChild(em);
    if (window.gsap) {
      var sw = document.createElement('div'); sw.className = 'fx-sweep'; hero.appendChild(sw);
      window.gsap.fromTo(sw, { x: '-120%' }, { x: '120%', duration: 1.5, ease: 'power2.inOut', delay: .35, onComplete: function () { sw.remove(); } });
    }
  }

  function intro() {
    if (!on || !window.gsap) return;
    try { window.gsap.from('.appbar .inner > *', { y: -12, opacity: 0, stagger: .05, duration: .4, ease: 'power2.out' }); } catch (e) {}
    var hero = ['.hero .kicker', '.hero h1', '.hero .lead', '.hero .loc', '.hero .cta'].map(function (s) { return document.querySelector(s); }).filter(Boolean);
    if (hero.length) { try { window.gsap.from(hero, { y: 20, opacity: 0, stagger: .09, duration: .55, ease: 'power3.out', delay: .1 }); } catch (e) {} }
  }

  function flyToCart(srcEl) {
    if (!on || !srcEl || !window.gsap) return;
    var r = srcEl.getBoundingClientRect(); if (!r.width) return;
    var ghost = srcEl.cloneNode(true); ghost.className = 'fx-fly';
    ghost.style.left = r.left + 'px'; ghost.style.top = r.top + 'px';
    ghost.style.width = r.width + 'px'; ghost.style.height = r.height + 'px';
    document.body.appendChild(ghost);
    var bar = document.getElementById('cartbar');
    var tx = window.innerWidth / 2, ty = window.innerHeight - 54;
    if (bar) { var br = bar.getBoundingClientRect(); if (br.width) { tx = br.left + br.width / 2; ty = br.top + br.height / 2; } }
    window.gsap.to(ghost, { left: tx - 17, top: ty - 17, width: 34, height: 34, opacity: .25, rotation: 16, duration: .72, ease: 'power2.in', onComplete: function () { ghost.remove(); } });
    var bag = document.getElementById('cart-count');
    if (bag) window.gsap.fromTo(bag, { scale: 1 }, { scale: 1.35, duration: .18, yoyo: true, repeat: 1, ease: 'power2.out', delay: .55 });
  }

  function buildToggle() {
    document.querySelectorAll('.appbar .inner').forEach(function (inner) {
      if (inner.querySelector('[data-fxtoggle]')) return;
      var b = document.createElement('button');
      b.className = 'icon-btn fx-mtoggle' + (on ? '' : ' off');
      b.setAttribute('data-fxtoggle', ''); b.setAttribute('aria-label', 'Animationen an/aus');
      b.setAttribute('title', 'Animationen an/aus'); b.setAttribute('aria-pressed', String(on));
      b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.6 4.6L18 8l-4.4 1.4L12 14l-1.6-4.6L6 8l4.4-1.4L12 2Z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/></svg>';
      var demo = inner.querySelector('.demo-flag');
      if (demo) inner.insertBefore(b, demo); else inner.appendChild(b);
    });
  }

  function setOn(v) {
    on = v; localStorage.setItem(KEY, on ? 'on' : 'off');
    apply(); buildHero();
    document.querySelectorAll('[data-fxtoggle]').forEach(function (b) { b.classList.toggle('off', !on); b.setAttribute('aria-pressed', String(on)); });
    if (window.UI && UI.toast) UI.toast(on ? 'Animationen an' : 'Animationen aus', 'ok', 1200);
  }

  document.addEventListener('click', function (e) {
    var tg = e.target.closest && e.target.closest('[data-fxtoggle]');
    if (tg) { setOn(!on); return; }
    var add = e.target.closest && e.target.closest('[data-act="add"], [data-act="inc"]');
    if (add) { var prod = add.closest('.product'); if (prod) { var thumb = prod.querySelector('.thumb'); flyToCart(thumb); } }
  }, true);

  function boot() { injectStyle(); apply(); buildToggle(); buildHero(); intro(); }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);

  window.BellFX = { flyToCart: flyToCart, setOn: setOn, rebuildHero: buildHero };
})();
