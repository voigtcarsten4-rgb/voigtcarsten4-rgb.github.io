/* =====================================================================
   BELL FASTLANE — Shared UI helpers (Icons, Toasts, DOM, Logos)
   ===================================================================== */
(function (global) {
  'use strict';

  /* Inline SVG icon set (stroke-based, 24x24) */
  const P = {
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft:  '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    check:      '<path d="M20 6 9 17l-5-5"/>',
    clock:      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    flame:      '<path d="M12 3c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.5-2-1-3 2 1 3 3 3 6a8 8 0 0 1-16 0c0-4 3-6 5-8 .5 1 1.5 1 3-2Z"/>',
    chat:       '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z"/>',
    plus:       '<path d="M12 5v14M5 12h14"/>',
    minus:      '<path d="M5 12h14"/>',
    close:      '<path d="M18 6 6 18M6 6l12 12"/>',
    pin:        '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    info:       '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    bag:        '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    receipt:    '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/>',
    star:       '<path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3Z"/>',
    refresh:    '<path d="M21 12a9 9 0 1 1-3-6.7L21 7"/><path d="M21 3v4h-4"/>',
    bell:       '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    user:       '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
    send:       '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/>',
    trash:      '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
    bolt:       '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    grid:       '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    cash:       '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
    chevR:      '<path d="m9 6 6 6-6 6"/>',
    qr:         '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 21v.01M17 21h.01M21 17h.01"/>',
    money:      '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    users:      '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><path d="M16 5a3.5 3.5 0 0 1 0 7M22 20c0-3-2-5-5-5.5"/>',
    pkg:        '<path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"/><path d="M3 7l9 5 9-5M12 12v10"/>'
  };

  function icon(name, cls) {
    const body = P[name] || '';
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  /* Payment brand lockups (vereinfachte Demo-Darstellung) */
  function payLogo(method) {
    const L = {
      twint: '<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" height="26"><rect width="120" height="40" rx="8" fill="#000"/><text x="14" y="27" font-family="Arial" font-weight="800" font-size="20" fill="#fff">TWINT</text><circle cx="98" cy="20" r="9" fill="#1A8FE3"/><circle cx="108" cy="20" r="9" fill="#E2001A" opacity=".85"/></svg>',
      applepay: '<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" height="26"><rect width="120" height="40" rx="8" fill="#000"/><text x="60" y="27" font-family="-apple-system,Arial" font-weight="600" font-size="18" fill="#fff" text-anchor="middle"> Pay</text><path d="M30 14c-1 0-2 .6-2.6 1.4-.5.7-1 1.8-.8 2.8 1 .1 2-.5 2.6-1.3.6-.8 1-1.8.8-2.9Z" fill="#fff"/></svg>',
      googlepay: '<svg viewBox="0 0 130 40" xmlns="http://www.w3.org/2000/svg" height="26"><rect width="130" height="40" rx="8" fill="#fff" stroke="#DADCE0"/><text x="20" y="26" font-family="Arial" font-weight="700" font-size="17"><tspan fill="#4285F4">G</tspan><tspan fill="#EA4335">o</tspan><tspan fill="#FBBC05">o</tspan><tspan fill="#4285F4">g</tspan><tspan fill="#34A853">l</tspan><tspan fill="#EA4335">e</tspan></text><text x="78" y="26" font-family="Arial" font-weight="500" font-size="17" fill="#5F6368">Pay</text></svg>',
      card: '<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" height="26"><rect width="120" height="40" rx="8" fill="#1A1413"/><rect x="14" y="13" width="40" height="6" rx="2" fill="#FFB066"/><rect x="14" y="23" width="22" height="4" rx="2" fill="#fff" opacity=".7"/><circle cx="96" cy="20" r="9" fill="#E2001A"/><circle cx="106" cy="20" r="9" fill="#FF7A1A" opacity=".85"/></svg>',
      cash: '<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" height="26"><rect width="120" height="40" rx="8" fill="#15924E"/><text x="60" y="26" font-family="Arial" font-weight="800" font-size="16" fill="#fff" text-anchor="middle">BAR · CHF</text></svg>'
    };
    return L[method] || '';
  }

  /* DOM helper */
  function el(sel, root) { return (root || document).querySelector(sel); }
  function els(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, m => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
    ));
  }

  /* Toast */
  let toastWrap;
  function toast(msg, type, ms) {
    if (!toastWrap) {
      toastWrap = document.createElement('div');
      toastWrap.className = 'toast-wrap';
      document.body.appendChild(toastWrap);
    }
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    const ic = type === 'ok' ? icon('check') : type === 'warn' ? icon('info') : icon('bell');
    t.innerHTML = ic + '<span>' + esc(msg) + '</span>';
    toastWrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 320); }, ms || 2200);
  }

  /* Haptic-ish micro feedback (vibrate if available) */
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) {} }

  global.UI = { icon, payLogo, el, els, esc, toast, buzz };

})(window);
