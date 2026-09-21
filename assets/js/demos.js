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
     A 3x3 convolution over real MNIST digits, one output pixel per position. */
  var DIGITS = ["000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000017cfffffa5000000000000000000bfffffffff200000000000000000cfeb6cceff9000000000000000005930002cff600000000000000000000000dffc00000000000000000000007dfff50000000000000000000003ffff910000000000000000000000dfffed750000000000000000000007dfffff4000000000000000000000138dffc0000000000000000000000001aff6000000000000000000000001cff3000000000000000000000008ff5000000000000000000000018ffe10000000000000000000002dffd0000000000000000000000afffa00000000000000000000aafffe5000000000000000000008ffffa10000000000000000000009ffc5000000000000000000000005c70000000000000000000000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004fffffaa815300000000000000006fffffffffffc742000000000000068667ccceffffff800000000000000000000277cffff00000000000000000000000029ff80000000000000000000000002ff20000000000000000000000007ff7000000000000000000000002fff1000000000000000000000006ff8000000000000000000000002fff200000000000000000000001bff7000000000000000000000008ffd000000000000000000000005fff200000000000000000000003fff500000000000000000000001fff9000000000000000000000006ffc000000000000000000000003fff500000000000000000000000effc000000000000000000000005ffc1000000000000000000000002ec1000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000038dfffca200000000000000068ccffff94000000000000000000fffc865000000000000000000000afc00000000000000000000000001de100000000000000000000000007f300000000000000000000000007f53330000000000000000000001dfffffa50000000000000000001dfca66cdff300000000000000003fa0000017cfd200000000000000000000000006ce300000000000000000000000001de500000000000000000000000003ce700000000000000000000000001df000000000000000000000000009f00000000000000000000000002ed0000000000007500000000001af2000000000005f9000000166bed50000000000005ffe99caffffd8100000000000000499efdc98330000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"];
  var KERNELS = [[-1, 0, 1, -2, 0, 2, -1, 0, 1], [-1, -2, -1, 0, 0, 0, 1, 2, 1], [0, -1, 0, -1, 5, -1, 0, -1, 0]];
  function convolution(S) {
    var r = S.r, gap = Math.max(16, r.w * 0.06), topPad = 26;
    var cell = Math.max(3, Math.floor(Math.min((r.w - gap) / 54, (r.h - topPad) / 28)));
    var ox = r.x + (r.w - (cell * 54 + gap)) / 2, oy = r.y + topPad + (r.h - topPad - cell * 28) / 2;
    var ox2 = ox + cell * 28 + gap + cell, oy2 = oy + cell;
    var digit = 0, kern = 0, img = [], out = new Float32Array(676), done = 0, acc = 0, hold = 0;
    function load() { var s = DIGITS[digit % DIGITS.length]; img = []; for (var i = 0; i < 784; i++) img.push(parseInt(s[i], 16) / 15); out.fill(0); done = 0; }
    function at(i) { var cx = i % 26, cy = (i / 26) | 0, k = KERNELS[kern], s = 0; for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) s += k[a * 3 + b] * img[(cy + a) * 28 + cx + b]; return s; }
    function one() { if (done < 676) { out[done] = at(done); done++; } }
    load();
    return {
      step: function (dt) {
        if (hold > 0) { hold -= dt; if (hold <= 0) { digit++; load(); } return; }
        acc += dt * 170; while (acc >= 1) { acc--; one(); }
        if (done >= 676) hold = 1.8;
      },
      settle: function () { while (done < 676) one(); },
      act: function (name, value) { if (name === "filter") { kern = Number(value); out.fill(0); done = 0; hold = 0; } if (name === "step") { hold = 0; one(); } },
      text: function () { return "Position " + done + " of 676. Filter response here: " + out[Math.max(0, done - 1)].toFixed(2) + "."; },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        var i, v;
        ctx.globalCompositeOperation = "lighter";
        for (i = 0; i < 784; i++) { ctx.fillStyle = "rgba(" + INK + "," + (0.05 + img[i] * 0.9) + ")"; ctx.fillRect(ox + (i % 28) * cell, oy + ((i / 28) | 0) * cell, cell - 1, cell - 1); }
        for (i = 0; i < 676; i++) {
          v = i < done ? Math.max(-1, Math.min(1, out[i] / 3)) : 0;
          ctx.fillStyle = v >= 0 ? "rgba(" + TEAL + "," + (0.04 + v * 0.92) + ")" : "rgba(" + WARM + "," + (0.04 - v * 0.92) + ")";
          ctx.fillRect(ox2 + (i % 26) * cell, oy2 + ((i / 26) | 0) * cell, cell - 1, cell - 1);
        }
        ctx.globalCompositeOperation = "source-over";
        var pos = Math.min(675, Math.max(0, done - 1)), kx = pos % 26, ky = (pos / 26) | 0;
        dot(ctx, ox + (kx + 1.5) * cell, oy + (ky + 1.5) * cell, cell * 1.6, "255,255,255", 0.5);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
        ctx.strokeRect(ox + kx * cell - 1, oy + ky * cell - 1, cell * 3 + 1, cell * 3 + 1);
        ctx.strokeRect(ox2 + kx * cell - 1, oy2 + ky * cell - 1, cell + 1, cell + 1);
        ctx.beginPath(); ctx.moveTo(ox + (kx + 3) * cell, oy + (ky + 1.5) * cell); ctx.lineTo(ox2 + kx * cell, oy2 + (ky + 0.5) * cell); glow(ctx, "255,255,255", 1, 0.5);
        caption(ctx, "Input", ox, oy - 10); caption(ctx, "Output", ox2, oy2 - 10);
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
     Many agents share one Q-table and explore a field of obstacles. What they learn
     about the way to the goal shows up as light spreading outward from it. Click to
     move the goal, and the light has to find its way again. */
  function swarm(S) {
    var size = S.W < 860 ? 34 : 44, cols = Math.ceil(S.W / size), rows = Math.ceil(S.H / size), N = cols * rows;
    var walls = new Uint8Array(N), seed = 23, i;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < N * 0.17; i++) walls[(rnd() * N) | 0] = 1;
    var goal = Math.floor(rows * 0.35) * cols + Math.floor(cols * 0.78); walls[goal] = 0;
    var Q = new Float32Array(N * 4), DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0], agents = [], reached = 0, acc = 0, eps = 0.2;
    function free() { var c; do { c = (Math.random() * N) | 0; } while (walls[c] || c === goal); return c; }
    for (i = 0; i < (S.W < 860 ? 14 : 26); i++) { var c0 = free(); agents.push({ s: c0, steps: 0, x: (c0 % cols + .5) * size, y: (((c0 / cols) | 0) + .5) * size, trail: [] }); }
    function best(st) { var b = 0; for (var a = 1; a < 4; a++) if (Q[st * 4 + a] > Q[st * 4 + b]) b = a; return b; }
    function move(ag) {
      var a = Math.random() < eps ? (Math.random() * 4) | 0 : best(ag.s);
      var x = ag.s % cols + DX[a], y = ((ag.s / cols) | 0) + DY[a], ns = ag.s, rew = -0.02;
      if (x >= 0 && x < cols && y >= 0 && y < rows && !walls[y * cols + x]) ns = y * cols + x; else rew = -0.2;
      if (ns === goal) rew = 1;
      Q[ag.s * 4 + a] += 0.4 * (rew + (ns === goal ? 0 : 0.95 * Q[ns * 4 + best(ns)]) - Q[ag.s * 4 + a]);
      ag.s = ns; ag.steps++;
      if (ns === goal || ag.steps > 220) { if (ns === goal) reached++; ag.s = free(); ag.steps = 0; ag.trail = []; ag.x = (ag.s % cols + .5) * size; ag.y = (((ag.s / cols) | 0) + .5) * size; }
    }
    function setGoal(g) { goal = g; walls[g] = 0; Q.fill(0); reached = 0; }
    return {
      step: function (dt) {
        acc += dt * 14; while (acc >= 1) { acc--; for (var k = 0; k < agents.length; k++) move(agents[k]); }
        for (var m = 0; m < agents.length; m++) {
          var ag = agents[m], tx = (ag.s % cols + .5) * size, ty = (((ag.s / cols) | 0) + .5) * size;
          ag.x += (tx - ag.x) * Math.min(1, dt * 12); ag.y += (ty - ag.y) * Math.min(1, dt * 12);
          ag.trail.push([ag.x, ag.y]); if (ag.trail.length > 26) ag.trail.shift();
        }
      },
      settle: function () { for (var k = 0; k < 600; k++) for (var m = 0; m < agents.length; m++) move(agents[m]); },
      click: function (x, y) { var g = ((y / size) | 0) * cols + ((x / size) | 0); if (g >= 0 && g < N && !walls[g]) setGoal(g); },
      act: function (name) { if (name === "goal") setGoal(free()); },
      text: function () { return agents.length + " agents sharing what they learn. They have reached the goal " + reached + " times since it last moved."; },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        for (var c = 0; c < N; c++) {
          var x = (c % cols) * size, y = ((c / cols) | 0) * size;
          if (walls[c]) { ctx.fillStyle = "rgba(" + DIM + ",0.16)"; ctx.fillRect(x + 3, y + 3, size - 6, size - 6); continue; }
          var v = Math.max(0, Math.min(1, Q[c * 4 + best(c)]));
          if (v > 0.015) dot(ctx, x + size / 2, y + size / 2, size * 0.34, TEAL, Math.pow(v, 0.8) * 0.85);
        }
        var gx = (goal % cols + .5) * size, gy = (((goal / cols) | 0) + .5) * size, pulse = 1 + Math.sin(S.t * 2.2) * 0.12;
        dot(ctx, gx, gy, size * 0.5 * pulse, WARM, 1); ctx.beginPath(); ctx.arc(gx, gy, size * 0.2, 0, 6.2832); ctx.fillStyle = "rgb(" + WARM + ")"; ctx.fill();
        for (var m = 0; m < agents.length; m++) {
          var ag = agents[m];
          if (ag.trail.length > 1) { ctx.beginPath(); ctx.moveTo(ag.trail[0][0], ag.trail[0][1]); for (var k = 1; k < ag.trail.length; k++) ctx.lineTo(ag.trail[k][0], ag.trail[k][1]); glow(ctx, "235,243,255", 1.2, 0.55); }
          dot(ctx, ag.x, ag.y, 4, "255,255,255", 0.9);
        }
      }
    };
  }

  /* ---------------------------------------------------------- ethics
     Two groups of simulated applicants stream toward one gate. Everyone scoring above
     the threshold passes. The groups' scores are spread differently, so one rule lets
     them through at different rates. */
  function gate(S, root) {
    var slider = root.querySelector('[data-act="threshold"]'), th = slider ? Number(slider.value) / 100 : 0.55;
    var top = S.H * (S.W < 860 ? 0.5 : 0.1), bot = S.H * 0.84, gx = S.W * (S.W < 860 ? 0.62 : 0.72), x0 = S.W * (S.W < 860 ? 0 : 0.36);
    var people = [], pass = [0, 0], seen = [0, 0], spawn = 0;
    function gauss() { return Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(6.2832 * Math.random()); }
    function add(x) { var g = Math.random() < 0.5 ? 0 : 1, s = Math.max(0.03, Math.min(0.97, (g ? 0.44 : 0.58) + gauss() * 0.15)); people.push({ g: g, s: s, x: x, y: bot - s * (bot - top), v: 70 + Math.random() * 50, state: 0, a: 1, trail: [] }); }
    for (var i = 0; i < 70; i++) add(x0 + Math.random() * (gx - x0));
    function ty() { return bot - th * (bot - top); }
    return {
      step: function (dt, S) {
        if (S.inside && S.my > top - 20 && S.my < bot + 20) { th += ((bot - S.my) / (bot - top) - th) * Math.min(1, dt * 10 + (dt ? 0 : 1)); th = Math.max(0.05, Math.min(0.95, th)); if (slider) slider.value = Math.round(th * 100); }
        spawn += dt * 16; while (spawn >= 1) { spawn--; add(x0 - 10); }
        for (var k = people.length - 1; k >= 0; k--) {
          var p = people[k];
          if (p.state === 0 && p.x >= gx) { seen[p.g]++; if (p.s >= th) { p.state = 1; pass[p.g]++; } else { p.state = 2; } }
          if (p.state === 2) { p.x += p.v * 0.15 * dt; p.y += 60 * dt; p.a -= dt * 1.1; } else { p.x += p.v * dt; }
          p.trail.push([p.x, p.y]); if (p.trail.length > 14) p.trail.shift();
          if (p.a <= 0 || p.x > S.W + 20) people.splice(k, 1);
        }
        if (seen[0] + seen[1] > 900) { pass[0] /= 2; pass[1] /= 2; seen[0] /= 2; seen[1] /= 2; }
      },
      settle: function () { for (var k = 0; k < 300; k++) this.step(0.05, { inside: false, W: S.W }); },
      act: function (name, value) { if (name === "threshold") th = Number(value) / 100; },
      text: function () { return "Threshold " + th.toFixed(2) + ". Approved so far: group A " + (seen[0] ? Math.round(100 * pass[0] / seen[0]) : 0) + "%, group B " + (seen[1] ? Math.round(100 * pass[1] / seen[1]) : 0) + "%. Scores are simulated."; },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        var y = ty();
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, bot + 8); glow(ctx, "235,243,255", 2.4);      // the closed part of the gate
        ctx.beginPath(); ctx.moveTo(gx - 26, y); ctx.lineTo(gx + 26, y); glow(ctx, "235,243,255", 2);
        ctx.setLineDash([3, 8]); ctx.strokeStyle = "rgba(" + DIM + ",0.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, top - 8); ctx.lineTo(gx, y); ctx.stroke(); ctx.setLineDash([]);
        for (var k = 0; k < people.length; k++) {
          var p = people[k], col = p.g ? WARM : TEAL, a = p.a * (p.state === 1 ? 1 : 0.7);
          if (p.state === 1 && p.trail.length > 1) { ctx.beginPath(); ctx.moveTo(p.trail[0][0], p.trail[0][1]); for (var t = 1; t < p.trail.length; t++) ctx.lineTo(p.trail[t][0], p.trail[t][1]); glow(ctx, col, 1.4, 0.6); }
          dot(ctx, p.x, p.y, p.state === 1 ? 6 : 4, col, a);
        }
        caption(ctx, "Threshold", gx + 32, y + 4); caption(ctx, "Higher score", gx + 10, top - 12); caption(ctx, "Approved", Math.min(S.W - 16, gx + 150), top + 18, "right");
      }
    };
  }

  var SCENES = { "data-science": boundary, vision: convolution, nlp: attention, "neural-networks": descent, agents: swarm, society: gate };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-demo]").forEach(function (root) {
      var make = SCENES[root.getAttribute("data-demo")];
      if (make) mount(root, make);
    });
  });
})();
