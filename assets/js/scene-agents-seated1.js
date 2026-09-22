/* South Artificial Intelligence Laboratory: the Agents hero.
   One interaction: a title letter falls, and a seated robot puts it back from its desk.
   It never leaves the chair. Its head turns to the fallen letter, one arm reaches (elbow
   first), the wrist turns, thumb and index pinch the letter, it lifts it past the monitor
   as if checking it, then reaches toward the title and the letter is drawn into its slot
   with a click. Knock letters loose faster than it can cope and it escalates in the chair:
   stops typing, looks up, grips the desk, slams it, sweeps or flicks a letter into a visual
   copy of the navigation bar. The real links are never touched. A control on the monitor
   restarts the title system.
   The robot is a render cut into pieces (assets/img/robot) posed with two-joint inverse
   kinematics; the hands are drawn so their fingers can close. */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL) return;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var RIG = { head: { x: 561, y: 26, w: 94, h: 146, px: 610, py: 160 }, armL1: { x: 447, y: 183, w: 94, h: 239, px: 510, py: 215 }, armL2: { x: 428, y: 359, w: 72, h: 179, px: 476, py: 386 },
              armR1: { x: 685, y: 183, w: 69, h: 239, px: 712, py: 215 }, armR2: { x: 702, y: 359, w: 70, h: 179, px: 732, py: 386 }, body: { x: 460, y: 148, w: 280, h: 854, px: 611, py: 470 } };
  var WRIST = { "-1": [458, 530], "1": [752, 530] }, IMG = {};
  Object.keys(RIG).forEach(function (n) { var im = new Image(); im.src = "assets/img/robot/" + n + ".png"; IMG[n] = im; });
  function nat(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]); }
  var NAT = { "-1": { u: nat([510, 215], [476, 386]), f: nat([476, 386], WRIST["-1"]) }, "1": { u: nat([712, 215], [732, 386]), f: nat([732, 386], WRIST["1"]) } };

  SAIL.scenes.agents = function (S, root) {
    var wide = S.W >= 980, bar = root.querySelector(".ghero-bar"), h1 = root.querySelector("h1");
    var hint = root.querySelector("[data-hint]"), live = root.querySelector("[data-live]"), panel = root.querySelector("[data-panel]");
    var mast = document.querySelector(".masthead"), logo = mast ? mast.querySelector(".brand img") : null;
    var floorY = bar ? bar.offsetTop : S.H - 120, Z = wide ? clamp(window.innerHeight * 0.00082, 0.5, 0.8) : clamp(S.W * 0.0019, 0.55, 0.8), U = 133 * Z;
    var deskY = floorY - (wide ? 34 : 22), homeX = wide ? S.W * 0.72 : S.W * 0.6, G = 2300, L1 = 174 * Z, L2 = Math.hypot(WRIST["1"][0] - 732, WRIST["1"][1] - 386) * Z, HAND = 62 * Z;
    var monX = homeX + U * (wide ? 1.55 : 1.25), kbX = homeX, trayX = homeX - U * 1.5, lampX = wide ? Math.min(S.W - U * 0.7, monX + U * 1.4) : S.W - U * 0.5;
    var reach = { x0: homeX - (L1 + L2 + HAND) * 0.92, x1: homeX + (L1 + L2 + HAND) * 0.55 };

    function hintText(t) { if (hint && hint.textContent !== t) hint.textContent = t; }
    function announce(t) { if (live) { live.textContent = ""; window.setTimeout(function () { live.textContent = t; }, 30); } }

    /* ---- clear anything an earlier build of this scene left behind ---- */
    [].forEach.call(root.querySelectorAll(".navwreck, canvas.ghero-top, canvas.ghero-mid"), function (n) { n.parentNode.removeChild(n); });
    if (mast) mast.classList.remove("wrecked"); if (logo) logo.style.transform = ""; if (panel) panel.hidden = true; root.setAttribute("data-state", "calm");
    root.style.removeProperty("--shx"); root.style.removeProperty("--shy");
    var top = document.createElement("canvas"); top.className = "ghero-top"; top.setAttribute("aria-hidden", "true"); top.width = Math.round(S.W * S.dpr); top.height = Math.round(S.H * S.dpr); root.appendChild(top);
    var tctx = top.getContext("2d"); tctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    var mid = document.createElement("canvas"); mid.className = "ghero-mid"; mid.setAttribute("aria-hidden", "true"); mid.width = top.width; mid.height = top.height; root.insertBefore(mid, top);
    var mctx = mid.getContext("2d"); mctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    if (!root.__lettersWired) { root.__lettersWired = true; root.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("button.lb"); if (!b) return; ev.stopPropagation(); if (root.__knock) root.__knock(+b.getAttribute("data-letter")); }); }

    /* ---- the title, one physical letter per span, with a button each ---- */
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
    var letters = [].map.call(h1 ? h1.querySelectorAll(".l") : [], function (el, i) {
      el.style.transform = ""; el.style.visibility = ""; el.classList.remove("lock"); el.classList.remove("out");
      var btn = el.querySelector("button"); if (!btn) { btn = document.createElement("button"); btn.type = "button"; btn.className = "lb"; btn.setAttribute("aria-label", "Knock the letter " + el.textContent.trim() + " loose"); btn.setAttribute("data-letter", String(i)); el.appendChild(btn); }
      return { el: el, btn: btn, idx: i, ch: el.textContent.trim().charAt(0), hx: 0, hy: 0, w: 0, h: 0, x: 0, y: 0, rot: 0, sc: 1, vx: 0, vy: 0, vr: 0, state: "home", t: 0, bounced: 0 };
    });
    function measure() { letters.forEach(function (l) { var x = 0, y = 0, n = l.el; while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; l.hx = x + l.w / 2; l.hy = y + l.h / 2; if (l.state === "home") { l.x = l.hx; l.y = l.hy; } }); }
    measure();
    function sync() {
      letters.forEach(function (l) {
        var t = l.state === "home" ? "" : "translate(" + (l.x - l.hx).toFixed(1) + "px," + (l.y - l.hy).toFixed(1) + "px) rotate(" + l.rot.toFixed(3) + "rad)" + (l.sc !== 1 ? " scale(" + l.sc.toFixed(3) + ")" : "");
        if (l.tf !== t) { l.el.style.transform = t; l.tf = t; }
        var out = l.state !== "home"; if (l.out !== out) { l.el.classList.toggle("out", out); l.out = out; }
        var dis = out || !!seq || wrecked || !!restoring; if (l.btn.disabled !== dis) l.btn.disabled = dis;
      });
    }
    function restY(l) { return deskY - l.h * 0.5 * l.sc + 2; }
    function spare(l, want) {          // a free spot on the desk within reach, nearest to where the letter wants to be
      var taken = letters.filter(function (o) { return o !== l && (o.state === "rest" || o.state === "slide"); }), gap = l.w * 1.05;
      for (var n = 0; n < 60; n++) { var x = clamp(want + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * gap * 0.5, reach.x0, reach.x1); if (!taken.some(function (o) { var ox = o.slide === undefined ? o.x : o.slide; return Math.abs(ox - x) < (o.w + l.w) * 0.5; })) return x; }
      return clamp(want, reach.x0, reach.x1);
    }
    function knock(l) {
      if (!l || l.state !== "home") return false;
      l.state = "loose"; l.t = 0; l.bounced = 0; l.gf = 1; l.vx = 0; l.vy = -60; l.vr = rnd(-3, 3); l.land = null;
      announce("The letter " + l.ch + " fell. The agent is restoring the title."); if (level < 1) hintText("The agent is restoring the title."); return true;
    }
    function lockIn(l) {
      l.state = "home"; l.x = l.hx; l.y = l.hy; l.rot = 0; l.sc = 1; l.big = 0; l.el.classList.remove("lock"); void l.el.offsetWidth; l.el.classList.add("lock");
      fx.push({ kind: "ring", x: l.hx, y: l.hy, r: l.h * 0.5, t: 0, life: 0.35 }); fx.push({ kind: "slot", l: l, t: 0, life: 0.5 });
      if (!restoring && !seq && letters.every(function (o) { return o === l || o.state === "home"; })) { announce("Title complete."); if (level < 1) hintText("Tap a letter to knock it loose."); }
    }

    /* ---- state ---- */
    var rb = { lean: 0, leanTo: 0, yaw: 0.05, pitch: 0.1, yawTo: 0.05, pitchTo: 0.1, arms: [-1, 1].map(function (s) { return { side: s, x: homeX + s * U * 0.6, y: deskY - 4, ex: 0, ey: 0, tx: homeX + s * U * 0.6, ty: deskY - 4, vx: 0, vy: 0, curl: 0.35, curlTo: 0.35, pinch: 0, pinchTo: 0, wrist: 0, wristTo: 0, roll: 0, rollTo: 0, hand: 0, speed: 6, typing: 0, holding: false }; }) };
    var job = null, work = { i: 0, t: 0, k: 0 }, knocks = [], level = 0, clock = 0, sinceMeasure = 0, cue = null, cueAt = 5, variant = 0, shake = 0, fx = [], dust = [], heat = 0, heatTo = 0, warm = 0, warmTo = 0, cool = 0, coolTo = 0, flicker = 0, lamp = { a: 0, va: 0 }, chair = 0;
    var track = null, seq = null, wrecked = false, restoring = null, wreck = null, cracks = [], monitor = ["TASK: restore title", "observe · act · verify · adapt", "STATE: observing"], card = null, tilt = null, timeScale = 1, slowT = 0;
    var tiles = ["A", "I", "R", "L"].map(function (c, i) { return { c: c, ox: trayX + U * (0.35 + i * 0.22), oy: deskY - U * 0.085, x: 0, y: 0, rot: (i - 1.5) * 0.15, vx: 0, vy: 0, vr: 0, free: false }; });
    var papers = [{ ox: monX - U * 0.95, w: U * 0.55, n: 4 }, { ox: homeX - U * 2.3, w: U * 0.5, n: 1 }].map(function (p) { p.oy = deskY - 3; p.x = p.ox; p.y = p.oy; p.rot = 0; p.vx = p.vy = p.vr = 0; p.free = false; return p; });
    tiles.forEach(function (t) { t.x = t.ox; t.y = t.oy; });

    function hip() { return { x: homeX, y: deskY + (470 - 448) * Z + chair * 6 * Z }; }
    function leanRot() { return rb.lean * 0.17; }
    function shoulder(side) { var h = hip(), r = leanRot(), lx = side * 101 * Z, ly = -255 * Z; return { x: h.x + lx * Math.cos(r) - ly * Math.sin(r), y: h.y + lx * Math.sin(r) + ly * Math.cos(r) }; }
    function headPos() { var h = hip(), r = leanRot(), ly = -310 * Z; return { x: h.x - ly * Math.sin(r), y: h.y + ly * Math.cos(r) }; }
    function lookAt(x, y, k) { var hp = headPos(); rb.yawTo = clamp((x - hp.x) / (U * 3.4), -1, 1); rb.pitchTo = clamp((y - hp.y) / (U * 3), -1, 1) * (k || 1); }
    function grip(a) { return { x: a.x + Math.cos(a.hand) * HAND * 0.78, y: a.y + Math.sin(a.hand) * HAND * 0.78 }; }    // between thumb and index
    function aim(a, x, y) { var g = grip(a); a.tx = x - (g.x - a.x); a.ty = y - (g.y - a.y); }
    function typingPose(a, n) { a.tx = kbX + a.side * U * (0.52 + (n ? 0.06 : 0)); a.ty = deskY - U * 0.16; a.wristTo = 0.55; a.rollTo = 1; a.curlTo = 0.45; a.pinchTo = 0; a.speed = 5; }

    /* ---- restoring one letter, from the chair, in about 1.8 seconds ---- */
    function nextJob() { var best = null, bd = 1e9; letters.forEach(function (l) { if (l.state === "rest") { var d = Math.abs(l.x - homeX); if (d < bd) { bd = d; best = l; } } }); return best ? { l: best, phase: "notice", t: 0, arm: rb.arms[best.x < homeX ? 0 : 1], other: rb.arms[best.x < homeX ? 1 : 0] } : null; }
    function stepJob(dt) {
      var j = job, l = j.l, a = j.arm, quick = 1 + level * 0.5; j.t += dt;
      if (l.state !== "rest" && l.state !== "held" && l.state !== "magnet" && !(l.state === "home" && j.phase === "release")) { job = null; return; }
      track = l.state === "rest" ? { x: l.x } : null; typingPose(j.other, 0); j.other.typing = 0;
      if (j.phase === "notice") { lookAt(l.x, l.y); rb.leanTo = 0.3; if (j.t > 0.16 / quick) { j.phase = "reach"; j.t = 0; } }
      else if (j.phase === "reach") {
        lookAt(l.x, l.y); rb.leanTo = 0.8; aim(a, l.x, l.y - 6 * Z); a.wristTo = 0.9; a.rollTo = 1; a.curlTo = 0.15; a.pinchTo = 0; a.speed = 9 * quick;
        var g = grip(a); if (Math.hypot(g.x - l.x, g.y - l.y + 6 * Z) < 9 || j.t > 0.42) { j.phase = "pinch"; j.t = 0; }
      } else if (j.phase === "pinch") { aim(a, l.x, l.y - 2 * Z); a.pinchTo = 1; a.curlTo = 0.7; if (j.t > 0.11 / quick) { l.state = "held"; j.phase = "lift"; j.t = 0; a.holding = true; } }
      else if (j.phase === "lift") {
        rb.leanTo = 0.2; var sh = shoulder(a.side); aim(a, homeX + a.side * U * 0.5, sh.y + U * 0.9); a.wristTo = 0; a.rollTo = 0; a.speed = 8 * quick; lookAt(homeX + a.side * U * 0.5, sh.y + U * 0.8);
        if (j.t > 0.22 / quick) { j.phase = "extend"; j.t = 0; }
      } else if (j.phase === "extend") {
        lookAt(l.hx, l.hy); rb.leanTo = 0.6; var s2 = shoulder(a.side), dx = l.hx - s2.x, dy = l.hy - s2.y, d = Math.hypot(dx, dy) || 1, R = L1 + L2 + HAND * 0.7 - 4;
        aim(a, s2.x + dx / d * Math.min(d, R), s2.y + dy / d * Math.min(d, R)); a.wristTo = 0; a.rollTo = 0; a.speed = 9 * quick;
        var g2 = grip(a); if (Math.hypot(a.x - a.tx, a.y - a.ty) < 10 || j.t > 0.36) { l.state = "magnet"; l.t = 0; l.from = { x: g2.x, y: g2.y, rot: l.rot }; l.dur = clamp(Math.hypot(g2.x - l.hx, g2.y - l.hy) / 1400, 0.16, 0.36) / quick; a.pinchTo = 0; a.curlTo = 0.2; a.holding = false; j.phase = "release"; j.t = 0; }
      } else if (j.phase === "release") { lookAt(l.hx, l.hy); rb.leanTo = 0.2; a.tx = a.x; a.ty = a.y + 6 * Z; if (l.state === "home" && j.t > 0.2) { job = null; work.t = 0; work.i = 3; } }
      if (l.state === "held") { var gh = grip(a); l.x = gh.x; l.y = gh.y; l.rot += (a.hand * 0.3 - l.rot) * Math.min(1, dt * 8); }
    }

    /* ---- the quiet work loop ---- */
    function stepWork(dt) {
      var w = work, a0 = rb.arms[0], a1 = rb.arms[1]; w.t += dt; rb.leanTo = 0.25;
      function next() { w.i = (w.i + 1) % 4; w.t = 0; w.k++; }
      typingPose(a0, 0); typingPose(a1, 1); a0.typing = a1.typing = 0;
      if (w.i === 0) { lookAt(monX, deskY - U * 0.8, 0.6); var beat = Math.floor(w.t * 3.2) % 5; a0.typing = beat === 0 || beat === 3 ? 1 : 0; a1.typing = beat === 1 || beat === 4 ? 1 : 0; if (w.t > 3.4) next(); }
      else if (w.i === 1) { var t = tiles[w.k % tiles.length]; lookAt(t.x, t.y); if (w.t < 0.6) { aim(a0, t.x, t.y - 4 * Z); a0.wristTo = 0.9; a0.pinchTo = 0; a0.speed = 5; } else if (w.t < 1.5) { aim(a0, t.ox + (w.k % 2 ? 8 : -8) * Z, t.oy - 4 * Z); a0.pinchTo = 1; a0.wristTo = 0.9; var gt = grip(a0); t.x += (gt.x - t.x) * Math.min(1, dt * 8); t.rot *= 0.92; } else { a0.pinchTo = 0; if (w.t > 2) { t.ox = t.x; next(); } } }
      else if (w.i === 2) { lookAt(S.W * 0.22, 130); var beat2 = Math.floor(w.t * 3) % 4; a1.typing = beat2 === 1 ? 1 : 0; if (w.t > 1.4) next(); }
      else { lookAt(monX, deskY - U * 0.8, 0.6); var beat3 = Math.floor(w.t * 3.4) % 6; a0.typing = beat3 === 0 || beat3 === 2 ? 1 : 0; a1.typing = beat3 === 4 ? 1 : 0; if (w.t > 2.2) next(); }
    }

    /* ---- a visual copy of the navigation bar that can break ---- */
    function buildWreck() {
      if (!mast) return null; var rr = root.getBoundingClientRect(), layer = document.createElement("div"); layer.className = "navwreck"; layer.setAttribute("aria-hidden", "true"); root.appendChild(layer);
      var frags = [], labels = [];
      function frag(el, o) { layer.appendChild(el); o.el = el; o.x = o.y = o.rot = o.vx = o.vy = o.vr = 0; o.mode = "still"; o.a = 1; frags.push(o); }
      [].forEach.call(mast.querySelectorAll(".mainnav > a, .navgroup > button, .mast-join"), function (el) {
        if (!el.getClientRects().length) return; var cs = getComputedStyle(el), key = el.textContent.trim().toLowerCase(), up = cs.textTransform === "uppercase", er = el.getBoundingClientRect();
        labels.push({ key: key, x: er.left - rr.left + er.width / 2, y: er.top - rr.top + er.height / 2 });
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), node;
        while ((node = walker.nextNode())) for (var i = 0; i < node.nodeValue.length; i++) {
          var ch = node.nodeValue[i]; if (!ch.trim()) continue; var rg = document.createRange(); rg.setStart(node, i); rg.setEnd(node, i + 1); var r = rg.getBoundingClientRect(); if (!r.width) continue;
          var s = document.createElement("span"); s.textContent = up ? ch.toUpperCase() : ch; s.style.cssText = "left:" + (r.left - rr.left) + "px;top:" + (r.top - rr.top) + "px;width:" + r.width + "px;height:" + r.height + "px;font:" + cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + "/" + r.height + "px " + cs.fontFamily + ";color:" + cs.color + ";opacity:" + cs.opacity;
          frag(s, { key: key, ch: ch.toUpperCase(), ox: r.left - rr.left + r.width / 2, oy: r.top - rr.top + r.height / 2 });
        }
        if (el.getAttribute("aria-current") || (el.parentNode.classList && el.parentNode.classList.contains("on"))) [0, 1].forEach(function (half) { var u = document.createElement("i"), x0 = er.left - rr.left + 15, wd = (er.width - 30) / 2; u.style.cssText = "left:" + (x0 + half * wd) + "px;top:" + (er.bottom - rr.top - 23) + "px;width:" + wd + "px;height:1px;background:" + cs.color + ";transform-origin:" + (half ? "100%" : "0") + " 50%"; frag(u, { key: key, line: half ? 1 : -1, ox: x0 + half * wd + wd / 2, oy: er.bottom - rr.top - 23 }); });
      });
      mast.classList.add("wrecked"); return { layer: layer, frags: frags, labels: labels };
    }
    function label(keys) { if (!wreck || !wreck.labels.length) return null; for (var i = 0; i < keys.length; i++) for (var k = 0; k < wreck.labels.length; k++) if (wreck.labels[k].key === keys[i]) return wreck.labels[k]; return wreck.labels[wreck.labels.length - 1]; }
    function impact(lab, big) {
      if (!lab || !wreck) return; var x = lab.x, y = lab.y, order = wreck.labels.map(function (l) { return l.key; }), at = order.indexOf(lab.key);
      wreck.frags.forEach(function (f) {
        var near = Math.abs(order.indexOf(f.key) - at) === 1;
        if (f.key === lab.key && (f.mode === "still" || f.mode === "hang")) {
          if (f.key === "home" || f.key === "join") { f.mode = "hang"; f.rotTo = rnd(-0.2, 0.2); f.yTo = rnd(2, 6); return; }
          if (f.line) { f.mode = f.line < 0 ? "hang" : "fall"; f.vy = 60; f.vx = 120; f.vr = 3; f.rotTo = 1.3; f.yTo = 0; return; }
          var r = Math.random();
          if (r > 0.75) { f.mode = "slide"; f.vx = (f.ox < x ? -1 : 1) * rnd(420, 800); f.vy = rnd(-100, 60); f.vr = rnd(-6, 6); }
          else if (r > 0.25) { f.mode = "fall"; f.vx = (f.ox - x) * 4 + rnd(-120, 120); f.vy = rnd(-420, -140); f.vr = rnd(-8, 8); }
          else { f.mode = "hang"; f.rotTo = rnd(-0.6, 0.6); f.yTo = rnd(4, 14); }
        } else if (near && f.mode === "still" && !f.line && Math.random() < 0.5) { f.mode = "hang"; f.rotTo = rnd(-0.25, 0.25); f.yTo = rnd(2, 8); }
      });
      var lines = [], barH = mast ? mast.offsetHeight : 72;
      [-1, 1].forEach(function (dir) { for (var n = 0; n < (big ? 2 : 1); n++) { var pts = [[x, y + 12]], ang = (dir < 0 ? Math.PI : 0) + rnd(-0.3, 0.3), len = rnd(70, big ? 200 : 130); for (var s = 0; s < 6; s++) { ang += rnd(-0.5, 0.5); var q = pts[pts.length - 1]; pts.push([q[0] + Math.cos(ang) * len / 6, clamp(q[1] + Math.sin(ang) * len / 6 * 0.5, 6, barH + 22)]); } lines.push(pts); } });
      cracks.push({ x: x, y: y + 12, lines: lines, a: 1 });
      fx.push({ kind: "flash", x: x, y: y, t: 0, life: 0.25, r: big ? 200 : 130 }); for (var i = 0; i < (big ? 22 : 12); i++) dust.push({ x: x + rnd(-30, 30), y: y + rnd(-6, 16), vx: rnd(-220, 220), vy: rnd(-200, 120), t: 0, life: rnd(0.6, 1.6), s: rnd(1, 3), g: 500, chip: true });
      shake = Math.max(shake, big ? 0.9 : 0.6); tilt = { t: 0, a: (Math.random() < 0.5 ? -1 : 1) * (big ? 0.026 : 0.018) };
      if (logo) logo.style.transform = "translate(-3px,2px) rotate(-5deg)";
    }
    function stepWreck(dt) {
      if (!wreck) return; var k = restoring ? ease((restoring.t - 0.2) / 1.1) : 0;
      wreck.frags.forEach(function (f) {
        if (restoring) { if (!f.from) f.from = { x: f.x, y: f.y, rot: f.rot }; f.x = f.from.x * (1 - k); f.y = f.from.y * (1 - k); f.rot = f.from.rot * (1 - k); f.a = 1; }
        else if (f.mode === "fall") { f.vy += G * 0.8 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; var fl = deskY - f.oy - 5; if (f.y > fl) { f.y = fl; if (Math.abs(f.vy) < 240) f.mode = "rest"; else { f.vy *= -0.3; f.vx *= 0.6; f.vr *= 0.5; } } }
        else if (f.mode === "slide") { f.vy += 260 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; if (Math.abs(f.ox + f.x) > S.W * 1.6) f.mode = "gone"; }
        else if (f.mode === "hang") { f.rot += (f.rotTo + Math.sin(clock * 3 + f.ox) * 0.05 - f.rot) * Math.min(1, dt * 7); f.y += ((f.yTo || 0) - f.y) * Math.min(1, dt * 7); }
        if (wrecked && (f.mode === "still" || f.mode === "hang")) f.a = Math.max(0, f.a - dt * 1.2);      // once things settle the real bar shows through again
        var t = "translate(" + f.x.toFixed(1) + "px," + f.y.toFixed(1) + "px) rotate(" + f.rot.toFixed(3) + "rad)"; if (f.tf !== t) { f.el.style.transform = t; f.tf = t; }
        var op = f.a.toFixed(2); if (f.op !== op) { f.el.style.opacity = op; f.op = op; }
      });
      if (wrecked && mast && mast.classList.contains("wrecked") && wreck.frags.every(function (f) { return f.mode === "fall" || f.mode === "slide" || f.mode === "rest" || f.mode === "gone" || f.a <= 0.02; })) mast.classList.remove("wrecked");
      if (tilt) { tilt.t += dt; var a = tilt.t < 0.22 ? tilt.a * Math.sin(tilt.t / 0.22 * Math.PI) : 0; wreck.layer.style.transform = "rotate(" + a.toFixed(4) + "rad)"; if (tilt.t > 0.25) tilt = null; }
    }

    /* ---- escalation, all from the chair ---- */
    function find(ch) { for (var i = 0; i < letters.length; i++) if (letters[i].ch === ch && letters[i].state !== "held") return letters[i]; return letters[0]; }
    function fly(l, to, dur, sc, spin, arc) { l.state = "script"; l.t = 0; l.dur = dur; l.from = { x: l.x, y: l.y, rot: l.rot, sc: l.sc }; l.to = to; l.toSc = sc; l.spin = spin; l.arc = arc; l.hidden = false; }
    function loose(l, vx, vy, gf) { if (!l) return; l.state = "falling"; l.gf = gf; l.bounced = -1; l.vx = vx; l.vy = vy; l.vr = rnd(-6, 6); l.land = null; }
    function startSeq() {
      seq = { t: 0, did: {} }; job = null; track = null; wreck = buildWreck(); heatTo = 1; variant = (variant + 1 + ((Math.random() * 2) | 0)) % 3;
      root.setAttribute("data-state", "destruction"); hintText("Manual override."); announce("Manual override. The agent is breaking the interface.");
      monitor = ["TASK INTEGRITY: COMPROMISED", "RESPONSE: MANUAL OVERRIDE"];
      letters.forEach(function (l) { if (l.state === "home" || l.state === "cue") { l.state = "shiver"; l.t = 0; } else if (l.state === "held" || l.state === "magnet" || l.state === "slide") loose(l, 0, 0, 1); });
      rb.arms.forEach(function (a) { a.holding = false; });
    }
    function once(key, at) { if (seq.t >= at && !seq.did[key]) { seq.did[key] = 1; return true; } return false; }
    function stepSeq(dt) {
      var t = (seq.t += dt), a0 = rb.arms[0], a1 = rb.arms[1], sy = shoulder(1).y, slamX = homeX + U * 0.55, V = variant;
      // beat 1: it stops, raises its head toward the viewer, one hand grips the desk edge
      a0.tx = homeX - U * 0.7; a0.ty = deskY - U * 0.02; a0.wristTo = 0.9; a0.rollTo = 1; a0.curlTo = 0.85; a0.pinchTo = 0; a0.speed = 7; a0.typing = 0;
      a1.tx = homeX + U * 0.7; a1.ty = deskY - U * 0.02; a1.wristTo = 0.9; a1.rollTo = 1; a1.curlTo = 0.5; a1.pinchTo = 0; a1.speed = 7; a1.typing = 0;
      rb.leanTo = t < 0.9 ? -0.2 : 0.9; rb.yawTo = 0; rb.pitchTo = t < 0.9 ? -0.7 : 0.5;
      if (once("flash", 0.85)) fx.push({ kind: "screen", t: 0, life: 0.2 });
      // beat 2: the other hand comes up and slams the desk. The chair takes it, the monitor flickers, the mounted letters jump loose
      if (t > 0.9 && t < 1.3) { a1.tx = homeX + U * 0.75; a1.ty = sy - U * 0.9; a1.speed = 12; a1.wristTo = 0.3; a1.curlTo = 1; }
      if (t >= 1.3 && t < 1.8) { a1.tx = slamX; a1.ty = deskY - U * 0.02; a1.speed = 32; a1.wristTo = 0.9; a1.curlTo = 1; }
      if (once("slam", 1.38)) {
        shake = 1; slowT = 0.5; chair = 1; flicker = 0.7; fx.push({ kind: "shock", x: slamX, y: deskY, t: 0, life: 1 }); lamp.va += 5;
        for (var i = 0; i < 16; i++) dust.push({ x: slamX + rnd(-40, 40), y: deskY - 4, vx: rnd(-260, 260), vy: rnd(-260, -40), t: 0, life: rnd(0.7, 1.8), s: rnd(1, 2.4), g: 300 });
        letters.forEach(function (l, i) { if (l.state !== "shiver" && l.state !== "rest") return; var wgt = 0.75 + l.w / 60; loose(l, rnd(-30, 30) + (i % 3 === 0 ? rnd(60, 200) : 0), -rnd(140, 300) / wgt, wgt); l.land = clamp(l.hx + rnd(-60, 260), l.w, S.W - l.w); });
        tiles.concat(papers).forEach(function (o) { o.free = true; o.vx = (o.x - slamX) * rnd(1, 2) + rnd(-100, 100); o.vy = rnd(-500, -220); o.vr = rnd(-8, 8); });
      }
      // beat 3, by variant. A: sweep the desk, letters into PROJECTS and NEWS. B: flick the big R up into RESEARCH. C: underline hit, then a sweep.
      if (V === 1 || V === 2) {
        if (once("pick", 2.0)) { seq.R = letters.filter(function (l) { return l.state === "rest" || l.state === "falling" || l.state === "slide"; }).sort(function (p, q) { return Math.abs(p.x - homeX) - Math.abs(q.x - homeX); })[0] || find("R"); }
        if (seq.R && t >= 2.0 && t < 2.5) { aim(a1, seq.R.x, seq.R.y - 4 * Z); a1.speed = 9; a1.wristTo = 0.9; a1.pinchTo = 1; a1.curlTo = 0.7; rb.leanTo = 0.7; lookAt(seq.R.x, seq.R.y); }
        if (seq.R && once("hold", 2.45)) { seq.R.state = "inhand"; a1.holding = true; }
        if (seq.R && t >= 2.5 && t < 2.95) { a1.tx = homeX + U * 0.6; a1.ty = sy + U * 0.6; a1.wristTo = 0; a1.speed = 8; var tg = seq.t1 || label(V === 2 ? ["projects", "research"] : ["research", "projects", "join"]); if (tg) lookAt(tg.x, tg.y); }
        if (seq.R && t >= 2.95 && t < 3.3) { a1.tx = homeX + U * 0.9; a1.ty = sy - U * 1.7; a1.speed = 30; a1.pinchTo = t < 3.06 ? 1 : 0; a1.curlTo = 0.2; }
        if (seq.R && once("throw", 3.06)) { seq.t1 = label(V === 2 ? ["projects", "research"] : ["research", "projects", "join"]); var p = seq.t1 || { x: S.W * 0.6, y: 36 }; a1.holding = false; fly(seq.R, function () { return { x: p.x, y: p.y + (V === 2 ? 30 : 0) }; }, 0.45, 1.3, 12, U * 0.6); }
        if (seq.R && seq.R.state === "inhand") { var gr = grip(a1); seq.R.x = gr.x; seq.R.y = gr.y; seq.R.rot += (0.2 - seq.R.rot) * Math.min(1, dt * 8); seq.R.sc = 1.3; }
        if (seq.R && once("hit1", 3.52)) { slowT = 0.3; impact(seq.t1, true); seq.R.big = 1; loose(seq.R, rnd(-200, -60), -260, 0.9); seq.R.land = clamp(seq.R.x - rnd(120, 300), reach.x0 - 200, S.W - 40); if (V === 2 && seq.t1) spill(seq.t1); }
      }
      if (V === 0 || V === 2) {
        var s0 = V === 0 ? 2.0 : 3.7;
        if (t >= s0 && t < s0 + 0.9) { var k = ease((t - s0 - 0.1) / 0.7); a0.tx = homeX - U * 0.2 - k * U * 2.6; a0.ty = deskY - U * 0.08; a0.wristTo = 0.6; a0.rollTo = 1; a0.curlTo = 0.9; a0.speed = 22; rb.leanTo = 0.9; lookAt(a0.x, deskY);
          if (t > s0 + 0.1) { for (var s = 0; s < 2; s++) dust.push({ x: a0.x, y: deskY - 2, vx: rnd(-360, 60), vy: rnd(-300, -40), t: 0, life: rnd(0.2, 0.5), s: rnd(1, 2), g: 900, spark: true });
            letters.forEach(function (l) { if ((l.state === "rest" || l.state === "slide") && l.x < a0.x + U * 0.3 && l.x > a0.x - U * 0.4 && !l.swept) { l.swept = true; loose(l, rnd(-700, -300), rnd(-560, -220), 0.7); l.land = clamp(l.x - rnd(200, 500), 40, S.W - 40); } }); } }
        if (once("volley", s0 + 0.45)) { seq.shots = letters.filter(function (l) { return l.state !== "script" && l.state !== "inhand" && l !== seq.R; }).sort(function (p, q) { return Math.abs(p.x - homeX) - Math.abs(q.x - homeX); }).slice(0, 2); seq.t2 = label(["projects", "people"]); seq.t3 = label(["news", "resources"]); seq.shots.forEach(function (l, i) { var tg2 = i ? seq.t3 : seq.t2; if (tg2) fly(l, function () { return { x: tg2.x, y: tg2.y }; }, 0.5 + i * 0.15, 1.15, 10, U * 0.8); }); }
        if (once("hit2", s0 + 1.0)) { impact(seq.t2, false); loose(seq.shots[0], rnd(-160, 160), -220, 0.9); lamp.va += 3; }
        if (once("hit3", s0 + 1.15)) { impact(seq.t3, false); loose(seq.shots[1], rnd(-160, 160), -220, 0.9); }
      }
      if (once("card", 3.0)) card = { x: S.W + 120, y: deskY - 7, vx: -S.W * 1.1, rot: -0.1 };
      var end = V === 2 ? 5.4 : 4.6;
      if (t > end - 0.6) { rb.leanTo = 0.6; rb.pitchTo = 0.3; rb.yawTo = -0.3; }
      if (once("settle", end)) { wrecked = true; heatTo = 0.6; root.setAttribute("data-state", "aftermath"); hintText("Title system offline."); announce("Title system offline. Navigation surface damaged. Use Restart title system on the monitor to rebuild."); monitor = ["TITLE SYSTEM: OFFLINE", "NAV SURFACE: DAMAGED"]; showPanel(); }
    }
    function spill(lab) { if (!wreck || !lab) return; wreck.frags.forEach(function (f) { if (f.key === lab.key && f.line) { f.mode = "fall"; f.vx = f.line * rnd(60, 160); f.vy = rnd(-80, 40); f.vr = f.line * 4; } }); for (var i = 0; i < 6; i++) dust.push({ x: lab.x + rnd(-40, 40), y: lab.y + 14, vx: rnd(-60, 60), vy: rnd(40, 160), t: 0, life: rnd(1, 2.2), s: rnd(2, 4), g: 700, chip: true }); }
    function showPanel() { if (!panel) return; var mw = U * 1.7, mh = U * 1.05, my = deskY - mh - U * 0.22; var pw = Math.max(mw, 236); panel.style.left = (monX - pw / 2) + "px"; panel.style.top = my + "px"; panel.style.width = pw + "px"; panel.style.minHeight = mh + "px"; panel.hidden = false; var b = panel.querySelector("button"); if (b) b.focus({ preventScroll: true }); }
    function restore() {
      if (!wrecked || restoring) return; var sy0 = window.scrollY; restoring = { t: 0 }; wrecked = false; seq = null; heatTo = 0; warmTo = 0; coolTo = 1; if (panel) panel.hidden = true;
      root.setAttribute("data-state", "recovery"); hintText("Restoring interface."); announce("Restoring interface."); monitor = ["STATE: RESTORING", "observe · act · verify · adapt"]; if (card) card.leave = true;
      letters.forEach(function (l, i) { if (l.state === "home") return; l.state = "return"; l.t = -i * 0.025; l.from = { x: l.x, y: l.y, rot: l.rot, sc: l.sc }; l.hidden = false; l.swept = false; });
      tiles.concat(papers).forEach(function (o) { o.from = { x: o.x, y: o.y, rot: o.rot }; o.free = false; }); rb.arms.forEach(function (a) { a.holding = false; });
      window.scrollTo(window.scrollX, sy0); window.setTimeout(function () { var f = letters[0] && letters[0].btn; if (f && !f.disabled) f.focus({ preventScroll: true }); }, 2000);
    }
    function stepRestore(dt) {
      restoring.t += dt; var k = ease((restoring.t - 0.2) / 1.2);
      tiles.concat(papers).forEach(function (o) { o.x = o.from.x + (o.ox - o.from.x) * k; o.y = o.from.y + (o.oy - o.from.y) * k; o.rot = o.from.rot * (1 - k); });
      cracks.forEach(function (c) { c.a = 1 - k; });
      if (restoring.t > 1.9) { if (wreck) { wreck.layer.parentNode.removeChild(wreck.layer); wreck = null; } if (mast) mast.classList.remove("wrecked"); if (logo) logo.style.transform = ""; cracks = []; restoring = null; knocks = []; level = 0; coolTo = 0; root.setAttribute("data-state", "calm"); hintText("Tap a letter to knock it loose."); announce("Interface restored."); cueAt = 8; monitor = ["TASK: restore title", "observe · act · verify · adapt", "STATE: observing"]; }
    }

    /* ---- letters ---- */
    function puff(x, n) { for (var i = 0; i < n; i++) dust.push({ x: x + rnd(-10, 10), y: deskY - 2, vx: rnd(-100, 100), vy: rnd(-60, -10), t: 0, life: rnd(0.3, 0.7), s: rnd(1, 2.2), g: 60 }); }
    function stepLetters(dt) {
      letters.forEach(function (l) {
        if (l.state === "loose") { l.t += dt; l.rot = Math.sin(l.t * 40) * 0.06 * Math.min(1, l.t * 5); if (l.t > 0.22) { l.state = "falling"; l.vx = rnd(-40, 40); } }
        else if (l.state === "cue") { l.t += dt; var amp = l.t < 1.1 ? Math.min(1, l.t * 3) : Math.max(0, 1 - (l.t - 1.1) * 2); l.x = l.hx + Math.sin(l.t * 46) * 1.4 * amp; l.y = l.hy + Math.sin(l.t * 31) * 0.8 * amp; l.rot = Math.sin(l.t * 38) * 0.02 * amp; if (l.t > 1.7) lockIn(l); }
        else if (l.state === "shiver") { l.t += dt; l.x = l.hx + Math.sin(l.t * 50 + l.idx) * 1.6; l.y = l.hy + Math.min(6, l.t * 5); l.rot = Math.sin(l.t * 33 + l.idx) * 0.05; }
        else if (l.state === "falling") {
          l.vy += G * l.gf * dt; l.x += l.vx * dt; l.y += l.vy * dt; l.rot += l.vr * dt; if (l.y > deskY - 200) l.sc += ((l.big ? 1.25 : 1) - l.sc) * Math.min(1, dt * 3);
          if (l.x < l.w) { l.x = l.w; l.vx = Math.abs(l.vx) * 0.5; } else if (l.x > S.W - l.w) { l.x = S.W - l.w; l.vx = -Math.abs(l.vx) * 0.5; }
          if (l.y > restY(l) && l.vy > 0) {
            l.y = restY(l); puff(l.x, 3);
            if (l.bounced >= 1 || l.vy < 200) { l.vy = 0; l.vr = 0; l.rot = clamp(((l.rot + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI, -0.5, 0.5); l.state = "slide"; l.slide = spare(l, l.land !== null && l.land !== undefined ? l.land : clamp(l.x, reach.x0, reach.x1)); l.t = 0; l.sx = l.x; }
            else { l.bounced++; l.vy *= -0.34; l.vx *= 0.5; l.vr *= 0.4; fx.push({ kind: "tap", x: l.x, y: deskY, t: 0, life: 0.25 }); if (Math.abs(l.vy) > 200) fx.push({ kind: "flash", x: l.x, y: deskY - 4, t: 0, life: 0.12, r: 24 }); }
          }
        } else if (l.state === "slide") {        // it skids along the desk until it stops, which is how it ends up within reach
          l.t += dt; var dist = l.slide - l.sx, dur = clamp(Math.abs(dist) / 1400, 0.12, 0.4), u = clamp(l.t / dur, 0, 1), e = 1 - (1 - u) * (1 - u); l.x = l.sx + dist * e; l.y = restY(l); l.rot *= 1 - Math.min(1, dt * 3); l.sc += (1 - l.sc) * Math.min(1, dt * 3);
          if (Math.abs(dist) > 30 && u < 1 && Math.random() < dt * 20) dust.push({ x: l.x, y: deskY - 2, vx: -dist / Math.abs(dist) * rnd(20, 80), vy: rnd(-40, -5), t: 0, life: rnd(0.2, 0.5), s: 1.5, g: 60 });
          if (u >= 1) { l.state = "rest"; l.x = l.slide; l.slide = undefined; }
        } else if (l.state === "rest") { l.y = restY(l); l.sc += (1 - l.sc) * Math.min(1, dt * 3); }
        else if (l.state === "magnet") { l.t += dt; var k = l.t / l.dur, e2 = k >= 1 ? 1 : 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.05; l.x = l.from.x + (l.hx - l.from.x) * e2; l.y = l.from.y + (l.hy - l.from.y) * e2; l.rot = l.from.rot * (1 - e2); l.sc = 1; if (k >= 1) lockIn(l); }
        else if (l.state === "script") { l.t += dt; var uu0 = clamp(l.t / l.dur, 0, 1), to = l.to(), uu = uu0 * uu0 * (3 - 2 * uu0); l.x = l.from.x + (to.x - l.from.x) * uu; l.y = l.from.y + (to.y - l.from.y) * uu - Math.sin(uu0 * Math.PI) * l.arc; l.rot = l.from.rot + l.spin * uu0; l.sc = l.from.sc + (l.toSc - l.from.sc) * uu0; }
        else if (l.state === "return") { l.t += dt; if (l.t < 0) return; var q = ease(l.t / 1.0); l.x = l.from.x + (l.hx - l.from.x) * q; l.y = l.from.y + (l.hy - l.from.y) * q - Math.sin(q * Math.PI) * 40; l.rot = l.from.rot * (1 - q); l.sc = l.from.sc + (1 - l.from.sc) * q; if (l.t >= 1.0) lockIn(l); }
      });
    }
    function stepThings(dt) {
      tiles.concat(papers).forEach(function (o) { if (!o.free) return; o.vy += G * 0.7 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt; if (o.y > deskY - 4 && o.vy > 0) { o.y = deskY - 4; if (o.vy < 200) { o.vy = 0; o.vx *= 0.8; o.vr *= 0.8; if (Math.abs(o.vx) < 8) { o.vx = 0; o.vr = 0; } } else { o.vy *= -0.28; o.vx *= 0.6; o.vr *= 0.5; } } o.x = clamp(o.x, 10, S.W - 10); });
      if (card) { card.x += card.vx * dt; if (card.leave) card.vx = -S.W; else card.vx *= Math.pow(0.12, dt); if (card.x < -300) card = null; }
      dust.forEach(function (d) { d.t += dt; d.vy += d.g * dt; d.vx *= Math.pow(0.4, dt); d.x += d.vx * dt; d.y += d.vy * dt; if (!d.spark && d.y > deskY - 2 && d.vy > 0) { d.y = deskY - 2; d.vy = 0; } }); dust = dust.filter(function (d) { return d.t < d.life; }); if (dust.length > 200) dust.splice(0, dust.length - 200);
      fx.forEach(function (f) { f.t += dt; }); fx = fx.filter(function (f) { return f.t < f.life; });
      lamp.va += (-lamp.a * 26 - lamp.va * 0.9) * dt; lamp.a += lamp.va * dt; chair = Math.max(0, chair - dt * 2.5);
    }

    /* ---- the body: seated, head leads, arms on springs, wrists with pitch and roll ---- */
    function stepRobot(dt) {
      if (seq) stepSeq(dt);
      else {
        if (!job && !wrecked && !restoring) job = nextJob();
        if (job) stepJob(dt);
        else if (wrecked) { track = null; rb.leanTo = 0.55; rb.yawTo = -0.25; rb.pitchTo = 0.25; rb.arms.forEach(function (a) { a.tx = homeX + a.side * U * 0.72; a.ty = deskY - U * 0.02; a.wristTo = 0.9; a.rollTo = 1; a.curlTo = 0.85; a.pinchTo = 0; a.speed = 4; a.typing = 0; }); }
        else { track = null; stepWork(dt); }
      }
      rb.lean += (rb.leanTo - rb.lean) * Math.min(1, dt * 4.5); rb.yaw += (rb.yawTo - rb.yaw) * Math.min(1, dt * 6); rb.pitch += (rb.pitchTo - rb.pitch) * Math.min(1, dt * 6);
      rb.arms.forEach(function (a) {
        var sh = shoulder(a.side), K = a.speed * a.speed * 3.2, C = 2 * Math.sqrt(K) * 0.85, n = 3, h = dt / n;
        for (var s = 0; s < n; s++) { a.vx += ((a.tx - a.x) * K - a.vx * C) * h; a.vy += ((a.ty - a.y) * K - a.vy * C) * h; a.x += a.vx * h; a.y += a.vy * h; }
        a.y = Math.min(a.y, deskY - 2 * Z);
        var dx = a.x - sh.x, dy = a.y - sh.y, d = Math.hypot(dx, dy) || 1, max = L1 + L2 - 2, min = Math.abs(L1 - L2) + 6;
        if (d > max) { a.x = sh.x + dx / d * max; a.y = sh.y + dy / d * max; dx = a.x - sh.x; dy = a.y - sh.y; d = max; } else if (d < min) { a.x = sh.x + dx / d * min; a.y = sh.y + dy / d * min; dx = a.x - sh.x; dy = a.y - sh.y; d = min; }
        var fs = clamp(d / ((L1 + L2) * 0.88), 0.56, 1); a.f = (a.f || 1) + (fs - (a.f || 1)) * Math.min(1, dt * 10); var l1 = L1 * a.f, l2 = L2 * a.f;
        var b = Math.atan2(dy, dx), cs = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), bend = Math.acos(cs);
        var o1 = Math.cos(b + bend) * a.side + Math.sin(b + bend) * 0.3, o2 = Math.cos(b - bend) * a.side + Math.sin(b - bend) * 0.3; if (!a.sign) a.sign = o1 > o2 ? 1 : -1; if (a.sign > 0 ? o2 > o1 + 0.25 : o1 > o2 + 0.25) a.sign = -a.sign;
        var want = b + bend * a.sign, exT = sh.x + Math.cos(want) * l1, eyT = sh.y + Math.sin(want) * l1; if (!a.ex && !a.ey) { a.ex = exT; a.ey = eyT; }
        a.ex += (exT - a.ex) * Math.min(1, dt * 18); a.ey += (eyT - a.ey) * Math.min(1, dt * 18); var el = Math.hypot(a.ex - sh.x, a.ey - sh.y) || 1; a.ex = sh.x + (a.ex - sh.x) / el * l1; a.ey = sh.y + (a.ey - sh.y) / el * l1;
        var fl = Math.hypot(a.x - a.ex, a.y - a.ey) || 1; a.dx = (a.x - a.ex) / fl; a.dy = (a.y - a.ey) / fl;
        var fa = Math.atan2(a.dy, a.dx), flatAng = a.side > 0 ? 0 : Math.PI, wantW = flatAng - fa; while (wantW > Math.PI) wantW -= 6.2832; while (wantW < -Math.PI) wantW += 6.2832;
        a.wrist += (clamp(wantW, -1.4, 1.4) * a.wristTo - a.wrist) * Math.min(1, dt * 9); a.roll += (a.rollTo - a.roll) * Math.min(1, dt * 7); a.hand = fa + a.wrist;
        a.curl += (a.curlTo - a.curl) * Math.min(1, dt * 12); a.pinch += (a.pinchTo - a.pinch) * Math.min(1, dt * 12);
      });
    }

    /* ---- drawing ---- */
    function metal(ctx, x0, y0, x1, y1, dark) { var g = ctx.createLinearGradient(x0, y0, x1, y1); if (dark) { g.addColorStop(0, "#3a3f48"); g.addColorStop(0.5, "#23272e"); g.addColorStop(1, "#111418"); } else { g.addColorStop(0, "#cfd4db"); g.addColorStop(0.45, "#8c939e"); g.addColorStop(1, "#4a505a"); } return g; }
    function limb(ctx, name, sx, sy, ang, natural, f) { var r = RIG[name], im = IMG[name]; if (!im.complete || !im.naturalWidth) return; ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang); ctx.scale(f, 1); ctx.rotate(-natural); ctx.drawImage(im, (r.x - r.px) * Z, (r.y - r.py) * Z, r.w * Z, r.h * Z); ctx.restore(); }
    function piece(ctx, name, sx, sy, rot) { var r = RIG[name], im = IMG[name]; if (!im.complete || !im.naturalWidth) return; ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot); ctx.drawImage(im, (r.x - r.px) * Z, (r.y - r.py) * Z, r.w * Z, r.h * Z); ctx.restore(); }
    function bone(ctx, x0, y0, x1, y1, w0, w1) {
      var dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
      ctx.beginPath(); ctx.moveTo(x0 + nx * w0, y0 + ny * w0); ctx.lineTo(x1 + nx * w1, y1 + ny * w1); ctx.lineTo(x1 - nx * w1, y1 - ny * w1); ctx.lineTo(x0 - nx * w0, y0 - ny * w0); ctx.closePath();
      var g = ctx.createLinearGradient(x0 + nx * w0, y0 + ny * w0, x0 - nx * w0, y0 - ny * w0); g.addColorStop(0, "#b9c0ca"); g.addColorStop(0.5, "#7d8591"); g.addColorStop(1, "#3b414b"); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = "#07090d"; ctx.stroke();
    }
    function knuckle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = "#14181f"; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(180,190,204,.5)"; ctx.stroke(); }
    function finger(ctx, x, y, ang, c, k, w) {
      c = clamp(c, 0, 1.05); var a1 = ang + c * 0.95, x1 = x + Math.cos(a1) * 19 * k, y1 = y + Math.sin(a1) * 19 * k, a2 = a1 + c * 1.15, x2 = x1 + Math.cos(a2) * 15 * k, y2 = y1 + Math.sin(a2) * 15 * k, a3 = a2 + c * 0.85;
      bone(ctx, x, y, x1, y1, w, w * 0.88); bone(ctx, x1, y1, x2, y2, w * 0.86, w * 0.74); bone(ctx, x2, y2, x2 + Math.cos(a3) * 12 * k, y2 + Math.sin(a3) * 12 * k, w * 0.72, w * 0.5); knuckle(ctx, x, y, w * 0.55); knuckle(ctx, x1, y1, w * 0.48); knuckle(ctx, x2, y2, w * 0.4);
    }
    // The hand, in source-image units around the wrist joint. +x runs out of the wrist along the hand.
    // Roll 1 is palm down on the desk (seen thin, from above); roll 0 is palm toward the camera.
    function hand(ctx, a, part) {
      var c = a.curl, p = a.pinch, sq = 0.35 + 0.65 * (1 - a.roll), i;
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.hand); ctx.scale(Z, Z * a.side);
      if (part !== "front") {
        ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, 6.2832); ctx.fillStyle = "#1a1e26"; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = "#05070a"; ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, 6.2832); ctx.strokeStyle = "rgba(190,200,214,.6)"; ctx.lineWidth = 1; ctx.stroke();
        var tb = -0.55 + (1 - a.roll) * 0.35, ta = tb - c * 0.5 - p * 0.55, tx1 = 9 + Math.cos(ta) * 17, ty1 = 12 * sq + 3 + Math.sin(ta) * 17 * sq, ta2 = ta - c * 0.7 - p * 0.9;
        bone(ctx, 9, 12 * sq + 3, tx1, ty1, 5.2, 4.4); bone(ctx, tx1, ty1, tx1 + Math.cos(ta2) * 13, ty1 + Math.sin(ta2) * 13 * sq, 4.2, 3); knuckle(ctx, tx1, ty1, 2.4);
        ctx.beginPath(); ctx.moveTo(6, -13 * sq); ctx.lineTo(32, -15 * sq); ctx.quadraticCurveTo(37, 0, 33, 13 * sq); ctx.lineTo(8, 13 * sq); ctx.quadraticCurveTo(3, 0, 6, -13 * sq); ctx.closePath();
        var pg = ctx.createLinearGradient(0, -14, 0, 14); pg.addColorStop(0, "#3d434c"); pg.addColorStop(0.5, "#22262d"); pg.addColorStop(1, "#0f1217"); ctx.fillStyle = pg; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = "#05070a"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(12, -9 * sq); ctx.lineTo(29, -10 * sq); ctx.lineTo(30, 8 * sq); ctx.lineTo(12, 7 * sq); ctx.closePath(); ctx.fillStyle = "rgba(170,178,190,.22)"; ctx.fill();
      }
      if (part !== "back") for (i = 3; i >= 0; i--) {
        var by = (-11.5 + i * 7.6) * sq, k = i === 0 ? 0.95 : i === 1 ? 1.05 : i === 2 ? 1 : 0.82, w = 4.6 - i * 0.25;
        var cc = i === 0 ? (p > 0.5 ? 0.55 * p + c * 0.35 : c) : c + p * 0.35;
        if (a.typing) cc = c + Math.max(0, Math.sin(clock * 12 + i * 2.1 + a.side)) * 0.18 * (i === 1 || i === 2 ? 1 : 0.4);
        finger(ctx, 33, by, 0.06 * (i - 1.5) * (1 - cc), cc, k, w);
      }
      ctx.restore();
    }
    function drawBody(ctx) {
      var h = hip(), r = leanRot();
      ctx.save(); ctx.translate(homeX, h.y); ctx.fillStyle = "#0b0d11"; ctx.fillRect(-U * 0.62, -U * 2.35 + chair * 4, U * 1.24, U * 2.4); ctx.fillStyle = "#14171d"; ctx.fillRect(-U * 0.54, -U * 2.28 + chair * 4, U * 1.08, U * 0.5); ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fillRect(-U * 0.62, -U * 2.35 + chair * 4, U * 1.24, 2); ctx.restore();
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(r); ctx.translate(-h.x, -h.y);
      piece(ctx, "body", h.x, h.y, 0);
      ctx.save(); ctx.globalCompositeOperation = "source-atop"; var mg = ctx.createLinearGradient(h.x - 140 * Z, h.y - 300 * Z, h.x + 140 * Z, h.y - 60 * Z); mg.addColorStop(0, "rgba(22,26,34,.18)"); mg.addColorStop(0.5, "rgba(22,26,34,.34)"); mg.addColorStop(1, "rgba(22,26,34,.2)"); ctx.fillStyle = mg; ctx.fillRect(h.x - 150 * Z, h.y - 320 * Z, 300 * Z, 280 * Z); ctx.restore();
      var hp = headPos(); piece(ctx, "head", hp.x + rb.yaw * 6 * Z, hp.y + Math.max(0, rb.pitch) * 6 * Z, rb.yaw * 0.16 + rb.pitch * 0.06 - r * 0.5 + Math.sin(clock * 0.7) * 0.006);
      ctx.restore();
    }
    function drawArms(ctx, behind) {
      rb.arms.forEach(function (a) {
        if ((a.y > deskY + 6 * Z) !== behind) return;
        var sh = shoulder(a.side), n = NAT[a.side], up = a.side < 0 ? "armL1" : "armR1", lo = a.side < 0 ? "armL2" : "armR2", g = grip(a);
        if (!behind && a.y > deskY - U * 0.5) { ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.ellipse(g.x - 6 * Z, deskY + 2, 40 * Z, 5 * Z, 0, 0, 6.2832); ctx.fill(); }
        limb(ctx, up, sh.x, sh.y, Math.atan2(a.ey - sh.y, a.ex - sh.x), n.u, a.f || 1);
        limb(ctx, lo, a.ex, a.ey, Math.atan2(a.y - a.ey, a.x - a.ex), n.f, a.f || 1);
        ctx.beginPath(); ctx.arc(a.ex, a.ey, 11 * Z, 0, 6.2832); ctx.fillStyle = "#12161d"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#05070a"; ctx.stroke(); ctx.beginPath(); ctx.arc(a.ex, a.ey, 5.5 * Z, 0, 6.2832); ctx.strokeStyle = "rgba(190,200,214,.55)"; ctx.lineWidth = 1; ctx.stroke();
        hand(ctx, a, behind ? "all" : a.holding ? "front" : "all");
      });
    }
    function lightRgb() { var w = warm * (1 - heat); return [Math.round(255 - cool * 60), Math.round(236 - heat * 120 - w * 50 - cool * 8), Math.round(214 - heat * 140 - w * 120 + cool * 39)].join(","); }
    function drawDesk(ctx) {
      var rgb = lightRgb(), flick = flicker > 0 ? 0.55 + Math.random() * 0.45 : 1, i;
      var tg = ctx.createLinearGradient(0, deskY, 0, deskY + U * 0.22); tg.addColorStop(0, "#2a2f38"); tg.addColorStop(1, "#151920"); ctx.fillStyle = tg; ctx.fillRect(0, deskY, S.W, U * 0.22);
      var pool = ctx.createRadialGradient(homeX, deskY, 0, homeX, deskY, S.W * 0.4); pool.addColorStop(0, "rgba(" + rgb + "," + (0.3 * flick).toFixed(3) + ")"); pool.addColorStop(1, "rgba(" + rgb + ",0)"); ctx.fillStyle = pool; ctx.fillRect(0, deskY, S.W, U * 0.22);
      ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.fillRect(0, deskY, S.W, 1.2);
      var fg = ctx.createLinearGradient(0, deskY + U * 0.22, 0, S.H); fg.addColorStop(0, "#12161d"); fg.addColorStop(1, "#07090d"); ctx.fillStyle = fg; ctx.fillRect(0, deskY + U * 0.22, S.W, S.H - deskY); ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(0, deskY + U * 0.22, S.W, 3);
      var mw = U * 1.7, mh = U * 1.05, my = deskY - mh - U * 0.22; ctx.fillStyle = "#0a0c10"; ctx.fillRect(monX - 4, deskY - U * 0.24, 8, U * 0.24); ctx.fillRect(monX - U * 0.3, deskY - 4, U * 0.6, 4);
      ctx.fillStyle = "#06080b"; ctx.fillRect(monX - mw / 2, my, mw, mh); ctx.lineWidth = 2; ctx.strokeStyle = "#23272e"; ctx.strokeRect(monX - mw / 2, my, mw, mh);
      if (flicker > 0 && Math.random() < 0.5) { ctx.fillStyle = "rgba(255,140,120,.08)"; ctx.fillRect(monX - mw / 2, my, mw, mh); }
      var joined = monitor.join(" "), hot = joined.indexOf("OVERRIDE") >= 0 || joined.indexOf("OFFLINE") >= 0, amber = joined.indexOf("INTERRUPTION") >= 0; ctx.font = "600 " + Math.max(8, U * 0.085).toFixed(1) + "px ui-monospace, Consolas, monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      if (!(wrecked && panel && !panel.hidden)) monitor.forEach(function (line, n) { var dimLine = line.indexOf("·") >= 0; ctx.fillStyle = dimLine ? "rgba(170,182,196,.45)" : hot ? "rgba(255,120,110,.95)" : amber ? "rgba(255,196,120,.95)" : cool > 0.3 ? "rgba(150,200,255,.9)" : "rgba(170,182,196,.8)"; ctx.fillText(line, monX - mw / 2 + U * 0.1, my + U * (0.24 + n * 0.17)); });
      ctx.fillStyle = "#0a0c10"; ctx.fillRect(kbX - U * 0.62, deskY - U * 0.06, U * 1.24, U * 0.06); ctx.fillStyle = "rgba(200,208,220,.13)"; for (i = 0; i < 14; i++) { ctx.fillRect(kbX - U * 0.58 + i * U * 0.084, deskY - U * 0.05, U * 0.06, U * 0.02); }
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(trayX - U * 0.1, deskY - U * 0.16, U * 1.05, U * 0.16); ctx.strokeStyle = "rgba(190,198,210,.45)"; ctx.lineWidth = 1.5; ctx.strokeRect(trayX - U * 0.1, deskY - U * 0.16, U * 1.05, U * 0.16);
      ctx.save(); ctx.translate(lampX, deskY); ctx.fillStyle = "#0a0c10"; ctx.fillRect(-U * 0.16, -5, U * 0.32, 5); ctx.strokeStyle = "#2b3038"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-U * 0.25, -U * 0.95); ctx.stroke();
      ctx.translate(-U * 0.25, -U * 0.95); ctx.rotate(lamp.a * 0.5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-U * 0.5, -U * 0.22); ctx.stroke(); ctx.translate(-U * 0.5, -U * 0.22); ctx.rotate(lamp.a);
      ctx.beginPath(); ctx.moveTo(-U * 0.06, 0); ctx.lineTo(U * 0.06, 0); ctx.lineTo(U * 0.2, U * 0.2); ctx.lineTo(-U * 0.2, U * 0.2); ctx.closePath(); ctx.fillStyle = "#1b1f26"; ctx.fill(); ctx.stroke();
      var lc = ctx.createLinearGradient(0, U * 0.2, 0, U * 1.2); lc.addColorStop(0, "rgba(" + rgb + "," + (0.2 * flick).toFixed(3) + ")"); lc.addColorStop(1, "rgba(" + rgb + ",0)"); ctx.fillStyle = lc; ctx.beginPath(); ctx.moveTo(-U * 0.2, U * 0.2); ctx.lineTo(U * 0.2, U * 0.2); ctx.lineTo(U * 0.75, U * 1.2); ctx.lineTo(-U * 0.75, U * 1.2); ctx.closePath(); ctx.fill(); ctx.restore();
      papers.forEach(function (p) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); for (var n = 0; n < p.n; n++) { ctx.fillStyle = n % 2 ? "#cfcabf" : "#e4dfd3"; ctx.fillRect(-p.w / 2 + n * 1.5, -3 - n * 2.2, p.w, 2.4); } ctx.restore(); });
      tiles.forEach(function (t) { var s = U * 0.17; ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot); ctx.fillStyle = metal(ctx, -s / 2, -s / 2, s / 2, s / 2, false); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.strokeStyle = "#05070a"; ctx.lineWidth = 1; ctx.strokeRect(-s / 2, -s / 2, s, s); ctx.fillStyle = "#15181d"; ctx.font = "800 " + (s * 0.72).toFixed(1) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t.c, 0, 1); ctx.restore(); });
      if (card) { ctx.save(); ctx.translate(card.x, card.y); ctx.rotate(card.rot); ctx.fillStyle = "#e4dfd3"; ctx.beginPath(); ctx.moveTo(-U * 0.75, -U * 0.16); ctx.lineTo(U * 0.7, -U * 0.16); ctx.lineTo(U * 0.62, -U * 0.04); ctx.lineTo(U * 0.74, U * 0.06); ctx.lineTo(U * 0.66, U * 0.16); ctx.lineTo(-U * 0.75, U * 0.16); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#a3261f"; ctx.font = "800 " + (U * 0.13).toFixed(1) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("TASK CANCELLED", -U * 0.65, 1); ctx.restore(); }
      if (track) { var g = ctx.createRadialGradient(track.x, deskY, 4, track.x, deskY, 80 * Z); g.addColorStop(0, "rgba(255,244,225,.24)"); g.addColorStop(1, "rgba(255,244,225,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(track.x, deskY + 2, 80 * Z, 20 * Z, 0, 0, 6.2832); ctx.fill(); }
    }
    function drawLight(ctx) {
      var lx = homeX - U * 0.4, rgb = lightRgb(), fl = flicker > 0 ? 0.5 + Math.random() * 0.5 : 1;
      var hard = ctx.createLinearGradient(0, -10, 0, deskY); hard.addColorStop(0, "rgba(" + rgb + "," + (0.2 * fl).toFixed(3) + ")"); hard.addColorStop(1, "rgba(" + rgb + "," + (0.05 * fl).toFixed(3) + ")");
      for (var i = 0; i < 3; i++) { ctx.fillStyle = hard; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.moveTo(lx - 18, -10); ctx.lineTo(lx + 18, -10); ctx.lineTo(lx + S.W * (0.2 + i * 0.02), deskY); ctx.lineTo(lx - S.W * (0.2 + i * 0.02), deskY); ctx.closePath(); ctx.fill(); } ctx.globalAlpha = 1;
      var soft = ctx.createRadialGradient(lx, deskY * 0.55, 10, lx, deskY * 0.55, S.W * 0.42); soft.addColorStop(0, "rgba(" + rgb + "," + (0.07 * fl).toFixed(3) + ")"); soft.addColorStop(1, "rgba(" + rgb + ",0)"); ctx.fillStyle = soft; ctx.fillRect(0, 0, S.W, deskY);
    }

    var api = {
      step: function (dt) {
        slowT = Math.max(0, slowT - dt); timeScale += ((slowT > 0 ? 0.3 : 1) - timeScale) * Math.min(1, dt * (slowT > 0 ? 18 : 5)); dt *= timeScale;
        clock += dt; sinceMeasure += dt; if (sinceMeasure > 0.5) { sinceMeasure = 0; measure(); }
        knocks = knocks.filter(function (t) { return clock - t < 6; }); level = knocks.length >= 5 ? 2 : knocks.length >= 3 ? 1 : 0;
        if (!seq && !wrecked && !restoring) {
          var st = level >= 2 ? "warning" : "calm"; if (root.getAttribute("data-state") !== st) { root.setAttribute("data-state", st); if (st === "warning") announce("Repeated interruption detected."); }
          if (level === 1) hintText("Recovery queue building."); else if (level >= 2) hintText("Repeated interruption detected.");
          warmTo = level >= 2 ? 1 : 0; monitor = level >= 2 ? ["STATE: REPEATED INTERRUPTION", "TASK: restore title"] : ["TASK: restore title", "observe · act · verify · adapt", job ? (job.phase === "notice" ? "STATE: observing" : job.phase === "release" ? "STATE: verifying" : "STATE: acting") : "STATE: observing"]; if (level >= 2 && Math.random() < dt * 2) flicker = 0.25;
          if (cue) { cue.t += dt; if (cue.t > 2.2) cue = null; } else if (!job && cueAt > 0) { cueAt -= dt; if (cueAt <= 0 && letters.every(function (l) { return l.state === "home"; })) { var c = letters[(Math.random() * letters.length) | 0]; c.state = "cue"; c.t = 0; cue = { l: c, t: 0 }; lookAt(c.hx, c.hy); } }
        }
        flicker = Math.max(0, flicker - dt); heat += (heatTo - heat) * Math.min(1, dt * 4); warm += (warmTo - warm) * Math.min(1, dt * 3); cool += (coolTo - cool) * Math.min(1, dt * 2.5);
        if (restoring) stepRestore(dt);
        stepLetters(dt); stepRobot(dt); stepThings(dt); stepWreck(dt);
        shake = Math.max(0, shake - dt * 2.2); root.style.setProperty("--shx", (shake ? (Math.random() - 0.5) * 12 * shake : 0).toFixed(1) + "px"); root.style.setProperty("--shy", (shake ? (Math.random() - 0.5) * 9 * shake : 0).toFixed(1) + "px");
        var over = S.inside && !seq && !wrecked && letters.some(function (l) { return l.state === "home" && Math.abs(S.mx - l.hx) < l.w / 2 + 2 && Math.abs(S.my - l.hy) < l.h / 2; }); root.style.cursor = over ? "pointer" : "";
      },
      settle: function () {},
      click: function (x, y, S, idx) {
        if (seq || wrecked || restoring) return; var hit = null, bd = 1e9;
        if (idx !== undefined) hit = letters[idx]; else letters.forEach(function (l) { var d = Math.hypot(x - l.hx, y - l.hy); if (l.state === "home" && Math.abs(x - l.hx) < l.w / 2 + 3 && Math.abs(y - l.hy) < l.h / 2 && d < bd) { bd = d; hit = l; } });
        if (!knock(hit)) return; knocks.push(clock); cueAt = 0; cue = null;
        if (knocks.length >= 7) startSeq();
      },
      act: function (name) { if (name === "restore") restore(); },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H); sync();
        var bg = ctx.createLinearGradient(0, 0, 0, S.H); bg.addColorStop(0, "#05070b"); bg.addColorStop(1, "#090c12"); ctx.fillStyle = bg; ctx.fillRect(0, 0, S.W, S.H);
        drawLight(ctx);
        ctx = mctx; ctx.clearRect(0, 0, S.W, S.H);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, S.W, deskY + 1); ctx.clip(); drawBody(ctx); drawArms(ctx, true); ctx.restore(); drawDesk(ctx);
        rb.arms.forEach(function (a) { if (a.holding && a.y <= deskY + 6 * Z) hand(ctx, a, "back"); });
        letters.forEach(function (l) { if (l.state === "home" || l.hidden) return; var hgt = Math.max(0, deskY - l.y), a = clamp(0.5 - hgt / 500, 0, 0.5); if (a > 0.02) { ctx.fillStyle = "rgba(0,0,0," + a.toFixed(3) + ")"; ctx.beginPath(); ctx.ellipse(l.x, deskY + 3, l.w * (0.55 + hgt / 600) * l.sc, 3.5, 0, 0, 6.2832); ctx.fill(); } });
        fx.forEach(function (f) { if (f.kind === "shock") { var k = f.t / f.life; ctx.beginPath(); ctx.ellipse(f.x, f.y + 2, S.W * 0.6 * k, U * 0.16 * k + 3, 0, 0, 6.2832); ctx.lineWidth = 3 * (1 - k) + 0.5; ctx.strokeStyle = "rgba(255,235,220," + (0.8 * (1 - k)).toFixed(3) + ")"; ctx.stroke(); } else if (f.kind === "tap") { ctx.fillStyle = "rgba(255,255,255," + (0.35 * (1 - f.t / f.life)).toFixed(3) + ")"; ctx.fillRect(f.x - 14, f.y - 1, 28, 2); } });

        var t = tctx; t.clearRect(0, 0, S.W, S.H);
        letters.forEach(function (l) { if (l.state === "home" || l.state === "cue" || l.state === "shiver" || seq || wrecked) return; var on = job && job.l === l; t.lineWidth = on ? 1.5 : 1; t.setLineDash([3, 5]); t.strokeStyle = on ? "rgba(255,244,225," + (0.55 + Math.sin(clock * 6) * 0.25).toFixed(2) + ")" : "rgba(255,244,225,.22)"; t.strokeRect(l.hx - l.w / 2 + 1, l.hy - l.h * 0.36, l.w - 2, l.h * 0.72); t.setLineDash([]); });
        letters.forEach(function (l) { if (l.px !== undefined && !l.hidden && (l.state === "falling" || l.state === "script")) { var sp = Math.hypot(l.x - l.px, l.y - l.py); if (sp > 9) { var g = t.createLinearGradient(l.px, l.py, l.x, l.y); g.addColorStop(0, "rgba(235,231,222,0)"); g.addColorStop(1, "rgba(235,231,222," + clamp(sp / 60, 0, 0.45).toFixed(3) + ")"); t.strokeStyle = g; t.lineWidth = l.h * 0.5 * l.sc; t.lineCap = "round"; t.beginPath(); t.moveTo(l.px - (l.x - l.px) * 1.5, l.py - (l.y - l.py) * 1.5); t.lineTo(l.x, l.y); t.stroke(); } } l.px = l.x; l.py = l.y; });
        drawArms(t, false);
        cracks.forEach(function (c) { t.lineCap = "round"; t.lineJoin = "round"; c.lines.forEach(function (pts) { [[3, "rgba(0,0,0," + (0.5 * c.a).toFixed(3) + ")", 1], [1.1, "rgba(240,244,252," + (0.7 * c.a).toFixed(3) + ")", 0]].forEach(function (pass) { t.beginPath(); pts.forEach(function (q, i) { if (i) t.lineTo(q[0], q[1] + pass[2]); else t.moveTo(q[0], q[1] + pass[2]); }); t.lineWidth = pass[0]; t.strokeStyle = pass[1]; t.stroke(); }); }); t.beginPath(); t.ellipse(c.x, c.y, 22, 7, 0, 0, 6.2832); t.fillStyle = "rgba(0,0,0," + (0.5 * c.a).toFixed(3) + ")"; t.fill(); });
        dust.forEach(function (d) { var a = 1 - d.t / d.life; t.fillStyle = d.spark ? "rgba(255,210,140," + a.toFixed(3) + ")" : d.chip ? "rgba(225,232,245," + a.toFixed(3) + ")" : "rgba(210,205,195," + (a * 0.6).toFixed(3) + ")"; t.fillRect(d.x, d.y, d.s, d.s); });
        if (wrecked || seq) for (var i = 0; i < 20; i++) { t.fillStyle = "rgba(220,215,205,.16)"; t.fillRect((i * 173.3 + clock * (6 + i % 5)) % S.W, (i * 97.7 + Math.sin(clock * 0.3 + i) * 40 + clock * 3) % deskY, 1.5, 1.5); }
        fx.forEach(function (f) { var k = f.t / f.life; if (f.kind === "ring") { t.beginPath(); t.arc(f.x, f.y, f.r * (0.6 + k), 0, 6.2832); t.lineWidth = 1.5; t.strokeStyle = "rgba(235,240,250," + (0.8 * (1 - k)).toFixed(3) + ")"; t.stroke(); } else if (f.kind === "slot") { var l = f.l; t.lineWidth = 2; t.strokeStyle = "rgba(255,244,225," + (0.9 * (1 - k)).toFixed(3) + ")"; t.strokeRect(l.hx - l.w / 2 + 1, l.hy - l.h * 0.36, l.w - 2, l.h * 0.72); } else if (f.kind === "flash") { var g = t.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, "rgba(255,245,235," + (0.95 * (1 - k)).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,200,170,0)"); t.fillStyle = g; t.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); } else if (f.kind === "screen") { t.fillStyle = "rgba(255,225,215," + (0.5 * (1 - k)).toFixed(3) + ")"; t.fillRect(0, 0, S.W, S.H); } });
      }
    };
    root.__knock = function (idx) { api.click(0, 0, S, idx); };
    return api;
  };
})();
