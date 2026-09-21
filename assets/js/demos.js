/* South Artificial Intelligence Laboratory: research group heroes.
   The top of each group page is a full-width, live demonstration of the method the
   group studies. Everything that reacts to the pointer also has a button or slider
   in the bar under the title, and the result is written out as text, because the
   canvas itself is hidden from screen readers. Motion is smooth; nothing flashes. */

(function () {
  "use strict";

  var INK = "159,195,245", DIM = "96,128,176", TEAL = "79,209,197", WARM = "255,138,92";

  function region(W, H) {
    // where a boxed visual may sit; the title block is on the left on wide screens and on top on narrow ones
    return W < 860 ? { x: W * 0.05, y: H * 0.5, w: W * 0.9, h: H * 0.36 }
                   : { x: W * 0.46, y: H * 0.1, w: W * 0.5, h: H * 0.68 };
  }

  function mount(root, make) {
    var canvas = root.querySelector("canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var readout = root.querySelector("[data-readout]");
    var pauseBtn = root.querySelector('[data-act="pause"]');
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var S = { W: 0, H: 0, mx: 0, my: 0, inside: false, t: 0 };
    var scene = null, running = !reduced, offscreen = false, last = 0, timer, lastText = "", sinceText = 1;

    function say(force) {
      if (!readout || !scene || !scene.text) return;
      var text = scene.text(S);
      if (text !== lastText && (force || sinceText > 0.4)) { readout.textContent = text; lastText = text; sinceText = 0; }
    }
    function paint() { if (scene) scene.draw(ctx, S); }
    function build() {
      var rect = root.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      var dpr = Math.min(window.devicePixelRatio || 1, rect.width > 900 ? 1.5 : 2);
      S.W = rect.width; S.H = rect.height; S.dpr = dpr; S.r = region(S.W, S.H);
      canvas.width = Math.round(S.W * dpr); canvas.height = Math.round(S.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene = make(S, root);
      if (reduced && scene.settle) scene.settle(S);
      paint(); say(true);
    }
    function frame(ts) {
      if (!running || offscreen || !scene) { last = 0; return; }
      if (!last) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.05);
      last = ts; S.t += dt; sinceText += dt;
      scene.step(dt, S); paint(); say(false);
      window.requestAnimationFrame(frame);
    }
    function setRunning(on) {
      running = on;
      if (pauseBtn) pauseBtn.textContent = on ? "Pause" : "Play";
      if (scene && scene.setRunning) scene.setRunning(on);
      if (on) { last = 0; window.requestAnimationFrame(frame); }
    }
    function refresh() { if (scene) { if (!running) scene.step(0, S); paint(); say(true); } }
    function isControl(ev) { return !!ev.target.closest("a,button,input,select,label,summary,.ghero-bar"); }

    root.addEventListener("pointermove", function (ev) {
      var rect = root.getBoundingClientRect();
      S.mx = ev.clientX - rect.left; S.my = ev.clientY - rect.top; S.inside = !isControl(ev) && ev.pointerType !== "touch";
      if (!running) refresh();
    });
    root.addEventListener("pointerleave", function () { S.inside = false; if (!running) refresh(); });
    root.addEventListener("click", function (ev) {
      var el = ev.target.closest("button[data-act]");
      if (el) {
        var act = el.getAttribute("data-act");
        if (act === "pause") { setRunning(!running); return; }
        if (act === "reset") { build(); return; }
        if (scene && scene.act) { scene.act(act, null, S); refresh(); }
        return;
      }
      if (isControl(ev) || !scene || !scene.click) return;
      var rect = root.getBoundingClientRect();
      scene.click(ev.clientX - rect.left, ev.clientY - rect.top, S);
      refresh();
    });
    root.addEventListener("input", function (ev) {
      var el = ev.target.closest("[data-act]");
      if (el && scene && scene.act) { scene.act(el.getAttribute("data-act"), el.value, S); refresh(); }
    });

    function fit() {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        var rect = root.getBoundingClientRect();
        if (Math.abs(rect.width - S.W) > 1 || Math.abs(rect.height - S.H) > 1) build();
      }, 160);
    }
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(root);
    else window.addEventListener("resize", fit);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        var was = offscreen; offscreen = !en[0].isIntersecting;
        if (was && !offscreen && running) { last = 0; window.requestAnimationFrame(frame); }
      }).observe(root);
    }
    build();
    setRunning(running);
  }

  function caption(ctx, text, x, y, align) {
    ctx.font = "500 13px 'Libre Franklin', sans-serif";
    ctx.textAlign = align || "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(201,214,232,0.95)";
    ctx.fillText(text, x, y);
  }

  // stroke the current path three times, wide and faint to narrow and bright, for a glow
  function glow(ctx, rgb, w, alpha) {
    var a = alpha === undefined ? 1 : alpha;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = w * 6; ctx.strokeStyle = "rgba(" + rgb + "," + 0.07 * a + ")"; ctx.stroke();
    ctx.lineWidth = w * 2.6; ctx.strokeStyle = "rgba(" + rgb + "," + 0.22 * a + ")"; ctx.stroke();
    ctx.lineWidth = w; ctx.strokeStyle = "rgba(" + rgb + "," + 0.95 * a + ")"; ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }

  var halo = null;
  function dot(ctx, x, y, r, rgb, a) {
    if (!halo) {
      halo = {};
    }
    if (!halo[rgb]) {
      var s = document.createElement("canvas"); s.width = s.height = 96;
      var g = s.getContext("2d"), gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
      gr.addColorStop(0, "rgba(" + rgb + ",1)"); gr.addColorStop(0.18, "rgba(" + rgb + ",0.75)"); gr.addColorStop(0.45, "rgba(" + rgb + ",0.16)"); gr.addColorStop(1, "rgba(" + rgb + ",0)");
      g.fillStyle = gr; g.fillRect(0, 0, 96, 96); halo[rgb] = s;
    }
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a === undefined ? 1 : a;
    ctx.drawImage(halo[rgb], x - r * 5, y - r * 5, r * 10, r * 10);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }

  function contour(ctx, f, cols, rows, cw, ch, level) {
    for (var r = 0; r < rows - 1; r++) {
      for (var c = 0; c < cols - 1; c++) {
        var a = f[r * cols + c] - level, b = f[r * cols + c + 1] - level;
        var d = f[(r + 1) * cols + c] - level, e = f[(r + 1) * cols + c + 1] - level;
        var idx = (a > 0 ? 1 : 0) | (b > 0 ? 2 : 0) | (e > 0 ? 4 : 0) | (d > 0 ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        var X = c * cw, Y = r * ch;
        var top = [X + cw * (a / (a - b)), Y], bot = [X + cw * (d / (d - e)), Y + ch];
        var lef = [X, Y + ch * (a / (a - d))], rig = [X + cw, Y + ch * (b / (b - e))];
        var segs;
        switch (idx) {
          case 1: case 14: segs = [[lef, top]]; break;
          case 2: case 13: segs = [[top, rig]]; break;
          case 3: case 12: segs = [[lef, rig]]; break;
          case 4: case 11: segs = [[rig, bot]]; break;
          case 6: case 9: segs = [[top, bot]]; break;
          case 7: case 8: segs = [[lef, bot]]; break;
          case 5: segs = [[lef, top], [rig, bot]]; break;
          default: segs = [[top, rig], [lef, bot]];
        }
        for (var s = 0; s < segs.length; s++) { ctx.moveTo(segs[s][0][0], segs[s][0][1]); ctx.lineTo(segs[s][1][0], segs[s][1][1]); }
      }
    }
  }

  /* ---------------------------------------------------------- data science
     Least-squares support vector classifier with an RBF kernel, refit every frame.
     Your pointer is a live data point of the chosen kind, so the boundary bends
     around it as you move. Click to leave the point there. */
  function boundary(S) {
    var unit = Math.min(S.W, S.H), sigma = unit * 0.3, gam = 12, wide = S.W >= 860;
    var base = [[.5,.2,1],[.62,.12,1],[.43,.4,1],[.66,.34,1],[.54,.56,1],[.76,.2,1],
                [.9,.78,-1],[.78,.86,-1],[.95,.56,-1],[.74,.66,-1],[.85,.44,-1],[.64,.82,-1]];
    var pts = base.map(function (p) { return { x: (wide ? p[0] : (p[0] - 0.4) * 1.6) * S.W, y: (wide ? p[1] : 0.45 + p[1] * 0.5) * S.H, c: p[2] }; });
    var cls = 1, cols = 72, rows = 40, field = new Float32Array(cols * rows), alpha = [], live = null, ease = 0;
    function k(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma)); }
    function fit() {
      var P = pts.slice(), y = pts.map(function (p) { return p.c; });
      if (live && ease > 0.02) { P.push(live); y.push(live.c * ease * 2.2); }
      var n = P.length, A = [], i, j, c;
      for (i = 0; i < n; i++) { A.push([]); for (j = 0; j < n; j++) A[i].push(k(P[i].x, P[i].y, P[j].x, P[j].y) + (i === j ? 1 / gam : 0)); A[i].push(y[i]); }
      for (c = 0; c < n; c++) {
        var piv = c; for (i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[piv][c])) piv = i;
        var tmp = A[c]; A[c] = A[piv]; A[piv] = tmp;
        for (i = c + 1; i < n; i++) { var m = A[i][c] / A[c][c]; for (j = c; j <= n; j++) A[i][j] -= m * A[c][j]; }
      }
      alpha = new Array(n);
      for (i = n - 1; i >= 0; i--) { var s = A[i][n]; for (j = i + 1; j < n; j++) s -= A[i][j] * alpha[j]; alpha[i] = s / A[i][i]; }
      for (var rr = 0; rr < rows; rr++) for (var cc = 0; cc < cols; cc++) {
        var X = cc * S.W / (cols - 1), Y = rr * S.H / (rows - 1), v = 0;
        for (i = 0; i < n; i++) v += alpha[i] * k(P[i].x, P[i].y, X, Y);
        field[rr * cols + cc] = v;
      }
    }
    function add(x, y) { if (pts.length >= 36) pts.splice(base.length, 1); pts.push({ x: x, y: y, c: cls }); }
    fit();
    return {
      step: function (dt, S) {
        if (S.inside) { if (!live) live = { x: S.mx, y: S.my, c: cls }; live.x += (S.mx - live.x) * Math.min(1, dt * 14 + (dt ? 0 : 1)); live.y += (S.my - live.y) * Math.min(1, dt * 14 + (dt ? 0 : 1)); live.c = cls; }
        ease += ((S.inside ? 1 : 0) - ease) * Math.min(1, dt * 5 + (dt ? 0 : 1));
        fit();
      },
      settle: function () { fit(); },
      click: function (x, y) { add(x, y); fit(); },
      act: function (name, value, S) {
        if (name === "class") cls = Number(value);
        if (name === "random") add((0.45 + Math.random() * 0.5) * S.W, (0.1 + Math.random() * 0.8) * S.H);
        fit();
      },
      text: function () { return pts.length + " points, " + (pts.length - base.length) + " placed by you. The line is refit on every frame."; },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        var cw = S.W / (cols - 1), ch = S.H / (rows - 1), r, c;
        for (r = 0; r < rows; r += 2) for (c = 0; c < cols; c += 2) {          // faint wash: which kind the model predicts here
          var v = field[r * cols + c], a = Math.min(0.11, Math.abs(v) * 0.09);
          ctx.fillStyle = "rgba(" + (v >= 0 ? TEAL : WARM) + "," + a + ")"; ctx.fillRect(c * cw - cw, r * ch - ch, cw * 2, ch * 2);
        }
        ctx.setLineDash([5, 7]); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(" + DIM + ",0.75)";
        ctx.beginPath(); contour(ctx, field, cols, rows, cw, ch, 0.55); contour(ctx, field, cols, rows, cw, ch, -0.55); ctx.stroke(); ctx.setLineDash([]);
        ctx.lineJoin = "round"; ctx.beginPath(); contour(ctx, field, cols, rows, cw, ch, 0); glow(ctx, "235,243,255", 2);
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i]; dot(ctx, p.x, p.y, 5, p.c > 0 ? TEAL : WARM, 0.9);
          ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, 6.2832);
          if (p.c > 0) { ctx.fillStyle = "rgb(" + TEAL + ")"; ctx.fill(); } else { ctx.fillStyle = "#060f1e"; ctx.fill(); ctx.strokeStyle = "rgb(" + WARM + ")"; ctx.lineWidth = 2.2; ctx.stroke(); }
        }
        if (live && ease > 0.05) {
          dot(ctx, live.x, live.y, 8, live.c > 0 ? TEAL : WARM, ease);
          ctx.globalAlpha = ease; ctx.beginPath(); ctx.arc(live.x, live.y, 6, 0, 6.2832); ctx.fillStyle = "#fff"; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
    };
  }

  /* ---------------------------------------------------------- computer vision
     Real footage of a city intersection, with a real object detector (COCO-SSD,
     running in the browser through TensorFlow.js) drawing what it finds. The
     model runs a few times a second and the boxes glide between its answers. */
  var TF_URL = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
  var SSD_URL = "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js";
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  var detectorPromise = null;
  function detector() {
    if (!detectorPromise) detectorPromise = loadScript(TF_URL).then(function () { return loadScript(SSD_URL); }).then(function () { return window.cocoSsd.load({ base: "lite_mobilenet_v2" }); });
    return detectorPromise;
  }
  function detection(S, root) {
    var video = root.querySelector("video"), status = root.querySelector("[data-status]");
    var model = null, busy = false, since = 0, retry = 0, tracks = [], failed = false;
    var PEOPLE = { person: 1 }, reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function note(t) { if (status) status.textContent = t; }
    note("Loading the detector…");
    detector().then(function (m) { model = m; note(""); }, function () { failed = true; note("The detector could not load, so this is just the footage."); });
    if (video && !reduced) { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); }

    function iou(a, b) {
      var x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]), x2 = Math.min(a[0] + a[2], b[0] + b[2]), y2 = Math.min(a[1] + a[3], b[1] + b[3]);
      var inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
      return inter / (a[2] * a[3] + b[2] * b[3] - inter || 1);
    }
    function absorb(preds) {
      tracks.forEach(function (t) { t.hit = false; });
      preds.forEach(function (p) {
        var best = null, bi = 0.25;
        tracks.forEach(function (t) { if (t.cls !== p.class || t.hit) return; var v = iou(t.target, p.bbox); if (v > bi) { bi = v; best = t; } });
        if (best) { best.target = p.bbox; best.score = p.score; best.hit = true; }
        else tracks.push({ cls: p.class, box: p.bbox.slice(), target: p.bbox, score: p.score, a: 0, hit: true });
      });
    }
    return {
      step: function (dt) {
        since += dt; retry += dt;
        if (video.paused && retry > 1) { retry = 0; var again = video.play(); if (again && again.catch) again.catch(function () {}); }   // some browsers hold autoplay until the page is visible
        if (model && !busy && since > 0.16 && video.readyState >= 2) {
          busy = true; since = 0;
          model.detect(video, 24, 0.42).then(function (p) { absorb(p); busy = false; }, function () { busy = false; });
        }
        for (var i = tracks.length - 1; i >= 0; i--) {
          var t = tracks[i], k = Math.min(1, dt * 9);
          for (var j = 0; j < 4; j++) t.box[j] += (t.target[j] - t.box[j]) * k;
          t.a += ((t.hit ? 1 : 0) - t.a) * Math.min(1, dt * (t.hit ? 8 : 3));
          if (!t.hit && t.a < 0.03) tracks.splice(i, 1);
        }
      },
      setRunning: function (on) { if (!video) return; if (on) { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); } else video.pause(); },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        if (!video || !video.videoWidth) return;
        var sc = Math.max(S.W / video.videoWidth, S.H / video.videoHeight), ox = (S.W - video.videoWidth * sc) / 2, oy = (S.H - video.videoHeight * sc) / 2;
        for (var i = 0; i < tracks.length; i++) {
          var t = tracks[i], x = ox + t.box[0] * sc, y = oy + t.box[1] * sc, w = t.box[2] * sc, h = t.box[3] * sc;
          var rgb = PEOPLE[t.cls] ? WARM : TEAL, L = Math.max(8, Math.min(w, h) * 0.24);
          ctx.globalAlpha = t.a;
          ctx.fillStyle = "rgba(" + rgb + ",0.07)"; ctx.fillRect(x, y, w, h);
          ctx.beginPath();
          ctx.moveTo(x, y + L); ctx.lineTo(x, y); ctx.lineTo(x + L, y);
          ctx.moveTo(x + w - L, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + L);
          ctx.moveTo(x + w, y + h - L); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - L, y + h);
          ctx.moveTo(x + L, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - L);
          glow(ctx, rgb, 2, t.a);
          var label = t.cls + " " + Math.round(t.score * 100) + "%";
          ctx.font = "600 12px 'Libre Franklin', sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
          var tw = ctx.measureText(label).width + 10;
          ctx.fillStyle = "rgba(" + rgb + ",0.92)"; ctx.fillRect(x, y - 18, tw, 17);
          ctx.fillStyle = "#04101c"; ctx.fillText(label, x + 5, y - 5);
          ctx.globalAlpha = 1;
        }
      }
    };
  }

  /* ---------------------------------------------------------- language
     Attention drawn as arcs. Weights come from small fixed vectors: illustrative only. */
  function attention(S) {
    var words = "the model reads every word and decides which others matter".split(" ");
    var n = words.length, dim = 6, vec = [], W = [], i, j, seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; }
    for (i = 0; i < n; i++) { vec.push([]); for (j = 0; j < dim; j++) vec[i].push(rnd() * 2); }
    for (i = 0; i < n; i++) {
      var row = [], sum = 0;
      for (j = 0; j < n; j++) { var d = 0; for (var q = 0; q < dim; q++) d += vec[i][q] * vec[j][(q + 1) % dim]; var e = Math.exp(d * 1.6 - Math.abs(i - j) * 0.12) * (i === j ? 0.35 : 1); row.push(e); sum += e; }
      W.push(row.map(function (v) { return v / sum; }));
    }
    var pos = [], active = 1, shown = W[1].slice(), clock = 0, auto = true, size = S.W < 860 ? 17 : 23;
    function layout(ctx) {
      pos = []; ctx.font = "600 " + size + "px 'Libre Franklin', sans-serif";
      var r = S.r, gap = S.W < 860 ? 14 : 26, lineH = S.W < 860 ? 66 : 104;
      var widths = words.map(function (w) { return ctx.measureText(w).width; }), lines = [[]], used = 0;
      for (var k = 0; k < n; k++) { if (used + widths[k] > r.w && lines[lines.length - 1].length) { lines.push([]); used = 0; } lines[lines.length - 1].push(k); used += widths[k] + gap; }
      for (var L = 0; L < lines.length; L++) {
        var tw = -gap; lines[L].forEach(function (k) { tw += widths[k] + gap; });
        var x = r.x + (r.w - tw) / 2, y = r.y + r.h - 30 - (lines.length - 1 - L) * lineH;
        lines[L].forEach(function (k) { pos[k] = { x: x + widths[k] / 2, y: y, w: widths[k] }; x += widths[k] + gap; });
      }
    }
    return {
      step: function (dt, S) {
        clock += dt;
        if (S.inside && pos.length) { var best = -1, bd = 70; for (var k = 0; k < n; k++) { var dd = Math.hypot(pos[k].x - S.mx, pos[k].y - S.my); if (dd < bd) { bd = dd; best = k; } } if (best >= 0) { active = best; auto = false; clock = 0; } }
        if (auto && clock > 2) { active = (active + 1) % n; clock = 0; }
        if (!auto && clock > 6) auto = true;
        for (var m = 0; m < n; m++) shown[m] += (W[active][m] - shown[m]) * Math.min(1, dt * 7 + (dt ? 0 : 1));
      },
      act: function (name) { auto = false; clock = 0; active = (active + (name === "next" ? 1 : n - 1)) % n; },
      text: function () {
        var order = W[active].map(function (w, k) { return [w, k]; }).filter(function (p) { return p[1] !== active; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 3);
        return "“" + words[active] + "” looks most at " + order.map(function (p) { return "“" + words[p[1]] + "” (" + p[0].toFixed(2) + ")"; }).join(", ") + ". Illustrative weights, not from a trained model.";
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H); layout(ctx);
        var a = pos[active];
        for (var k = 0; k < n; k++) {
          if (k === active) continue;
          var b = pos[k], w = shown[k]; ctx.beginPath();
          if (Math.abs(b.y - a.y) < 2) { var mid = (a.x + b.x) / 2, rad = Math.abs(a.x - b.x) / 2; ctx.ellipse(mid, a.y - 24, rad, Math.min(a.y - S.r.y - 10, rad * 0.8), 0, Math.PI, 0); }
          else { ctx.moveTo(a.x, a.y - 24); ctx.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 110, b.x, b.y - 24); }
          glow(ctx, TEAL, 0.7 + w * 12, Math.min(1, 0.18 + w * 3));
        }
        dot(ctx, a.x, a.y, 16, "255,255,255", 0.35);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        for (var t = 0; t < n; t++) {
          ctx.font = "600 " + size + "px 'Libre Franklin', sans-serif";
          ctx.fillStyle = t === active ? "#fff" : "rgba(" + INK + "," + (0.55 + Math.min(0.45, shown[t] * 2.4)) + ")";
          ctx.fillText(words[t], pos[t].x, pos[t].y);
          if (t !== active) { ctx.font = "500 12px 'Libre Franklin', sans-serif"; ctx.fillStyle = "rgba(201,214,232,0.85)"; ctx.fillText(shown[t].toFixed(2), pos[t].x, pos[t].y + 22); }
        }
      }
    };
  }

  /* ---------------------------------------------------------- neural networks
     Gradient descent with momentum on a loss surface made of Gaussian wells. */
  function descent(S) {
    var WELLS = [[-1.5, .7, 2.4, .86], [1.7, -.6, 3.1, .98], [.3, 1.4, 1.7, .66], [-2.1, -1.2, 2.05, .8], [2.3, 1.4, 1.55, .72], [-.2, -1.5, 1.35, .6]];
    function loss(x, y) { var f = .065 * (x * x + y * y); for (var i = 0; i < 6; i++) { var w = WELLS[i], dx = x - w[0], dy = y - w[1]; f -= w[2] * Math.exp(-(dx * dx + dy * dy) / (2 * w[3] * w[3])); } return f; }
    function grad(x, y) { var gx = .13 * x, gy = .13 * y; for (var i = 0; i < 6; i++) { var w = WELLS[i], dx = x - w[0], dy = y - w[1], e = w[2] * Math.exp(-(dx * dx + dy * dy) / (2 * w[3] * w[3])) / (w[3] * w[3]); gx += e * dx; gy += e * dy; } return [gx, gy]; }
    var yr = 2.6, xr = yr * S.W / S.H, LR = .042, MU = .88;
    function px(x, y) { return [(x + xr) / (2 * xr) * S.W, (yr - y) / (2 * yr) * S.H]; }
    var back = document.createElement("canvas"); back.width = Math.round(S.W * S.dpr); back.height = Math.round(S.H * S.dpr);
    var b = back.getContext("2d"); b.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    var cols = 130, rows = Math.max(40, Math.round(cols * S.H / S.W)), field = new Float32Array(cols * rows), lo = 1e9, hi = -1e9;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) { var v = loss(-xr + 2 * xr * c / (cols - 1), yr - 2 * yr * r / (rows - 1)); field[r * cols + c] = v; if (v < lo) lo = v; if (v > hi) hi = v; }
    for (var w = 0; w < 6; w++) { var q = px(WELLS[w][0], WELLS[w][1]); b.globalCompositeOperation = "lighter"; var g = b.createRadialGradient(q[0], q[1], 0, q[0], q[1], S.H * 0.34 * WELLS[w][3]); g.addColorStop(0, "rgba(70,110,255," + 0.10 * WELLS[w][2] + ")"); g.addColorStop(1, "rgba(70,110,255,0)"); b.fillStyle = g; b.fillRect(0, 0, S.W, S.H); }
    b.globalCompositeOperation = "source-over";
    for (var L = 1; L < 26; L++) { b.beginPath(); contour(b, field, cols, rows, S.W / (cols - 1), S.H / (rows - 1), lo + (hi - lo) * L / 26); b.strokeStyle = L < 9 ? "rgba(" + INK + ",0.5)" : "rgba(" + DIM + ",0.32)"; b.lineWidth = 1; b.stroke(); }
    var p, vel, n, path, hist, acc = 0, settled = false, wait = 0;
    function restart(at) { var a = Math.random() * 6.28, rad = 2.2 + Math.random() * .8; p = at || [Math.cos(a) * rad * 1.25, Math.sin(a) * rad * .78]; vel = [0, 0]; n = 0; path = [p.slice()]; hist = [loss(p[0], p[1])]; settled = false; wait = 0; }
    function one() { var g = grad(p[0], p[1]); vel[0] = MU * vel[0] - LR * g[0]; vel[1] = MU * vel[1] - LR * g[1]; p[0] += vel[0]; p[1] += vel[1]; n++; path.push(p.slice()); hist.push(loss(p[0], p[1])); g = grad(p[0], p[1]); settled = n > 45 && Math.hypot(g[0], g[1]) < .004 && Math.hypot(vel[0], vel[1]) < .004; }
    restart();
    return {
      step: function (dt) { if (settled) { wait += dt; if (wait > 2.5) restart(); return; } acc += dt * 24; while (acc >= 1 && !settled) { acc--; one(); } },
      settle: function () { for (var i = 0; i < 200 && !settled; i++) one(); },
      click: function (x, y, S) { restart([x / S.W * 2 * xr - xr, yr - y / S.H * 2 * yr]); },
      act: function (name) { if (name === "restart") restart(); if (name === "step") one(); },
      text: function () { return "Step " + n + ". Loss " + hist[hist.length - 1].toFixed(3) + ", started at " + hist[0].toFixed(3) + (settled ? ". Settled in a valley." : "."); },
      draw: function (ctx, S) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.drawImage(back, 0, 0); ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
        ctx.lineJoin = "round"; ctx.beginPath(); for (var i = 0; i < path.length; i++) { var q = px(path[i][0], path[i][1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } glow(ctx, WARM, 2.2);
        var s0 = px(path[0][0], path[0][1]); ctx.strokeStyle = "rgb(" + WARM + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s0[0] - 6, s0[1]); ctx.lineTo(s0[0] + 6, s0[1]); ctx.moveTo(s0[0], s0[1] - 6); ctx.lineTo(s0[0], s0[1] + 6); ctx.stroke();
        var h = px(p[0], p[1]); dot(ctx, h[0], h[1], 9, "255,255,255", 1); ctx.beginPath(); ctx.arc(h[0], h[1], 5, 0, 6.2832); ctx.fillStyle = "#fff"; ctx.fill();
      }
    };
  }

  /* ---------------------------------------------------------- agents
     Learning by trial and error, as an evolution strategy. Every round a crowd of
     agents flies a plan of steering moves toward the goal. The plans that ended
     closest are copied, with small random changes, into the next round. */
  function evolve(S) {
    var wide = S.W >= 860, N = wide ? 80 : 46, T = 190, unit = Math.min(S.W, S.H);
    var start = { x: S.W * (wide ? 0.5 : 0.5), y: S.H * (wide ? 0.78 : 0.9) }, goal = { x: S.W * (wide ? 0.8 : 0.72), y: S.H * (wide ? 0.2 : 0.56) };
    var walls = wide ? [[S.W * 0.52, S.H * 0.5, S.W * 0.2, 12], [S.W * 0.78, S.H * 0.62, S.W * 0.16, 12]] : [[S.W * 0.2, S.H * 0.74, S.W * 0.42, 10]];
    var pop = [], tick = 0, acc = 0, gen = 1, hold = 0;
    function genome() { var g = new Float32Array(T * 2); for (var i = 0; i < T * 2; i++) g[i] = (Math.random() - 0.5) * 2; return g; }
    function fresh(g) { return { g: g, x: start.x, y: start.y, vx: 0, vy: -unit * 0.1, alive: true, done: false, best: 1e9, path: [[start.x, start.y]] }; }
    for (var i = 0; i < N; i++) pop.push(fresh(genome()));
    function hitWall(x, y) { for (var w = 0; w < walls.length; w++) { var r = walls[w]; if (x > r[0] && x < r[0] + r[2] && y > r[1] && y < r[1] + r[3]) return true; } return x < 0 || x > S.W || y < 0 || y > S.H; }
    function stepAll() {
      for (var i = 0; i < pop.length; i++) {
        var a = pop[i]; if (!a.alive || a.done) continue;
        a.vx = a.vx * 0.965 + a.g[tick * 2] * unit * 0.02; a.vy = a.vy * 0.965 + a.g[tick * 2 + 1] * unit * 0.02;
        a.x += a.vx / 60; a.y += a.vy / 60;
        var d = Math.hypot(a.x - goal.x, a.y - goal.y); if (d < a.best) a.best = d;
        if (d < unit * 0.035) a.done = true; else if (hitWall(a.x, a.y)) a.alive = false;
        if (tick % 2 === 0) a.path.push([a.x, a.y]);
      }
      tick++;
    }
    function next() {
      var scored = pop.map(function (a) { var d = a.done ? 0 : Math.hypot(a.x - goal.x, a.y - goal.y) * 0.7 + a.best * 0.3; return { g: a.g, f: 1 / (1 + d * d / (unit * unit) * 60) * (a.done ? 3 : 1) * (a.alive ? 1 : 0.35) }; });
      scored.sort(function (p, q) { return q.f - p.f; });
      function pick() { var a = scored[(Math.random() * N) | 0], b = scored[(Math.random() * N) | 0], c = scored[(Math.random() * N) | 0]; return [a, b, c].sort(function (p, q) { return q.f - p.f; })[0].g; }
      var out = []; for (var e = 0; e < 4; e++) out.push(fresh(scored[e].g));
      while (out.length < N) {
        var ma = pick(), pa = pick(), cut = (Math.random() * T) | 0, g = new Float32Array(T * 2);
        for (var k = 0; k < T * 2; k++) { g[k] = (k < cut * 2 ? ma : pa)[k]; if (Math.random() < 0.02) g[k] = (Math.random() - 0.5) * 2; else if (Math.random() < 0.1) g[k] += (Math.random() - 0.5) * 0.3; }
        out.push(fresh(g));
      }
      pop = out; tick = 0; gen++;
    }
    return {
      step: function (dt) {
        if (hold > 0) { hold -= dt; if (hold <= 0) next(); return; }
        acc += dt * 60; while (acc >= 1 && tick < T) { acc--; stepAll(); }
        if (tick >= T || pop.every(function (a) { return !a.alive || a.done; })) { hold = 0.5; acc = 0; }
      },
      settle: function () { for (var r = 0; r < 25; r++) { while (tick < T) stepAll(); if (r < 24) next(); } },
      click: function (x, y) { if (!hitWall(x, y)) { goal.x = x; goal.y = y; } },
      act: function (name, v, S) { if (name === "goal") { do { goal.x = S.W * (0.45 + Math.random() * 0.5); goal.y = S.H * (0.12 + Math.random() * 0.5); } while (hitWall(goal.x, goal.y)); } },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        for (var w = 0; w < walls.length; w++) { var r = walls[w]; ctx.beginPath(); ctx.rect(r[0], r[1], r[2], r[3]); glow(ctx, INK, 1.4, 0.8); ctx.fillStyle = "rgba(" + INK + ",0.18)"; ctx.fillRect(r[0], r[1], r[2], r[3]); }
        ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = "round";
        for (var i = 0; i < pop.length; i++) {
          var a = pop[i], rgb = a.done ? WARM : TEAL, al = a.alive ? 1 : 0.3;
          ctx.beginPath(); ctx.moveTo(a.path[0][0], a.path[0][1]); for (var k = 1; k < a.path.length; k++) ctx.lineTo(a.path[k][0], a.path[k][1]); ctx.lineTo(a.x, a.y);
          ctx.lineWidth = 3.5; ctx.strokeStyle = "rgba(" + rgb + "," + 0.05 * al + ")"; ctx.stroke();
          ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + rgb + "," + 0.34 * al + ")"; ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
        for (var j = 0; j < pop.length; j++) if (pop[j].alive) dot(ctx, pop[j].x, pop[j].y, 3, "255,255,255", 0.9);
        var pulse = 1 + Math.sin(S.t * 2.4) * 0.12;
        dot(ctx, goal.x, goal.y, unit * 0.05 * pulse, WARM, 1); ctx.beginPath(); ctx.arc(goal.x, goal.y, unit * 0.035, 0, 6.2832); ctx.strokeStyle = "rgb(" + WARM + ")"; ctx.lineWidth = 2; ctx.stroke();
        dot(ctx, start.x, start.y, 7, "255,255,255", 0.7);
        caption(ctx, "Round " + gen, S.W - 24, 30, "right");
      }
    };
  }

  /* ---------------------------------------------------------- ethics
     A simulated feed and a crowd. Each dot is a person, placed left to right by
     opinion. Every moment each person sees one post and moves a little toward it.
     The slider sets how often that post is picked to match what they already think. */
  function feed(S, root) {
    var slider = root.querySelector('[data-act="feed"]'), strength = slider ? Number(slider.value) / 100 : 0.15;
    var wide = S.W >= 860, x0 = S.W * (wide ? 0.4 : 0.06), x1 = S.W * 0.96, y0 = S.H * (wide ? 0.12 : 0.52), y1 = S.H * (wide ? 0.8 : 0.86);
    var n = wide ? 320 : 170, people = [];
    for (var i = 0; i < n; i++) { var o = (Math.random() * 2 - 1) * 0.8; people.push({ o: o, y: y0 + Math.random() * (y1 - y0), vy: (Math.random() - 0.5) * 10, ph: Math.random() * 6.28, sx: 0 }); }
    function mix(o) { var t = (o + 1) / 2; return [Math.round(79 + (255 - 79) * t), Math.round(209 + (138 - 209) * t), Math.round(197 + (92 - 197) * t)].join(","); }
    return {
      step: function (dt, S) {
        for (var i = 0; i < n; i++) {
          var p = people[i], post;
          if (Math.random() < strength) post = Math.max(-1, Math.min(1, p.o + (p.o >= 0 ? 1 : -1) * (0.1 + Math.random() * 0.25)));   // picked to match, and a bit further out
          else post = people[(Math.random() * n) | 0].o;                                                                           // something from anyone
          p.o += (post - p.o) * dt * 0.55;
          p.o += (Math.random() - 0.5) * dt * 0.5;
          p.o = Math.max(-1, Math.min(1, p.o));
          p.y += Math.sin(S.t * 0.6 + p.ph) * 8 * dt;
          var tx = x0 + (p.o + 1) / 2 * (x1 - x0); p.sx += (tx - p.sx) * Math.min(1, dt * 4 + (p.sx ? 0 : 1));
        }
      },
      settle: function (S) { for (var k = 0; k < 400; k++) this.step(0.05, S); },
      act: function (name, value) { if (name === "feed") strength = Number(value) / 100; },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        var mid = (x0 + x1) / 2; ctx.setLineDash([3, 9]); ctx.strokeStyle = "rgba(" + DIM + ",0.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mid, y0 - 20); ctx.lineTo(mid, y1 + 20); ctx.stroke(); ctx.setLineDash([]);
        for (var i = 0; i < n; i++) { var p = people[i]; dot(ctx, p.sx, p.y, 4.2, mix(Math.round(p.o * 8) / 8), 0.85); }
        caption(ctx, "One view", x0, y1 + 44); caption(ctx, "The opposite view", x1, y1 + 44, "right"); caption(ctx, "Middle ground", mid, y0 - 28, "center");
      }
    };
  }

  var SCENES = { "data-science": boundary, vision: detection, nlp: attention, "neural-networks": descent, agents: evolve, society: feed };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-demo]").forEach(function (root) {
      var make = SCENES[root.getAttribute("data-demo")];
      if (make) mount(root, make);
    });
  });
})();
