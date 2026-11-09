/* ==========================================================================
   viz — six small, honest simulations of systems I've built.
   Shared runner: DPR-aware canvases, resize-observed, rendered only while
   on screen, and frozen to a single representative frame under reduced motion.
   Each sim = { resize(w, h), update(dt), draw(ctx, w, h) }.
   ========================================================================== */
(function () {
  'use strict';

  var XA = (window.XA = window.XA || {});
  var defs = {};
  var TAU = Math.PI * 2;
  var BG = '#130d31', INK = '245,242,255', ACC = '212,255,58', WARN = '255,79,216';
  var R = Math.random;

  function I(a) { return 'rgba(' + INK + ',' + a + ')'; }
  function A(a) { return 'rgba(' + ACC + ',' + (a == null ? 1 : a) + ')'; }
  function MG(a) { return 'rgba(' + WARN + ',' + (a == null ? 1 : a) + ')'; }
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    INK = cs.getPropertyValue('--ink-rgb').trim() || INK;
    ACC = cs.getPropertyValue('--accent-rgb').trim() || ACC;
    WARN = cs.getPropertyValue('--warn-rgb').trim() || WARN;
    BG = cs.getPropertyValue('--viz-bg').trim() || BG;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function eio(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function eo(t) { return 1 - Math.pow(1 - t, 3); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function hex(n) { var s = '', c = '0123456789abcdef'; for (var i = 0; i < n; i++) s += c[(R() * 16) | 0]; return s; }
  function cid() { var s = 'bafy', c = 'abcdefghijklmnopqrstuvwxyz234567'; for (var i = 0; i < 5; i++) s += c[(R() * 32) | 0]; return s; }
  function mono(px, w) { return (w || 400) + ' ' + px.toFixed(1) + 'px "JetBrains Mono", ui-monospace, Menlo, monospace'; }
  function txt(ctx, s, x, y, align, color, px) {
    ctx.font = mono(px || 10);
    ctx.textAlign = align || 'left';
    ctx.fillStyle = color || I(0.5);
    ctx.fillText(s, x, y);
  }
  function scaleOf(w, h) { return clamp(Math.min(w, h) / 560, 0.62, 1.15); }
  function dashed(ctx, x0, y0, x1, y1, color, dash) {
    ctx.strokeStyle = color; ctx.setLineDash(dash || [3, 4]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.setLineDash([]);
  }
  function cross(ctx, x, y, r, color) {
    ctx.strokeStyle = color; ctx.beginPath();
    ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
    ctx.stroke();
  }

  function define(name, f) { defs[name] = f; }

  /* ---------------------------------------------------------------- consensus */
  define('consensus', function () {
    var N = 16, need = 13, nodes = [], packets = [], rings = [], chain = [];
    var epoch = 18340, t = 0, quorum = 0, fin = false, cidNow = cid();
    var cx = 0, cy = 0, rx = 0, ry = 0, S = 1;
    var EPOCH = 3.0;
    function begin() {
      epoch++; quorum = 0; fin = false; t = 0;
      var b1 = (R() * N) | 0, b2 = (b1 + 3 + ((R() * (N - 6)) | 0)) % N;
      nodes.forEach(function (n, i) {
        n.bad = i === b1 || i === b2;
        packets.push({ n: n, t0: 0.15 + R() * 1.05, dur: 0.6 + R() * 0.3, done: false, back: 0 });
      });
    }
    return {
      resize: function (w, h) {
        S = scaleOf(w, h);
        N = w < 420 ? 12 : 16; need = N - 3;
        cx = w * 0.5; cy = h * 0.42;
        rx = Math.min(w * 0.37, 340); ry = Math.min(h * 0.27, 205);
        nodes = [];
        for (var i = 0; i < N; i++) {
          var a = i / N * TAU - Math.PI / 2;
          nodes.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, lit: 0, bad: false });
        }
        packets = []; begin();
      },
      update: function (dt) {
        t += dt;
        nodes.forEach(function (n) { n.lit = Math.max(0, n.lit - dt * 0.7); });
        packets.forEach(function (p) {
          if (!p.done && (t - p.t0) / p.dur >= 1) {
            p.done = true;
            if (p.n.bad) p.back = 1e-4; else { quorum++; p.n.lit = 1; }
          }
          if (p.back) p.back += dt * 1.4;
        });
        packets = packets.filter(function (p) { return !p.done || (p.n.bad && p.back < 1); });
        if (!fin && quorum >= need) {
          fin = true;
          rings.push({ r: 30 * S, a: 1 });
          chain.push({ e: epoch, c: cidNow, age: 0 });
          cidNow = cid();
          if (chain.length > 14) chain.shift();
        }
        rings.forEach(function (r) { r.r += dt * 320 * S; r.a -= dt * 0.85; });
        rings = rings.filter(function (r) { return r.a > 0; });
        chain.forEach(function (b) { b.age += dt; });
        if (t > EPOCH) begin();
      },
      draw: function (ctx, w, h) {
        var s = 20 * S, fs = 9 * S + 1.5;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]); ctx.strokeStyle = I(0.08);
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        nodes.forEach(function (n) {
          ctx.strokeStyle = n.lit > 0.01 ? A(0.1 + n.lit * 0.45) : I(0.07);
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(cx, cy); ctx.stroke();
        });
        rings.forEach(function (r) {
          ctx.strokeStyle = A(r.a * 0.7);
          ctx.beginPath(); ctx.ellipse(cx, cy, r.r, r.r * (ry / rx), 0, 0, TAU); ctx.stroke();
        });
        packets.forEach(function (p) {
          var k = (t - p.t0) / p.dur, n = p.n, x, y, e;
          if (k < 0) return;
          if (p.back) {
            e = eo(Math.min(1, p.back));
            var sx = cx + (n.x - cx) * 0.16, sy = cy + (n.y - cy) * 0.16;
            cross(ctx, lerp(sx, n.x, e * 0.45), lerp(sy, n.y, e * 0.45), 4 * S, MG(0.95 * (1 - e)));
            return;
          }
          e = eio(Math.min(1, k));
          var ex = cx + (n.x - cx) * 0.13, ey = cy + (n.y - cy) * 0.13;
          var mx = (n.x + ex) / 2 - (ey - n.y) * 0.12, my = (n.y + ey) / 2 + (ex - n.x) * 0.12;
          x = (1 - e) * (1 - e) * n.x + 2 * (1 - e) * e * mx + e * e * ex;
          y = (1 - e) * (1 - e) * n.y + 2 * (1 - e) * e * my + e * e * ey;
          if (n.bad) { ctx.strokeStyle = I(0.55); ctx.strokeRect(x - 3, y - 3, 6, 6); }
          else { ctx.fillStyle = I(0.95); ctx.fillRect(x - 2.5, y - 2.5, 5, 5); }
        });
        nodes.forEach(function (n) {
          ctx.fillStyle = BG; ctx.beginPath(); ctx.arc(n.x, n.y, 6 * S, 0, TAU); ctx.fill();
          ctx.strokeStyle = n.bad && !fin ? MG(0.55) : I(0.75); ctx.stroke();
          if (n.lit > 0.01) { ctx.fillStyle = A(n.lit); ctx.beginPath(); ctx.arc(n.x, n.y, 3.2 * S, 0, TAU); ctx.fill(); }
        });
        ctx.fillStyle = BG; ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
        ctx.strokeStyle = fin ? A(1) : I(0.8); ctx.strokeRect(cx - s + 0.5, cy - s + 0.5, s * 2 - 1, s * 2 - 1);
        ctx.strokeStyle = I(0.1); ctx.beginPath(); ctx.arc(cx, cy, s * 1.75, 0, TAU); ctx.stroke();
        ctx.strokeStyle = A(0.95); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, s * 1.75, -Math.PI / 2, -Math.PI / 2 + Math.min(1, quorum / need) * TAU); ctx.stroke();
        ctx.lineWidth = 1;
        txt(ctx, pad2(quorum) + '/' + need, cx, cy + 3.5, 'center', fin ? A(1) : I(0.85), fs);

        var bw = 60 * S, bh = 24 * S, gap = 12 * S, by = h - 56 - bh;
        for (var j = 0; j < chain.length; j++) {
          var b = chain[chain.length - 1 - j];
          var slide = b.age < 0.6 ? 1 - eo(b.age / 0.6) : 0;
          var bx = w - 18 - (j + 1) * (bw + gap) + gap + slide * (bw + gap);
          if (bx + bw < 0) break;
          var fresh = j === 0 && b.age < 1.4;
          ctx.strokeStyle = fresh ? A(0.95) : I(0.28); ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
          if (j < chain.length - 1) { ctx.strokeStyle = I(0.16); ctx.beginPath(); ctx.moveTo(bx, by + bh / 2); ctx.lineTo(bx - gap, by + bh / 2); ctx.stroke(); }
          txt(ctx, '#' + b.e, bx + bw / 2, by + bh / 2 + 3.5, 'center', fresh ? A(1) : I(0.5), fs);
        }
        var last = chain[chain.length - 1];
        txt(ctx, 'EPOCH ' + fmt(epoch), 16, 26, 'left', I(0.62), fs);
        txt(ctx, N + ' SNAPSHOTTERS · QUORUM ' + need, w - 16, 26, 'right', I(0.34), fs);
        txt(ctx, fin && last ? 'FINALIZED · CID ' + last.c + '…' : 'COLLECTING SNAPSHOTS…', 16, by - 14, 'left', fin ? A(1) : I(0.45), fs);
      }
    };
  });

  /* ---------------------------------------------------------------- relayer */
  define('relayer', function () {
    var CAP = 8, S = 1, W = 0, H = 0;
    var msgs = [], batch = [], txs = [], events = [], slots = [];
    var spawnT = 0, sealing = 0, sealed = false, nonce = 41020, ops = 0, batches = 0;
    var bx = 0, by = 0, bw = 0, bh = 0, colX = 0;
    function spawn() {
      var replay = R() < 0.1 && msgs.length > 2;
      var assigned = msgs.filter(function (m) { return !m.replay && m.state === 'fly'; }).length + batch.length;
      if (!replay && assigned >= CAP) return;
      var slot = replay ? null : slots[assigned];
      var y0 = H * (0.2 + R() * 0.6);
      msgs.push({
        sx: -12, sy: y0, x: -12, y: y0,
        tx: replay ? bx - 6 : slot.x, ty: replay ? by + bh * (0.2 + R() * 0.6) : slot.y,
        p: 0, dur: 1.05 + R() * 0.6, state: 'fly', replay: replay,
        n: replay ? nonce - 1 - ((R() * 6) | 0) : nonce++, fall: 0
      });
    }
    return {
      resize: function (w, h) {
        W = w; H = h; S = scaleOf(w, h);
        bw = 74 * S; bh = 156 * S; bx = w * 0.5 - bw / 2; by = h * 0.46 - bh / 2;
        colX = w * 0.82;
        slots = [];
        for (var i = 0; i < CAP; i++) slots.push({ x: bx + bw * (i % 2 ? 0.7 : 0.3), y: by + bh * (0.16 + ((i / 2) | 0) * 0.225) });
        msgs = []; batch = []; sealing = 0; sealed = false;
      },
      update: function (dt) {
        spawnT -= dt;
        if (spawnT <= 0 && !sealing) { spawn(); spawnT = 0.1 + R() * 0.26; }
        msgs.forEach(function (m) {
          if (m.state === 'fly') {
            m.p = Math.min(1, m.p + dt / m.dur);
            var e = eio(m.p);
            m.x = lerp(m.sx, m.tx, e); m.y = lerp(m.sy, m.ty, e) + Math.sin(m.p * Math.PI) * (m.sy > H / 2 ? -10 : 10);
            if (m.p >= 1) {
              if (m.replay) { m.state = 'reject'; events.unshift({ s: 'REPLAY REJECTED · NONCE ' + m.n, a: 1 }); }
              else { m.state = 'slot'; batch.push(m); }
            }
          } else if (m.state === 'reject') { m.fall += dt; m.y += dt * 60 * m.fall * 3; }
        });
        msgs = msgs.filter(function (m) { return !(m.state === 'reject' && m.fall > 1.1); });
        if (!sealing && batch.length >= CAP) { sealing = 1e-4; sealed = false; }
        if (sealing) {
          sealing += dt;
          if (sealing > 0.55 && !sealed) {
            sealed = true; ops += CAP; batches++;
            txs.unshift({ id: hex(4), p: 0, age: 0 });
            msgs = msgs.filter(function (m) { return batch.indexOf(m) < 0; });
          }
          if (sealing > 0.8) { batch = []; sealing = 0; }
        }
        txs.forEach(function (x) { x.p = Math.min(1, x.p + dt / 0.75); x.age += dt; });
        if (txs.length > 10) txs.length = 10;
        events.forEach(function (e) { e.a -= dt * 0.33; });
        events = events.filter(function (e) { return e.a > 0; }).slice(0, 3);
      },
      draw: function (ctx, w, h) {
        var fs = 9 * S + 1.5, cxB = bx + bw / 2, cyB = by + bh / 2;
        ctx.lineWidth = 1;
        for (var l = 0; l < 5; l++) dashed(ctx, 0, h * (0.24 + l * 0.13), bx - 16, cyB, I(0.035), [2, 6]);
        dashed(ctx, bx + bw + 8, cyB, colX - 40 * S, cyB, I(0.18));
        ctx.strokeStyle = sealing ? A(0.9) : I(0.6);
        ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
        slots.forEach(function (s) { ctx.strokeStyle = I(0.1); ctx.strokeRect(s.x - 6, s.y - 5, 12, 10); });
        txt(ctx, 'BATCH ' + Math.min(batch.length, CAP) + '/' + CAP, cxB, by - 12, 'center', sealing ? A(1) : I(0.55), fs);

        msgs.forEach(function (m) {
          var x = m.x, y = m.y;
          if (m.state === 'slot' && sealing) { var e = eio(Math.min(1, sealing / 0.55)); x = lerp(m.tx, cxB, e); y = lerp(m.ty, cyB, e); }
          if (m.state === 'reject') { cross(ctx, x, y, 5 * S, MG(Math.max(0, 1 - m.fall))); return; }
          if (m.replay) { ctx.setLineDash([2, 2]); ctx.strokeStyle = MG(0.8); ctx.strokeRect(x - 5, y - 4, 10, 8); ctx.setLineDash([]); return; }
          ctx.fillStyle = m.state === 'slot' ? I(0.95) : I(0.85);
          ctx.fillRect(x - 5, y - 4, 10, 8);
          ctx.strokeStyle = BG; ctx.beginPath(); ctx.moveTo(x - 5, y - 4); ctx.lineTo(x, y); ctx.lineTo(x + 5, y - 4); ctx.stroke();
        });

        var tw = 92 * S, th = 22 * S, gap = 9 * S, top = h * 0.17;
        txt(ctx, 'ONCHAIN', colX, top - 12, 'center', I(0.4), fs);
        txs.forEach(function (x, i) {
          var ty = top + i * (th + gap), tx = colX - tw / 2;
          var p = eio(x.p), ox = lerp(cxB, tx + tw / 2, p), oy = lerp(cyB, ty + th / 2, p);
          if (i === 0 && x.p < 1) {
            ctx.strokeStyle = A(0.95); ctx.strokeRect(ox - tw / 2 * p - 8 * (1 - p), oy - th / 2, tw * p + 16 * (1 - p), th);
            return;
          }
          var fresh = i === 0 && x.age < 1.5;
          ctx.globalAlpha = clamp(1 - (i - 6) * 0.3, 0, 1);
          ctx.strokeStyle = fresh ? A(0.95) : I(0.28); ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
          txt(ctx, 'tx 0x' + x.id + ' · ' + CAP + ' ops', colX, ty + th / 2 + 3.5, 'center', fresh ? A(1) : I(0.55), fs - 0.5);
          ctx.globalAlpha = 1;
        });

        txt(ctx, 'RELAYER · EIP-712', 16, 26, 'left', I(0.62), fs);
        txt(ctx, 'USER GAS PAID 0.000 ETH', w - 16, 26, 'right', I(0.34), fs);
        events.forEach(function (e, i) { txt(ctx, e.s, 16, h - 44 - i * 15, 'left', MG(e.a), fs); });
        txt(ctx, batches + ' BATCHES · ' + ops + ' OPS', w - 16, h - 16, 'right', I(0.4), fs);
      }
    };
  });

  /* ---------------------------------------------------------------- stream */
  define('stream', function () {
    var S = 1, M = 140, vals = [], snaps = [], list = [];
    var acc = 0, TICK = 0.085, mean = 3412, v = 3412, tick = 0, epoch = 4810, wide = true;
    function next() { v += (mean - v) * 0.012 + (R() - 0.5) * 8 + (R() < 0.025 ? (R() - 0.5) * 46 : 0); return v; }
    return {
      resize: function (w, h) {
        S = scaleOf(w, h); wide = w > 520;
        M = Math.round(clamp(w / 5, 60, 170));
        vals = []; v = mean;
        for (var i = 0; i < M; i++) vals.push(next());
        snaps = [];
      },
      update: function (dt) {
        acc += dt;
        while (acc >= TICK) {
          acc -= TICK;
          vals.push(next()); vals.shift(); tick++;
          snaps.forEach(function (s) { s.i--; });
          if (tick % 22 === 0) {
            epoch++;
            var s = { i: M - 1, c: cid(), e: epoch, age: 0, val: vals[M - 1] };
            snaps.push(s); list.unshift(s);
            if (list.length > 5) list.length = 5;
          }
        }
        snaps = snaps.filter(function (s) { return s.i > -3; });
        snaps.forEach(function (s) { s.age += dt; });
      },
      draw: function (ctx, w, h) {
        var fs = 9 * S + 1.5;
        var x0 = 16, x1 = w - (wide ? 178 * S : 16), y0 = 60, y1 = h - 66;
        var lo = Infinity, hi = -Infinity;
        vals.forEach(function (q) { lo = Math.min(lo, q); hi = Math.max(hi, q); });
        var padv = (hi - lo) * 0.18 + 4; lo -= padv; hi += padv;
        var dx = (x1 - x0) / (M - 2), off = acc / TICK;
        var X = function (i) { return x0 + (i - off) * dx; };
        var Y = function (q) { return y1 - (q - lo) / (hi - lo) * (y1 - y0); };
        ctx.lineWidth = 1;
        for (var g = 0; g <= 4; g++) {
          var gy = lerp(y0, y1, g / 4);
          dashed(ctx, x0, gy, x1, gy, I(0.05), [1, 5]);
          if (g > 0 && g < 4) txt(ctx, (hi - (hi - lo) * g / 4).toFixed(1), x0 + 4, gy - 5, 'left', I(0.3), fs - 1);
        }
        ctx.save();
        ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, h); ctx.clip();
        ctx.beginPath();
        for (var i = 0; i < M; i++) { var px = X(i), py = Y(vals[i]); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.lineTo(X(M - 1), y1); ctx.lineTo(X(0), y1); ctx.closePath();
        var grd = ctx.createLinearGradient(0, y0, 0, y1); grd.addColorStop(0, I(0.07)); grd.addColorStop(1, I(0));
        ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath();
        for (var k = 0; k < M; k++) { var qx = X(k), qy = Y(vals[k]); if (k) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy); }
        ctx.strokeStyle = I(0.92); ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
        snaps.forEach(function (s) {
          var sx = X(s.i);
          if (sx < x0 - 4 || sx > x1 + 4) return;
          var fresh = s.age < 1.2;
          dashed(ctx, sx, y0 - 8, sx, y1, fresh ? A(0.6) : I(0.16));
          ctx.fillStyle = fresh ? A(1) : I(0.8); ctx.fillRect(sx - 3, Y(s.val) - 3, 6, 6);
          txt(ctx, '#' + s.e, sx + 5, y0 - 2, 'left', fresh ? A(1) : I(0.4), fs - 0.5);
          txt(ctx, '✓ ' + s.c, sx + 5, y1 - 6, 'left', fresh ? A(0.9) : I(0.3), fs - 1);
        });
        ctx.restore();
        var lx = X(M - 1), ly = Y(vals[M - 1]);
        var pulse = (tick % 12) / 12 + off / 12;
        ctx.strokeStyle = A(0.6 * (1 - pulse)); ctx.beginPath(); ctx.arc(lx, ly, 4 + pulse * 12, 0, TAU); ctx.stroke();
        ctx.fillStyle = A(1); ctx.beginPath(); ctx.arc(lx, ly, 3.2, 0, TAU); ctx.fill();

        if (wide) {
          var sx0 = w - 156 * S;
          txt(ctx, 'LAST', sx0, y0 + 4, 'left', I(0.34), fs);
          txt(ctx, vals[M - 1].toFixed(2), sx0, y0 + 30 * S, 'left', I(0.95), 20 * S);
          var d = (vals[M - 1] - vals[M - 21]) / vals[M - 21] * 100;
          txt(ctx, (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(2) + '%', sx0, y0 + 50 * S, 'left', d >= 0 ? I(0.6) : A(0.85), fs);
          txt(ctx, 'SNAPSHOTS', sx0, y0 + 92 * S, 'left', I(0.34), fs);
          list.forEach(function (s, i) {
            var yy = y0 + 112 * S + i * 18 * S;
            txt(ctx, '#' + s.e, sx0, yy, 'left', i === 0 && s.age < 1.2 ? A(1) : I(0.6), fs);
            txt(ctx, s.c + ' ✓', sx0 + 50 * S, yy, 'left', I(0.34), fs - 0.5);
          });
        }
        txt(ctx, 'REAL-TIME POOL STREAM', 16, 26, 'left', I(0.62), fs);
        txt(ctx, 'EPOCH ' + fmt(epoch) + ' · PROOF → IPFS', w - 16, 26, 'right', I(0.34), fs);
      }
    };
  });

  /* ---------------------------------------------------------------- markets */
  define('markets', function () {
    var S = 1, wide = true, pts = [], T = 0, LIFE = 6.4, RES = 4.7, outcome = 1, mid = '', p = 0.5;
    var resolved = false, recent = [], floaters = [], snap = 18342, sampleAcc = 0, RATE = 40;
    function begin() {
      pts = []; T = 0; sampleAcc = 0;
      p = 0.35 + R() * 0.3; outcome = R() < 0.55 ? 1 : 0;
      mid = '0x' + hex(4); resolved = false;
      snap += 6 + ((R() * 5) | 0);
    }
    begin();
    return {
      resize: function (w, h) { S = scaleOf(w, h); wide = w > 520; },
      update: function (dt) {
        T += dt; sampleAcc += dt;
        while (sampleAcc >= 1 / RATE) {
          sampleAcc -= 1 / RATE;
          var tt = pts.length / RATE;
          if (tt < RES) {
            var target = outcome ? 0.5 + 0.38 * (tt / RES) : 0.5 - 0.38 * (tt / RES);
            p += (target - p) * 0.025 + (R() - 0.5) * 0.04;
            p = clamp(p, 0.04, 0.96);
          } else {
            if (!resolved) {
              resolved = true;
              recent.unshift({ id: mid, o: outcome }); if (recent.length > 4) recent.length = 4;
              for (var f = 0; f < 4; f++) floaters.push({ v: (40 + ((R() * 9) | 0) * 10), x: 0, y: 0, a: 1, d: f * 0.15, vx: (R() - 0.5) * 16 });
            }
            p += (outcome - p) * 0.22;
          }
          if (tt <= LIFE) pts.push(p);
        }
        floaters.forEach(function (f) { if (f.d > 0) { f.d -= dt; return; } f.y -= dt * 46; f.x += f.vx * dt; f.a -= dt * 0.7; });
        floaters = floaters.filter(function (f) { return f.a > 0; });
        if (T > LIFE) begin();
      },
      draw: function (ctx, w, h) {
        var fs = 9 * S + 1.5;
        var x0 = 16, x1 = w - (wide ? 190 * S : 52), y0 = 64, y1 = h - 70;
        var X = function (tt) { return x0 + tt / LIFE * (x1 - x0); };
        var Y = function (q) { return y1 - q * (y1 - y0); };
        var alpha = clamp(Math.min(T / 0.35, (LIFE - T) / 0.4), 0, 1);
        ctx.lineWidth = 1;
        [0, 0.25, 0.5, 0.75, 1].forEach(function (g) {
          dashed(ctx, x0, Y(g), x1, Y(g), I(g === 0.5 ? 0.12 : 0.05), [1, 5]);
          if (g % 0.5 === 0) txt(ctx, (g * 100) + '%', x1 + 8, Y(g) + 3, 'left', I(0.28), fs - 1);
        });
        var rx = X(RES);
        if (!resolved) {
          dashed(ctx, rx, y0 - 10, rx, y1, I(0.22));
          txt(ctx, 'RESOLVES @ SNAPSHOT #' + fmt(snap), rx - 6, y0 - 16, 'right', I(0.4), fs - 0.5);
        } else {
          ctx.strokeStyle = A(0.9); ctx.beginPath(); ctx.moveTo(rx, y0 - 10); ctx.lineTo(rx, y1); ctx.stroke();
          txt(ctx, 'RESOLVED ' + (outcome ? 'YES' : 'NO') + ' · SNAPSHOT #' + fmt(snap), rx - 6, y0 - 16, 'right', outcome ? A(1) : MG(1), fs - 0.5);
        }
        ctx.globalAlpha = alpha;
        if (pts.length > 1) {
          ctx.beginPath();
          pts.forEach(function (q, i) { var px = X(i / RATE), py = Y(1 - q); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
          ctx.strokeStyle = I(0.22); ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
          ctx.beginPath();
          pts.forEach(function (q, i) { var px = X(i / RATE), py = Y(q); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
          ctx.strokeStyle = I(0.95); ctx.lineWidth = 1.6; ctx.stroke(); ctx.lineWidth = 1;
          var hx = X((pts.length - 1) / RATE), hy = Y(pts[pts.length - 1]);
          ctx.fillStyle = resolved ? (outcome ? A(1) : MG(1)) : I(1); ctx.beginPath(); ctx.arc(hx, hy, 3.4, 0, TAU); ctx.fill();
          txt(ctx, 'YES ' + Math.round(pts[pts.length - 1] * 100) + '%', hx + 9, hy - 8, 'left', resolved ? (outcome ? A(1) : MG(1)) : I(0.85), fs);
          floaters.forEach(function (f) { if (f.d <= 0) txt(ctx, '+' + f.v + ' PTS', hx + 10 + f.x, hy - 22 + f.y, 'left', A(f.a), fs - 0.5); });
        }
        ctx.globalAlpha = 1;
        if (wide) {
          var sx = w - 166 * S;
          txt(ctx, 'MARKET ' + mid, sx, y0 + 4, 'left', I(0.75), fs);
          txt(ctx, 'RECENTLY RESOLVED', sx, y0 + 40 * S, 'left', I(0.34), fs);
          recent.forEach(function (r, i) {
            var yy = y0 + 62 * S + i * 18 * S;
            txt(ctx, r.id, sx, yy, 'left', I(0.5), fs);
            txt(ctx, (r.o ? 'YES' : 'NO ') + ' ✓', sx + 70 * S, yy, 'left', r.o ? A(0.95) : MG(0.9), fs);
          });
        }
        txt(ctx, 'GENERATIVE PREDICTION MARKET', 16, 26, 'left', I(0.62), fs);
        txt(ctx, 'SOURCE · LIVE SNAPSHOTS', w - 16, 26, 'right', I(0.34), fs);
      }
    };
  });

  /* ---------------------------------------------------------------- similarity */
  define('similarity', function () {
    var S = 1, M = 24, cells = [], prog = 0, hold = 0, labels = [], compared = 0, flagged = 0;
    var ox = 0, oy = 0, cs = 10, SCAN = 3.6;
    function gen() {
      cells = []; labels = []; prog = 0; hold = 0;
      for (var i = 0; i < M; i++) for (var j = i + 1; j < M; j++) cells.push({ i: i, j: j, v: Math.pow(R(), 2.6) * 0.62, f: false, done: 0 });
      var nf = 3 + ((R() * 2) | 0);
      for (var k = 0; k < nf; k++) {
        var c = cells[(R() * cells.length) | 0];
        c.v = 0.86 + R() * 0.11; c.f = true;
        c.a = 1000 + ((R() * 8999) | 0); c.b = 1000 + ((R() * 8999) | 0);
      }
    }
    return {
      resize: function (w, h) {
        S = scaleOf(w, h);
        M = w < 420 ? 16 : 24;
        cs = Math.max(6, Math.floor(Math.min((w - 40) / M, (h - 116) / M)));
        ox = w - 20 - cs * M; oy = 52;
        gen();
      },
      update: function (dt) {
        if (prog < 1) {
          prog = Math.min(1, prog + dt / SCAN);
          var n = Math.floor(prog * cells.length);
          for (var k = 0; k < n; k++) {
            var c = cells[k];
            if (!c.done) { c.done = 1e-4; compared++; if (c.f) { labels.push({ c: c, age: 0 }); flagged++; } }
          }
        } else { hold += dt; if (hold > 2.1) gen(); }
        cells.forEach(function (c) { if (c.done) c.done += dt; });
        labels.forEach(function (l) { l.age += dt; });
      },
      draw: function (ctx, w, h) {
        var fs = 9 * S + 1.5, n = Math.floor(prog * cells.length), cur = cells[Math.min(n, cells.length - 1)];
        var fade = prog >= 1 ? clamp(1 - (hold - 1.6) / 0.5, 0, 1) : 1;
        ctx.globalAlpha = fade;
        ctx.lineWidth = 1;
        if (prog < 1 && cur) {
          ctx.fillStyle = A(0.07);
          ctx.fillRect(ox, oy + cur.i * cs, cs * M, cs);
          ctx.fillRect(ox + cur.j * cs, oy, cs, cs * M);
        }
        var gap = cs > 9 ? 1.5 : 1;
        cells.forEach(function (c) {
          var x = ox + c.j * cs, y = oy + c.i * cs;
          if (!c.done) { ctx.fillStyle = I(0.04); ctx.fillRect(x + cs / 2 - 1, y + cs / 2 - 1, 2, 2); return; }
          var a = Math.min(1, c.done * 5);
          if (c.f) {
            ctx.fillStyle = MG(a); ctx.fillRect(x + gap, y + gap, cs - gap * 2, cs - gap * 2);
            var pr = (c.done % 1.6) / 1.6;
            ctx.strokeStyle = MG(0.75 * (1 - pr)); ctx.strokeRect(x - pr * 8, y - pr * 8, cs + pr * 16, cs + pr * 16);
          } else {
            ctx.fillStyle = I(c.v * 0.8 * a + 0.03); ctx.fillRect(x + gap, y + gap, cs - gap * 2, cs - gap * 2);
          }
        });
        ctx.strokeStyle = I(0.12);
        ctx.beginPath(); ctx.moveTo(ox + cs, oy); ctx.lineTo(ox + cs * M, oy); ctx.lineTo(ox + cs * M, oy + cs * (M - 1)); ctx.stroke();
        labels.forEach(function (l, i) {
          var c = l.c, lx = ox + 4, ly = oy + cs * M - 6 - (labels.length - 1 - i) * 17 * S;
          var cxp = ox + c.j * cs + cs / 2, cyp = oy + c.i * cs + cs / 2;
          var a = Math.min(1, l.age * 3);
          ctx.strokeStyle = MG(0.4 * a);
          ctx.beginPath(); ctx.moveTo(cxp, cyp); ctx.lineTo(cxp, ly - 3); ctx.lineTo(lx + 200 * S, ly - 3); ctx.stroke();
          txt(ctx, 'PAIR ' + c.a + ' × ' + c.b + ' · ' + c.v.toFixed(2) + ' · FLAGGED', lx, ly, 'left', MG(a), fs - 0.5);
        });
        ctx.globalAlpha = 1;
        txt(ctx, 'PAIRWISE SIMILARITY', 16, 26, 'left', I(0.62), fs);
        txt(ctx, 'COMPARED ' + fmt(compared) + ' · FLAGGED ' + flagged, w - 16, 26, 'right', I(0.34), fs);
        txt(ctx, 'THRESHOLD 0.85', w - 16, h - 16, 'right', I(0.34), fs);
      }
    };
  });

  /* ---------------------------------------------------------------- gateway */
  define('gateway', function () {
    var S = 1, W = 0, H = 0, reqs = [], clients = [], services = [], spawnAcc = 0, served = 0, blocked = 0;
    var gx = 0, gy = 0, gw = 0, gh = 0, RATE = 34.7; // 3M requests / 86,400 s
    var BANDS = ['AUTH', 'RATE', 'ROUTE'];
    function spawn() {
      var c = clients[(R() * clients.length) | 0];
      var bad = R() < 0.035;
      reqs.push({
        ph: 0, p: 0, dur: 0.75 + R() * 0.5, sx: c.x, sy: c.y,
        ey: gy + gh * (0.32 + R() * 0.36), svc: services[(R() * services.length) | 0],
        bad: bad, stopBand: bad ? (R() < 0.6 ? 1 : 2) : 0, fall: 0, x: c.x, y: c.y, c: c
      });
      c.f = 1;
    }
    return {
      resize: function (w, h) {
        W = w; H = h; S = scaleOf(w, h);
        gw = 108 * S; gh = h * 0.5; gx = w * 0.47 - gw / 2; gy = h * 0.25;
        clients = []; services = [];
        var nc = w < 420 ? 4 : 6;
        for (var i = 0; i < nc; i++) clients.push({ x: 26, y: h * (0.2 + 0.6 * i / (nc - 1)), f: 0 });
        for (var j = 0; j < 4; j++) services.push({ x: w - 18 - 64 * S, y: h * (0.24 + 0.52 * j / 3), f: 0, id: 'svc·0' + (j + 1) });
        reqs = [];
      },
      update: function (dt) {
        spawnAcc += dt * RATE;
        while (spawnAcc >= 1) { spawnAcc -= 1; spawn(); }
        var band = gw / 3;
        reqs.forEach(function (r) {
          if (r.ph === 0) {
            r.p = Math.min(1, r.p + dt / r.dur);
            var e = eio(r.p);
            r.x = lerp(r.sx, gx, e); r.y = lerp(r.sy, r.ey, e);
            if (r.p >= 1) { r.ph = 1; r.p = 0; }
          } else if (r.ph === 1) {
            r.p = Math.min(1, r.p + dt / 0.42);
            r.x = gx + gw * r.p;
            if (r.bad && r.x >= gx + band * r.stopBand) { r.x = gx + band * r.stopBand; r.ph = 3; blocked++; }
            else if (r.p >= 1) { r.ph = 2; r.p = 0; r.sx2 = r.x; r.sy2 = r.y; }
          } else if (r.ph === 2) {
            r.p = Math.min(1, r.p + dt / 0.7);
            var e2 = eio(r.p);
            r.x = lerp(r.sx2, r.svc.x, e2); r.y = lerp(r.sy2, r.svc.y + 13 * S, e2);
            if (r.p >= 1) { r.ph = 4; r.svc.f = 1; served++; }
          } else if (r.ph === 3) { r.fall += dt; r.y += dt * 90 * r.fall * 2.5; }
        });
        reqs = reqs.filter(function (r) { return r.ph !== 4 && !(r.ph === 3 && r.fall > 1); });
        clients.forEach(function (c) { c.f = Math.max(0, c.f - dt * 4); });
        services.forEach(function (s) { s.f = Math.max(0, s.f - dt * 2.5); });
      },
      draw: function (ctx, w, h) {
        var fs = 9 * S + 1.5, band = gw / 3;
        ctx.lineWidth = 1;
        clients.forEach(function (c) {
          ctx.strokeStyle = I(0.05);
          ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.bezierCurveTo(gx * 0.5, c.y, gx * 0.5, gy + gh / 2, gx, gy + gh / 2); ctx.stroke();
          ctx.fillStyle = BG; ctx.fillRect(c.x - 5, c.y - 5, 10, 10);
          ctx.strokeStyle = c.f > 0 ? I(0.4 + c.f * 0.5) : I(0.4); ctx.strokeRect(c.x - 4.5, c.y - 4.5, 9, 9);
        });
        services.forEach(function (s) {
          ctx.strokeStyle = I(0.05);
          ctx.beginPath(); ctx.moveTo(gx + gw, gy + gh / 2); ctx.bezierCurveTo(gx + gw + 60, gy + gh / 2, s.x - 60, s.y + 13 * S, s.x, s.y + 13 * S); ctx.stroke();
        });
        ctx.fillStyle = BG; ctx.fillRect(gx, gy, gw, gh);
        ctx.strokeStyle = I(0.65); ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);
        for (var b = 1; b < 3; b++) dashed(ctx, gx + band * b, gy + 6, gx + band * b, gy + gh - 6, I(0.16), [2, 4]);
        BANDS.forEach(function (l, i) { txt(ctx, l, gx + band * (i + 0.5), gy - 10, 'center', I(0.45), fs - 1); });
        reqs.forEach(function (r) {
          if (r.ph === 3) { cross(ctx, r.x, r.y, 4 * S, MG(Math.max(0, 1 - r.fall))); return; }
          var inside = r.ph === 1;
          var sz = r.ph === 2 ? 1.7 : 2.6;
          ctx.fillStyle = inside ? A(0.95) : (r.ph === 2 ? I(0.7) : I(0.92));
          ctx.fillRect(r.x - sz / 2, r.y - sz / 2, sz, sz);
        });
        services.forEach(function (s) {
          var sw = 64 * S, sh = 26 * S;
          ctx.fillStyle = BG; ctx.fillRect(s.x, s.y, sw, sh);
          ctx.strokeStyle = s.f > 0 ? A(0.3 + s.f * 0.7) : I(0.35); ctx.strokeRect(s.x + 0.5, s.y + 0.5, sw - 1, sh - 1);
          txt(ctx, s.id, s.x + sw / 2, s.y + sh / 2 + 3.5, 'center', s.f > 0.3 ? A(1) : I(0.6), fs - 0.5);
        });
        txt(ctx, 'API GATEWAY', 16, 26, 'left', I(0.62), fs);
        txt(ctx, '≈ 3M REQ/DAY · ' + RATE.toFixed(1) + ' REQ/S', w - 16, 26, 'right', I(0.34), fs);
        txt(ctx, 'SERVED ' + fmt(served) + ' · BLOCKED ' + blocked, w - 16, h - 16, 'right', I(0.4), fs);
        txt(ctx, 'BROTLI · AUTH0 · ELK', gx + gw / 2, gy + gh + 22, 'center', I(0.3), fs - 1);
      }
    };
  });

  /* ---------------------------------------------------------------- runner */
  function mount(root, opts) {
    var reduced = !!(opts && opts.reduced);
    var inst = [];
    readTheme();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var v = e.target.__viz; if (v) v.visible = e.isIntersecting; });
    }, { rootMargin: '80px 0px' });
    Array.prototype.forEach.call(root.querySelectorAll('canvas[data-viz]'), function (cv) {
      var f = defs[cv.getAttribute('data-viz')];
      var ctx = f && cv.getContext('2d');
      if (!ctx) return;
      var v = { cv: cv, ctx: ctx, w: 0, h: 0, dpr: 1, visible: false, sim: f(), stale: true };
      v.resize = function () {
        var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = Math.round(r.width), h = Math.round(r.height);
        if (!w || !h || (w === v.w && h === v.h && dpr === v.dpr)) return;
        v.w = w; v.h = h; v.dpr = dpr;
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
        v.sim.resize(w, h);
        if (reduced) for (var k = 0; k < 260; k++) v.sim.update(1 / 60);
        v.stale = true;
      };
      v.render = function () {
        ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
        ctx.clearRect(0, 0, v.w, v.h);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0.6px';
        ctx.textBaseline = 'alphabetic';
        v.sim.draw(ctx, v.w, v.h);
        v.stale = false;
      };
      cv.__viz = v;
      io.observe(cv);
      if (window.ResizeObserver) new ResizeObserver(function () { v.resize(); }).observe(cv);
      v.resize();
      inst.push(v);
    });
    if (!inst.length) return null;
    return {
      tick: function (t, dt) {
        for (var i = 0; i < inst.length; i++) {
          var v = inst[i];
          if (!v.visible || v.paused || !v.w) continue;
          if (reduced) { if (v.stale) v.render(); continue; }
          v.sim.update(Math.min(dt, 0.05));
          v.render();
        }
      }
    };
  }

  XA.viz = { define: define, mount: mount };
})();
