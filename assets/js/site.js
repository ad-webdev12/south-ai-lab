/* South Artificial Intelligence Laboratory
   1. mobile navigation
   2. application form handoff
   3. hero visual: gradient descent with momentum on a real 2D loss surface.
      Contours are computed with marching squares, the optimizer runs the
      actual update rule, and the numbers in the corner are the live values. */

(function () {
  "use strict";

  var LAB_EMAIL = "southailab@gmail.com";

  /* ---------------- 1. navigation ---------------- */
  function nav() {
    var toggle = document.querySelector("[data-navtoggle]");
    var drawer = document.querySelector("[data-drawer]");
    if (!toggle || !drawer) return;
    toggle.addEventListener("click", function () {
      var open = drawer.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------------- 2. application form ---------------- */
  function applyForm() {
    var form = document.querySelector("[data-apply]");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var d = new FormData(form);
      var v = function (k) { return (d.get(k) || "").toString().trim(); };
      var body = [
        "Name: " + v("name"),
        "School email: " + v("email"),
        "Graduating class: " + v("grade"),
        "Track: " + v("track"),
        "Research group: " + v("group"),
        "Prior experience: " + v("experience"),
        "",
        "Interest:",
        v("statement"),
        "",
        "Can attend meetings: " + (d.get("commit") ? "yes" : "not stated")
      ].join("\n");
      var href = "mailto:" + LAB_EMAIL +
        "?subject=" + encodeURIComponent("SAIL application: " + v("name")) +
        "&body=" + encodeURIComponent(body);
      var status = form.querySelector(".fstatus");
      if (status) {
        status.classList.add("show");
        status.innerHTML = "Your mail program should have opened with the application filled in. " +
          "If it did not, send the same information to <strong>" + LAB_EMAIL + "</strong>.";
      }
      window.location.href = href;
    });
  }

  /* ---------------- 3. hero: gradient descent ---------------- */

  // f(x,y) = 0.16(x^2+y^2) - sum_i A_i exp(-((x-cx)^2+(y-cy)^2)/(2 s^2))
  var WELLS = [
    { x: -1.55, y: 0.72, a: 2.40, s: 0.86 },
    { x: 1.72, y: -0.62, a: 3.10, s: 0.98 },
    { x: 0.30, y: 1.42, a: 1.70, s: 0.66 },
    { x: -2.15, y: -1.25, a: 2.05, s: 0.80 },
    { x: 2.35, y: 1.38, a: 1.55, s: 0.72 },
    { x: -0.25, y: -1.55, a: 1.35, s: 0.60 }
  ];

  function loss(x, y) {
    var f = 0.065 * (x * x + y * y);
    for (var i = 0; i < WELLS.length; i++) {
      var w = WELLS[i], dx = x - w.x, dy = y - w.y;
      f -= w.a * Math.exp(-(dx * dx + dy * dy) / (2 * w.s * w.s));
    }
    return f;
  }

  function grad(x, y) {
    var gx = 0.13 * x, gy = 0.13 * y;
    for (var i = 0; i < WELLS.length; i++) {
      var w = WELLS[i], dx = x - w.x, dy = y - w.y;
      var e = w.a * Math.exp(-(dx * dx + dy * dy) / (2 * w.s * w.s)) / (w.s * w.s);
      gx += e * dx;
      gy += e * dy;
    }
    return [gx, gy];
  }

  // marching squares on a sampled grid, one level at a time
  function contour(level, grid, cols, rows, x0, y0, dx, dy) {
    var segs = [];
    function ip(a, b, va, vb) {
      var t = (level - va) / (vb - va);
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    for (var r = 0; r < rows - 1; r++) {
      for (var c = 0; c < cols - 1; c++) {
        var v0 = grid[r * cols + c];
        var v1 = grid[r * cols + c + 1];
        var v2 = grid[(r + 1) * cols + c + 1];
        var v3 = grid[(r + 1) * cols + c];
        var p0 = [x0 + c * dx, y0 + r * dy];
        var p1 = [x0 + (c + 1) * dx, y0 + r * dy];
        var p2 = [x0 + (c + 1) * dx, y0 + (r + 1) * dy];
        var p3 = [x0 + c * dx, y0 + (r + 1) * dy];
        var idx = (v0 > level ? 1 : 0) | (v1 > level ? 2 : 0) | (v2 > level ? 4 : 0) | (v3 > level ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        var top = ip(p0, p1, v0, v1);
        var right = ip(p1, p2, v1, v2);
        var bottom = ip(p3, p2, v3, v2);
        var left = ip(p0, p3, v0, v3);
        switch (idx) {
          case 1: case 14: segs.push([left, top]); break;
          case 2: case 13: segs.push([top, right]); break;
          case 3: case 12: segs.push([left, right]); break;
          case 4: case 11: segs.push([right, bottom]); break;
          case 6: case 9: segs.push([top, bottom]); break;
          case 7: case 8: segs.push([left, bottom]); break;
          case 5: segs.push([left, top]); segs.push([right, bottom]); break;
          case 10: segs.push([top, right]); segs.push([left, bottom]); break;
        }
      }
    }
    return segs;
  }

  function hero() {
    var canvas = document.querySelector("[data-surface]");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var spark = document.querySelector("[data-spark]");
    var sctx = spark && spark.getContext ? spark.getContext("2d") : null;
    var out = {
      step: document.querySelector("[data-out-step]"),
      loss: document.querySelector("[data-out-loss]"),
      lr: document.querySelector("[data-out-lr]"),
      mu: document.querySelector("[data-out-mu]")
    };
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var LR = 0.042, MU = 0.88, MAX_STEPS = 260;
    var W = 0, H = 0, dpr = 1;
    var back = document.createElement("canvas");
    var bctx = back.getContext("2d");
    var view = { xmin: -3.9, xmax: 3.9, ymin: -2.4, ymax: 2.4 };
    var p, v, step, history, paused = false, raf = null;

    function toPx(x, y) {
      return [
        ((x - view.xmin) / (view.xmax - view.xmin)) * W,
        ((view.ymax - y) / (view.ymax - view.ymin)) * H
      ];
    }
    function toWorld(px, py) {
      return [
        view.xmin + (px / W) * (view.xmax - view.xmin),
        view.ymax - (py / H) * (view.ymax - view.ymin)
      ];
    }

    function drawSurface() {
      var cols = 150, rows = Math.max(40, Math.round(cols * (H / W)));
      var dx = (view.xmax - view.xmin) / (cols - 1);
      var dy = (view.ymax - view.ymin) / (rows - 1);
      var grid = new Float64Array(cols * rows);
      var min = Infinity, max = -Infinity;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var val = loss(view.xmin + c * dx, view.ymax - r * dy);
          grid[r * cols + c] = val;
          if (val < min) min = val;
          if (val > max) max = val;
        }
      }
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.clearRect(0, 0, back.width, back.height);
      bctx.scale(dpr, dpr);
      bctx.fillStyle = "#091728";
      bctx.fillRect(0, 0, W, H);
      var pxw = W / (cols - 1), pxh = H / (rows - 1);
      var levels = 26;
      for (var i = 1; i < levels; i++) {
        var lv = min + (max - min) * (i / levels);
        var segs = contour(lv, grid, cols, rows, 0, 0, pxw, pxh);
        var deep = i / levels < 0.32;
        bctx.strokeStyle = deep ? "rgba(126,170,224,0.30)" : "rgba(100,137,186,0.14)";
        bctx.lineWidth = deep ? 1.1 : 0.9;
        bctx.beginPath();
        for (var s = 0; s < segs.length; s++) {
          bctx.moveTo(segs[s][0][0], segs[s][0][1]);
          bctx.lineTo(segs[s][1][0], segs[s][1][1]);
        }
        bctx.stroke();
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      back.width = canvas.width;
      back.height = canvas.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var aspect = W / H;
      var yr = 2.55;
      view.ymin = -yr; view.ymax = yr;
      view.xmin = -yr * aspect; view.xmax = yr * aspect;
      drawSurface();
      render();
    }

    function restart(at) {
      if (!at) {
        // start on a ring, so the path has to cross the field to reach a minimum
        var ang = Math.random() * 6.2832;
        var rad = 2.2 + Math.random() * 0.9;
        at = [Math.cos(ang) * rad * 1.25, Math.sin(ang) * rad * 0.78];
      }
      p = at;
      v = [0, 0];
      step = 0;
      history = [p.slice()];
    }

    function update() {
      var g = grad(p[0], p[1]);
      v[0] = MU * v[0] - LR * g[0];
      v[1] = MU * v[1] - LR * g[1];
      p[0] += v[0];
      p[1] += v[1];
      p[0] = Math.max(view.xmin, Math.min(view.xmax, p[0]));
      p[1] = Math.max(view.ymin, Math.min(view.ymax, p[1]));
      step++;
      history.push(p.slice());
      if (history.length > 320) history.shift();
    }

    function render() {
      if (!W) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(back, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // path
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "rgba(196,219,247,0.55)";
      ctx.beginPath();
      for (var i = 0; i < history.length; i++) {
        var pt = toPx(history[i][0], history[i][1]);
        if (i === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]);
      }
      ctx.stroke();

      // every tenth iterate
      ctx.fillStyle = "rgba(160,196,236,0.55)";
      for (var j = 0; j < history.length; j += 10) {
        var q = toPx(history[j][0], history[j][1]);
        ctx.beginPath();
        ctx.arc(q[0], q[1], 1.7, 0, 6.2832);
        ctx.fill();
      }

      // current iterate
      var c = toPx(p[0], p[1]);
      ctx.beginPath();
      ctx.arc(c[0], c[1], 5.2, 0, 6.2832);
      ctx.fillStyle = "#e3edfa";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c[0], c[1], 10.5, 0, 6.2832);
      ctx.strokeStyle = "rgba(227,237,250,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // start marker
      if (history.length) {
        var s0 = toPx(history[0][0], history[0][1]);
        ctx.strokeStyle = "rgba(180,83,42,0.85)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(s0[0] - 4, s0[1]); ctx.lineTo(s0[0] + 4, s0[1]);
        ctx.moveTo(s0[0], s0[1] - 4); ctx.lineTo(s0[0], s0[1] + 4);
        ctx.stroke();
      }

      readout();
      sparkline();
    }

    function readout() {
      if (out.step) out.step.textContent = String(step).padStart(3, "0");
      if (out.loss) out.loss.textContent = loss(p[0], p[1]).toFixed(4);
      if (out.lr) out.lr.textContent = LR.toFixed(3);
      if (out.mu) out.mu.textContent = MU.toFixed(2);
    }

    function sparkline() {
      if (!sctx) return;
      var rect = spark.getBoundingClientRect();
      if (!rect.width) return;
      if (spark.width !== Math.round(rect.width * dpr)) {
        spark.width = Math.round(rect.width * dpr);
        spark.height = Math.round(rect.height * dpr);
      }
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.clearRect(0, 0, rect.width, rect.height);
      var n = history.length;
      if (n < 2) return;
      var lo = Infinity, hi = -Infinity, vals = [];
      for (var i = 0; i < n; i++) {
        var L = loss(history[i][0], history[i][1]);
        vals.push(L);
        if (L < lo) lo = L;
        if (L > hi) hi = L;
      }
      if (hi - lo < 1e-6) hi = lo + 1;
      sctx.strokeStyle = "rgba(143,176,216,0.85)";
      sctx.lineWidth = 1.1;
      sctx.beginPath();
      for (var k = 0; k < n; k++) {
        var x = (k / (n - 1)) * rect.width;
        var y = rect.height - ((vals[k] - lo) / (hi - lo)) * (rect.height - 3) - 1.5;
        if (k === 0) sctx.moveTo(x, y); else sctx.lineTo(x, y);
      }
      sctx.stroke();
    }

    // steps advance on elapsed time, so the animation runs at the same speed
    // whether the browser gives us 60 frames a second or 5
    var STEPS_PER_SEC = 24, last = 0, carry = 0;

    function tick(ts) {
      if (!last) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.3);
      last = ts;
      if (!paused) {
        carry += dt * STEPS_PER_SEC;
        var n = Math.min(Math.floor(carry), 12);
        carry -= Math.floor(carry);
        for (var i = 0; i < n; i++) {
          update();
          var g = grad(p[0], p[1]);
          var settled = Math.hypot(g[0], g[1]) < 0.004 && Math.hypot(v[0], v[1]) < 0.004;
          if (step > MAX_STEPS || (settled && step > 45)) { restart(); break; }
        }
        if (n) render();
      } else {
        last = 0;
      }
      raf = window.requestAnimationFrame(tick);
    }

    restart();
    resize();
    window.addEventListener("resize", function () {
      window.clearTimeout(resize._t);
      resize._t = window.setTimeout(resize, 180);
    });

    canvas.addEventListener("click", function (ev) {
      var rect = canvas.getBoundingClientRect();
      restart(toWorld(ev.clientX - rect.left, ev.clientY - rect.top));
      if (reduced) { for (var i = 0; i < 160; i++) update(); render(); }
    });

    var replay = document.querySelector("[data-replay]");
    if (replay) {
      replay.addEventListener("click", function () {
        restart();
        if (reduced) { for (var i = 0; i < 160; i++) update(); render(); }
      });
    }

    if (reduced) {
      for (var i = 0; i < 160; i++) update();
      render();
      return;
    }

    document.addEventListener("visibilitychange", function () {
      paused = document.hidden;
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        paused = !entries[0].isIntersecting || document.hidden;
      }, { threshold: 0 }).observe(canvas);
    }
    raf = window.requestAnimationFrame(tick);
  }

  document.addEventListener("DOMContentLoaded", function () {
    nav();
    applyForm();
    hero();
    document.querySelectorAll("[data-email]").forEach(function (el) {
      el.textContent = LAB_EMAIL;
      if (el.tagName === "A") el.setAttribute("href", "mailto:" + LAB_EMAIL);
    });
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  });
})();
