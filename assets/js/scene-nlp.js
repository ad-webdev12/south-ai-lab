/* South Artificial Intelligence Laboratory: the Language hero.
   One idea: words arranged by meaning. Twenty thousand English words sit on one plane,
   placed by a real embedding (GloVe, 50 dimensions, trained on Wikipedia and news), so
   words used in similar ways end up near each other. The plane is far bigger than the
   screen: drag to move through it, scroll to zoom, click any word, or search for one.
   Nearest words are the highest cosine similarity in the 50-d vectors, computed here.
   Files: assets/data/words.txt, words-xy.bin (int16 x,y), words-vec.bin (int8 x 50). */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL) return;
  var TEAL = SAIL.TEAL, DIM = SAIL.DIM;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var DATA = null, loading = null;
  function load() {
    if (loading) return loading;
    loading = Promise.all([fetch("assets/data/words.txt").then(function (r) { return r.text(); }), fetch("assets/data/words-xy.bin").then(function (r) { return r.arrayBuffer(); }), fetch("assets/data/words-vec.bin").then(function (r) { return r.arrayBuffer(); })])
      .then(function (r) { var words = r[0].split("\n"), xy = new Int16Array(r[1]), vec = new Int8Array(r[2]), index = {}; words.forEach(function (w, i) { index[w] = i; }); DATA = { words: words, xy: xy, vec: vec, index: index, n: words.length }; return DATA; });
    return loading;
  }
  function nearest(i, k) {
    var D = DATA, v = D.vec, n = D.n, best = [], base = i * 50;
    for (var j = 0; j < n; j++) { if (j === i) continue; var s = 0, o = j * 50; for (var d = 0; d < 50; d++) s += v[base + d] * v[o + d]; if (best.length < k || s > best[best.length - 1].s) { best.push({ i: j, s: s }); best.sort(function (a, b) { return b.s - a.s; }); if (best.length > k) best.pop(); } }
    return best.map(function (b) { return { i: b.i, s: b.s / 16129 }; });
  }

  SAIL.scenes.nlp = function (S, root) {
    var wide = S.W >= 980, input = root.querySelector('[data-act="word"]'), status = root.querySelector("[data-status]"), stat = root.querySelector("[data-selected]");
    var cam = { x: 0, y: 0, z: wide ? 0.42 : 0.6, tx: 0, ty: 0, tz: wide ? 0.42 : 0.6 }, sel = -1, near = [], hover = -1, clock = 0, drag = null, moved = 0;
    var textArea = wide ? { x0: 0, x1: S.W * 0.4, y0: 0, y1: S.H * 0.75 } : { x0: 0, x1: S.W, y0: 0, y1: S.H * 0.55 };     // where the page text sits; words there are drawn faint
    var focusX = wide ? S.W * 0.66 : S.W * 0.5, focusY = wide ? S.H * 0.45 : S.H * 0.7;                                     // where a chosen word is brought to
    var grid = null, GC = 220;
    function note(t) { if (status) status.textContent = t; }
    function bucket() { grid = {}; var D = DATA; for (var i = 0; i < D.n; i++) { var k = Math.floor(D.xy[i * 2] / GC) + "," + Math.floor(D.xy[i * 2 + 1] / GC); (grid[k] || (grid[k] = [])).push(i); } }
    function toScreen(i) { var D = DATA; return { x: focusX + (D.xy[i * 2] - cam.x) * cam.z, y: focusY + (D.xy[i * 2 + 1] - cam.y) * cam.z }; }
    function choose(i, fly) {
      if (i < 0 || !DATA) return; sel = i; near = nearest(i, 8); var D = DATA;
      if (fly !== false) { cam.tx = D.xy[i * 2]; cam.ty = D.xy[i * 2 + 1]; cam.tz = Math.max(cam.tz, wide ? 0.9 : 1.1); }
      if (input && document.activeElement !== input) input.value = D.words[i];
      if (stat) stat.innerHTML = "<b>" + D.words[i] + "</b> " + near.slice(0, 6).map(function (n) { return D.words[n.i]; }).join(" · ");
      note("");
    }
    if (!DATA) note("Loading twenty thousand words…");
    load().then(function () { bucket(); note(""); if (sel < 0) choose(DATA.index.camera !== undefined ? DATA.index.camera : 100); }, function () { note("The word data could not load."); });
    if (DATA) { bucket(); choose(sel >= 0 ? sel : (DATA.index.camera || 100), false); }

    function pointer(ev) { var r = root.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
    function inText(p) { return p.x > textArea.x0 && p.x < textArea.x1 && p.y > textArea.y0 && p.y < textArea.y1; }
    if (!root.__nlpWired) {
      root.__nlpWired = true;
      root.addEventListener("pointerdown", function (ev) { if (ev.target.closest("a,button,input,label,.ghero-bar")) return; var p = pointer(ev); if (inText(p) && ev.pointerType !== "touch") return; drag = { x: p.x, y: p.y, cx: cam.tx, cy: cam.ty, id: ev.pointerId }; moved = 0; if (root.setPointerCapture) root.setPointerCapture(ev.pointerId); });
      root.addEventListener("pointermove", function (ev) { if (!drag || ev.pointerId !== drag.id) return; var p = pointer(ev); moved += Math.abs(p.x - drag.x) + Math.abs(p.y - drag.y); cam.tx = drag.cx - (p.x - drag.x) / cam.z; cam.ty = drag.cy - (p.y - drag.y) / cam.z; cam.x = cam.tx; cam.y = cam.ty; drag.x = p.x; drag.y = p.y; drag.cx = cam.tx; drag.cy = cam.ty; });
      root.addEventListener("pointerup", function () { drag = null; });
      root.addEventListener("pointercancel", function () { drag = null; });
      root.addEventListener("wheel", function (ev) { if (ev.target.closest(".ghero-bar")) return; var p = pointer(ev); if (inText(p)) return; ev.preventDefault(); var f = Math.exp(-ev.deltaY * 0.0012), nz = clamp(cam.tz * f, 0.12, 3.2), wx = cam.tx + (p.x - focusX) / cam.tz, wy = cam.ty + (p.y - focusY) / cam.tz; cam.tx = wx - (p.x - focusX) / nz; cam.ty = wy - (p.y - focusY) / nz; cam.tz = nz; }, { passive: false });
    }

    function visible() {           // words on screen, with the densest spots thinned by frequency rank at low zoom
      var D = DATA, out = [], x0 = cam.x - focusX / cam.z, x1 = cam.x + (S.W - focusX) / cam.z, y0 = cam.y - focusY / cam.z, y1 = cam.y + (S.H - focusY) / cam.z;
      var budget = cam.z < 0.25 ? 2 : cam.z < 0.5 ? 6 : cam.z < 0.9 ? 16 : cam.z < 1.6 ? 40 : 200;
      for (var gx = Math.floor(x0 / GC); gx <= Math.floor(x1 / GC); gx++) for (var gy = Math.floor(y0 / GC); gy <= Math.floor(y1 / GC); gy++) {
        var cellWords = grid[gx + "," + gy]; if (!cellWords) continue;
        for (var k = 0; k < cellWords.length && k < budget; k++) out.push(cellWords[k]);      // the bucket is in frequency order already
      }
      if (sel >= 0) { if (out.indexOf(sel) < 0) out.push(sel); near.forEach(function (n) { if (out.indexOf(n.i) < 0) out.push(n.i); }); }
      return out;
    }

    return {
      step: function (dt, S) {
        clock += dt; var k = Math.min(1, dt * 4); cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k; cam.z += (cam.tz - cam.z) * k;
        hover = -1; if (DATA && grid && S.inside && !drag) { var best = 22 * Math.max(0.6, Math.min(1.4, cam.z)); visible().forEach(function (i) { var p = toScreen(i); var d = Math.hypot(S.mx - p.x, S.my - p.y); if (d < best && !inText(p)) { best = d; hover = i; } }); }
        root.style.cursor = drag ? "grabbing" : hover >= 0 ? "pointer" : "grab";
      },
      settle: function () { cam.x = cam.tx; cam.y = cam.ty; cam.z = cam.tz; },
      click: function () { if (moved > 6) return; if (hover >= 0) choose(hover); },
      act: function (name, value) {
        if (!DATA) return;
        if (name === "shuffle") { var pool = Math.min(4000, DATA.n); choose((Math.random() * pool) | 0); }
        else if (name === "word") { var q = String(value || "").trim().toLowerCase(); if (!q) return; var i = DATA.index[q]; if (i === undefined) { for (var j = 0; j < DATA.n; j++) if (DATA.words[j].indexOf(q) === 0) { i = j; break; } } if (i !== undefined) choose(i); else note("“" + q + "” is not among the twenty thousand words here."); }
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        if (!DATA || !grid) return;
        var list = visible(), D = DATA, nearSet = {}; near.forEach(function (n) { nearSet[n.i] = n.s; });
        // a faint grid so the plane reads as a surface, then the words
        var step = GC * cam.z; if (step > 26) { ctx.strokeStyle = "rgba(" + DIM + ",.08)"; ctx.lineWidth = 1; var ox = ((focusX - cam.x * cam.z) % step + step) % step, oy = ((focusY - cam.y * cam.z) % step + step) % step; ctx.beginPath(); for (var x = ox; x < S.W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, S.H); } for (var y = oy; y < S.H; y += step) { ctx.moveTo(0, y); ctx.lineTo(S.W, y); } ctx.stroke(); }
        if (sel >= 0) { var sp = toScreen(sel); near.forEach(function (n) { var p = toScreen(n.i); ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(p.x, p.y); SAIL.glow(ctx, TEAL, 0.6 + n.s * 1.6, 0.2 + n.s * 0.7); }); }
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        list.forEach(function (i) {
          var p = toScreen(i); if (p.x < -60 || p.x > S.W + 60 || p.y < -20 || p.y > S.H + 20) return;
          var on = i === sel, nr = nearSet[i] !== undefined, rank = 1 - i / D.n, base = (wide ? 12 : 11) * clamp(0.55 + Math.sqrt(cam.z) * 0.6, 0.6, 1.6) * (0.85 + rank * 0.35);
          var size = on ? base * 1.9 : nr ? base * 1.3 : i === hover ? base * 1.2 : base, a = on ? 1 : nr ? 0.95 : sel >= 0 ? 0.28 + rank * 0.22 : 0.5 + rank * 0.35;
          if (inText(p) && !on && !nr) a *= 0.25;
          if (on || i === hover) SAIL.dot(ctx, p.x, p.y, size * 0.55, TEAL, on ? 0.5 : 0.3);
          ctx.font = (on ? "800 " : nr ? "600 " : "500 ") + size.toFixed(1) + "px 'Libre Franklin', sans-serif";
          ctx.fillStyle = on ? "#fff" : nr ? "rgba(190,245,238," + a.toFixed(2) + ")" : "rgba(200,216,238," + a.toFixed(2) + ")"; ctx.fillText(D.words[i], p.x, p.y);
          if (nr && cam.z > 0.7) { ctx.font = "500 10px ui-monospace, Consolas, monospace"; ctx.fillStyle = "rgba(" + TEAL + ",.8)"; ctx.fillText(nearSet[i].toFixed(2), p.x, p.y + size * 0.85); }
        });
      }
    };
  };
})();
