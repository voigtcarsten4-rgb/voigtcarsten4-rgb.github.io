/* =====================================================================
   BELL FASTLANE — Premium Motion Layer (motion.js)
   Atmosphäre (Glut/Hitze/Intro), Fly-to-Cart, Animations-Schalter
   + Mobile-Härtung (verhindert abgeschnittene Kacheln) + Bild-Zoom
   + Crew-Ampel-Styles. Rein visuell, greift nicht in die Logik ein.
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
      window.gsap.fromTo(sw, { x: '-120%' }, { x: '120%', duration: 1.5, ease: 'power2.inOut', delay: .35,
        onComplete: function () { sw.remove(); } });
    }
  }

  function intro() {
    if (!on || !window.gsap) return;
    try { window.gsap.from('.appbar .inner > *', { y: -12, opacity: 0, stagger: .05, duration: .4, ease: 'power2.out' }); } catch (e) {}
    var hero = ['.hero .kicker', '.hero h1', '.hero .lead', '.hero .loc', '.hero .cta']
      .map(function (s) { return document.querySelector(s); }).filter(Boolean);
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
