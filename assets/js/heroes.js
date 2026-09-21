/* South Artificial Intelligence Laboratory: research group heroes.
   One animation per group, each running the real method the group studies.

     data-science     a kernel classifier whose decision boundary bends around your pointer
     vision           a 3x3 convolution sliding over real MNIST digits
     nlp              attention arcs between the words of a sentence
     neural-networks  gradient descent with momentum on a loss surface
     agents           tabular Q-learning in a gridworld
     society          one decision threshold applied to two groups

   A shared harness handles sizing, the pointer, pausing, reduced motion, and
   stopping when the hero is off screen. */

(function () {
  "use strict";

  var INK = "159,195,245", DIM = "96,128,176", TEAL = "79,209,197", WARM = "255,138,92";

  function region(W, H) {
    // the part of the hero the visual may use; the text sits on the left on wide screens
    return W < 820 ? { x: W * 0.05, y: H * 0.08, w: W * 0.9, h: H * 0.84 }
                   : { x: W * 0.47, y: H * 0.1, w: W * 0.49, h: H * 0.8 };
  }

  function mount(host, make) {
    var canvas = host.querySelector("canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var pauseBtn = host.querySelector("[data-pause]");
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var S = { W: 0, H: 0, mx: 0, my: 0, inside: false, t: 0 };
    var scene = null, running = !reduced, offscreen = false, last = 0, timer;

    function build() {
      var rect = host.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      var dpr = Math.min(window.devicePixelRatio || 1, rect.width > 900 ? 1.5 : 2);
      S.W = rect.width; S.H = rect.height; S.dpr = dpr;
      canvas.width = Math.round(S.W * dpr); canvas.height = Math.round(S.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S.r = region(S.W, S.H);
      scene = make(S);
      if (reduced && scene.settle) scene.settle(S);
      scene.draw(ctx, S);
    }
    function frame(ts) {
      if (!running || offscreen || !scene) { last = 0; return; }
      if (!last) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.05);
      last = ts; S.t += dt;
      scene.step(dt, S);
      scene.draw(ctx, S);
      window.requestAnimationFrame(frame);
    }
    function setRunning(on) {
      running = on;
      if (pauseBtn) pauseBtn.textContent = on ? "Pause animation" : "Play animation";
      if (on) { last = 0; window.requestAnimationFrame(frame); }
    }
    function fit() {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        var rect = host.getBoundingClientRect();
        if (Math.abs(rect.width - S.W) > 1 || Math.abs(rect.height - S.H) > 1) build();
      }, 160);
    }
    host.addEventListener("pointermove", function (ev) {
      if (ev.pointerType === "touch") return;
      var rect = host.getBoundingClientRect();
      S.mx = ev.clientX - rect.left; S.my = ev.clientY - rect.top; S.inside = true;
      if (!running && scene) { scene.step(0, S); scene.draw(ctx, S); }
    });
    host.addEventListener("pointerleave", function () { S.inside = false; });
    host.addEventListener("pointerdown", function (ev) {
      if (ev.target.closest("a,button,summary") || !scene || !scene.click) return;
      var rect = host.getBoundingClientRect();
      scene.click(ev.clientX - rect.left, ev.clientY - rect.top, S);
      if (!running) scene.draw(ctx, S);
    });
    if (pauseBtn) pauseBtn.addEventListener("click", function () { setRunning(!running); });
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(host);
    else window.addEventListener("resize", fit);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        var was = offscreen; offscreen = !en[0].isIntersecting;
        if (was && !offscreen && running) { last = 0; window.requestAnimationFrame(frame); }
      }).observe(host);
    }
    build();
    setRunning(running);
  }

  function label(ctx, text, x, y, align) {
    ctx.font = "12px ui-monospace, Consolas, monospace";
    ctx.textAlign = align || "left";
    ctx.fillStyle = "rgba(" + DIM + ",0.95)";
    ctx.fillText(text, x, y);
  }

  /* marching squares: line segments where a sampled field crosses zero */
  function zeroContour(ctx, f, cols, rows, x0, y0, cw, ch, level) {
    for (var r = 0; r < rows - 1; r++) {
      for (var c = 0; c < cols - 1; c++) {
        var a = f[r * cols + c] - level, b = f[r * cols + c + 1] - level;
        var d = f[(r + 1) * cols + c] - level, e = f[(r + 1) * cols + c + 1] - level;
        var idx = (a > 0 ? 1 : 0) | (b > 0 ? 2 : 0) | (e > 0 ? 4 : 0) | (d > 0 ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        var X = x0 + c * cw, Y = y0 + r * ch;
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
        for (var s = 0; s < segs.length; s++) {
          ctx.moveTo(segs[s][0][0], segs[s][0][1]);
          ctx.lineTo(segs[s][1][0], segs[s][1][1]);
        }
      }
    }
  }

  /* ------------------------------------------------------------ data science
     Least-squares support vector classifier with an RBF kernel. The model is
     refit every frame: solve (K + I/gamma) alpha = y, then draw f(x) = 0.
     Your pointer is one more training point, labeled as the class it is NOT
     sitting in, so the boundary has to reach around it. Click to leave it there. */
  function boundary(S) {
    var r = S.r, unit = Math.min(r.w, r.h);
    var sigma = unit * 0.26, gam = 12;
    var base = [[.22,.22,1],[.34,.12,1],[.14,.4,1],[.38,.34,1],[.27,.55,1],[.5,.2,1],
                [.78,.8,-1],[.66,.88,-1],[.86,.6,-1],[.62,.66,-1],[.73,.45,-1],[.5,.8,-1]];
    var pts = base.map(function (p) { return { x: r.x + p[0] * r.w, y: r.y + p[1] * r.h, c: p[2] }; });
    var extra = 0, ease = 0, cur = null;
    var cols = 64, rows = 40, field = new Float32Array(cols * rows), alpha = [];

    function k(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma)); }
    function solve(P, y) {
      var n = P.length, A = [], i, j, c;
      for (i = 0; i < n; i++) { A.push([]); for (j = 0; j < n; j++) A[i].push(k(P[i].x, P[i].y, P[j].x, P[j].y) + (i === j ? 1 / gam : 0)); A[i].push(y[i]); }
      for (c = 0; c < n; c++) {
        var piv = c; for (i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[piv][c])) piv = i;
        var tmp = A[c]; A[c] = A[piv]; A[piv] = tmp;
        for (i = c + 1; i < n; i++) { var m = A[i][c] / A[c][c]; for (j = c; j <= n; j++) A[i][j] -= m * A[c][j]; }
      }
      var x = new Array(n);
      for (i = n - 1; i >= 0; i--) { var s = A[i][n]; for (j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
      return x;
    }
    function f(P, a, x, y) { var s = 0; for (var i = 0; i < P.length; i++) s += a[i] * k(P[i].x, P[i].y, x, y); return s; }
    var baseAlpha = solve(pts, pts.map(function (p) { return p.c; }));

    function refit(S) {
      var P = pts.slice(), y = pts.map(function (p) { return p.c; });
      if (cur && ease > 0.01) { P.push(cur); y.push(cur.c * ease * 2.6); }   // weighted, so the boundary closes around it
      alpha = solve(P, y);
      for (var rr = 0; rr < rows; rr++) for (var cc = 0; cc < cols; cc++)
        field[rr * cols + cc] = f(P, alpha, cc * S.W / (cols - 1), rr * S.H / (rows - 1));
    }
    return {
      step: function (dt, S) {
        if (S.inside) {
          var side = f(pts, baseAlpha, S.mx, S.my) >= 0 ? 1 : -1;
          if (!cur) cur = { x: S.mx, y: S.my, c: -side };
          cur.x += (S.mx - cur.x) * Math.min(1, dt * 14 + (dt === 0 ? 1 : 0));
          cur.y += (S.my - cur.y) * Math.min(1, dt * 14 + (dt === 0 ? 1 : 0));
          cur.c = -side;
        }
        ease += ((S.inside ? 1 : 0) - ease) * Math.min(1, dt * 5 + (dt === 0 ? 1 : 0));
        refit(S);
      },
      settle: function (S) { refit(S); },
      click: function (x, y, S) {
        if (extra >= 8) { pts.splice(base.length, 1); extra--; }
        var side = f(pts, baseAlpha, x, y) >= 0 ? 1 : -1;
        pts.push({ x: x, y: y, c: -side }); extra++;
        baseAlpha = solve(pts, pts.map(function (p) { return p.c; }));
        refit(S);
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        if (!alpha.length) refit(S);
        var cw = S.W / (cols - 1), ch = S.H / (rows - 1);
        ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.strokeStyle = "rgba(" + DIM + ",0.45)";
        ctx.beginPath(); zeroContour(ctx, field, cols, rows, 0, 0, cw, ch, 0.55); zeroContour(ctx, field, cols, rows, 0, 0, cw, ch, -0.55); ctx.stroke();
        ctx.setLineDash([]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(235,243,255,0.95)"; ctx.lineJoin = "round";
        ctx.beginPath(); zeroContour(ctx, field, cols, rows, 0, 0, cw, ch, 0); ctx.stroke();
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i];
          ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 6.2832);
          if (p.c > 0) { ctx.fillStyle = "rgba(" + TEAL + ",0.95)"; ctx.fill(); }
          else { ctx.strokeStyle = "rgba(" + WARM + ",0.95)"; ctx.lineWidth = 2; ctx.stroke(); }
        }
        if (cur && ease > 0.05) {
          ctx.globalAlpha = ease;
          ctx.beginPath(); ctx.arc(cur.x, cur.y, 6, 0, 6.2832); ctx.fillStyle = "#fff"; ctx.fill();
          ctx.beginPath(); ctx.arc(cur.x, cur.y, 13, 0, 6.2832); ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1; ctx.stroke();
          ctx.globalAlpha = 1;
        }
        label(ctx, "RBF kernel classifier  |  " + (pts.length + (cur && ease > 0.05 ? 1 : 0)) + " points  |  refit every frame", S.W - 24, 34, "right");
      }
    };
  }

  /* ------------------------------------------------------------ computer vision
     A 3x3 convolution over real MNIST digits. The kernel slides across the
     input and writes one output pixel per position. Hover the input to move it. */
  var DIGITS = ["000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000017cfffffa5000000000000000000bfffffffff200000000000000000cfeb6cceff9000000000000000005930002cff600000000000000000000000dffc00000000000000000000007dfff50000000000000000000003ffff910000000000000000000000dfffed750000000000000000000007dfffff4000000000000000000000138dffc0000000000000000000000001aff6000000000000000000000001cff3000000000000000000000008ff5000000000000000000000018ffe10000000000000000000002dffd0000000000000000000000afffa00000000000000000000aafffe5000000000000000000008ffffa10000000000000000000009ffc5000000000000000000000005c70000000000000000000000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004fffffaa815300000000000000006fffffffffffc742000000000000068667ccceffffff800000000000000000000277cffff00000000000000000000000029ff80000000000000000000000002ff20000000000000000000000007ff7000000000000000000000002fff1000000000000000000000006ff8000000000000000000000002fff200000000000000000000001bff7000000000000000000000008ffd000000000000000000000005fff200000000000000000000003fff500000000000000000000001fff9000000000000000000000006ffc000000000000000000000003fff500000000000000000000000effc000000000000000000000005ffc1000000000000000000000002ec1000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000038dfffca200000000000000068ccffff94000000000000000000fffc865000000000000000000000afc00000000000000000000000001de100000000000000000000000007f300000000000000000000000007f53330000000000000000000001dfffffa50000000000000000001dfca66cdff300000000000000003fa0000017cfd200000000000000000000000006ce300000000000000000000000001de500000000000000000000000003ce700000000000000000000000001df000000000000000000000000009f00000000000000000000000002ed0000000000007500000000001af2000000000005f9000000166bed50000000000005ffe99caffffd8100000000000000499efdc98330000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"];
  var KERNELS = [
    { name: "vertical edges", k: [-1, 0, 1, -2, 0, 2, -1, 0, 1] },
    { name: "horizontal edges", k: [-1, -2, -1, 0, 0, 0, 1, 2, 1] },
    { name: "sharpen", k: [0, -1, 0, -1, 5, -1, 0, -1, 0] }
  ];
  function convolution(S) {
    var r = S.r, gap = Math.max(18, r.w * 0.06);
    var cell = Math.floor(Math.min((r.w - gap) / 54, r.h * 0.86 / 28));
    var ox = r.x + (r.w - (cell * 54 + gap)) / 2, oy = r.y + (r.h - cell * 28) / 2;
    var ox2 = ox + cell * 28 + gap + cell, oy2 = oy + cell;
    var which = 0, img = [], out = new Float32Array(26 * 26), done = 0, pos = 0, acc = 0, hold = 0;
    function load() {
      var s = DIGITS[which % DIGITS.length]; img = [];
      for (var i = 0; i < 784; i++) img.push(parseInt(s[i], 16) / 15);
      out.fill(0); done = 0; pos = 0;
    }
    function at(i) {
      var cx = i % 26, cy = (i / 26) | 0, k = KERNELS[which % KERNELS.length].k, s = 0;
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) s += k[a * 3 + b] * img[(cy + a) * 28 + cx + b];
      return s;
    }
    load();
    return {
      step: function (dt, S) {
        if (hold > 0) { hold -= dt; if (hold <= 0) { which++; load(); } return; }
        acc += dt * 170;
        while (acc >= 1 && done < 676) { out[done] = at(done); pos = done; done++; acc--; }
        if (done >= 676) hold = 1.6;
      },
      settle: function () { for (var i = 0; i < 676; i++) out[i] = at(i); done = 676; pos = 337; },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        var i, v, hx = -1, hy = -1;
        for (i = 0; i < 784; i++) {
          v = img[i];
          ctx.fillStyle = "rgba(" + INK + "," + (0.05 + v * 0.85) + ")";
          ctx.fillRect(ox + (i % 28) * cell, oy + ((i / 28) | 0) * cell, cell - 1, cell - 1);
        }
        for (i = 0; i < done; i++) {
          v = Math.max(-1, Math.min(1, out[i] / 3));
          ctx.fillStyle = v >= 0 ? "rgba(" + TEAL + "," + (0.05 + v * 0.9) + ")" : "rgba(" + WARM + "," + (0.05 - v * 0.9) + ")";
          ctx.fillRect(ox2 + (i % 26) * cell, oy2 + ((i / 26) | 0) * cell, cell - 1, cell - 1);
        }
        var kx = pos % 26, ky = (pos / 26) | 0;
        if (S.inside && S.mx > ox && S.mx < ox + 28 * cell && S.my > oy && S.my < oy + 28 * cell) {
          kx = Math.max(0, Math.min(25, ((S.mx - ox) / cell - 1) | 0)); ky = Math.max(0, Math.min(25, ((S.my - oy) / cell - 1) | 0));
          hx = kx; hy = ky;
        }
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
        ctx.strokeRect(ox + kx * cell - 1, oy + ky * cell - 1, cell * 3 + 1, cell * 3 + 1);
        ctx.strokeRect(ox2 + kx * cell - 1, oy2 + ky * cell - 1, cell + 1, cell + 1);
        ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(ox + (kx + 3) * cell, oy + (ky + 1.5) * cell); ctx.lineTo(ox2 + kx * cell, oy2 + (ky + 0.5) * cell); ctx.stroke();
        var K = KERNELS[which % KERNELS.length];
        label(ctx, "input 28 x 28", ox, oy - 10);
        label(ctx, "kernel: " + K.name + (hx >= 0 ? "  |  output " + at(hy * 26 + hx).toFixed(2) : ""), ox2, oy2 - 10);
      }
    };
  }

  /* ------------------------------------------------------------ language
     Attention drawn as arcs. Each word looks at the others and the arc
     thickness is its weight. The weights come from small fixed vectors, so
     they show the mechanism; a trained model would learn them. */
  function attention(S) {
    var words = "the model reads every word and decides which others matter".split(" ");
    var n = words.length, dim = 6, vec = [], W = [], i, j, seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; }
    for (i = 0; i < n; i++) { vec.push([]); for (j = 0; j < dim; j++) vec[i].push(rnd() * 2); }
    for (i = 0; i < n; i++) {
      var row = [], sum = 0;
      for (j = 0; j < n; j++) {
        var d = 0; for (var q = 0; q < dim; q++) d += vec[i][q] * vec[j][(q + 1) % dim];
        var e = Math.exp(d * 1.6 - Math.abs(i - j) * 0.12) * (i === j ? 0.35 : 1); row.push(e); sum += e;
      }
      W.push(row.map(function (v) { return v / sum; }));
    }
    var pos = [], active = 1, shown = W[1].slice(), clock = 0;
    function layout(ctx, S) {
      // wrap the sentence inside the visual region, bottom aligned, so the arcs have room above
      pos = []; ctx.font = "600 " + (S.W < 820 ? 16 : 21) + "px 'Libre Franklin', sans-serif";
      var r = S.r, gap = S.W < 820 ? 14 : 24, lineH = S.W < 820 ? 64 : 86;
      var widths = words.map(function (w) { return ctx.measureText(w).width; });
      var lines = [[]], used = 0;
      for (var k = 0; k < n; k++) {
        if (used + widths[k] > r.w && lines[lines.length - 1].length) { lines.push([]); used = 0; }
        lines[lines.length - 1].push(k); used += widths[k] + gap;
      }
      for (var L = 0; L < lines.length; L++) {
        var tw = -gap; lines[L].forEach(function (k) { tw += widths[k] + gap; });
        var x = r.x + (r.w - tw) / 2, y = r.y + r.h - 34 - (lines.length - 1 - L) * lineH;
        lines[L].forEach(function (k) { pos[k] = { x: x + widths[k] / 2, y: y, w: widths[k] }; x += widths[k] + gap; });
      }
    }
    return {
      step: function (dt, S) {
        clock += dt;
        if (S.inside && pos.length) {
          var best = 0, bd = 1e9;
          for (var k = 0; k < n; k++) { var dd = Math.abs(pos[k].x - S.mx) + Math.abs(pos[k].y - S.my) * 0.4; if (dd < bd) { bd = dd; best = k; } }
          active = best; clock = 0;
        } else if (clock > 1.7) { active = (active + 1) % n; clock = 0; }
        for (var m = 0; m < n; m++) shown[m] += (W[active][m] - shown[m]) * Math.min(1, dt * 7 + (dt === 0 ? 1 : 0));
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        layout(ctx, S);
        var a = pos[active];
        for (var k = 0; k < n; k++) {
          if (k === active) continue;
          var b = pos[k], w = shown[k];
          if (Math.abs(b.y - a.y) < 2) {
            var mid = (a.x + b.x) / 2, rad = Math.abs(a.x - b.x) / 2;
            ctx.beginPath(); ctx.ellipse(mid, a.y - 20, rad, Math.min(S.r.h * 0.42, rad * 0.7), 0, Math.PI, 0);
          } else { ctx.beginPath(); ctx.moveTo(a.x, a.y - 20); ctx.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 120, b.x, b.y - 20); }
          ctx.strokeStyle = "rgba(" + TEAL + "," + Math.min(0.95, 0.1 + w * 2.6) + ")"; ctx.lineWidth = 0.6 + w * 16; ctx.stroke();
        }
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        for (var t = 0; t < n; t++) {
          var p = pos[t], on = t === active;
          ctx.fillStyle = on ? "#fff" : "rgba(" + INK + "," + (0.45 + Math.min(0.5, shown[t] * 2.4)) + ")";
          ctx.fillText(words[t], p.x, p.y);
          if (!on) { ctx.font = "11px ui-monospace, Consolas, monospace"; ctx.fillStyle = "rgba(" + DIM + ",0.9)"; ctx.fillText(shown[t].toFixed(2), p.x, p.y + 20); ctx.font = "600 " + (S.W < 820 ? 16 : 21) + "px 'Libre Franklin', sans-serif"; }
        }
        ctx.textBaseline = "alphabetic";
      }
    };
  }

  /* ------------------------------------------------------------ neural networks
     Gradient descent with momentum on a two-dimensional loss surface made of
     Gaussian wells. Contours by marching squares. Click to start somewhere else. */
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
    for (var L = 1; L < 24; L++) {
      b.beginPath(); zeroContour(b, field, cols, rows, 0, 0, S.W / (cols - 1), S.H / (rows - 1), lo + (hi - lo) * L / 24);
      b.strokeStyle = L < 8 ? "rgba(" + INK + ",0.32)" : "rgba(" + DIM + ",0.2)"; b.lineWidth = 1; b.stroke();
    }
    var p, vel, n, path, acc = 0;
    function restart(at) { var a = Math.random() * 6.28, rad = 2.2 + Math.random() * .8; p = at || [Math.cos(a) * rad * 1.25, Math.sin(a) * rad * .78]; vel = [0, 0]; n = 0; path = [p.slice()]; }
    function one() { var g = grad(p[0], p[1]); vel[0] = MU * vel[0] - LR * g[0]; vel[1] = MU * vel[1] - LR * g[1]; p[0] += vel[0]; p[1] += vel[1]; n++; path.push(p.slice()); }
    restart();
    return {
      step: function (dt) {
        acc += dt * 24;
        while (acc >= 1) { acc--; one(); var g = grad(p[0], p[1]); if (n > 260 || (n > 45 && Math.hypot(g[0], g[1]) < .004 && Math.hypot(vel[0], vel[1]) < .004)) restart(); }
      },
      settle: function () { for (var i = 0; i < 160; i++) one(); },
      click: function (x, y, S) { restart([x / S.W * 2 * xr - xr, yr - y / S.H * 2 * yr]); },
      draw: function (ctx, S) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.drawImage(back, 0, 0); ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
        ctx.beginPath(); for (var i = 0; i < path.length; i++) { var q = px(path[i][0], path[i][1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
        ctx.strokeStyle = "rgba(" + WARM + ",0.9)"; ctx.lineWidth = 1.8; ctx.lineJoin = "round"; ctx.stroke();
        var h = px(p[0], p[1]); ctx.beginPath(); ctx.arc(h[0], h[1], 5, 0, 6.2832); ctx.fillStyle = "#fff"; ctx.fill();
        label(ctx, "step " + ("00" + n).slice(-3) + "  |  loss " + loss(p[0], p[1]).toFixed(4) + "  |  lr " + LR + "  momentum " + MU, S.W - 24, 34, "right");
      }
    };
  }

  /* ------------------------------------------------------------ agents
     Tabular Q-learning. The agent wanders a gridworld, earns a reward at the
     goal, and the arrows show the best action it has learned for each cell.
     Click a cell to move the goal and watch the policy relearn. */
  function gridworld(S) {
    var r = S.r, cols = S.W < 820 ? 9 : 12, rows = 8;
    var cell = Math.floor(Math.min(r.w / cols, r.h / rows));
    var ox = r.x + (r.w - cell * cols) / 2, oy = r.y + (r.h - cell * rows) / 2;
    var walls = {}, seed = 11, i;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < cols * rows * 0.16; i++) walls[(rnd() * cols * rows) | 0] = 1;
    var goal = cols * 2 - 2, start = cols * (rows - 1); delete walls[goal]; delete walls[start];
    var Q = new Float32Array(cols * rows * 4), s = start, episodes = 0, steps = 0, acc = 0, eps = 0.25;
    var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    function best(st) { var b = 0; for (var a = 1; a < 4; a++) if (Q[st * 4 + a] > Q[st * 4 + b]) b = a; return b; }
    function move() {
      var a = Math.random() < eps ? (Math.random() * 4) | 0 : best(s);
      var x = s % cols + DX[a], y = ((s / cols) | 0) + DY[a], ns = s, rew = -0.02;
      if (x >= 0 && x < cols && y >= 0 && y < rows && !walls[y * cols + x]) ns = y * cols + x; else rew = -0.2;
      if (ns === goal) rew = 1;
      var target = rew + (ns === goal ? 0 : 0.93 * Q[ns * 4 + best(ns)]);
      Q[s * 4 + a] += 0.35 * (target - Q[s * 4 + a]);
      s = ns; steps++;
      if (s === goal || steps > 160) { s = start; steps = 0; episodes++; }
    }
    return {
      step: function (dt) { acc += dt * 90; while (acc >= 1) { acc--; move(); } },
      settle: function () { for (var k = 0; k < 9000; k++) move(); },
      click: function (x, y) {
        var cx = ((x - ox) / cell) | 0, cy = ((y - oy) / cell) | 0;
        if (cx < 0 || cy < 0 || cx >= cols || cy >= rows || walls[cy * cols + cx] || cy * cols + cx === start) return;
        goal = cy * cols + cx; Q.fill(0); episodes = 0; s = start; steps = 0;
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        for (var c = 0; c < cols * rows; c++) {
          var x = ox + (c % cols) * cell, y = oy + ((c / cols) | 0) * cell, b = best(c), v = Math.max(0, Math.min(1, Q[c * 4 + b]));
          if (walls[c]) { ctx.fillStyle = "rgba(" + DIM + ",0.28)"; ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4); continue; }
          ctx.fillStyle = "rgba(" + TEAL + "," + (0.03 + v * 0.5) + ")"; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          if (c === goal) { ctx.fillStyle = "rgba(" + WARM + ",0.95)"; ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, cell * 0.22, 0, 6.2832); ctx.fill(); continue; }
          if (Q[c * 4 + b] > 0.01) {
            var mx = x + cell / 2, my = y + cell / 2, L = cell * 0.24;
            ctx.strokeStyle = "rgba(235,243,255," + (0.3 + v * 0.6) + ")"; ctx.lineWidth = 1.4; ctx.beginPath();
            ctx.moveTo(mx - DX[b] * L, my - DY[b] * L); ctx.lineTo(mx + DX[b] * L, my + DY[b] * L);
            ctx.lineTo(mx + DX[b] * L - (DX[b] - DY[b]) * L * 0.5, my + DY[b] * L - (DY[b] + DX[b]) * L * 0.5);
            ctx.moveTo(mx + DX[b] * L, my + DY[b] * L);
            ctx.lineTo(mx + DX[b] * L - (DX[b] + DY[b]) * L * 0.5, my + DY[b] * L - (DY[b] - DX[b]) * L * 0.5); ctx.stroke();
          }
        }
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ox + (s % cols + 0.5) * cell, oy + (((s / cols) | 0) + 0.5) * cell, cell * 0.17, 0, 6.2832); ctx.fill();
        label(ctx, "Q-learning  |  episode " + episodes + "  |  explore " + eps, ox + cell * cols, oy - 12, "right");
      }
    };
  }

  /* ------------------------------------------------------------ ethics
     One approval threshold, two groups whose scores are distributed differently.
     Move the threshold with your pointer and compare the two approval rates. */
  function threshold(S) {
    var r = S.r, seed = 5, people = [], i;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function gauss() { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.2832 * rnd()); }
    for (i = 0; i < 140; i++) { var g = i % 2; people.push({ g: g, s: Math.max(0.02, Math.min(0.98, (g ? 0.44 : 0.58) + gauss() * 0.15)), j: rnd() }); }
    var th = 0.55;
    return {
      step: function (dt, S) {
        var want = S.inside ? Math.max(0.05, Math.min(0.95, (S.mx - r.x) / r.w)) : 0.52 + Math.sin(S.t * 0.5) * 0.2;
        th += (want - th) * Math.min(1, dt * 8 + (dt === 0 ? 1 : 0));
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        var bandH = r.h * 0.34, tops = [r.y + r.h * 0.08, r.y + r.h * 0.56], ok = [0, 0], tot = [0, 0];
        for (var k = 0; k < people.length; k++) {
          var p = people[k], x = r.x + p.s * r.w, y = tops[p.g] + p.j * bandH, pass = p.s >= th;
          tot[p.g]++; if (pass) ok[p.g]++;
          ctx.beginPath(); ctx.arc(x, y, 4.2, 0, 6.2832);
          var col = p.g ? WARM : TEAL;
          if (pass) { ctx.fillStyle = "rgba(" + col + ",0.95)"; ctx.fill(); } else { ctx.strokeStyle = "rgba(" + col + ",0.5)"; ctx.lineWidth = 1.3; ctx.stroke(); }
        }
        var tx = r.x + th * r.w;
        ctx.strokeStyle = "rgba(235,243,255,0.95)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, r.y - 6); ctx.lineTo(tx, r.y + r.h + 6); ctx.stroke();
        label(ctx, "group A approved " + Math.round(100 * ok[0] / tot[0]) + "%", r.x, tops[0] - 10);
        label(ctx, "group B approved " + Math.round(100 * ok[1] / tot[1]) + "%", r.x, tops[1] - 10);
        label(ctx, "threshold " + th.toFixed(2), tx + 8, r.y + r.h + 4);
      }
    };
  }

  var SCENES = { "data-science": boundary, vision: convolution, nlp: attention, "neural-networks": descent, agents: gridworld, society: threshold };

  document.addEventListener("DOMContentLoaded", function () {
    var host = document.querySelector("[data-grouphero]");
    if (!host) return;
    var make = SCENES[host.getAttribute("data-grouphero")];
    if (make) mount(host, make);
  });
})();
