/* South Artificial Intelligence Laboratory: the Agents hero.
   One interaction: letters fall off the title and the robot puts them back.
   A humanoid robot works at a desk under one light. A fallen letter makes it look, stand,
   walk behind the desk, pick the letter up and set it back, where it locks in with a small
   magnetic pull. Knock letters loose faster than it can cope (eight or more in a few
   seconds) and it stops being patient: it slams the desk, the title comes apart, and thrown
   letters break a copy of the navigation bar. The real links are never touched, only hidden
   under that visual copy, so they stay clickable and keyboard-accessible throughout.
   "Restore interface" puts everything back. */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL) return;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // The hands are drawn, not photographed, so their fingers can close: see hand().
  // The robot is a render cut into six pieces (assets/img/robot). Numbers are pixels in the source image:
  // where each piece sits, and the joint it turns around. Arms are posed by two-joint inverse kinematics.
  var RIG = { head: { x: 561, y: 26, w: 94, h: 146, px: 610, py: 160 }, armL1: { x: 447, y: 183, w: 94, h: 239, px: 510, py: 215 }, armL2: { x: 428, y: 359, w: 72, h: 179, px: 476, py: 386 },
              armR1: { x: 685, y: 183, w: 69, h: 239, px: 712, py: 215 }, armR2: { x: 702, y: 359, w: 70, h: 179, px: 732, py: 386 }, body: { x: 460, y: 148, w: 280, h: 854, px: 611, py: 470 } };
  var GRIP = { "-1": [440, 585], "1": [762, 580] }, IMG = {};
  Object.keys(RIG).forEach(function (n) { var im = new Image(); im.src = "assets/img/robot/" + n + ".png"; IMG[n] = im; });
  function nat(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]); }
  var NAT = { "-1": { u: nat([510, 215], [476, 386]), f: nat([476, 386], GRIP["-1"]) }, "1": { u: nat([712, 215], [732, 386]), f: nat([732, 386], GRIP["1"]) } };

  SAIL.scenes.agents = function (S, root) {
    var wide = S.W >= 980, bar = root.querySelector(".ghero-bar"), h1 = root.querySelector("h1"), restoreBtn = root.querySelector('[data-act="restore"]');
    var floorY = bar ? bar.offsetTop : S.H - 120, Z = wide ? clamp(window.innerHeight * 0.00084, 0.5, 0.82) : clamp(S.W * 0.00155, 0.48, 0.68), U = 133 * Z;
    var under = root.querySelector(".ghero-in .sub") || root.querySelector(".ghero-in .desc"), deskY = under ? under.getBoundingClientRect().top - root.getBoundingClientRect().top - 30 : floorY - U * 0.5;
    var homeX = wide ? S.W * 0.62 : S.W * 0.5, G = 2300, L1 = 174 * Z, L2 = Math.hypot(GRIP["1"][0] - 732, GRIP["1"][1] - 386) * Z, timeScale = 1, slowT = 0;
    var mast = document.querySelector(".masthead"), logo = mast ? mast.querySelector(".brand img") : null;

    /* ---- clear anything an earlier build of this scene left behind ---- */
    [].forEach.call(root.querySelectorAll(".navwreck, canvas.ghero-top, canvas.ghero-mid"), function (n) { n.parentNode.removeChild(n); });
    if (mast) mast.classList.remove("wrecked"); if (logo) logo.style.transform = ""; if (restoreBtn) restoreBtn.hidden = true;
    root.style.removeProperty("--shx"); root.style.removeProperty("--shy");
    var top = document.createElement("canvas"); top.className = "ghero-top"; top.setAttribute("aria-hidden", "true"); top.width = Math.round(S.W * S.dpr); top.height = Math.round(S.H * S.dpr); root.appendChild(top);
    var tctx = top.getContext("2d"); tctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    // depth, back to front: room and light (the page canvas), the mounted title, robot and desk (mid), loose and held letters, hands and debris (top)
    var mid = document.createElement("canvas"); mid.className = "ghero-mid"; mid.setAttribute("aria-hidden", "true"); mid.width = top.width; mid.height = top.height; root.insertBefore(mid, top);
    var mctx = mid.getContext("2d"); mctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);

    /* ---- the title, one physical letter per span ---- */
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
      el.style.transform = ""; el.style.visibility = ""; el.classList.remove("lock");
      return { el: el, idx: i, ch: el.textContent, hx: 0, hy: 0, w: 0, h: 0, x: 0, y: 0, rot: 0, sc: 1, vx: 0, vy: 0, vr: 0, gf: 1, state: "home", t: 0, bounced: 0, big: 0 };
    });
    function measure() {
      letters.forEach(function (l) {
        var x = 0, y = 0, n = l.el; while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
        l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; l.hx = x + l.w / 2; l.hy = y + l.h / 2; if (l.state === "home") { l.x = l.hx; l.y = l.hy; }
      });
    }
    measure();
    function sync() {
      letters.forEach(function (l) {
        var t = l.state === "home" ? "" : "translate(" + (l.x - l.hx).toFixed(1) + "px," + (l.y - l.hy).toFixed(1) + "px) rotate(" + l.rot.toFixed(3) + "rad)" + (l.sc !== 1 ? " scale(" + l.sc.toFixed(3) + ")" : "");
        if (l.tf !== t) { l.el.style.transform = t; l.tf = t; }
        var vis = l.hidden ? "hidden" : ""; if (l.vis !== vis) { l.el.style.visibility = vis; l.vis = vis; }
        var out = l.state !== "home"; if (l.out !== out) { l.el.classList.toggle("out", out); l.out = out; }
      });
    }
    function puff(x, n) { for (var i = 0; i < n; i++) dust.push({ x: x + rnd(-10, 10), y: deskY - 2, vx: rnd(-120, 120), vy: rnd(-70, -10), t: 0, life: rnd(0.35, 0.8), s: rnd(1, 2.4), g: 60 }); }
    function spare(l) {          // the nearest spot on the desk that is not already taken
      var taken = letters.filter(function (o) { return o !== l && o.state === "rest"; }), gap = l.w * 0.95;
      for (var n = 0; n < 90; n++) { var x = clamp(l.x + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * gap * 0.5, l.w, S.W - l.w); if (!taken.some(function (o) { return Math.abs((o.slide === undefined ? o.x : o.slide) - x) < (o.w + l.w) * 0.5; })) return x; }
      return l.x;
    }
    function restY(l) { return deskY - l.h * 0.3 * l.sc; }
    function knock(l) { if (!l || l.state !== "home") return false; l.state = "loose"; l.t = 0; l.bounced = 0; l.gf = 1; l.vx = rnd(-130, 130) + (wide && l.hx < S.W * 0.2 ? 90 : 0); l.vy = rnd(-120, -40); l.vr = rnd(-5, 5); return true; }
    function lockIn(l, hard) { l.state = "home"; l.x = l.hx; l.y = l.hy; l.rot = 0; l.sc = 1; l.big = 0; l.el.classList.remove("lock"); void l.el.offsetWidth; l.el.classList.add("lock"); fx.push({ kind: "ring", x: l.hx, y: l.hy, r: l.h * (hard ? 0.9 : 0.5), t: 0, life: hard ? 0.5 : 0.35 }); if (hard) shake = Math.max(shake, 0.35); }

    /* ---- state ---- */
    var rb = { x: homeX, vx: 0, moving: false, stand: 0, standTo: 0, lean: 0, leanTo: 0, yaw: -0.2, pitch: 0, walk: 0, gait: 0, arms: [-1, 1].map(function (s) { return { side: s, x: homeX + s * U * 0.45, y: deskY - U * 0.06, ex: homeX + s * U, ey: deskY - U * 0.5, tx: homeX + s * U * 0.45, ty: deskY - U * 0.06, curl: 0.3, curlTo: 0.3, speed: 7 }; }) };
    var job = null, work = { i: 0, t: 0, k: 0 }, knocks = [], level = 0, clock = 0, sinceMeasure = 0, nextLoose = 2.6, shake = 0, fx = [], dust = [], heat = 0, heatTo = 0, cool = 0, coolTo = 0, spot = 1, spotTo = 1, flicker = 0, lamp = { a: 0, va: 0 };
    var seq = null, wrecked = false, restoring = null, wreck = null, cracks = [], monitor = ["TASK: restore title", "STATE: monitoring"], card = null, divider = 0, tilt = null;
    var tiles = ["A", "I", "R", "L", "S"].map(function (c, i) { return { c: c, ox: homeX - U * (1.15 - i * 0.2) + (i % 2) * 6, oy: deskY - U * 0.05, x: 0, y: 0, rot: (i - 2) * 0.12, vx: 0, vy: 0, vr: 0, free: false }; });
    var papers = [{ ox: homeX + U * 1.02, w: U * 0.62, n: 4 }, { ox: homeX - U * 2.0, w: U * 0.5, n: 1 }].map(function (p) { p.oy = deskY - 3; p.x = p.ox; p.y = p.oy; p.rot = 0; p.vx = p.vy = p.vr = 0; p.free = false; return p; });
    tiles.forEach(function (t) { t.x = t.ox; t.y = t.oy; });
    var trayX = homeX - U * 1.78, monX = homeX + U * (wide ? 2.15 : 1.5), lampX = wide ? Math.min(S.W - U * 0.9, homeX + U * 3.7) : S.W - U * 0.55;

    function deskLine() { return 448 + 46 * rb.stand; }                  // which row of the render meets the desk top. It works at a standing desk: a little lower while busy at it, upright to walk
    // rb.walk is the step phase: one half turn per step. The body is lowest as a foot lands, rolls over the standing leg, and leans into the direction of travel.
    function bodyDrop() { return rb.lean * 34 * Z + (1 - Math.abs(Math.sin(rb.walk))) * 9 * Z * rb.gait + Math.sin(clock * 1.3) * 1.2 * Z; }
    function hip() { return { x: rb.x + Math.sin(rb.walk) * 7 * Z * rb.gait, y: deskY + (470 - deskLine()) * Z + bodyDrop() }; }
    function roll() { return Math.sin(rb.walk) * 0.032 * rb.gait + clamp(rb.vx * 0.00014, -0.05, 0.05); }
    function shoulderY() { return hip().y - 255 * Z; }
    function shoulder(side) { var h = hip(), r = roll(), lx = side * 101 * Z, ly = -255 * Z; return { x: h.x + lx * Math.cos(r) - ly * Math.sin(r), y: h.y + lx * Math.sin(r) + ly * Math.cos(r) }; }
    function headY() { return shoulderY() - 110 * Z; }
    function grip(a) {      // the point between fingers and thumb, which is where a held letter sits
      var fa = Math.atan2(a.dy, a.dx), ha = fa + (a.wrist || 0), wx = a.ex + a.dx * 146 * Z * (a.f || 1), wy = a.ey + a.dy * 146 * Z * (a.f || 1);
      var sg = a.side * (1 - 2 * (a.turn || 0)); return { x: wx + Math.cos(ha) * 60 * Z - Math.sin(ha) * sg * 12 * Z, y: wy + Math.sin(ha) * 60 * Z + Math.cos(ha) * sg * 12 * Z };
    }
    function aim(a, x, y) { var g = grip(a); a.tx = x - (g.x - a.x); a.ty = y - (g.y - a.y); }      // put the grip, not the forearm, on the target
    function moveTo(gx, quick, dt) { var maxV = U * 2.5 * quick, acc = 760 * Z * quick * dt, want = clamp((gx - rb.x) * 3, -maxV, maxV); rb.vx += clamp(want - rb.vx, -acc, acc); rb.moving = true; }      // heavy: it takes a moment to get going and to stop

    /* ---- the robot restoring one letter ---- */
    function nextJob() { var best = null, bd = 1e9; letters.forEach(function (l) { if (l.state === "rest") { var d = Math.abs(l.x - rb.x); if (d < bd) { bd = d; best = l; } } }); return best ? { l: best, phase: "notice", t: 0 } : null; }
    function stepJob(dt) {
      var j = job, l = j.l, quick = 1 + level * 0.45, focus = { x: l.x, y: l.y }; j.t += dt;
      if (l.state !== "rest" && l.state !== "held" && l.state !== "magnet" && !(l.state === "home" && j.phase === "release")) { job = null; return focus; }
      if (j.phase === "notice") { if (j.t > (level === 1 ? 0.7 : 0.4) / quick) { j.phase = "go"; j.t = 0; } }
      else if (j.phase === "go") {
        rb.standTo = 1; j.arm = rb.arms[l.x < rb.x ? 0 : 1]; j.goal = clamp(l.x - j.arm.side * U * 0.72, U * 0.8, S.W - U * 0.8);
        if (rb.stand > 0.85) moveTo(j.goal, quick, dt); if (rb.stand > 0.9 && Math.abs(rb.x - j.goal) < 7 && Math.abs(rb.vx) < 40) { j.phase = "down"; j.t = 0; }
      } else if (j.phase === "down") {
        rb.leanTo = 1; aim(j.arm, l.x, l.y - 4 * Z); j.arm.flatTo = 0.3; j.arm.curlTo = 0; j.arm.speed = 5.5 * quick;
        var gp = grip(j.arm); if (Math.hypot(gp.x - l.x, gp.y - l.y) < 11 || j.t > 1.4) { j.phase = "grip"; j.t = 0; }
      } else if (j.phase === "grip") { aim(j.arm, l.x, l.y); j.arm.flatTo = 0.3; j.arm.curlTo = 0.62; j.arm.speed = 9; if (j.t > 0.34 / quick) { l.state = "held"; j.phase = "carry"; j.t = 0; } }
      else if (j.phase === "carry") {
        rb.leanTo = 0; var sh = shoulder(j.arm.side); j.arm.tx = rb.x + j.arm.side * U * 0.98; j.arm.ty = sh.y + U * 1.78; j.arm.speed = 4.5 * quick; j.arm.flatTo = 0; j.arm.curlTo = 0.62; j.arm.holding = true; focus = { x: l.hx, y: l.hy };
        j.goal = clamp(l.hx - j.arm.side * U * 0.62, U * 0.8, S.W - U * 0.8); if (j.t > 0.3 / quick) moveTo(j.goal, quick, dt);
        if (j.t > 0.3 && Math.abs(rb.x - j.goal) < 7 && Math.abs(rb.vx) < 40) { j.phase = "up"; j.t = 0; }
      } else if (j.phase === "up") {
        focus = { x: l.hx, y: l.hy }; aim(j.arm, l.hx, l.hy); j.arm.flatTo = 0; j.arm.curlTo = 0.62; j.arm.holding = true; j.arm.speed = (level >= 2 ? 9 : 4.6) * quick;
        var shd = shoulder(j.arm.side), reach = L1 + L2 - 3, dx = j.arm.tx - shd.x, dy = j.arm.ty - shd.y, d = Math.hypot(dx, dy), cx = d > reach ? shd.x + dx / d * reach : j.arm.tx, cy = d > reach ? shd.y + dy / d * reach : j.arm.ty;
        if (Math.hypot(j.arm.x - cx, j.arm.y - cy) < 8 || j.t > 1.3) { l.state = "magnet"; l.t = 0; l.from = { x: l.x, y: l.y, rot: l.rot }; l.dur = clamp(Math.hypot(l.x - l.hx, l.y - l.hy) / 900, 0.16, 0.6) / (level >= 2 ? 1.6 : 1); l.hard = level >= 2; j.phase = "release"; j.t = 0; }
      } else if (j.phase === "release") { focus = { x: l.hx, y: l.hy }; j.arm.curlTo = 0; j.arm.flatTo = 0; j.arm.tx = j.arm.x; j.arm.ty = j.arm.y + 10 * Z * j.t; if (l.state === "home" && j.t > 0.25) job = null; }
      if (l.state === "held") { var gh = grip(j.arm); l.x = gh.x; l.y = gh.y; l.rot += (0 - l.rot) * Math.min(1, dt * 6); j.arm.holding = true; j.arm.curlTo = 0.62; }
      return focus;
    }

    /* ---- calm desk work while nothing has fallen ---- */
    function stepWork(dt) {
      var w = work, a0 = rb.arms[0], a1 = rb.arms[1], focus = { x: rb.x, y: deskY }, kb = deskY - U * 0.07; w.t += dt;
      function next() { w.i = (w.i + 1) % 4; w.t = 0; w.k++; }
      a0.tx = rb.x - U * 0.78; a1.tx = rb.x + U * 0.78; a0.ty = a1.ty = kb; a0.curlTo = a1.curlTo = 0.35; a0.speed = a1.speed = 5;
      if (w.i === 0) { a0.typing = a1.typing = true; a0.ty = kb - Math.max(0, Math.sin(clock * 11)) * U * 0.05; a1.ty = kb - Math.max(0, Math.sin(clock * 11 + 2)) * U * 0.05; focus = { x: monX, y: deskY - U * 0.9 }; if (w.t > 3) next(); }
      else if (w.i === 1) { focus = { x: S.W * 0.22, y: 140 }; if (w.t > 1.6) next(); }
      else if (w.i === 2) {
        var t = tiles[w.k % tiles.length]; focus = { x: t.x, y: t.y };
        if (w.t < 1) { aim(a0, t.x, t.y); a0.flatTo = 0.3; a0.curlTo = 0; } else if (w.t < 2.4) { a0.curlTo = 0.8; a0.flatTo = 0.3; a0.tx = trayX + (w.k % 3) * U * 0.2 - U * 0.2; a0.ty = deskY - U * 0.24; var gt = grip(a0); t.x = gt.x; t.y = gt.y; t.rot *= 0.9; }
        else { t.y = deskY - U * 0.1; t.ox = t.x; t.oy = t.y; if (w.t > 2.8) next(); }
      } else { a0.tx = papers[0].x - U * 0.2; a1.tx = papers[0].x + U * 0.22; a0.ty = a1.ty = deskY - U * 0.1 - Math.abs(Math.sin(w.t * 5)) * 3; focus = { x: papers[0].x, y: deskY }; if (w.t > 1.8) next(); }
      return focus;
    }

    /* ---- a visual copy of the navigation bar that can break ---- */
    function buildWreck() {
      if (!mast) return null; var rr = root.getBoundingClientRect(), layer = document.createElement("div"); layer.className = "navwreck"; layer.setAttribute("aria-hidden", "true"); root.appendChild(layer);
      var frags = [], labels = [];
      function frag(el, o) { layer.appendChild(el); o.el = el; o.x = o.y = o.rot = o.vx = o.vy = o.vr = 0; o.mode = "still"; frags.push(o); }
      [].forEach.call(mast.querySelectorAll(".brand-text b, .brand-text span, .mainnav > a, .navgroup > button, .mast-join"), function (el) {
        if (!el.getClientRects().length) return; var cs = getComputedStyle(el), key = el.textContent.trim().toLowerCase(), up = cs.textTransform === "uppercase", er = el.getBoundingClientRect();
        labels.push({ key: key, x: er.left - rr.left + er.width / 2, y: er.top - rr.top + er.height / 2 });
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), node;
        while ((node = walker.nextNode())) for (var i = 0; i < node.nodeValue.length; i++) {
          var ch = node.nodeValue[i]; if (!ch.trim()) continue; var rg = document.createRange(); rg.setStart(node, i); rg.setEnd(node, i + 1); var r = rg.getBoundingClientRect(); if (!r.width) continue;
          var s = document.createElement("span"); s.textContent = up ? ch.toUpperCase() : ch; s.style.cssText = "left:" + (r.left - rr.left) + "px;top:" + (r.top - rr.top) + "px;width:" + r.width + "px;height:" + r.height + "px;font:" + cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + "/" + r.height + "px " + cs.fontFamily + ";color:" + cs.color + ";opacity:" + cs.opacity;
          frag(s, { key: key, ch: ch.toUpperCase(), ox: r.left - rr.left + r.width / 2, oy: r.top - rr.top + r.height / 2 });
        }
        if (el.classList.contains("mast-join")) { var b = document.createElement("i"); b.style.cssText = "left:" + (er.left - rr.left) + "px;top:" + (er.top - rr.top) + "px;width:" + er.width + "px;height:" + er.height + "px;border:1px solid " + cs.color; frag(b, { key: key, box: true, ox: er.left - rr.left + er.width / 2, oy: er.top - rr.top + er.height / 2 }); }
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
          if (f.line) { f.mode = f.line < 0 ? "hang" : "fall"; f.vy = 60; f.vx = 120; f.vr = 3; f.rotTo = 1.3; f.yTo = 0; return; }
          if (f.box) { f.mode = "hang"; f.el.style.transformOrigin = "0 0"; f.rotTo = 0.5; f.yTo = 6; return; }
          var r = Math.random();
          if (f.ch === "J" || r > 0.78) { f.mode = "slide"; f.vx = (f.ox < x ? -1 : 1) * rnd(520, 1000); f.vy = rnd(-160, 40); f.vr = f.ch === "J" ? 16 : rnd(-6, 6); }
          else if (r > 0.2) { f.mode = "fall"; f.vx = (f.ox - x) * 5 + rnd(-160, 160); f.vy = rnd(-520, -160); f.vr = rnd(-9, 9); }
          else { f.mode = "hang"; f.rotTo = rnd(-0.7, 0.7); f.yTo = rnd(5, 16); }
        } else if (near && f.mode === "still" && !f.box && !f.line && Math.random() < 0.65) { f.mode = "hang"; f.rotTo = rnd(-0.32, 0.32); f.yTo = rnd(2, 9); }
      });
      var lines = [], barH = mast ? mast.offsetHeight : 72;
      [-1, 1].forEach(function (dir) { for (var n = 0; n < (big ? 3 : 2); n++) { var pts = [[x, y + 12]], ang = (dir < 0 ? Math.PI : 0) + rnd(-0.35, 0.35), len = rnd(90, big ? 300 : 190), seg = 6; for (var s = 0; s < seg; s++) { ang += rnd(-0.5, 0.5); var q = pts[pts.length - 1]; pts.push([q[0] + Math.cos(ang) * len / seg, clamp(q[1] + Math.sin(ang) * len / seg * 0.5, 6, barH + 22)]); if (s === 2 && Math.random() < 0.7) { var br = [pts[pts.length - 1]], ba = ang + rnd(0.6, 1.1) * (Math.random() < 0.5 ? -1 : 1); for (var m = 0; m < 3; m++) { var w = br[br.length - 1]; br.push([w[0] + Math.cos(ba) * 16, clamp(w[1] + Math.sin(ba) * 12, 6, barH + 22)]); } lines.push(br); } } lines.push(pts); } });
      cracks.push({ x: x, y: y + 12, lines: lines, a: 1 });
      fx.push({ kind: "flash", x: x, y: y, t: 0, life: 0.28, r: big ? 260 : 170 }); for (var i = 0; i < (big ? 46 : 30); i++) dust.push({ x: x + rnd(-30, 30), y: y + rnd(-6, 16), vx: rnd(-260, 260), vy: rnd(-260, 120), t: 0, life: rnd(0.6, 1.8), s: rnd(1, 3.2), g: 500 });
      shake = Math.max(shake, big ? 1 : 0.7); tilt = { t: 0, a: (Math.random() < 0.5 ? -1 : 1) * (big ? 0.03 : 0.022) };
      if (logo) logo.style.transform = "translate(" + rnd(-9, -4).toFixed(0) + "px," + rnd(2, 6).toFixed(0) + "px) rotate(" + rnd(-12, -5).toFixed(0) + "deg)";
    }
    function stepWreck(dt) {
      if (!wreck) return; var k = restoring ? ease((restoring.t - 0.2) / 1.1) : 0;
      wreck.frags.forEach(function (f) {
        if (restoring) { if (!f.from) f.from = { x: f.x, y: f.y, rot: f.rot }; f.x = f.from.x * (1 - k); f.y = f.from.y * (1 - k); f.rot = f.from.rot * (1 - k); }
        else if (f.mode === "fall") { f.vy += G * 0.8 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; var fl = deskY - f.oy - 5; if (f.y > fl) { f.y = fl; if (Math.abs(f.vy) < 240) f.mode = "rest"; else { f.vy *= -0.3; f.vx *= 0.6; f.vr *= 0.5; } } }
        else if (f.mode === "slide") { f.vy += 260 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; if (Math.abs(f.ox + f.x) > S.W * 1.6) f.mode = "gone"; }
        else if (f.mode === "hang") { f.rot += (f.rotTo + Math.sin(clock * 3 + f.ox) * 0.05 - f.rot) * Math.min(1, dt * 7); f.y += ((f.yTo || 0) - f.y) * Math.min(1, dt * 7); }
        var t = "translate(" + f.x.toFixed(1) + "px," + f.y.toFixed(1) + "px) rotate(" + f.rot.toFixed(3) + "rad)"; if (f.tf !== t) { f.el.style.transform = t; f.tf = t; }
      });
      if (tilt) { tilt.t += dt; var a = tilt.t < 0.22 ? tilt.a * Math.sin(tilt.t / 0.22 * Math.PI) : 0; wreck.layer.style.transform = "rotate(" + a.toFixed(4) + "rad)"; if (tilt.t > 0.25) tilt = null; }
    }

    /* ---- the destruction, staged in beats ---- */
    function find(ch) { for (var i = 0; i < letters.length; i++) if (letters[i].ch === ch) return letters[i]; return letters[0]; }
    function fly(l, to, dur, sc, spin, arc) { l.state = "script"; l.t = 0; l.dur = dur; l.from = { x: l.x, y: l.y, rot: l.rot, sc: l.sc }; l.to = to; l.toSc = sc; l.spin = spin; l.arc = arc; l.hidden = false; }
    function loose(l, vx, vy, gf) { if (!l) return; l.state = "falling"; l.gf = gf; l.bounced = -1; l.vx = vx; l.vy = vy; l.vr = rnd(-8, 8); }
    function startSeq() {
      seq = { t: 0, did: {}, pre: Math.abs(rb.x - homeX) > 14 ? 0.001 : 0 }; job = null; wreck = buildWreck(); monitor = ["TASK INTEGRITY: COMPROMISED", "RESPONSE: MANUAL OVERRIDE"]; heatTo = 1; spotTo = 1.7; rb.leanTo = 0;
      letters.forEach(function (l) { if (l.state === "home") { l.state = "shiver"; l.t = 0; } else if (l.state === "held" || l.state === "magnet") loose(l, 0, 0, 1); });
      seq.R = find("R"); seq.A = find("A");
    }
    function once(key, at) { if (seq.t >= at && !seq.did[key]) { seq.did[key] = 1; return true; } return false; }
    function stepSeq(dt) {
      if (seq.pre) { seq.pre += dt; rb.standTo = 1; rb.leanTo = 0; moveTo(homeX, 2.4, dt); if (Math.abs(rb.x - homeX) < 14 || seq.pre > 1.6) seq.pre = 0; return { x: S.W * 0.25, y: 140 }; }
      var t = (seq.t += dt), a0 = rb.arms[0], a1 = rb.arms[1], sy = shoulderY(), slamX = rb.x + U * 0.6, focus = { x: slamX, y: deskY }, R = seq.R, A = seq.A;
      rb.standTo = 1; a0.tx = rb.x - U * 0.7; a0.ty = deskY - U * 0.05; a1.tx = rb.x + U * 0.7; a1.ty = deskY - U * 0.05; a0.curlTo = a1.curlTo = 0.8; a0.speed = a1.speed = 9;
      if (once("flash", 0.7)) fx.push({ kind: "screen", t: 0, life: 0.22 });
      if (t > 0.55 && t < 1.04) { a1.tx = rb.x + U * 0.75; a1.ty = sy - U * 1.05; a1.speed = 12; focus = { x: S.W * 0.25, y: 140 }; }
      if (t >= 1.04 && t < 1.5) { a1.tx = slamX; a1.ty = deskY - U * 0.03; a1.speed = 30; }
      if (once("slam", 1.13)) {
        shake = 1; slowT = 0.75; fx.push({ kind: "shock", x: slamX, y: deskY, t: 0, life: 1.1 }); lamp.va += 5;
        for (var i = 0; i < 40; i++) dust.push({ x: slamX + rnd(-40, 40), y: deskY - 4, vx: rnd(-420, 420), vy: rnd(-380, -40), t: 0, life: rnd(0.8, 2.4), s: rnd(1, 3), g: 300 });
        letters.forEach(function (l) { if (l === R || l === A) return; var dx = l.x - slamX, dy = l.y - deskY, d = Math.hypot(dx, dy) || 1, sp = rnd(420, 820); loose(l, dx / d * sp + rnd(-120, 120), dy / d * sp * 0.5 - rnd(380, 720), 0.42); });
        tiles.concat(papers).forEach(function (o) { o.free = true; o.vx = (o.x - slamX) * rnd(1.5, 3) + rnd(-200, 200); o.vy = rnd(-900, -350); o.vr = rnd(-10, 10); });
        fly(R, function () { return { x: rb.x - U * 0.95, y: shoulderY() - U * 1.55 }; }, 0.85, 1.7, 7, U * 2.2); fly(A, function () { return { x: A.hx + 40, y: -260 }; }, 0.7, 1.4, 5, 0);
      }
      if (t > 1.2 && t < 2.0) { a0.tx = rb.x - U * 0.95; a0.ty = sy - U * 1.25; a0.curlTo = 0; a0.speed = 10; focus = { x: R.x, y: R.y }; }
      if (once("catch", 1.98)) { R.state = "inhand"; a0.curlTo = 1; }
      if (once("hideA", 1.9)) A.hidden = true;
      if (t >= 1.98 && t < 2.55) { a0.tx = rb.x + U * 0.35; a0.ty = sy - U * 0.15; a0.speed = 7; a0.curlTo = 1; var tg = label(["research", "projects", "join", "sail"]); if (tg) focus = { x: tg.x, y: tg.y }; }
      if (t >= 2.55 && t < 3.0) { a0.tx = rb.x - U * 1.25; a0.ty = sy - U * 1.6; a0.speed = 26; a0.curlTo = t < 2.68 ? 1 : 0; }
      if (once("throw", 2.68)) { seq.t1 = label(["research", "projects", "join", "sail"]); var p = seq.t1 || { x: S.W * 0.6, y: 36 }; fly(R, function () { return { x: p.x, y: p.y }; }, 0.5, 1.7, 14, U * 0.5); }
      if (R.state === "inhand") { var gr = grip(a0); a0.holding = true; R.x = gr.x; R.y = gr.y; R.rot += (0.3 - R.rot) * Math.min(1, dt * 8); R.sc = 1.7; }
      if (once("hit1", 3.19)) { slowT = 0.4; impact(seq.t1, true); R.big = 1; loose(R, rnd(-260, -80), -320, 0.8); }
      if (t > 3.2 && t < 3.9 && seq.t1) focus = { x: seq.t1.x, y: seq.t1.y };
      // second beat: a metal divider dragged across the desk throws sparks and sends two letters into the bar
      if (t >= 3.85 && t < 4.75) {
        var k = ease((t - 3.95) / 0.7); divider = 1; a1.tx = rb.x + U * 1.35 - k * U * 3.0; a1.ty = deskY - U * 0.12; a1.speed = 22; a1.curlTo = 1; focus = { x: a1.x, y: deskY };
        if (t > 3.95) { for (var s = 0; s < 3; s++) dust.push({ x: a1.x, y: deskY - 2, vx: rnd(-80, 360), vy: rnd(-300, -40), t: 0, life: rnd(0.2, 0.55), s: rnd(1, 2), g: 900, spark: true });
          letters.forEach(function (l) { if (l.state === "rest" && Math.abs(l.x - a1.x) < U * 0.35 && !l.swept) { l.swept = true; loose(l, rnd(-700, -300), rnd(-620, -260), 0.6); } }); }
      } else divider = 0;
      if (once("volley", 4.35)) {
        seq.shots = letters.filter(function (l) { return l !== R && l !== A && l.state !== "script"; }).sort(function (a, b) { return Math.abs(a.x - rb.x) - Math.abs(b.x - rb.x); }).slice(0, 2); seq.t2 = label(["projects", "people", "sail"]); seq.t3 = label(["news", "resources", "at wwp high school south"]);
        seq.shots.forEach(function (l, i) { var tg2 = i ? seq.t3 : seq.t2; if (tg2) fly(l, function () { return { x: tg2.x, y: tg2.y }; }, 0.55 + i * 0.2, 1.2, 12, U * 0.8); });
      }
      if (once("hit2", 4.9)) { impact(seq.t2, false); loose(seq.shots[0], rnd(-200, 200), -240, 0.8); }
      if (once("hit3", 5.1)) { impact(seq.t3, false); loose(seq.shots[1], rnd(-200, 200), -240, 0.8); }
      if (t > 4.75) a1.curlTo = 0.5;
      if (once("card", 4.5)) card = { x: S.W + 120, y: deskY - 7, vx: -S.W * 1.1, rot: -0.1 };
      // third beat: the A that left the top of the page comes back down on Join
      if (once("giant", 5.2)) { seq.t4 = label(["join", "news", "sail"]); A.state = "falling"; A.hidden = false; A.gf = 1.25; A.bounced = -2; A.big = 1; A.sc = 2.4; A.x = seq.t4 ? seq.t4.x : S.W * 0.85; A.y = -170; A.vx = 0; A.vy = 420; A.vr = 1.4; A.strike = seq.t4 ? seq.t4.y - 8 : 40; }
      if (A.strike && A.state === "falling" && A.y >= A.strike) { A.strike = 0; impact(seq.t4, true); A.vy = -260; A.vx = rnd(-220, -80); A.vr = -5; }
      if (t > 5.2 && t < 6.2) focus = { x: A.x, y: A.y };
      if (t > 6.2) { focus = { x: rb.x - U, y: deskY }; a0.curlTo = a1.curlTo = 0.4; spotTo = 1.15; }
      if (once("settle", 6.9)) { wrecked = true; if (restoreBtn) restoreBtn.hidden = false; monitor = ["TASK: restore title", "STATE: waiting for operator"]; }
      return focus;
    }
    function restore() {
      if (!wrecked || restoring) return; restoring = { t: 0 }; wrecked = false; seq = null; divider = 0; heatTo = 0; coolTo = 1; spotTo = 1; if (restoreBtn) restoreBtn.hidden = true; monitor = ["TASK: restore title", "STATE: restoring interface"]; if (card) card.leave = true;
      letters.forEach(function (l, i) { if (l.state === "home") return; l.state = "return"; l.t = -i * 0.028; l.from = { x: l.x, y: l.y, rot: l.rot, sc: l.sc }; l.hidden = false; l.swept = false; });
      tiles.concat(papers).forEach(function (o) { o.from = { x: o.x, y: o.y, rot: o.rot }; o.free = false; });
    }
    function stepRestore(dt) {
      restoring.t += dt; var k = ease((restoring.t - 0.2) / 1.2);
      tiles.concat(papers).forEach(function (o) { o.x = o.from.x + (o.ox - o.from.x) * k; o.y = o.from.y + (o.oy - o.from.y) * k; o.rot = o.from.rot * (1 - k); });
      cracks.forEach(function (c) { c.a = 1 - k; });
      if (restoring.t > 1.9) { if (wreck) { wreck.layer.parentNode.removeChild(wreck.layer); wreck = null; } if (mast) mast.classList.remove("wrecked"); if (logo) logo.style.transform = ""; cracks = []; restoring = null; knocks = []; level = 0; coolTo = 0; monitor = ["TASK: restore title", "STATE: monitoring"]; nextLoose = 9; }
    }

    function stepLetters(dt) {
      letters.forEach(function (l) {
        if (l.state === "loose") { l.t += dt; l.rot = Math.sin(l.t * 40) * 0.07 * Math.min(1, l.t * 5); if (l.t > 0.32) l.state = "falling"; }
        else if (l.state === "shiver") { l.t += dt; l.x = l.hx + Math.sin(l.t * 50 + l.idx) * 1.6; l.y = l.hy + Math.min(6, l.t * 5); l.rot = Math.sin(l.t * 33 + l.idx) * 0.05; }
        else if (l.state === "falling") {
          l.vy += G * l.gf * dt; l.x += l.vx * dt; l.y += l.vy * dt; l.rot += l.vr * dt; if (l.y > deskY - 260) l.sc += ((l.big ? 1.45 : 1) - l.sc) * Math.min(1, dt * 3);
          if (l.x < l.w) { l.x = l.w; l.vx = Math.abs(l.vx) * 0.5; } else if (l.x > S.W - l.w) { l.x = S.W - l.w; l.vx = -Math.abs(l.vx) * 0.5; }
          if (l.y > restY(l) && l.vy > 0) { l.y = restY(l); puff(l.x, 5); if (l.bounced >= 1 || l.vy < 160) { l.state = "rest"; l.vx = l.vy = l.vr = 0; l.gf = 1; l.big = 0; l.slide = spare(l); l.rot = clamp(((l.rot + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI, -0.55, 0.55); } else { l.bounced++; l.vy *= -0.3; l.vx *= 0.55; l.vr *= 0.45; fx.push({ kind: "tap", x: l.x, y: deskY, t: 0, life: 0.25 }); } }
        } else if (l.state === "rest") { if (l.slide !== undefined) l.x += (l.slide - l.x) * Math.min(1, dt * 5); l.sc += (1 - l.sc) * Math.min(1, dt * 2.5); l.y = restY(l); }
        else if (l.state === "magnet") { l.t += dt; var k = l.t / l.dur, e = k >= 1 ? 1 : 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.06; l.x = l.from.x + (l.hx - l.from.x) * e; l.y = l.from.y + (l.hy - l.from.y) * e; l.rot = l.from.rot * (1 - e); if (k >= 1) lockIn(l, l.hard); }
        else if (l.state === "script") { l.t += dt; var u = clamp(l.t / l.dur, 0, 1), to = l.to(), uu = u * u * (3 - 2 * u); l.x = l.from.x + (to.x - l.from.x) * uu; l.y = l.from.y + (to.y - l.from.y) * uu - Math.sin(u * Math.PI) * l.arc; l.rot = l.from.rot + l.spin * u; l.sc = l.from.sc + (l.toSc - l.from.sc) * u; }
        else if (l.state === "return") { l.t += dt; if (l.t < 0) return; var q = ease(l.t / 1.0); l.x = l.from.x + (l.hx - l.from.x) * q; l.y = l.from.y + (l.hy - l.from.y) * q - Math.sin(q * Math.PI) * 40; l.rot = l.from.rot * (1 - q); l.sc = l.from.sc + (1 - l.from.sc) * q; if (l.t >= 1.0) lockIn(l, false); }
      });
    }
    function stepThings(dt) {
      tiles.concat(papers).forEach(function (o) { if (!o.free) return; o.vy += G * 0.7 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt; if (o.y > deskY - 4 && o.vy > 0 && o.x > 0 && o.x < S.W) { o.y = deskY - 4; if (o.vy < 200) { o.vy = 0; o.vx *= 0.8; o.vr *= 0.8; if (Math.abs(o.vx) < 8) { o.vx = 0; o.vr = 0; } } else { o.vy *= -0.28; o.vx *= 0.6; o.vr *= 0.5; } } });
      if (card) { card.x += card.vx * dt; if (card.leave) card.vx = -S.W; else card.vx *= Math.pow(0.12, dt); if (card.x < -300) card = null; }
      dust.forEach(function (d) { d.t += dt; d.vy += d.g * dt; d.vx *= Math.pow(0.4, dt); d.x += d.vx * dt; d.y += d.vy * dt; if (!d.spark && d.y > deskY - 2 && d.vy > 0) { d.y = deskY - 2; d.vy = 0; } }); dust = dust.filter(function (d) { return d.t < d.life; }); if (dust.length > 260) dust.splice(0, dust.length - 260);
      fx.forEach(function (f) { f.t += dt; }); fx = fx.filter(function (f) { return f.t < f.life; });
      lamp.va += (-lamp.a * 26 - lamp.va * 0.9) * dt; lamp.a += lamp.va * dt;
    }

    function stepRobot(dt) {
      var focus; rb.moving = false;
      rb.arms.forEach(function (a) { var up = rb.stand > 0.5; a.tx = up ? rb.x + a.side * 114 * Z - rb.vx * 0.05 : rb.x + a.side * U * 0.85; a.ty = up ? shoulderY() + 350 * Z - Math.abs(Math.sin(rb.walk)) * 5 * Z * rb.gait : deskY - 5 * Z; a.speed = up ? 5 : 6; a.curlTo = up ? 0.42 : 0.12; a.flatTo = null; a.holding = false; a.typing = false; });   // relaxed unless something below asks for more
      if (seq) focus = stepSeq(dt);
      else {
        if (!job && !wrecked && !restoring) job = nextJob();
        if (job) focus = stepJob(dt);
        else if (wrecked) { rb.standTo = 1; rb.arms.forEach(function (a) { a.tx = rb.x + a.side * U * 0.7; a.ty = deskY - U * 0.05; a.curlTo = 0.4; a.speed = 4; }); focus = { x: rb.x - U * 1.5 + Math.sin(clock * 0.4) * U * 2, y: deskY }; }
        else if (Math.abs(rb.x - homeX) > 8) { rb.standTo = 1; rb.leanTo = 0; moveTo(homeX, 1, dt); rb.arms.forEach(function (a) { a.tx = rb.x + a.side * U * 0.62; a.ty = shoulderY() + U * 1.2; a.curlTo = 0.5; a.speed = 5; }); focus = { x: homeX, y: deskY }; }
        else { rb.standTo = 0; rb.leanTo = 0; if (rb.stand < 0.15) focus = stepWork(dt); else { focus = { x: monX, y: deskY - U }; rb.arms.forEach(function (a) { a.tx = rb.x + a.side * U * 0.5; a.ty = deskY - U * 0.06; a.speed = 5; }); } }
      }
      if (!rb.moving) rb.vx *= Math.pow(0.002, dt);
      var speed = Math.abs(rb.vx), surge = 0.7 + 0.3 * Math.abs(Math.sin(rb.walk));             // it travels during the step and slows as the foot plants
      rb.walk += speed * dt / (82 * Z) * Math.PI; rb.gait += ((speed > 24 ? 1 : 0) - rb.gait) * Math.min(1, dt * 5);
      rb.x = clamp(rb.x + rb.vx * surge * dt, U * 0.7, S.W - U * 0.7);
      rb.stand += (rb.standTo - rb.stand) * Math.min(1, dt * (seq ? 5.5 : 3.4)); rb.lean += (rb.leanTo - rb.lean) * Math.min(1, dt * 5);
      var wantYaw = clamp((focus.x - rb.x) / (U * 3.2), -1, 1), wantPitch = clamp((focus.y - headY()) / (U * 3), -1, 1); rb.yaw += (wantYaw - rb.yaw) * Math.min(1, dt * 5); rb.pitch += (wantPitch - rb.pitch) * Math.min(1, dt * 5);
      rb.arms.forEach(function (a) {
        var sh = shoulder(a.side), K = a.speed * a.speed * 3.2, C = 2 * Math.sqrt(K) * 0.82, n = 3, h = dt / n;
        for (var s = 0; s < n; s++) { a.vx = (a.vx || 0) + ((a.tx - a.x) * K - (a.vx || 0) * C) * h; a.vy = (a.vy || 0) + ((a.ty - a.y) * K - (a.vy || 0) * C) * h; a.x += a.vx * h; a.y += a.vy * h; }
        var dx = a.x - sh.x, dy = a.y - sh.y, d = Math.hypot(dx, dy) || 1, max = L1 + L2 - 2, min = Math.abs(L1 - L2) + 6;
        if (d > max) { a.x = sh.x + dx / d * max; a.y = sh.y + dy / d * max; dx = a.x - sh.x; dy = a.y - sh.y; d = max; } else if (d < min) { a.x = sh.x + dx / d * min; a.y = sh.y + dy / d * min; dx = a.x - sh.x; dy = a.y - sh.y; d = min; }
        // seen from the front, an arm reaching toward the viewer looks shorter. Shortening the links a little keeps the elbows from swinging wide
        var fs = clamp(d / ((L1 + L2) * 0.88), 0.56, 1); a.f = (a.f || 1) + (fs - (a.f || 1)) * Math.min(1, dt * 10); var l1 = L1 * a.f, l2 = L2 * a.f;
        var b = Math.atan2(dy, dx), cs = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), bend = Math.acos(cs);
        var o1 = Math.cos(b + bend) * a.side + Math.sin(b + bend) * 0.3, o2 = Math.cos(b - bend) * a.side + Math.sin(b - bend) * 0.3; if (!a.sign) a.sign = o1 > o2 ? 1 : -1; if (a.sign > 0 ? o2 > o1 + 0.25 : o1 > o2 + 0.25) a.sign = -a.sign;      // elbows out and down, and sticky so they never flicker
        var want = b + bend * a.sign, exT = sh.x + Math.cos(want) * l1, eyT = sh.y + Math.sin(want) * l1; if (a.ex === undefined || isNaN(a.ex)) { a.ex = exT; a.ey = eyT; }
        a.ex += (exT - a.ex) * Math.min(1, dt * 18); a.ey += (eyT - a.ey) * Math.min(1, dt * 18); var el = Math.hypot(a.ex - sh.x, a.ey - sh.y) || 1; a.ex = sh.x + (a.ex - sh.x) / el * l1; a.ey = sh.y + (a.ey - sh.y) / el * l1;
        var fl = Math.hypot(a.x - a.ex, a.y - a.ey) || 1; a.dx = (a.x - a.ex) / fl; a.dy = (a.y - a.ey) / fl;
        // the wrist turns the hand flat when it rests on the desk; otherwise the hand follows the forearm
        var fa = Math.atan2(a.dy, a.dx), flat = a.flatTo !== null && a.flatTo !== undefined ? a.flatTo : (a.ty > deskY - 16 * Z && a.ty < deskY + 8 * Z ? 1 : 0), want = (a.side > 0 ? Math.PI : 0) - fa;
        while (want > Math.PI) want -= 6.2832; while (want < -Math.PI) want += 6.2832;
        a.wrist = (a.wrist || 0) + (clamp(want, -1.5, 1.5) * flat - (a.wrist || 0)) * Math.min(1, dt * 8); a.turn = (a.turn || 0) + (flat - (a.turn || 0)) * Math.min(1, dt * 7);      // turn: the forearm rolls the palm down as the hand goes flat a.curl = (a.curl || 0) + ((a.curlTo || 0) - (a.curl || 0)) * Math.min(1, dt * 11);
      });
    }

    /* ---- drawing ---- */
    function metal(ctx, x0, y0, x1, y1, dark) { var g = ctx.createLinearGradient(x0, y0, x1, y1); if (dark) { g.addColorStop(0, "#3a3f48"); g.addColorStop(0.5, "#23272e"); g.addColorStop(1, "#111418"); } else { g.addColorStop(0, "#dfe3e9"); g.addColorStop(0.45, "#9aa2ae"); g.addColorStop(1, "#555c68"); } return g; }
    function piece(ctx, name, sx, sy, rot) { var r = RIG[name], im = IMG[name]; if (!im.complete || !im.naturalWidth) return; ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot); ctx.drawImage(im, (r.x - r.px) * Z, (r.y - r.py) * Z, r.w * Z, r.h * Z); ctx.restore(); }
    function limb(ctx, name, sx, sy, ang, natural, f) { var r = RIG[name], im = IMG[name]; if (!im.complete || !im.naturalWidth) return; ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang); ctx.scale(f, 1); ctx.rotate(-natural); ctx.drawImage(im, (r.x - r.px) * Z, (r.y - r.py) * Z, r.w * Z, r.h * Z); ctx.restore(); }
    function drawBody(ctx) {
      var h = hip(), sway = roll(), hipY = h.y, hx = h.x;
      // a little haze behind the robot so its dark head and shoulders read against the room
      var hz = ctx.createRadialGradient(hx, shoulderY() - 30 * Z, 10, hx, shoulderY(), 330 * Z); hz.addColorStop(0, "rgba(" + lightRgb() + ",.16)"); hz.addColorStop(1, "rgba(" + lightRgb() + ",0)"); ctx.fillStyle = hz; ctx.fillRect(hx - 340 * Z, shoulderY() - 340 * Z, 680 * Z, 680 * Z);
      ctx.save(); ctx.translate(hx, hipY); ctx.rotate(sway); ctx.translate(-hx, -hipY);
      piece(ctx, "body", hx, hipY, 0);
      piece(ctx, "head", hx + (610 - 611) * Z + rb.yaw * 5 * Z, hipY + (160 - 470) * Z + Math.max(0, rb.pitch) * 5 * Z, rb.yaw * 0.13 - sway * 0.6 + Math.sin(clock * 0.7) * 0.008);      // the head stays level while the body rolls
      ctx.restore();
    }
    function bone(ctx, x0, y0, x1, y1, w) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineWidth = w + 2.6; ctx.strokeStyle = "#05070a"; ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = "#8f98a5"; ctx.stroke(); ctx.lineWidth = w * 0.4; ctx.strokeStyle = "#f1f4f7"; ctx.stroke(); }
    function knuckle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = "#12161c"; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(200,208,220,.6)"; ctx.stroke(); }
    // A jointed hand in source-image units. It is mirrored for the left arm, so +y is always the side the fingers close toward and the thumb sits on.
    function hand(ctx, a, part) {
      var c = a.curl || 0, fa = Math.atan2(a.dy, a.dx), i;
      ctx.save(); ctx.translate(a.ex + a.dx * 146 * Z * (a.f || 1), a.ey + a.dy * 146 * Z * (a.f || 1)); ctx.rotate(fa + (a.wrist || 0)); var roll2 = 1 - 2 * (a.turn || 0); ctx.scale(Z, Z * a.side * (Math.abs(roll2) < 0.12 ? (roll2 < 0 ? -0.12 : 0.12) : roll2)); ctx.lineCap = "round"; ctx.lineJoin = "round";
      if (part !== "front") {
        var t0 = 1.0 - c * 0.85, tx1 = 12 + Math.cos(t0) * 25, ty1 = 17 + Math.sin(t0) * 25, t1 = t0 - 0.2 - c * 0.75; bone(ctx, 12, 17, tx1, ty1, 10); bone(ctx, tx1, ty1, tx1 + Math.cos(t1) * 19, ty1 + Math.sin(t1) * 19, 8.2); knuckle(ctx, tx1, ty1, 3.2);
        ctx.beginPath(); ctx.moveTo(-2, -18); ctx.lineTo(46, -22); ctx.quadraticCurveTo(54, -1, 50, 20); ctx.lineTo(-2, 17); ctx.closePath(); var pg = ctx.createLinearGradient(0, -22, 0, 20); pg.addColorStop(0, "#4a505b"); pg.addColorStop(0.5, "#23272e"); pg.addColorStop(1, "#0e1116"); ctx.fillStyle = pg; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = "#05070a"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(40, -15); ctx.lineTo(42, 12); ctx.lineTo(8, 10); ctx.closePath(); ctx.fillStyle = "rgba(190,198,210,.16)"; ctx.fill();
        var cg = ctx.createLinearGradient(0, -20, 0, 19); cg.addColorStop(0, "#eef1f5"); cg.addColorStop(0.5, "#9aa2ae"); cg.addColorStop(1, "#4c535e"); ctx.fillStyle = cg; ctx.fillRect(-9, -20, 13, 39); ctx.lineWidth = 1.4; ctx.strokeStyle = "#05070a"; ctx.strokeRect(-9, -20, 13, 39);
      }
      if (part !== "back") for (i = 3; i >= 0; i--) {
        var by = -16.5 + i * 11, k = i === 0 ? 0.92 : i === 3 ? 0.8 : i === 1 ? 1.05 : 1, cc = clamp(c + (a.typing ? Math.max(0, Math.sin(clock * 11 + i * 1.9 + a.side)) * 0.22 : 0), 0, 1.1);
        var ang = 0.05 * (i - 1.5) * (1 - cc) + cc * 1.0, x1 = 49 + Math.cos(ang) * 24 * k, y1 = by + Math.sin(ang) * 24 * k; bone(ctx, 49, by, x1, y1, 9.6);
        ang += cc * 1.25; var x2 = x1 + Math.cos(ang) * 19 * k, y2 = y1 + Math.sin(ang) * 19 * k; bone(ctx, x1, y1, x2, y2, 8.2);
        ang += cc * 0.95; bone(ctx, x2, y2, x2 + Math.cos(ang) * 15 * k, y2 + Math.sin(ang) * 15 * k, 7); knuckle(ctx, 49, by, 3.4); knuckle(ctx, x1, y1, 3); knuckle(ctx, x2, y2, 2.6);
      }
      ctx.restore();
    }
    function drawArms(ctx, behind) {
      rb.arms.forEach(function (a) {
        if ((a.y > deskY + 8 * Z) !== behind) return;
        var sh = shoulder(a.side), n = NAT[a.side], up = a.side < 0 ? "armL1" : "armR1", lo = a.side < 0 ? "armL2" : "armR2", g = grip(a);
        if (!behind && g.y > deskY - U * 0.45) { ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(g.x, deskY + 2, 46 * Z, 6 * Z, 0, 0, 6.2832); ctx.fill(); }
        limb(ctx, up, sh.x, sh.y, Math.atan2(a.ey - sh.y, a.ex - sh.x), n.u, a.f || 1);
        limb(ctx, lo, a.ex, a.ey, Math.atan2(a.y - a.ey, a.x - a.ex), n.f, a.f || 1);
        if (divider && a.side === 1) { ctx.save(); ctx.translate(g.x, g.y); ctx.fillStyle = metal(ctx, -4, 0, 4, 0, false); ctx.fillRect(-4, -U * 0.75, 8, U * 0.8); ctx.strokeStyle = "#05070a"; ctx.lineWidth = 1; ctx.strokeRect(-4, -U * 0.75, 8, U * 0.8); ctx.restore(); }
        hand(ctx, a, behind ? "all" : a.holding ? "front" : "all");      // when it holds a letter the palm and thumb are drawn behind the letter, see draw()
      });
    }
    function lightRgb() { return [Math.round(255 - cool * 60), Math.round(238 - heat * 125 - cool * 8), Math.round(216 - heat * 140 + cool * 39)].join(","); }
    function drawDesk(ctx) {
      var rgb = lightRgb(), flick = flicker > 0 ? 0.55 + Math.random() * 0.45 : 1, i;
      var tg = ctx.createLinearGradient(0, deskY, 0, deskY + U * 0.2); tg.addColorStop(0, "#2a2f38"); tg.addColorStop(1, "#151920"); ctx.fillStyle = tg; ctx.fillRect(0, deskY, S.W, U * 0.2);
      var pool = ctx.createRadialGradient(rb.x, deskY, 0, rb.x, deskY, S.W * 0.42 * spot); pool.addColorStop(0, "rgba(" + rgb + "," + (0.30 * flick).toFixed(3) + ")"); pool.addColorStop(1, "rgba(" + rgb + ",0)"); ctx.fillStyle = pool; ctx.fillRect(0, deskY, S.W, U * 0.2);
      ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.fillRect(0, deskY, S.W, 1.2);
      var fg = ctx.createLinearGradient(0, deskY + U * 0.2, 0, S.H); fg.addColorStop(0, "#0c0f14"); fg.addColorStop(1, "#05070a"); ctx.fillStyle = fg; ctx.fillRect(0, deskY + U * 0.2, S.W, S.H - deskY); ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(0, deskY + U * 0.2, S.W, 3);
      for (var x = S.W * 0.08; x < S.W; x += S.W * 0.21) { ctx.fillStyle = "rgba(255,255,255,.03)"; ctx.fillRect(x, deskY + U * 0.2, 1, S.H); }
      var mw = U * 1.7, mh = U * 1.05, my = deskY - mh - U * 0.22; ctx.fillStyle = "#0a0c10"; ctx.fillRect(monX - 4, deskY - U * 0.24, 8, U * 0.24); ctx.fillRect(monX - U * 0.3, deskY - 4, U * 0.6, 4);
      ctx.fillStyle = "#06080b"; ctx.fillRect(monX - mw / 2, my, mw, mh); ctx.lineWidth = 2; ctx.strokeStyle = "#23272e"; ctx.strokeRect(monX - mw / 2, my, mw, mh);
      var hot = monitor[0].indexOf("INTEGRITY") >= 0 || monitor[1].indexOf("INTERRUPTION") >= 0; ctx.font = "600 " + Math.max(8, U * 0.085).toFixed(1) + "px ui-monospace, Consolas, monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = hot ? "rgba(255,120,110,.95)" : cool > 0.3 ? "rgba(150,200,255,.9)" : "rgba(170,182,196,.8)";
      monitor.forEach(function (line, n) { ctx.fillText(line, monX - mw / 2 + U * 0.1, my + U * (0.24 + n * 0.17)); }); if (Math.sin(clock * 4) > 0) ctx.fillRect(monX - mw / 2 + U * 0.1, my + U * 0.52, U * 0.06, U * 0.1);
      ctx.fillStyle = "#0a0c10"; ctx.fillRect(homeX - U * 0.62, deskY - U * 0.06, U * 1.24, U * 0.06); ctx.fillStyle = "rgba(200,208,220,.13)"; for (i = 0; i < 14; i++) ctx.fillRect(homeX - U * 0.58 + i * U * 0.084, deskY - U * 0.05, U * 0.06, U * 0.02);
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(trayX - U * 0.4, deskY - U * 0.16, U * 0.8, U * 0.16); ctx.strokeStyle = "rgba(190,198,210,.45)"; ctx.lineWidth = 1.5; ctx.strokeRect(trayX - U * 0.4, deskY - U * 0.16, U * 0.8, U * 0.16);
      // the desk lamp, which swings after the slam
      ctx.save(); ctx.translate(lampX, deskY); ctx.fillStyle = "#0a0c10"; ctx.fillRect(-U * 0.16, -5, U * 0.32, 5); ctx.strokeStyle = "#2b3038"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-U * 0.25, -U * 0.95); ctx.stroke();
      ctx.translate(-U * 0.25, -U * 0.95); ctx.rotate(lamp.a * 0.5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-U * 0.5, -U * 0.22); ctx.stroke(); ctx.translate(-U * 0.5, -U * 0.22); ctx.rotate(lamp.a);
      ctx.beginPath(); ctx.moveTo(-U * 0.06, 0); ctx.lineTo(U * 0.06, 0); ctx.lineTo(U * 0.2, U * 0.2); ctx.lineTo(-U * 0.2, U * 0.2); ctx.closePath(); ctx.fillStyle = "#1b1f26"; ctx.fill(); ctx.stroke();
      var lc = ctx.createLinearGradient(0, U * 0.2, 0, U * 1.2); lc.addColorStop(0, "rgba(" + rgb + "," + (0.2 * flick).toFixed(3) + ")"); lc.addColorStop(1, "rgba(" + rgb + ",0)"); ctx.fillStyle = lc; ctx.beginPath(); ctx.moveTo(-U * 0.2, U * 0.2); ctx.lineTo(U * 0.2, U * 0.2); ctx.lineTo(U * 0.75, U * 1.2); ctx.lineTo(-U * 0.75, U * 1.2); ctx.closePath(); ctx.fill(); ctx.restore();
      papers.forEach(function (p) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); for (var n = 0; n < p.n; n++) { ctx.fillStyle = n % 2 ? "#cfcabf" : "#e4dfd3"; ctx.fillRect(-p.w / 2 + n * 1.5, -3 - n * 2.2, p.w, 2.4); } ctx.restore(); });
      tiles.forEach(function (t) { var s = U * 0.17; ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot); ctx.fillStyle = metal(ctx, -s / 2, -s / 2, s / 2, s / 2, false); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.strokeStyle = "#05070a"; ctx.lineWidth = 1; ctx.strokeRect(-s / 2, -s / 2, s, s); ctx.fillStyle = "#15181d"; ctx.font = "800 " + (s * 0.72).toFixed(1) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t.c, 0, 1); ctx.restore(); });
      if (card) { ctx.save(); ctx.translate(card.x, card.y); ctx.rotate(card.rot); ctx.fillStyle = "#e4dfd3"; ctx.beginPath(); ctx.moveTo(-U * 0.75, -U * 0.16); ctx.lineTo(U * 0.7, -U * 0.16); ctx.lineTo(U * 0.62, -U * 0.04); ctx.lineTo(U * 0.74, U * 0.06); ctx.lineTo(U * 0.66, U * 0.16); ctx.lineTo(-U * 0.75, U * 0.16); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#a3261f"; ctx.font = "800 " + (U * 0.13).toFixed(1) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("TASK CANCELLED", -U * 0.65, 1); ctx.restore(); }
    }
    function drawLight(ctx) {
      var lx = rb.x * 0.35 + homeX * 0.65, rgb = lightRgb(), fl = flicker > 0 ? 0.5 + Math.random() * 0.5 : 1;
      for (var i = 0; i < 7; i++) {      // nested cones, so the edge of the light is soft
        var wd = S.W * 0.4 * spot * (1 - i * 0.11), cone = ctx.createLinearGradient(0, -10, 0, deskY); cone.addColorStop(0, "rgba(" + rgb + "," + (0.05 * fl).toFixed(3) + ")"); cone.addColorStop(1, "rgba(" + rgb + "," + (0.012 * fl).toFixed(3) + ")");
        ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(lx - 20, -10); ctx.lineTo(lx + 20, -10); ctx.lineTo(lx + wd, deskY); ctx.lineTo(lx - wd, deskY); ctx.closePath(); ctx.fill();
      }
    }

    return {
      step: function (dt) {
        slowT = Math.max(0, slowT - dt); timeScale += ((slowT > 0 ? 0.28 : 1) - timeScale) * Math.min(1, dt * (slowT > 0 ? 18 : 5)); dt *= timeScale;
        clock += dt; sinceMeasure += dt; if (sinceMeasure > 0.5) { sinceMeasure = 0; measure(); }
        knocks = knocks.filter(function (t) { return clock - t < 6; }); level = knocks.length >= 5 ? 2 : knocks.length >= 3 ? 1 : 0;
        if (!seq && !wrecked && !restoring) {
          monitor[1] = level === 2 ? "STATE: REPEATED INTERRUPTION" : job ? "STATE: restoring" : "STATE: monitoring"; if (level === 2) flicker = 0.4;
          nextLoose -= dt; if (nextLoose < 0 && !job) { var pool = letters.filter(function (l) { return l.state === "home"; }); if (pool.length === letters.length) knock(pool[(Math.random() * pool.length) | 0]); nextLoose = rnd(14, 22); }
        }
        flicker = Math.max(0, flicker - dt); heat += (heatTo - heat) * Math.min(1, dt * 4); cool += (coolTo - cool) * Math.min(1, dt * 2.5); spot += (spotTo - spot) * Math.min(1, dt * 5);
        if (restoring) stepRestore(dt);
        stepLetters(dt); stepRobot(dt); stepThings(dt); stepWreck(dt);
        shake = Math.max(0, shake - dt * 2.2); root.style.setProperty("--shx", (shake ? (Math.random() - 0.5) * 14 * shake : 0).toFixed(1) + "px"); root.style.setProperty("--shy", (shake ? (Math.random() - 0.5) * 10 * shake : 0).toFixed(1) + "px");
        var over = S.inside && !seq && !wrecked && letters.some(function (l) { return l.state === "home" && Math.abs(S.mx - l.hx) < l.w / 2 + 2 && Math.abs(S.my - l.hy) < l.h / 2; }); root.style.cursor = over ? "pointer" : "";
      },
      settle: function () { rb.x = homeX; },
      click: function (x, y) {
        if (seq || wrecked || restoring) return; var hit = null, bd = 1e9;
        letters.forEach(function (l) { var d = Math.hypot(x - l.hx, y - l.hy); if (l.state === "home" && Math.abs(x - l.hx) < l.w / 2 + 3 && Math.abs(y - l.hy) < l.h / 2 && d < bd) { bd = d; hit = l; } });
        if (!knock(hit)) return; knocks.push(clock); nextLoose = Math.max(nextLoose, 10);
        if (knocks.length >= 8) startSeq();
      },
      act: function (name) { if (name === "restore") restore(); },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H); sync();
        var bg = ctx.createLinearGradient(0, 0, 0, S.H); bg.addColorStop(0, "#05070b"); bg.addColorStop(1, "#090c12"); ctx.fillStyle = bg; ctx.fillRect(0, 0, S.W, S.H);
        drawLight(ctx);
        var room = ctx; ctx = mctx; ctx.clearRect(0, 0, S.W, S.H);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, S.W, deskY + 1); ctx.clip(); drawBody(ctx); drawArms(ctx, true); ctx.restore(); drawDesk(ctx);
        rb.arms.forEach(function (a) { if (a.holding && a.y <= deskY + 8 * Z) hand(ctx, a, "back"); });
        letters.forEach(function (l) { if (l.state === "home" || l.hidden) return; var hgt = Math.max(0, deskY - l.y), a = clamp(0.5 - hgt / 500, 0, 0.5); if (a > 0.02) { ctx.fillStyle = "rgba(0,0,0," + a.toFixed(3) + ")"; ctx.beginPath(); ctx.ellipse(l.x, deskY + 3, l.w * (0.55 + hgt / 600) * l.sc, 3.5, 0, 0, 6.2832); ctx.fill(); } });
        fx.forEach(function (f) { if (f.kind === "shock") { var k = f.t / f.life; ctx.beginPath(); ctx.ellipse(f.x, f.y + 2, S.W * 0.7 * k, U * 0.16 * k + 3, 0, 0, 6.2832); ctx.lineWidth = 3 * (1 - k) + 0.5; ctx.strokeStyle = "rgba(255,235,220," + (0.8 * (1 - k)).toFixed(3) + ")"; ctx.stroke(); } else if (f.kind === "tap") { ctx.fillStyle = "rgba(255,255,255," + (0.35 * (1 - f.t / f.life)).toFixed(3) + ")"; ctx.fillRect(f.x - 14, f.y - 1, 28, 2); } });

        var t = tctx; t.clearRect(0, 0, S.W, S.H);
        letters.forEach(function (l) { if (l.px !== undefined && !l.hidden && l.state !== "home") { var sp = Math.hypot(l.x - l.px, l.y - l.py); if (sp > 9) { var g = t.createLinearGradient(l.px, l.py, l.x, l.y); g.addColorStop(0, "rgba(235,231,222,0)"); g.addColorStop(1, "rgba(235,231,222," + clamp(sp / 60, 0, 0.5).toFixed(3) + ")"); t.strokeStyle = g; t.lineWidth = l.h * 0.5 * l.sc; t.lineCap = "round"; t.beginPath(); t.moveTo(l.px - (l.x - l.px) * 1.5, l.py - (l.y - l.py) * 1.5); t.lineTo(l.x, l.y); t.stroke(); } } l.px = l.x; l.py = l.y; });
        drawArms(t, false);
        cracks.forEach(function (c) {
          t.lineCap = "round"; t.lineJoin = "round";
          c.lines.forEach(function (pts) { [[3, "rgba(0,0,0," + (0.55 * c.a).toFixed(3) + ")", 1], [1.1, "rgba(240,244,252," + (0.75 * c.a).toFixed(3) + ")", 0]].forEach(function (pass) { t.beginPath(); pts.forEach(function (q, i) { if (i) t.lineTo(q[0], q[1] + pass[2]); else t.moveTo(q[0], q[1] + pass[2]); }); t.lineWidth = pass[0]; t.strokeStyle = pass[1]; t.stroke(); }); });
          t.beginPath(); t.ellipse(c.x, c.y, 24, 8, 0, 0, 6.2832); t.fillStyle = "rgba(0,0,0," + (0.55 * c.a).toFixed(3) + ")"; t.fill(); t.beginPath(); t.ellipse(c.x, c.y + 1.5, 24, 8, 0, 0.2, Math.PI - 0.2); t.lineWidth = 1; t.strokeStyle = "rgba(255,255,255," + (0.35 * c.a).toFixed(3) + ")"; t.stroke();
        });
        dust.forEach(function (d) { var a = 1 - d.t / d.life; t.fillStyle = d.spark ? "rgba(255,210,140," + a.toFixed(3) + ")" : "rgba(210,205,195," + (a * 0.6).toFixed(3) + ")"; t.fillRect(d.x, d.y, d.s, d.s); });
        if (wrecked || seq) for (var i = 0; i < 26; i++) { t.fillStyle = "rgba(220,215,205,.18)"; t.fillRect((i * 173.3 + clock * (6 + i % 5)) % S.W, (i * 97.7 + Math.sin(clock * 0.3 + i) * 40 + clock * 3) % deskY, 1.5, 1.5); }
        fx.forEach(function (f) { var k = f.t / f.life; if (f.kind === "ring") { t.beginPath(); t.arc(f.x, f.y, f.r * (0.6 + k), 0, 6.2832); t.lineWidth = 1.5; t.strokeStyle = "rgba(235,240,250," + (0.8 * (1 - k)).toFixed(3) + ")"; t.stroke(); } else if (f.kind === "flash") { var g = t.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, "rgba(255,245,235," + (0.95 * (1 - k)).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,200,170,0)"); t.fillStyle = g; t.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); } else if (f.kind === "screen") { t.fillStyle = "rgba(255,225,215," + (0.5 * (1 - k)).toFixed(3) + ")"; t.fillRect(0, 0, S.W, S.H); } });
      }
    };
  };
})();
