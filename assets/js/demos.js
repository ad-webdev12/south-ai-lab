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
      scene = make(S, root, function () { paint(); });
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
     Real footage of a city intersection. An object detector (Faster R-CNN) was run
     over every other frame ahead of time and a tracker linked its answers into
     tracks, saved in assets/data/street-tracks.json. The page only has to draw the
     boxes for the frame on screen, so nothing heavy runs in the browser and the
     boxes stay locked to the video. */
  var trackData = null;
  function detection(S, root, repaint) {
    var video = root.querySelector("video"), status = root.querySelector("[data-status]");
    var data = trackData, vt = 0, exact = false, retry = 0, wanted = true;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var BLUE = "143,180,255", GOLD = "255,214,102", GREEN = "160,232,140";
    var COLORS = { person: WARM, car: TEAL, bus: BLUE, truck: BLUE, motorcycle: GOLD, bicycle: GOLD, "traffic light": GREEN };
    if (!data) fetch("assets/data/street-tracks.json").then(function (r) { return r.json(); }).then(function (d) { data = trackData = d; repaint(); })
      .catch(function () { if (status) status.textContent = "The boxes could not load, so this is just the footage."; });
    if (video && video.requestVideoFrameCallback) {
      exact = true;
      var onFrame = function (now, meta) { vt = meta.mediaTime; if (video.paused) repaint(); video.requestVideoFrameCallback(onFrame); };
      video.requestVideoFrameCallback(onFrame);
    }
    if (video && !reduced) { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); }

    function at(t, i, u) { var a = t.b[i], b = t.b[Math.min(i + 1, t.b.length - 1)]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u]; }

    return {
      step: function (dt) {
        retry += dt;
        if (wanted && video && video.paused && retry > 1) { retry = 0; var again = video.play(); if (again && again.catch) again.catch(function () {}); }   // some browsers hold autoplay until the page is visible
      },
      setRunning: function (on) { wanted = on; if (!video) return; if (on) { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); } else video.pause(); },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        if (!data || !video || !video.videoWidth) return;
        var sc = Math.max(S.W / data.w, S.H / data.h), ox = (S.W - data.w * sc) / 2, oy = (S.H - data.h * sc) / 2;
        var f = Math.min(data.n - 1, (exact ? vt : video.currentTime) / data.dt);
        ctx.lineJoin = "miter"; ctx.lineCap = "butt";
        for (var n = 0; n < data.tracks.length; n++) {
          var t = data.tracks[n], age = f - t.s, left = t.s + t.b.length - 1 - f;
          if (age < 0 || left < 0) continue;
          var i = Math.floor(age), b = at(t, i, age - i), rgb = COLORS[t.c] || TEAL;
          var lock = Math.min(1, age / 4), a = Math.min(lock, left / 3 + 0.001, 1), grow = 1 + (1 - lock) * (1 - lock) * 0.4;
          var w = b[2] * sc * grow, h = b[3] * sc * grow, x = ox + (b[0] + b[2] / 2) * sc - w / 2, y = oy + (b[1] + b[3] / 2) * sc - h / 2;

          // where it has been: the last second of the track, from the point where it meets the ground
          var from = Math.max(0, i - Math.round(0.34 / data.dt));
          if (i - from > 1) {
            var p0 = t.b[from], moved = Math.hypot(p0[0] + p0[2] / 2 - b[0] - b[2] / 2, p0[1] + p0[3] - b[1] - b[3]) * sc;
            if (moved > 10) {
              ctx.globalCompositeOperation = "lighter";
              for (var k = from; k < i; k++) {
                var p = t.b[k], q = k + 1 < i ? t.b[k + 1] : b, fade = (k - from + 1) / (i - from);
                ctx.beginPath(); ctx.moveTo(ox + (p[0] + p[2] / 2) * sc, oy + (p[1] + p[3]) * sc); ctx.lineTo(ox + (q[0] + q[2] / 2) * sc, oy + (q[1] + q[3]) * sc);
                ctx.lineWidth = 2; ctx.strokeStyle = "rgba(" + rgb + "," + (0.55 * fade * a).toFixed(3) + ")"; ctx.stroke();
              }
              ctx.globalCompositeOperation = "source-over";
            }
          }

          ctx.fillStyle = "rgba(" + rgb + "," + (0.06 * a).toFixed(3) + ")"; ctx.fillRect(x, y, w, h);
          ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + rgb + "," + (0.32 * a).toFixed(3) + ")"; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
          var L = Math.max(6, Math.min(w, h) * 0.22);
          ctx.beginPath();
          ctx.moveTo(x, y + L); ctx.lineTo(x, y); ctx.lineTo(x + L, y);
          ctx.moveTo(x + w - L, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + L);
          ctx.moveTo(x + w, y + h - L); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - L, y + h);
          ctx.moveTo(x + L, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - L);
          glow(ctx, rgb, 2, a);

          if (w >= 40 && h >= 44) {
            var name = t.c.toUpperCase() + " " + (t.id < 10 ? "0" : "") + t.id, conf = Math.round(t.p * 100) + "%";
            ctx.font = "600 10.5px 'Libre Franklin', sans-serif"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
            if ("letterSpacing" in ctx) ctx.letterSpacing = "0.9px";
            var nw = ctx.measureText(name).width, cw = ctx.measureText(conf).width, tw = nw + cw + 25, ty = y - 19 < 76 ? y + 2 : y - 19;
            ctx.globalAlpha = a;
            ctx.fillStyle = "rgba(4,10,22,.82)"; ctx.fillRect(x, ty, tw, 17);
            ctx.fillStyle = "rgb(" + rgb + ")"; ctx.fillRect(x, ty, 3, 17);
            ctx.fillText(name, x + 9, ty + 9);
            ctx.fillStyle = "rgba(235,243,255,.85)"; ctx.fillText(conf, x + 16 + nw, ty + 9);
            if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
            ctx.globalAlpha = 1;
          }
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
     An agent at work. Letters of the page title fall to the floor, and a hovering
     robot runs the loop every agent runs: look for what is out of place, pick the
     nearest job, move, grasp, carry, place, check. The letters are the real heading
     text (split into spans), so the robot is rearranging the page itself. */
  function robot(S, root) {
    var h1 = root.querySelector("h1"), bar = root.querySelector(".ghero-bar");
    var wide = S.W >= 860;
    var R = Math.max(34, Math.min(62, Math.min(S.W, S.H) * (wide ? 0.07 : 0.085)));
    var L1 = R * 1.3, L2 = R * 1.25, HOLD = R * 0.36, G = 1900;

    if (h1 && !h1.getAttribute("data-split")) {
      var words = h1.textContent.trim().split(/\s+/);
      h1.setAttribute("aria-label", words.join(" ")); h1.setAttribute("data-split", "1"); h1.textContent = "";
      words.forEach(function (word, wi) {
        if (wi) h1.appendChild(document.createTextNode(" "));
        var w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
        word.split("").forEach(function (ch) { var l = document.createElement("span"); l.className = "l"; l.textContent = ch; w.appendChild(l); });
        h1.appendChild(w);
      });
    }
    var letters = [].map.call(h1 ? h1.querySelectorAll(".l") : [], function (el) {
      el.style.transform = "";
      return { el: el, hx: 0, hy: 0, w: 0, h: 0, x: 0, y: 0, rot: 0, vx: 0, vy: 0, vr: 0, state: "home", wait: 0 };
    });
    var floorY = S.H - 120;
    function measure() {
      letters.forEach(function (l) {
        var x = 0, y = 0, n = l.el;
        while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
        l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; l.hx = x + l.w / 2; l.hy = y + l.h / 2;
        if (l.state === "home") { l.x = l.hx; l.y = l.hy; }
      });
      if (bar) floorY = bar.offsetTop + 20;
    }
    measure();

    var rb = { x: S.W + R * 4, y: S.H * 0.3, vx: 0, vy: 0, lean: 0, look: { x: 0, y: 0 }, blink: 0, nextBlink: 2 };
    var arms = [-1, 1].map(function (side) { return { side: side, x: rb.x + side * R, y: rb.y + R * 2, ex: rb.x + side * R, ey: rb.y + R, grip: 1, dx: 0, dy: 1 }; });
    var job = null, clock = 0, idle = 0, started = false, sinceMeasure = 0, rings = [], motes = [];
    for (var m = 0; m < (wide ? 46 : 24); m++) motes.push({ x: Math.random() * S.W, y: Math.random() * S.H, z: 0.3 + Math.random() * 0.7, ph: Math.random() * 6.28 });

    function knock(l, delay) {
      if (l.state !== "home") return;
      var lx = wide ? S.W * (0.3 + Math.random() * 0.62) : S.W * (0.1 + Math.random() * 0.8);
      var fall = Math.sqrt(2 * Math.max(40, floorY - l.hy) / G);
      l.state = "falling"; l.wait = delay || 0; l.vx = (lx - l.hx) / fall * 0.8; l.vy = -160 - Math.random() * 180; l.vr = (Math.random() - 0.5) * 9;
    }
    function knockSome(n) {
      var home = letters.filter(function (l) { return l.state === "home"; });
      for (var i = 0; i < n && home.length; i++) knock(home.splice((Math.random() * home.length) | 0, 1)[0], i * 0.11);
    }
    function homeBase() { return { x: S.W * (wide ? 0.74 : 0.5), y: wide ? S.H * 0.42 : Math.min(floorY - R * 3.2, S.H * 0.66) }; }
    function shoulder(side) { var c = Math.cos(rb.lean), s = Math.sin(rb.lean), lx = side * R * 0.74, ly = -R * 0.5; return { x: rb.x + lx * c - ly * s, y: rb.y + lx * s + ly * c }; }

    function stepLetters(dt) {
      letters.forEach(function (l) {
        if (l.state !== "falling") return;
        if (l.wait > 0) { l.wait -= dt; return; }
        l.vy += G * dt; l.x += l.vx * dt; l.y += l.vy * dt; l.rot += l.vr * dt;
        if (l.x < l.w) { l.x = l.w; l.vx = Math.abs(l.vx) * 0.5; } else if (l.x > S.W - l.w) { l.x = S.W - l.w; l.vx = -Math.abs(l.vx) * 0.5; }
        var rest = floorY - l.h * 0.3;
        if (l.y > rest) {
          l.y = rest;
          if (l.vy < 190) { l.state = "rest"; l.vx = l.vy = l.vr = 0; l.rot = Math.max(-0.6, Math.min(0.6, ((l.rot + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI)); }
          else { l.vy *= -0.36; l.vx *= 0.62; l.vr *= 0.5; }
        }
      });
    }

    function stepRobot(dt) {
      var target = homeBase(), focus = null, active = null;
      if (!job) {
        var best = null, bd = 1e9;
        letters.forEach(function (l) { if (l.state === "rest") { var d = Math.hypot(l.x - rb.x, l.y - rb.y); if (d < bd) { bd = d; best = l; } } });
        if (best) job = { l: best, phase: "approach", t: 0, side: 0 };
      }
      if (job) {
        var l = job.l; job.t += dt; idle = 0;
        if (job.phase === "approach" || job.phase === "reach" || job.phase === "grasp") {
          if (!job.side) job.side = l.x + R * 2.6 < S.W ? 1 : -1;               // work from the right, so the left arm ends up over the title
          target = { x: l.x + job.side * R * 1.15, y: l.y - R * 1.75 }; focus = l;
          var near = Math.hypot(rb.x - target.x, rb.y - target.y) < R * 0.6 && Math.hypot(rb.vx, rb.vy) < 140;
          if (job.phase === "approach" && near) { job.phase = "reach"; job.t = 0; }
          if (job.phase !== "approach") {
            active = arms[job.side < 0 ? 1 : 0];                               // the arm nearest the letter
            active.tx = l.x - active.dx * HOLD; active.ty = l.y - active.dy * HOLD; active.open = job.phase === "reach" ? 1 : 0;
            if (job.phase === "reach" && Math.hypot(active.x + active.dx * HOLD - l.x, active.y + active.dy * HOLD - l.y) < 5) { job.phase = "grasp"; job.t = 0; }
            if (job.phase === "grasp" && job.t > 0.22) { l.state = "held"; job.phase = "carry"; job.t = 0; job.arm = active; }
          }
        } else {
          active = job.arm;
          var s = -active.side;                                                 // body sits on the far side of the working arm
          target = { x: Math.max(R * 1.3, Math.min(S.W - R * 1.3, l.hx + s * R * 1.35)), y: l.hy + R * 1.5 };
          focus = { x: l.hx, y: l.hy };
          var close = Math.hypot(rb.x - target.x, rb.y - target.y) < R * 1.1;
          if (job.phase === "carry") {
            active.open = 0;
            if (close) { active.tx = l.hx - active.dx * HOLD; active.ty = l.hy - active.dy * HOLD; }
            else { var sh = shoulder(active.side); active.tx = sh.x + active.side * R * 0.7; active.ty = sh.y + R * 1.3; }
            l.x = active.x + active.dx * HOLD; l.y = active.y + active.dy * HOLD; l.rot += (0 - l.rot) * Math.min(1, dt * 5);
            if (close && Math.hypot(l.x - l.hx, l.y - l.hy) < 2.2 && Math.abs(l.rot) < 0.04) {
              l.state = "home"; l.x = l.hx; l.y = l.hy; l.rot = 0; rings.push({ x: l.hx, y: l.hy, r: Math.max(l.w, l.h) * 0.5, t: 0 });
              job.phase = "release"; job.t = 0;
            }
          } else { active.open = 1; active.tx = active.x; active.ty = active.y; if (job.t > 0.28) job = null; }
        }
      } else {
        idle += dt;
        if (idle > 11 && letters.every(function (l) { return l.state === "home"; })) { knockSome(wide ? 3 : 2); idle = 0; }
        if (S.inside) focus = { x: S.mx, y: S.my };
      }

      // body: a damped spring toward the target, with a slow bob
      target.y += Math.sin(clock * 2.1) * R * 0.07;
      var ax = (target.x - rb.x) * 19 - rb.vx * 8.6, ay = (target.y - rb.y) * 19 - rb.vy * 8.6;
      rb.vx += ax * dt; rb.vy += ay * dt;
      var sp = Math.hypot(rb.vx, rb.vy), cap = Math.max(S.W, S.H) * 0.95; if (sp > cap) { rb.vx *= cap / sp; rb.vy *= cap / sp; }
      rb.x += rb.vx * dt; rb.y += rb.vy * dt;
      rb.y = Math.min(rb.y, floorY - R * 1.25);
      rb.lean += (Math.max(-0.32, Math.min(0.32, rb.vx * 0.0007)) - rb.lean) * Math.min(1, dt * 6);

      var fx = focus ? focus.x - rb.x : rb.vx, fy = focus ? focus.y - (rb.y - R * 1.5) : rb.vy, fd = Math.hypot(fx, fy) || 1;
      rb.look.x += (fx / fd - rb.look.x) * Math.min(1, dt * 7); rb.look.y += (fy / fd - rb.look.y) * Math.min(1, dt * 7);
      rb.nextBlink -= dt; if (rb.nextBlink < 0) { rb.blink = 0.16; rb.nextBlink = 2 + Math.random() * 3.5; } if (rb.blink > 0) rb.blink -= dt;

      arms.forEach(function (a) {
        var sh = shoulder(a.side);
        if (a !== active) { a.tx = sh.x + a.side * R * 0.42 - rb.vx * 0.04; a.ty = sh.y + R * 1.95 - Math.abs(rb.vx) * 0.02 + Math.sin(clock * 2.1 + a.side) * R * 0.05; a.open = 0.6; }
        var k = Math.min(1, dt * (a === active ? 9 : 6));
        a.x += (a.tx - a.x) * k; a.y += (a.ty - a.y) * k; a.grip += (a.open - a.grip) * Math.min(1, dt * 12);
        // two-link inverse kinematics; of the two elbow solutions take the one that points away from the body
        var dx = a.x - sh.x, dy = a.y - sh.y, d = Math.hypot(dx, dy) || 1, max = L1 + L2 - 1;
        if (d > max) { a.x = sh.x + dx / d * max; a.y = sh.y + dy / d * max; dx = a.x - sh.x; dy = a.y - sh.y; d = max; }
        var base = Math.atan2(dy, dx), c = Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))), bend = Math.acos(c);
        var e1 = { x: sh.x + Math.cos(base + bend) * L1, y: sh.y + Math.sin(base + bend) * L1 }, e2 = { x: sh.x + Math.cos(base - bend) * L1, y: sh.y + Math.sin(base - bend) * L1 };
        var pick = (e1.x - rb.x) * a.side + e1.y * 0.25 > (e2.x - rb.x) * a.side + e2.y * 0.25 ? e1 : e2;
        a.ex += (pick.x - a.ex) * Math.min(1, dt * 14); a.ey += (pick.y - a.ey) * Math.min(1, dt * 14);
        var fxx = a.x - a.ex, fyy = a.y - a.ey, fl = Math.hypot(fxx, fyy) || 1; a.dx = fxx / fl; a.dy = fyy / fl;
      });
    }

    function sync() {
      letters.forEach(function (l) {
        var t = l.state === "home" ? "" : "translate(" + (l.x - l.hx).toFixed(1) + "px," + (l.y - l.hy).toFixed(1) + "px) rotate(" + l.rot.toFixed(3) + "rad)";
        if (l.t !== t) { l.el.style.transform = t; l.t = t; }
      });
    }

    function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function shell(ctx, x0, y0, x1, y1) { var g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, "#d9e0ea"); g.addColorStop(1, "#8793a8"); return g; }
    function link(ctx, x0, y0, x1, y1, w) {
      var nx = -(y1 - y0), ny = x1 - x0, n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n; if (ny > 0) { nx = -nx; ny = -ny; }
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineWidth = w + 3; ctx.strokeStyle = "#060b16"; ctx.stroke();
      ctx.lineWidth = w; ctx.strokeStyle = "#c3ccd9"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 + nx * w * 0.16, y0 + ny * w * 0.16); ctx.lineTo(x1 + nx * w * 0.16, y1 + ny * w * 0.16); ctx.lineWidth = w * 0.52; ctx.strokeStyle = "#f4f7fb"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 - nx * w * 0.3, y0 - ny * w * 0.3); ctx.lineTo(x1 - nx * w * 0.3, y1 - ny * w * 0.3); ctx.lineWidth = w * 0.18; ctx.strokeStyle = "rgba(70,84,110,.55)"; ctx.stroke();
    }
    function joint(ctx, x, y, r, rgb) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = "#0d1524"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#2a3956"; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, 6.2832); ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.strokeStyle = "rgb(" + rgb + ")"; ctx.stroke();
      dot(ctx, x, y, r * 0.5, rgb, 0.5);
    }

    function drawRobot(ctx) {
      var busy = job && (job.phase === "carry" || job.phase === "grasp"), rgb = busy ? WARM : TEAL, flick = 0.85 + Math.sin(clock * 31) * 0.08 + Math.sin(clock * 17) * 0.07;
      // light on the floor, and the soft pool of light the robot sits in
      var lift = Math.max(0, floorY - rb.y - R), fa = Math.max(0.1, 0.55 - lift / (S.H * 0.7));
      ctx.save(); ctx.translate(rb.x, floorY + 2); ctx.scale(1, 0.16); dot(ctx, 0, 0, R * (1.1 + lift / S.H * 2), TEAL, fa); ctx.restore();
      dot(ctx, rb.x, rb.y - R * 0.4, R * 1.9, INK, 0.1);

      ctx.save(); ctx.translate(rb.x, rb.y); ctx.rotate(rb.lean);
      // thruster
      dot(ctx, 0, R * 1.2, R * 0.5 * flick, TEAL, 0.95); dot(ctx, 0, R * 1.05, R * 0.2, "255,255,255", 0.8 * flick);
      ctx.beginPath(); ctx.ellipse(0, R * 0.92, R * 0.34, R * 0.11, 0, 0, 6.2832); ctx.fillStyle = "#0a101c"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "rgb(" + TEAL + ")"; ctx.stroke();
      // body
      ctx.beginPath(); ctx.moveTo(-R * 0.68, -R * 0.42); ctx.bezierCurveTo(-R * 0.68, -R * 0.92, R * 0.68, -R * 0.92, R * 0.68, -R * 0.42);
      ctx.bezierCurveTo(R * 0.68, R * 0.38, R * 0.42, R * 0.9, 0, R * 0.94); ctx.bezierCurveTo(-R * 0.42, R * 0.9, -R * 0.68, R * 0.38, -R * 0.68, -R * 0.42); ctx.closePath();
      ctx.fillStyle = shell(ctx, -R * 0.6, -R * 0.9, R * 0.55, R * 0.95); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#060b16"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R * 0.6, R * 0.08); ctx.quadraticCurveTo(0, R * 0.3, R * 0.6, R * 0.08); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(40,54,82,.45)"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-R * 0.3, -R * 0.5, R * 0.16, R * 0.3, 0.5, 0, 6.2832); ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fill();
      rr(ctx, -R * 0.2, -R * 0.26, R * 0.4, R * 0.09, R * 0.045); ctx.fillStyle = "rgb(" + rgb + ")"; ctx.fill(); dot(ctx, 0, -R * 0.215, R * 0.16, rgb, 0.7);
      // neck and head
      ctx.fillStyle = "#0d1524"; ctx.fillRect(-R * 0.17, -R * 1.02, R * 0.34, R * 0.26);
      ctx.beginPath(); ctx.arc(-R * 0.82, -R * 1.52, R * 0.13, 0, 6.2832); ctx.arc(R * 0.82, -R * 1.52, R * 0.13, 0, 6.2832); ctx.fillStyle = "#121b2e"; ctx.fill();
      rr(ctx, -R * 0.8, -R * 2.08, R * 1.6, R * 1.12, R * 0.5); ctx.fillStyle = shell(ctx, -R * 0.7, -R * 2.1, R * 0.6, -R * 0.9); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#060b16"; ctx.stroke();
      rr(ctx, -R * 0.64, -R * 1.9, R * 1.28, R * 0.76, R * 0.36); var vg = ctx.createLinearGradient(0, -R * 1.9, 0, -R * 1.14); vg.addColorStop(0, "#03060c"); vg.addColorStop(1, "#131d33"); ctx.fillStyle = vg; ctx.fill();
      ctx.save(); ctx.clip(); ctx.beginPath(); ctx.moveTo(-R * 0.7, -R * 1.2); ctx.lineTo(-R * 0.2, -R * 1.95); ctx.lineTo(R * 0.05, -R * 1.95); ctx.lineTo(-R * 0.45, -R * 1.2); ctx.closePath(); ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fill(); ctx.restore();
      var ex = rb.look.x * R * 0.13, ey = rb.look.y * R * 0.09, eh = R * 0.3 * (rb.blink > 0 ? 0.12 : 1);
      [-1, 1].forEach(function (s) {
        rr(ctx, s * R * 0.27 + ex - R * 0.085, -R * 1.52 + ey - eh / 2, R * 0.17, eh, Math.min(R * 0.085, eh / 2)); ctx.fillStyle = "rgb(" + rgb + ")"; ctx.fill();
        dot(ctx, s * R * 0.27 + ex, -R * 1.52 + ey, R * 0.2, rgb, 0.75);
      });
      // shoulder caps
      [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(s * R * 0.74, -R * 0.5, R * 0.27, 0, 6.2832); ctx.fillStyle = shell(ctx, s * R * 0.74 - R * 0.3, -R * 0.8, s * R * 0.74 + R * 0.3, -R * 0.2); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#060b16"; ctx.stroke(); });
      ctx.restore();

      arms.forEach(function (a) {
        var sh = shoulder(a.side), px = a.x, py = a.y, ang = Math.atan2(a.dy, a.dx), sp = 0.22 + a.grip * 0.5, fl = R * 0.36;
        link(ctx, sh.x, sh.y, a.ex, a.ey, R * 0.3); link(ctx, a.ex, a.ey, px, py, R * 0.26);
        joint(ctx, a.ex, a.ey, R * 0.2, rgb);
        ctx.lineCap = "round";
        [-1, 1].forEach(function (f) {
          var kx = px + Math.cos(ang + f * sp * 1.5) * fl * 0.55, ky = py + Math.sin(ang + f * sp * 1.5) * fl * 0.55, tx = kx + Math.cos(ang + f * sp * 0.2) * fl * 0.6, ty = ky + Math.sin(ang + f * sp * 0.2) * fl * 0.6;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(kx, ky); ctx.lineTo(tx, ty); ctx.lineJoin = "round"; ctx.lineWidth = R * 0.12; ctx.strokeStyle = "#060b16"; ctx.stroke(); ctx.lineWidth = R * 0.07; ctx.strokeStyle = "#3a4a68"; ctx.stroke();
        });
        ctx.beginPath(); ctx.arc(px, py, R * 0.15, 0, 6.2832); ctx.fillStyle = "#0d1524"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#3a4a68"; ctx.stroke();
      });
    }

    function intro(dt) {
      if (!started && clock > 0.9) { started = true; knockSome(wide ? 7 : 4); }
    }

    return {
      step: function (dt, S) {
        clock += dt; sinceMeasure += dt; if (sinceMeasure > 0.5) { sinceMeasure = 0; measure(); }
        intro(dt); stepLetters(dt); if (clock > 1.5) stepRobot(dt);
        rings.forEach(function (r) { r.t += dt; }); rings = rings.filter(function (r) { return r.t < 0.7; });
        var over = S.inside && letters.some(function (l) { return l.state === "home" && Math.abs(S.mx - l.hx) < l.w / 2 + 2 && Math.abs(S.my - l.hy) < l.h / 2; });
        root.style.cursor = over ? "pointer" : "";
      },
      settle: function () { var b = homeBase(); rb.x = b.x; rb.y = b.y; started = true; for (var i = 0; i < 40; i++) stepRobot(0.03); },
      click: function (x, y) {
        var hit = null, bd = 1e9;
        letters.forEach(function (l) { var d = Math.hypot(x - l.hx, y - l.hy); if (l.state === "home" && Math.abs(x - l.hx) < l.w / 2 + 3 && Math.abs(y - l.hy) < l.h / 2 && d < bd) { bd = d; hit = l; } });
        if (hit) { knock(hit, 0); hit.vy = -320; }
      },
      act: function (name) { if (name === "knock") knockSome(wide ? 5 : 3); },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H); sync();
        // the floor, and dust in the light
        var fg = ctx.createLinearGradient(0, 0, S.W, 0); fg.addColorStop(0, "rgba(" + INK + ",0)"); fg.addColorStop(0.2, "rgba(" + INK + ",.34)"); fg.addColorStop(0.8, "rgba(" + INK + ",.34)"); fg.addColorStop(1, "rgba(" + INK + ",0)");
        ctx.fillStyle = fg; ctx.fillRect(0, floorY + 2, S.W, 1);
        motes.forEach(function (p) { var y = (p.y - clock * 9 * p.z) % S.H; if (y < 0) y += S.H; dot(ctx, p.x + Math.sin(clock * 0.4 + p.ph) * 14, y, 1.1 * p.z, INK, 0.3 * p.z); });
        // the plan: where the letter in hand belongs
        if (job) {
          var l = job.l, pad = 5, x0 = l.hx - l.w / 2 - pad, y0 = l.hy - l.h / 2 + l.h * 0.08, x1 = l.hx + l.w / 2 + pad, y1 = l.hy + l.h / 2 - l.h * 0.04, c = 8;
          ctx.beginPath();
          ctx.moveTo(x0, y0 + c); ctx.lineTo(x0, y0); ctx.lineTo(x0 + c, y0); ctx.moveTo(x1 - c, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + c);
          ctx.moveTo(x1, y1 - c); ctx.lineTo(x1, y1); ctx.lineTo(x1 - c, y1); ctx.moveTo(x0 + c, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - c);
          glow(ctx, TEAL, 1.4, 0.7 + Math.sin(clock * 6) * 0.25);
          if (l.state !== "home") { ctx.setLineDash([2, 8]); ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.hx, l.hy); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + TEAL + ",.45)"; ctx.stroke(); ctx.setLineDash([]); }
        }
        rings.forEach(function (r) { var k = r.t / 0.7; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.7 + k * 1.6), 0, 6.2832); glow(ctx, TEAL, 1.6, (1 - k) * 0.9); });
        drawRobot(ctx);
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

  var SCENES = { "data-science": boundary, vision: detection, nlp: attention, "neural-networks": descent, agents: robot, society: feed };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-demo]").forEach(function (root) {
      var make = SCENES[root.getAttribute("data-demo")];
      if (make) mount(root, make);
    });
  });
})();
