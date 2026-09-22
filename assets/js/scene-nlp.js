/* South Artificial Intelligence Laboratory: the Language hero.
   A map of meaning. Twenty thousand English words sit on one plane, placed by a real
   embedding (GloVe, 50 dimensions), so words used in similar ways are near each other.
   Only a restrained field is drawn: about a hundred words at a time, thinned by
   frequency and by collision, each cluster with one brighter anchor. Choose a word and
   its nearest neighbours glide into an orbit around it. The map never draws under the
   title column, the header, the panel or the search control: those are masked regions.
   Data: assets/data/words.txt, words-xy.bin (int16 x,y), words-vec.bin (int8 x 50). */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL) return;
  var TEAL = SAIL.TEAL;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var DATA = null, loading = null, nearCache = {};
  function load() {
    if (loading) return loading;
    loading = Promise.all([fetch("assets/data/words.txt").then(function (r) { return r.text(); }), fetch("assets/data/words-xy.bin").then(function (r) { return r.arrayBuffer(); }), fetch("assets/data/words-vec.bin").then(function (r) { return r.arrayBuffer(); })])
      .then(function (r) { var words = r[0].split("\n"), xy = new Int16Array(r[1]), vec = new Int8Array(r[2]), index = {}; words.forEach(function (w, i) { index[w] = i; }); DATA = { words: words, xy: xy, vec: vec, index: index, n: words.length }; return DATA; });
    return loading;
  }
  function nearest(i, k) {
    if (nearCache[i]) return nearCache[i].slice(0, k);
    var D = DATA, v = D.vec, n = D.n, best = [], base = i * 50;
    for (var j = 0; j < n; j++) { if (j === i) continue; var s = 0, o = j * 50; for (var d = 0; d < 50; d++) s += v[base + d] * v[o + d]; if (best.length < 12 || s > best[best.length - 1].s) { best.push({ i: j, s: s / 16129 }); best.sort(function (a, b) { return b.s - a.s; }); if (best.length > 12) best.pop(); } }
    nearCache[i] = best; return best.slice(0, k);
  }

  SAIL.scenes.nlp = function (S, root) {
    var wide = S.W >= 980, input = root.querySelector('[data-act="word"]'), status = root.querySelector("[data-status]"), stat = root.querySelector("[data-selected]"), clearBtn = root.querySelector('[data-act="clear"]');
    var masks = [], focusX = wide ? S.W * 0.7 : S.W * 0.5, focusY = wide ? S.H * 0.46 : S.H * 0.72, mapX0 = wide ? S.W * 0.42 : 0;
    var cam = { x: 0, y: 0, z: wide ? 0.5 : 0.7, tx: 0, ty: 0, tz: wide ? 0.5 : 0.7, vx: 0, vy: 0 }, sel = -1, near = [], hover = -1, hoverNear = [], clock = 0, drag = null, moved = 0, selT = 0, grid = null, GC = 220, drift = { x: 0, y: 0 };
    var placed = [], layoutT = 0, orbit = {};
    function note(t) { if (status) status.textContent = t; }
    function measureMasks() {
      var rr = root.getBoundingClientRect(); masks = [];
      [".ghero-in .crumb", ".ghero-in h1", ".ghero-in .sub", ".ghero-in .desc", ".ghero-in .btn", ".console", ".wordfind", ".ghero-bar"].forEach(function (sel2) { [].forEach.call(root.querySelectorAll(sel2), function (el) { var r = el.getBoundingClientRect(); if (r.width) masks.push({ x0: r.left - rr.left - 28, y0: r.top - rr.top - 16, x1: r.right - rr.left + 28, y1: r.bottom - rr.top + 16 }); }); });
      masks.push({ x0: -1, y0: -1, x1: S.W + 1, y1: 112 });                                  // the header
      if (wide) masks.push({ x0: -1, y0: -1, x1: mapX0, y1: S.H + 1 });                     // the whole title column
    }
    function masked(x, y) { for (var i = 0; i < masks.length; i++) { var m = masks[i]; if (x > m.x0 && x < m.x1 && y > m.y0 && y < m.y1) return true; } return false; }
    function bucket() { grid = {}; var D = DATA; for (var i = 0; i < D.n; i++) { var k = Math.floor(D.xy[i * 2] / GC) + "," + Math.floor(D.xy[i * 2 + 1] / GC); (grid[k] || (grid[k] = [])).push(i); } }
    function toScreen(i) { var D = DATA; return { x: focusX + (D.xy[i * 2] - cam.x + drift.x) * cam.z, y: focusY + (D.xy[i * 2 + 1] - cam.y + drift.y) * cam.z }; }

    function choose(i, fly) {
      if (i < 0 || !DATA) return; sel = i; near = nearest(i, wide ? 8 : 10); selT = 0; orbit = {}; var D = DATA;
      near.forEach(function (n, k) { var ang = -Math.PI / 2 + k * (6.2832 / near.length) + 0.3, rad = (wide ? 120 : 92) + (k % 2) * 26; orbit[n.i] = { dx: Math.cos(ang) * rad, dy: Math.sin(ang) * rad * 0.78, delay: k * 0.05 }; });
      if (fly !== false) { cam.tx = D.xy[i * 2]; cam.ty = D.xy[i * 2 + 1]; cam.tz = clamp(Math.max(cam.tz, wide ? 0.95 : 1.15), 0.3, 2.2); }
      if (input && document.activeElement !== input) input.value = D.words[i];
      if (stat) { stat.hidden = false; stat.innerHTML = "<b>" + D.words[i].toUpperCase() + "</b><span>nearest meanings:</span>" + near.slice(0, 5).map(function (n) { return D.words[n.i]; }).join(" · "); }
      if (clearBtn) clearBtn.hidden = false; note("");
    }
    function clearSel() { sel = -1; near = []; orbit = {}; if (stat) stat.hidden = true; if (clearBtn) clearBtn.hidden = true; if (input) input.value = ""; }
    if (!DATA) note("Loading the map…");
    load().then(function () { bucket(); measureMasks(); note(""); if (sel < 0) choose(DATA.index.camera !== undefined ? DATA.index.camera : 100); }, function () { note("The word data could not load."); });
    if (DATA) { bucket(); measureMasks(); choose(DATA.index.camera !== undefined ? DATA.index.camera : 100, true); }

    function pointer(ev) { var r = root.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
    if (!root.__nlpWired) {
      root.__nlpWired = true;
      root.addEventListener("pointerdown", function (ev) { if (ev.target.closest("a,button,input,label,.ghero-bar,.wordfind,.console")) return; var p = pointer(ev); if (masked(p.x, p.y) && ev.pointerType !== "touch") return; drag = { x: p.x, y: p.y, id: ev.pointerId, lx: p.x, ly: p.y, t: performance.now() }; moved = 0; cam.vx = cam.vy = 0; if (root.setPointerCapture) root.setPointerCapture(ev.pointerId); });
      root.addEventListener("pointermove", function (ev) { if (!drag || ev.pointerId !== drag.id) return; var p = pointer(ev), now = performance.now(), dtm = Math.max(1, now - drag.t); moved += Math.abs(p.x - drag.lx) + Math.abs(p.y - drag.ly); cam.tx -= (p.x - drag.lx) / cam.z; cam.ty -= (p.y - drag.ly) / cam.z; cam.x = cam.tx; cam.y = cam.ty; cam.vx = -(p.x - drag.lx) / cam.z / dtm * 1000; cam.vy = -(p.y - drag.ly) / cam.z / dtm * 1000; drag.lx = p.x; drag.ly = p.y; drag.t = now; });
      root.addEventListener("pointerup", function () { drag = null; });
      root.addEventListener("pointercancel", function () { drag = null; });
      root.addEventListener("wheel", function (ev) { if (ev.target.closest(".ghero-bar,.wordfind,.console")) return; var p = pointer(ev); if (masked(p.x, p.y)) return; ev.preventDefault(); var f = Math.exp(-ev.deltaY * 0.0012), nz = clamp(cam.tz * f, 0.2, 2.6), wx = cam.tx + (p.x - focusX) / cam.tz, wy = cam.ty + (p.y - focusY) / cam.tz; cam.tx = wx - (p.x - focusX) / nz; cam.ty = wy - (p.y - focusY) / nz; cam.tz = nz; }, { passive: false });
    }

    // the field: a limited, collision-free set of labels, chosen by priority
    var mctx = document.createElement("canvas").getContext("2d");
    function layout() {
      var D = DATA, cand = [], x0 = cam.x - focusX / cam.z, x1 = cam.x + (S.W - focusX) / cam.z, y0 = cam.y - focusY / cam.z, y1 = cam.y + (S.H - focusY) / cam.z;
      var per = cam.z < 0.35 ? 2 : cam.z < 0.7 ? 4 : cam.z < 1.2 ? 9 : 24, seen = {};
      for (var gx = Math.floor(x0 / GC); gx <= Math.floor(x1 / GC); gx++) for (var gy = Math.floor(y0 / GC); gy <= Math.floor(y1 / GC); gy++) { var cell = grid[gx + "," + gy]; if (!cell) continue; for (var k = 0; k < cell.length && k < per; k++) { cand.push({ i: cell[k], anchor: k === 0, pri: 2 - k * 0.1 }); seen[cell[k]] = 1; } }
      if (sel >= 0) { if (!seen[sel]) cand.push({ i: sel, anchor: true, pri: 99 }); near.forEach(function (n) { if (!seen[n.i]) cand.push({ i: n.i, anchor: false, pri: 50 }); }); }
      if (hover >= 0 && !seen[hover]) cand.push({ i: hover, anchor: false, pri: 60 });
      cand.forEach(function (c) { if (c.i === sel) c.pri = 99; else if (orbit[c.i]) c.pri = 50; else if (c.i === hover) c.pri = 60; else c.pri += (1 - c.i / D.n); });
      cand.sort(function (a, b) { return b.pri - a.pri; });
      var out = [], boxes = [], limit = wide ? 110 : 60;
      mctx.font = "500 12px 'Libre Franklin', sans-serif";
      for (var n = 0; n < cand.length && out.length < limit; n++) {
        var c = cand[n], i = c.i, p = pos(i), w = D.words[i].length * 7.2 * size(c) / 12 + 8, h = size(c) + 6;
        if (!(i === sel || orbit[i]) && (masked(p.x, p.y) || masked(p.x - w / 2, p.y) || masked(p.x + w / 2, p.y))) continue;
        if (p.x < -40 || p.x > S.W + 40 || p.y < -20 || p.y > S.H + 20) continue;
        var box = { x0: p.x - w / 2, y0: p.y - h / 2, x1: p.x + w / 2, y1: p.y + h / 2 }, hit = false;
        for (var b = 0; b < boxes.length; b++) { var q = boxes[b]; if (box.x0 < q.x1 && box.x1 > q.x0 && box.y0 < q.y1 && box.y1 > q.y0) { hit = true; break; } }
        if (hit && !(i === sel || orbit[i])) continue;
        boxes.push(box); c.p = p; out.push(c);
      }
      placed = out;
    }
    function size(c) { var i = c.i, rank = 1 - i / DATA.n, base = (wide ? 12 : 11) * clamp(0.6 + Math.sqrt(cam.z) * 0.5, 0.65, 1.4) * (0.8 + rank * 0.4); return i === sel ? base * 1.7 : orbit[i] ? base * 1.25 : i === hover ? base * 1.15 : c.anchor ? base * 1.12 : base; }
    function pos(i) {            // map position, or the orbit slot when this word belongs to the chosen neighbourhood
      var p = toScreen(i); if (!orbit[i] || sel < 0) return p;
      var s = toScreen(sel), o = orbit[i], k = reduced ? 1 : ease((selT - o.delay) / 0.62);
      return { x: p.x + (s.x + o.dx - p.x) * k, y: p.y + (s.y + o.dy - p.y) * k };
    }

    root.__nlp = { layout: layout, placed: function () { return placed; }, masks: function () { return masks; }, cam: cam, sel: function () { return sel; } };
    return {
      step: function (dt, S) {
        clock += dt; selT += dt; layoutT += dt;
        if (!drag) { cam.tx += cam.vx * dt; cam.ty += cam.vy * dt; cam.vx *= Math.pow(0.02, dt); cam.vy *= Math.pow(0.02, dt); }
        var k = Math.min(1, dt * (reduced ? 12 : 4)); cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k; cam.z += (cam.tz - cam.z) * k;
        var idle = !drag && hover < 0 && sel < 0 && !reduced; drift.x += ((idle ? Math.sin(clock * 0.11) * 6 : 0) - drift.x) * Math.min(1, dt * 0.5); drift.y += ((idle ? Math.cos(clock * 0.09) * 5 : 0) - drift.y) * Math.min(1, dt * 0.5);
        if (!DATA || !grid) return;
        if (layoutT > 0.08) { layoutT = 0; layout(); }
        var was = hover; hover = -1;
        if (S.inside && !drag) { var best = 18; placed.forEach(function (c) { var d = Math.hypot(S.mx - c.p.x, S.my - c.p.y); if (d < best) { best = d; hover = c.i; } }); }
        if (hover !== was) hoverNear = hover >= 0 ? nearest(hover, 4) : [];
        root.style.cursor = drag ? "grabbing" : hover >= 0 ? "pointer" : masked(S.mx, S.my) ? "" : "grab";
      },
      settle: function () { cam.x = cam.tx; cam.y = cam.ty; cam.z = cam.tz; if (DATA) layout(); },
      click: function () { if (moved > 6) return; if (hover >= 0) choose(hover, false); },
      act: function (name, value) {
        if (!DATA) return;
        if (name === "shuffle") { choose((Math.random() * Math.min(4000, DATA.n)) | 0); }
        else if (name === "clear") clearSel();
        else if (name === "word") { var q = String(value || "").trim().toLowerCase(); if (!q) return; var i = DATA.index[q]; if (i === undefined) { for (var j = 0; j < DATA.n; j++) if (DATA.words[j].indexOf(q) === 0) { i = j; break; } } if (i !== undefined) choose(i); else note("“" + q + "” is not on this map."); }
        if (name !== "word") measureMasks();
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        if (!DATA || !grid) return;
        var D = DATA, nearSet = {}; near.forEach(function (n) { nearSet[n.i] = n.s; });
        var hovSet = {}; hoverNear.forEach(function (n) { hovSet[n.i] = n.s; });
        // strands: only for the chosen word and the hovered one
        if (sel >= 0) { var sp = pos(sel); placed.forEach(function (c) { if (nearSet[c.i] === undefined) return; var k = reduced ? 1 : ease((selT - orbit[c.i].delay) / 0.62); ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(c.p.x, c.p.y); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(" + TEAL + "," + (0.45 * k).toFixed(3) + ")"; ctx.stroke(); }); }
        if (hover >= 0 && hover !== sel) { var hp = pos(hover); placed.forEach(function (c) { if (hovSet[c.i] === undefined) return; ctx.beginPath(); ctx.moveTo(hp.x, hp.y); ctx.lineTo(c.p.x, c.p.y); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(226,236,255,.22)"; ctx.stroke(); }); }
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        placed.forEach(function (c) {
          var i = c.i, p = c.p, on = i === sel, nr = nearSet[i] !== undefined, hv = i === hover, rank = 1 - i / D.n, sz = size(c);
          var a = on ? 1 : nr ? 0.85 : hv ? 0.9 : hovSet[i] !== undefined ? 0.7 : (c.anchor ? 0.5 : 0.3) * (0.6 + rank * 0.4) * (sel >= 0 ? 0.55 : 1) * clamp(0.35 + cam.z, 0.4, 1);
          // fade at the edge of the title column
          if (wide) a *= clamp((p.x - mapX0) / 90, 0, 1);
          if (on) { var pulse = selT < 0.9 ? Math.sin(selT / 0.9 * Math.PI) : 0; SAIL.dot(ctx, p.x, p.y, sz * (0.6 + pulse * 0.5), TEAL, 0.35 + pulse * 0.3); }
          else if (hv) SAIL.dot(ctx, p.x, p.y, sz * 0.6, TEAL, 0.25);
          ctx.font = (on ? "800 " : nr || c.anchor ? "600 " : "500 ") + sz.toFixed(1) + "px 'Libre Franklin', sans-serif";
          ctx.fillStyle = on ? "#fff" : nr ? "rgba(196,246,240," + a.toFixed(2) + ")" : "rgba(206,220,240," + a.toFixed(2) + ")"; ctx.fillText(D.words[i], p.x, p.y);
        });
      }
    };
  };
})();
