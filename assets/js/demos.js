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
    function isControl(ev) { return !!ev.target.closest("a,button,input,select,label,summary,textarea,.ghero-bar,.ghero-ui > *"); }

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
    root.__kick = function () { last = 0; window.requestAnimationFrame(frame); };      // restarts the loop if a browser never delivered the first frame
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
          var ramp = Math.min(4, t.b.length / 4), lock = Math.min(1, age / ramp), a = Math.min(lock, left / ramp + 0.001, 1), grow = 1 + (1 - lock) * (1 - lock) * 0.4;
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

  // The language, agents and ethics heroes share one robot character and live in their own files
  // (bot.js, scene-agents.js, scene-nlp.js, scene-ethics.js). They register themselves here.
  var SCENES = { "data-science": boundary, vision: detection, "neural-networks": descent };
  window.SAIL = { INK: INK, DIM: DIM, TEAL: TEAL, WARM: WARM, dot: dot, glow: glow, caption: caption, region: region, scenes: SCENES };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-demo]").forEach(function (root) {
      var make = SCENES[root.getAttribute("data-demo")];
      if (make) mount(root, make);
    });
  });
})();
