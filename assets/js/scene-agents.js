/* South Artificial Intelligence Laboratory: the Agents hero.
   A black stage. The title sits on the left; the right is empty except for a faint pool of light.
   Tap a letter and it breaks loose, falls to the floor and bounces once. A spotlight comes on at
   the far right, a humanoid walks in, stops beside the letter, crouches, pinches it, rises, carries
   it to the empty slot, places it with a click, looks at the title, turns and walks out.
   Knock letters loose too fast and it hurries, then loses patience: it drops a letter, the light
   turns warm red, it kicks the pile across the floor, throws one letter into a visual copy of the
   navigation, stands for a beat and leaves. RESTART puts everything back.
   The robot is a render cut into pieces (assets/img/robot2): head, torso, arms, thighs, shins,
   feet, and photo hands with a thumb and fingers on knuckle pivots. It is posed in code: feet are
   anchored to the floor while the body moves over them, knees bend by foreshortening, the torso
   folds forward for the pickup, and the arms use two-joint inverse kinematics. */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL) return;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var RIG = {"head":{"x":490,"y":40,"w":140,"h":192,"px":558,"py":228},"torso":{"x":440,"y":196,"w":245,"h":454,"px":561,"py":600},"armL1":{"x":364,"y":246,"w":92,"h":288,"px":415,"py":280,"ex":405,"ey":520},"armR1":{"x":668,"y":246,"w":92,"h":288,"px":709,"py":280,"ex":719,"ey":520},"armL2":{"x":344,"y":511,"w":98,"h":183,"px":405,"py":520,"wx":386,"wy":690},"armR2":{"x":682,"y":511,"w":98,"h":183,"px":719,"py":520,"wx":738,"wy":690},"thighL":{"x":428,"y":631,"w":116,"h":273,"px":490,"py":650,"kx":487,"ky":895},"thighR":{"x":580,"y":631,"w":116,"h":273,"px":634,"py":650,"kx":637,"ky":895},"shinL":{"x":441,"y":881,"w":93,"h":313,"px":487,"py":895},"shinR":{"x":590,"y":881,"w":93,"h":313,"px":637,"py":895},"footL":{"x":424,"y":1176,"w":128,"h":113,"px":487,"py":1190},"footR":{"x":572,"y":1176,"w":128,"h":113,"px":637,"py":1190}};
  var HANDS = {"L":{"wrist":[215,565],"palm":{"x":150,"y":560,"w":270,"h":340,"px":215,"py":565},"thumb":{"x":30,"y":585,"w":150,"h":400,"px":110,"py":625},"f0":{"x":130,"y":860,"w":150,"h":350,"px":185,"py":880},"f1":{"x":205,"y":855,"w":145,"h":345,"px":250,"py":878},"f2":{"x":275,"y":845,"w":145,"h":315,"px":317,"py":870},"f3":{"x":345,"y":835,"w":135,"h":280,"px":382,"py":860}},"R":{"wrist":[905,565],"palm":{"x":700,"y":560,"w":270,"h":340,"px":905,"py":565},"thumb":{"x":940,"y":585,"w":155,"h":400,"px":1010,"py":625},"f0":{"x":840,"y":855,"w":150,"h":355,"px":905,"py":880},"f1":{"x":770,"y":855,"w":145,"h":345,"px":835,"py":878},"f2":{"x":700,"y":845,"w":145,"h":315,"px":770,"py":870},"f3":{"x":640,"y":835,"w":135,"h":280,"px":703,"py":860}}};
  var HS = 0.21, IMG = {};
  function loadImg(n) { var im = new Image(); im.src = "assets/img/robot2/" + n + ".png"; IMG[n] = im; }
  Object.keys(RIG).forEach(loadImg); ["L", "R"].forEach(function (s) { ["palm", "thumb", "f0", "f1", "f2", "f3"].forEach(function (k) { loadImg(k + s); }); });
  function nat(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]); }
  var NAT = { "-1": { u: nat([RIG.armL1.px, RIG.armL1.py], [RIG.armL1.ex, RIG.armL1.ey]), f: nat([RIG.armL2.px, RIG.armL2.py], [RIG.armL2.wx, RIG.armL2.wy]) }, "1": { u: nat([RIG.armR1.px, RIG.armR1.py], [RIG.armR1.ex, RIG.armR1.ey]), f: nat([RIG.armR2.px, RIG.armR2.py], [RIG.armR2.wx, RIG.armR2.wy]) } };
  var SRC = { hipX: 561, hipY: 600, shoulder: [147, -320], head: [-3, -372], hipJoint: 72, thighTop: 50, thigh: 245, shin: 295, foot: 95, height: 685,
              L1: Math.hypot(RIG.armL1.ex - RIG.armL1.px, RIG.armL1.ey - RIG.armL1.py), L2: Math.hypot(RIG.armL2.wx - RIG.armL2.px, RIG.armL2.wy - RIG.armL2.py), hand: 126, grip: 84 };

  SAIL.scenes.agents = function (S, root) {
    var wide = S.W >= 980, h1 = root.querySelector("h1"), hint = root.querySelector("[data-hint]"), live = root.querySelector("[data-live]"), panel = root.querySelector("[data-panel]"), consoleEl = root.querySelector("[data-console]");
    var mast = document.querySelector(".masthead"), logo = mast ? mast.querySelector(".brand img") : null, rr = root.getBoundingClientRect();
    var conB = consoleEl ? consoleEl.getBoundingClientRect().bottom - rr.top : S.H * 0.6;
    var floorY = wide ? Math.min(S.H - 18, Math.max(conB + 66, S.H - 54)) : S.H - 34;
    var Z = wide ? clamp((floorY - 104) / 1290, 0.28, 0.6) : clamp((floorY - conB - 12) / 1290, 0.17, 0.4), U = 133 * Z;
    var G = 2300, L1 = SRC.L1 * Z, L2 = SRC.L2 * Z, HAND = SRC.grip * Z, HLEN = SRC.hand * Z;
    var titleX0 = h1 ? h1.getBoundingClientRect().left - rr.left : 60, titleX1 = h1 ? h1.getBoundingClientRect().right - rr.left : S.W * 0.4;
    var stageX = wide ? S.W * 0.74 : S.W * 0.5, entryX = S.W + 150 * Z + 40, stride = 200 * Z, stepDur = 0.52;
    var reachX = (SRC.shoulder[0] + (SRC.L1 + SRC.L2) * 0.86 + SRC.grip * 0.9) * Z, standOff = (SRC.shoulder[0] + (SRC.L1 + SRC.L2) * 0.38) * Z;

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
      el.style.transform = ""; el.style.visibility = ""; el.style.opacity = ""; el.classList.remove("lock"); el.classList.remove("out");
      var btn = el.querySelector("button"); if (!btn) { btn = document.createElement("button"); btn.type = "button"; btn.className = "lb"; btn.setAttribute("aria-label", "Knock the letter " + el.textContent.trim() + " loose"); btn.setAttribute("data-letter", String(i)); el.appendChild(btn); }
      return { el: el, btn: btn, idx: i, ch: el.textContent.trim().charAt(0), hx: 0, hy: 0, w: 0, h: 0, x: 0, y: 0, rot: 0, sc: 1, vx: 0, vy: 0, vr: 0, state: "home", t: 0, bounced: 0, op: 1 };
    });
    function measure() { letters.forEach(function (l) { var x = 0, y = 0, n = l.el; while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; l.hx = x + l.w / 2; l.hy = y + l.h / 2; if (l.state === "home") { l.x = l.hx; l.y = l.hy; } }); }
    measure();
    function sync() {
      letters.forEach(function (l) {
        var t = l.state === "home" ? "" : "translate(" + (l.x - l.hx).toFixed(1) + "px," + (l.y - l.hy).toFixed(1) + "px) rotate(" + l.rot.toFixed(3) + "rad)" + (l.sc !== 1 ? " scale(" + l.sc.toFixed(3) + ")" : "");
        if (l.tf !== t) { l.el.style.transform = t; l.tf = t; }
        var out = l.state !== "home"; if (l.out !== out) { l.el.classList.toggle("out", out); l.out = out; }
        var op = out && l.op < 1 ? l.op.toFixed(2) : ""; if (l.opv !== op) { l.el.style.opacity = op; l.opv = op; }
        var dis = out || !!seq || wrecked || !!restoring; if (l.btn.disabled !== dis) l.btn.disabled = dis;
      });
    }
    function restY(l) { return floorY - l.h * 0.5 * l.sc + 2; }
    function spare(l, want) {
      // a letter stays where it lands; it only shifts a little when it would sit on another one
      var taken = letters.filter(function (o) { return o !== l && (o.state === "rest" || o.state === "slide"); }), gap = l.w * 1.05, x0 = Math.max(l.w * 0.6, want - l.w * 2.4), x1 = Math.min(S.W - l.w * 0.6, want + l.w * 2.4);
      for (var n = 0; n < 60; n++) { var x = clamp(want + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * gap * 0.5, x0, x1); if (!taken.some(function (o) { var ox = o.slide === undefined ? o.x : o.slide; return Math.abs(ox - x) < (o.w + l.w) * 0.5; })) return x; }
      return want;
    }
    function knock(l, quiet) {
      if (!l || l.state !== "home") return false;
      l.state = "loose"; l.t = 0; l.bounced = 0; l.gf = 1; l.vx = rnd(-24, 24); l.vy = -30; l.vr = rnd(-2.5, 2.5); l.op = 1;
      if (!quiet) { announce("The letter " + l.ch + " fell. The agent is on its way."); if (!seq && !wrecked) hintText(level >= 1 ? "The agent is hurrying." : "The agent is on its way."); }
      return true;
    }
    function lockIn(l) {
      l.state = "home"; l.op = 1; l.hidden = false; l.x = l.hx; l.y = l.hy; l.rot = 0; l.sc = 1; l.el.classList.remove("lock"); void l.el.offsetWidth; l.el.classList.add("lock");
      fx.push({ kind: "ring", x: l.hx, y: l.hy, r: l.h * 0.5, t: 0, life: 0.35 }); fx.push({ kind: "slot", l: l, t: 0, life: 0.5 });
      if (!restoring && !seq && letters.every(function (o) { return o === l || o.state === "home"; })) announce("Title complete.");
    }
    function loose(l, vx, vy, gf) { if (!l) return; l.state = "falling"; l.gf = gf || 1; l.bounced = -1; l.vx = vx; l.vy = vy; l.vr = rnd(-6, 6); l.op = 1; }
    function resting() { return letters.filter(function (l) { return l.state === "rest"; }); }

    /* ---- state ---- */
    var R = { on: false, alpha: 0, x: entryX, dir: -1, back: false, state: "away", t: 0, spd: 1, turnK: 0, bob: 0, sway: 0, hipRot: 0, drop: 0, dropTo: 0, fold: 0, foldTo: 0, pitch: 0, pitchTo: 0, yaw: 0, yawTo: 0, tense: 0, tenseTo: 0,
      feet: [{ x: 0, lift: 0, from: 0, to: 0 }, { x: 0, lift: 0, from: 0, to: 0 }], stepping: false, stepT: 0, stepFoot: 0, stepX0: 0, stepLen: 0, moving: false, target: null, kick: null, job: null,
      arms: [-1, 1].map(function (s) { return { side: s, x: 0, y: 0, ex: 0, ey: 0, tx: 0, ty: 0, vx: 0, vy: 0, curl: 0.3, curlTo: 0.3, pinch: 0, pinchTo: 0, wrist: 0, wristTo: 0, handDir: null, roll: 1, rollTo: 1, hand: 1.57, speed: 6, typing: 0, holding: false, f: 1, sign: 0, relaxed: true }; }) };
    R.feet[0].x = R.x - 80 * Z; R.feet[1].x = R.x + 80 * Z;
    var spot = { x: stageX, on: 0, onTo: 0 }, heat = 0, heatTo = 0, cool = 0, coolTo = 0;
    var knocks = [], level = 0, clock = 0, sinceMeasure = 0, cue = null, cueAt = 5, shake = 0, fx = [], dust = [];
    var seq = null, wrecked = false, restoring = null, wreck = null, cracks = [], tilt = null, timeScale = 1, slowT = 0;

    /* ---- geometry ---- */
    function fc() { return Math.cos(R.fold); }
    function hipY() { return floorY - SRC.height * Z + R.bob + R.drop; }
    function hipX() { return R.x + R.sway; }
    function shoulder(side) { var f = fc(); return { x: hipX() + side * SRC.shoulder[0] * Z * (1 - 0.06 * R.fold) + R.fold * -8 * Z, y: hipY() + SRC.shoulder[1] * Z * f + R.fold * 6 * Z }; }
    function headPos() { return { x: hipX() + SRC.head[0] * Z + R.fold * -10 * Z, y: hipY() + SRC.head[1] * Z * fc() + R.fold * 14 * Z }; }
    function lookAt(x, y, k) { var hp = headPos(); R.yawTo = clamp((x - hp.x) / (U * 4), -1, 1); R.pitchTo = clamp((y - hp.y) / (U * 3.2), -1, 1) * (k || 1); }
    function grip(a) { return { x: a.x + Math.cos(a.hand) * HAND, y: a.y + Math.sin(a.hand) * HAND }; }
    function aim(a, x, y) { var g = grip(a); a.tx = x - (g.x - a.x); a.ty = y - (g.y - a.y); a.relaxed = false; }
    function relax(a) { a.relaxed = true; a.holding = false; a.pinchTo = 0; a.curlTo = 0.3; a.wristTo = 1; a.handDir = Math.PI / 2 + a.side * 0.12; a.speed = 5; }
    function standSpot(i) { var side = i ? 1 : -1, lead = (side === R.dir) ? 14 * Z : -6 * Z; return R.x + side * 80 * Z + lead; }

    /* ---- walking: feet stay planted while the body moves over them ---- */
    function walkTo(x, spd) { R.target = clamp(x, -200, entryX + 10); R.moving = true; R.spd = spd || 1; }
    function stepWalk(dt) {
      if (!R.moving) return;
      var d = R.target - R.x;
      if (!R.stepping) {
        if (Math.abs(d) < 4) {
          // settle: bring any foot that is out of place to its standing spot, one short step
          var off = -1; for (var i = 0; i < 2; i++) if (Math.abs(R.feet[i].x - standSpot(i)) > 12 * Z) { off = i; break; }
          if (off < 0) { R.moving = false; R.bob = 0; R.sway = 0; R.hipRot = 0; return; }
          R.stepFoot = off; R.stepLen = 0; R.feet[off].from = R.feet[off].x; R.feet[off].to = standSpot(off);
        } else {
          R.dir = d < 0 ? -1 : 1;
          var trail = (R.feet[0].x - R.feet[1].x) * R.dir < 0 ? 0 : 1, f0 = R.feet[trail], len = Math.min(Math.abs(d), stride), bodyEnd = R.x + R.dir * len, side = trail ? 1 : -1;
          R.stepFoot = trail; R.stepLen = len; f0.from = f0.x; f0.to = bodyEnd + side * 80 * Z + R.dir * (len >= stride ? stride * 0.45 : 12 * Z);
        }
        R.stepping = true; R.stepT = 0; R.stepX0 = R.x;
      }
      R.stepT += dt * R.spd / stepDur; var u = Math.min(1, R.stepT), e = ease(u), f = R.feet[R.stepFoot], other = R.stepFoot ? -1 : 1;
      f.x = f.from + (f.to - f.from) * e; f.lift = Math.sin(Math.PI * u) * 24 * Z * (R.stepLen > 0 ? 1 : 0.5);
      R.x = R.stepX0 + R.dir * R.stepLen * u;
      // the body rises over the planted leg and shifts above it; the hips turn a few degrees
      R.bob = -Math.sin(Math.PI * u) * 6 * Z; R.sway = other * Math.sin(Math.PI * u) * 8 * Z; R.hipRot = -other * Math.sin(Math.PI * u) * 0.045;
      if (u >= 1) { R.stepping = false; f.lift = 0; }
    }
    function armsWalk() {
      R.arms.forEach(function (a, i) {
        var sh = shoulder(a.side), fwd = R.feet[i].x - hipX() - a.side * 80 * Z;
        a.tx = sh.x + a.side * 22 * Z - fwd * 0.42 * (R.moving ? 1 : 0) + R.tense * a.side * 30 * Z; a.ty = sh.y + (L1 + L2) * 0.9 - R.tense * 40 * Z;
        relax(a); a.speed = 6;
      });
    }

    /* ---- one letter: walk in, crouch, pinch, rise, carry, place, admire, leave ---- */
    function nearestLetter() { var best = null, bd = 1e9; resting().forEach(function (l) { var d = Math.abs(l.x - R.x); if (d < bd) { bd = d; best = l; } }); return best; }
    function armFor(x) { return R.arms[x < R.x ? 0 : 1]; }
    function enter() { R.on = true; R.x = entryX; R.feet[0].x = R.x - 80 * Z; R.feet[1].x = R.x + 80 * Z; R.back = false; R.turnK = 0; R.dir = -1; spot.onTo = 1; }
    function goTo(l) { R.job = l; R.state = "walk"; R.t = 0; walkTo(l.x + standOff, level >= 1 ? 1.5 : 1); }
    function stepJob(dt) {
      var l = R.job, a, s;
      R.t += dt;
      if (R.state === "walk") {
        if (l && l.state !== "rest") { R.job = nearestLetter(); if (R.job) walkTo(R.job.x + standOff, R.spd); else { R.state = "admire"; R.t = 0; } return; }
        armsWalk(); lookAt(l ? l.x : R.x - 200, l ? l.y : floorY - 200, 0.6);
        if (!R.moving) { R.state = "crouch"; R.t = 0; }
      } else if (R.state === "crouch") {
        // head first, then the knees, then the hips, and one foot shifts for balance before the arm goes down
        lookAt(l.x, l.y); a = armFor(l.x);
        R.dropTo = R.t > 0.1 ? 370 * Z : 0; R.foldTo = R.t > 0.28 ? 1.1 : 0;
        if (R.t > 0.2 && !R.shifted) { R.shifted = true; var i = l.x < R.x ? 0 : 1; if (!R.stepping) { R.stepping = true; R.stepFoot = i; R.stepT = 0; R.stepLen = 0; R.stepX0 = R.x; R.feet[i].from = R.feet[i].x; R.feet[i].to = R.feet[i].x + (l.x < R.x ? -1 : 1) * 22 * Z; R.moving = true; R.target = R.x; } }
        R.arms.forEach(function (o) { if (o !== a) { var sh = shoulder(o.side); o.tx = sh.x + o.side * 30 * Z; o.ty = sh.y + (L1 + L2) * 0.8; relax(o); } });
        if (R.t > 0.45) { aim(a, l.x, l.y - 4 * Z); a.handDir = null; a.wristTo = 0.95; a.curlTo = 0.15; a.pinchTo = 0; a.speed = 7; }
        var g = grip(a); if (R.t > 0.9 && (Math.hypot(g.x - l.x, g.y - l.y + 4 * Z) < 12 || R.t > 1.5)) { R.state = "pinch"; R.t = 0; }
      } else if (R.state === "pinch") {
        a = armFor(l.x); aim(a, l.x, l.y - 2 * Z); a.pinchTo = 1; a.curlTo = 0.6; lookAt(l.x, l.y);
        if (R.t > 0.18) { l.state = "held"; a.holding = true; R.state = "rise"; R.t = 0; }
      } else if (R.state === "rise") {
        // up through the legs and hips, then the letter comes to chest height for a look
        a = armFor(l.x); R.dropTo = 0; R.foldTo = 0; R.shifted = false;
        s = shoulder(a.side); aim(a, s.x + a.side * 30 * Z, s.y + 150 * Z); a.handDir = null; a.wristTo = 0.2; a.speed = 6;
        lookAt(a.x, a.y); if (R.t > 0.9) { R.state = "carry"; R.t = 0; walkTo(l.hx + reachX, R.spd); }
      } else if (R.state === "carry") {
        a = armFor(l.x < R.x ? R.x - 1 : R.x + 1); a = R.arms[0].holding ? R.arms[0] : R.arms[1];
        R.arms.forEach(function (o, i) { if (o === a) { s = shoulder(o.side); o.tx = s.x + o.side * 34 * Z - R.dir * 10 * Z; o.ty = s.y + 150 * Z; o.handDir = null; o.wristTo = 0.2; o.speed = 6; o.relaxed = false; } else { var fwd = R.feet[i].x - hipX() - o.side * 80 * Z, sh = shoulder(o.side); o.tx = sh.x + o.side * 22 * Z - fwd * 0.42; o.ty = sh.y + (L1 + L2) * 0.9; relax(o); } });
        lookAt(l.hx, l.hy, 0.7);
        if (!R.moving) { R.state = "place"; R.t = 0; }
      } else if (R.state === "place") {
        // the letter is raised, turned upright, and pushed into the outlined slot
        a = R.arms[0].holding ? R.arms[0] : R.arms[1]; lookAt(l.hx, l.hy);
        s = shoulder(a.side); var dx = l.hx - s.x, dy = l.hy - s.y, d = Math.hypot(dx, dy) || 1, Rm = L1 + L2 + HAND * 0.85 - 2, k = Math.min(d, Rm) / d;
        aim(a, s.x + dx * k, s.y + dy * k); a.handDir = null; a.wristTo = 0.9; a.speed = 7 * (0.6 + 0.4 * Math.min(1, R.t)); a.curlTo = 0.6;
        var g2 = grip(a);
        if (R.t > 0.5 && (Math.hypot(g2.x - l.hx, g2.y - l.hy) < 9 || R.t > 1.4)) { l.state = "magnet"; l.t = 0; l.from = { x: g2.x, y: g2.y, rot: l.rot }; l.dur = clamp(Math.hypot(g2.x - l.hx, g2.y - l.hy) / 900, 0.1, 0.3); a.pinchTo = 0; a.holding = false; R.state = "release"; R.t = 0; }
      } else if (R.state === "release") {
        a = R.arms[0].handDir === null ? R.arms[0] : R.arms[1]; lookAt(l.hx, l.hy);
        if (R.t < 0.25) { a.tx = a.x; a.ty = a.y; } else { s = shoulder(a.side); a.tx = s.x + a.side * 26 * Z; a.ty = s.y + (L1 + L2) * 0.9; relax(a); }
        if (R.t > 0.8) { R.state = "admire"; R.t = 0; }
      } else if (R.state === "admire") {
        armsWalk(); lookAt((titleX0 + titleX1) / 2, h1 ? h1.getBoundingClientRect().top - rr.top + 60 : 200, 0.7);
        if (R.t > 0.7) { var nx = nearestLetter(); if (nx) goTo(nx); else { R.state = "turn"; R.t = 0; } }
      } else if (R.state === "turn") {
        armsWalk(); R.yawTo = 0; R.pitchTo = 0; R.turnK = Math.min(1, R.t / 0.5); R.back = R.turnK > 0.5;
        if (R.t > 0.5) { R.turnK = 0; R.state = "exit"; R.t = 0; walkTo(entryX, R.spd); }
      } else if (R.state === "exit") {
        armsWalk(); R.yawTo = 0; R.pitchTo = 0;
        var nx2 = nearestLetter(); if (nx2 && !seq) { R.back = false; R.dir = -1; goTo(nx2); return; }
        if (!R.moving || R.x > S.W + 120 * Z) { R.state = "away"; R.on = false; R.back = false; spot.onTo = 0; R.job = null; if (!wrecked && !seq) { hintText("Tap a letter to knock it loose."); root.setAttribute("data-state", "calm"); } }
      }
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
        else if (f.mode === "fall") { f.vy += G * 0.8 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; var fl = floorY - f.oy - 5; if (f.y > fl) { f.y = fl; if (Math.abs(f.vy) < 240) f.mode = "rest"; else { f.vy *= -0.3; f.vx *= 0.6; f.vr *= 0.5; } } }
        else if (f.mode === "slide") { f.vy += 260 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; if (Math.abs(f.ox + f.x) > S.W * 1.6) f.mode = "gone"; }
        else if (f.mode === "hang") { f.rot += (f.rotTo + Math.sin(clock * 3 + f.ox) * 0.05 - f.rot) * Math.min(1, dt * 7); f.y += ((f.yTo || 0) - f.y) * Math.min(1, dt * 7); }
        if (wrecked && f.mode !== "fall" && f.mode !== "slide") f.a = Math.max(0, f.a - dt * 1.2);
        var t = "translate(" + f.x.toFixed(1) + "px," + f.y.toFixed(1) + "px) rotate(" + f.rot.toFixed(3) + "rad)"; if (f.tf !== t) { f.el.style.transform = t; f.tf = t; }
        var op = f.a.toFixed(2); if (f.op !== op) { f.el.style.opacity = op; f.op = op; }
      });
      if (wrecked && mast && mast.classList.contains("wrecked") && wreck.frags.every(function (f) { return f.mode === "fall" || f.mode === "slide" || f.mode === "gone" || f.a <= 0.02; })) mast.classList.remove("wrecked");
      if (tilt) { tilt.t += dt; var a = tilt.t < 0.22 ? tilt.a * Math.sin(tilt.t / 0.22 * Math.PI) : 0; wreck.layer.style.transform = "rotate(" + a.toFixed(4) + "rad)"; if (tilt.t > 0.25) tilt = null; }
    }
    function fly(l, to, dur, sc, spin, arc) { l.state = "script"; l.t = 0; l.dur = dur; l.from = { x: l.x, y: l.y, rot: l.rot, sc: l.sc }; l.to = to; l.toSc = sc; l.spin = spin; l.arc = arc; l.hidden = false; }

    /* ---- losing patience ---- */
    function startSeq() {
      seq = { t: 0, did: {}, phase: "approach" }; R.job = null; wreck = buildWreck(); R.arms.forEach(function (a) { a.holding = false; });
      letters.forEach(function (l) { if (l.state === "held" || l.state === "magnet") loose(l, rnd(-40, 40), -40, 1); });
      root.setAttribute("data-state", "destruction"); hintText("Manual override."); announce("Manual override. The agent has lost patience.");
      if (!R.on) enter();
      var pile = resting(), px = pile.length ? pile.reduce(function (s, l) { return s + l.x; }, 0) / pile.length : titleX1 + 40;
      seq.pileX = px; walkTo(px + 120 * Z, 1.7); R.state = "fr";
    }
    function once(key, at) { if (seq.t >= at && !seq.did[key]) { seq.did[key] = 1; return true; } return false; }
    function stepSeq(dt) {
      var a0 = R.arms[0], a1 = R.arms[1], s;
      if (seq.phase === "approach") { armsWalk(); lookAt(seq.pileX, floorY, 0.7); if (!R.moving) { seq.phase = "act"; seq.t = 0; } return; }
      var t = (seq.t += dt);
      // it looks from the pile to the title and back, shoulders tense
      if (t < 1.0) { armsWalk(); R.tenseTo = 1; if (Math.floor(t / 0.5) % 2 === 0) lookAt(seq.pileX, floorY); else lookAt((titleX0 + titleX1) / 2, 200, 0.6); }
      // one quick pickup: knees, hips, hand down, pinch
      if (t >= 1.0 && t < 2.3) {
        if (!seq.L) seq.L = nearestLetter();
        var L = seq.L; R.dropTo = 300 * Z; R.foldTo = 0.95; if (L) { lookAt(L.x, L.y); aim(a0, L.x, L.y - 3 * Z); a0.handDir = null; a0.wristTo = 0.95; a0.curlTo = 0.2; a0.speed = 9; a0.relaxed = false; }
        s = shoulder(1); a1.tx = s.x + 40 * Z; a1.ty = s.y + (L1 + L2) * 0.75; relax(a1);
        if (L && once("pinch", 1.8)) { a0.pinchTo = 1; a0.curlTo = 0.6; }
        if (L && once("hold", 2.0) && L.state === "rest") { L.state = "held"; a0.holding = true; }
      }
      // another letter falls while it holds this one; it drops the one in hand
      if (once("another", 2.1)) { var home = letters.filter(function (l) { return l.state === "home"; }); if (home.length) knock(home[(Math.random() * home.length) | 0], true); }
      if (t >= 2.3 && t < 2.9) { R.dropTo = 0; R.foldTo = 0; if (once("drop", 2.45)) { a0.pinchTo = 0; a0.holding = false; if (seq.L && seq.L.state === "held") loose(seq.L, rnd(-30, 30), -20, 1); heatTo = 1; } s = shoulder(-1); a0.tx = s.x - 30 * Z; a0.ty = s.y + (L1 + L2) * 0.8; relax(a0); lookAt(seq.pileX, floorY); }
      // a step back, then the kick across the floor
      if (once("back", 2.9)) walkTo(R.x + 70 * Z, 1.3);
      if (t >= 2.9 && t < 3.5) armsWalk();
      if (once("kick", 3.5)) { R.kick = { t: 0, foot: 0, from: R.feet[0].x }; R.moving = false; R.stepping = false; }
      if (t >= 3.5 && t < 4.4) { armsWalk(); R.sway = 10 * Z; lookAt(seq.pileX, floorY); }
      // it grabs one letter, lifts it oversized and throws it into the navigation
      if (t >= 4.4 && t < 5.6) {
        if (!seq.T) { seq.T = nearestLetter(); }
        var T = seq.T; R.dropTo = t < 5.0 ? 280 * Z : 0; R.foldTo = t < 5.0 ? 0.9 : 0;
        if (T && t < 5.0) { lookAt(T.x, T.y); aim(a1, T.x, T.y - 3 * Z); a1.handDir = null; a1.wristTo = 0.95; a1.curlTo = 0.2; a1.speed = 10; a1.relaxed = false; if (once("pinch2", 4.85)) { a1.pinchTo = 1; a1.curlTo = 0.6; } }
        if (T && once("hold2", 4.95) && T.state === "rest") { T.state = "held"; a1.holding = true; T.sc = 1.35; }
        if (t >= 5.0) { s = shoulder(1); aim(a1, s.x + 20 * Z, s.y - (L1 + L2) * 0.85); a1.speed = 30; a1.handDir = null; a1.wristTo = 0; a1.relaxed = false; lookAt(S.W * 0.55, 40); }
        s = shoulder(-1); a0.tx = s.x - 30 * Z; a0.ty = s.y + (L1 + L2) * 0.85; relax(a0);
        if (T && once("throw", 5.2) && T.state === "held") { a1.pinchTo = 0; a1.holding = false; seq.lab = label(["projects", "research", "people"]); var p = seq.lab || { x: S.W * 0.6, y: 36 }; fly(T, function () { return { x: p.x, y: p.y + 20 }; }, 0.45, 1.5, 9, U * 0.8); }
      }
      if (once("hit", 5.7)) { impact(seq.lab, true); slowT = 0.3; if (seq.T) { loose(seq.T, rnd(60, 200), -160, 0.9); seq.T.sc = 1.35; } }
      // one still beat, then it turns and walks out
      if (t >= 5.6 && t < 6.8) { armsWalk(); R.tenseTo = 0; R.yawTo = -0.6; R.pitchTo = 0.2; }
      if (once("leave", 6.8)) { R.state = "turn"; R.t = 0; R.job = null; }
      if (t >= 6.8) {
        R.t += dt;
        if (R.state === "turn") { armsWalk(); R.turnK = Math.min(1, R.t / 0.5); R.back = R.turnK > 0.5; R.yawTo = 0; R.pitchTo = 0; if (R.t > 0.5) { R.turnK = 0; R.state = "exit"; R.t = 0; walkTo(entryX, 1.15); } }
        else if (R.state === "exit") { armsWalk(); if (!R.moving || R.x > S.W + 120 * Z) { R.state = "away"; R.on = false; R.back = false; spot.onTo = 0; seq = null; wrecked = true; heatTo = 0.5; root.setAttribute("data-state", "aftermath"); hintText("Title system offline."); announce("Title system offline. Use Restart to rebuild."); showPanel(); } }
      }
    }
    function stepKick(dt) {
      var k = R.kick; k.t += dt; var f = R.feet[k.foot], u = k.t / 0.7;
      if (u < 0.45) { var e = ease(u / 0.45); f.x = k.from - e * 300 * Z; f.lift = Math.sin(Math.PI * e) * 46 * Z; if (!k.hit && u > 0.2) { k.hit = true; resting().forEach(function (l) { if (l.x < k.from + 30 * Z && l.x > k.from - 360 * Z) { loose(l, -rnd(300, 620), -rnd(220, 480), 0.9); l.swept = true; } }); for (var i = 0; i < 10; i++) dust.push({ x: f.x, y: floorY - 2, vx: rnd(-320, 40), vy: rnd(-240, -40), t: 0, life: rnd(0.3, 0.7), s: rnd(1, 2.4), g: 700 }); } }
      else if (u < 1) { var e2 = ease((u - 0.45) / 0.55); f.x = k.from - 300 * Z + e2 * 300 * Z; f.lift = Math.sin(Math.PI * e2) * 20 * Z; }
      else { f.x = k.from; f.lift = 0; R.kick = null; }
    }

    /* ---- the restart control, and the rebuild ---- */
    function showPanel() {
      if (!panel) return; panel.hidden = false; var op = panel.offsetParent, r0 = root.getBoundingClientRect(), ox = 0, oy = 0; if (op && op !== root) { var pr = op.getBoundingClientRect(); ox = pr.left - r0.left; oy = pr.top - r0.top; }
      var pw = 236, px = wide ? stageX - pw / 2 : S.W / 2 - pw / 2, py = wide ? Math.max(120, floorY - 330 * Z - 90) : floorY - 300 * Z;
      panel.style.left = (px - ox) + "px"; panel.style.top = (py - oy) + "px"; panel.style.width = pw + "px"; panel.style.minHeight = ""; var b = panel.querySelector("button"); if (b) b.focus({ preventScroll: true });
    }
    function restore() {
      if (!wrecked || restoring) return; var sy0 = window.scrollY; restoring = { t: 0 }; wrecked = false; seq = null; heatTo = 0; coolTo = 1; if (panel) panel.hidden = true;
      root.setAttribute("data-state", "recovery"); hintText("Restoring interface."); announce("Restoring interface.");
      letters.forEach(function (l, i) { if (l.state === "home") return; var sunk = l.state === "sink"; l.state = "return"; l.t = -i * 0.025; l.from = { x: l.x, y: sunk ? floorY + 8 : l.y, rot: l.rot, sc: l.sc }; l.hidden = false; l.swept = false; l.op = sunk ? 0 : 1; });
      R.arms.forEach(function (a) { a.holding = false; });
      window.scrollTo(window.scrollX, sy0); window.setTimeout(function () { var f = letters[0] && letters[0].btn; if (f && !f.disabled) f.focus({ preventScroll: true }); }, 2000);
    }
    function stepRestore(dt) {
      restoring.t += dt; var k = ease((restoring.t - 0.2) / 1.2); cracks.forEach(function (c) { c.a = 1 - k; });
      if (restoring.t > 1.9) { if (wreck) { wreck.layer.parentNode.removeChild(wreck.layer); wreck = null; } if (mast) mast.classList.remove("wrecked"); if (logo) logo.style.transform = ""; cracks = []; restoring = null; knocks = []; level = 0; coolTo = 0; root.setAttribute("data-state", "calm"); hintText("Tap a letter to knock it loose."); announce("Interface restored."); cueAt = 8; }
    }

    /* ---- letters ---- */
    function puff(x, n) { for (var i = 0; i < n; i++) dust.push({ x: x + rnd(-10, 10), y: floorY - 2, vx: rnd(-100, 100), vy: rnd(-60, -10), t: 0, life: rnd(0.3, 0.7), s: rnd(1, 2.2), g: 60 }); }
    function stepLetters(dt) {
      letters.forEach(function (l) {
        if (l.state === "loose") { l.t += dt; l.rot = Math.sin(l.t * 40) * 0.06 * Math.min(1, l.t * 5); if (l.t > 0.16) l.state = "falling"; }
        else if (l.state === "cue") { l.t += dt; var amp = l.t < 1.1 ? Math.min(1, l.t * 3) : Math.max(0, 1 - (l.t - 1.1) * 2); l.x = l.hx + Math.sin(l.t * 46) * 1.4 * amp; l.y = l.hy + Math.sin(l.t * 31) * 0.8 * amp; l.rot = Math.sin(l.t * 38) * 0.02 * amp; if (l.t > 1.7) lockIn(l); }
        else if (l.state === "falling") {
          l.vy += G * l.gf * dt; l.x += l.vx * dt; l.y += l.vy * dt; l.rot += l.vr * dt;
          if (l.x < l.w * 0.6) { l.x = l.w * 0.6; l.vx = Math.abs(l.vx) * 0.5; } else if (l.x > S.W - l.w * 0.6) { l.x = S.W - l.w * 0.6; l.vx = -Math.abs(l.vx) * 0.5; }
          if (l.y < 40) { l.y = 40; l.vy = Math.abs(l.vy) * 0.4; }
          if (l.y > restY(l) && l.vy > 0) {
            l.y = restY(l); puff(l.x, 3);
            if (l.bounced >= 1 || l.vy < 200) { l.vy = 0; l.vr = 0; l.rot = clamp(((l.rot + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI, -0.5, 0.5); l.slide = spare(l, l.x); l.t = 0; l.sx = l.x; l.state = "slide"; }
            else { l.bounced++; l.vy *= -0.32; l.vx *= 0.55; l.vr *= 0.4; fx.push({ kind: "tap", x: l.x, y: floorY, t: 0, life: 0.25 }); }
          }
        } else if (l.state === "slide") {
          l.t += dt; var dist = l.slide - l.sx, dur = clamp(Math.abs(dist) / 1400, 0.12, 0.4), u = clamp(l.t / dur, 0, 1), e = 1 - (1 - u) * (1 - u); l.x = l.sx + dist * e; l.y = restY(l); l.rot *= 1 - Math.min(1, dt * 3);
          if (u >= 1) { l.state = "rest"; l.x = l.slide; l.slide = undefined; }
        } else if (l.state === "rest") { l.y = restY(l); }
        else if (l.state === "magnet") { l.t += dt; var k = l.t / l.dur, e2 = k >= 1 ? 1 : 1 - Math.pow(1 - k, 3); l.x = l.from.x + (l.hx - l.from.x) * e2; l.y = l.from.y + (l.hy - l.from.y) * e2; l.rot = l.from.rot * (1 - e2); l.sc += (1 - l.sc) * e2; if (k >= 1) lockIn(l); }
        else if (l.state === "script") { l.t += dt; var uu0 = clamp(l.t / l.dur, 0, 1), to = l.to(), uu = uu0 * uu0 * (3 - 2 * uu0); l.x = l.from.x + (to.x - l.from.x) * uu; l.y = l.from.y + (to.y - l.from.y) * uu - Math.sin(uu0 * Math.PI) * l.arc; l.rot = l.from.rot + l.spin * uu0; l.sc = l.from.sc + (l.toSc - l.from.sc) * uu0; }
        else if (l.state === "return") { l.t += dt; if (l.t < 0) return; var q = ease(l.t / 1.0); l.op = Math.min(1, l.op + dt * 4); l.x = l.from.x + (l.hx - l.from.x) * q; l.y = l.from.y + (l.hy - l.from.y) * q - Math.sin(q * Math.PI) * 40; l.rot = l.from.rot * (1 - q); l.sc = l.from.sc + (1 - l.from.sc) * q; if (l.t >= 1.0) lockIn(l); }
        if (l.state === "held") { var a = R.arms[0].holding ? R.arms[0] : R.arms[1], gh = grip(a); l.x = gh.x; l.y = gh.y; var want = R.state === "place" ? 0 : a.hand - Math.PI / 2 + (a.side < 0 ? 0.2 : -0.2); l.rot += (want - l.rot) * Math.min(1, dt * 9); }
      });
    }
    function stepThings(dt) {
      dust.forEach(function (d) { d.t += dt; d.vy += d.g * dt; d.vx *= Math.pow(0.4, dt); d.x += d.vx * dt; d.y += d.vy * dt; if (!d.spark && d.y > floorY - 2 && d.vy > 0) { d.y = floorY - 2; d.vy = 0; } }); dust = dust.filter(function (d) { return d.t < d.life; }); if (dust.length > 200) dust.splice(0, dust.length - 200);
      fx.forEach(function (f) { f.t += dt; }); fx = fx.filter(function (f) { return f.t < f.life; });
    }

    /* ---- the body ---- */
    function stepRobot(dt) {
      if (seq) stepSeq(dt);
      else if (R.state === "away") { R.tenseTo = 0; if (!wrecked && !restoring) { var l = nearestLetter(); if (l) { enter(); goTo(l); root.setAttribute("data-state", level >= 1 ? "warning" : "active"); } } }
      else stepJob(dt);
      if (R.kick) stepKick(dt); else stepWalk(dt);
      if (!R.moving && !R.kick) { R.bob += (0 - R.bob) * Math.min(1, dt * 6); R.sway += (0 - R.sway) * Math.min(1, dt * 6); R.hipRot += (0 - R.hipRot) * Math.min(1, dt * 6); }
      R.drop += (R.dropTo - R.drop) * Math.min(1, dt * 4.2); R.fold += (R.foldTo - R.fold) * Math.min(1, dt * 4); R.pitch += (R.pitchTo - R.pitch) * Math.min(1, dt * 4); R.yaw += (R.yawTo - R.yaw) * Math.min(1, dt * 4); R.tense += (R.tenseTo - R.tense) * Math.min(1, dt * 3);
      R.alpha += ((R.on ? 1 : 0) - R.alpha) * Math.min(1, dt * 5);
      spot.onTo = R.on ? 1 : 0; spot.on += (spot.onTo - spot.on) * Math.min(1, dt * (spot.onTo ? 3 : 1.2)); spot.x += ((R.on ? R.x : stageX) - spot.x) * Math.min(1, dt * 2.5);
      R.arms.forEach(function (a) {
        var sh = shoulder(a.side); if (!a.x && !a.y) { a.x = sh.x + a.side * 20 * Z; a.y = sh.y + (L1 + L2) * 0.9; }
        var K = a.speed * a.speed * 3.2, C = 2 * Math.sqrt(K) * 0.85, n = 3, h = dt / n;
        for (var s = 0; s < n; s++) { a.vx += ((a.tx - a.x) * K - a.vx * C) * h; a.vy += ((a.ty - a.y) * K - a.vy * C) * h; a.x += a.vx * h; a.y += a.vy * h; }
        var dx = a.x - sh.x, dy = a.y - sh.y, d = Math.hypot(dx, dy) || 1, max = L1 + L2 - 2, min = Math.abs(L1 - L2) + 6;
        if (d > max) { a.x = sh.x + dx / d * max; a.y = sh.y + dy / d * max; dx = a.x - sh.x; dy = a.y - sh.y; d = max; } else if (d < min) { a.x = sh.x + dx / d * min; a.y = sh.y + dy / d * min; dx = a.x - sh.x; dy = a.y - sh.y; d = min; }
        var fs = clamp(d / ((L1 + L2) * 0.88), 0.56, 1); a.f = (a.f || 1) + (fs - (a.f || 1)) * Math.min(1, dt * 10); var l1 = L1 * a.f, l2 = L2 * a.f;
        var b = Math.atan2(dy, dx), cs = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), bend = Math.acos(cs);
        var o1 = Math.cos(b + bend) * a.side + Math.sin(b + bend) * 0.3, o2 = Math.cos(b - bend) * a.side + Math.sin(b - bend) * 0.3; if (!a.sign) a.sign = o1 > o2 ? 1 : -1; if (a.sign > 0 ? o2 > o1 + 0.25 : o1 > o2 + 0.25) a.sign = -a.sign;
        var want = b + bend * a.sign, exT = sh.x + Math.cos(want) * l1, eyT = sh.y + Math.sin(want) * l1; if (!a.ex && !a.ey) { a.ex = exT; a.ey = eyT; }
        a.ex += (exT - a.ex) * Math.min(1, dt * 18); a.ey += (eyT - a.ey) * Math.min(1, dt * 18); var el = Math.hypot(a.ex - sh.x, a.ey - sh.y) || 1; a.ex = sh.x + (a.ex - sh.x) / el * l1; a.ey = sh.y + (a.ey - sh.y) / el * l1;
        var fl = Math.hypot(a.x - a.ex, a.y - a.ey) || 1; a.dx = (a.x - a.ex) / fl; a.dy = (a.y - a.ey) / fl;
        var fa = Math.atan2(a.dy, a.dx), flatAng = a.handDir === null || a.handDir === undefined ? (a.dx >= 0 ? 0 : Math.PI) : a.handDir, wantW = flatAng - fa; while (wantW > Math.PI) wantW -= 6.2832; while (wantW < -Math.PI) wantW += 6.2832;
        a.wrist += (clamp(wantW, -1.5, 1.5) * a.wristTo - a.wrist) * Math.min(1, dt * 9); a.roll += (a.rollTo - a.roll) * Math.min(1, dt * 7); a.hand = fa + a.wrist;
        a.curl += (a.curlTo - a.curl) * Math.min(1, dt * 12); a.pinch += (a.pinchTo - a.pinch) * Math.min(1, dt * 12);
      });
    }

    /* ---- drawing ---- */
    function seg(ctx, name, x, y, ang, k, natAng) { var r = RIG[name], im = IMG[name]; if (!im.complete || !im.naturalWidth) return; ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, 1); ctx.rotate(-natAng); ctx.drawImage(im, (r.x - r.px) * Z, (r.y - r.py) * Z, r.w * Z, r.h * Z); ctx.restore(); }
    function piece(ctx, name, x, y, rot, sx, sy) { var r = RIG[name], im = IMG[name]; if (!im.complete || !im.naturalWidth) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(sx || 1, sy || 1); ctx.drawImage(im, (r.x - r.px) * Z, (r.y - r.py) * Z, r.w * Z, r.h * Z); ctx.restore(); }
    function handSide(a) { var c = Math.cos(a.hand), s = Math.sin(a.hand), dx = -a.side * Math.max(0, s), dy = -Math.abs(c); return (s * dx - c * dy) >= 0 ? "R" : "L"; }
    function handPiece(ctx, H, name, side, rot, sy) { var r = H[name], im = IMG[name + side]; if (!im || !im.complete || !im.naturalWidth) return; ctx.save(); ctx.translate(r.px - H.wrist[0], r.py - H.wrist[1]); ctx.rotate(rot || 0); if (sy !== undefined && sy !== 1) ctx.scale(1, sy); ctx.drawImage(im, r.x - r.px, r.y - r.py, r.w, r.h); ctx.restore(); }
    // The hand: the photo hand, cut into a palm, a thumb and four fingers that pivot at their knuckles. Local +y runs down the fingers.
    function hand(ctx, a, part) {
      var sd = handSide(a), H = HANDS[sd], k = Z * HS, c = a.curl, p = a.pinch, inward = sd === "R" ? 1 : -1, i;
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.hand - Math.PI / 2); ctx.scale(k, k);
      if (part !== "front") {
        handPiece(ctx, H, "palm", sd, 0, 1);
        for (i = 1; i < 4; i++) handPiece(ctx, H, "f" + i, sd, -inward * (c * 0.12 + p * 0.22) * (1 + i * 0.15), 1 - c * 0.3 - p * 0.18);
        handPiece(ctx, H, "thumb", sd, -inward * (0.15 + c * 0.35 + p * 0.95), 1 - p * 0.12);
      }
      if (part !== "back") handPiece(ctx, H, "f0", sd, inward * (p * 0.55 - c * 0.05), 1 - c * 0.28 - p * 0.1);
      ctx.restore();
    }
    function drawLeg(ctx, i) {
      var side = i ? 1 : -1, th = RIG[i ? "thighR" : "thighL"], sh = RIG[i ? "shinR" : "shinL"], ft = i ? "footR" : "footL", f = R.feet[i];
      var hx = hipX() + side * SRC.hipJoint * Z * Math.cos(R.hipRot) - R.hipRot * 20 * Z, hy = hipY() + SRC.thighTop * Z + side * R.hipRot * 30 * Z;
      var ax = f.x, ay = floorY - f.lift - 4 * Z, T = SRC.thigh * Z, Sh = SRC.shin * Z, dx = ax - hx, dy = ay - hy, d = Math.hypot(dx, dy) || 1, bend = clamp(1 - d / (T + Sh), 0, 0.85);
      var kx = hx + dx * (T / (T + Sh)) + side * bend * 70 * Z + (f.lift > 0 ? R.dir * f.lift * 0.6 : 0), ky = hy + dy * (T / (T + Sh)) + bend * 12 * Z;
      // foot shadow, pressed flat when the foot is planted
      var lk = clamp(f.lift / (40 * Z), 0, 1); ctx.fillStyle = "rgba(0,0,0," + (0.55 * (1 - lk * 0.7) * R.alpha).toFixed(3) + ")"; ctx.beginPath(); ctx.ellipse(ax + 6 * Z, floorY + 3, 62 * Z * (1 - lk * 0.25), 9 * Z, 0, 0, 6.2832); ctx.fill();
      seg(ctx, i ? "thighR" : "thighL", hx, hy, Math.atan2(ky - hy, kx - hx), Math.hypot(kx - hx, ky - hy) / T, Math.atan2(th.ky - th.py, th.kx - th.px));
      seg(ctx, i ? "shinR" : "shinL", kx, ky, Math.atan2(ay - ky, ax - kx), Math.hypot(ax - kx, ay - ky) / Sh, Math.PI / 2);
      piece(ctx, ft, ax, ay, (f.lift > 0 ? -R.dir * lk * 0.25 : 0), 1, 1 - lk * 0.2);
    }
    function drawArm(ctx, a, part) {
      var sh = shoulder(a.side), n = NAT[a.side], up = a.side < 0 ? "armL1" : "armR1", lo = a.side < 0 ? "armL2" : "armR2";
      if (part !== "front") {
        seg(ctx, up, sh.x, sh.y, Math.atan2(a.ey - sh.y, a.ex - sh.x), (a.f || 1), n.u);
        seg(ctx, lo, a.ex, a.ey, Math.atan2(a.y - a.ey, a.x - a.ex), (a.f || 1), n.f);
      }
      hand(ctx, a, part);
    }
    function drawRobot(ctx) {
      if (R.alpha < 0.02) return;
      var sx = R.turnK ? Math.cos(Math.PI * R.turnK) : 1; if (R.back) sx = -Math.abs(sx || 0.02) ; if (Math.abs(sx) < 0.04) sx = 0.04 * (sx < 0 ? -1 : 1);
      ctx.save(); ctx.globalAlpha = R.alpha * clamp((S.W + 60 * Z - R.x) / (100 * Z), 0, 1); ctx.translate(R.x, 0); ctx.scale(sx, 1); ctx.translate(-R.x, 0);
      if (R.back) ctx.filter = "brightness(0.5) contrast(1.05)";
      var h = { x: hipX(), y: hipY() };
      // body shadow on the floor
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(R.x, floorY + 4, 150 * Z, 14 * Z, 0, 0, 6.2832); ctx.fill();
      // the leg on the far side first, then the near arm behind the torso, then torso, head, legs, arms
      drawLeg(ctx, R.dir < 0 ? 1 : 0); drawLeg(ctx, R.dir < 0 ? 0 : 1);
      var farArm = R.arms[R.dir < 0 ? 1 : 0], nearArm = R.arms[R.dir < 0 ? 0 : 1];
      if (!farArm.holding) drawArm(ctx, farArm, "all");
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(R.hipRot * 0.6 + R.sway * 0.002); ctx.scale(1, fc()); ctx.translate(-h.x, -h.y); piece(ctx, "torso", h.x, h.y, 0); ctx.restore();
      var hp = headPos(); piece(ctx, "head", hp.x + R.yaw * 7 * Z, hp.y + Math.max(0, R.pitch) * 9 * Z, R.yaw * 0.14 + R.hipRot * 0.4 + Math.sin(clock * 0.8) * 0.006, 1 - Math.abs(R.yaw) * 0.08, 1 - Math.abs(R.pitch) * 0.14);
      if (R.back) { ctx.fillStyle = "rgba(8,9,12,.9)"; ctx.beginPath(); ctx.ellipse(hp.x, hp.y - 95 * Z, 52 * Z, 80 * Z, 0, 0, 6.2832); ctx.fill(); }
      if (!nearArm.holding) drawArm(ctx, nearArm, "all"); else drawArm(ctx, nearArm, "back");
      if (farArm.holding) drawArm(ctx, farArm, "back");
      ctx.filter = "none"; ctx.restore();
    }
    function lightRgb() { return [255, Math.round(240 - heat * 130 - cool * 10), Math.round(222 - heat * 150 + cool * 30)].join(","); }
    function drawStage(ctx) {
      var rgb = lightRgb(), on = spot.on, lx = spot.x;
      // the floor: nearly black, a faint horizon
      var fg = ctx.createLinearGradient(0, floorY, 0, S.H); fg.addColorStop(0, "#0b0d12"); fg.addColorStop(1, "#05070a"); ctx.fillStyle = fg; ctx.fillRect(0, floorY, S.W, S.H - floorY);
      ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillRect(0, floorY, S.W, 1);
      // a faint pool at the empty stage, and the narrow spotlight when it is on
      var pool = ctx.createRadialGradient(stageX, floorY, 0, stageX, floorY, 240 * Z); pool.addColorStop(0, "rgba(" + rgb + ",.07)"); pool.addColorStop(1, "rgba(" + rgb + ",0)"); ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(stageX, floorY + 2, 240 * Z, 40 * Z, 0, 0, 6.2832); ctx.fill();
      if (on > 0.01) {
        var cone = ctx.createLinearGradient(0, -10, 0, floorY); cone.addColorStop(0, "rgba(" + rgb + "," + (0.13 * on).toFixed(3) + ")"); cone.addColorStop(0.75, "rgba(" + rgb + "," + (0.05 * on).toFixed(3) + ")"); cone.addColorStop(1, "rgba(" + rgb + "," + (0.03 * on).toFixed(3) + ")");
        ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(lx - 14, -10); ctx.lineTo(lx + 14, -10); ctx.lineTo(lx + 210 * Z, floorY + 2); ctx.lineTo(lx - 210 * Z, floorY + 2); ctx.closePath(); ctx.fill();
        var fp = ctx.createRadialGradient(lx, floorY, 0, lx, floorY, 260 * Z); fp.addColorStop(0, "rgba(" + rgb + "," + (0.22 * on).toFixed(3) + ")"); fp.addColorStop(1, "rgba(" + rgb + ",0)"); ctx.fillStyle = fp; ctx.beginPath(); ctx.ellipse(lx, floorY + 2, 260 * Z, 46 * Z, 0, 0, 6.2832); ctx.fill();
      }
    }

    var api = {
      step: function (dt) {
        slowT = Math.max(0, slowT - dt); timeScale += ((slowT > 0 ? 0.3 : 1) - timeScale) * Math.min(1, dt * (slowT > 0 ? 18 : 5)); dt *= timeScale;
        clock += dt; sinceMeasure += dt; if (sinceMeasure > 0.5) { sinceMeasure = 0; measure(); }
        knocks = knocks.filter(function (t) { return clock - t < 6; }); level = knocks.length >= 5 ? 2 : knocks.length >= 3 ? 1 : 0;
        if (!seq && !wrecked && !restoring) {
          if (level >= 2 && (R.on || resting().length)) startSeq();
          else if (level >= 1 && R.on && R.state !== "away") { root.setAttribute("data-state", "warning"); R.spd = Math.max(R.spd, 1.5); }
          if (cue) { cue.t += dt; if (cue.t > 2.2) cue = null; } else if (!R.on && cueAt > 0) { cueAt -= dt; if (cueAt <= 0 && letters.every(function (l) { return l.state === "home"; })) { var c = letters[(Math.random() * letters.length) | 0]; c.state = "cue"; c.t = 0; cue = { l: c, t: 0 }; } }
        }
        heat += (heatTo - heat) * Math.min(1, dt * 3); cool += (coolTo - cool) * Math.min(1, dt * 2.5);
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
        ctx.fillStyle = "#05070b"; ctx.fillRect(0, 0, S.W, S.H);
        ctx = mctx; ctx.clearRect(0, 0, S.W, S.H);
        drawStage(ctx); drawRobot(ctx);
        letters.forEach(function (l) { if (l.state === "home" || l.hidden || l.state === "held") return; var hgt = Math.max(0, floorY - l.y), a = clamp(0.5 - hgt / 500, 0, 0.5); if (a > 0.02) { ctx.fillStyle = "rgba(0,0,0," + a.toFixed(3) + ")"; ctx.beginPath(); ctx.ellipse(l.x, floorY + 3, l.w * (0.55 + hgt / 600) * l.sc, 3.5, 0, 0, 6.2832); ctx.fill(); } });
        fx.forEach(function (f) { if (f.kind === "tap") { ctx.fillStyle = "rgba(255,255,255," + (0.35 * (1 - f.t / f.life)).toFixed(3) + ")"; ctx.fillRect(f.x - 14, f.y - 1, 28, 2); } });

        var t = tctx; t.clearRect(0, 0, S.W, S.H);
        letters.forEach(function (l) { if (l.state === "home" || l.state === "cue" || seq || wrecked) return; var on = R.job === l; t.lineWidth = on ? 1.5 : 1; t.setLineDash([3, 5]); t.strokeStyle = on ? "rgba(255,244,225," + (0.55 + Math.sin(clock * 6) * 0.25).toFixed(2) + ")" : "rgba(255,244,225,.22)"; t.strokeRect(l.hx - l.w / 2 + 1, l.hy - l.h * 0.36, l.w - 2, l.h * 0.72); t.setLineDash([]); });
        letters.forEach(function (l) { if (l.px !== undefined && !l.hidden && (l.state === "falling" || l.state === "script")) { var sp = Math.hypot(l.x - l.px, l.y - l.py); if (sp > 9) { var g = t.createLinearGradient(l.px, l.py, l.x, l.y); g.addColorStop(0, "rgba(235,231,222,0)"); g.addColorStop(1, "rgba(235,231,222," + clamp(sp / 60, 0, 0.45).toFixed(3) + ")"); t.strokeStyle = g; t.lineWidth = l.h * 0.5 * l.sc; t.lineCap = "round"; t.beginPath(); t.moveTo(l.px - (l.x - l.px) * 1.5, l.py - (l.y - l.py) * 1.5); t.lineTo(l.x, l.y); t.stroke(); } } l.px = l.x; l.py = l.y; });
        // the fingers of a hand that holds a letter sit in front of it
        if (R.alpha > 0.02) R.arms.forEach(function (a) { if (a.holding) { t.save(); t.globalAlpha = R.alpha; drawArm(t, a, "front"); t.restore(); } });
        cracks.forEach(function (c) { t.lineCap = "round"; t.lineJoin = "round"; c.lines.forEach(function (pts) { [[3, "rgba(0,0,0," + (0.5 * c.a).toFixed(3) + ")", 1], [1.1, "rgba(240,244,252," + (0.7 * c.a).toFixed(3) + ")", 0]].forEach(function (pass) { t.beginPath(); pts.forEach(function (q, i) { if (i) t.lineTo(q[0], q[1] + pass[2]); else t.moveTo(q[0], q[1] + pass[2]); }); t.lineWidth = pass[0]; t.strokeStyle = pass[1]; t.stroke(); }); }); t.beginPath(); t.ellipse(c.x, c.y, 22, 7, 0, 0, 6.2832); t.fillStyle = "rgba(0,0,0," + (0.5 * c.a).toFixed(3) + ")"; t.fill(); });
        dust.forEach(function (d) { var a = 1 - d.t / d.life; t.fillStyle = d.chip ? "rgba(225,232,245," + a.toFixed(3) + ")" : "rgba(210,205,195," + (a * 0.6).toFixed(3) + ")"; t.fillRect(d.x, d.y, d.s, d.s); });
        fx.forEach(function (f) { var k = f.t / f.life; if (f.kind === "ring") { t.beginPath(); t.arc(f.x, f.y, f.r * (0.6 + k), 0, 6.2832); t.lineWidth = 1.5; t.strokeStyle = "rgba(235,240,250," + (0.8 * (1 - k)).toFixed(3) + ")"; t.stroke(); } else if (f.kind === "slot") { var l = f.l; t.lineWidth = 2; t.strokeStyle = "rgba(255,244,225," + (0.9 * (1 - k)).toFixed(3) + ")"; t.strokeRect(l.hx - l.w / 2 + 1, l.hy - l.h * 0.36, l.w - 2, l.h * 0.72); } else if (f.kind === "flash") { var g = t.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, "rgba(255,245,235," + (0.95 * (1 - k)).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,200,170,0)"); t.fillStyle = g; t.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); } });
      }
    };
    root.__knock = function (idx) { api.click(0, 0, S, idx); };
    root.__dbg = function () { return { state: R.state, on: R.on, x: Math.round(R.x), feet: R.feet.map(function (f) { return [Math.round(f.x), Math.round(f.lift)]; }), drop: Math.round(R.drop), fold: +R.fold.toFixed(2), seq: seq && seq.t, wrecked: wrecked, level: level, states: letters.map(function (l) { return l.state; }).join(""), floorY: floorY, Z: +Z.toFixed(3), hipY: Math.round(hipY()), headY: Math.round(headPos().y), shoulderY: Math.round(shoulder(-1).y), arms: R.arms.map(function (a) { return [Math.round(a.x), Math.round(a.y), +a.hand.toFixed(2), a.holding]; }) }; };
    return api;
  };
})();
