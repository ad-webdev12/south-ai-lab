/* South Artificial Intelligence Laboratory: research group demos.
   Each group page has one demo that runs the method the group studies. Every demo
   has visible controls that work with a keyboard or a finger, and writes its result
   as text under the plot, because the canvas itself is hidden from screen readers. */

(function () {
  "use strict";

  var INK = "159,195,245", DIM = "96,128,176", TEAL = "79,209,197", WARM = "255,138,92";

  function mount(root, make) {
    var stage = root.querySelector(".demo-stage"), canvas = stage.querySelector("canvas");
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
    function paint() { if (scene) { scene.draw(ctx, S); } }
    function build() {
      var rect = stage.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      S.W = rect.width; S.H = rect.height; S.dpr = dpr;
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

    canvas.addEventListener("pointermove", function (ev) {
      var rect = canvas.getBoundingClientRect();
      S.mx = ev.clientX - rect.left; S.my = ev.clientY - rect.top; S.inside = true;
      if (!running) refresh();
    });
    canvas.addEventListener("pointerleave", function () { S.inside = false; if (!running) refresh(); });
    canvas.addEventListener("click", function (ev) {
      if (!scene || !scene.click) return;
      var rect = canvas.getBoundingClientRect();
      scene.click(ev.clientX - rect.left, ev.clientY - rect.top, S);
      refresh();
    });
    root.addEventListener("click", function (ev) {
      var el = ev.target.closest("button[data-act]");
      if (!el) return;
      var act = el.getAttribute("data-act");
      if (act === "pause") { setRunning(!running); return; }
      if (act === "reset") { build(); return; }
      if (scene && scene.act) { scene.act(act, null, S); refresh(); }
    });
    root.addEventListener("input", function (ev) {
      var el = ev.target.closest("[data-act]");
      if (el && scene && scene.act) { scene.act(el.getAttribute("data-act"), el.value, S); refresh(); }
    });

    function fit() {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        var rect = stage.getBoundingClientRect();
        if (Math.abs(rect.width - S.W) > 1 || Math.abs(rect.height - S.H) > 1) build();
      }, 160);
    }
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(stage);
    else window.addEventListener("resize", fit);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        var was = offscreen; offscreen = !en[0].isIntersecting;
        if (was && !offscreen && running) { last = 0; window.requestAnimationFrame(frame); }
      }).observe(stage);
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

  /* marching squares: line segments where a sampled field crosses a level */
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
     Least-squares support vector classifier with an RBF kernel. Adding a point
     refits the model: solve (K + I/gamma) alpha = y, then draw f(x) = 0. */
  function boundary(S) {
    var unit = Math.min(S.W, S.H), sigma = unit * 0.3, gam = 12;
    var base = [[.2,.24,1],[.32,.14,1],[.13,.42,1],[.36,.36,1],[.26,.58,1],[.48,.2,1],
                [.78,.78,-1],[.66,.86,-1],[.86,.58,-1],[.62,.64,-1],[.73,.44,-1],[.5,.8,-1]];
    var pts = base.map(function (p) { return { x: p[0] * S.W, y: p[1] * S.H, c: p[2] }; });
    var cls = 1, cols = 64, rows = 40, field = new Float32Array(cols * rows), alpha = [];
    function k(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma)); }
    function fit() {
      var n = pts.length, A = [], i, j, c;
      for (i = 0; i < n; i++) { A.push([]); for (j = 0; j < n; j++) A[i].push(k(pts[i].x, pts[i].y, pts[j].x, pts[j].y) + (i === j ? 1 / gam : 0)); A[i].push(pts[i].c); }
      for (c = 0; c < n; c++) {
        var piv = c; for (i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[piv][c])) piv = i;
        var tmp = A[c]; A[c] = A[piv]; A[piv] = tmp;
        for (i = c + 1; i < n; i++) { var m = A[i][c] / A[c][c]; for (j = c; j <= n; j++) A[i][j] -= m * A[c][j]; }
      }
      alpha = new Array(n);
      for (i = n - 1; i >= 0; i--) { var s = A[i][n]; for (j = i + 1; j < n; j++) s -= A[i][j] * alpha[j]; alpha[i] = s / A[i][i]; }
      for (var rr = 0; rr < rows; rr++) for (var cc = 0; cc < cols; cc++) field[rr * cols + cc] = f(cc * S.W / (cols - 1), rr * S.H / (rows - 1));
    }
    function f(x, y) { var s = 0; for (var i = 0; i < pts.length; i++) s += alpha[i] * k(pts[i].x, pts[i].y, x, y); return s; }
    function add(x, y) { if (pts.length >= 40) pts.splice(base.length, 1); pts.push({ x: x, y: y, c: cls }); fit(); }
    fit();
    return {
      step: function () {},
      click: function (x, y) { add(x, y); },
      act: function (name, value, S) {
        if (name === "class") cls = Number(value);
        if (name === "random") add((0.1 + Math.random() * 0.8) * S.W, (0.1 + Math.random() * 0.8) * S.H);
      },
      text: function (S) {
        var t = pts.length + " points, " + (pts.length - base.length) + " added by you.";
        if (S.inside) t += " The model would call the spot under your pointer " + (f(S.mx, S.my) >= 0 ? "teal" : "orange") + ".";
        return t;
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        var cw = S.W / (cols - 1), ch = S.H / (rows - 1);
        ctx.lineWidth = 1.2; ctx.setLineDash([5, 6]); ctx.strokeStyle = "rgba(" + DIM + ",0.8)";
        ctx.beginPath(); contour(ctx, field, cols, rows, cw, ch, 0.55); contour(ctx, field, cols, rows, cw, ch, -0.55); ctx.stroke();
        ctx.setLineDash([]); ctx.lineWidth = 2.2; ctx.strokeStyle = "rgba(235,243,255,0.97)"; ctx.lineJoin = "round";
        ctx.beginPath(); contour(ctx, field, cols, rows, cw, ch, 0); ctx.stroke();
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i];
          ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 6.2832);
          if (p.c > 0) { ctx.fillStyle = "rgb(" + TEAL + ")"; ctx.fill(); }
          else { ctx.strokeStyle = "rgb(" + WARM + ")"; ctx.lineWidth = 2.2; ctx.stroke(); }
        }
        if (S.inside) {
          ctx.beginPath(); ctx.arc(S.mx, S.my, 11, 0, 6.2832);
          ctx.strokeStyle = f(S.mx, S.my) >= 0 ? "rgb(" + TEAL + ")" : "rgb(" + WARM + ")"; ctx.lineWidth = 1.5; ctx.stroke();
        }
      }
    };
  }

  /* ---------------------------------------------------------- computer vision
     A 3x3 convolution over real MNIST digits, one output pixel per position. */
  var DIGITS = ["000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000017cfffffa5000000000000000000bfffffffff200000000000000000cfeb6cceff9000000000000000005930002cff600000000000000000000000dffc00000000000000000000007dfff50000000000000000000003ffff910000000000000000000000dfffed750000000000000000000007dfffff4000000000000000000000138dffc0000000000000000000000001aff6000000000000000000000001cff3000000000000000000000008ff5000000000000000000000018ffe10000000000000000000002dffd0000000000000000000000afffa00000000000000000000aafffe5000000000000000000008ffffa10000000000000000000009ffc5000000000000000000000005c70000000000000000000000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004fffffaa815300000000000000006fffffffffffc742000000000000068667ccceffffff800000000000000000000277cffff00000000000000000000000029ff80000000000000000000000002ff20000000000000000000000007ff7000000000000000000000002fff1000000000000000000000006ff8000000000000000000000002fff200000000000000000000001bff7000000000000000000000008ffd000000000000000000000005fff200000000000000000000003fff500000000000000000000001fff9000000000000000000000006ffc000000000000000000000003fff500000000000000000000000effc000000000000000000000005ffc1000000000000000000000002ec1000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000038dfffca200000000000000068ccffff94000000000000000000fffc865000000000000000000000afc00000000000000000000000001de100000000000000000000000007f300000000000000000000000007f53330000000000000000000001dfffffa50000000000000000001dfca66cdff300000000000000003fa0000017cfd200000000000000000000000006ce300000000000000000000000001de500000000000000000000000003ce700000000000000000000000001df000000000000000000000000009f00000000000000000000000002ed0000000000007500000000001af2000000000005f9000000166bed50000000000005ffe99caffffd8100000000000000499efdc98330000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"];
  var KERNELS = [[-1, 0, 1, -2, 0, 2, -1, 0, 1], [-1, -2, -1, 0, 0, 0, 1, 2, 1], [0, -1, 0, -1, 5, -1, 0, -1, 0]];
  function convolution(S) {
    var narrow = S.W < 560, gap = narrow ? 14 : 40, topPad = 30;
    var cell = Math.max(3, Math.floor(Math.min((S.W - gap - 24) / 54, (S.H - topPad - 16) / 28)));
    var ox = (S.W - (cell * 54 + gap)) / 2, oy = topPad + (S.H - topPad - cell * 28) / 2;
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
      text: function () {
        var i = Math.max(0, done - 1);
        return "Position " + done + " of 676. Filter response here: " + out[i].toFixed(2) + ".";
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        var i, v;
        for (i = 0; i < 784; i++) { ctx.fillStyle = "rgba(" + INK + "," + (0.06 + img[i] * 0.9) + ")"; ctx.fillRect(ox + (i % 28) * cell, oy + ((i / 28) | 0) * cell, cell - 1, cell - 1); }
        for (i = 0; i < 676; i++) {
          v = i < done ? Math.max(-1, Math.min(1, out[i] / 3)) : 0;
          ctx.fillStyle = v >= 0 ? "rgba(" + TEAL + "," + (0.05 + v * 0.9) + ")" : "rgba(" + WARM + "," + (0.05 - v * 0.9) + ")";
          ctx.fillRect(ox2 + (i % 26) * cell, oy2 + ((i / 26) | 0) * cell, cell - 1, cell - 1);
        }
        var pos = Math.min(675, Math.max(0, done - 1)), kx = pos % 26, ky = (pos / 26) | 0;
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
        ctx.strokeRect(ox + kx * cell - 1, oy + ky * cell - 1, cell * 3 + 1, cell * 3 + 1);
        ctx.strokeRect(ox2 + kx * cell - 1, oy2 + ky * cell - 1, cell + 1, cell + 1);
        caption(ctx, "Input", ox, oy - 10);
        caption(ctx, "Output", ox2, oy2 - 10);
      }
    };
  }

  /* ---------------------------------------------------------- language
     Attention drawn as arcs. The weights come from small fixed vectors and are
     illustrative only; the page says so next to the plot. */
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
    var pos = [], active = 1, shown = W[1].slice(), clock = 0, auto = true, size = S.W < 560 ? 16 : 21;
    function layout(ctx) {
      pos = []; ctx.font = "600 " + size + "px 'Libre Franklin', sans-serif";
      var gap = S.W < 560 ? 14 : 26, lineH = S.W < 560 ? 70 : 96, max = S.W - 48;
      var widths = words.map(function (w) { return ctx.measureText(w).width; }), lines = [[]], used = 0;
      for (var k = 0; k < n; k++) { if (used + widths[k] > max && lines[lines.length - 1].length) { lines.push([]); used = 0; } lines[lines.length - 1].push(k); used += widths[k] + gap; }
      for (var L = 0; L < lines.length; L++) {
        var tw = -gap; lines[L].forEach(function (k) { tw += widths[k] + gap; });
        var x = (S.W - tw) / 2, y = S.H - 40 - (lines.length - 1 - L) * lineH;
        lines[L].forEach(function (k) { pos[k] = { x: x + widths[k] / 2, y: y, w: widths[k] }; x += widths[k] + gap; });
      }
    }
    return {
      step: function (dt) {
        clock += dt;
        if (auto && clock > 2) { active = (active + 1) % n; clock = 0; }
        for (var m = 0; m < n; m++) shown[m] += (W[active][m] - shown[m]) * Math.min(1, dt * 7 + (dt === 0 ? 1 : 0));
      },
      click: function (x, y) {
        var best = 0, bd = 1e9; for (var k = 0; k < n; k++) { var dd = Math.abs(pos[k].x - x) + Math.abs(pos[k].y - y); if (dd < bd) { bd = dd; best = k; } }
        active = best; auto = false;
      },
      act: function (name) { auto = false; active = (active + (name === "next" ? 1 : n - 1)) % n; },
      text: function () {
        var order = W[active].map(function (w, k) { return [w, k]; }).filter(function (p) { return p[1] !== active; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 3);
        return "“" + words[active] + "” looks most at " + order.map(function (p) { return "“" + words[p[1]] + "” (" + p[0].toFixed(2) + ")"; }).join(", ") + ". Illustrative weights.";
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H); layout(ctx);
        var a = pos[active];
        for (var k = 0; k < n; k++) {
          if (k === active) continue;
          var b = pos[k], w = shown[k]; ctx.beginPath();
          if (Math.abs(b.y - a.y) < 2) { var mid = (a.x + b.x) / 2, rad = Math.abs(a.x - b.x) / 2; ctx.ellipse(mid, a.y - 22, rad, Math.min(a.y - 40, rad * 0.75), 0, Math.PI, 0); }
          else { ctx.moveTo(a.x, a.y - 22); ctx.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 90, b.x, b.y - 22); }
          ctx.strokeStyle = "rgba(" + TEAL + "," + Math.min(0.95, 0.12 + w * 2.6) + ")"; ctx.lineWidth = 0.8 + w * 18; ctx.stroke();
        }
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
    var cols = 120, rows = Math.max(40, Math.round(cols * S.H / S.W)), field = new Float32Array(cols * rows), lo = 1e9, hi = -1e9;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) { var v = loss(-xr + 2 * xr * c / (cols - 1), yr - 2 * yr * r / (rows - 1)); field[r * cols + c] = v; if (v < lo) lo = v; if (v > hi) hi = v; }
    for (var L = 1; L < 24; L++) { b.beginPath(); contour(b, field, cols, rows, S.W / (cols - 1), S.H / (rows - 1), lo + (hi - lo) * L / 24); b.strokeStyle = L < 8 ? "rgba(" + INK + ",0.4)" : "rgba(" + DIM + ",0.3)"; b.lineWidth = 1; b.stroke(); }
    var p, vel, n, path, hist, acc = 0, settled = false;
    function restart(at) { var a = Math.random() * 6.28, rad = 2.2 + Math.random() * .8; p = at || [Math.cos(a) * rad * 1.25, Math.sin(a) * rad * .78]; vel = [0, 0]; n = 0; path = [p.slice()]; hist = [loss(p[0], p[1])]; settled = false; }
    function one() { var g = grad(p[0], p[1]); vel[0] = MU * vel[0] - LR * g[0]; vel[1] = MU * vel[1] - LR * g[1]; p[0] += vel[0]; p[1] += vel[1]; n++; path.push(p.slice()); hist.push(loss(p[0], p[1])); g = grad(p[0], p[1]); settled = n > 45 && Math.hypot(g[0], g[1]) < .004 && Math.hypot(vel[0], vel[1]) < .004; }
    restart();
    return {
      step: function (dt) { if (settled) return; acc += dt * 24; while (acc >= 1 && !settled) { acc--; one(); } },
      settle: function () { for (var i = 0; i < 200 && !settled; i++) one(); },
      click: function (x, y, S) { restart([x / S.W * 2 * xr - xr, yr - y / S.H * 2 * yr]); },
      act: function (name) { if (name === "restart") restart(); if (name === "step") one(); },
      text: function () { return "Step " + n + ". Loss " + hist[hist.length - 1].toFixed(3) + ", started at " + hist[0].toFixed(3) + (settled ? ". Settled in a valley. Click the surface or choose Random start." : "."); },
      draw: function (ctx, S) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.drawImage(back, 0, 0); ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
        ctx.beginPath(); for (var i = 0; i < path.length; i++) { var q = px(path[i][0], path[i][1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
        ctx.strokeStyle = "rgb(" + WARM + ")"; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
        var s0 = px(path[0][0], path[0][1]); ctx.strokeStyle = "rgb(" + WARM + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s0[0] - 6, s0[1]); ctx.lineTo(s0[0] + 6, s0[1]); ctx.moveTo(s0[0], s0[1] - 6); ctx.lineTo(s0[0], s0[1] + 6); ctx.stroke();
        var h = px(p[0], p[1]); ctx.beginPath(); ctx.arc(h[0], h[1], 6, 0, 6.2832); ctx.fillStyle = "#fff"; ctx.fill();
        // loss history, bottom left
        var gw = Math.min(200, S.W * 0.4), gh = 56, gx = 16, gy = S.H - gh - 16, mn = Math.min.apply(null, hist), mx = Math.max.apply(null, hist);
        ctx.fillStyle = "rgba(6,15,30,0.82)"; ctx.fillRect(gx - 8, gy - 22, gw + 16, gh + 30);
        caption(ctx, "Loss so far", gx, gy - 6);
        ctx.beginPath(); for (var k = 0; k < hist.length; k++) { var X = gx + (hist.length > 1 ? k / (hist.length - 1) : 0) * gw, Y = gy + gh - ((hist[k] - mn) / (mx - mn || 1)) * gh; if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
        ctx.strokeStyle = "rgba(235,243,255,0.95)"; ctx.lineWidth = 1.6; ctx.stroke();
      }
    };
  }

  /* ---------------------------------------------------------- agents
     Tabular Q-learning in a gridworld. */
  function gridworld(S) {
    var cols = S.W < 560 ? 8 : 12, rows = S.W < 560 ? 7 : 8;
    var cell = Math.floor(Math.min((S.W - 24) / cols, (S.H - 24) / rows)), ox = (S.W - cell * cols) / 2, oy = (S.H - cell * rows) / 2;
    var walls = {}, seed = 11, i;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < cols * rows * 0.16; i++) walls[(rnd() * cols * rows) | 0] = 1;
    var goal = cols * 2 - 2, start = cols * (rows - 1); delete walls[goal]; delete walls[start];
    var Q = new Float32Array(cols * rows * 4), s = start, episodes = 0, steps = 0, lastLen = 0, acc = 0, eps = 0.25;
    var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    function best(st) { var b = 0; for (var a = 1; a < 4; a++) if (Q[st * 4 + a] > Q[st * 4 + b]) b = a; return b; }
    function move() {
      var a = Math.random() < eps ? (Math.random() * 4) | 0 : best(s);
      var x = s % cols + DX[a], y = ((s / cols) | 0) + DY[a], ns = s, rew = -0.02;
      if (x >= 0 && x < cols && y >= 0 && y < rows && !walls[y * cols + x]) ns = y * cols + x; else rew = -0.2;
      if (ns === goal) rew = 1;
      Q[s * 4 + a] += 0.35 * (rew + (ns === goal ? 0 : 0.93 * Q[ns * 4 + best(ns)]) - Q[s * 4 + a]);
      s = ns; steps++;
      if (s === goal || steps > 160) { if (s === goal) lastLen = steps; s = start; steps = 0; episodes++; }
    }
    function setGoal(g) { goal = g; Q.fill(0); episodes = 0; s = start; steps = 0; lastLen = 0; }
    return {
      step: function (dt) { acc += dt * 90; while (acc >= 1) { acc--; move(); } },
      settle: function () { for (var k = 0; k < 9000; k++) move(); },
      click: function (x, y) { var cx = ((x - ox) / cell) | 0, cy = ((y - oy) / cell) | 0, g = cy * cols + cx; if (cx < 0 || cy < 0 || cx >= cols || cy >= rows || walls[g] || g === start) return; setGoal(g); },
      act: function (name) { if (name !== "goal") return; var g; do { g = (Math.random() * cols * rows) | 0; } while (walls[g] || g === start || g === goal); setGoal(g); },
      text: function () { return "Episode " + episodes + ". " + (lastLen ? "Last trip to the goal took " + lastLen + " steps." : "It has not found the goal yet."); },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        for (var c = 0; c < cols * rows; c++) {
          var x = ox + (c % cols) * cell, y = oy + ((c / cols) | 0) * cell, b = best(c), v = Math.max(0, Math.min(1, Q[c * 4 + b]));
          if (walls[c]) { ctx.fillStyle = "rgba(" + DIM + ",0.42)"; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2); continue; }
          ctx.fillStyle = "rgba(" + TEAL + "," + (0.04 + v * 0.55) + ")"; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          if (c === goal) { ctx.fillStyle = "rgb(" + WARM + ")"; ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, cell * 0.24, 0, 6.2832); ctx.fill(); continue; }
          if (Q[c * 4 + b] > 0.01) {
            var mx = x + cell / 2, my = y + cell / 2, L = cell * 0.24;
            ctx.strokeStyle = "rgba(235,243,255," + (0.35 + v * 0.6) + ")"; ctx.lineWidth = 1.6; ctx.beginPath();
            ctx.moveTo(mx - DX[b] * L, my - DY[b] * L); ctx.lineTo(mx + DX[b] * L, my + DY[b] * L);
            ctx.lineTo(mx + DX[b] * L - (DX[b] - DY[b]) * L * 0.5, my + DY[b] * L - (DY[b] + DX[b]) * L * 0.5);
            ctx.moveTo(mx + DX[b] * L, my + DY[b] * L);
            ctx.lineTo(mx + DX[b] * L - (DX[b] + DY[b]) * L * 0.5, my + DY[b] * L - (DY[b] - DX[b]) * L * 0.5); ctx.stroke();
          }
        }
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ox + (s % cols + 0.5) * cell, oy + (((s / cols) | 0) + 0.5) * cell, cell * 0.19, 0, 6.2832); ctx.fill();
        caption(ctx, "Start", ox + 4, oy + cell * rows - 6);
      }
    };
  }

  /* ---------------------------------------------------------- ethics
     One approval threshold, two groups whose simulated scores are spread differently. */
  function threshold(S, root) {
    var seed = 5, people = [], i, pad = 28;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function gauss() { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.2832 * rnd()); }
    for (i = 0; i < 140; i++) { var g = i % 2; people.push({ g: g, s: Math.max(0.02, Math.min(0.98, (g ? 0.44 : 0.58) + gauss() * 0.15)), j: rnd() }); }
    var slider = root.querySelector('[data-act="threshold"]'), th = slider ? Number(slider.value) / 100 : 0.55, ok = [0, 0], tot = [70, 70];
    return {
      step: function () {},
      click: function (x, y, S) { th = Math.max(0.05, Math.min(0.95, (x - pad) / (S.W - 2 * pad))); if (slider) slider.value = Math.round(th * 100); },
      act: function (name, value) { if (name === "threshold") th = Number(value) / 100; },
      text: function () { return "Threshold " + th.toFixed(2) + ". Group A approved: " + Math.round(100 * ok[0] / tot[0]) + "%. Group B approved: " + Math.round(100 * ok[1] / tot[1]) + "%."; },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        var w = S.W - 2 * pad, bandH = (S.H - 96) / 2, tops = [34, 34 + bandH + 28]; ok = [0, 0];
        for (var k = 0; k < people.length; k++) {
          var p = people[k], x = pad + p.s * w, y = tops[p.g] + 8 + p.j * (bandH - 16), pass = p.s >= th; if (pass) ok[p.g]++;
          ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); var col = p.g ? WARM : TEAL;
          if (pass) { ctx.fillStyle = "rgb(" + col + ")"; ctx.fill(); } else { ctx.strokeStyle = "rgba(" + col + ",0.7)"; ctx.lineWidth = 1.6; ctx.stroke(); }
        }
        caption(ctx, "Group A", pad, tops[0] - 8); caption(ctx, "Group B", pad, tops[1] - 8);
        var ay = S.H - 26; ctx.strokeStyle = "rgba(" + DIM + ",0.9)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, ay); ctx.lineTo(pad + w, ay); ctx.stroke();
        caption(ctx, "Lower score", pad, ay + 18); caption(ctx, "Higher score", pad + w, ay + 18, "right");
        var tx = pad + th * w; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(tx, 14); ctx.lineTo(tx, ay); ctx.stroke();
        caption(ctx, "Threshold", tx + (th > 0.8 ? -8 : 8), 24, th > 0.8 ? "right" : "left");
      }
    };
  }

  var SCENES = { "data-science": boundary, vision: convolution, nlp: attention, "neural-networks": descent, agents: gridworld, society: threshold };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-demo]").forEach(function (root) {
      var make = SCENES[root.getAttribute("data-demo")];
      if (make) mount(root, make);
    });
  });
})();
