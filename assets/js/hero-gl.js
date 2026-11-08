/* ==========================================================================
   HeroGL — the name as a field of particles.
   - Glyph targets are sampled from the real (aria-hidden) name element, per
     character, so particles land exactly where the type is laid out.
   - burst: particles stream out of a point (the preloader mark) into a cloud.
   - scan:  a "snapshot" line captures drifting particles into formation.
   - flow:  the pointer paints a decaying velocity field (ping-pong RGBA8 FBO)
            that pushes particles around like sand.
   - pulse(): a ring wave through the field (one per new Ethereum block).
   ========================================================================== */
(function () {
  'use strict';

  var NOISE = [
    'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
    'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
    'float snoise(vec3 v){',
    '  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);',
    '  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);',
    '  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);',
    '  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;',
    '  i=mod289(i);',
    '  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
    '  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;',
    '  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);',
    '  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);',
    '  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);',
    '  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));',
    '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
    '  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);',
    '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
    '  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;',
    '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;',
    '  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
    '}'
  ].join('\n');

  var VERT = [
    '#version 300 es',
    'precision highp float;',
    'layout(location=0) in vec2 aTarget;',
    'layout(location=1) in vec4 aSeed;',
    'layout(location=2) in float aKind;',
    'uniform vec2 uRes; uniform float uDpr; uniform float uTime; uniform float uMotion;',
    'uniform float uScan; uniform float uScanW; uniform float uScroll; uniform float uSize;',
    'uniform float uBurst; uniform vec2 uOrigin;',
    'uniform vec4 uPulse; uniform sampler2D uFlow; uniform float uFlowAmp;',
    'out float vAlpha; out float vHeat; out float vAccent; out float vForm;',
    NOISE,
    'float easeOutBack(float x){ float c1=1.45; float c3=c1+1.0; return 1.0+c3*pow(x-1.0,3.0)+c1*pow(x-1.0,2.0); }',
    'void main(){',
    '  bool dust = aKind > 0.5;',
    '  float t = uTime * uMotion;',
    '  float spread = mix(10.0, 0.4 * uRes.x, pow(aSeed.x, 7.0));',
    '  vec2 dirH = vec2(cos(aSeed.y * 6.2831853), sin(aSeed.y * 6.2831853));',
    '  vec2 home = dust ? aTarget : aTarget + dirH * spread * vec2(1.0, 0.62);',
    '  vec2 q = home * 0.0019;',
    '  float tt = t * 0.05;',
    '  vec2 drift = vec2(snoise(vec3(q, tt + aSeed.z * 9.0)), snoise(vec3(q + 19.7, tt + aSeed.w * 9.0)));',
    '  vec2 chaos = home + drift * (dust ? 140.0 : 30.0 + spread * 0.3);',
    '  float since = (uScan - aTarget.x) / uScanW - aSeed.z * 0.55;',
    '  float form = dust ? 0.0 : easeOutBack(clamp(since, 0.0, 1.0));',
    '  vec2 jit = uMotion > 0.5 ? vec2(snoise(vec3(aTarget * 0.035, t * 0.32)), snoise(vec3(aTarget * 0.035 + 7.3, t * 0.32))) : vec2(0.0);',
    '  vec2 pos = mix(chaos, aTarget + jit * 0.85, form);',
    // burst out of the preloader mark
    '  float b = clamp((uBurst - aSeed.w * 0.4) / 0.6, 0.0, 1.0);',
    '  float be = 1.0 - pow(1.0 - b, 4.0);',
    '  pos = mix(uOrigin + (aSeed.xy - 0.5) * 22.0, pos, be);',
    '  float s = uScroll * uScroll;',
    '  vec2 wind = normalize(vec2(aSeed.x - 0.35, -0.55 - aSeed.y) + drift * 0.7);',
    '  pos += wind * s * uRes.y * (0.35 + aSeed.w * 0.9);',
    '  vec2 uv = clamp(pos / uRes, 0.0, 1.0);',
    '  vec2 f = (texture(uFlow, vec2(uv.x, 1.0 - uv.y)).xy * 255.0 - 128.0) / 127.0;',
    '  f.y = -f.y;',
    '  float fl = length(f);',
    '  pos += f * uFlowAmp * (0.45 + aSeed.w * 1.1) + drift * fl * 34.0;',
    '  float age = uTime - uPulse.z;',
    '  float d = distance(pos, uPulse.xy);',
    '  float ring = uPulse.w * step(0.0, age) * exp(-pow((d - age * 760.0) / 52.0, 2.0)) * exp(-age * 0.9);',
    '  pos += (pos - uPulse.xy) / max(d, 1.0) * ring * 26.0;',
    '  vec2 clip = pos / uRes * 2.0 - 1.0;',
    '  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);',
    '  float heat = dust ? 0.0 : step(0.0, since) * exp(-max(since, 0.0) * 2.2);',
    '  float size = uSize * (dust ? 0.45 + aSeed.w * 0.55 : 0.82 + aSeed.w * 0.42);',
    '  gl_PointSize = max(1.0, size * uDpr * (1.0 + heat * 0.8 + ring * 1.3 + min(fl, 1.0) * 0.5 + (1.0 - be) * 0.6));',
    '  float a = dust ? 0.16 + 0.22 * aSeed.z : mix(0.32, 0.92, clamp(form, 0.0, 1.0));',
    '  vAlpha = a * (1.0 - smoothstep(0.05, 0.92, uScroll)) * smoothstep(0.0, 0.2, b);',
    '  vHeat = clamp(heat + ring * 0.85 + (1.0 - be) * 0.9, 0.0, 1.0);',
    '  vAccent = dust ? step(0.985, aSeed.y) * 0.8 : step(0.972, aSeed.y);',
    '  vForm = dust ? 0.0 : clamp(form, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    '#version 300 es',
    'precision mediump float;',
    'in float vAlpha; in float vHeat; in float vAccent; in float vForm;',
    'uniform vec3 uInk; uniform vec3 uHot; uniform vec3 uNoise;',
    'out vec4 o;',
    'void main(){',
    '  vec2 c = gl_PointCoord * 2.0 - 1.0;',
    '  float r2 = dot(c, c);',
    '  if (r2 > 1.0) discard;',
    '  float a = vAlpha * (1.0 - smoothstep(0.45, 1.0, r2));',
    '  vec3 col = mix(mix(uNoise, uInk, vForm), uHot, clamp(vHeat + vAccent, 0.0, 1.0));',
    '  o = vec4(col * a, a);',
    '}'
  ].join('\n');

  var QUAD = [
    '#version 300 es',
    'layout(location=0) in vec2 aPos;',
    'out vec2 vUv;',
    'void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var AURA = [
    '#version 300 es',
    'precision mediump float;',
    'in vec2 vUv;',
    'uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uMouseOn; uniform float uFade; uniform float uFlare;',
    'uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;',
    'out vec4 o;',
    'float blob(vec2 p, vec2 c, vec2 r){ vec2 d = (p - c) / r; return exp(-dot(d, d)); }',
    'void main(){',
    // coordinates in units of the long edge, so blobs keep their proportions on any screen
    '  vec2 sc = uRes / max(uRes.x, uRes.y); vec2 p = vUv * sc; float t = uTime;',
    '  vec2 c1 = vec2(0.32 + 0.07 * sin(t * 0.13), 0.56 + 0.06 * cos(t * 0.11)) * sc;',
    '  vec2 c2 = vec2(0.70 + 0.06 * cos(t * 0.09), 0.42 + 0.07 * sin(t * 0.12 + 1.0)) * sc;',
    '  vec2 c3 = vec2(0.56 + 0.09 * sin(t * 0.07 + 1.3), 0.76 + 0.05 * sin(t * 0.15)) * sc;',
    '  vec2 c4 = vec2(0.12 + 0.05 * cos(t * 0.10), 0.18 + 0.05 * sin(t * 0.08)) * sc;',
    '  float b1 = blob(p, c1, vec2(0.34, 0.24)), b2 = blob(p, c2, vec2(0.30, 0.22)), b3 = blob(p, c3, vec2(0.21, 0.15)), b4 = blob(p, c4, vec2(0.25, 0.2));',
    '  float bm = blob(p, uMouse * sc, vec2(0.14, 0.14)) * uMouseOn;',
    '  vec3 col = uC1 * (b1 * 0.36 + b4 * 0.14) + uC2 * (b2 * 0.32 + bm * 0.2) + uC3 * b3 * 0.2;',
    '  col *= (1.0 + uFlare * 0.9) * uFade * mix(0.62, 1.0, smoothstep(0.55, 1.1, uRes.x / uRes.y));',
    '  o = vec4(col, max(max(col.r, col.g), col.b));',
    '}'
  ].join('\n');

  var FLOW = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUv;',
    'uniform sampler2D uPrev; uniform vec2 uMouse; uniform vec2 uVel; uniform float uAspect; uniform float uRadius; uniform float uDecay;',
    'out vec4 o;',
    'void main(){',
    '  vec2 v = (texture(uPrev, vUv).xy * 255.0 - 128.0) / 127.0;',
    '  v *= uDecay;',
    '  v -= sign(v) * min(abs(v), vec2(1.0 / 127.0));',
    '  vec2 d = vUv - uMouse; d.x *= uAspect;',
    '  v += uVel * exp(-dot(d, d) / (uRadius * uRadius));',
    '  v = clamp(v, -1.0, 1.0);',
    '  o = vec4((v * 127.0 + 128.0) / 255.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  function hex(c) {
    c = String(c || '').trim().replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var n = parseInt(c, 16) || 0;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function HeroGL(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.textEl = opts.textEl;
    this.motion = opts.reduced ? 0 : 1;
    var gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('webgl2 unavailable');
    this.gl = gl;
    this.par = gl.getExtension('KHR_parallel_shader_compile');
    var rend = String(gl.getParameter(gl.RENDERER) || '');
    if (/webkit webgl/i.test(rend)) {
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) rend = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || rend);
    }
    this.lowPower = /swiftshader|llvmpipe|software|basic render|softpipe/i.test(rend);
    // compile + link now; status is checked later so the driver can work off-thread
    this.pts = this.build(VERT, FRAG);
    this.flowP = this.build(QUAD, FLOW);
    this.auraP = this.build(QUAD, AURA);
    this.mouseOn = 0;
    this.linked = false;

    this.quad = gl.createVertexArray();
    gl.bindVertexArray(this.quad);
    var qb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, qb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.vao = gl.createVertexArray();
    this.buf = gl.createBuffer();
    this.count = 0;
    this.time = 0;
    this.scan = -1e5;
    this.scanW = 300;
    this.scroll = 0;
    this.burst = 1;
    this.origin = [0, 0];
    this.pulseV = [0, 0, -100, 0];
    this.mouse = { x: -1e4, y: -1e4, px: -1e4, py: -1e4, vx: 0, vy: 0, on: false };
    this.flow = null;
    this.w = this.h = 0;
    this.dpr = 1;
    this.fontSize = 100;
    this.setColors(opts);
  }

  HeroGL.prototype.build = function (vs, fs) {
    var gl = this.gl, p = gl.createProgram();
    var a = gl.createShader(gl.VERTEX_SHADER), b = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(a, vs); gl.compileShader(a);
    gl.shaderSource(b, fs); gl.compileShader(b);
    gl.attachShader(p, a); gl.attachShader(p, b);
    gl.linkProgram(p);
    return { p: p, vs: a, fs: b, u: null };
  };

  /* true once both programs are linked (non-blocking when the extension exists) */
  HeroGL.prototype.ready = function () {
    if (this.linked) return true;
    var gl = this.gl, progs = [this.pts, this.flowP, this.auraP];
    if (this.par) {
      for (var i = 0; i < progs.length; i++) if (!gl.getProgramParameter(progs[i].p, this.par.COMPLETION_STATUS_KHR)) return false;
    }
    for (var j = 0; j < progs.length; j++) {
      var pr = progs[j];
      if (!gl.getProgramParameter(pr.p, gl.LINK_STATUS)) {
        throw new Error((gl.getShaderInfoLog(pr.vs) || '') + (gl.getShaderInfoLog(pr.fs) || '') + (gl.getProgramInfoLog(pr.p) || 'link failed'));
      }
      pr.u = {};
      var n = gl.getProgramParameter(pr.p, gl.ACTIVE_UNIFORMS);
      for (var k = 0; k < n; k++) { var info = gl.getActiveUniform(pr.p, k); pr.u[info.name] = gl.getUniformLocation(pr.p, info.name); }
    }
    this.linked = true;
    return true;
  };

  HeroGL.prototype.setColors = function (o) {
    this.ink = hex(o.ink || '#f5f2ff'); this.hot = hex(o.hot || '#d4ff3a'); this.noise = hex(o.noise || '#9d8cff');
    this.glow = [hex(o.glow1 || '#7a2cff'), hex(o.glow2 || '#3b5bff'), hex(o.glow3 || '#ff3ec8')];
  };

  HeroGL.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    var dpr = Math.min(window.devicePixelRatio || 1, this.lowPower ? 1 : 2);
    if (w * h * dpr * dpr > 9e6) dpr = Math.sqrt(9e6 / (w * h));
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.makeFlow();
    this.sample();
  };

  HeroGL.prototype.makeFlow = function () {
    var gl = this.gl;
    if (this.flow) this.flow.forEach(function (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); });
    var fw = this.lowPower ? 96 : 192, fh = Math.max(16, Math.round(fw * this.h / this.w));
    var init = new Uint8Array(fw * fh * 4);
    for (var i = 0; i < init.length; i += 4) { init[i] = 128; init[i + 1] = 128; init[i + 3] = 255; }
    this.flow = [0, 1].map(function () {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, fw, fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, init);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      var fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex: tex, fb: fb };
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.fw = fw; this.fh = fh;
  };

  /* Rasterize each glyph at its exact DOM position (only the glyph bounding
     box is drawn/read), then sample a jittered grid of lit pixels. */
  HeroGL.prototype.sample = function () {
    var W = this.w, H = this.h, el = this.textEl;
    var cr = this.canvas.getBoundingClientRect();
    var cs = getComputedStyle(el);
    var fs = parseFloat(cs.fontSize);
    this.fontSize = fs;
    var upper = cs.textTransform === 'uppercase';
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var range = document.createRange(), glyphs = [];
    var x0 = W, y0 = H, x1 = 0, y1 = 0;
    while (walker.nextNode()) {
      var node = walker.currentNode, str = node.textContent;
      for (var i = 0; i < str.length; i++) {
        var ch = str[i];
        if (/\s/.test(ch)) continue;
        range.setStart(node, i); range.setEnd(node, i + 1);
        var r = range.getBoundingClientRect();
        if (!r.width) continue;
        var gx = r.left - cr.left, top = r.top - cr.top;
        glyphs.push({ c: upper ? ch.toUpperCase() : ch, x: gx, top: top });
        x0 = Math.min(x0, gx); x1 = Math.max(x1, r.right - cr.left);
        y0 = Math.min(y0, top); y1 = Math.max(y1, r.bottom - cr.top);
      }
    }
    x0 = Math.max(0, Math.floor(x0 - 6)); y0 = Math.max(0, Math.floor(y0 - 6));
    x1 = Math.min(W, Math.ceil(x1 + 6)); y1 = Math.min(H, Math.ceil(y1 + 6));
    var bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0);
    var off = document.createElement('canvas');
    off.width = bw; off.height = bh;
    var c = off.getContext('2d', { willReadFrequently: true });
    c.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
    c.fillStyle = '#fff';
    c.textBaseline = 'alphabetic';
    var m = c.measureText('H');
    var ascent = (m.fontBoundingBoxAscent != null) ? m.fontBoundingBoxAscent : fs * 0.92;
    for (var g = 0; g < glyphs.length; g++) c.fillText(glyphs[g].c, glyphs[g].x - x0, glyphs[g].top - y0 + ascent);
    var img = c.getImageData(0, 0, bw, bh).data;

    var lit = 0;
    for (var k = 3; k < img.length; k += 4) if (img[k] > 120) lit++;
    var mobile = W < 700;
    var maxN = this.lowPower ? (mobile ? 5000 : 9000) : (mobile ? 16000 : 56000);
    var step = Math.min(3.1, Math.max(mobile ? 1.3 : 1.6, fs / 118));
    if (lit / (step * step) > maxN) step = Math.sqrt(lit / maxN);
    this.size = Math.max(1.1, step * 0.9);

    var pts = [];
    for (var y = 0; y < bh; y += step) {
      for (var x = 0; x < bw; x += step) {
        var jx = x + Math.random() * step, jy = y + Math.random() * step;
        var ix = jx | 0, iy = jy | 0;
        if (ix >= bw || iy >= bh) continue;
        if (img[(iy * bw + ix) * 4 + 3] > 120) pts.push(x0 + jx, y0 + jy);
      }
    }
    var nGlyph = pts.length / 2;
    var nDust = Math.round(Math.min(this.lowPower ? 600 : 3200, Math.max(400, W * H / 650)));
    var n = nGlyph + nDust;
    var data = new Float32Array(n * 7), o = 0;
    for (var q = 0; q < nGlyph; q++) {
      data[o++] = pts[q * 2]; data[o++] = pts[q * 2 + 1];
      data[o++] = Math.random(); data[o++] = Math.random(); data[o++] = Math.random(); data[o++] = Math.random();
      data[o++] = 0;
    }
    for (var dd = 0; dd < nDust; dd++) {
      data[o++] = Math.random() * W; data[o++] = Math.random() * H;
      data[o++] = Math.random(); data[o++] = Math.random(); data[o++] = Math.random(); data[o++] = Math.random();
      data[o++] = 1;
    }
    var gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 28, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 8);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 28, 24);
    gl.bindVertexArray(null);
    this.count = n;
    this.scanW = Math.max(160, Math.min(380, W * 0.22));
    this.bounds = { x0: x0, y0: y0, x1: x1, y1: y1 };
  };

  HeroGL.prototype.pointer = function (x, y, on) {
    var m = this.mouse;
    if (!on) { m.on = false; return; }
    if (!m.on) { m.px = x; m.py = y; }
    m.x = x; m.y = y; m.on = true;
  };

  HeroGL.prototype.pulse = function (x, y, strength) {
    this.pulseV = [x, y, this.time, strength == null ? 1 : strength];
  };

  HeroGL.prototype.render = function (dt) {
    var gl = this.gl;
    if (!this.count || !this.ready()) return;
    this.time += dt;
    var m = this.mouse, k = Math.min(1, dt * 60);
    if (m.on) {
      var dx = m.x - m.px, dy = m.y - m.py;
      m.px = m.x; m.py = m.y;
      m.vx += (dx - m.vx) * 0.4 * k; m.vy += (dy - m.vy) * 0.4 * k;
    } else { m.vx *= 0.82; m.vy *= 0.82; }
    var vs = this.motion ? 1 / 26 : 0;

    var src = this.flow[0], dst = this.flow[1];
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.viewport(0, 0, this.fw, this.fh);
    gl.disable(gl.BLEND);
    gl.useProgram(this.flowP.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    var fu = this.flowP.u;
    gl.uniform1i(fu.uPrev, 0);
    gl.uniform2f(fu.uMouse, m.x / this.w, 1 - m.y / this.h);
    gl.uniform2f(fu.uVel, Math.max(-1, Math.min(1, m.vx * vs)), Math.max(-1, Math.min(1, -m.vy * vs)));
    gl.uniform1f(fu.uAspect, this.w / this.h);
    gl.uniform1f(fu.uRadius, 0.085);
    gl.uniform1f(fu.uDecay, Math.pow(0.955, k));
    gl.bindVertexArray(this.quad);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.flow = [dst, src];

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!this.lowPower) {
      this.mouseOn += ((m.on ? 1 : 0) - this.mouseOn) * 0.05 * k;
      var age = this.time - this.pulseV[2];
      var au = this.auraP.u;
      gl.useProgram(this.auraP.p);
      gl.uniform2f(au.uRes, this.w, this.h);
      gl.uniform1f(au.uTime, this.motion ? this.time : 12);
      gl.uniform2f(au.uMouse, m.x / this.w, 1 - m.y / this.h);
      gl.uniform1f(au.uMouseOn, this.mouseOn);
      gl.uniform1f(au.uFade, Math.min(1, this.burst * 1.2) * (1 - Math.min(1, this.scroll * 1.15)));
      gl.uniform1f(au.uFlare, age >= 0 ? this.pulseV[3] * Math.exp(-age * 2.4) : 0);
      gl.uniform3fv(au.uC1, this.glow[0]); gl.uniform3fv(au.uC2, this.glow[1]); gl.uniform3fv(au.uC3, this.glow[2]);
      gl.bindVertexArray(this.quad);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.pts.p);
    gl.bindTexture(gl.TEXTURE_2D, dst.tex);
    var u = this.pts.u;
    gl.uniform1i(u.uFlow, 0);
    gl.uniform2f(u.uRes, this.w, this.h);
    gl.uniform1f(u.uDpr, this.dpr);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uMotion, this.motion && !this.lowPower ? 1 : this.motion ? 0.4 : 0);
    gl.uniform1f(u.uScan, this.scan);
    gl.uniform1f(u.uScanW, this.scanW);
    gl.uniform1f(u.uScroll, this.scroll);
    gl.uniform1f(u.uSize, this.size);
    gl.uniform1f(u.uBurst, this.burst);
    gl.uniform2f(u.uOrigin, this.origin[0], this.origin[1]);
    gl.uniform4fv(u.uPulse, this.pulseV);
    gl.uniform1f(u.uFlowAmp, Math.min(110, this.fontSize * 0.36));
    gl.uniform3fv(u.uInk, this.ink);
    gl.uniform3fv(u.uHot, this.hot);
    gl.uniform3fv(u.uNoise, this.noise);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);
  };

  window.XA = window.XA || {};
  window.XA.HeroGL = HeroGL;
})();
