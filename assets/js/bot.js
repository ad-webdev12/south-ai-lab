/* South Artificial Intelligence Laboratory: the robot.
   One character shared by the Language, Agents and Ethics pages. This file only
   knows how the robot moves, looks and speaks; each page decides what it does.
   Face: `mood` = { lid 0..1 closed, anger 0..1, joy 0..1, wide 0..1, dead, wink }.
   Hands can hold a tool: magnifier, wrench, magnet, shield, battery, pointer. */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL) return;
  if (!window.SAILMemory) {      // memory.js removed: remember nothing beyond this page view
    var blank = function () { return { v: 1, first: Date.now(), last: 0, views: 1, pages: {}, clicks: { total: 0, letters: 0, robot: 0, controls: 0 }, navHover: {}, feedback: 0, reward: 0, q: {}, trans: {}, spell: {}, torment: 0, deaths: 0, trust: 0.5, frus: 0, verdict: null, events: [] }; }, m = blank();
    window.SAILMemory = { data: function () { return m; }, page: "", touch: function () {}, save: function () {}, log: function () {}, forget: function () { m = blank(); }, bytes: function () { return 0; }, returning: false, seenBefore: false };
  }
  var dot = SAIL.dot, TEAL = SAIL.TEAL, WARM = SAIL.WARM, INK = SAIL.INK;
  var RED = "255,96,96", GOLD = "255,214,102";

  function lerp(a, b, k) { return a + (b - a) * k; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mixRgb(a, b, k) { var p = a.split(","), q = b.split(","); return [0, 1, 2].map(function (i) { return Math.round(lerp(+p[i], +q[i], k)); }).join(","); }
  function rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function shell(ctx, x0, y0, x1, y1) { var g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, "#ffffff"); g.addColorStop(0.45, "#e3e9f1"); g.addColorStop(1, "#7f8ca3"); return g; }

  function Bot(R, x, y) {
    this.R = R; this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.lean = 0; this.t = 0;
    this.look = { x: 0, y: 0 }; this.blink = 0; this.nextBlink = 2; this.twitch = 0; this.freeze = 0;
    this.mood = { lid: 0, anger: 0, joy: 0, wide: 0, dead: false, wink: false };
    this.face = { lid: 0, anger: 0, joy: 0, wide: 0 };          // eased copy of mood
    this.rgb = TEAL; this.energy = 1; this.limp = 0; this.sparks = [];
    this.L1 = R * 1.3; this.L2 = R * 1.25; this.HOLD = R * 0.36;
    var self = this;
    this.arms = [-1, 1].map(function (side) { return { side: side, x: x + side * R, y: y + R * 2, ex: x + side * R, ey: y + R, grip: 0.6, open: 0.6, dx: 0, dy: 1, tool: null, tx: null, ty: null, busy: false, bot: self }; });
  }

  Bot.prototype.shoulder = function (side) {
    var c = Math.cos(this.lean), s = Math.sin(this.lean), lx = side * this.R * 0.78, ly = -this.R * 0.46;
    return { x: this.x + lx * c - ly * s, y: this.y + lx * s + ly * c };
  };
  // ask an arm to reach for a point this frame; arms nobody asks for hang and sway
  Bot.prototype.reach = function (side, x, y, open, tool) {
    var a = this.arms[side < 0 ? 0 : 1]; a.tx = x; a.ty = y; a.busy = true; if (open !== undefined) a.open = open; if (tool !== undefined) a.tool = tool; return a;
  };
  Bot.prototype.spark = function (n) { for (var i = 0; i < n; i++) this.sparks.push({ x: this.x + (Math.random() - 0.5) * this.R, y: this.y - this.R * Math.random() * 1.6, vx: (Math.random() - 0.5) * 420, vy: -Math.random() * 380, t: 0 }); };

  Bot.prototype.step = function (dt, target, focus, opt) {
    opt = opt || {}; var R = this.R, self = this; this.t += dt;
    var k = opt.stiff || 19, c = opt.damp || 8.6;
    if (this.freeze > 0) { this.freeze -= dt; this.vx *= 0.8; this.vy *= 0.8; }
    else if (this.mood.dead) { this.vy += 2200 * dt; this.vx *= 0.97; }
    else {
      var ty = target.y + Math.sin(this.t * 2.1) * R * 0.07;
      this.vx += ((target.x - this.x) * k - this.vx * c) * dt; this.vy += ((ty - this.y) * k - this.vy * c) * dt;
    }
    var sp = Math.hypot(this.vx, this.vy), cap = opt.cap || 1400; if (sp > cap) { this.vx *= cap / sp; this.vy *= cap / sp; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    var floor = opt.floor === undefined ? 1e9 : opt.floor - R * (this.mood.dead ? 0.95 : 1.25);
    if (this.y > floor) { this.y = floor; if (this.mood.dead) { this.vy *= -0.25; this.vx *= 0.7; } else this.vy = Math.min(0, this.vy); }
    this.energy = clamp(this.energy - sp * dt * 0.000018, 0, 1);
    var wantLean = this.mood.dead ? (this.y >= floor - 1 ? 1.25 : this.lean) : clamp(this.vx * 0.0007, -0.32, 0.32);
    this.lean += (wantLean - this.lean) * Math.min(1, dt * 6);

    var fx = focus ? focus.x - this.x : this.vx, fy = focus ? focus.y - (this.y - R * 1.6) : this.vy, fd = Math.hypot(fx, fy) || 1;
    if (this.freeze <= 0) { this.look.x += (fx / fd - this.look.x) * Math.min(1, dt * 7); this.look.y += (fy / fd - this.look.y) * Math.min(1, dt * 7); }
    this.nextBlink -= dt; if (this.nextBlink < 0) { this.blink = 0.15; this.nextBlink = 2 + Math.random() * 3.5; } if (this.blink > 0) this.blink -= dt;
    ["lid", "anger", "joy", "wide"].forEach(function (key) { self.face[key] += (self.mood[key] - self.face[key]) * Math.min(1, dt * 8); });
    this.twitch = this.face.anger > 0.45 ? Math.sin(this.t * 38) * this.face.anger : this.twitch * 0.9;
    this.rgb = this.mood.dead ? "90,100,120" : mixRgb(mixRgb(TEAL, GOLD, clamp(this.face.anger * 1.6, 0, 1)), RED, clamp(this.face.anger * 1.8 - 0.9, 0, 1));
    this.limp += ((this.mood.dead ? 1 : 0) - this.limp) * Math.min(1, dt * 6);

    this.arms.forEach(function (a) {
      var sh = self.shoulder(a.side);
      if (!a.busy || self.mood.dead) { a.tx = sh.x + a.side * R * (0.42 + self.limp * 0.5) - self.vx * 0.04; a.ty = sh.y + R * 1.95 - Math.abs(self.vx) * 0.02 + Math.sin(self.t * 2.1 + a.side) * R * 0.05; a.open = 0.6; a.tool = self.mood.dead ? null : a.keep || null; }
      var kk = Math.min(1, dt * (a.busy ? 10 : 6));
      a.x += (a.tx - a.x) * kk; a.y += (a.ty - a.y) * kk; a.grip += (a.open - a.grip) * Math.min(1, dt * 12);
      var dx = a.x - sh.x, dy = a.y - sh.y, d = Math.hypot(dx, dy) || 1, max = self.L1 + self.L2 - 1;
      if (d > max) { a.x = sh.x + dx / d * max; a.y = sh.y + dy / d * max; dx = a.x - sh.x; dy = a.y - sh.y; d = max; }
      var base = Math.atan2(dy, dx), cs = clamp((self.L1 * self.L1 + d * d - self.L2 * self.L2) / (2 * self.L1 * d), -1, 1), bend = Math.acos(cs);
      var e1 = { x: sh.x + Math.cos(base + bend) * self.L1, y: sh.y + Math.sin(base + bend) * self.L1 }, e2 = { x: sh.x + Math.cos(base - bend) * self.L1, y: sh.y + Math.sin(base - bend) * self.L1 };
      var pick = (e1.x - self.x) * a.side + e1.y * 0.25 > (e2.x - self.x) * a.side + e2.y * 0.25 ? e1 : e2;
      a.ex += (pick.x - a.ex) * Math.min(1, dt * 14); a.ey += (pick.y - a.ey) * Math.min(1, dt * 14);
      var fxx = a.x - a.ex, fyy = a.y - a.ey, fl = Math.hypot(fxx, fyy) || 1; a.dx = fxx / fl; a.dy = fyy / fl;
      a.busy = false;
    });
    this.sparks.forEach(function (s) { s.t += dt; s.vy += 1500 * dt; s.x += s.vx * dt; s.y += s.vy * dt; });
    this.sparks = this.sparks.filter(function (s) { return s.t < 0.7; });
  };

  function link(ctx, x0, y0, x1, y1, w) {
    var nx = -(y1 - y0), ny = x1 - x0, n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n; if (ny > 0) { nx = -nx; ny = -ny; }
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineWidth = w + 3; ctx.strokeStyle = "#050a14"; ctx.stroke();
    ctx.lineWidth = w; ctx.strokeStyle = "#bcc6d4"; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + nx * w * 0.16, y0 + ny * w * 0.16); ctx.lineTo(x1 + nx * w * 0.16, y1 + ny * w * 0.16); ctx.lineWidth = w * 0.52; ctx.strokeStyle = "#f6f9fc"; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 - nx * w * 0.3, y0 - ny * w * 0.3); ctx.lineTo(x1 - nx * w * 0.3, y1 - ny * w * 0.3); ctx.lineWidth = w * 0.18; ctx.strokeStyle = "rgba(60,76,104,.6)"; ctx.stroke();
  }

  function drawTool(ctx, a, R, rgb, t) {
    var ang = Math.atan2(a.dy, a.dx), x = a.x + a.dx * R * 0.3, y = a.y + a.dy * R * 0.3;
    ctx.save(); ctx.translate(x, y); ctx.lineCap = "round";
    if (a.tool === "magnifier") {
      ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * 0.42, 0); ctx.lineWidth = R * 0.11; ctx.strokeStyle = "#1a2540"; ctx.stroke();
      ctx.beginPath(); ctx.arc(R * 0.72, 0, R * 0.32, 0, 6.2832); ctx.fillStyle = "rgba(143,220,255,.16)"; ctx.fill(); ctx.lineWidth = R * 0.08; ctx.strokeStyle = "#e6eef8"; ctx.stroke();
      ctx.beginPath(); ctx.arc(R * 0.72, 0, R * 0.2, 3.6, 4.6); ctx.lineWidth = R * 0.04; ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.stroke();
    } else if (a.tool === "wrench") {
      ctx.rotate(ang + Math.sin(t * 14) * 0.35); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * 0.7, 0); ctx.lineWidth = R * 0.12; ctx.strokeStyle = "#c9d3e2"; ctx.stroke();
      ctx.beginPath(); ctx.arc(R * 0.8, 0, R * 0.17, 0.7, 5.6); ctx.lineWidth = R * 0.1; ctx.stroke();
    } else if (a.tool === "pointer") {
      ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * 0.9, 0); ctx.lineWidth = R * 0.06; ctx.strokeStyle = "#e6eef8"; ctx.stroke(); dot(ctx, R * 0.9, 0, R * 0.09, rgb, 0.9);
    } else if (a.tool === "battery") {
      ctx.rotate(ang - 1.57); rr(ctx, -R * 0.17, R * 0.02, R * 0.34, R * 0.56, R * 0.05); ctx.fillStyle = "#101a2e"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#e6eef8"; ctx.stroke();
      ctx.fillStyle = "rgb(" + TEAL + ")"; ctx.fillRect(-R * 0.11, R * 0.2, R * 0.22, R * 0.32); ctx.fillStyle = "#e6eef8"; ctx.fillRect(-R * 0.06, -R * 0.03, R * 0.12, R * 0.05); dot(ctx, 0, R * 0.34, R * 0.14, TEAL, 0.6);
    } else if (a.tool === "magnet") {
      ctx.rotate(ang - 1.57); ctx.beginPath(); ctx.arc(0, R * 0.45, R * 0.3, Math.PI, 0); ctx.lineWidth = R * 0.2; ctx.lineCap = "butt"; ctx.strokeStyle = "#e0404f"; ctx.stroke();
      ctx.fillStyle = "#e6eef8"; ctx.fillRect(-R * 0.4, R * 0.45, R * 0.2, R * 0.16); ctx.fillRect(R * 0.2, R * 0.45, R * 0.2, R * 0.16);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < 3; i++) { var rr2 = R * (0.6 + ((t * 1.6 + i / 3) % 1) * 1.6); ctx.beginPath(); ctx.arc(0, R * 0.7, rr2, 0.5, 2.64); ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(" + RED + "," + (0.5 * (1 - (rr2 / R - 0.6) / 1.6)).toFixed(3) + ")"; ctx.stroke(); }
      ctx.globalCompositeOperation = "source-over";
    } else if (a.tool === "shield") {
      ctx.rotate(ang); var sw = R * 1.5, shh = R * 1.7; ctx.translate(R * 0.5, 0);
      ctx.beginPath(); ctx.moveTo(0, -shh / 2); ctx.lineTo(sw * 0.26, -shh / 2); ctx.quadraticCurveTo(sw * 0.62, 0, sw * 0.26, shh / 2); ctx.lineTo(0, shh / 2); ctx.closePath();
      var g = ctx.createLinearGradient(0, -shh / 2, sw * 0.5, shh / 2); g.addColorStop(0, "rgba(" + rgb + ",.34)"); g.addColorStop(1, "rgba(" + rgb + ",.08)"); ctx.fillStyle = g; ctx.fill();
      SAIL.glow(ctx, rgb, 1.8, 0.9);
    }
    ctx.restore();
  }

  Bot.prototype.draw = function (ctx, floorY, H) {
    var R = this.R, rgb = this.rgb, f = this.face, m = this.mood, self = this;
    var flick = m.dead ? 0 : 0.85 + Math.sin(this.t * 31) * 0.08 + Math.sin(this.t * 17) * 0.07;
    if (floorY) { var lift = Math.max(0, floorY - this.y - R), fa = Math.max(0.1, 0.55 - lift / (H * 0.7)); ctx.save(); ctx.translate(this.x, floorY + 2); ctx.scale(1, 0.16); dot(ctx, 0, 0, R * (1.1 + lift / H * 2), rgb, fa * (m.dead ? 0.3 : 1)); ctx.restore(); }
    dot(ctx, this.x, this.y - R * 0.4, R * 2, INK, 0.1);

    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.lean);
    // thruster
    if (flick) { dot(ctx, 0, R * 1.22, R * 0.52 * flick, rgb, 0.95); dot(ctx, 0, R * 1.06, R * 0.2, "255,255,255", 0.8 * flick); }
    ctx.beginPath(); ctx.ellipse(0, R * 0.93, R * 0.36, R * 0.12, 0, 0, 6.2832); ctx.fillStyle = "#070c18"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "rgb(" + rgb + ")"; ctx.stroke();
    // body
    ctx.beginPath(); ctx.moveTo(-R * 0.7, -R * 0.42); ctx.bezierCurveTo(-R * 0.7, -R * 0.95, R * 0.7, -R * 0.95, R * 0.7, -R * 0.42);
    ctx.bezierCurveTo(R * 0.7, R * 0.4, R * 0.44, R * 0.92, 0, R * 0.96); ctx.bezierCurveTo(-R * 0.44, R * 0.92, -R * 0.7, R * 0.4, -R * 0.7, -R * 0.42); ctx.closePath();
    ctx.fillStyle = shell(ctx, -R * 0.6, -R * 0.9, R * 0.55, R * 0.95); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#050a14"; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.ellipse(R * 0.62, R * 0.1, R * 0.3, R * 1.1, 0, 0, 6.2832); ctx.fillStyle = "rgba(" + rgb + ",.22)"; ctx.fill();       // colored rim light
    ctx.fillStyle = "rgba(14,22,40,.82)"; ctx.fillRect(-R, R * 0.46, R * 2, R * 0.6);                                                       // dark lower shell
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-R * 0.62, R * 0.46); ctx.quadraticCurveTo(0, R * 0.62, R * 0.62, R * 0.46); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(" + rgb + ",.7)"; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-R * 0.32, -R * 0.5, R * 0.15, R * 0.3, 0.5, 0, 6.2832); ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fill();
    // chest core: a ring that shows charge
    ctx.beginPath(); ctx.arc(0, -R * 0.1, R * 0.24, 0, 6.2832); ctx.fillStyle = "#0a1120"; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = "#2a3956"; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -R * 0.1, R * 0.17, -1.57, -1.57 + 6.2832 * clamp(this.energy, 0.04, 1)); ctx.lineWidth = R * 0.06; ctx.lineCap = "butt"; ctx.strokeStyle = "rgb(" + rgb + ")"; ctx.stroke();
    dot(ctx, 0, -R * 0.1, R * 0.1, rgb, m.dead ? 0 : 0.8);
    // neck, ears, antenna
    ctx.fillStyle = "#0a1120"; ctx.fillRect(-R * 0.17, -R * 1.04, R * 0.34, R * 0.26);
    ctx.beginPath(); ctx.arc(-R * 0.86, -R * 1.55, R * 0.14, 0, 6.2832); ctx.arc(R * 0.86, -R * 1.55, R * 0.14, 0, 6.2832); ctx.fillStyle = "#111a2d"; ctx.fill();
    dot(ctx, -R * 0.86, -R * 1.55, R * 0.05, rgb, 0.8); dot(ctx, R * 0.86, -R * 1.55, R * 0.05, rgb, 0.8);
    var ax = R * 0.34 + this.twitch * R * 0.1 - this.lean * R * 0.5, ay = -R * 2.62;
    ctx.beginPath(); ctx.moveTo(R * 0.3, -R * 2.1); ctx.quadraticCurveTo(R * 0.3, -R * 2.4, ax, ay); ctx.lineWidth = R * 0.05; ctx.strokeStyle = "#c9d3e2"; ctx.stroke();
    ctx.beginPath(); ctx.arc(ax, ay, R * 0.075, 0, 6.2832); ctx.fillStyle = "rgb(" + rgb + ")"; ctx.fill(); if (!m.dead) dot(ctx, ax, ay, R * 0.12, rgb, 0.7 + Math.sin(this.t * 4) * 0.2);
    // head and visor
    rr(ctx, -R * 0.84, -R * 2.14, R * 1.68, R * 1.16, R * 0.52); ctx.fillStyle = shell(ctx, -R * 0.7, -R * 2.15, R * 0.6, -R * 0.9); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#050a14"; ctx.stroke();
    rr(ctx, -R * 0.68, -R * 1.96, R * 1.36, R * 0.8, R * 0.38); var vg = ctx.createLinearGradient(0, -R * 1.96, 0, -R * 1.16); vg.addColorStop(0, "#02040a"); vg.addColorStop(1, "#121c32"); ctx.fillStyle = vg; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.moveTo(-R * 0.75, -R * 1.2); ctx.lineTo(-R * 0.2, -R * 2); ctx.lineTo(R * 0.08, -R * 2); ctx.lineTo(-R * 0.47, -R * 1.2); ctx.closePath(); ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fill();
    // eyes
    var ex = this.look.x * R * 0.14, ey = this.look.y * R * 0.09, cy = -R * 1.6 + ey;
    [-1, 1].forEach(function (s) {
      var cx = s * R * 0.29 + ex, w = R * 0.19 * (1 + f.wide * 0.35), h = R * 0.34 * (1 + f.wide * 0.3);
      if (m.dead && !(m.wink && s === 1)) {
        ctx.beginPath(); ctx.moveTo(cx - w * 0.5, cy - w * 0.5); ctx.lineTo(cx + w * 0.5, cy + w * 0.5); ctx.moveTo(cx + w * 0.5, cy - w * 0.5); ctx.lineTo(cx - w * 0.5, cy + w * 0.5); ctx.lineWidth = R * 0.05; ctx.strokeStyle = "rgba(150,165,190,.8)"; ctx.stroke(); return;
      }
      var eyeRgb = m.dead ? TEAL : rgb;
      if (f.joy > 0.55 && !m.dead) { ctx.beginPath(); ctx.arc(cx, cy + h * 0.2, w * 0.7, Math.PI * 1.08, Math.PI * 1.92); ctx.lineWidth = R * 0.085; ctx.lineCap = "round"; ctx.strokeStyle = "rgb(" + eyeRgb + ")"; ctx.stroke(); dot(ctx, cx, cy, R * 0.18, eyeRgb, 0.6); return; }
      var open = (self.blink > 0 ? 0.1 : 1) * (1 - f.lid * 0.72), hh = Math.max(R * 0.04, h * open);
      rr(ctx, cx - w / 2, cy - hh / 2, w, hh, w / 2); ctx.fillStyle = "rgb(" + eyeRgb + ")"; ctx.fill(); dot(ctx, cx, cy, R * 0.22, eyeRgb, 0.75);
      if (f.anger > 0.08) { ctx.beginPath(); ctx.moveTo(cx - s * w * 1.1, cy - h * 0.75); ctx.lineTo(cx + s * w * 0.9, cy - h * 0.75); ctx.lineTo(cx + s * w * 0.9, cy - h * (0.75 - f.anger * 1.0)); ctx.closePath(); ctx.fillStyle = "#060a14"; ctx.fill(); }   // angled brow
    });
    // mouth: a small light bar that curves with mood
    if (!m.dead) { var curve = (f.joy - f.anger) * R * 0.1; ctx.beginPath(); ctx.moveTo(ex * 0.6 - R * 0.11, -R * 1.29 + ey * 0.5); ctx.quadraticCurveTo(ex * 0.6, -R * 1.29 + ey * 0.5 + curve * 2, ex * 0.6 + R * 0.11, -R * 1.29 + ey * 0.5); ctx.lineWidth = R * 0.035; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(" + rgb + ",.85)"; ctx.stroke(); }
    ctx.restore();
    // shoulder caps
    [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(s * R * 0.78, -R * 0.46, R * 0.29, 0, 6.2832); ctx.fillStyle = shell(ctx, s * R * 0.78 - R * 0.3, -R * 0.8, s * R * 0.78 + R * 0.3, -R * 0.15); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#050a14"; ctx.stroke(); ctx.beginPath(); ctx.arc(s * R * 0.78, -R * 0.46, R * 0.12, 0, 6.2832); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(" + rgb + ",.8)"; ctx.stroke(); });
    ctx.restore();

    this.arms.forEach(function (a) {
      var sh = self.shoulder(a.side), ang = Math.atan2(a.dy, a.dx), spd = 0.22 + a.grip * 0.5, fl = R * 0.38;
      link(ctx, sh.x, sh.y, a.ex, a.ey, R * 0.3); link(ctx, a.ex, a.ey, a.x, a.y, R * 0.25);
      ctx.beginPath(); ctx.arc(a.ex, a.ey, R * 0.2, 0, 6.2832); ctx.fillStyle = "#0a1120"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#2a3956"; ctx.stroke();
      ctx.beginPath(); ctx.arc(a.ex, a.ey, R * 0.1, 0, 6.2832); ctx.lineWidth = Math.max(1.5, R * 0.035); ctx.strokeStyle = "rgb(" + rgb + ")"; ctx.stroke(); dot(ctx, a.ex, a.ey, R * 0.1, rgb, 0.5);
      if (a.tool) drawTool(ctx, a, R, rgb, self.t);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      [-1, 0, 1].forEach(function (fg) {
        var spread = fg * spd * 1.4, len = fg === 0 ? 0.5 : 0.6, kx = a.x + Math.cos(ang + spread) * fl * len, ky = a.y + Math.sin(ang + spread) * fl * len, tx = kx + Math.cos(ang + spread * 0.15) * fl * 0.55, ty = ky + Math.sin(ang + spread * 0.15) * fl * 0.55;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(kx, ky); ctx.lineTo(tx, ty); ctx.lineWidth = R * 0.12; ctx.strokeStyle = "#050a14"; ctx.stroke(); ctx.lineWidth = R * 0.07; ctx.strokeStyle = "#44557a"; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(a.x, a.y, R * 0.16, 0, 6.2832); ctx.fillStyle = "#0a1120"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#44557a"; ctx.stroke();
    });
    this.sparks.forEach(function (s) { dot(ctx, s.x, s.y, 2.2, GOLD, 1 - s.t / 0.7); });
  };

  /* Small pieces of page UI that follow the robot: what it says, what it plans, what it asks. */
  function Chips(root) {
    var ui = root.querySelector("[data-ui]"); if (!ui) { ui = document.createElement("div"); ui.className = "ghero-ui"; ui.setAttribute("data-ui", ""); root.appendChild(ui); }
    ui.innerHTML = ""; this.ui = ui; this.items = [];
  }
  Chips.prototype.add = function (cls, html, ms, anchor) {
    var el = document.createElement("div"); el.className = "chip " + cls; el.innerHTML = html; this.ui.appendChild(el);
    var it = { el: el, left: ms ? ms / 1000 : 1e9, anchor: anchor || null, cls: cls }; this.items.push(it);
    window.requestAnimationFrame(function () { el.classList.add("on"); });
    return it;
  };
  Chips.prototype.only = function (cls, html, ms, anchor) { this.clear(cls); return this.add(cls, html, ms, anchor); };
  Chips.prototype.clear = function (cls) { this.items = this.items.filter(function (it) { if (it.cls !== cls) return true; if (it.el.parentNode) it.el.parentNode.removeChild(it.el); return false; }); };
  Chips.prototype.remove = function (it) { if (!it) return; if (it.el.parentNode) it.el.parentNode.removeChild(it.el); this.items = this.items.filter(function (o) { return o !== it; }); };
  Chips.prototype.step = function (dt, W) {
    var self = this;
    this.items.slice().forEach(function (it) {
      it.left -= dt; if (it.left <= 0) { self.remove(it); return; }
      if (it.anchor) { var p = it.anchor(), w = it.el.offsetWidth || 120; it.el.style.transform = "translate(" + Math.round(clamp(p.x - w / 2, 8, W - w - 8)) + "px," + Math.round(Math.max(78, p.y - it.el.offsetHeight)) + "px)"; }
    });
  };

  SAIL.Bot = Bot; SAIL.Chips = Chips; SAIL.util = { lerp: lerp, clamp: clamp, rr: rr, mixRgb: mixRgb, RED: RED, GOLD: GOLD };
})();
