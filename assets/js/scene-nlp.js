/* South Artificial Intelligence Laboratory: the Language hero.
   One idea: words arranged by meaning. About sixty words sit in a fixed map. Each word has
   a small hand-written vector (which topics it belongs to, and how strongly), its place on
   the map comes from that vector, and "nearest" means cosine similarity between vectors.
   A trained model does the same thing with thousands of learned dimensions. The layout is
   seeded, so the map is the same on every visit. */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL) return;
  var TOPICS = ["image", "text", "game", "school", "music", "food", "nature", "money"];
  var WORDS = {
    image: "image photo camera:music.2 lens pixel vision video:game.5 picture", text: "text article word sentence story:school.3 letter:school.4 language headline",
    game: "game reward:school.4 agent score:music.5 player:music.4 level strategy puzzle", school: "school class homework teacher exam:text.3 grade:game.3 student notebook:text.5",
    music: "song melody guitar rhythm singer concert:image.2 lyrics:text.6", food: "pizza recipe:text.3 kitchen flavor bread dinner menu:text.3",
    nature: "river rain storm forest ocean cloud:image.2 shore", money: "bank:nature.5 money loan price market:food.3 coin:game.3 budget:school.2"
  };
  var TEAL = SAIL.TEAL, INK = SAIL.INK, DIM = SAIL.DIM;
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  function cos(a, b) { var d = 0, p = 0, q = 0; for (var i = 0; i < a.length; i++) { d += a[i] * b[i]; p += a[i] * a[i]; q += b[i] * b[i]; } return d / Math.sqrt(p * q); }

  var rand = rng(20260921), list = [];
  TOPICS.forEach(function (topic, ti) {
    WORDS[topic].split(" ").forEach(function (spec) {
      var parts = spec.split(":"), v = TOPICS.map(function () { return rand() * 0.14; }); v[ti] = 1;
      if (parts[1]) { var s = parts[1].split("."); v[TOPICS.indexOf(s[0])] = +("0." + s[1]); }
      list.push({ w: parts[0], topic: ti, v: v, jx: rand() - 0.5, jy: rand() - 0.5, z: 0.55 + rand() * 0.45 });
    });
  });
  // where each topic sits, then each word at the weighted middle of its topics
  var centers = TOPICS.map(function (t, i) { var a = i / TOPICS.length * 6.2832 + 0.4, k = i % 2 ? 0.78 : 1; return [0.5 + Math.cos(a) * 0.4 * k, 0.5 + Math.sin(a) * 0.38 * k]; });
  list.forEach(function (o) { var sx = 0, sy = 0, sw = 0; o.v.forEach(function (wt, i) { var k = wt * wt; sx += centers[i][0] * k; sy += centers[i][1] * k; sw += k; }); o.u = sx / sw + o.jx * 0.17; o.vv = sy / sw + o.jy * 0.2; });
  // ease overlapping labels apart, the same way every time
  for (var pass = 0; pass < 80; pass++) list.forEach(function (a, i) { for (var k = i + 1; k < list.length; k++) { var b = list[k], dx = b.u - a.u, dy = b.vv - a.vv, ox = 0.1 - Math.abs(dx), oy = 0.062 - Math.abs(dy); if (ox > 0 && oy > 0) { if (ox / 0.1 < oy / 0.062) { var sx = (dx >= 0 ? 1 : -1) * ox * 0.5; a.u -= sx; b.u += sx; } else { var sy = (dy >= 0 ? 1 : -1) * oy * 0.5; a.vv -= sy; b.vv += sy; } } } a.u = Math.max(0.04, Math.min(0.96, a.u)); a.vv = Math.max(0.04, Math.min(0.96, a.vv)); });
  list.forEach(function (o) { o.near = list.filter(function (p) { return p !== o; }).map(function (p) { return { o: p, s: cos(o.v, p.v) }; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 5); });

  SAIL.scenes.nlp = function (S, root) {
    var wide = S.W >= 980, bar = root.querySelector(".ghero-bar"), floorY = bar ? bar.offsetTop : S.H - 120, input = root.querySelector('[data-act="word"]');
    var r = wide ? { x: S.W * 0.4, y: 96, w: S.W * 0.57, h: floorY - 96 - 50 } : { x: S.W * 0.05, y: floorY - (Math.min(window.innerHeight * 0.46, 420) - 20), w: S.W * 0.9, h: Math.min(window.innerHeight * 0.46, 420) - 70 };
    var sel = list.filter(function (o) { return o.w === "camera"; })[0], hover = null, clock = 0;
    if (!root.querySelector("#nlp-words")) { var dl = document.createElement("datalist"); dl.id = "nlp-words"; list.forEach(function (o) { var op = document.createElement("option"); op.value = o.w; dl.appendChild(op); }); root.appendChild(dl); }
    list.forEach(function (o) { o.x = o.hx = r.x + o.u * r.w; o.y = o.hy = r.y + o.vv * r.h; o.a = 0.6; o.k = 1; });

    function isNear(o) { return sel && sel.near.some(function (n) { return n.o === o; }); }
    function place() {
      list.forEach(function (o) {
        var bx = r.x + o.u * r.w, by = r.y + o.vv * r.h;
        if (!wide && sel) { var cx = r.x + r.w / 2, cy = r.y + r.h / 2; bx = cx + (o.u - sel.u) * r.w * 2.1; by = cy + (o.vv - sel.vv) * r.h * 2.1; }
        if (sel && isNear(o)) { var hx = wide ? r.x + sel.u * r.w : r.x + r.w / 2, hy = wide ? r.y + sel.vv * r.h : r.y + r.h / 2; bx += (hx - bx) * 0.08; by += (hy - by) * 0.08; }
        o.hx = bx; o.hy = by;
      });
    }
    function choose(o) { sel = o; place(); if (input && document.activeElement !== input) input.value = o.w; }
    place();

    return {
      step: function (dt, S) {
        clock += dt; hover = null; var best = 26;
        list.forEach(function (o) {
          var px = S.inside && wide ? (S.mx - (r.x + r.w / 2)) * 0.025 * o.z : 0, py = S.inside && wide ? (S.my - (r.y + r.h / 2)) * 0.025 * o.z : 0;
          var tx = o.hx - px + Math.sin(clock * 0.22 + o.jx * 9) * 3 * o.z, ty = o.hy - py + Math.cos(clock * 0.19 + o.jy * 9) * 3 * o.z;
          o.x += (tx - o.x) * Math.min(1, dt * 3); o.y += (ty - o.y) * Math.min(1, dt * 3);
          var on = o === sel, nr = isNear(o), ta = !sel ? 0.55 * o.z : on ? 1 : nr ? 0.95 : 0.34 * o.z, tk = on ? 1.7 : nr ? 1.25 : 1;
          o.a += (ta - o.a) * Math.min(1, dt * 4); o.k += (tk - o.k) * Math.min(1, dt * 5);
          if (S.inside) { var d = Math.hypot(S.mx - o.x, S.my - o.y); if (d < best && (wide || on || nr || o.a > 0.3)) { best = d; hover = o; } }
        });
        root.style.cursor = hover ? "pointer" : "";
      },
      settle: function () { list.forEach(function (o) { o.x = o.hx; o.y = o.hy; o.a = o === sel ? 1 : isNear(o) ? 0.95 : 0.16; o.k = o === sel ? 1.7 : isNear(o) ? 1.25 : 1; }); },
      click: function () { if (hover) choose(hover); },
      act: function (name, value) {
        if (name === "shuffle") { var o; do { o = list[(Math.random() * list.length) | 0]; } while (o === sel); choose(o); }
        else if (name === "word") { var q = String(value || "").trim().toLowerCase(); if (!q) return; var hit = list.filter(function (o) { return o.w === q; })[0] || list.filter(function (o) { return o.w.indexOf(q) === 0; })[0]; if (hit) choose(hit); }
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        // the faint web: every word tied to its two closest
        ctx.lineWidth = 1;
        list.forEach(function (o) { if (!wide && o.a < 0.3) return; o.near.slice(0, 2).forEach(function (n) { var a = Math.min(o.a, n.o.a) * 0.22; if (a < 0.02) return; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(n.o.x, n.o.y); ctx.strokeStyle = "rgba(" + INK + "," + a.toFixed(3) + ")"; ctx.stroke(); }); });
        if (sel) sel.near.forEach(function (n) { ctx.beginPath(); ctx.moveTo(sel.x, sel.y); ctx.lineTo(n.o.x, n.o.y); SAIL.glow(ctx, TEAL, 0.8 + n.s * 1.4, 0.25 + n.s * 0.6); });
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        list.slice().sort(function (a, b) { return a.k - b.k; }).forEach(function (o) {
          if (o.a < 0.03) return; var on = o === sel, size = (wide ? 13 : 12) * (0.75 + o.z * 0.4) * o.k;
          if (on || o === hover) SAIL.dot(ctx, o.x, o.y, size * 0.55, TEAL, on ? 0.5 : 0.3);
          ctx.font = (on ? "800 " : isNear(o) ? "600 " : "500 ") + size.toFixed(1) + "px 'Libre Franklin', sans-serif";
          ctx.fillStyle = on ? "#fff" : isNear(o) ? "rgba(190,245,238," + o.a.toFixed(2) + ")" : "rgba(200,216,238," + o.a.toFixed(2) + ")"; ctx.fillText(o.w, o.x, o.y);
        });
        if (sel) {
          var lx = r.x, ly = r.y + r.h + 22; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
          ctx.font = "500 12px ui-monospace, Consolas, monospace"; ctx.fillStyle = "rgba(" + DIM + ",1)"; ctx.fillText("selected", lx, ly); ctx.fillText("nearest words", lx, ly + 20);
          ctx.font = "700 14px 'Libre Franklin', sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(sel.w, lx + 112, ly);
          ctx.font = "500 14px 'Libre Franklin', sans-serif"; ctx.fillStyle = "rgba(190,245,238,.95)"; ctx.fillText(sel.near.slice(0, wide ? 5 : 4).map(function (n) { return n.o.w; }).join(" · "), lx + 112, ly + 20);
        }
      }
    };
  };
})();
