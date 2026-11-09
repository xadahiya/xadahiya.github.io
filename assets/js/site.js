/* ==========================================================================
   xadahiya.me — site runtime (no framework, no animation library)
   - one rAF ticker, a tiny tween engine and a scroll scrubber
   - reveals are CSS transitions toggled by IntersectionObserver (compositor-only)
   - every section boots lazily, just before it scrolls into view
   - startup work is chunked so no single task blocks the main thread for long
   ========================================================================== */
(function () {
  'use strict';

  var XA = (window.XA = window.XA || {});
  XA.booted = true;
  var doc = document.documentElement;
  var reduced = doc.classList.contains('reduce-motion');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var SCRIPT = document.currentScript;
  var BASE = SCRIPT ? SCRIPT.src.replace(/assets\/js\/site\.js.*$/, '') : '/';
  var VER = SCRIPT ? SCRIPT.getAttribute('data-v') || '' : '';
  var lenis = null, menuOpen = false, introDone = false;

  /* ---------- utils ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.warn('[xa] ' + name + ':', e); } }
  function fmtDate(iso) { return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  function cssVar(n) { return getComputedStyle(doc).getPropertyValue(n).trim(); }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function fontsReady(ms) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([
      Promise.all([document.fonts.load('800 100px Archivo'), document.fonts.load('400 16px "JetBrains Mono"')]),
      new Promise(function (r) { setTimeout(r, ms || 2500); })
    ]).catch(function () {});
  }

  /* ---------- scheduler: run queued work in small slices ---------- */
  var queue = [], draining = false;
  function later(name, fn) { queue.push([name, fn]); if (!draining) { draining = true; setTimeout(drain, 0); } }
  function drain() {
    var t0 = performance.now();
    while (queue.length && performance.now() - t0 < 6) { var job = queue.shift(); safe(job[0], job[1]); }
    if (queue.length) setTimeout(drain, 0); else draining = false;
  }
  function whenNear(el, fn, margin) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) return later('near', fn);
    var io = new IntersectionObserver(function (es) {
      for (var i = 0; i < es.length; i++) if (es[i].isIntersecting) { io.disconnect(); later('near', fn); return; }
    }, { rootMargin: margin || '120% 0px' });
    io.observe(el);
  }

  /* ---------- ticker + tweens ---------- */
  var tickers = [], cleanup = false, lastT = 0;
  function onTick(fn) { tickers.push(fn); return fn; }
  function offTick(fn) { fn._off = true; cleanup = true; }
  (function loop(now) {
    var t = now / 1000, dt = lastT ? Math.min(0.1, t - lastT) : 1 / 60;
    lastT = t;
    for (var i = 0; i < tickers.length; i++) { var f = tickers[i]; if (!f._off) f(t, dt); }
    if (cleanup) { tickers = tickers.filter(function (f) { return !f._off; }); cleanup = false; }
    requestAnimationFrame(loop);
  })(performance.now());

  var ease = {
    expo: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
    quart: function (t) { return 1 - Math.pow(1 - t, 4); },
    sine: function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  };
  function tween(o) {
    var t = -(o.delay || 0), d = o.duration || 1, e = o.ease || ease.expo;
    var fn = onTick(function (_, dt) {
      t += dt;
      if (t < 0) return;
      var p = Math.min(1, t / d);
      if (o.update) o.update(e(p), p);
      if (p >= 1) { offTick(fn); if (o.complete) o.complete(); }
    });
    return { kill: function () { offTick(fn); } };
  }

  /* ---------- scroll scrubber ---------- */
  var scrubs = [], scrubDirty = true, scrubQueued = false;
  function scrub(el, start, end, update) {
    var s = { el: el, start: start, end: end, update: update, a: 0, b: 1, p: -1 };
    scrubs.push(s); scrubDirty = true; requestScrub();
    return s;
  }
  function measureScrubs() {
    var y = window.scrollY, vh = window.innerHeight;
    for (var i = 0; i < scrubs.length; i++) {
      var s = scrubs[i], r = s.el.getBoundingClientRect(), top = r.top + y;
      s.a = s.start(top, r.height, vh); s.b = s.end(top, r.height, vh); s.p = -1;
    }
    scrubDirty = false;
  }
  function requestScrub() { if (!scrubQueued) { scrubQueued = true; requestAnimationFrame(runScrubs); } }
  function runScrubs() {
    scrubQueued = false;
    if (scrubDirty) measureScrubs();
    var y = window.scrollY;
    for (var i = 0; i < scrubs.length; i++) {
      var s = scrubs[i], p = clamp((y - s.a) / Math.max(1, s.b - s.a), 0, 1);
      if (p !== s.p) { s.p = p; s.update(p); }
    }
  }
  window.addEventListener('scroll', requestScrub, { passive: true });
  window.addEventListener('resize', debounce(function () { scrubDirty = true; requestScrub(); }, 120));
  if (window.ResizeObserver) new ResizeObserver(debounce(function () { scrubDirty = true; requestScrub(); }, 80)).observe(document.body);

  /* ---------- text: scramble, split ---------- */
  var GLYPHS = '0123456789ABCDEF#%&*+=/<>';
  function scramble(el, finalText, dur) {
    if (finalText == null) finalText = el._scr ? el._final : el.textContent;
    el._final = finalText;
    if (reduced) { el.textContent = finalText; return; }
    var chars = finalText.split('');
    var plan = chars.map(function () { var s = Math.random() * 0.45; return { s: s, e: s + 0.25 + Math.random() * 0.45 }; });
    var start = performance.now(), D = (dur || 0.8) * 1000;
    if (el._scr) cancelAnimationFrame(el._scr);
    (function step(now) {
      var p = (now - start) / D, out = '';
      for (var i = 0; i < chars.length; i++) {
        var c = chars[i];
        if (c === ' ' || p >= plan[i].e) out += c;
        else if (p >= plan[i].s) out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        else out += ' ';
      }
      el.textContent = out;
      if (p < 1) el._scr = requestAnimationFrame(step); else { el.textContent = finalText; el._scr = 0; }
    })(start);
  }
  /* wrap words (optionally masked) while preserving nested inline elements */
  function splitWords(el, mask) {
    if (el._words) return el._words;
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span');
            if (mask) { w.className = 'wm'; var i = document.createElement('span'); i.className = 'wi'; i.textContent = part; w.appendChild(i); words.push(i); }
            else { w.className = 'w'; w.textContent = part; words.push(w); }
            frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
      });
    })(el);
    el._words = words;
    return words;
  }
  /* stagger masked words by the visual line they sit on */
  function lineStagger(words, step) {
    var line = -1, lastTop = null;
    var tops = words.map(function (w) { return w.parentNode.getBoundingClientRect().top; });
    words.forEach(function (w, i) {
      if (lastTop === null || Math.abs(tops[i] - lastTop) > 4) { line++; lastTop = tops[i]; }
      w.style.setProperty('--ld', (line * (step || 0.09)).toFixed(2) + 's');
    });
  }
  /* split into chars, keeping each word unbreakable */
  function splitChars(el, cls) {
    var chars = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span');
            w.style.display = 'inline-block'; w.style.whiteSpace = 'nowrap';
            part.split('').forEach(function (c) { var s = document.createElement('span'); s.className = cls; s.textContent = c; w.appendChild(s); chars.push(s); });
            frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    })(el);
    return chars;
  }

  var toastT;
  function toast(msg) {
    var t = $('[data-toast]'); if (!t) return;
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('is-on'); }, 2400);
  }

  /* ---------- reveals ---------- */
  var revealIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    var n = 0;
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      revealIO.unobserve(e.target);
      reveal(e.target, n++);
    });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function prepLines(el) {
    if (el.classList.contains('is-split')) return;
    lineStagger(splitWords(el, true), 0.09);
    el.classList.add('is-split');
  }
  function reveal(el, n) {
    var kind = el.getAttribute('data-reveal');
    if (kind === 'lines') {
      prepLines(el);
      requestAnimationFrame(function () { el.classList.add('is-in'); });
    } else if (kind === 'scan') {
      el.classList.add('is-in');
      $$('span', el).forEach(function (s) { if (!s.children.length && s.textContent.trim()) scramble(s, s.textContent, 0.9); });
    } else {
      el.style.setProperty('--rd', (Math.min(n, 6) * 0.08).toFixed(2) + 's');
      el.classList.add('is-in');
    }
  }
  function initReveals() {
    var els = $$('[data-reveal]');
    if (reduced || !revealIO) { els.forEach(function (el) { el.classList.add('is-in', 'is-split'); }); return; }
    els.forEach(function (el) {
      if (el.getAttribute('data-reveal') === 'lines') whenNear(el, function () { prepLines(el); }, '150% 0px');
      revealIO.observe(el);
    });
  }
  function onEnter(el, fn, margin) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) return fn();
    var io = new IntersectionObserver(function (es) {
      for (var i = 0; i < es.length; i++) if (es[i].isIntersecting) { io.disconnect(); fn(); return; }
    }, { rootMargin: margin || '0px 0px -10% 0px' });
    io.observe(el);
  }

  /* ---------- link/button text roll ---------- */
  function initRolls() {
    $$('.roll').forEach(function (el) {
      if (el.dataset.rolled) return;
      var t = el.textContent;
      el.dataset.rolled = '1';
      el.innerHTML = '<span class="roll__a">' + esc(t) + '</span><span class="roll__b" aria-hidden="true">' + esc(t) + '</span>';
    });
  }

  /* ---------- smooth scroll (desktop only, loaded on demand) ---------- */
  function initLenis() {
    if (reduced || !fine) return;
    loadScript(BASE + 'assets/vendor/lenis.min.js').then(function () {
      if (!window.Lenis) return;
      lenis = new window.Lenis({ lerp: 0.095, wheelMultiplier: 1, smoothWheel: true });
      XA.lenis = lenis;
      onTick(function (t) { lenis.raf(t * 1000); });
      if (menuOpen) lenis.stop();
    }).catch(function () {});
  }
  function scrollToTarget(target) {
    if (target !== 0) { doc.classList.add('cv-off'); target.getBoundingClientRect(); }
    if (lenis) lenis.scrollTo(target === 0 ? 0 : target, { duration: 1.6, easing: ease.expo });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var url = new URL(a.getAttribute('href'), location.href);
      if (url.pathname.replace(/\/$/, '') !== location.pathname.replace(/\/$/, '') || !url.hash) return;
      var target = url.hash === '#top' ? 0 : document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target == null) return;
      e.preventDefault();
      if (XA.closeMenu) XA.closeMenu();
      scrollToTarget(target);
      if (history.replaceState) history.replaceState(null, '', url.hash === '#top' ? location.pathname : url.hash);
    });
  }

  /* ---------- Ethereum heartbeat ---------- */
  XA.chain = (function () {
    var RPC = ['https://ethereum-rpc.publicnode.com', 'https://eth.drpc.org', 'https://1rpc.io/eth'];
    var REF_N = 26369973, REF_T = 1794138731;
    var idx = 0, fails = 0, timer = 0, subs = [];
    var state = { number: 0, hash: '', txs: 0, live: false, fresh: false };
    function call(method, params) {
      var ctl = window.AbortController ? new AbortController() : null;
      var to = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
      return fetch(RPC[idx], {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: method, params: params }),
        signal: ctl ? ctl.signal : undefined
      }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
        .then(function (j) { clearTimeout(to); if (j.error || j.result == null) throw new Error('rpc'); return j.result; },
              function (e) { clearTimeout(to); throw e; });
    }
    function emit(s) { state = s; subs.forEach(function (f) { safe('chain', function () { f(s); }); }); }
    function schedule() { clearTimeout(timer); if (!document.hidden) timer = setTimeout(poll, state.live ? 4000 : 8000); }
    function poll() {
      call('eth_blockNumber', []).then(function (hex) {
        var n = parseInt(hex, 16);
        fails = 0;
        if (n === state.number && state.live) return;
        return call('eth_getBlockByNumber', [hex, false]).then(function (b) {
          emit({ number: n, hash: b.hash, txs: (b.transactions || []).length, live: true, fresh: state.number !== 0 && n > state.number });
        });
      }).catch(function () {
        fails++; idx = (idx + 1) % RPC.length;
        if (fails >= RPC.length) {
          var n = REF_N + Math.floor((Date.now() / 1000 - REF_T) / 12.05);
          if (n !== state.number) emit({ number: n, hash: '', txs: 0, live: false, fresh: state.number !== 0 });
        }
      }).then(schedule, schedule);
    }
    document.addEventListener('visibilitychange', function () { clearTimeout(timer); if (!document.hidden && subs.length) poll(); });
    return { start: poll, on: function (f) { subs.push(f); if (state.number) f(state); } };
  })();

  function initChainFeed() {
    var nums = $$('[data-block-number]'), hashes = $$('[data-block-hash]'), links = $$('[data-block-link]');
    var dots = $$('[data-live-dot]'), statuses = $$('[data-block-status]');
    var hud = $('[data-hud-block]'), mark = $('.nav .mark');
    if (!nums.length) return;
    XA.chain.on(function (s) {
      var txt = (s.live ? '' : '≈ ') + s.number.toLocaleString('en-US');
      nums.forEach(function (el) { if (el.textContent !== txt) scramble(el, txt, 0.7); });
      hashes.forEach(function (el) { scramble(el, s.hash ? s.hash.slice(0, 8) + '…' + s.hash.slice(-6) + ' · ' + s.txs + ' txs' : 'estimated · rpc unreachable', 0.8); });
      links.forEach(function (a) { a.href = 'https://etherscan.io/block/' + s.number; });
      statuses.forEach(function (el) { el.textContent = s.live ? 'Ethereum · live' : 'Ethereum · est.'; });
      dots.forEach(function (d) {
        d.classList.toggle('is-live', s.live);
        if (s.fresh) { d.classList.remove('is-beat'); void d.offsetWidth; d.classList.add('is-beat'); }
      });
      if (s.live && XA.pl && XA.pl.setHead && !XA.pl.finished) XA.pl.setHead(s.number);
      if (!s.fresh) return;
      if (hud) { hud.classList.add('is-beat'); setTimeout(function () { hud.classList.remove('is-beat'); }, 900); }
      if (mark && !reduced) { mark.classList.remove('is-beat'); void mark.getBoundingClientRect(); mark.classList.add('is-beat'); }
      if (XA.hero && introDone && !reduced) {
        var b = XA.hero.bounds;
        XA.hero.pulse(b.x0 + Math.random() * (b.x1 - b.x0), b.y0 + Math.random() * (b.y1 - b.y0), 1);
      }
    });
    XA.chain.start();
  }

  /* ---------- hero + preloader ---------- */
  function initHero() {
    var hero = $('[data-hero]');
    if (!hero) { doc.classList.add('is-ready'); return; }
    var canvas = $('[data-hero-canvas]', hero), stage = $('[data-hero-stage]', hero), scanEl = $('[data-hero-scan]', hero);
    var gl = null;
    var makeGL = function () {
      return new Promise(function (res) {
        setTimeout(function () {
          if (XA.HeroGL && canvas && stage) {
            try {
        gl = new XA.HeroGL(canvas, { textEl: stage, reduced: reduced, ink: cssVar('--fg'), hot: cssVar('--accent'), noise: cssVar('--noise'),
          glow1: cssVar('--glow-1'), glow2: cssVar('--glow-2'), glow3: cssVar('--glow-3') });
      } catch (e) { gl = null; }
          }
          res();
        }, 0);
      });
    };
    var waitLink = function () {
      return new Promise(function (res) {
        if (!gl) return res();
        var t0 = performance.now();
        (function poll() {
          var ok = false;
          try { ok = gl.ready(); } catch (e) { gl = null; return res(); }
          if (ok || performance.now() - t0 > 4000) return res();
          requestAnimationFrame(poll);
        })();
      });
    };
    Promise.all([fontsReady(2500), makeGL().then(waitLink)]).then(function () {
      if (gl) {
        try {
          gl.resize();
          gl.burst = reduced ? 1 : 0;
          gl.scan = reduced ? 1e6 : -1e5;
          gl.render(1 / 60);
          XA.hero = gl;
        } catch (e) { gl = null; doc.classList.remove('gl'); }
      }
      if (gl) wireHero(gl, hero, canvas);
      exitPreloader(gl, function () { intro(gl, hero, scanEl); });
    });
  }

  function wireHero(gl, hero, canvas) {
    var visible = true, drawn = false, lowFrame = 0;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(hero);
    onTick(function (t, dt) {
      if (!visible || document.hidden) return;
      if (reduced && drawn) return;
      if (gl.lowPower && (lowFrame++ & 1)) return; // software GL: half rate
      gl.render(gl.lowPower ? dt * 2 : dt); drawn = true;
    });
    if (!reduced) {
      hero.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); gl.pointer(e.clientX - r.left, e.clientY - r.top, true); }, { passive: true });
      hero.addEventListener('pointerleave', function () { gl.pointer(0, 0, false); });
      hero.addEventListener('pointerdown', function (e) {
        if (e.target.closest('a, button')) return;
        var r = canvas.getBoundingClientRect(); gl.pulse(e.clientX - r.left, e.clientY - r.top, 0.85);
      });
    }
    window.addEventListener('resize', debounce(function () {
      var r = canvas.getBoundingClientRect();
      if (Math.round(r.width) === gl.w && Math.round(r.height) === gl.h) return;
      gl.resize(); drawn = false;
      if (introDone || reduced) { gl.scan = 1e6; gl.burst = 1; }
    }, 200));
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); doc.classList.remove('gl'); visible = false; });
    var grid = $('.hero__grid', hero);
    scrub(hero, function (top) { return top; }, function (top, h) { return top + h; }, function (p) {
      gl.scroll = p; drawn = false;
      if (!reduced && grid) { grid.style.transform = p ? 'translate3d(0,' + (-p * 18).toFixed(2) + '%,0)' : ''; grid.style.opacity = p ? (1 - p * 1.1).toFixed(3) : ''; }
    });
  }

  function exitPreloader(gl, start) {
    var pl = $('#preloader'), P = XA.pl;
    /* the DOM name stays painted under the loader (it is the LCP element) and
       is only swapped for the particles as the loader leaves */
    var swap = function () { if (gl) doc.classList.add('gl'); };
    if (!pl || !P) { swap(); start(); return; }
    var go = function () {
      var mark = $('.pl__mark', pl);
      if (gl && mark) {
        var mr = mark.getBoundingClientRect(), cr = gl.canvas.getBoundingClientRect();
        gl.origin = [mr.left + mr.width / 2 - cr.left, mr.top + mr.height / 2 - cr.top];
      }
      setTimeout(function () {
        swap();
        pl.classList.add('is-leaving');
        doc.classList.remove('is-loading');
        start();
        setTimeout(function () { pl.classList.add('is-gone'); }, 900);
      }, P.quick ? 40 : 420);
    };
    P.ready = true;
    if (P.finished) go(); else P.cb = go;
  }

  function intro(gl, hero, scanEl) {
    var ins = $$('.hero__in', hero);
    ins.forEach(function (el, i) { el.style.setProperty('--hd', (0.35 + i * 0.07).toFixed(2) + 's'); });
    hero.classList.add('is-live');
    doc.classList.add('is-ready');
    if (reduced || !gl) { introDone = true; return; }
    var live = '[data-block-number],[data-block-hash],[data-block-status]';
    setTimeout(function () {
      $$('.hero__chain .hero__in, .hero__role .hero__in', hero).forEach(function (el) { if (!el.matches(live) && !el.querySelector(live)) scramble(el, null, 0.9); });
    }, 350);
    tween({ duration: 2.1, ease: function (t) { return 1 - Math.pow(1 - t, 3); }, update: function (e) { gl.burst = e; } });
    var x0 = -gl.scanW * 0.35, x1 = gl.w + gl.scanW * 1.6;
    gl.scan = x0;
    tween({
      delay: 0.55, duration: 2.3, ease: ease.sine,
      update: function (e) {
        var x = x0 + (x1 - x0) * e;
        gl.scan = x;
        scanEl.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
        scanEl.style.opacity = e < 0.05 ? (e / 0.05).toFixed(3) : e > 0.8 ? Math.max(0, (1 - e) / 0.2).toFixed(3) : '1';
      },
      complete: function () { gl.scan = 1e6; scanEl.style.display = 'none'; introDone = true; }
    });
  }

  /* ---------- about ---------- */
  function initAbout() {
    var man = $('[data-manifesto]');
    if (man && !reduced) {
      var words = splitWords(man, false), lit = -1;
      man.classList.add('is-split');
      scrub(man, function (top, h, vh) { return top - vh * 0.82; }, function (top, h, vh) { return top + h - vh * 0.45; }, function (p) {
        var n = Math.round(p * (words.length + 1));
        if (n === lit) return;
        for (var i = 0; i < words.length; i++) words[i].classList.toggle('is-lit', i < n);
        lit = n;
      });
    }
    var years = new Date().getFullYear() - 2010;
    $$('[data-years]').forEach(function (el) { el.dataset.odometer = String(years); el.textContent = years; });
    $$('[data-years-text]').forEach(function (el) { el.textContent = years + ' years'; });
    if (reduced || !Element.prototype.animate) return;
    $$('[data-odometer]').forEach(function (el) {
      var val = el.dataset.odometer, strips = [];
      el.textContent = '';
      el.classList.add('odo');
      for (var i = 0; i < val.length; i++) {
        var ch = val[i];
        if (/\d/.test(ch)) {
          var col = document.createElement('span'), strip = document.createElement('span'), html = '';
          col.className = 'odo__col'; strip.className = 'odo__strip';
          for (var k = 0; k < 20; k++) html += '<span>' + (k % 10) + '</span>';
          strip.innerHTML = html; col.appendChild(strip); el.appendChild(col);
          strips.push({ el: strip, d: +ch });
        } else { var s = document.createElement('span'); s.textContent = ch; el.appendChild(s); }
      }
      onEnter(el, function () {
        strips.forEach(function (s, j) {
          s.el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-' + (10 + s.d) * 5 + '%)' }],
            { duration: 2000 + j * 150, delay: 150 + j * 60, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
        });
      });
    });
  }

  /* ---------- selected systems ---------- */
  function initSystems() {
    var sec = $('#work');
    var mountViz = function () {
      if (!XA.viz) return;
      var runner = XA.viz.mount(sec, { reduced: reduced });
      if (runner) onTick(runner.tick);
    };
    if (XA.viz) mountViz(); else loadScript(BASE + 'assets/js/viz.js?v=' + VER).then(mountViz).catch(function () {});
    var cards = $$('.sys', sec), stack = $('.sys-stack', sec);
    cards.forEach(function (card) {
      onEnter(card, function () {
        var viz = $('.sys__viz', card);
        if (viz) viz.style.setProperty('--vw', viz.clientWidth + 'px');
        card.classList.add('is-active');
      }, '0px 0px -45% 0px');
    });
    if (reduced || !stack) return;
    var desktop = window.matchMedia('(min-width: 961px)');
    var geo = function () { return { h: cards[0].offsetHeight, gap: parseFloat(getComputedStyle(stack).rowGap) || 0 }; };
    cards.forEach(function (card, i) {
      if (i === cards.length - 1) return;
      var next = cards[i + 1], inner = $('.sys__card', card), cv = $('canvas[data-viz]', card);
      var stick = function () { return parseFloat(getComputedStyle(next).top) || 100; };
      scrub(stack,
        function (top, _h, vh) { var g = geo(); return top + (i + 1) * (g.h + g.gap) - vh; },
        function (top) { var g = geo(); return top + (i + 1) * (g.h + g.gap) - stick(); },
        function (p) {
          if (!desktop.matches) { inner.style.transform = ''; inner.style.setProperty('--shade', '0'); if (cv && cv.__viz) cv.__viz.paused = false; return; }
          inner.style.transform = p ? 'scale(' + (1 - 0.08 * p).toFixed(4) + ')' : '';
          inner.style.setProperty('--shade', (0.62 * p).toFixed(3));
          if (cv && cv.__viz) cv.__viz.paused = p >= 0.999;
        });
    });
  }

  /* ---------- the chain (hash-linked timeline) ---------- */
  var ZERO = '0x' + new Array(65).join('0');
  function sha256(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      return '0x' + Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  function shortHash(h) { return h.slice(0, 6) + '…' + h.slice(-4); }
  function blockPayload(b, prev) {
    return [b.dataset.n, $('.block__title', b).textContent.trim(), $('.block__org', b).textContent.trim(), b.dataset.span, prev].join('|');
  }
  function initChain() {
    var list = $('[data-blocks]');
    if (!list) return;
    var blocks = $$('[data-block]', list);
    blocks.forEach(function (b) {
      var btn = $('[data-block-toggle]', b);
      if (!btn) return;
      var toggle = function () {
        var open = !b.classList.contains('is-open');
        b.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        $('.sr-only', btn).textContent = open ? 'Hide details' : 'Show details';
      };
      btn.addEventListener('click', toggle);
      $('.block__title', b).addEventListener('click', toggle);
    });
    var canHash = window.crypto && crypto.subtle && window.TextEncoder;
    if (canHash) {
      var chain = blocks.slice().reverse(), prev = ZERO, p = Promise.resolve();
      chain.forEach(function (b) {
        p = p.then(function () {
          return sha256(blockPayload(b, prev)).then(function (h) {
            b._hash = h; b._prev = prev;
            var hc = $('[data-hash]', b), pc = $('[data-prev]', b);
            hc.textContent = shortHash(h); hc.title = h;
            pc.textContent = shortHash(prev); pc.title = prev;
            prev = h;
          });
        });
      });
    } else {
      $$('.block__hash', list).forEach(function (el) { el.hidden = true; });
      var vb0 = $('[data-verify]'); if (vb0) vb0.hidden = true;
    }
    if (reduced) { list.style.setProperty('--p', 1); blocks.forEach(function (b) { b.classList.add('is-lit'); }); }
    else {
      scrub(list, function (top, h, vh) { return top - vh * 0.72; }, function (top, h, vh) { return top + h - vh * 0.72; }, function (pr) { list.style.setProperty('--p', pr.toFixed(4)); });
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) e.target.classList.add('is-lit');
          else if (e.boundingClientRect.top > 0) e.target.classList.remove('is-lit');
        });
      }, { rootMargin: '0px 0px -28% 0px' });
      blocks.forEach(function (b) { io.observe(b); });
    }
    var vb = $('[data-verify]');
    if (vb && canHash) vb.addEventListener('click', function () {
      if (vb.disabled) return;
      vb.disabled = true;
      vb.classList.remove('is-done');
      var label = $('[data-verify-label]', vb), chain = blocks.slice().reverse(), prev = ZERO, i = 0, ok = true;
      blocks.forEach(function (b) { b.classList.remove('is-verified'); });
      (function next() {
        if (i >= chain.length) {
          label.textContent = ok ? 'Chain valid ✓' : 'Mismatch ✗';
          vb.classList.add('is-done');
          toast(ok ? chain.length + '/' + chain.length + ' blocks verified — SHA-256 chain intact' : 'Hash mismatch detected');
          setTimeout(function () { vb.disabled = false; }, 800);
          return;
        }
        var b = chain[i];
        sha256(blockPayload(b, prev)).then(function (h) {
          ok = ok && h === b._hash && prev === b._prev;
          b.classList.add('is-verified', 'is-lit');
          scramble($('[data-hash]', b), shortHash(h), 0.45);
          label.textContent = 'Verifying ' + (i + 1) + '/' + chain.length;
          prev = h; i++;
          setTimeout(next, reduced ? 0 : 150);
        });
      })();
    });
  }

  /* ---------- velocity marquee ---------- */
  function initMarquee() {
    var root = $('[data-marquee]');
    if (!root || reduced) return;
    var rows = $$('.marquee__row', root).map(function (row) { return { track: $('.marquee__track', row), dir: +row.dataset.dir || -1, x: 0, w: 0 }; });
    var measure = function () { rows.forEach(function (r) { r.w = r.track.scrollWidth / 2; }); };
    measure();
    window.addEventListener('resize', debounce(measure, 150));
    var visible = false, lastY = window.scrollY, vel = 0, skew = 0, boost = 0, sign = 1;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: '120px' }).observe(root);
    onTick(function (t, dt) {
      var y = window.scrollY, raw = lenis ? lenis.velocity : (y - lastY) / Math.max(dt * 60, 0.5);
      lastY = y;
      if (!visible) return;
      vel += (raw - vel) * 0.2;
      if (vel < -0.4) sign = -1; else if (vel > 0.4) sign = 1;
      boost += (Math.min(Math.abs(vel), 50) - boost) * 0.08;
      skew += (clamp(vel * 0.3, -9, 9) - skew) * 0.1;
      rows.forEach(function (r) {
        if (!r.w) return;
        r.x += r.dir * sign * (50 + boost * 24) * dt;
        r.x = ((r.x % r.w) + r.w) % r.w;
        r.track.style.transform = 'translate3d(' + (-r.x).toFixed(2) + 'px,0,0) skewX(' + (-skew).toFixed(2) + 'deg)';
      });
    });
  }

  /* ---------- proof of work (GitHub) ---------- */
  function initProof() {
    var panel = $('[data-gh]');
    if (!panel) return;
    fetch('https://github-contributions-api.jogruber.de/v4/' + encodeURIComponent(panel.dataset.user) + '?y=last')
      .then(function (r) { if (!r.ok) throw new Error('gh ' + r.status); return r.json(); })
      .then(function (data) { render(data); })
      .catch(function () { panel.classList.add('is-error'); $('[data-gh-tip]', panel).textContent = 'GitHub data is unavailable right now'; });
    function render(data) {
      var days = data.contributions || [];
      if (!days.length) throw new Error('empty');
      var graph = $('[data-gh-graph]', panel), months = $('[data-gh-months]', panel), tip = $('[data-gh-tip]', panel);
      var pad = new Date(days[0].date + 'T00:00:00Z').getUTCDay();
      var frag = document.createDocumentFragment(), cells = [], marks = [];
      for (var p = 0; p < pad; p++) { var e = document.createElement('i'); e.className = 'gh-cell is-pad'; frag.appendChild(e); }
      var total = 0, best = days[0], run = 0, longest = 0, active = 0;
      days.forEach(function (d, i) {
        var c = document.createElement('i'), k = i + pad;
        c.className = 'gh-cell'; c.dataset.l = d.level; c.dataset.i = i;
        c.style.setProperty('--d', (Math.floor(k / 7) * 0.022 + (k % 7) * 0.012).toFixed(3) + 's');
        frag.appendChild(c); cells.push(c);
        total += d.count;
        if (d.count > best.count) best = d;
        if (d.count > 0) { active++; run++; longest = Math.max(longest, run); } else run = 0;
        var dt = new Date(d.date + 'T00:00:00Z');
        if (dt.getUTCDate() === 1) marks.push({ col: Math.floor(k / 7), label: dt.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }) });
      });
      graph.appendChild(frag);
      var cols = Math.ceil((days.length + pad) / 7);
      months.innerHTML = marks.map(function (m) { return '<span style="left:' + (m.col / cols * 100).toFixed(2) + '%">' + m.label + '</span>'; }).join('');
      var bi = days.indexOf(best); if (cells[bi]) cells[bi].classList.add('is-best');
      var totalEl = $('[data-gh-total]', panel);
      $('[data-gh-best]', panel).innerHTML = best.count + '<small>' + esc(fmtDate(best.date)) + '</small>';
      $('[data-gh-streak]', panel).innerHTML = longest + '<small>days</small>';
      $('[data-gh-active]', panel).innerHTML = active + '<small>/ ' + days.length + '</small>';
      graph.addEventListener('pointerover', function (ev) {
        var c = ev.target.closest('.gh-cell');
        if (!c || c.classList.contains('is-pad')) return;
        var d = days[+c.dataset.i];
        tip.textContent = d.count + (d.count === 1 ? ' contribution' : ' contributions') + ' · ' + fmtDate(d.date);
      });
      graph.addEventListener('pointerleave', function () { tip.textContent = 'Hover a day'; });
      onEnter(graph, function () {
        graph.classList.add('is-in');
        if (reduced) { totalEl.textContent = total.toLocaleString('en-US'); return; }
        tween({ duration: 2.2, ease: ease.expo, update: function (e) { totalEl.textContent = Math.round(total * e).toLocaleString('en-US'); } });
      });
    }
  }

  /* ---------- off-chain photos: clip + pixel resolve + parallax ---------- */
  function initOffchain() {
    $$('[data-resolve]').forEach(function (fig) {
      var frame = $('.ph__frame', fig), img = $('img', fig);
      if (!frame || !img) return;
      if (reduced) { fig.classList.add('is-in'); return; }
      scrub(frame, function (top, h, vh) { return top - vh; }, function (top, h) { return top + h; }, function (p) { img.style.setProperty('--py', (-5 + 10 * p).toFixed(2) + '%'); });
      onEnter(frame, function () { fig.classList.add('is-in'); pixelResolve(frame, img); }, '0px 0px -12% 0px');
    });
  }
  function pixelResolve(frame, img) {
    var go = function () {
      var r = frame.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h || !img.naturalWidth) return;
      var cv = document.createElement('canvas'); cv.className = 'ph__px'; cv.width = w; cv.height = h;
      frame.appendChild(cv);
      var ctx = cv.getContext('2d'), tmp = document.createElement('canvas'), tctx = tmp.getContext('2d');
      var iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(w / iw, h / ih) * 1.14;
      var sw = w / s, sh = h / s, sx = (iw - sw) / 2, sy = (ih - sh) / 2;
      var steps = [56, 36, 24, 15, 9, 5, 3], i = 0;
      (function step() {
        if (i >= steps.length) { cv.style.opacity = '0'; setTimeout(function () { cv.remove(); }, 520); return; }
        var px = steps[i++], tw = Math.max(1, Math.ceil(w / px)), th = Math.max(1, Math.ceil(h / px));
        tmp.width = tw; tmp.height = th;
        tctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(tmp, 0, 0, tw, th, 0, 0, w, h);
        setTimeout(step, 95);
      })();
    };
    if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
  }

  /* ---------- writing: cursor-following duotone preview ---------- */
  function initPreview() {
    var list = $('[data-posts]'), pv = $('[data-preview-el]');
    if (!list || !pv || !fine || reduced) return;
    var card = $('.preview__inner', pv), img = $('[data-preview-img]', pv), links = $$('a[data-preview]', list), cur = null;
    // Preload thumbnails and remember each one's shape, so the card matches the image instead of cropping it.
    whenNear(list, function () {
      links.forEach(function (a) {
        if (!a.dataset.preview) return;
        var im = new Image();
        im.onload = function () { a._ar = im.naturalWidth / im.naturalHeight; };
        im.onerror = function () { a._bad = true; };
        im.src = a.dataset.preview;
      });
    }, '100% 0px');
    var st = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0, run: false, lastX: 0, mx: 0, my: 0, w: 0, h: 0, side: 1 };
    var size = function (ar) {
      var max = clamp(window.innerWidth * 0.24, 260, 380);
      ar = ar || 1.6;
      st.w = Math.min(max, max * 0.72 * ar); st.h = st.w / ar;
      card.style.width = st.w.toFixed(1) + 'px'; card.style.height = st.h.toFixed(1) + 'px';
    };
    // Park the card beside the cursor so the title stays readable; flip sides near an edge and stay on screen.
    var place = function (fresh) {
      var vw = window.innerWidth, vh = window.innerHeight, room = st.w + 44;
      if (fresh) st.side = st.mx + room <= vw ? 1 : -1;
      else if (st.side > 0 && st.mx + room > vw) st.side = -1;
      else if (st.side < 0 && st.mx - room < 0) st.side = 1;
      st.tx = st.mx + st.side * (28 + st.w / 2);
      st.ty = clamp(st.my, 16 + st.h / 2, vh - 16 - st.h / 2);
    };
    onTick(function (t, dt) {
      if (!st.run) return;
      var k = 1 - Math.pow(0.0009, dt);
      st.x += (st.tx - st.x) * k; st.y += (st.ty - st.y) * k; st.r += (st.tr - st.r) * k * 0.6; st.tr *= 0.9;
      pv.style.transform = 'translate3d(' + st.x.toFixed(1) + 'px,' + st.y.toFixed(1) + 'px,0) rotate(' + st.r.toFixed(2) + 'deg)';
      if (!pv.classList.contains('is-on') && Math.abs(st.tx - st.x) < 0.5 && Math.abs(st.r) < 0.05) st.run = false;
    });
    list.addEventListener('pointermove', function (e) {
      st.mx = e.clientX; st.my = e.clientY; place(false);
      st.tr = clamp((e.clientX - st.lastX) * 0.5, -9, 9); st.lastX = e.clientX; st.run = true;
    });
    img.addEventListener('load', function () {
      if (!cur || cur._ar) return;
      cur._ar = img.naturalWidth / img.naturalHeight; size(cur._ar); place(false);
    });
    img.addEventListener('error', function () { if (cur) cur._bad = true; pv.classList.remove('is-on'); });
    links.forEach(function (a) {
      a.addEventListener('pointerenter', function (e) {
        var src = a.dataset.preview;
        if (!src || a._bad) { cur = null; pv.classList.remove('is-on'); return; }
        var fresh = !pv.classList.contains('is-on');
        cur = a;
        if (img.getAttribute('src') !== src) img.src = src;
        size(a._ar);
        st.mx = e.clientX; st.my = e.clientY; place(fresh);
        if (fresh) { st.x = st.tx; st.y = st.ty; st.r = st.tr = 0; st.lastX = e.clientX; void card.offsetWidth; }
        pv.classList.add('is-on'); st.run = true;
      });
    });
    list.addEventListener('pointerleave', function () { cur = null; pv.classList.remove('is-on'); });
  }

  /* ---------- shelf ---------- */
  function initShelf() {
    var shelf = $('[data-shelf]');
    if (!shelf) return;
    var books = $$('.book', shelf), note = $('[data-shelf-note]');
    var k = $('.shelf__note-k', note), t = $('.shelf__note-t', note), hoverT;
    books.forEach(function (b, i) { b.style.setProperty('--d', (i * 0.07).toFixed(2) + 's'); });
    if (reduced) shelf.classList.add('is-in'); else onEnter(shelf, function () { shelf.classList.add('is-in'); });
    function select(b) {
      var willOpen = b && !b.classList.contains('is-open');
      books.forEach(function (o) { o.classList.remove('is-open'); o.setAttribute('aria-pressed', 'false'); });
      if (willOpen) {
        b.classList.add('is-open'); b.setAttribute('aria-pressed', 'true');
        scramble(k, b.dataset.title, 0.6);
        t.textContent = b.dataset.note;
        if (!reduced && t.animate) t.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      } else { k.textContent = 'Select a spine'; t.textContent = 'Six books, one shelf.'; }
    }
    books.forEach(function (b) {
      b.addEventListener('click', function () { clearTimeout(hoverT); select(b); });
      if (fine) {
        b.addEventListener('pointerenter', function () { clearTimeout(hoverT); if (b.classList.contains('is-open')) return; hoverT = setTimeout(function () { select(b); }, 160); });
        b.addEventListener('pointerleave', function () { clearTimeout(hoverT); });
      }
    });
  }

  /* ---------- contact ---------- */
  function initContact() {
    $$('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.dataset.copy;
        var p = navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(v) : Promise.reject(new Error('no clipboard'));
        p.then(function () {
          btn.classList.add('is-copied'); toast('Copied ' + v);
          setTimeout(function () { btn.classList.remove('is-copied'); }, 2200);
        }).catch(function () { location.href = 'mailto:' + v; });
      });
    });
    var title = $('[data-kinetic]');
    if (title && !reduced) {
      var all = splitChars(title, 'kchar');
      all.forEach(function (c, i) { c.style.setProperty('--d', (i * 0.018).toFixed(3) + 's'); });
      onEnter(title, function () { title.classList.add('is-in'); });
      if (fine) {
        var chars = all.filter(function (c) { return !c.closest('em'); }), cur = chars.map(function () { return 0; }), centers = [];
        var measure = function () { var sx = window.scrollX, sy = window.scrollY; centers = chars.map(function (c) { var r = c.getBoundingClientRect(); return [r.left + r.width / 2 + sx, r.top + r.height / 2 + sy]; }); };
        var mx = -1e5, my = -1e5, on = false, idle = true;
        title.addEventListener('pointerenter', function () { if (idle) measure(); });
        title.addEventListener('pointermove', function (e) { mx = e.pageX; my = e.pageY; on = true; idle = false; });
        title.addEventListener('pointerleave', function () { on = false; });
        window.addEventListener('resize', debounce(function () { if (idle) measure(); }, 200));
        onTick(function () {
          if (idle) return;
          var moving = false, R = Math.max(140, title.getBoundingClientRect().height * 0.55);
          for (var i = 0; i < chars.length; i++) {
            var c = centers[i]; if (!c) continue;
            var target = on ? Math.exp(-(Math.pow(c[0] - mx, 2) + Math.pow((c[1] - my) * 1.6, 2)) / (R * R)) : 0;
            var v = cur[i] + (target - cur[i]) * 0.16;
            if (Math.abs(v - cur[i]) > 0.0008) { moving = true; cur[i] = v; chars[i].style.setProperty('--wg', (600 + v * 300).toFixed(0)); chars[i].style.setProperty('--wd', (100 + v * 22).toFixed(1)); }
          }
          if (!on && !moving) idle = true;
        });
      }
    }
    var form = $('[data-form]');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = $('[data-form-status]', form);
      if (form.elements._gotcha && form.elements._gotcha.value) return;
      form.classList.add('is-busy'); status.classList.remove('is-ok'); status.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || (j.code && +j.code !== 200)) throw new Error(j.message || 'http ' + r.status); }); })
        .then(function () { form.reset(); status.textContent = 'Message sent — thank you.'; status.classList.add('is-ok'); toast('Message sent ✓'); })
        .catch(function () { status.innerHTML = 'Couldn’t send that. <a class="link" href="mailto:xadahiya@gmail.com">Email me instead</a>.'; })
        .then(function () { form.classList.remove('is-busy'); });
    });
  }

  /* ---------- footer ---------- */
  function initFoot() {
    var word = $('[data-foot-word]');
    if (!word) return;
    var fit = function () {
      word.style.fontSize = ''; word.style.display = 'inline-block';
      var pcs = getComputedStyle(word.parentNode);
      var cw = word.parentNode.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight) - 2;
      var fs = parseFloat(getComputedStyle(word).fontSize), ww = word.getBoundingClientRect().width;
      if (ww > 0) word.style.fontSize = (fs * cw / ww).toFixed(2) + 'px';
      word.style.display = '';
    };
    fit();
    window.addEventListener('resize', debounce(fit, 150));
    if (reduced) return;
    var chars = splitChars(word, 'ch');
    chars.forEach(function (c, i) { c.style.setProperty('--d', (i * 0.045).toFixed(3) + 's'); });
    onEnter(word.parentNode, function () { word.classList.add('is-in'); }, '0px 0px -4% 0px');
  }

  /* ---------- magnetic + cursor (fine pointers only) ---------- */
  function spring(el, ks, kd) {
    var s = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, run: false };
    onTick(function () {
      if (!s.run) return;
      s.vx = (s.vx + (s.tx - s.x) * ks) * kd; s.vy = (s.vy + (s.ty - s.y) * ks) * kd;
      s.x += s.vx; s.y += s.vy;
      el.style.transform = 'translate3d(' + s.x.toFixed(2) + 'px,' + s.y.toFixed(2) + 'px,0)';
      if (Math.abs(s.vx) + Math.abs(s.vy) < 0.01 && Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) < 0.05) { s.run = false; if (!s.tx && !s.ty) el.style.transform = ''; }
    });
    return s;
  }
  function initMagnetic() {
    if (!fine || reduced) return;
    $$('[data-magnetic]').forEach(function (el) {
      var s = spring(el, 0.12, 0.78);
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        s.tx = (e.clientX - (r.left - s.x) - r.width / 2) * 0.22; s.ty = (e.clientY - (r.top - s.y) - r.height / 2) * 0.35; s.run = true;
      });
      el.addEventListener('pointerleave', function () { s.tx = 0; s.ty = 0; s.run = true; });
    });
  }
  function initCursor() {
    if (!fine || reduced) return;
    var c = $('[data-cursor-el]');
    if (!c) return;
    doc.classList.add('has-cursor');
    var dot = $('.cursor__dot', c), ring = $('.cursor__ring', c), label = $('[data-cursor-label]', c);
    var p = { x: -100, y: -100, dx: -100, dy: -100, rx: -100, ry: -100 };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      p.x = e.clientX; p.y = e.clientY; c.classList.remove('is-out');
    }, { passive: true });
    onTick(function (t, dt) {
      var a = 1 - Math.pow(1e-9, dt), b = 1 - Math.pow(0.0006, dt);
      p.dx += (p.x - p.dx) * a; p.dy += (p.y - p.dy) * a; p.rx += (p.x - p.rx) * b; p.ry += (p.y - p.ry) * b;
      dot.style.transform = 'translate3d(' + p.dx.toFixed(1) + 'px,' + p.dy.toFixed(1) + 'px,0)';
      ring.style.transform = 'translate3d(' + p.rx.toFixed(1) + 'px,' + p.ry.toFixed(1) + 'px,0)';
    });
    document.addEventListener('mouseleave', function () { c.classList.add('is-out'); });
    document.addEventListener('pointerdown', function () { c.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { c.classList.remove('is-down'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target;
      if (!t.closest) return;
      var lab = t.closest('[data-cursor]'), link = t.closest('a, button, label, summary, [role="button"], .gh-cell'), text = t.closest('input, textarea, [contenteditable]');
      c.classList.toggle('is-label', !!lab);
      if (lab) label.textContent = lab.getAttribute('data-cursor');
      c.classList.toggle('is-link', !lab && !!link);
      c.classList.toggle('is-text', !!text);
    });
  }

  /* ---------- nav, HUD, menu ---------- */
  function initNav() {
    var nav = $('[data-nav]');
    if (!nav) return;
    var hud = $('[data-hud]'), hudBlock = $('[data-hud-block]'), bar = $('[data-hud-bar]');
    var hIdx = $('[data-hud-idx]'), hName = $('[data-hud-name]');
    var hero = $('[data-hero]'), hasSections = !!$('[data-section]');
    var lastY = window.scrollY, ticking = false;
    var update = function () {
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight;
      nav.classList.toggle('is-scrolled', y > 30);
      if (!menuOpen) {
        if (y > vh * 0.7 && y > lastY + 3) nav.classList.add('is-hidden');
        else if (y < lastY - 3 || y < 90) nav.classList.remove('is-hidden');
      }
      lastY = y;
      var past = hero ? y > vh * 0.75 : y > 200, max = doc.scrollHeight - vh, nearEnd = y > max - vh * 0.6;
      if (hud) hud.classList.toggle('is-on', hasSections && past && !nearEnd);
      if (hudBlock) hudBlock.classList.toggle('is-on', past && !nearEnd);
      if (bar) bar.parentNode.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    var linkMap = {};
    $$('[data-nav-link]', nav).forEach(function (a) { linkMap[a.dataset.navLink] = a; });
    var sections = $$('[data-section]');
    if (!sections.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var sec = e.target, id = sec.id;
        Object.keys(linkMap).forEach(function (k) { linkMap[k].classList.toggle('is-active', k === id); });
        if (hIdx && hIdx.textContent !== sec.dataset.section) { scramble(hIdx, sec.dataset.section, 0.5); scramble(hName, sec.dataset.sectionName, 0.6); }
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }
  function initMenu() {
    var btn = $('[data-menu-toggle]'), menu = $('[data-menu]');
    if (!btn || !menu) return;
    menu.inert = true;
    var setMenu = function (open) {
      menuOpen = open;
      menu.classList.toggle('is-open', open);
      menu.inert = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      $('[data-nav]').classList.remove('is-hidden');
      if (lenis) { if (open) lenis.stop(); else lenis.start(); }
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) setTimeout(function () { var a = $('a', menu); if (a) a.focus({ preventScroll: true }); }, 300);
    };
    btn.addEventListener('click', function () { setMenu(!menuOpen); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); btn.focus(); } });
    XA.closeMenu = function () { if (menuOpen) setMenu(false); };
  }

  /* ---------- command palette (list is built on first open) ---------- */
  function initPalette() {
    var root = $('[data-palette]');
    if (!root) return;
    var input = $('[data-palette-input]', root), list = $('[data-palette-list]', root);
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    if (!isMac) $$('[data-mod]').forEach(function (k) { k.textContent = 'Ctrl'; });
    var items = null, shown = [], sel = 0, isOpen = false, lastFocus = null;
    function go(url) {
      return function () {
        var u = new URL(url, location.href);
        if (u.pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, '') && u.hash) {
          var t = u.hash === '#top' ? 0 : document.getElementById(u.hash.slice(1));
          if (t != null) { close(); setTimeout(function () { scrollToTarget(t); }, 60); return; }
        }
        location.href = u.href;
      };
    }
    function open(url) { return function () { close(); window.open(url, '_blank', 'noopener'); }; }
    function build() {
      var posts = [];
      try { posts = JSON.parse($('#xa-posts').textContent); } catch (e) {}
      items = [
        { g: 'Navigate', l: 'Top of page', i: 'i-down', a: go('/#top'), k: 'home start hero' },
        { g: 'Navigate', l: 'Selected systems', h: '01', i: 'i-arrow', a: go('/#work'), k: 'work projects powerloom relayer bds research' },
        { g: 'Navigate', l: 'The chain — experience & education', h: '02', i: 'i-arrow', a: go('/#chain'), k: 'resume cv history jobs timeline' },
        { g: 'Navigate', l: 'The stack — capabilities', h: '03', i: 'i-arrow', a: go('/#stack'), k: 'skills tech' },
        { g: 'Navigate', l: 'Proof of work — GitHub activity', i: 'i-github', a: go('/#proof'), k: 'contributions commits' },
        { g: 'Navigate', l: 'Writing', h: '04', i: 'i-arrow', a: go('/#writing'), k: 'blog posts articles' },
        { g: 'Navigate', l: 'The shelf — books', i: 'i-arrow', a: go('/#shelf'), k: 'reading' },
        { g: 'Navigate', l: 'Contact', h: '05', i: 'i-mail', a: go('/#contact'), k: 'email hire message form' },
        { g: 'Actions', l: 'Copy email address', i: 'i-copy', a: function () { close(); var b = $('[data-copy]'); if (b) b.click(); else if (navigator.clipboard) navigator.clipboard.writeText('xadahiya@gmail.com').then(function () { toast('Copied xadahiya@gmail.com'); }); }, k: 'mail' },
        { g: 'Actions', l: 'Open résumé (PDF)', i: 'i-file', a: open('/resume_2026.pdf'), k: 'cv resume download' },
        { g: 'Actions', l: reduced ? 'Turn motion on' : 'Reduce motion', i: 'i-motion', a: toggleMotion, k: 'animation accessibility' },
        { g: 'Actions', l: 'Toggle layout grid', h: 'G', i: 'i-hash', a: function () { close(); toggleGrid(); }, k: 'columns design' },
        { g: 'Links', l: 'GitHub', i: 'i-github', a: open('https://github.com/xadahiya'), k: 'code' },
        { g: 'Links', l: 'X / Twitter', i: 'i-x', a: open('https://twitter.com/xadahiya'), k: 'social' },
        { g: 'Links', l: 'LinkedIn', i: 'i-linkedin', a: open('https://www.linkedin.com/in/xadahiya'), k: 'social' }
      ].concat(posts.map(function (p) { return { g: 'Writing', l: p.t, h: p.d, i: 'i-arrow', a: go(p.u), k: 'post blog' }; }));
    }
    function render() {
      var q = input.value.trim().toLowerCase();
      shown = !q ? items : items.filter(function (it) {
        var hay = (it.l + ' ' + (it.k || '') + ' ' + it.g).toLowerCase();
        return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
      });
      sel = Math.min(sel, Math.max(0, shown.length - 1));
      if (!shown.length) { list.innerHTML = '<li class="palette__empty mono">No matches. Try “resume” or “github”.</li>'; input.removeAttribute('aria-activedescendant'); return; }
      var html = '', g = '';
      shown.forEach(function (it, i) {
        if (it.g !== g) { g = it.g; html += '<li class="palette__group" role="presentation">' + esc(g) + '</li>'; }
        html += '<li class="palette__item" role="option" id="pal-' + i + '" data-i="' + i + '" aria-selected="' + (i === sel) + '"><svg aria-hidden="true"><use href="#' + it.i + '"/></svg><span>' + esc(it.l) + '</span>' + (it.h ? '<span class="palette__hint">' + esc(it.h) + '</span>' : '') + '</li>';
      });
      list.innerHTML = html;
      input.setAttribute('aria-activedescendant', 'pal-' + sel);
    }
    function move(d) {
      if (!shown.length) return;
      sel = (sel + d + shown.length) % shown.length;
      $$('.palette__item', list).forEach(function (el) { el.setAttribute('aria-selected', String(+el.dataset.i === sel)); });
      input.setAttribute('aria-activedescendant', 'pal-' + sel);
      var cur = $('#pal-' + sel, list); if (cur) cur.scrollIntoView({ block: 'nearest' });
    }
    function openP() {
      if (isOpen) return;
      if (!items) build();
      isOpen = true; lastFocus = document.activeElement;
      if (XA.closeMenu) XA.closeMenu();
      root.hidden = false; input.value = ''; sel = 0; render();
      requestAnimationFrame(function () { root.classList.add('is-open'); input.focus(); });
      if (lenis) lenis.stop();
    }
    function close() {
      if (!isOpen) return;
      isOpen = false; root.classList.remove('is-open');
      setTimeout(function () { if (!isOpen) root.hidden = true; }, 320);
      if (lenis) lenis.start();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    input.addEventListener('input', function () { sel = 0; render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); var it = shown[sel]; if (it) it.a(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { e.preventDefault(); move(e.shiftKey ? -1 : 1); }
    });
    list.addEventListener('pointermove', function (e) { var li = e.target.closest('.palette__item'); if (!li) return; var i = +li.dataset.i; if (i !== sel) { sel = i; move(0); } });
    list.addEventListener('click', function (e) { var li = e.target.closest('.palette__item'); if (li) { var it = shown[+li.dataset.i]; if (it) it.a(); } });
    $$('[data-palette-close]', root).forEach(function (el) { el.addEventListener('click', close); });
    $$('[data-palette-open]').forEach(function (b) { b.addEventListener('click', openP); });
    document.addEventListener('keydown', function (e) {
      var typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '') || e.target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (isOpen) close(); else openP(); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); openP(); }
      else if (e.key === 'g' || e.key === 'G') toggleGrid();
    });
  }
  function toggleGrid() { doc.classList.toggle('show-grid'); toast(doc.classList.contains('show-grid') ? '12-column grid on — press G to hide' : 'Grid off'); }
  function toggleMotion() { try { localStorage.setItem('xa-motion', reduced ? 'on' : 'off'); } catch (e) {} location.reload(); }
  function initMotionToggle() {
    $$('[data-motion-toggle]').forEach(function (b) {
      var s = $('[data-motion-state]', b);
      if (s) s.textContent = reduced ? 'off' : 'on';
      b.setAttribute('aria-pressed', String(!reduced));
      b.addEventListener('click', toggleMotion);
    });
  }

  /* ---------- article pages ---------- */
  function initArticle() {
    var art = $('[data-article]');
    if (!art) return;
    var prog = $('[data-progress]');
    if (prog) {
      var upd = function () { var r = art.getBoundingClientRect(); prog.style.setProperty('--p', clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1).toFixed(4)); };
      window.addEventListener('scroll', upd, { passive: true });
      upd();
    }
    $$('.prose div.highlight').forEach(function (h) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'copy-code'; b.textContent = 'Copy';
      b.addEventListener('click', function () {
        var code = $('code', h);
        if (!code || !navigator.clipboard) return;
        navigator.clipboard.writeText(code.innerText).then(function () { b.textContent = 'Copied ✓'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); });
      });
      h.appendChild(b);
    });
    $$('.prose a[href^="http"]').forEach(function (a) { if (a.hostname !== location.hostname) { a.target = '_blank'; a.rel = 'noopener'; } });
    $$('.prose img').forEach(function (im) { im.loading = 'lazy'; im.decoding = 'async'; });
    var sec = $('[data-comments]');
    if (sec) {
      var load = function () {
        if (sec._loaded) return;
        sec._loaded = true;
        var ph = $('[data-comments-placeholder]', sec); if (ph) ph.remove();
        var s = document.createElement('script');
        s.src = 'https://' + sec.dataset.shortname + '.disqus.com/embed.js'; s.async = true;
        s.setAttribute('data-timestamp', String(Date.now()));
        document.body.appendChild(s);
      };
      var lb = $('[data-comments-load]', sec); if (lb) lb.addEventListener('click', load);
      whenNear(sec, load, '400px 0px');
    }
  }

  /* ---------- boot ---------- */
  safe('chain feed', initChainFeed);
  safe('hero', initHero);
  later('rolls', initRolls);
  later('anchors', initAnchors);
  later('nav', initNav);
  later('menu', initMenu);
  later('palette', initPalette);
  later('motion', initMotionToggle);
  later('reveals', initReveals);
  later('cursor', initCursor);
  later('magnetic', initMagnetic);
  later('article', initArticle);
  later('preview', initPreview);
  later('lazy', function () {
    whenNear($('#about'), initAbout);
    whenNear($('#work'), initSystems);
    whenNear($('#chain'), initChain);
    whenNear($('[data-marquee]'), initMarquee);
    whenNear($('[data-gh]'), initProof, '80% 0px');
    whenNear($('#offchain'), initOffchain);
    whenNear($('[data-shelf]'), initShelf);
    whenNear($('#contact'), initContact);
    whenNear($('[data-foot]'), initFoot);
  });
  setTimeout(function () { later('lenis', initLenis); }, 1800);
  if (window.console && console.log) {
    console.log('%c xadahiya %c hand-built: WebGL2 · Canvas 2D · zero animation libraries',
      'background:#d4ff3a;color:#120c30;font-weight:700;padding:3px 7px;border-radius:3px', 'color:#c2b9ea');
  }
})();
