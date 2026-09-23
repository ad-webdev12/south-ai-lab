/* South Artificial Intelligence Laboratory: the Agents hero.
   A seated workstation. The desk top sits on the same line as the bottom of the title.
   The robot never leaves the chair: it types, checks the monitor, tidies a tile. Tap one
   title letter and it falls to the desk; the robot looks, one hand leaves the keyboard,
   the elbow bends and the forearm extends, the wrist turns palm-down, thumb and index
   pinch the letter, it lifts it, checks the empty slot, and the letter is drawn back in
   with a click. Rapid taps escalate from the chair: amber monitor, a stare, a grip on the
   desk edge, then a slam, letters blasted across the upper hero, and a sweep or a flick
   into a visual copy of the navigation. The real links are never touched. The monitor
   then shows RESTART TITLE SYSTEM.
   The robot is a render cut into pieces (assets/img/robot), posed with two-joint inverse
   kinematics. The hands are drawn so the fingers can type and pinch. */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL) return;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var RIG = {"head":{"x":490,"y":40,"w":140,"h":192,"px":558,"py":228},"torso":{"x":440,"y":196,"w":245,"h":454,"px":561,"py":600},"armL1":{"x":364,"y":246,"w":92,"h":288,"px":415,"py":280,"ex":405,"ey":520},"armR1":{"x":668,"y":246,"w":92,"h":288,"px":709,"py":280,"ex":719,"ey":520},"armL2":{"x":344,"y":511,"w":98,"h":183,"px":405,"py":520,"wx":386,"wy":690},"armR2":{"x":682,"y":511,"w":98,"h":183,"px":719,"py":520,"wx":738,"wy":690},"thighL":{"x":428,"y":631,"w":116,"h":273,"px":490,"py":650,"kx":487,"ky":895},"thighR":{"x":580,"y":631,"w":116,"h":273,"px":634,"py":650,"kx":637,"ky":895},"shinL":{"x":441,"y":881,"w":93,"h":313,"px":487,"py":895},"shinR":{"x":590,"y":881,"w":93,"h":313,"px":637,"py":895},"footL":{"x":424,"y":1176,"w":128,"h":113,"px":487,"py":1190},"footR":{"x":572,"y":1176,"w":128,"h":113,"px":637,"py":1190}};
  var HANDS = {"L":{"wrist":[215,565],"palm":{"x":150,"y":560,"w":270,"h":340,"px":215,"py":565},"thumb":{"x":30,"y":585,"w":150,"h":400,"px":110,"py":625},"f0":{"x":130,"y":860,"w":150,"h":350,"px":185,"py":880},"f1":{"x":205,"y":855,"w":145,"h":345,"px":250,"py":878},"f2":{"x":275,"y":845,"w":145,"h":315,"px":317,"py":870},"f3":{"x":345,"y":835,"w":135,"h":280,"px":382,"py":860}},"R":{"wrist":[905,565],"palm":{"x":700,"y":560,"w":270,"h":340,"px":905,"py":565},"thumb":{"x":940,"y":585,"w":155,"h":400,"px":1010,"py":625},"f0":{"x":840,"y":855,"w":150,"h":355,"px":905,"py":880},"f1":{"x":770,"y":855,"w":145,"h":345,"px":835,"py":878},"f2":{"x":700,"y":845,"w":145,"h":315,"px":770,"py":870},"f3":{"x":640,"y":835,"w":135,"h":280,"px":703,"py":860}}}, HS = 0.21, IMG = {};
  function loadImg(n) { var im = new Image(); im.src = "assets/img/robot2/" + n + ".png"; IMG[n] = im; }
  Object.keys(RIG).forEach(loadImg); ["L", "R"].forEach(function (s) { ["palm", "thumb", "f0", "f1", "f2", "f3"].forEach(function (k) { loadImg(k + s); }); });
  function nat(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]); }
  var NAT = { "-1": { u: nat([RIG.armL1.px, RIG.armL1.py], [RIG.armL1.ex, RIG.armL1.ey]), f: nat([RIG.armL2.px, RIG.armL2.py], [RIG.armL2.wx, RIG.armL2.wy]) }, "1": { u: nat([RIG.armR1.px, RIG.armR1.py], [RIG.armR1.ex, RIG.armR1.ey]), f: nat([RIG.armR2.px, RIG.armR2.py], [RIG.armR2.wx, RIG.armR2.wy]) } };
  var SRC = { shoulder: [147, -320], head: [-3, -372], L1: Math.hypot(RIG.armL1.ex - RIG.armL1.px, RIG.armL1.ey - RIG.armL1.py), L2: Math.hypot(RIG.armL2.wx - RIG.armL2.px, RIG.armL2.wy - RIG.armL2.py), hand: 126, grip: 84 };

  SAIL.scenes.agents = function (S, root) {
    var wide = S.W >= 980, h1 = root.querySelector("h1"), hint = root.querySelector("[data-hint]"), live = root.querySelector("[data-live]"), panel = root.querySelector("[data-panel]"), consoleEl = root.querySelector("[data-console]");
    var mast = document.querySelector(".masthead"), logo = mast ? mast.querySelector(".brand img") : null, rr = root.getBoundingClientRect();
    var Z = wide ? clamp(S.H * 0.00115, 0.6, 1.0) : clamp(S.W * 0.0014, 0.4, 0.7), U = 133 * Z;
    var deskY = h1 ? clamp(h1.getBoundingClientRect().bottom - rr.top + 52, S.H * 0.42, S.H * 0.72) : S.H * 0.58;
    if (!wide) { var cb = consoleEl ? consoleEl.getBoundingClientRect().bottom - rr.top : S.H * 0.5; deskY = clamp(cb + U * 3.1, S.H * 0.55, S.H - U * 1.2); }
    Z = Math.min(Z, (deskY - 98) / 500); U = 133 * Z;                 // the head must stay under the navigation bar
    var G = 2300, L1 = SRC.L1 * Z, L2 = SRC.L2 * Z, HAND = SRC.grip * Z, HLEN = SRC.hand * Z, titleX0 = h1 ? h1.getBoundingClientRect().left - rr.left : 60;
    var reach0 = (SRC.shoulder[0] + SRC.grip) * Z + L1 + L2 + 320 * Z * 0.52, homeX = wide ? Math.min(S.W * 0.56, titleX0 + reach0 - 6) : S.W * 0.55;
    var deskX0 = wide ? Math.max(16, titleX0 - 44) : 0, deskX1 = wide ? Math.min(S.W - 16, homeX + U * 2.9) : S.W, slab = U * 0.1;
    var monX = homeX + U * 1.75, kbX = homeX, trayX = homeX - U * 1.75;
    var reach = { x0: deskX0 + 16, x1: Math.min(deskX1 - 24, homeX + U * 2.6) };

    function hintText(t) { if (hint && hint.textContent !== t) hint.textContent = t; }
    function announce(t) { if (live) { live.textContent = ""; window.setTimeout(function () { live.textContent = t; }, 30); } }

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
      words.forEach(function (word, wi) { if (wi) h1.appendChild(document.createTextNode(" ")); var w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true"); word.split("").forEach(function (ch) { var l = document.createElement("span"); l.className = "l"; l.textContent = ch; w.appendChild(l); }); h1.appendChild(w); });
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
        var op = l.state === "sink" || l.state === "return" ? (l.op === undefined ? 1 : l.op).toFixed(2) : ""; if (l.opv !== op) { l.el.style.opacity = op; l.opv = op; }
        var dis = out || !!seq || wrecked || !!restoring; if (l.btn.disabled !== dis) l.btn.disabled = dis;
      });
    }
    function restY(l) { return deskY - l.h * 0.5 * l.sc + 2; }
    function spare(l, want) {
      // a letter stays where it lands; it only shifts a little when it would sit on another one
      var taken = letters.filter(function (o) { return o !== l && (o.state === "rest" || o.state === "slide"); }), gap = l.w * 1.05, big = seq || wrecked, x0 = big ? deskX0 + 24 : Math.max(deskX0 + 16, want - l.w * 2.2), x1 = big ? deskX1 - 24 : Math.min(deskX1 - 16, want + l.w * 2.2);
      for (var n = 0; n < 80; n++) { var x = clamp(want + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * gap * 0.5, x0, x1); if (!taken.some(function (o) { var ox = o.slide === undefined ? o.x : o.slide; return Math.abs(ox - x) < (o.w + l.w) * 0.5; })) return x; }
      return big ? null : want;
    }
    function knock(l) {
      if (!l || l.state !== "home") return false;
      // it drops straight down onto the desk under gravity, with a small bounce
      l.state = "loose"; l.t = 0; l.bounced = 0; l.gf = 1; l.vx = rnd(-24, 24); l.vy = -30; l.vr = rnd(-2.5, 2.5); l.land = null; l.vxArc = 0; l.arcTo = false;
      announce("The letter " + l.ch + " fell. The agent is restoring the title."); if (level < 1) hintText("The agent is restoring the title."); return true;
    }
    function lockIn(l) {
      l.state = "home"; l.op = 1; l.hidden = false; l.x = l.hx; l.y = l.hy; l.rot = 0; l.sc = 1; l.big = 0; l.el.classList.remove("lock"); void l.el.offsetWidth; l.el.classList.add("lock");
      fx.push({ kind: "ring", x: l.hx, y: l.hy, r: l.h * 0.5, t: 0, life: 0.35 }); fx.push({ kind: "slot", l: l, t: 0, life: 0.5 });
      if (!restoring && !seq && letters.every(function (o) { return o === l || o.state === "home"; })) { announce("Title complete."); if (level < 1) hintText("Tap a letter to knock it loose."); }
    }

    /* ---- state ---- */
    var rb = { lean: 0, leanTo: 0, yaw: 0.1, pitch: 0.2, yawTo: 0.1, pitchTo: 0.2, arms: [-1, 1].map(function (s) { return { side: s, x: homeX + s * U * 0.5, y: deskY - 10, ex: 0, ey: 0, tx: homeX + s * U * 0.5, ty: deskY - 10, vx: 0, vy: 0, curl: 0.4, curlTo: 0.4, pinch: 0, pinchTo: 0, wrist: 0, wristTo: 0.6, roll: 1, rollTo: 1, hand: 0, speed: 6, typing: 0, holding: false, keyShift: 0 }; }) };
    var job = null, work = { i: 0, t: 0, k: 0 }, knocks = [], level = 0, clock = 0, sinceMeasure = 0, cue = null, cueAt = 5, variant = 0, shake = 0, fx = [], dust = [], heat = 0, heatTo = 0, warm = 0, warmTo = 0, cool = 0, coolTo = 0, flicker = 0, chair = 0, keysDown = [];
    var gripT = 0, track = null, seq = null, wrecked = false, restoring = null, wreck = null, cracks = [], monitor = ["TASK  restore title", "STATE observing"], card = null, tilt = null, timeScale = 1, slowT = 0, stare = 0;
    var tiles = ["A", "I", "R", "L"].map(function (c, i) { return { c: c, ox: trayX + U * (0.05 + i * 0.26), oy: deskY - U * 0.085, x: 0, y: 0, rot: (i - 1.5) * 0.14, vx: 0, vy: 0, vr: 0, free: false }; });
    tiles.forEach(function (t) { t.x = t.ox; t.y = t.oy; });

    function hip() { return { x: homeX, y: deskY + 62 * Z + chair * 6 * Z }; }
    function leanRot() { return rb.lean * 0.55; }        // lean is signed: negative tips the torso toward the title
    function shoulder(side) { var h = hip(), r = leanRot(), lx = side * SRC.shoulder[0] * Z, ly = SRC.shoulder[1] * Z; return { x: h.x + lx * Math.cos(r) - ly * Math.sin(r), y: h.y + lx * Math.sin(r) + ly * Math.cos(r) }; }
    function headPos() { var h = hip(), r = leanRot(), lx = SRC.head[0] * Z, ly = SRC.head[1] * Z; return { x: h.x + lx * Math.cos(r) - ly * Math.sin(r), y: h.y + lx * Math.sin(r) + ly * Math.cos(r) }; }
    function lookAt(x, y, k) { var hp = headPos(); rb.yawTo = clamp((x - hp.x) / (U * 3.4), -1, 1); rb.pitchTo = clamp((y - hp.y) / (U * 3), -1, 1) * (k || 1); }
    function grip(a) { return { x: a.x + Math.cos(a.hand) * HAND, y: a.y + Math.sin(a.hand) * HAND }; }
    function toward(x) { return x < homeX ? -1 : 1; }
    function aim(a, x, y) { var g = grip(a); a.tx = x - (g.x - a.x); a.ty = y - (g.y - a.y); a.handDir = null; }
    // the resting typing pose: wrists just above the keys, the two hands at slightly different angles
    function typingPose(a) { a.tx = kbX + a.side * U * (a.side < 0 ? 0.5 : 0.58) + a.keyShift; a.ty = deskY - HLEN * 0.96 - (a.side < 0 ? 3 : 0); a.wristTo = 1; a.handDir = Math.PI / 2 + a.side * 0.08; a.rollTo = 1; a.curlTo = 0.35; a.pinchTo = 0; a.speed = 5; }

    /* ---- restoring one letter, about 1.6 seconds from the chair ---- */
    function nextJob() { var best = null, bd = 1e9; letters.forEach(function (l) { if (l.state === "rest") { var d = Math.abs(l.x - homeX); if (d < bd) { bd = d; best = l; } } }); return best ? { l: best, phase: "notice", t: 0, arm: rb.arms[best.x < homeX ? 0 : 1], other: rb.arms[best.x < homeX ? 1 : 0] } : null; }
    function stepJob(dt) {
      var j = job, l = j.l, a = j.arm, quick = 1 + level * 0.4; j.t += dt;
      if (l.state !== "rest" && l.state !== "held" && l.state !== "magnet" && !(l.state === "home" && j.phase === "release")) { job = null; return; }
      track = l.state === "rest" ? { x: l.x } : null; typingPose(j.other); j.other.typing = 0;
      if (j.phase === "notice") { lookAt(l.x, l.y); rb.leanTo = toward(l.x) * 0.3; if (j.t > 0.14 / quick) { j.phase = "reach"; j.t = 0; } }
      else if (j.phase === "reach") {
        lookAt(l.x, l.y); rb.leanTo = toward(l.x) * clamp((Math.abs(l.x - homeX) - U * 1.2) / (U * 3), 0.15, 1); aim(a, l.x, l.y - 6 * Z); a.wristTo = 0.9; a.rollTo = 1; a.curlTo = 0.15; a.pinchTo = 0; a.speed = 9 * quick;
        var g = grip(a); if (Math.hypot(g.x - l.x, g.y - l.y + 6 * Z) < 9 || j.t > 0.4) { j.phase = "pinch"; j.t = 0; }
      } else if (j.phase === "pinch") { aim(a, l.x, l.y - 2 * Z); a.pinchTo = 1; a.curlTo = 0.7; if (j.t > 0.1 / quick) { l.state = "held"; j.phase = "lift"; j.t = 0; a.holding = true; } }
      else if (j.phase === "lift") {
        rb.leanTo = toward(l.hx) * 0.25; var sh = shoulder(a.side); aim(a, homeX + a.side * U * 0.55, sh.y + U * 0.85); a.wristTo = 0; a.rollTo = 0; a.speed = 8 * quick; lookAt(l.hx, l.hy);      // it checks the empty slot
        if (j.t > 0.2 / quick) { j.phase = "extend"; j.t = 0; }
      } else if (j.phase === "extend") {
        lookAt(l.hx, l.hy); rb.leanTo = toward(l.hx) * clamp((Math.abs(l.hx - homeX) - U * 1.2) / (U * 3), 0.15, 1); var s2 = shoulder(a.side), dx = l.hx - s2.x, dy = l.hy - s2.y, d = Math.hypot(dx, dy) || 1, R = L1 + L2 + HAND * 0.7 - 4;
        aim(a, s2.x + dx / d * Math.min(d, R), s2.y + dy / d * Math.min(d, R)); a.wristTo = 0; a.rollTo = 0; a.speed = 9 * quick;
        var g2 = grip(a); if (Math.hypot(a.x - a.tx, a.y - a.ty) < 10 || j.t > 0.34) { l.state = "magnet"; l.t = 0; l.from = { x: g2.x, y: g2.y, rot: l.rot }; l.dur = clamp(Math.hypot(g2.x - l.hx, g2.y - l.hy) / 1500, 0.14, 0.34) / quick; a.pinchTo = 0; a.curlTo = 0.2; a.holding = false; j.phase = "release"; j.t = 0; }
      } else if (j.phase === "release") { lookAt(l.hx, l.hy); rb.leanTo = toward(l.hx) * 0.1; a.tx = a.x; a.ty = a.y + 6 * Z; if (l.state === "home" && j.t > 0.18) { job = null; work.t = 0; work.i = 3; } }
      if (l.state === "held") { var gh = grip(a); l.x = gh.x; l.y = gh.y; l.rot += ((j.phase === "extend" ? 0 : a.hand * 0.3) - l.rot) * Math.min(1, dt * 9); }    // the wrist turns the letter upright before it goes back
    }

    /* ---- the quiet work loop: monitor, type, title, tidy a tile, type ---- */
    function stepWork(dt) {
      var w = work, a0 = rb.arms[0], a1 = rb.arms[1]; w.t += dt; rb.leanTo = 0.02;
      function next() { w.i = (w.i + 1) % 5; w.t = 0; w.k++; }
      typingPose(a0); typingPose(a1); a0.typing = a1.typing = 0;
      if (w.i === 0) { lookAt(monX, deskY - U * 0.7, 0.6); if (w.t > 1.1) next(); }
      else if (w.i === 1) { lookAt(kbX, deskY - U * 0.2, 0.7); typeBeat(w.t); if (w.t > 2.2) next(); }
      else if (w.i === 2) { lookAt(S.W * 0.2, 130); if (w.t > 1.3) next(); }
      else if (w.i === 3) { var t = tiles[w.k % tiles.length]; lookAt(t.x, t.y); if (w.t < 0.5) { aim(a0, t.x, t.y - 4 * Z); a0.wristTo = 0.9; a0.pinchTo = 0; a0.speed = 6; } else if (w.t < 1.2) { aim(a0, t.ox + (w.k % 2 ? 10 : -10) * Z, t.oy - 4 * Z); a0.pinchTo = 1; a0.wristTo = 0.9; var gt = grip(a0); t.x += (gt.x - t.x) * Math.min(1, dt * 8); t.rot *= 0.92; } else { a0.pinchTo = 0; if (w.t > 1.6) { t.ox = t.x; next(); } } }
      else { lookAt(kbX + U * 0.4, deskY - U * 0.3, 0.7); typeBeat(w.t + 3); if (w.t > 2.4) next(); }
    }
    function typeBeat(t) {       // one hand at a time: two keys go down, the wrist shifts a few pixels, then the other hand
      var a0 = rb.arms[0], a1 = rb.arms[1], beat = Math.floor(t * 2.6), left = beat % 3 !== 1, a = left ? a0 : a1;
      a.typing = 1; a.keyShift = ((beat % 4) - 1.5) * 3 * Z;
      if (Math.floor(t * 10.4) % 4 === 0 && keysDown.length < 2) { var kx = a.x + a.side * rnd(-14, 14) * Z + (left ? 6 : -6) * Z; keysDown.push({ x: kx, t: 0 }); }
    }

    /* ---- a visual copy of the navigation bar that can break ---- */
    function buildWreck() {
      if (!mast) return null; var r0 = root.getBoundingClientRect(), layer = document.createElement("div"); layer.className = "navwreck"; layer.setAttribute("aria-hidden", "true"); root.appendChild(layer);
      var frags = [], labels = [];
      function frag(el, o) { layer.appendChild(el); o.el = el; o.x = o.y = o.rot = o.vx = o.vy = o.vr = 0; o.mode = "still"; o.a = 1; frags.push(o); }
      [].forEach.call(mast.querySelectorAll(".mainnav > a, .navgroup > button, .mast-join"), function (el) {
        if (!el.getClientRects().length) return; var cs = getComputedStyle(el), key = el.textContent.trim().toLowerCase(), up = cs.textTransform === "uppercase", er = el.getBoundingClientRect();
        labels.push({ key: key, x: er.left - r0.left + er.width / 2, y: er.top - r0.top + er.height / 2 });
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), node;
        while ((node = walker.nextNode())) for (var i = 0; i < node.nodeValue.length; i++) {
          var ch = node.nodeValue[i]; if (!ch.trim()) continue; var rg = document.createRange(); rg.setStart(node, i); rg.setEnd(node, i + 1); var r = rg.getBoundingClientRect(); if (!r.width) continue;
          var s = document.createElement("span"); s.textContent = up ? ch.toUpperCase() : ch; s.style.cssText = "left:" + (r.left - r0.left) + "px;top:" + (r.top - r0.top) + "px;width:" + r.width + "px;height:" + r.height + "px;font:" + cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + "/" + r.height + "px " + cs.fontFamily + ";color:" + cs.color + ";opacity:" + cs.opacity;
          frag(s, { key: key, ch: ch.toUpperCase(), ox: r.left - r0.left + r.width / 2, oy: r.top - r0.top + r.height / 2 });
        }
        if (el.getAttribute("aria-current") || (el.parentNode.classList && el.parentNode.classList.contains("on"))) [0, 1].forEach(function (half) { var u = document.createElement("i"), x0 = er.left - r0.left + 15, wd = (er.width - 30) / 2; u.style.cssText = "left:" + (x0 + half * wd) + "px;top:" + (er.bottom - r0.top - 23) + "px;width:" + wd + "px;height:1px;background:" + cs.color + ";transform-origin:" + (half ? "100%" : "0") + " 50%"; frag(u, { key: key, line: half ? 1 : -1, ox: x0 + half * wd + wd / 2, oy: er.bottom - r0.top - 23 }); });
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
        if (wrecked && f.mode !== "fall" && f.mode !== "slide") f.a = Math.max(0, f.a - dt * 1.2);      // the copy fades and the real bar shows through
        var t = "translate(" + f.x.toFixed(1) + "px," + f.y.toFixed(1) + "px) rotate(" + f.rot.toFixed(3) + "rad)"; if (f.tf !== t) { f.el.style.transform = t; f.tf = t; }
        var op = f.a.toFixed(2); if (f.op !== op) { f.el.style.opacity = op; f.op = op; }
      });
      if (wrecked && mast && mast.classList.contains("wrecked") && wreck.frags.every(function (f) { return f.mode === "fall" || f.mode === "slide" || f.mode === "gone" || f.a <= 0.02; })) mast.classList.remove("wrecked");
      if (tilt) { tilt.t += dt; var a = tilt.t < 0.22 ? tilt.a * Math.sin(tilt.t / 0.22 * Math.PI) : 0; wreck.layer.style.transform = "rotate(" + a.toFixed(4) + "rad)"; if (tilt.t > 0.25) tilt = null; }
    }

    /* ---- escalation, all from the chair ---- */
    function fly(l, to, dur, sc, spin, arc) { l.state = "script"; l.t = 0; l.dur = dur; l.from = { x: l.x, y: l.y, rot: l.rot, sc: l.sc }; l.to = to; l.toSc = sc; l.spin = spin; l.arc = arc; l.hidden = false; }
    function loose(l, vx, vy, gf) { if (!l) return; l.state = "falling"; l.gf = gf; l.bounced = -1; l.vx = vx; l.vy = vy; l.vr = rnd(-6, 6); l.land = null; l.vxArc = 0; }
    function startSeq() {
      seq = { t: 0, did: {} }; job = null; track = null; wreck = buildWreck(); heatTo = 1; variant = (variant + 1 + ((Math.random() * 2) | 0)) % 3;
      root.setAttribute("data-state", "destruction"); hintText("Manual override."); announce("Manual override. The agent is breaking the interface.");
      monitor = ["TASK INTEGRITY  LOST", "MANUAL OVERRIDE"];
      letters.forEach(function (l) { if (l.state === "home" || l.state === "cue") { l.state = "shiver"; l.t = 0; } else if (l.state === "held" || l.state === "magnet" || l.state === "slide") loose(l, 0, 0, 1); });
      rb.arms.forEach(function (a) { a.holding = false; });
    }
    function once(key, at) { if (seq.t >= at && !seq.did[key]) { seq.did[key] = 1; return true; } return false; }
    function stepSeq(dt) {
      var t = (seq.t += dt), a0 = rb.arms[0], a1 = rb.arms[1], sy = shoulder(1).y, slamX = homeX + U * 0.5, V = variant;
      a0.handDir = a1.handDir = null; a0.tx = homeX - U * 0.62; a0.ty = deskY - U * 0.02; a0.wristTo = 0.9; a0.rollTo = 1; a0.curlTo = 0.85; a0.pinchTo = 0; a0.speed = 7; a0.typing = 0;
      a1.tx = homeX + U * 0.62; a1.ty = deskY - U * 0.02; a1.wristTo = 0.9; a1.rollTo = 1; a1.curlTo = 0.5; a1.pinchTo = 0; a1.speed = 7; a1.typing = 0;
      rb.leanTo = t < 0.8 ? -0.08 : 0.12; rb.yawTo = 0; rb.pitchTo = t < 0.8 ? -0.6 : 0.5;
      // it drops the tile it was holding, then one hand comes up and slams the desk
      if (once("droptile", 0.3)) { var tt = tiles[0]; tt.free = true; tt.vx = rnd(-40, 40); tt.vy = -60; tt.vr = rnd(-4, 4); }
      if (once("flash", 0.75)) fx.push({ kind: "screen", t: 0, life: 0.2 });
      if (t > 0.8 && t < 1.2) { a1.tx = homeX + U * 0.7; a1.ty = sy - U * 0.9; a1.speed = 12; a1.wristTo = 0.3; a1.curlTo = 1; }
      if (t >= 1.2 && t < 1.7) { a1.tx = slamX; a1.ty = deskY - U * 0.02; a1.speed = 32; a1.wristTo = 0.9; a1.curlTo = 1; }
      if (once("slam", 1.28)) {
        shake = 1; slowT = 0.5; chair = 1; flicker = 0.7; fx.push({ kind: "shock", x: slamX, y: deskY, t: 0, life: 1 });
        for (var i = 0; i < 14; i++) dust.push({ x: slamX + rnd(-40, 40), y: deskY - 4, vx: rnd(-240, 240), vy: rnd(-240, -40), t: 0, life: rnd(0.7, 1.6), s: rnd(1, 2.4), g: 300 });
        // the title letters blast across the upper hero and come down on the desk, never on the copy
        letters.forEach(function (l, i) { if (l.state !== "shiver" && l.state !== "rest") return; var wgt = 0.75 + l.w / 60, land = clamp(deskX0 + 40 + Math.random() * (deskX1 - deskX0 - 80), deskX0 + 30, deskX1 - 30), T = rnd(0.7, 1.05);
          var vy0 = (deskY - l.h / 2 - l.y - 0.5 * G * wgt * T * T) / T; if (l.y - vy0 * vy0 / (2 * G * wgt) < 110) { T = Math.sqrt(2 * Math.max(60, deskY - l.y) / (G * wgt)) + 0.1; vy0 = (deskY - l.h / 2 - l.y - 0.5 * G * wgt * T * T) / T; }
          loose(l, (land - l.x) / T, vy0, wgt); l.land = land; l.vxArc = 0; l.arcTo = false; });
        tiles.forEach(function (o) { o.free = true; o.vx = (o.x - slamX) * rnd(1, 2) + rnd(-100, 100); o.vy = rnd(-500, -220); o.vr = rnd(-8, 8); });
      }
      if (V === 1 || V === 2) {
        if (once("pick", 1.9)) { seq.R = letters.filter(function (l) { return l.state === "rest" || l.state === "falling" || l.state === "slide"; }).sort(function (p, q) { return Math.abs(p.x - homeX) - Math.abs(q.x - homeX); })[0] || letters[0]; }
        if (seq.R && t >= 1.9 && t < 2.4) { aim(a1, seq.R.x, seq.R.y - 4 * Z); a1.speed = 9; a1.wristTo = 0.9; a1.pinchTo = 1; a1.curlTo = 0.7; rb.leanTo = toward(seq.R.x) * 0.5; lookAt(seq.R.x, seq.R.y); }
        if (seq.R && once("hold", 2.35)) { seq.R.state = "inhand"; a1.holding = true; }
        if (seq.R && t >= 2.4 && t < 2.85) { a1.tx = homeX + U * 0.6; a1.ty = sy + U * 0.6; a1.wristTo = 0; a1.speed = 8; var tg = seq.t1 || label(V === 2 ? ["projects", "research"] : ["research", "projects", "join"]); if (tg) lookAt(tg.x, tg.y); }
        if (seq.R && t >= 2.85 && t < 3.2) { a1.tx = homeX + U * 0.9; a1.ty = sy - U * 1.7; a1.speed = 30; a1.pinchTo = t < 2.96 ? 1 : 0; a1.curlTo = 0.2; }
        if (seq.R && once("throw", 2.96)) { seq.t1 = label(V === 2 ? ["projects", "research"] : ["research", "projects", "join"]); var p = seq.t1 || { x: S.W * 0.6, y: 36 }; a1.holding = false; fly(seq.R, function () { return { x: p.x, y: p.y + (V === 2 ? 30 : 0) }; }, 0.45, 1.3, 12, U * 0.6); }
        if (seq.R && seq.R.state === "inhand") { var gr = grip(a1); seq.R.x = gr.x; seq.R.y = gr.y; seq.R.rot += (0.2 - seq.R.rot) * Math.min(1, dt * 8); seq.R.sc = 1.3; }
        if (seq.R && once("hit1", 3.42)) { slowT = 0.3; impact(seq.t1, true); seq.R.big = 1; loose(seq.R, rnd(80, 260), -200, 0.9); seq.R.land = clamp(deskX0 + 60 + Math.random() * (reach.x0 - deskX0), deskX0 + 30, deskX1 - 30); seq.R.arcTo = true; if (V === 2 && seq.t1) spill(seq.t1); }
      }
      if (V === 0 || V === 2) {
        var s0 = V === 0 ? 1.9 : 3.6;
        if (t >= s0 && t < s0 + 0.9) { var k = ease((t - s0 - 0.1) / 0.7); a0.tx = homeX - U * 0.1 - k * U * 2.5; a0.ty = deskY - U * 0.08; a0.wristTo = 0.6; a0.rollTo = 1; a0.curlTo = 0.9; a0.speed = 22; rb.leanTo = -0.55; lookAt(a0.x, deskY);
          if (t > s0 + 0.1) { for (var s = 0; s < 2; s++) dust.push({ x: a0.x, y: deskY - 2, vx: rnd(-360, 60), vy: rnd(-300, -40), t: 0, life: rnd(0.2, 0.5), s: rnd(1, 2), g: 900, spark: true });
            letters.forEach(function (l) { if ((l.state === "rest" || l.state === "slide") && l.x < a0.x + U * 0.3 && l.x > a0.x - U * 0.4 && !l.swept) { l.swept = true; loose(l, rnd(-500, -200), rnd(-560, -220), 0.7); l.land = clamp(l.x - rnd(100, 300), deskX0 + 30, deskX1 - 30); l.arcTo = true; } }); } }
        if (once("volley", s0 + 0.45)) { seq.shots = letters.filter(function (l) { return l.state !== "script" && l.state !== "inhand" && l !== seq.R; }).sort(function (p, q) { return Math.abs(p.x - homeX) - Math.abs(q.x - homeX); }).slice(0, 2); seq.t2 = label(["projects", "people"]); seq.t3 = label(["news", "resources"]); seq.shots.forEach(function (l, i) { var tg2 = i ? seq.t3 : seq.t2; if (tg2) fly(l, function () { return { x: tg2.x, y: tg2.y }; }, 0.5 + i * 0.15, 1.15, 10, U * 0.8); }); }
        if (once("hit2", s0 + 1.0)) { impact(seq.t2, false); loose(seq.shots[0], rnd(60, 220), -200, 0.9); seq.shots[0].land = clamp(deskX0 + 80, deskX0 + 30, deskX1 - 30); seq.shots[0].arcTo = true; }
        if (once("hit3", s0 + 1.15)) { impact(seq.t3, false); loose(seq.shots[1], rnd(60, 220), -200, 0.9); seq.shots[1].land = clamp(deskX0 + 140, deskX0 + 30, deskX1 - 30); seq.shots[1].arcTo = true; }
      }
      if (once("card", 2.9)) card = { x: S.W + 120, y: deskY - 7, tx: deskX0 + U * 0.95, rot: -0.1 };
      var end = V === 2 ? 5.3 : 4.5;
      if (t > end - 0.6) { rb.leanTo = -0.2; rb.pitchTo = 0.3; rb.yawTo = -0.3; }
      if (once("settle", end)) { wrecked = true; heatTo = 0.6; root.setAttribute("data-state", "aftermath"); hintText("Title system offline."); announce("Title system offline. Use Restart title system on the monitor to rebuild."); monitor = ["TITLE SYSTEM OFFLINE", ""]; showPanel(); }
    }
    function spill(lab) { if (!wreck || !lab) return; wreck.frags.forEach(function (f) { if (f.key === lab.key && f.line) { f.mode = "fall"; f.vx = f.line * rnd(60, 160); f.vy = rnd(-80, 40); f.vr = f.line * 4; } }); for (var i = 0; i < 6; i++) dust.push({ x: lab.x + rnd(-40, 40), y: lab.y + 14, vx: rnd(-60, 60), vy: rnd(40, 160), t: 0, life: rnd(1, 2.2), s: rnd(2, 4), g: 700, chip: true }); }
    function monitorRect() { var mw = U * 1.7, mh = U * 1.02; return { x: monX - mw / 2, y: deskY - mh - U * 0.22, w: mw, h: mh }; }
    function showPanel() { if (!panel) return; panel.hidden = false; var m = monitorRect(), pw = Math.max(m.w, 236), op = panel.offsetParent, r0 = root.getBoundingClientRect(), ox = 0, oy = 0; if (op && op !== root) { var pr = op.getBoundingClientRect(); ox = pr.left - r0.left; oy = pr.top - r0.top; } panel.style.left = (m.x + m.w / 2 - pw / 2 - ox) + "px"; panel.style.top = (m.y - oy) + "px"; panel.style.width = pw + "px"; panel.style.minHeight = m.h + "px"; panel.hidden = false; var b = panel.querySelector("button"); if (b) b.focus({ preventScroll: true }); }
    function restore() {
      if (!wrecked || restoring) return; var sy0 = window.scrollY; restoring = { t: 0 }; wrecked = false; seq = null; heatTo = 0; warmTo = 0; coolTo = 1; if (panel) panel.hidden = true;
      root.setAttribute("data-state", "recovery"); hintText("Restoring interface."); announce("Restoring interface."); monitor = ["STATE restoring", ""]; if (card) card.leave = true;
      letters.forEach(function (l, i) { if (l.state === "home") return; var sunk = l.state === "sink"; l.state = "return"; l.t = -i * 0.025; l.from = { x: l.x, y: sunk ? deskY + 8 : l.y, rot: l.rot, sc: l.sc }; l.hidden = false; l.swept = false; l.arcTo = false; l.op = sunk ? 0 : 1; });
      tiles.forEach(function (o) { o.from = { x: o.x, y: o.y, rot: o.rot }; o.free = false; }); rb.arms.forEach(function (a) { a.holding = false; });
      window.scrollTo(window.scrollX, sy0); window.setTimeout(function () { var f = letters[0] && letters[0].btn; if (f && !f.disabled) f.focus({ preventScroll: true }); }, 2000);
    }
    function stepRestore(dt) {
      restoring.t += dt; var k = ease((restoring.t - 0.2) / 1.2);
      tiles.forEach(function (o) { o.x = o.from.x + (o.ox - o.from.x) * k; o.y = o.from.y + (o.oy - o.from.y) * k; o.rot = o.from.rot * (1 - k); });
      cracks.forEach(function (c) { c.a = 1 - k; });
      if (restoring.t > 1.9) { if (wreck) { wreck.layer.parentNode.removeChild(wreck.layer); wreck = null; } if (mast) mast.classList.remove("wrecked"); if (logo) logo.style.transform = ""; cracks = []; restoring = null; knocks = []; level = 0; coolTo = 0; root.setAttribute("data-state", "calm"); hintText("Tap a letter to knock it loose."); announce("Interface restored."); cueAt = 8; monitor = ["TASK  restore title", "STATE observing"]; }
    }

    /* ---- letters ---- */
    function puff(x, n) { for (var i = 0; i < n; i++) dust.push({ x: x + rnd(-10, 10), y: deskY - 2, vx: rnd(-100, 100), vy: rnd(-60, -10), t: 0, life: rnd(0.3, 0.7), s: rnd(1, 2.2), g: 60 }); }
    function stepLetters(dt) {
      letters.forEach(function (l) {
        if (l.state === "loose") { l.t += dt; l.rot = Math.sin(l.t * 40) * 0.06 * Math.min(1, l.t * 5); if (l.t > 0.18) { l.state = "falling"; l.vx = l.vxArc || l.vx || 0; } }
        else if (l.state === "cue") { l.t += dt; var amp = l.t < 1.1 ? Math.min(1, l.t * 3) : Math.max(0, 1 - (l.t - 1.1) * 2); l.x = l.hx + Math.sin(l.t * 46) * 1.4 * amp; l.y = l.hy + Math.sin(l.t * 31) * 0.8 * amp; l.rot = Math.sin(l.t * 38) * 0.02 * amp; if (l.t > 1.7) lockIn(l); }
        else if (l.state === "shiver") { l.t += dt; l.x = l.hx + Math.sin(l.t * 50 + l.idx) * 1.6; l.y = l.hy + Math.min(6, l.t * 5); l.rot = Math.sin(l.t * 33 + l.idx) * 0.05; }
        else if (l.state === "falling") {
          l.vy += G * l.gf * dt; if (l.arcTo && l.land !== null && l.land !== undefined) { l.vx += (l.land - l.x) * 2.2 * dt; }
          l.x += l.vx * dt; l.y += l.vy * dt; l.rot += l.vr * dt; if (l.y > deskY - 200) l.sc += ((l.big ? 1.25 : 1) - l.sc) * Math.min(1, dt * 3);
          if (l.x < l.w) { l.x = l.w; l.vx = Math.abs(l.vx) * 0.5; } else if (l.x > S.W - l.w) { l.x = S.W - l.w; l.vx = -Math.abs(l.vx) * 0.5; }
          if (l.y > restY(l) && l.vy > 0) {
            l.y = restY(l); puff(l.x, 3);
            if (l.bounced >= 1 || l.vy < 200) { l.vy = 0; l.vr = 0; l.rot = clamp(((l.rot + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI, -0.5, 0.5); l.slide = spare(l, l.land !== null && l.land !== undefined ? l.land : l.x); l.t = 0; l.sx = l.x; if (l.slide === null) { l.state = "sink"; l.slide = undefined; } else l.state = "slide"; }
            else { l.bounced++; l.vy *= -0.32; l.vx *= 0.55; l.vr *= 0.4; fx.push({ kind: "tap", x: l.x, y: deskY, t: 0, life: 0.25 }); if (Math.abs(l.vy) > 200) fx.push({ kind: "flash", x: l.x, y: deskY - 4, t: 0, life: 0.12, r: 24 }); }
          }
        } else if (l.state === "slide") {
          l.t += dt; var dist = l.slide - l.sx, dur = clamp(Math.abs(dist) / 1400, 0.12, 0.4), u = clamp(l.t / dur, 0, 1), e = 1 - (1 - u) * (1 - u); l.x = l.sx + dist * e; l.y = restY(l); l.rot *= 1 - Math.min(1, dt * 3); l.sc += (1 - l.sc) * Math.min(1, dt * 3);
          if (u >= 1) { l.state = "rest"; l.x = l.slide; l.slide = undefined; }
        } else if (l.state === "rest") { l.y = restY(l); l.sc += (1 - l.sc) * Math.min(1, dt * 3); }
        else if (l.state === "sink") { if (l.hidden) return; l.t += dt; l.y += 90 * dt; l.rot += 0.6 * dt; l.op = Math.max(0, 1 - l.t * 2.2); if (l.t > 0.5) { l.hidden = true; l.op = 0; } }
        else if (l.state === "magnet") { l.t += dt; var k = l.t / l.dur, e2 = k >= 1 ? 1 : 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.05; l.x = l.from.x + (l.hx - l.from.x) * e2; l.y = l.from.y + (l.hy - l.from.y) * e2; l.rot = l.from.rot * (1 - e2); l.sc = 1; if (k >= 1) lockIn(l); }
        else if (l.state === "script") { l.t += dt; var uu0 = clamp(l.t / l.dur, 0, 1), to = l.to(), uu = uu0 * uu0 * (3 - 2 * uu0); l.x = l.from.x + (to.x - l.from.x) * uu; l.y = l.from.y + (to.y - l.from.y) * uu - Math.sin(uu0 * Math.PI) * l.arc; l.rot = l.from.rot + l.spin * uu0; l.sc = l.from.sc + (l.toSc - l.from.sc) * uu0; }
        else if (l.state === "return") { l.t += dt; if (l.t < 0) return; var q = ease(l.t / 1.0); l.op = Math.min(1, (l.op === undefined ? 1 : l.op) + dt * 4); l.x = l.from.x + (l.hx - l.from.x) * q; l.y = l.from.y + (l.hy - l.from.y) * q - Math.sin(q * Math.PI) * 40; l.rot = l.from.rot * (1 - q); l.sc = l.from.sc + (1 - l.from.sc) * q; if (l.t >= 1.0) lockIn(l); }
      });
    }
    function stepThings(dt) {
      tiles.forEach(function (o) { if (!o.free) return; o.vy += G * 0.7 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt; if (o.y > deskY - 4 && o.vy > 0) { o.y = deskY - 4; if (o.vy < 200) { o.vy = 0; o.vx *= 0.8; o.vr *= 0.8; if (Math.abs(o.vx) < 8) { o.vx = 0; o.vr = 0; } } else { o.vy *= -0.28; o.vx *= 0.6; o.vr *= 0.5; } } o.x = clamp(o.x, deskX0 + 10, deskX1 - 10); });
      if (card) { if (card.leave) { card.x -= S.W * 1.4 * dt; if (card.x < -300) card = null; } else card.x += (card.tx - card.x) * Math.min(1, dt * 5); }
      dust.forEach(function (d) { d.t += dt; d.vy += d.g * dt; d.vx *= Math.pow(0.4, dt); d.x += d.vx * dt; d.y += d.vy * dt; if (!d.spark && d.y > deskY - 2 && d.vy > 0) { d.y = deskY - 2; d.vy = 0; } }); dust = dust.filter(function (d) { return d.t < d.life; }); if (dust.length > 200) dust.splice(0, dust.length - 200);
      fx.forEach(function (f) { f.t += dt; }); fx = fx.filter(function (f) { return f.t < f.life; });
      keysDown.forEach(function (k) { k.t += dt; }); keysDown = keysDown.filter(function (k) { return k.t < 0.22; });
      chair = Math.max(0, chair - dt * 2.5);
    }

    /* ---- the body ---- */
    function stepRobot(dt) {
      if (seq) stepSeq(dt);
      else {
        if (!job && !wrecked && !restoring && level < 2) job = nextJob();
        if (job && level >= 3) { if (job.l.state === "held") loose(job.l, rnd(-60, 60), 0, 1); job.arm.holding = false; job = null; }
        if (job) stepJob(dt);
        else if (wrecked) { track = null; rb.leanTo = -0.15; rb.yawTo = -0.25; rb.pitchTo = 0.25; rb.arms.forEach(function (a) { a.tx = homeX + a.side * U * 0.62; a.ty = deskY - U * 0.02; a.wristTo = 0.9; a.rollTo = 1; a.curlTo = 0.85; a.pinchTo = 0; a.speed = 4; a.typing = 0; }); }
        else if (stare > 0) { track = null; rb.leanTo = 0; rb.yawTo = -0.15; rb.pitchTo = -0.45; rb.arms.forEach(function (a) { typingPose(a); a.typing = 0; }); if (level >= 3) { rb.arms[0].tx = homeX - U * 0.62; rb.arms[0].ty = deskY - U * 0.02; rb.arms[0].wristTo = 0.9; rb.arms[0].curlTo = 0.9; } }     // it stops and looks at the visitor; at level three a hand grips the desk edge
        else { track = null; stepWork(dt); }
      }
      rb.lean += (rb.leanTo - rb.lean) * Math.min(1, dt * 4.5); rb.yaw += (rb.yawTo - rb.yaw) * Math.min(1, dt * 5); rb.pitch += (rb.pitchTo - rb.pitch) * Math.min(1, dt * 5);
      rb.arms.forEach(function (a) {
        var sh = shoulder(a.side), K = a.speed * a.speed * 3.2, C = 2 * Math.sqrt(K) * 0.85, n = 3, h = dt / n;
        for (var s = 0; s < n; s++) { a.vx += ((a.tx - a.x) * K - a.vx * C) * h; a.vy += ((a.ty - a.y) * K - a.vy * C) * h; a.x += a.vx * h; a.y += a.vy * h; }
        a.y = Math.min(a.y, deskY - Math.max(10 * Z, Math.sin(a.hand || 0) * HLEN * 0.9));
        var dx = a.x - sh.x, dy = a.y - sh.y, d = Math.hypot(dx, dy) || 1, max = L1 + L2 - 2, min = Math.abs(L1 - L2) + 6;
        if (d > max) { a.x = sh.x + dx / d * max; a.y = sh.y + dy / d * max; dx = a.x - sh.x; dy = a.y - sh.y; d = max; } else if (d < min) { a.x = sh.x + dx / d * min; a.y = sh.y + dy / d * min; dx = a.x - sh.x; dy = a.y - sh.y; d = min; }
        var fs = clamp(d / ((L1 + L2) * 0.88), 0.56, 1); a.f = (a.f || 1) + (fs - (a.f || 1)) * Math.min(1, dt * 10); var l1 = L1 * a.f, l2 = L2 * a.f;
        var b = Math.atan2(dy, dx), cs = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), bend = Math.acos(cs);
        var o1 = Math.cos(b + bend) * a.side + Math.sin(b + bend) * 0.3, o2 = Math.cos(b - bend) * a.side + Math.sin(b - bend) * 0.3; if (!a.sign) a.sign = o1 > o2 ? 1 : -1; if (a.sign > 0 ? o2 > o1 + 0.25 : o1 > o2 + 0.25) a.sign = -a.sign;
        var want = b + bend * a.sign, exT = sh.x + Math.cos(want) * l1, eyT = sh.y + Math.sin(want) * l1; if (!a.ex && !a.ey) { a.ex = exT; a.ey = eyT; }
        a.ex += (exT - a.ex) * Math.min(1, dt * 18); a.ey += (eyT - a.ey) * Math.min(1, dt * 18); var el = Math.hypot(a.ex - sh.x, a.ey - sh.y) || 1; a.ex = sh.x + (a.ex - sh.x) / el * l1; a.ey = sh.y + (a.ey - sh.y) / el * l1;
        var fl = Math.hypot(a.x - a.ex, a.y - a.ey) || 1; a.dx = (a.x - a.ex) / fl; a.dy = (a.y - a.ey) / fl;
        var fa = Math.atan2(a.dy, a.dx), flatAng = a.handDir === null || a.handDir === undefined ? (a.dx >= 0 ? 0 : Math.PI) : a.handDir, wantW = flatAng - fa; while (wantW > Math.PI) wantW -= 6.2832; while (wantW < -Math.PI) wantW += 6.2832;
        a.wrist += (clamp(wantW, -1.4, 1.4) * a.wristTo - a.wrist) * Math.min(1, dt * 9); a.roll += (a.rollTo - a.roll) * Math.min(1, dt * 7); a.hand = fa + a.wrist;
        a.curl += (a.curlTo - a.curl) * Math.min(1, dt * 12); a.pinch += (a.pinchTo - a.pinch) * Math.min(1, dt * 12);
      });
    }

    /* ---- drawing ---- */
    function limb(ctx, name, sx, sy, ang, natural, f) { var r = RIG[name], im = IMG[name]; if (!im.complete || !im.naturalWidth) return; ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang); ctx.scale(f, 1); ctx.rotate(-natural); ctx.drawImage(im, (r.x - r.px) * Z, (r.y - r.py) * Z, r.w * Z, r.h * Z); ctx.restore(); }
    function piece(ctx, name, sx, sy, rot) { var r = RIG[name], im = IMG[name]; if (!im.complete || !im.naturalWidth) return; ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot); ctx.drawImage(im, (r.x - r.px) * Z, (r.y - r.py) * Z, r.w * Z, r.h * Z); ctx.restore(); }
    function handSide(a) {
      // which hand photo reads right for this direction: thumb inward when the fingers point down, thumb up when they point sideways
      var c = Math.cos(a.hand), s = Math.sin(a.hand), dx = -a.side * Math.max(0, s), dy = -Math.abs(c);
      return (s * dx - c * dy) >= 0 ? "R" : "L";           // the R photo has its thumb at local +x, which lands at (sin, -cos) on screen
    }
    function handPiece(ctx, H, name, side, rot, sy) {
      var r = H[name], im = IMG[name + side]; if (!im || !im.complete || !im.naturalWidth) return;
      ctx.save(); ctx.translate(r.px - H.wrist[0], r.py - H.wrist[1]); ctx.rotate(rot || 0); if (sy !== undefined && sy !== 1) ctx.scale(1, sy); ctx.drawImage(im, r.x - r.px, r.y - r.py, r.w, r.h); ctx.restore();
    }
    // The hand: the photo hand, cut into a palm, a thumb and four fingers that pivot at their knuckles. Local +y runs down the fingers.
    function hand(ctx, a, part) {
      var sd = handSide(a), H = HANDS[sd], k = Z * HS, c = a.curl, p = a.pinch, inward = sd === "R" ? 1 : -1, i;
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.hand - Math.PI / 2); ctx.scale(k, k);
      if (part !== "front") {
        handPiece(ctx, H, "palm", sd, 0, 1);
        for (i = 1; i < 4; i++) { var wig = a.typing ? Math.max(0, Math.sin(clock * 12 + i * 2.1 + a.side)) * 0.14 * (i === 1 || i === 2 ? 1 : 0.3) : 0; handPiece(ctx, H, "f" + i, sd, -inward * (c * 0.12 + p * 0.22) * (1 + i * 0.15), 1 - c * 0.3 - p * 0.18 - wig); }
        handPiece(ctx, H, "thumb", sd, -inward * (0.15 + c * 0.35 + p * 0.95), 1 - p * 0.12);
      }
      if (part !== "back") { var wig0 = a.typing ? Math.max(0, Math.sin(clock * 12 + a.side)) * 0.14 : 0; handPiece(ctx, H, "f0", sd, inward * (p * 0.55 - c * 0.05), 1 - c * 0.28 - p * 0.1 - wig0); }
      ctx.restore();
    }
    function drawLegs(ctx) {
      // seated and facing the room: the thighs come toward the viewer, the shins go down to the floor
      var h = hip();
      [["thighL", "shinL", "footL"], ["thighR", "shinR", "footR"]].forEach(function (leg) {
        var th = RIG[leg[0]], kx = h.x + (th.px - 561) * Z, ky = h.y + 8 * Z, knee = { x: kx + (th.kx - th.px) * Z, y: ky + (th.ky - th.py) * Z * 0.22 };
        var im = IMG[leg[0]]; if (im.complete && im.naturalWidth) { ctx.save(); ctx.translate(kx, ky); ctx.scale(1, 0.22); ctx.drawImage(im, (th.x - th.px) * Z, (th.y - th.py) * Z, th.w * Z, th.h * Z); ctx.restore(); }
        var sh = RIG[leg[1]], ims = IMG[leg[1]]; if (ims.complete && ims.naturalWidth) { ctx.save(); ctx.translate(knee.x, knee.y); ctx.scale(1, 0.72); ctx.drawImage(ims, (sh.x - sh.px) * Z, (sh.y - sh.py) * Z, sh.w * Z, sh.h * Z); ctx.restore(); }
        var ft = RIG[leg[2]], imf = IMG[leg[2]], fy = knee.y + (ft.py - sh.py) * Z * 0.72; if (imf.complete && imf.naturalWidth) { ctx.save(); ctx.translate(knee.x, fy); ctx.scale(1, 0.8); ctx.drawImage(imf, (ft.x - ft.px) * Z, (ft.y - ft.py) * Z, ft.w * Z, ft.h * Z); ctx.restore(); }
        ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.beginPath(); ctx.ellipse(knee.x + 4 * Z, fy + 70 * Z, 60 * Z, 8 * Z, 0, 0, 6.2832); ctx.fill();
      });
    }
    function drawChair(ctx) {
      var h = hip(), sy = shoulder(1).y; ctx.save(); ctx.translate(homeX, 0);
      // curved backrest behind the torso
      var bt = sy - U * 0.02 + chair * 4, bw = U * 1.0, rr = U * 0.3; ctx.beginPath(); ctx.moveTo(-bw * 0.9, deskY); ctx.lineTo(-bw, bt + rr); ctx.quadraticCurveTo(-bw, bt, -bw + rr, bt); ctx.quadraticCurveTo(0, bt - U * 0.12, bw - rr, bt); ctx.quadraticCurveTo(bw, bt, bw, bt + rr); ctx.lineTo(bw * 0.9, deskY); ctx.closePath();
      var g = ctx.createLinearGradient(-U * 1.3, 0, U * 1.3, 0); g.addColorStop(0, "#0b0d11"); g.addColorStop(0.5, "#1c2028"); g.addColorStop(1, "#0b0d11"); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(190,200,214,.22)"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-bw + rr, bt + U * 0.22); ctx.quadraticCurveTo(0, bt + U * 0.08, bw - rr, bt + U * 0.22); ctx.strokeStyle = "rgba(255,255,255,.09)"; ctx.stroke(); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(-bw * 0.72, bt + U * 0.5, bw * 1.44, deskY - bt - U * 0.5);
      ctx.restore();
    }
    function drawBase(ctx) {          // the seat edge, the column and one arm of the base, below the desk slab, right of it
      ctx.save(); ctx.translate(homeX, 0); var top = hip().y + U * 0.2;
      ctx.fillStyle = "#14171d"; ctx.fillRect(-U * 0.62, top, U * 1.24, U * 0.16); ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fillRect(-U * 0.62, top, U * 1.24, 2);
      ctx.fillStyle = "#0e1116"; ctx.fillRect(-U * 0.09, top + U * 0.16, U * 0.18, U * 0.6); ctx.strokeStyle = "#2a3038"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, top + U * 0.72); ctx.lineTo(U * 0.8, top + U * 0.95); ctx.moveTo(0, top + U * 0.72); ctx.lineTo(-U * 0.5, top + U * 1.0); ctx.stroke(); ctx.beginPath(); ctx.arc(U * 0.8, top + U * 0.98, U * 0.05, 0, 6.2832); ctx.arc(-U * 0.5, top + U * 1.03, U * 0.05, 0, 6.2832); ctx.fillStyle = "#2a3038"; ctx.fill();
      ctx.restore();
    }
    function drawBody(ctx) {
      var h = hip(), r = leanRot();
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(r); ctx.translate(-h.x, -h.y);
      piece(ctx, "torso", h.x, h.y, 0);
      var hp = headPos(); piece(ctx, "head", hp.x + rb.yaw * 6 * Z, hp.y + Math.max(0, rb.pitch) * 6 * Z, rb.yaw * 0.16 + rb.pitch * 0.06 - r * 0.5 + Math.sin(clock * 0.7) * 0.006);
      ctx.restore();
    }
    function drawArms(ctx, behind) {
      rb.arms.forEach(function (a) {
        if ((a.y > deskY + 6 * Z) !== behind) return;
        var sh = shoulder(a.side), n = NAT[a.side], up = a.side < 0 ? "armL1" : "armR1", lo = a.side < 0 ? "armL2" : "armR2", g = grip(a);
        if (!behind && g.y > deskY - U * 0.6) { ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(g.x - 6 * Z, deskY + 2, 50 * Z, 6 * Z, 0, 0, 6.2832); ctx.fill(); }
        limb(ctx, up, sh.x, sh.y, Math.atan2(a.ey - sh.y, a.ex - sh.x), n.u, a.f || 1);
        limb(ctx, lo, a.ex, a.ey, Math.atan2(a.y - a.ey, a.x - a.ex), n.f, a.f || 1);
        hand(ctx, a, behind ? "all" : a.holding ? "front" : "all");
      });
    }
    function lightRgb() { var w = warm * (1 - heat); return [Math.round(255 - cool * 60), Math.round(236 - heat * 120 - w * 50 - cool * 8), Math.round(214 - heat * 140 - w * 120 + cool * 39)].join(","); }
    function drawDesk(ctx) {
      var rgb = lightRgb(), flick = flicker > 0 ? 0.55 + Math.random() * 0.45 : 1, i, m = monitorRect();
      // the slab
      var tg = ctx.createLinearGradient(0, deskY, 0, deskY + slab); tg.addColorStop(0, "#2c313a"); tg.addColorStop(0.5, "#1a1e26"); tg.addColorStop(1, "#0d1016"); ctx.fillStyle = tg; ctx.fillRect(deskX0, deskY, deskX1 - deskX0, slab);
      var pool = ctx.createRadialGradient(homeX, deskY, 0, homeX, deskY, U * 2.4); pool.addColorStop(0, "rgba(" + rgb + "," + (0.32 * flick).toFixed(3) + ")"); pool.addColorStop(1, "rgba(" + rgb + ",0)"); ctx.fillStyle = pool; ctx.fillRect(deskX0, deskY, deskX1 - deskX0, slab);
      ctx.fillStyle = "rgba(255,255,255,.28)"; ctx.fillRect(deskX0, deskY, deskX1 - deskX0, 1.2); ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(deskX0, deskY + slab, deskX1 - deskX0, 2);
      // legs at both ends, and a pool of light on the floor
      ctx.fillStyle = "#0b0e13"; ctx.fillRect(deskX0 + 10, deskY + slab, 8 * Z + 4, S.H - deskY); ctx.fillRect(deskX1 - 14 - 8 * Z, deskY + slab, 8 * Z + 4, S.H - deskY);
      ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fillRect(deskX0 + 10, deskY + slab, 2, S.H - deskY); ctx.fillRect(deskX1 - 14 - 8 * Z, deskY + slab, 2, S.H - deskY);
      var fp = ctx.createRadialGradient(homeX, deskY + U * 1.6, 10, homeX, deskY + U * 1.6, U * 2.2); fp.addColorStop(0, "rgba(" + rgb + "," + (0.06 * flick).toFixed(3) + ")"); fp.addColorStop(1, "rgba(" + rgb + ",0)"); ctx.fillStyle = fp; ctx.fillRect(0, deskY + slab, S.W, S.H - deskY);
      // the thin monitor
      ctx.fillStyle = "#0a0c10"; ctx.fillRect(monX - 4, deskY - U * 0.23, 8, U * 0.23); ctx.fillRect(monX - U * 0.3, deskY - 4, U * 0.6, 4);
      ctx.fillStyle = "#05070a"; ctx.fillRect(m.x, m.y, m.w, m.h); ctx.lineWidth = 1.5; ctx.strokeStyle = "#2a3038"; ctx.strokeRect(m.x + 0.5, m.y + 0.5, m.w - 1, m.h - 1);
      var joined = monitor.join(" "), hot = joined.indexOf("OVERRIDE") >= 0 || joined.indexOf("OFFLINE") >= 0 || joined.indexOf("LOST") >= 0, amber = joined.indexOf("QUEUE") >= 0;
      if (flicker > 0 && Math.random() < 0.5) { ctx.fillStyle = "rgba(255,140,120,.08)"; ctx.fillRect(m.x, m.y, m.w, m.h); }
      if (!(wrecked && panel && !panel.hidden)) { ctx.font = "600 " + Math.max(8, U * 0.08).toFixed(1) + "px ui-monospace, Consolas, monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = hot ? "rgba(255,120,110,.95)" : amber ? "rgba(255,196,120,.95)" : cool > 0.3 ? "rgba(150,200,255,.9)" : "rgba(170,182,196,.75)"; monitor.forEach(function (line, n) { ctx.fillText(line, m.x + U * 0.09, m.y + U * (0.22 + n * 0.16)); }); if (Math.sin(clock * 3) > 0) ctx.fillRect(m.x + U * 0.09, m.y + m.h - U * 0.2, U * 0.05, U * 0.09); }
      // keyboard, with the keys that are down
      var kw = U * 1.6, kx0 = kbX - kw / 2, kh = U * 0.16, kg = ctx.createLinearGradient(0, deskY - kh, 0, deskY); kg.addColorStop(0, "#d8dce2"); kg.addColorStop(1, "#a9b0ba"); ctx.fillStyle = kg; ctx.fillRect(kx0, deskY - kh, kw, kh);
      ctx.fillStyle = "#f2f4f7"; ctx.fillRect(kx0, deskY - kh, kw, 2); ctx.fillStyle = "#5c636d"; ctx.fillRect(kx0, deskY - 3, kw, 3); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(kx0 - 3, deskY, kw + 6, 3);
      var krow = (kh - 8) / 3, kwid = U * 0.085;
      for (var row = 0; row < 3; row++) for (i = 0; i < 16 - row; i++) { var kxx = kx0 + U * 0.05 + i * U * 0.097 + row * U * 0.03, kyy = deskY - kh + 4 + row * krow, down = keysDown.some(function (k) { return Math.abs(k.x - kxx) < U * 0.05 && row === 1; }); ctx.fillStyle = down ? "rgba(" + rgb + ",.9)" : "#1b1f26"; ctx.fillRect(kxx, kyy + (down ? 1.5 : 0), kwid, krow - 2.5); if (!down) { ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(kxx, kyy, kwid, 1); } }
      ctx.fillStyle = "#1b1f26"; ctx.fillRect(kbX - U * 0.32, deskY - 6.5, U * 0.64, 3.5);
      tiles.forEach(function (t) { var s = U * 0.16; ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot); var g = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2); g.addColorStop(0, "#d3d8df"); g.addColorStop(0.5, "#9099a5"); g.addColorStop(1, "#4d545e"); ctx.fillStyle = g; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.strokeStyle = "#05070a"; ctx.lineWidth = 1; ctx.strokeRect(-s / 2, -s / 2, s, s); ctx.fillStyle = "#15181d"; ctx.font = "800 " + (s * 0.72).toFixed(1) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t.c, 0, 1); ctx.restore(); });
      if (card) { ctx.save(); ctx.translate(card.x, card.y); ctx.rotate(card.rot); ctx.fillStyle = "#e4dfd3"; ctx.beginPath(); ctx.moveTo(-U * 0.7, -U * 0.15); ctx.lineTo(U * 0.65, -U * 0.15); ctx.lineTo(U * 0.58, -U * 0.04); ctx.lineTo(U * 0.69, U * 0.05); ctx.lineTo(U * 0.61, U * 0.15); ctx.lineTo(-U * 0.7, U * 0.15); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#a3261f"; ctx.font = "800 " + (U * 0.12).toFixed(1) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("TASK CANCELLED", -U * 0.6, 1); ctx.restore(); }
      if (track) { var g2 = ctx.createRadialGradient(track.x, deskY, 4, track.x, deskY, 80 * Z); g2.addColorStop(0, "rgba(255,244,225,.24)"); g2.addColorStop(1, "rgba(255,244,225,0)"); ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(track.x, deskY + 2, 80 * Z, 20 * Z, 0, 0, 6.2832); ctx.fill(); }
    }
    function drawLight(ctx) {
      // one hard overhead spotlight whose cone ends at the desk and chair
      var lx = homeX - U * 0.3, rgb = lightRgb(), fl = flicker > 0 ? 0.5 + Math.random() * 0.5 : 1, bottom = deskY + U * 0.6;
      var hard = ctx.createLinearGradient(0, -10, 0, bottom); hard.addColorStop(0, "rgba(" + rgb + "," + (0.16 * fl).toFixed(3) + ")"); hard.addColorStop(0.7, "rgba(" + rgb + "," + (0.07 * fl).toFixed(3) + ")"); hard.addColorStop(1, "rgba(" + rgb + ",0)");
      for (var i = 0; i < 2; i++) { ctx.fillStyle = hard; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(lx - 14, -10); ctx.lineTo(lx + 14, -10); ctx.lineTo(lx + U * (2.0 + i * 0.25), bottom); ctx.lineTo(lx - U * (2.0 + i * 0.25), bottom); ctx.closePath(); ctx.fill(); } ctx.globalAlpha = 1;
    }

    var api = {
      step: function (dt) {
        slowT = Math.max(0, slowT - dt); timeScale += ((slowT > 0 ? 0.3 : 1) - timeScale) * Math.min(1, dt * (slowT > 0 ? 18 : 5)); dt *= timeScale;
        clock += dt; sinceMeasure += dt; if (sinceMeasure > 0.5) { sinceMeasure = 0; measure(); }
        knocks = knocks.filter(function (t) { return clock - t < 6; }); level = knocks.length >= 7 ? 3 : knocks.length >= 5 ? 2 : knocks.length >= 3 ? 1 : 0; stare = level >= 2 ? Math.max(stare, 1) : 0;
        if (!seq && !wrecked && !restoring) {
          var st = level >= 1 ? "warning" : "calm"; if (root.getAttribute("data-state") !== st) { root.setAttribute("data-state", st); if (st === "warning") announce("Recovery queue building."); }
          if (level >= 1) hintText(level >= 3 ? "Manual override pending." : level >= 2 ? "The agent has stopped." : "Recovery queue building.");
          warmTo = level >= 1 ? 1 : 0; heatTo = level >= 3 ? 0.85 : 0;
          monitor = level >= 1 ? ["RECOVERY QUEUE BUILDING", level >= 2 ? "STATE halted" : "STATE acting"] : ["TASK  restore title", job ? (job.phase === "notice" ? "STATE observing" : job.phase === "release" ? "STATE verifying" : "STATE acting") : "STATE observing"]; if (level >= 2 && Math.random() < dt * 2) flicker = 0.25;
          if (level >= 3) { gripT += dt; if (gripT > 1.3) startSeq(); } else gripT = 0;
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
      },
      act: function (name) { if (name === "restore") restore(); },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H); sync();
        var bg = ctx.createLinearGradient(0, 0, 0, S.H); bg.addColorStop(0, "#05070b"); bg.addColorStop(1, "#080a0f"); ctx.fillStyle = bg; ctx.fillRect(0, 0, S.W, S.H);
        drawLight(ctx);
        ctx = mctx; ctx.clearRect(0, 0, S.W, S.H);
        drawChair(ctx); drawBase(ctx); drawLegs(ctx);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, S.W, deskY + 1); ctx.clip(); drawBody(ctx); drawArms(ctx, true); ctx.restore(); drawDesk(ctx);
        rb.arms.forEach(function (a) { if (a.holding) hand(ctx, a, "back"); });
        letters.forEach(function (l) { if (l.state === "home" || l.hidden || l.x < deskX0) return; var hgt = Math.max(0, deskY - l.y), a = clamp(0.5 - hgt / 500, 0, 0.5); if (a > 0.02) { ctx.fillStyle = "rgba(0,0,0," + a.toFixed(3) + ")"; ctx.beginPath(); ctx.ellipse(l.x, deskY + 3, l.w * (0.55 + hgt / 600) * l.sc, 3.5, 0, 0, 6.2832); ctx.fill(); } });
        fx.forEach(function (f) { if (f.kind === "shock") { var k = f.t / f.life; ctx.beginPath(); ctx.ellipse(f.x, f.y + 2, (deskX1 - deskX0) * 0.6 * k, U * 0.16 * k + 3, 0, 0, 6.2832); ctx.lineWidth = 3 * (1 - k) + 0.5; ctx.strokeStyle = "rgba(255,235,220," + (0.8 * (1 - k)).toFixed(3) + ")"; ctx.stroke(); } else if (f.kind === "tap") { ctx.fillStyle = "rgba(255,255,255," + (0.35 * (1 - f.t / f.life)).toFixed(3) + ")"; ctx.fillRect(f.x - 14, f.y - 1, 28, 2); } });

        var t = tctx; t.clearRect(0, 0, S.W, S.H);
        letters.forEach(function (l) { if (l.state === "home" || l.state === "cue" || l.state === "shiver" || seq || wrecked) return; var on = job && job.l === l; t.lineWidth = on ? 1.5 : 1; t.setLineDash([3, 5]); t.strokeStyle = on ? "rgba(255,244,225," + (0.55 + Math.sin(clock * 6) * 0.25).toFixed(2) + ")" : "rgba(255,244,225,.22)"; t.strokeRect(l.hx - l.w / 2 + 1, l.hy - l.h * 0.36, l.w - 2, l.h * 0.72); t.setLineDash([]); });
        letters.forEach(function (l) { if (l.px !== undefined && !l.hidden && (l.state === "falling" || l.state === "script")) { var sp = Math.hypot(l.x - l.px, l.y - l.py); if (sp > 9) { var g = t.createLinearGradient(l.px, l.py, l.x, l.y); g.addColorStop(0, "rgba(235,231,222,0)"); g.addColorStop(1, "rgba(235,231,222," + clamp(sp / 60, 0, 0.45).toFixed(3) + ")"); t.strokeStyle = g; t.lineWidth = l.h * 0.5 * l.sc; t.lineCap = "round"; t.beginPath(); t.moveTo(l.px - (l.x - l.px) * 1.5, l.py - (l.y - l.py) * 1.5); t.lineTo(l.x, l.y); t.stroke(); } } l.px = l.x; l.py = l.y; });
        drawArms(t, false);
        cracks.forEach(function (c) { t.lineCap = "round"; t.lineJoin = "round"; c.lines.forEach(function (pts) { [[3, "rgba(0,0,0," + (0.5 * c.a).toFixed(3) + ")", 1], [1.1, "rgba(240,244,252," + (0.7 * c.a).toFixed(3) + ")", 0]].forEach(function (pass) { t.beginPath(); pts.forEach(function (q, i) { if (i) t.lineTo(q[0], q[1] + pass[2]); else t.moveTo(q[0], q[1] + pass[2]); }); t.lineWidth = pass[0]; t.strokeStyle = pass[1]; t.stroke(); }); }); t.beginPath(); t.ellipse(c.x, c.y, 22, 7, 0, 0, 6.2832); t.fillStyle = "rgba(0,0,0," + (0.5 * c.a).toFixed(3) + ")"; t.fill(); });
        dust.forEach(function (d) { var a = 1 - d.t / d.life; t.fillStyle = d.spark ? "rgba(255,210,140," + a.toFixed(3) + ")" : d.chip ? "rgba(225,232,245," + a.toFixed(3) + ")" : "rgba(210,205,195," + (a * 0.6).toFixed(3) + ")"; t.fillRect(d.x, d.y, d.s, d.s); });
        if (wrecked || seq) for (var i = 0; i < 16; i++) { t.fillStyle = "rgba(220,215,205,.14)"; t.fillRect(deskX0 + ((i * 173.3 + clock * (6 + i % 5)) % (S.W - deskX0)), (i * 97.7 + Math.sin(clock * 0.3 + i) * 40 + clock * 3) % deskY, 1.5, 1.5); }
        fx.forEach(function (f) { var k = f.t / f.life; if (f.kind === "ring") { t.beginPath(); t.arc(f.x, f.y, f.r * (0.6 + k), 0, 6.2832); t.lineWidth = 1.5; t.strokeStyle = "rgba(235,240,250," + (0.8 * (1 - k)).toFixed(3) + ")"; t.stroke(); } else if (f.kind === "slot") { var l = f.l; t.lineWidth = 2; t.strokeStyle = "rgba(255,244,225," + (0.9 * (1 - k)).toFixed(3) + ")"; t.strokeRect(l.hx - l.w / 2 + 1, l.hy - l.h * 0.36, l.w - 2, l.h * 0.72); } else if (f.kind === "flash") { var g = t.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, "rgba(255,245,235," + (0.95 * (1 - k)).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,200,170,0)"); t.fillStyle = g; t.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); } else if (f.kind === "screen") { t.fillStyle = "rgba(255,225,215," + (0.5 * (1 - k)).toFixed(3) + ")"; t.fillRect(0, 0, S.W, S.H); } });
      }
    };
    root.__knock = function (idx) { api.click(0, 0, S, idx); };
    root.__dbg = function () { return { job: job && job.phase, seq: seq && seq.t, wrecked: wrecked, level: level, states: letters.map(function (l) { return l.state; }).join(""), deskY: deskY, homeX: homeX, U: U, arms: rb.arms.map(function (a) { return [Math.round(a.x), Math.round(a.y), +a.wrist.toFixed(2), +a.hand.toFixed(2)]; }) }; };
    return api;
  };
})();
