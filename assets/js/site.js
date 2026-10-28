/* Green Mother Foundation: shared behaviour. No dependencies. Everything here is progressive enhancement. */
(function () {
  var d = document, root = d.documentElement;
  root.classList.remove('no-js'); root.classList.add('js');
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Programs flyout (desktop) ---------- */
  var flyBtn = $('.fly-btn'), fly = $('#flyout'), hdr = $('.hdr');
  function solid() { if (hdr) hdr.classList.toggle('solid', window.scrollY > 40 || (fly && !fly.hidden)); }
  window.addEventListener('scroll', solid, { passive: true }); solid();
  function setFly(open) {
    if (!flyBtn || !fly) return;
    flyBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    fly.hidden = !open; solid();
  }
  if (flyBtn && fly) {
    flyBtn.addEventListener('click', function () { setFly(fly.hidden); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !fly.hidden) { setFly(false); flyBtn.focus(); } });
    d.addEventListener('click', function (e) { if (!fly.hidden && !fly.contains(e.target) && !flyBtn.contains(e.target)) setFly(false); });
    fly.addEventListener('focusout', function (e) { if (e.relatedTarget && !fly.contains(e.relatedTarget) && !flyBtn.contains(e.relatedTarget)) setFly(false); });
  }

  /* ---------- Phone menu ---------- */
  var mBtn = $('.menu-btn'), mMenu = $('#mmenu'), mClose = $('#mmenu-close');
  if (mBtn && mMenu) {
    var lastFocus;
    var focusables = function () { return $$('a[href],button:not([disabled])', mMenu); };
    var openMenu = function () {
      lastFocus = d.activeElement; mMenu.hidden = false; mBtn.setAttribute('aria-expanded', 'true');
      d.body.style.overflow = 'hidden'; mClose.focus();
    };
    var closeMenu = function () {
      mMenu.hidden = true; mBtn.setAttribute('aria-expanded', 'false'); d.body.style.overflow = '';
      (lastFocus || mBtn).focus();
    };
    mBtn.addEventListener('click', openMenu);
    mClose.addEventListener('click', closeMenu);
    mMenu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    $$('a', mMenu).forEach(function (a) { a.addEventListener('click', function () { d.body.style.overflow = ''; }); });
    window.matchMedia('(min-width:1100px)').addEventListener('change', function (m) { if (m.matches && !mMenu.hidden) closeMenu(); });
  }

  /* ---------- Pause background animation ---------- */
  var pause = $('#pause-motion');
  if (pause) {
    var paused = store.get('gmf-paused') === '1';
    var apply = function () {
      pause.setAttribute('aria-pressed', paused ? 'true' : 'false');
      root.setAttribute('data-motion', paused ? 'paused' : 'on');
      window.dispatchEvent(new CustomEvent('gmf:motion', { detail: { paused: paused } }));
    };
    pause.addEventListener('click', function () { paused = !paused; store.set('gmf-paused', paused ? '1' : '0'); apply(); });
    apply();
  }

  /* ---------- Gallery filter ---------- */
  var gal = $('#gallery-grid');
  if (gal) {
    var chips = $$('.fchip[data-cat]'), count = $('#gallery-count'), items = $$('figure', gal);
    var show = function (cat) {
      var n = 0;
      items.forEach(function (f) { var on = cat === 'All' || f.getAttribute('data-cat') === cat; f.hidden = !on; if (on) n++; });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-cat') === cat ? 'true' : 'false'); });
      if (count) count.textContent = 'Showing ' + n + ' of ' + items.length + ' photos';
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { show(c.getAttribute('data-cat')); }); });
    show('All');
  }

  /* ---------- Get help: form tabs ---------- */
  var tabs = $$('.tab[data-form]');
  if (tabs.length) {
    var sets = $$('.formset');
    var pick = function (k, focus) {
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', t.getAttribute('data-form') === k ? 'true' : 'false'); });
      sets.forEach(function (s) { s.hidden = s.getAttribute('data-form') !== k; });
      if (focus) { var h = $('.formset:not([hidden]) h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { pick(t.getAttribute('data-form'), true); }); });
    var want = (location.hash || '').replace('#', '');
    pick(tabs.some(function (t) { return t.getAttribute('data-form') === want; }) ? want : tabs[0].getAttribute('data-form'), false);
  }

  /* ---------- Forms: validation, error summary, sending ---------- */
  var ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B3261E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 16.5v.5"/></svg>';
  function labelOf(el) { var l = $('label[for="' + el.id + '"]'); return l ? l.firstChild.textContent.trim() : 'This field'; }
  function check(el) {
    var v = (el.value || '').trim(), t = el.type;
    if (el.getAttribute('aria-required') !== 'true') {
      if (t === 'tel' && v && !/^\d{10}$/.test(v.replace(/[\s-]/g, ''))) return 'Enter a 10-digit mobile number. You have entered ' + v.replace(/\D/g, '').length + ' digits.';
      if (t === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter an email address like name@example.com.';
      return '';
    }
    if (t === 'checkbox') return el.checked ? '' : 'Tick the box to agree, so we can contact you.';
    if (el.tagName === 'SELECT') return v ? '' : 'Choose one option from the list.';
    if (!v) return t === 'tel' ? 'Enter your 10-digit mobile number.' : t === 'email' ? 'Enter your email address.' : 'Fill in ' + labelOf(el).toLowerCase() + '.';
    if (t === 'tel') { var digits = v.replace(/[\s-]/g, ''); if (!/^\d{10}$/.test(digits)) return 'Enter a 10-digit mobile number. You have entered ' + v.replace(/\D/g, '').length + ' digits.'; }
    if (t === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter an email address like name@example.com.';
    return '';
  }
  function setErr(el, msg) {
    var box = $('#' + el.id + '-err');
    if (msg) { el.setAttribute('aria-invalid', 'true'); box.innerHTML = ICON + '<span></span>'; box.lastChild.textContent = msg; box.hidden = false; }
    else { el.removeAttribute('aria-invalid'); box.hidden = true; box.textContent = ''; }
    return msg;
  }
  $$('form[data-kind]').forEach(function (form) {
    var summary = $('.summary', form), status = $('.form-status', form), fields = $$('.fld,input[type=checkbox]', form).filter(function (e) { return e.type !== 'file'; });
    fields.forEach(function (el) { el.addEventListener('blur', function () { if (el.getAttribute('aria-invalid') === 'true' || el.value) setErr(el, check(el)); }); el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') setErr(el, check(el)); }); });
    var file = $('input[type=file]', form), fileWarn = $('.file-warn', form);
    if (file) file.addEventListener('change', function () {
      var big = file.files[0] && file.files[0].size > 5 * 1024 * 1024;
      if (big) { file.value = ''; fileWarn.hidden = false; } else fileWarn.hidden = true;
    });
    function note(kind, title, text) {
      status.className = 'note ' + kind + ' form-status';
      status.innerHTML = '<span></span>'; status.firstChild.innerHTML = '<strong></strong> <span></span>';
      status.firstChild.firstChild.textContent = title; status.firstChild.lastChild.textContent = text;
      status.hidden = false; status.setAttribute('tabindex', '-1'); status.focus();
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); status.hidden = true;
      var bad = [];
      fields.forEach(function (el) { var m = setErr(el, check(el)); if (m) bad.push({ el: el, msg: m }); });
      if (bad.length) {
        summary.hidden = false; var ul = $('ul', summary); ul.textContent = '';
        bad.forEach(function (b) { var li = d.createElement('li'), a = d.createElement('a'); a.href = '#' + b.el.id; a.textContent = labelOf(b.el) + ': ' + b.msg; a.addEventListener('click', function (ev) { ev.preventDefault(); b.el.focus(); }); li.appendChild(a); ul.appendChild(li); });
        $('h3', summary).textContent = bad.length === 1 ? 'There is 1 thing to fix' : 'There are ' + bad.length + ' things to fix';
        summary.setAttribute('tabindex', '-1'); summary.focus(); return;
      }
      summary.hidden = true;
      var cfg = window.GMF_CONFIG || {};
      if (!cfg.formEndpoint) { note('warn', 'Not sent yet.', 'This form is not connected, so your details were not sent. Please phone the office instead: [OFFICE PHONE].'); return; }
      var btn = $('button[type=submit]', form); btn.disabled = true;
      fetch(cfg.formEndpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); location.href = cfg.thanksPage || 'thanks.html'; })
        .catch(function () { btn.disabled = false; note('err', 'Your request was not sent.', 'Something went wrong on our side. Please try again, or phone [OFFICE PHONE].'); });
    });
  });

  /* hero video: honour reduced motion, pause when off screen */
  var hv = document.getElementById('herovid');
  if (hv) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { hv.removeAttribute('autoplay'); hv.pause(); }
    else if ('IntersectionObserver' in window) { new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { hv.play().catch(function () {}); } else { hv.pause(); } }); }).observe(hv); }
  }

  /* section videos: play when in view (muted, looped), pause when out; visible controls let people pause */
  var vs = $$('.vbox video');
  if (vs.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        var v = x.target;
        if (x.isIntersecting && !v._userPaused) { v.play().catch(function () {}); }
        else if (!x.isIntersecting && !v.paused) { v._autoPause = true; v.pause(); }
      });
    }, { threshold: 0.5 });
    vs.forEach(function (v) {
      v.muted = true;
      v.addEventListener('pause', function () { if (v._autoPause) { v._autoPause = false; } else if (!v.ended) { v._userPaused = true; } });
      v.addEventListener('play', function () { v._userPaused = false; });
      io.observe(v);
    });
  }

  /* ---------- Blur reveal on scroll ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var sel = 'h1,h2,h3,h4,p,blockquote,.card,article,figure,.pimg,.video,form,details.faq,.btn,.lnk,.chip,.tag,.eyebrow,li,.stat,dl,ol.steps';
    var all = $$(sel, $('main')).filter(function (e) { return !e.closest('[hidden]'); });
    var targets = all.filter(function (e) {
      var up = e.parentElement && e.parentElement.closest(sel);
      return !(up && up.closest('main') && up !== e && all.indexOf(up) > -1) && !e.closest('.vnote');
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    var seen = new Map();
    targets.forEach(function (e) {
      var par = e.parentElement, i = seen.get(par) || 0; seen.set(par, i + 1);
      e.style.setProperty('--d', Math.min(i, 6) * 0.08 + 's');
      e.classList.add('rv'); io.observe(e);
    });
  }
  root.classList.add('rv-ready');
  if (!location.hash) window.scrollTo(0, 0);

  /* ---------- Page exit: fade out before switching pages ---------- */
  if (!reduce) {
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute('download')) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || u.pathname === location.pathname) return;
      e.preventDefault(); root.classList.add('leaving');
      setTimeout(function () { window.scrollTo(0, 0); location.href = a.href; }, 160);
    });
    window.addEventListener('pageshow', function () { root.classList.remove('leaving'); });
  }

  /* ---------- Video placeholder ---------- */
  var vp = $('.vplay');
  if (vp) vp.addEventListener('click', function () { var n = $('.vnote'); if (n) { n.hidden = !n.hidden; } });
})();
