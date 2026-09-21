/* South Artificial Intelligence Laboratory: the Agents hero.
   One idea: plan, act, check, replan. A workstation under one light. The monitor holds a
   task ("find the shortest safe route"), the agent works through observe, plan, act, check,
   and an arm files each step as queued, checking or complete. Add an obstacle and the plan
   fails in the open: the broken steps turn red, the cards are swept into the discard tray,
   and a new plan comes in. The route is a real breadth-first search. The small screen runs
   real tabular Q-learning on the same map, so both halves of the group are on the desk. */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL) return;
  var COLS = 12, ROWS = 7, START = [0, 3], GOALS = [["A", 11, 1], ["B", 11, 5], ["C", 7, 0], ["D", 6, 6]];
  var WALLS0 = ["3,1", "3,2", "3,3", "6,3", "6,4", "6,5", "8,1", "9,1", "9,4", "2,5"];
  var COOL = "170,215,255", RED = "255,110,100", PAPER = "232,226,212", AMBER = "255,196,120";

  function key(x, y) { return x + "," + y; }
  function route(walls, from, to) {       // shortest path by breadth-first search, four directions
    var prev = {}, q = [from], seen = {}; seen[key(from[0], from[1])] = 1;
    while (q.length) {
      var c = q.shift(); if (c[0] === to[0] && c[1] === to[1]) { var out = [c]; while (prev[key(c[0], c[1])]) { c = prev[key(c[0], c[1])]; out.unshift(c); } return out; }
      [[1, 0], [0, 1], [0, -1], [-1, 0]].forEach(function (d) { var x = c[0] + d[0], y = c[1] + d[1], k = key(x, y); if (x < 0 || y < 0 || x >= COLS || y >= ROWS || walls[k] || seen[k]) return; seen[k] = 1; prev[k] = c; q.push([x, y]); });
    }
    return null;
  }

  SAIL.scenes.agents = function (S, root) {
    var wide = S.W >= 980, bar = root.querySelector(".ghero-bar"), floorY = bar ? bar.offsetTop + 8 : S.H - 120;
    var r = wide ? { x: S.W * 0.47, y: 94, w: S.W * 0.5, h: floorY - 94 } : { x: S.W * 0.04, y: floorY - (Math.min(window.innerHeight * 0.46, 430) - 22), w: S.W * 0.92, h: Math.min(window.innerHeight * 0.46, 430) - 22 };
    var trayH = wide ? 118 : 96, deskY = r.y + r.h - trayH - 8, mon = { x: r.x, y: r.y + 6, w: wide ? r.w * 0.64 : r.w, h: deskY - r.y - 30 };
    var rl = wide ? { x: r.x + r.w * 0.68, y: mon.y + mon.h * 0.16, w: r.w * 0.32, h: mon.h * 0.66 } : null;
    var cell = Math.min((mon.w - 28) / COLS, (mon.h - 66) / ROWS), gx = mon.x + (mon.w - cell * COLS) / 2, gy = mon.y + 36 + (mon.h - 66 - cell * ROWS) / 2;
    var TR = ["QUEUED", "CHECKING", "COMPLETE", "DISCARD"], trW = (r.w * (wide ? 0.8 : 1) - 3 * 10) / 4, trays = TR.map(function (n, i) { return { name: n, x: r.x + i * (trW + 10), y: deskY + 28, w: trW, h: trayH - 34 }; });
    var base = { x: r.x + r.w * (wide ? 0.4 : 0.5), y: deskY + 6 }, L1 = r.w * (wide ? 0.27 : 0.3), L2 = L1 * 0.96;

    var walls = {}, goalI = 1, agent = START.slice(), path = null, done = 0, phase = "observe", pt = 0, auto = true, stepOnce = false, status = "OBSERVING", flash = 0, progress = 0, shownProgress = 0, clock = 0, idle = 0, broken = null, generation = 0;
    WALLS0.forEach(function (k) { walls[k] = 1; });
    var cards = [], jobs = [], arm = { x: base.x - 40, y: base.y - L1 * 0.9, ex: base.x, ey: base.y - L1, grip: 1, hold: null, tx: base.x - 40, ty: base.y - L1 * 0.9, sweep: null };
    var STEPS = ["observe map", "choose route", "test move", "check result"];

    function slot(tray, n) { var t = trays[tray], ch = Math.min(22, (t.h - 8) / 4); return { x: t.x + 6, y: t.y + 5 + n * (ch + 1.5), w: t.w - 12, h: ch }; }
    function count(tray) { return cards.filter(function (c) { return c.tray === tray && !c.gone; }).length; }
    function deal(revised) {
      cards = cards.filter(function (c) { return c.tray === 3; }); if (cards.length > 4) cards.splice(0, cards.length - 4);
      STEPS.forEach(function (s, i) { var text = revised && i === 1 ? "revise plan" : s, p = slot(0, i); cards.push({ text: text, step: i, tray: 0, x: p.x, y: p.y - 30, tx: p.x, ty: p.y, w: p.w, h: p.h, a: 0, cool: !!revised, bad: false }); });
    }
    function send(step, tray) { var c = cards.filter(function (k) { return k.step === step && k.tray < 2 && !k.bad; })[0]; if (c) jobs.push({ c: c, tray: tray }); }
    function goal() { return GOALS[goalI]; }
    function replan() { path = route(walls, agent, [goal()[1], goal()[2]]); done = 0; }
    function begin(revised) { phase = "observe"; pt = 0; status = revised ? "REPLANNING" : "OBSERVING"; deal(revised); jobs = []; arm.hold = null; arm.grip = 1; send(0, 1); generation++; }
    function fail() {
      broken = { cells: path ? path.slice(done) : [], t: 0 }; path = null; phase = "failed"; pt = 0; status = "PLAN FAILED"; flash = 1.8; progress = Math.max(0, progress - 0.35); jobs = [];
      cards.forEach(function (c) { if (c.tray < 2) c.bad = true; }); arm.hold = null; arm.sweep = { t: 0 };
    }
    begin(false);

    /* ---- the small screen: tabular Q-learning on the same map ---- */
    var Q = {}, ep = { n: 0, pos: START.slice(), trail: [START.slice()], steps: 0 }, trails = [], lastLen = 0;
    function qv(s) { if (!Q[s]) Q[s] = [0, 0, 0, 0]; return Q[s]; }
    function resetLearning() { Q = {}; trails = []; ep = { n: 0, pos: START.slice(), trail: [START.slice()], steps: 0 }; lastLen = 0; }
    function learnStep() {
      var D = [[1, 0], [0, 1], [0, -1], [-1, 0]], s = key(ep.pos[0], ep.pos[1]), row = qv(s), eps = Math.max(0.05, 0.9 * Math.pow(0.93, ep.n));
      var a = Math.random() < eps ? (Math.random() * 4) | 0 : row.indexOf(Math.max.apply(null, row)), nx = ep.pos[0] + D[a][0], ny = ep.pos[1] + D[a][1], g = goal(), rew = -1, end = false;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || walls[key(nx, ny)]) { nx = ep.pos[0]; ny = ep.pos[1]; rew = -4; }
      if (nx === g[1] && ny === g[2]) { rew = 40; end = true; }
      var nrow = qv(key(nx, ny)); row[a] += 0.5 * (rew + (end ? 0 : 0.95 * Math.max.apply(null, nrow)) - row[a]);
      ep.pos = [nx, ny]; ep.trail.push([nx, ny]); ep.steps++;
      if (end || ep.steps > 90) { trails.push({ pts: ep.trail, ok: end }); if (trails.length > 9) trails.shift(); lastLen = ep.steps; ep = { n: ep.n + 1, pos: START.slice(), trail: [START.slice()], steps: 0 }; }
    }

    function stepPhase(dt) {
      pt += dt;
      if (phase === "observe" && pt > 1.7) { send(0, 2); send(1, 1); phase = "plan"; pt = 0; status = "PLANNING"; replan(); if (!path) { status = "NO SAFE ROUTE"; phase = "stuck"; } return true; }
      if (phase === "plan" && pt > 1.8) { send(1, 2); send(2, 1); phase = "act"; pt = 0; status = "ACTING"; return true; }
      if (phase === "act") {
        var want = Math.min(path.length - 1, Math.floor(pt / 0.3)), lim = Math.min(path.length - 1, 5);
        while (done < Math.min(want, lim)) { var nxt = path[done + 1]; if (walls[key(nxt[0], nxt[1])]) { fail(); return true; } done++; agent = nxt.slice(); }
        if (pt > 1.9 && done >= Math.min(lim, path.length - 1)) { send(2, 2); send(3, 1); phase = "check"; pt = 0; status = "CHECKING"; return true; }
      }
      if (phase === "check" && pt > 1.7) {
        send(3, 2);
        if (agent[0] === goal()[1] && agent[1] === goal()[2]) { phase = "done"; pt = 0; status = "COMPLETE"; progress = 1; return true; }
        var total = route(walls, START, [goal()[1], goal()[2]]); progress = total ? 1 - (path.length - 1 - done) / Math.max(1, total.length - 1) : progress;
        path = path.slice(done); done = 0; begin(false); return true;
      }
      if (phase === "failed" && pt > 2.4) { broken = null; begin(true); return true; }
      if (phase === "done" && auto && pt > 4) { goalI = (goalI + 1) % GOALS.length; agent = START.slice(); progress = 0; resetLearning(); begin(false); return true; }
      return false;
    }

    function stepArm(dt) {
      var t = null;
      if (arm.sweep) {          // push the failed cards along the desk into the discard tray
        arm.sweep.t += dt; var k = Math.min(1, arm.sweep.t / 1.5), x0 = trays[0].x - 6, x1 = trays[3].x + trays[3].w * 0.4, hx = x0 + (x1 - x0) * k * k * (3 - 2 * k), hy = trays[0].y + trays[0].h * 0.45;
        t = { x: hx, y: hy }; var n = 0;
        cards.forEach(function (c) { if (!c.bad || c.tray === 3) return; if (c.x < hx) { c.tx = c.x = hx; c.ty = c.y = hy - 10 + n * 5; } n++; if (k >= 1) { c.tray = 3; var p = slot(3, Math.min(3, count(3) - 1)); c.tx = p.x; c.ty = p.y; } });
        if (k >= 1) arm.sweep = null;
      } else if (arm.hold) {
        var j = arm.hold; t = { x: j.to.x + j.to.w / 2, y: j.to.y + j.to.h / 2 }; j.c.x = arm.x - j.c.w / 2; j.c.y = arm.y - j.c.h / 2; j.c.tx = j.c.x; j.c.ty = j.c.y;
        if (Math.hypot(arm.x - t.x, arm.y - t.y) < 3) { j.c.tray = j.tray; j.c.tx = j.to.x; j.c.ty = j.to.y; arm.hold = null; arm.grip = 1; }
      } else if (jobs.length) {
        var job = jobs[0]; t = { x: job.c.x + job.c.w / 2, y: job.c.y + job.c.h / 2 };
        job.age = (job.age || 0) + dt;
        if (job.c.bad) jobs.shift(); else if (Math.hypot(arm.x - t.x, arm.y - t.y) < 3 || job.age > 2.5) { jobs.shift(); job.to = slot(job.tray, count(job.tray)); arm.hold = job; arm.grip = 0; }
      } else t = { x: base.x - L1 * 0.5, y: base.y - L1 * 0.95 };
      arm.tx = t.x; arm.ty = t.y; var sp = Math.min(1, dt * 7.5); arm.x += (arm.tx - arm.x) * sp; arm.y += (arm.ty - arm.y) * sp;
      var dx = arm.x - base.x, dy = arm.y - base.y, d = Math.hypot(dx, dy) || 1, max = L1 + L2 - 2; if (d > max) { arm.x = base.x + dx / d * max; arm.y = base.y + dy / d * max; dx = arm.x - base.x; dy = arm.y - base.y; d = max; }
      var b = Math.atan2(dy, dx), cs = Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))), bend = Math.acos(cs), e1 = [base.x + Math.cos(b + bend) * L1, base.y + Math.sin(b + bend) * L1], e2 = [base.x + Math.cos(b - bend) * L1, base.y + Math.sin(b - bend) * L1], e = e1[1] < e2[1] ? e1 : e2;
      arm.ex += (e[0] - arm.ex) * Math.min(1, dt * 12); arm.ey += (e[1] - arm.ey) * Math.min(1, dt * 12);
      cards.forEach(function (c) { c.x += (c.tx - c.x) * Math.min(1, dt * 9); c.y += (c.ty - c.y) * Math.min(1, dt * 9); c.a = Math.min(1, c.a + dt * 3); });
    }

    function P(c) { return [gx + (c[0] + 0.5) * cell, gy + (c[1] + 0.5) * cell]; }
    function screen(ctx, m, title, right, rightRgb) {
      ctx.fillStyle = "#03070f"; ctx.fillRect(m.x, m.y, m.w, m.h);
      var g = ctx.createLinearGradient(0, m.y, 0, m.y + m.h); g.addColorStop(0, "rgba(" + COOL + ",.07)"); g.addColorStop(1, "rgba(" + COOL + ",.015)"); ctx.fillStyle = g; ctx.fillRect(m.x, m.y, m.w, m.h);
      ctx.lineWidth = 2; ctx.strokeStyle = "#2a3850"; ctx.strokeRect(m.x - 1, m.y - 1, m.w + 2, m.h + 2); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + COOL + ",.22)"; ctx.strokeRect(m.x + 0.5, m.y + 0.5, m.w - 1, m.h - 1);
      ctx.fillStyle = "#1a2436"; ctx.fillRect(m.x + m.w / 2 - 5, m.y + m.h + 1, 10, deskY - m.y - m.h + 2); ctx.fillRect(m.x + m.w / 2 - 34, deskY + 1, 68, 4);
      ctx.font = "600 " + (wide ? 11 : 10) + "px ui-monospace, Consolas, monospace"; ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.fillStyle = "rgba(" + COOL + ",.9)"; ctx.fillText(title, m.x + 12, m.y + 18);
      if (right) { ctx.textAlign = "right"; ctx.fillStyle = "rgb(" + rightRgb + ")"; ctx.fillText(right, m.x + m.w - 12, m.y + 18); }
      ctx.fillStyle = "rgba(" + COOL + ",.14)"; ctx.fillRect(m.x + 10, m.y + 30, m.w - 20, 1);
    }

    return {
      step: function (dt) {
        clock += dt; flash = Math.max(0, flash - dt); shownProgress += (progress - shownProgress) * Math.min(1, dt * 3);
        if (auto || stepOnce || phase === "failed") { if (stepPhase(dt) && stepOnce && phase !== "failed") stepOnce = false; }
        if (broken) broken.t += dt;
        stepArm(dt);
        if (rl) for (var i = 0; i < 5; i++) learnStep();
      },
      settle: function () { replan(); phase = "plan"; pt = 2; status = "PLANNING"; for (var i = 0; i < 4000; i++) learnStep(); cards.forEach(function (c) { c.a = 1; c.x = c.tx; c.y = c.ty; }); },
      act: function (name) {
        if (name === "target") { goalI = (goalI + 1) % GOALS.length; progress = 0; resetLearning(); if (phase === "done" || phase === "stuck") { agent = START.slice(); } broken = null; begin(true); auto = true; }
        else if (name === "obstacle") {
          var live = path && phase !== "done" ? path.slice(done + 1, -1) : (route(walls, agent, [goal()[1], goal()[2]]) || []).slice(1, -1), pick = null;
          for (var i = Math.min(2, live.length - 1); i < live.length && !pick; i++) { var c = live[i], k = key(c[0], c[1]); walls[k] = 1; if (route(walls, agent, [goal()[1], goal()[2]])) pick = c; else delete walls[k]; }
          if (pick) { resetLearning(); if (path && (phase === "plan" || phase === "act" || phase === "check")) fail(); else if (phase === "done") { status = "ROUTE BLOCKED"; } auto = true; }
        }
        else if (name === "step") { auto = false; stepOnce = true; }
        else if (name === "run") { auto = true; }
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        // one light over the desk
        var lx = r.x + r.w * 0.45, cone = ctx.createRadialGradient(lx, r.y - 60, 10, lx, deskY, r.w * 0.75); cone.addColorStop(0, "rgba(" + AMBER + ",.16)"); cone.addColorStop(0.5, "rgba(" + AMBER + ",.05)"); cone.addColorStop(1, "rgba(" + AMBER + ",0)");
        ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(lx - 30, r.y - 70); ctx.lineTo(lx + 30, r.y - 70); ctx.lineTo(r.x + r.w + 60, floorY + 10); ctx.lineTo(r.x - 60, floorY + 10); ctx.closePath(); ctx.fill();
        // desk
        var dg = ctx.createLinearGradient(0, deskY, 0, floorY + 10); dg.addColorStop(0, "#1b2230"); dg.addColorStop(0.08, "#121823"); dg.addColorStop(1, "#070b12"); ctx.fillStyle = dg; ctx.fillRect(r.x - 40, deskY, r.w + 80, floorY + 10 - deskY);
        ctx.fillStyle = "rgba(" + AMBER + ",.35)"; ctx.fillRect(r.x - 40, deskY, r.w + 80, 1);

        // main monitor: the task, the map, the plan
        var g = goal(); screen(ctx, mon, "TASK  find the shortest safe route to " + g[0], status, status === "PLAN FAILED" || status === "NO SAFE ROUTE" || status === "ROUTE BLOCKED" ? RED : status === "COMPLETE" ? "140,230,170" : COOL);
        if (flash > 0 && Math.sin(flash * 14) > 0) { ctx.fillStyle = "rgba(" + RED + ",.10)"; ctx.fillRect(mon.x, mon.y, mon.w, mon.h); }
        for (var x = 0; x < COLS; x++) for (var y = 0; y < ROWS; y++) { var w = walls[key(x, y)]; ctx.fillStyle = w ? "rgba(" + COOL + ",.30)" : "rgba(" + COOL + ",.045)"; ctx.fillRect(gx + x * cell + 1, gy + y * cell + 1, cell - 2, cell - 2); }
        if (phase === "observe") { var sx = gx + (pt / 1.7) * cell * COLS; var sg = ctx.createLinearGradient(sx - 50, 0, sx, 0); sg.addColorStop(0, "rgba(" + COOL + ",0)"); sg.addColorStop(1, "rgba(" + COOL + ",.22)"); ctx.fillStyle = sg; ctx.fillRect(Math.max(gx, sx - 50), gy, Math.min(50, sx - gx), cell * ROWS); }
        GOALS.forEach(function (o, i) { var p = P([o[1], o[2]]), on = i === goalI; ctx.font = (on ? "700 " : "500 ") + Math.round(cell * 0.42) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = on ? "rgb(" + AMBER + ")" : "rgba(" + COOL + ",.4)"; ctx.fillText(o[0], p[0], p[1] + 1); if (on) { ctx.lineWidth = 1.5; ctx.strokeStyle = "rgb(" + AMBER + ")"; ctx.strokeRect(p[0] - cell * 0.38, p[1] - cell * 0.38, cell * 0.76, cell * 0.76); } });
        if (path && path.length > 1) {
          var upto = phase === "plan" ? Math.max(1, Math.ceil(Math.min(1, pt / 1.2) * (path.length - 1))) : path.length - 1;
          ctx.beginPath(); var p0 = P(path[done]); ctx.moveTo(p0[0], p0[1]); for (var i = done + 1; i <= upto; i++) { var q = P(path[i]); ctx.lineTo(q[0], q[1]); } ctx.lineJoin = "round"; SAIL.glow(ctx, COOL, 2, 0.95);
        }
        if (broken) broken.cells.forEach(function (c, i) { if (i === 0) return; var a = P(broken.cells[i - 1]), b = P(c), jx = Math.sin(i * 12.9) * Math.min(7, broken.t * 9), jy = Math.cos(i * 7.3) * Math.min(7, broken.t * 9) + broken.t * broken.t * 6; ctx.beginPath(); ctx.moveTo(a[0] + jx, a[1] + jy); ctx.lineTo(b[0] + jx, b[1] + jy); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(" + RED + "," + Math.max(0, 1 - broken.t / 2.2).toFixed(2) + ")"; ctx.stroke(); });
        var ap = P(agent); ctx.fillStyle = "#fff"; ctx.fillRect(ap[0] - cell * 0.2, ap[1] - cell * 0.2, cell * 0.4, cell * 0.4); SAIL.dot(ctx, ap[0], ap[1], cell * 0.16, COOL, 0.8);
        var pbx = mon.x + 12, pby = mon.y + mon.h - 16, pbw = mon.w - 24; ctx.fillStyle = "rgba(" + COOL + ",.12)"; ctx.fillRect(pbx, pby, pbw, 4); ctx.fillStyle = flash > 0 ? "rgb(" + RED + ")" : "rgb(" + COOL + ")"; ctx.fillRect(pbx, pby, pbw * shownProgress, 4);

        // second screen: learning the same map by trial and error
        if (rl) {
          screen(ctx, rl, "TRIAL AND ERROR", "episode " + ep.n, COOL); var c2 = Math.min((rl.w - 20) / COLS, (rl.h - 60) / ROWS), ox = rl.x + (rl.w - c2 * COLS) / 2, oy = rl.y + 38;
          for (var xx = 0; xx < COLS; xx++) for (var yy = 0; yy < ROWS; yy++) { ctx.fillStyle = walls[key(xx, yy)] ? "rgba(" + COOL + ",.30)" : "rgba(" + COOL + ",.04)"; ctx.fillRect(ox + xx * c2 + 0.5, oy + yy * c2 + 0.5, c2 - 1, c2 - 1); }
          trails.concat([{ pts: ep.trail, live: true }]).forEach(function (t, i, all) { var age = all.length - 1 - i, a = t.live ? 0.9 : Math.max(0.05, 0.4 - age * 0.045); ctx.beginPath(); t.pts.forEach(function (p, k) { var px = ox + (p[0] + 0.5) * c2, py = oy + (p[1] + 0.5) * c2; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); ctx.lineWidth = t.live ? 1.4 : 1; ctx.strokeStyle = "rgba(" + (t.live ? AMBER : COOL) + "," + a + ")"; ctx.stroke(); });
          ctx.fillStyle = "rgb(" + AMBER + ")"; ctx.fillRect(ox + (g[1] + 0.2) * c2, oy + (g[2] + 0.2) * c2, c2 * 0.6, c2 * 0.6);
          ctx.font = "500 10px ui-monospace, Consolas, monospace"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "rgba(" + COOL + ",.75)"; ctx.fillText(lastLen ? "last attempt: " + lastLen + " moves" : "exploring", rl.x + 12, rl.y + rl.h - 12);
        }

        // keyboard and a sheet of paper, for scale
        if (wide) { var kx = mon.x + mon.w * 0.5 - 70, ky = deskY + 8; ctx.fillStyle = "#0b111c"; ctx.fillRect(kx, ky, 140, 14); ctx.fillStyle = "rgba(" + COOL + ",.16)"; for (var kk = 0; kk < 17; kk++) ctx.fillRect(kx + 4 + kk * 8, ky + 3, 6, 3), ctx.fillRect(kx + 4 + kk * 8, ky + 8, 6, 3); }

        // trays and task cards
        ctx.textBaseline = "middle";
        trays.forEach(function (t, i) { ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(t.x, t.y, t.w, t.h); ctx.lineWidth = 1; ctx.strokeStyle = i === 3 ? "rgba(" + RED + ",.45)" : "rgba(" + PAPER + ",.3)"; ctx.strokeRect(t.x + 0.5, t.y + 0.5, t.w - 1, t.h - 1); ctx.font = "600 " + (wide ? 10 : 9) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = i === 3 ? "rgba(" + RED + ",.85)" : "rgba(" + PAPER + ",.7)"; if ("letterSpacing" in ctx) ctx.letterSpacing = "1.2px"; ctx.fillText(t.name, t.x + 1, t.y - 9); if ("letterSpacing" in ctx) ctx.letterSpacing = "0px"; });
        cards.forEach(function (c) {
          ctx.globalAlpha = c.a * (c.tray === 3 ? 0.55 : 1); ctx.fillStyle = c.bad ? "rgb(88,32,34)" : c.cool ? "rgb(214,232,250)" : "rgb(" + PAPER + ")"; ctx.fillRect(c.x, c.y, c.w, c.h);
          ctx.fillStyle = c.bad ? "rgb(" + RED + ")" : c.tray === 2 ? "rgb(70,150,110)" : c.tray === 1 ? "rgb(200,140,50)" : "rgb(120,130,150)"; ctx.fillRect(c.x, c.y, 3, c.h);
          ctx.font = "600 " + Math.min(11, c.h * 0.55) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = c.bad ? "rgb(255,190,180)" : "#1a2230"; ctx.fillText(c.text, c.x + 9, c.y + c.h / 2 + 0.5); ctx.globalAlpha = 1;
        });

        // the arm
        ctx.lineCap = "round"; ctx.fillStyle = "#0c121d"; ctx.fillRect(base.x - 26, base.y - 4, 52, 14); ctx.strokeStyle = "#2a3850"; ctx.lineWidth = 1; ctx.strokeRect(base.x - 25.5, base.y - 3.5, 51, 13);
        [[base.x, base.y, arm.ex, arm.ey, wide ? 17 : 12], [arm.ex, arm.ey, arm.x, arm.y - 12, wide ? 13 : 9]].forEach(function (s) { ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); ctx.lineWidth = s[4] + 3; ctx.strokeStyle = "#05080e"; ctx.stroke(); ctx.lineWidth = s[4]; ctx.strokeStyle = "#39455a"; ctx.stroke(); ctx.lineWidth = s[4] * 0.3; ctx.strokeStyle = "rgba(" + AMBER + ",.45)"; ctx.stroke(); });
        [[base.x, base.y, wide ? 12 : 9], [arm.ex, arm.ey, wide ? 9.5 : 7]].forEach(function (j) { ctx.beginPath(); ctx.arc(j[0], j[1], j[2], 0, 6.2832); ctx.fillStyle = "#0a0f18"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#56647c"; ctx.stroke(); });
        var gap = 5 + arm.grip * 5; ctx.lineWidth = 3; ctx.strokeStyle = "#56647c"; ctx.beginPath(); ctx.moveTo(arm.x - gap - 3, arm.y - 12); ctx.lineTo(arm.x + gap + 3, arm.y - 12); ctx.moveTo(arm.x - gap, arm.y - 12); ctx.lineTo(arm.x - gap, arm.y + 1); ctx.moveTo(arm.x + gap, arm.y - 12); ctx.lineTo(arm.x + gap, arm.y + 1); ctx.stroke();
      }
    };
  };
})();
