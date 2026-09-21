/* South Artificial Intelligence Laboratory: the Agents hero.
   The robot keeps the page title in order, and it adapts to the visitor:
   - moods (curiosity, trust, frustration, confidence, energy) that show only in how it looks and moves
   - it predicts where the pointer is going and which letter will be clicked next (a transition table)
   - a real, small reinforcement learner: six situations, eight actions, reward from the visitor's yes or no
   - it can be wrong (spelling fixes, guarded letters), asks, and updates
   - what it learns is kept in this browser only (memory.js) and shown on the Ethics page */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL || !SAIL.Bot) return;
  var U = SAIL.util, clamp = U.clamp, dot = SAIL.dot, glow = SAIL.glow, TEAL = SAIL.TEAL, WARM = SAIL.WARM, INK = SAIL.INK;
  var STATES = ["idle", "friendly", "curious", "chased", "attacked", "returning"];
  var STATE_TEXT = { idle: "leave it alone", friendly: "move around calmly", curious: "read the page", chased: "chase it", attacked: "keep clicking the title", returning: "come back later" };
  var ACTIONS = ["wave", "approach", "dodge", "inspect", "hide", "prank", "defend", "help"];
  SAIL.RL = { STATES: STATES, STATE_TEXT: STATE_TEXT, ACTIONS: ACTIONS };

  var keyBuf = "";
  document.addEventListener("keydown", function (ev) {
    if (ev.target && /input|textarea/i.test(ev.target.tagName)) return;
    keyBuf = (keyBuf + (ev.key || "")).slice(-5).toLowerCase();
    if (keyBuf === "debug" && SAIL.onDebug) SAIL.onDebug();
  });

  SAIL.scenes.agents = function (S, root) {
    var M = window.SAILMemory, mem = M.data();
    var h1 = root.querySelector("h1"), bar = root.querySelector(".ghero-bar"), cta = root.querySelector(".ghero-in .btn"), desc = root.querySelector(".ghero-in .desc");
    var wide = S.W >= 860, R = Math.max(34, Math.min(60, Math.min(S.W, S.H) * (wide ? 0.068 : 0.085))), G = 1900;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- the title, one span per letter ---- */
    if (h1 && !h1.getAttribute("data-split")) {
      var words = h1.textContent.trim().split(/\s+/);
      h1.setAttribute("aria-label", words.join(" ")); h1.setAttribute("data-split", "1"); h1.textContent = "";
      words.forEach(function (word, wi) {
        if (wi) h1.appendChild(document.createTextNode(" "));
        var w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true"); w.setAttribute("data-word", word);
        word.split("").forEach(function (ch) { var l = document.createElement("span"); l.className = "l"; l.textContent = ch; l.setAttribute("data-ch", ch); w.appendChild(l); });
        h1.appendChild(w);
      });
    }
    var letters = [].map.call(h1 ? h1.querySelectorAll(".l") : [], function (el, i) {
      el.style.transform = ""; el.textContent = el.getAttribute("data-ch");
      return { el: el, idx: i, ch: el.getAttribute("data-ch"), word: el.parentNode.getAttribute("data-word"), hx: 0, hy: 0, w: 0, h: 0, x: 0, y: 0, rot: 0, vx: 0, vy: 0, vr: 0, state: "home", wait: 0 };
    });
    var floorY = S.H - 120;
    function rel(el) { var a = el.getBoundingClientRect(), b = root.getBoundingClientRect(); return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2, w: a.width, h: a.height }; }
    function measure() {
      letters.forEach(function (l) {
        var x = 0, y = 0, n = l.el;
        while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
        l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; l.hx = x + l.w / 2; l.hy = y + l.h / 2;
        if (l.state === "home") { l.x = l.hx; l.y = l.hy; }
      });
      if (bar) floorY = bar.offsetTop + 20;
    }
    measure();

    var bot = new SAIL.Bot(R, S.W + R * 4, S.H * 0.3), chips = new SAIL.Chips(root);
    var mood = { cur: 0.3, trust: clamp(mem.trust, 0, 1), frus: clamp((mem.frus || 0) * 0.6, 0, 1), conf: 0.6 };
    var clock = 0, sinceMeasure = 0, started = false, rings = [], motes = [];
    var task = null, cooldown = 6, idleT = 0, still = 0, hoverText = 0, chaseT = 0, sinceClick = 99, sinceSave = 0;
    var heat = 0, attacks = 0, lastLetter = -1, guardWanted = null, guarded = null, shieldAll = false, revengeDue = false, stealDue = false, stolenOnce = false;
    var pranked = null, prankT = 0, typoT = 0, dead = null, magnet = null, juggle = 0, ghost = null, askChip = null, planChip = null, debugOn = false, debugEl = null, panelEl = null;
    var cur = { x: S.W / 2, y: S.H / 2, vx: 0, vy: 0, px: S.W / 2, py: S.H / 2, distPrev: 0, awayT: 9 };
    var greeted = false, robotClicks = [];
    for (var m = 0; m < (wide ? 46 : 24); m++) motes.push({ x: Math.random() * S.W, y: Math.random() * S.H, z: 0.3 + Math.random() * 0.7, ph: Math.random() * 6.28 });

    function anchor() { return { x: bot.x, y: bot.y - R * 2.9 }; }
    function say(text, ms) { chips.only("say", text, ms || 2200, anchor); }
    function plan(text, ms) { planChip = chips.only("plan", text, ms || 3200, function () { return { x: bot.x, y: bot.y - R * 3.5 }; }); }
    function note(text) { chips.only("note", text, 1700, function () { return { x: bot.x, y: bot.y + R * 2.3 }; }); }
    function homeBase() {
      var b = { x: S.W * (wide ? 0.74 : 0.5), y: wide ? S.H * 0.42 : Math.min(floorY - R * 3.2, S.H * 0.66) };
      if (S.inside && mood.trust > 0.55) { var k = (mood.trust - 0.55) * 0.9; b.x += (cur.x - b.x) * k; b.y += (cur.y - R * 2 - b.y) * k * 0.6; }
      return b;
    }
    function inBounds(p) { return { x: clamp(p.x, R * 1.4, S.W - R * 1.4), y: clamp(p.y, R * 3.2 + 60, floorY - R * 1.4) }; }

    /* ---- letters ---- */
    function knock(l, delay) {
      if (l.state !== "home") return;
      var lx = wide ? S.W * (0.3 + Math.random() * 0.62) : S.W * (0.1 + Math.random() * 0.8), fall = Math.sqrt(2 * Math.max(40, floorY - l.hy) / G);
      l.state = "falling"; l.wait = delay || 0; l.vx = (lx - l.hx) / fall * 0.8; l.vy = -160 - Math.random() * 180; l.vr = (Math.random() - 0.5) * 9;
    }
    function knockSome(n) { var home = letters.filter(function (l) { return l.state === "home"; }); for (var i = 0; i < n && home.length; i++) knock(home.splice((Math.random() * home.length) | 0, 1)[0], i * 0.11); }
    function stepLetters(dt) {
      letters.forEach(function (l) {
        if (l.state !== "falling") return;
        if (l.wait > 0) { l.wait -= dt; return; }
        l.vy += G * dt; l.x += l.vx * dt; l.y += l.vy * dt; l.rot += l.vr * dt;
        if (l.x < l.w) { l.x = l.w; l.vx = Math.abs(l.vx) * 0.5; } else if (l.x > S.W - l.w) { l.x = S.W - l.w; l.vx = -Math.abs(l.vx) * 0.5; }
        var rest = floorY - l.h * 0.3;
        if (l.y > rest) { l.y = rest; if (l.vy < 190) { l.state = "rest"; l.vx = l.vy = l.vr = 0; l.rot = clamp(((l.rot + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI, -0.6, 0.6); } else { l.vy *= -0.36; l.vx *= 0.62; l.vr *= 0.5; } }
      });
    }
    function sync() {
      letters.forEach(function (l) {
        var t = l.state === "home" ? "" : "translate(" + (l.x - l.hx).toFixed(1) + "px," + (l.y - l.hy).toFixed(1) + "px) rotate(" + l.rot.toFixed(3) + "rad)";
        if (l.t !== t) { l.el.style.transform = t; l.t = t; }
      });
    }
    function wrongPairs(word) {       // adjacent letters that are each showing the other's character
      var out = [];
      for (var i = 0; i + 1 < letters.length; i++) { var a = letters[i], b = letters[i + 1]; if (a.el.parentNode !== b.el.parentNode || (word && a.word !== word)) continue; if (a.el.textContent !== a.ch && a.el.textContent === b.ch && b.el.textContent === a.ch) out.push([a, b]); }
      return out;
    }
    function swap(a, b) { var t = a.el.textContent; a.el.textContent = b.el.textContent; b.el.textContent = t; [a, b].forEach(function (l) { l.el.classList.remove("hop"); void l.el.offsetWidth; l.el.classList.add("hop"); }); rings.push({ x: (a.hx + b.hx) / 2, y: a.hy, r: a.h * 0.5, t: 0 }); }
    function swappable(word) { var out = []; for (var i = 0; i + 1 < letters.length; i++) { var a = letters[i], b = letters[i + 1]; if (a.el.parentNode === b.el.parentNode && a.word.length >= 5 && (!word || a.word === word) && a.state === "home" && b.state === "home" && a.el.textContent !== b.el.textContent && a.el.textContent === a.ch && b.el.textContent === b.ch && a.el.previousSibling) out.push([a, b]); } return out; }
    function makeTypo() { var c = swappable(); if (!c.length) return false; var p = c[(Math.random() * c.length) | 0]; swap(p[0], p[1]); typoT = 0; M.log("typo", p[0].word); return true; }
    function shown(word) { return letters.filter(function (l) { return l.word === word; }).map(function (l) { return l.el.textContent; }).join(""); }

    /* ---- learning: Q[state][action], updated only by the visitor's answers ---- */
    function q(s) { if (!mem.q[s]) mem.q[s] = {}; return mem.q[s]; }
    function situation() {
      if (heat > 2 || attacks > 6) return "attacked";
      if (chaseT > 1.2) return "chased";
      if (M.returning && clock < 25) return "returning";
      if (hoverText > 2.5) return "curious";
      if (!S.inside || still > 6) return "idle";
      return "friendly";
    }
    function choose(s) {
      var row = q(s), ws = ACTIONS.map(function (a) { var e = row[a]; return Math.exp(((e ? e.v : 0) + (e ? 0 : 0.35)) / 0.45); }), sum = ws.reduce(function (p, c) { return p + c; }, 0), r = Math.random() * sum;
      for (var i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return { a: ACTIONS[i], p: ws[i] / sum }; }
      return { a: ACTIONS[0], p: ws[0] / sum };
    }
    function reward(s, a, r) {
      var row = q(s); if (!row[a]) row[a] = { v: 0, n: 0 };
      row[a].v += 0.4 * (r - row[a].v); row[a].n++; mem.feedback++; mem.reward += r; M.log("feedback", a + (r > 0 ? " +1" : " -1")); M.save();
      note("reward " + (r > 0 ? "+1" : "-1") + " · policy updated");
      bot.mood.joy = r > 0 ? 1 : 0; bot.mood.lid = r > 0 ? 0 : 0.5; mood.trust = clamp(mood.trust + (r > 0 ? 0.04 : -0.01), 0, 1); mood.conf = clamp(mood.conf + (r > 0 ? 0.06 : -0.08), 0, 1);
      window.setTimeout(function () { bot.mood.joy = 0; bot.mood.lid = 0; }, 1400);
      if (mem.feedback === 5) window.setTimeout(function () { chips.only("ask", 'You have been training it. <button type="button" data-learned>See what it learned</button>', 9000, anchor); }, 1500);
    }
    function ask(text, yes, no, onYes, onNo, onTimeout) {
      chips.clear("ask");
      askChip = chips.add("ask", text + ' <button type="button" data-y aria-label="' + yes + '">' + yes + '</button><button type="button" data-n aria-label="' + no + '">' + no + "</button>", 7000, anchor);
      askChip.onYes = onYes; askChip.onNo = onNo; askChip.onTimeout = onTimeout;
    }
    chips.ui.addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-learned")) { chips.clear("ask"); openPanel(); return; }
      if (b.hasAttribute("data-close")) { closePanel(); return; }
      if (!askChip) return;
      var it = askChip; askChip = null; chips.remove(it);
      if (b.hasAttribute("data-y") && it.onYes) it.onYes(); else if (b.hasAttribute("data-n") && it.onNo) it.onNo();
    });

    function openPanel() {
      closePanel(); panelEl = document.createElement("div"); panelEl.className = "bot-panel";
      var rows = STATES.map(function (s) {
        var row = mem.q[s] || {}, best = null; ACTIONS.forEach(function (a) { if (row[a] && row[a].n && (!best || row[a].v > row[best].v)) best = a; });
        var txt = best && row[best].v > 0 ? best + ' <span class="v">' + (row[best].v >= 0 ? "+" : "") + row[best].v.toFixed(2) + "</span>" : best ? "anything but " + ACTIONS.filter(function (a) { return row[a] && row[a].v < 0; }).join(", ") : '<span class="dim">not sure yet</span>';
        return "<tr><th scope=\"row\">" + STATE_TEXT[s] + "</th><td>" + txt + "</td></tr>";
      }).join("");
      panelEl.innerHTML = '<h2>What it learned from you</h2><table><thead><tr><th scope="col">When you...</th><th scope="col">It now prefers to...</th></tr></thead><tbody>' + rows + "</tbody></table>" +
        '<p>Reward received: <b>' + (mem.reward > 0 ? "+" : "") + mem.reward + "</b> from " + mem.feedback + " answers. Each answer moves one number in this table toward +1 or -1, and the robot picks actions with higher numbers more often. That is all reinforcement learning is here. It is saved in this browser only. The <a href=\"society.html\">Ethics page</a> shows everything it kept.</p>" +
        '<button type="button" data-close>Close</button>';
      chips.ui.appendChild(panelEl);
    }
    function closePanel() { if (panelEl && panelEl.parentNode) panelEl.parentNode.removeChild(panelEl); panelEl = null; }

    /* ---- tasks: each returns where the body should go and what to look at ---- */
    function fetchStep(dt, j) {
      var l = j.l, out = { target: null, focus: l };
      if (j.phase === "approach" || j.phase === "reach" || j.phase === "grasp") {
        if (j.phase !== "grasp" && l.state !== "rest" && l.state !== "falling" && !(j.to && l.state === "home")) { task = null; return out; }
        if (!j.side) j.side = l.x + R * 2.6 < S.W ? 1 : -1;
        var atHome = l.state === "home";
        out.target = atHome ? { x: clamp(l.hx + R * 1.35, R * 1.3, S.W - R * 1.3), y: l.hy + R * 1.5 } : { x: l.x + j.side * R * 1.15, y: l.y - R * 1.75 };
        if (j.catching) out.stiff = 34;
        var near = Math.hypot(bot.x - out.target.x, bot.y - out.target.y) < R * (j.catching ? 1.2 : 0.6) && (j.catching || Math.hypot(bot.vx, bot.vy) < 140);
        if (j.phase === "approach" && near) { j.phase = "reach"; j.t = 0; }
        if (j.phase !== "approach") {
          var a = bot.reach(atHome ? -1 : -j.side, l.x, l.y, j.phase === "reach" ? 1 : 0, null); a.tx = l.x - a.dx * bot.HOLD; a.ty = l.y - a.dy * bot.HOLD;
          if (j.phase === "reach" && Math.hypot(a.x + a.dx * bot.HOLD - l.x, a.y + a.dy * bot.HOLD - l.y) < (l.state === "falling" ? 26 : 5)) { j.phase = "grasp"; j.t = 0; if (l.state === "falling") { l.state = "held"; say("got it."); } }
          if (j.phase === "grasp" && j.t > 0.2) { l.state = "held"; j.phase = "carry"; j.t = 0; j.arm = a.side; }
        }
      } else {
        var dest = j.to || { x: l.hx, y: l.hy }, s = -j.arm;
        out.target = { x: clamp(dest.x + s * R * 1.35, R * 1.3, S.W - R * 1.3), y: j.to ? dest.y - R * 1.75 : dest.y + R * 1.5 }; out.focus = dest;
        var close = Math.hypot(bot.x - out.target.x, bot.y - out.target.y) < R * 1.1, arm = bot.arms[j.arm < 0 ? 0 : 1];
        if (j.phase === "carry") {
          if (close) bot.reach(j.arm, dest.x - arm.dx * bot.HOLD, dest.y - arm.dy * bot.HOLD, 0, null); else { var sh = bot.shoulder(j.arm); bot.reach(j.arm, sh.x + j.arm * R * 0.7, sh.y + R * 1.3, 0, null); }
          l.x = arm.x + arm.dx * bot.HOLD; l.y = arm.y + arm.dy * bot.HOLD; l.rot += (0 - l.rot) * Math.min(1, dt * 5);
          if (close && Math.hypot(l.x - dest.x, l.y - dest.y) < 2.4 && Math.abs(l.rot) < 0.05) {
            if (j.to) { l.state = "stolen"; l.x = dest.x; l.y = dest.y; say("mine now."); task = { type: "hoard", l: l, t: 0 }; return out; }
            l.state = "home"; l.x = l.hx; l.y = l.hy; l.rot = 0; rings.push({ x: l.hx, y: l.hy, r: Math.max(l.w, l.h) * 0.5, t: 0 }); j.phase = "release"; j.t = 0;
          }
        } else { bot.reach(j.arm, arm.x, arm.y, 1, null); if (j.t > 0.25) task = null; }
      }
      return out;
    }
    function toolAt(el, tool, dt, j, dur, done) {       // fly to a page element and work on it with a tool
      var p = rel(el), out = { target: { x: clamp(p.x + R * 1.5, R * 1.3, S.W - R * 1.3), y: Math.min(p.y + R * 1.9, floorY - R * 1.4) }, focus: p };
      if (Math.hypot(bot.x - out.target.x, bot.y - out.target.y) < R * 1.2) { bot.reach(-1, p.x, p.y, 0, tool); j.work = (j.work || 0) + dt; if (j.work > dur) done(); }
      return out;
    }
    var ACT = {
      wave: function (dt, j) { var sh = bot.shoulder(1); bot.reach(1, sh.x + R * (1.1 + Math.sin(j.t * 9) * 0.5), sh.y - R * 1.5, 1, null); bot.mood.joy = 0.8; return { target: homeBase(), focus: S.inside ? cur : null }; },
      approach: function (dt, j) {
        var px = cur.x + cur.vx * 0.45, py = cur.y + cur.vy * 0.45, d = Math.hypot(px - bot.x, py - bot.y) || 1;
        if (!ghost && Math.hypot(cur.vx, cur.vy) > 160 && Math.random() < dt * 0.9) ghost = { x: px, y: py, t: 0 };
        bot.mood.wide = 0.3; return { target: inBounds({ x: px - (px - bot.x) / d * R * 2.7, y: py - (py - bot.y) / d * R * 2.7 }), focus: cur };
      },
      dodge: function (dt, j) { if (!j.to) { var d = Math.hypot(bot.x - cur.x, bot.y - cur.y) || 1; j.to = inBounds({ x: bot.x + (bot.x - cur.x) / d * R * 6, y: bot.y + (bot.y - cur.y) / d * R * 4 }); if (Math.abs(j.to.x - bot.x) < R * 2) j.to.x = bot.x < S.W / 2 ? S.W - R * 2 : R * 2; } bot.mood.wide = 0.7; return { target: j.to, focus: cur, stiff: 32 }; },
      inspect: function (dt, j) { var poi = S.inside ? { x: cur.x, y: cur.y } : desc ? rel(desc) : { x: S.W * 0.3, y: S.H * 0.5 }; if (!j.poi || Math.hypot(j.poi.x - poi.x, j.poi.y - poi.y) > R * 3) j.poi = poi; var t = inBounds({ x: j.poi.x + R * 1.9, y: j.poi.y + R * 0.6 }); if (Math.hypot(bot.x - t.x, bot.y - t.y) < R * 1.5) bot.reach(-1, j.poi.x + R * 0.5, j.poi.y + R * 0.2, 0, "magnifier"); bot.mood.wide = 0.4; mood.cur = clamp(mood.cur + dt * 0.05, 0, 1); return { target: t, focus: j.poi }; },
      hide: function (dt, j) { bot.mood.lid = 0.35; return { target: { x: S.W + R * 0.5, y: S.H * 0.5 }, focus: cur }; },
      prank: function (dt, j) {
        var pairs = swappable(); if (!pairs.length && !j.did) { j.t = 99; return { target: homeBase() }; }
        if (!j.pair) j.pair = pairs[(Math.random() * pairs.length) | 0];
        if (j.did) { bot.mood.joy = 0.7; return { target: homeBase(), focus: { x: bot.x + 300, y: bot.y - 400 } }; }     // looks away, innocent
        var p = { x: (j.pair[0].hx + j.pair[1].hx) / 2, y: j.pair[0].hy }, t = { x: clamp(p.x + R * 1.35, R * 1.3, S.W - R * 1.3), y: p.y + R * 1.5 };
        if (Math.hypot(bot.x - t.x, bot.y - t.y) < R) { bot.reach(-1, p.x, p.y, 0, "pointer"); j.work = (j.work || 0) + dt; if (j.work > 0.5) { swap(j.pair[0], j.pair[1]); typoT = 0; j.did = true; j.t = Math.max(j.t, j.dur - 1.8); M.log("prank", j.pair[0].word); } }
        return { target: t, focus: p };
      },
      defend: function (dt, j) { shieldAll = true; var p = h1 ? rel(h1) : { x: S.W * 0.3, y: S.H * 0.3, w: 300 }; bot.reach(-1, p.x + p.w * 0.3, p.y, 0, "shield"); bot.mood.anger = Math.max(bot.mood.anger, 0.25); return { target: inBounds({ x: p.x + p.w / 2 + R * 1.6, y: p.y + R * 1.2 }), focus: S.inside ? cur : p }; },
      help: function (dt, j) {
        if (wrongPairs().length) { task = { type: "spell", t: 0, phase: "go", fromRL: j }; return { target: homeBase() }; }
        if (!cta) return { target: homeBase() };
        if (!j.said) { j.said = true; say("this is how you join.", 2600); }
        return toolAt(cta, "pointer", dt, j, 99, function () {});
      }
    };
    var DUR = { wave: 2.2, approach: 4, dodge: 1.6, inspect: 4.2, hide: 4.5, prank: 4, defend: 5, help: 3.4 };

    function spellStep(dt, j) {
      var pairs = wrongPairs(); if (!pairs.length && j.phase !== "asked") { task = null; return { target: homeBase() }; }
      if (j.phase === "go") {
        j.truth = pairs[0]; j.word = j.truth[0].word; j.c = clamp(mem.spell[j.word] === undefined ? 0.52 : mem.spell[j.word], 0.3, 0.97);
        var decoys = swappable(j.word).filter(function (p) { return p[0] !== j.truth[0] && p[0] !== j.truth[1] && p[1] !== j.truth[0]; });
        j.pick = decoys.length && Math.random() > j.c ? decoys[(Math.random() * decoys.length) | 0] : j.truth; j.wrong = j.pick !== j.truth;
        plan("fix “" + shown(j.word) + "” → swap " + j.pick[0].el.textContent + "," + j.pick[1].el.textContent + " · " + Math.round(j.c * 100) + "%", 4200); j.phase = "move";
      }
      var pr = j.phase === "redo" ? j.truth : j.pick, p = { x: (pr[0].hx + pr[1].hx) / 2, y: pr[0].hy }, t = { x: clamp(p.x + R * 1.35, R * 1.3, S.W - R * 1.3), y: p.y + R * 1.5 }, focus = p;
      var near = Math.hypot(bot.x - t.x, bot.y - t.y) < R;
      if (j.phase === "move" && near) { j.phase = j.c < 0.75 ? "hesitate" : "tap"; j.work = 0; }
      if (j.phase === "hesitate") { j.work += dt; bot.mood.lid = 0.3; focus = { x: p.x + Math.sin(j.work * 7) * R * 2, y: p.y }; if (j.work > 1) { j.phase = "tap"; j.work = 0; } }
      if (j.phase === "tap" || j.phase === "redo") {
        if (near) { bot.reach(-1, p.x, p.y, 0, "pointer"); j.work += dt; }
        if (j.work > 0.55) {
          if (j.phase === "redo") { swap(j.truth[0], j.truth[1]); bot.mood.wide = 0; bot.mood.joy = 0.6; window.setTimeout(function () { bot.mood.joy = 0; }, 1200); task = null; cooldown = 5; return { target: t, focus: focus }; }
          swap(j.pick[0], j.pick[1]); j.phase = "asked";
          var fix = function () { if (j.wrong) { swap(j.pick[0], j.pick[1]); j.phase = "redo"; j.work = 0; } else task = null; };
          if (j.c < 0.8 || j.wrong) {
            ask("Fixed?", "yes", "no", function () {
              if (j.wrong) { say("ok. if you say so."); mem.spell[j.word] = clamp(j.c - 0.05, 0.3, 1); task = null; } else { mem.spell[j.word] = clamp(j.c + 0.12, 0, 1); mem.reward += 1; mem.feedback++; note("reward +1 · policy updated"); bot.mood.joy = 1; window.setTimeout(function () { bot.mood.joy = 0; }, 1200); task = null; }
              M.save(); cooldown = 5;
            }, function () {
              if (j.wrong) { bot.mood.wide = 1; bot.freeze = 0.5; mem.spell[j.word] = clamp(j.c + 0.28, 0, 1); mem.reward -= 1; mem.feedback++; note("reward -1 · policy updated"); say("oh."); fix(); }
              else { say("it matches the title I remember."); mood.conf = clamp(mood.conf - 0.05, 0, 1); task = null; }
              M.save();
            }, function () { if (j.wrong) { say("wait."); bot.mood.wide = 0.8; mem.spell[j.word] = clamp(j.c + 0.15, 0, 1); fix(); } else task = null; });
          } else task = null;
        }
      }
      return { target: t, focus: focus };
    }

    function stepTask(dt) {
      var j = task; j.t += dt;
      if (j.type === "fetch") return fetchStep(dt, j);
      if (j.type === "spell") return spellStep(dt, j);
      if (j.type === "action") { var out = ACT[j.name](dt, j); if (task === j && j.t > j.dur) { finishAction(j); } return out; }
      if (j.type === "guard") {
        var l = j.l, t = { x: clamp(l.hx + R * 1.5, R * 1.3, S.W - R * 1.3), y: l.hy + R * 1.4 };
        if (Math.hypot(bot.x - t.x, bot.y - t.y) < R * 1.3) { bot.reach(-1, l.hx + R * 0.15, l.hy, 0, "shield"); guarded = l; }
        if (j.t > 6.5 || l.state !== "home") { guarded = null; task = null; }
        return { target: t, focus: S.inside ? cur : l, stiff: 28 };
      }
      if (j.type === "hoard") { var hl = j.l; bot.reach(-1, hl.x, hl.y - R * 0.2, 0, "shield"); bot.mood.anger = 0.5; if (j.t > 9 && mood.frus < 0.55 || j.t > 20) { hl.state = "rest"; task = null; say("fine. take it."); } return { target: { x: hl.x + R * 1.3, y: hl.y - R * 1.7 }, focus: S.inside ? cur : hl }; }
      if (j.type === "recharge") {
        var logo = document.querySelector(".masthead .brand img, .masthead .brand svg"); if (!logo) { bot.energy = 1; task = null; return { target: homeBase() }; }
        var lp = rel(logo), tt = { x: lp.x + R * 1.5, y: Math.max(lp.y + R * 2.4, R * 3) };
        if (Math.hypot(bot.x - tt.x, bot.y - tt.y) < R * 1.2) { bot.reach(-1, lp.x, lp.y, 0, null); bot.energy = clamp(bot.energy + dt * 0.3, 0, 1); bot.mood.lid = 0.55; j.plugged = lp; if (bot.energy >= 1) { bot.mood.lid = 0; task = null; say("better."); } }
        return { target: tt, focus: lp };
      }
      if (j.type === "revenge" || j.type === "repair") {
        var el = document.querySelector(wide ? ".navgroup > button" : ".mast-join"); if (!el) { task = null; return { target: homeBase() }; }
        return toolAt(el, "wrench", dt, j, 1.5, function () {
          if (j.type === "revenge") { el.classList.add("pranked"); pranked = el; prankT = 0; bot.mood.joy = 0.8; say("oops."); M.log("revenge", "navbar"); window.setTimeout(function () { bot.mood.joy = 0; }, 1600); }
          else { el.classList.remove("pranked"); pranked = null; say("fixed. be nice."); }
          task = null; cooldown = 4;
        });
      }
      if (j.type === "battery") {
        var btn = root.querySelector('[data-act="battery"]'), bp = btn ? rel(btn) : { x: S.W / 2, y: floorY };
        var bt = inBounds({ x: bp.x, y: bp.y - R * 2.4 });
        if (!j.got && Math.hypot(bot.x - bt.x, bot.y - bt.y) < R * 1.4) { bot.reach(1, bp.x, bp.y - R * 0.3, 1, null); j.work = (j.work || 0) + dt; if (j.work > 0.5) { j.got = true; j.t = 0; bot.energy = 1; mood.trust = clamp(mood.trust + 0.15, 0, 1); mood.frus = clamp(mood.frus - 0.3, 0, 1); attacks = Math.max(0, attacks - 6); say("thanks."); M.log("gift", "battery"); } }
        if (j.got) { var sh = bot.shoulder(1); bot.reach(1, sh.x + R * 0.9, sh.y - R * 0.6, 0, "battery"); bot.mood.joy = 1; if (j.t > 2) { bot.mood.joy = 0; task = null; } }
        return { target: bt, focus: j.got ? cur : bp };
      }
      task = null; return { target: homeBase() };
    }
    function finishAction(j) {
      shieldAll = false; bot.mood.joy = 0; bot.mood.wide = 0; bot.mood.lid = 0; task = null; cooldown = 7 + Math.random() * 6;
      if (mem.feedback < 6 || Math.random() < 0.5) ask("Good move?", "✓", "×", function () { reward(j.state, j.name, 1); }, function () { reward(j.state, j.name, -1); });
    }

    function pickTask() {
      if (bot.energy < 0.15) { plan("low battery → find power → plug into logo"); return { type: "recharge", t: 0 }; }
      if (revengeDue) { revengeDue = false; plan("they will not stop → get wrench → loosen the navbar"); return { type: "revenge", t: 0 }; }
      if (stealDue) { stealDue = false; var first = letters.filter(function (l) { return l.state === "home"; })[0]; if (first) { plan("protect “" + first.ch + "” → take it somewhere safe"); return { type: "fetch", l: first, phase: "approach", t: 0, side: 0, to: { x: S.W - R * 2.2, y: floorY - first.h * 0.3 } }; } }
      if (guardWanted) { var g = guardWanted; guardWanted = null; if (g.l.state === "home") { plan("protect “" + g.l.ch + "” → get shield → move " + (g.l.hx < bot.x ? "left" : "right") + " · " + Math.round(g.p * 100) + "%"); return { type: "guard", l: g.l, p: g.p, t: 0 }; } }
      var best = null, bd = 1e9; letters.forEach(function (l) { if (l.state === "rest") { var d = Math.hypot(l.x - bot.x, l.y - bot.y); if (d < bd) { bd = d; best = l; } } });
      if (best && !(mood.frus > 0.8 && sinceClick < 4)) return { type: "fetch", l: best, phase: "approach", t: 0, side: 0 };
      if (pranked && ((prankT > 12 && mood.frus < 0.4) || prankT > 28)) return { type: "repair", t: 0 };
      if (wrongPairs().length && typoT > 14) return { type: "spell", t: 0, phase: "go" };
      if (cooldown <= 0 && !askChip && started) { var s = situation(), c = choose(s); return { type: "action", name: c.a, state: s, dur: DUR[c.a], t: 0 }; }
      return null;
    }

    function die() { dead = { t: 0, phase: "down" }; task = null; guarded = null; shieldAll = false; chips.clear("ask"); chips.clear("plan"); askChip = null; bot.mood.dead = true; bot.mood.wink = false; bot.spark(26); bot.vy = -300; mem.deaths++; M.log("collapse", "too many clicks"); }
    function stepDead(dt) {
      dead.t += dt;
      if (dead.phase === "down" && sinceClick > 3) { dead.phase = "peek"; dead.t = 0; bot.mood.wink = true; }
      else if (dead.phase === "peek") { if (sinceClick < 0.3) { dead.phase = "down"; bot.mood.wink = false; } else if (dead.t > 1.4) { dead = null; bot.mood.dead = false; bot.mood.wink = false; bot.vy = -700; heat = 0; mood.frus = 0.6; say("my turn."); magnet = { t: 0, gx: cur.x, gy: cur.y }; root.classList.add("no-cursor"); } }
      return { target: { x: bot.x, y: bot.y }, focus: null };
    }

    function stepMind(dt) {
      // pointer bookkeeping: speed, approach or retreat, how long it has been still, what it is over
      var mvx = (S.mx - cur.px) / Math.max(dt, 0.001), mvy = (S.my - cur.py) / Math.max(dt, 0.001); cur.px = S.mx; cur.py = S.my;
      cur.vx += (mvx - cur.vx) * Math.min(1, dt * 8); cur.vy += (mvy - cur.vy) * Math.min(1, dt * 8); cur.x = S.mx; cur.y = S.my;
      var sp = Math.hypot(cur.vx, cur.vy), dist = Math.hypot(cur.x - bot.x, cur.y - bot.y), closing = (cur.distPrev - dist) / Math.max(dt, 0.001); cur.distPrev = dist;
      still = sp < 12 ? still + dt : 0; idleT = S.inside && sp > 12 ? 0 : idleT + dt;
      hoverText = S.inside && sp < 60 && (wide ? cur.x < S.W * 0.42 : cur.y < S.H * 0.45) ? hoverText + dt : 0;
      chaseT = S.inside && dist < R * 3 && sp > 220 && Math.hypot(bot.vx, bot.vy) > 60 ? chaseT + dt : Math.max(0, chaseT - dt * 0.5);
      if (closing < -80) cur.awayT = 0; else cur.awayT += dt;
      if (S.inside && closing > 420 && cur.awayT < 0.35 && dist < R * 6 && !task && bot.freeze <= 0) { bot.freeze = 0.7; bot.mood.wide = 1; window.setTimeout(function () { bot.mood.wide = 0; }, 800); }   // caught staring
      sinceClick += dt; heat = Math.max(0, heat - dt * 0.9); attacks = Math.max(0, attacks - dt * 0.07);
      mood.frus = clamp(mood.frus - dt * 0.02, 0, 1); mood.cur = clamp(mood.cur - dt * 0.01, 0, 1); prankT += dt; typoT += dt; cooldown -= dt;
      if (!task) { bot.mood.anger = clamp(mood.frus * 1.05 - 0.15, 0, 1); if (bot.energy < 0.3) bot.mood.lid = Math.max(bot.mood.lid, 0.4); }
      if (mood.frus > 0.75 && !stolenOnce && attacks >= 12) { stolenOnce = true; stealDue = true; }
      sinceSave += dt; if (sinceSave > 3) { sinceSave = 0; mem.trust = mood.trust; mem.frus = mood.frus; M.touch(); }
      return { dist: dist, closing: closing };
    }

    function stepRobot(dt) {
      var sense = stepMind(dt), out;
      if (dead) out = stepDead(dt);
      else if (magnet) out = { target: inBounds({ x: bot.x, y: Math.min(bot.y, floorY - R * 3) }), focus: null };   // everything else waits while it gets even
      else {
        if (!task) { task = pickTask(); if (task) { juggle = 0; M.log("task", task.type === "action" ? task.name : task.type); } }
        if (task) out = stepTask(dt);
        else {
          var focus = S.inside ? cur : null;
          if (S.inside && mood.trust < 0.45 && sense.closing > 40 && sense.dist < R * 5) focus = { x: bot.x * 2 - cur.x, y: bot.y - R * 3 };   // pretends not to notice you coming
          if (idleT > 22 && !juggle) juggle = 0.01;
          if (juggle) { juggle += dt; var bx = bot.x + Math.sin(juggle * 3.2) * R * 1.2, by = bot.y - R * 1.0 - Math.abs(Math.cos(juggle * 3.2)) * R * 1.7; if (by > bot.y - R * 1.5) bot.reach(bx < bot.x ? -1 : 1, bx, by + R * 0.3, 1, null); focus = { x: bx, y: by }; if (juggle > 7 || idleT < 1) juggle = 0; }
          out = { target: homeBase(), focus: focus };
        }
      }
      if (magnet) {
        magnet.t += dt; var sh = bot.shoulder(-1); bot.reach(-1, sh.x - R * 1.4, sh.y - R * 0.2, 0, "magnet");
        var hand = bot.arms[0], k = clamp(magnet.t / 1.3, 0, 1); magnet.gx = cur.x + (hand.x - cur.x) * k * k; magnet.gy = cur.y + (hand.y - cur.y) * k * k; out.focus = { x: magnet.gx, y: magnet.gy };
        if (magnet.t > 1.7) { magnet = null; root.classList.remove("no-cursor"); say("even."); }
      }
      bot.step(dt, out.target || homeBase(), out.focus, { stiff: out.stiff || (12 + mood.frus * 14 + mood.conf * 6), floor: floorY, cap: Math.max(S.W, S.H) * 1.1 });
    }

    function greet() {
      greeted = true;
      if (M.seenBefore && M.returning) {
        if (mem.torment > 25) { say("I remember you.", 2800); mood.frus = Math.max(mood.frus, 0.45); task = { type: "action", name: "defend", state: "returning", dur: 6, t: 0 }; }
        else say("oh. you again.", 2600);
        M.log("recognized", "return visit");
      }
    }

    function toggleDebug() {
      debugOn = !debugOn;
      if (!debugOn) { if (debugEl && debugEl.parentNode) debugEl.parentNode.removeChild(debugEl); debugEl = null; return; }
      debugEl = document.createElement("pre"); debugEl.className = "bot-debug"; chips.ui.appendChild(debugEl);
    }
    SAIL.onDebug = toggleDebug;
    function paintDebug() {
      var bar10 = function (v) { var n = Math.round(clamp(v, 0, 1) * 10); return "#".repeat(n) + ".".repeat(10 - n) + " " + v.toFixed(2); }, s = situation(), row = q(s);
      var next = lastLetter >= 0 && mem.trans[lastLetter] ? Object.keys(mem.trans[lastLetter]).map(function (k) { return letters[k] ? letters[k].ch + ":" + mem.trans[lastLetter][k] : ""; }).join(" ") : "none";
      debugEl.textContent = "DEBUG  (type debug again to close)\n" +
        "curiosity   " + bar10(mood.cur) + "\ntrust       " + bar10(mood.trust) + "\nfrustration " + bar10(mood.frus) + "\nconfidence  " + bar10(mood.conf) + "\nenergy      " + bar10(bot.energy) + "\n" +
        "situation   " + s + "\ntask        " + (dead ? "collapsed (" + dead.phase + ")" : task ? (task.name || task.type) + (task.phase ? "/" + task.phase : "") : "none") + "\nheat " + heat.toFixed(1) + "  attacks " + attacks.toFixed(1) + "  next action in " + Math.max(0, cooldown).toFixed(0) + "s\n" +
        "after “" + (lastLetter >= 0 ? letters[lastLetter].ch : "-") + "” you click: " + next + "\n" +
        "Q[" + s + "]  " + ACTIONS.map(function (a) { return a + " " + (row[a] ? row[a].v.toFixed(2) : "0.00"); }).join("  ") + "\n" +
        "memory " + M.bytes() + " bytes, " + mem.feedback + " answers, reward " + mem.reward;
    }

    return {
      step: function (dt, S) {
        clock += dt; sinceMeasure += dt; if (sinceMeasure > 0.5) { sinceMeasure = 0; measure(); if (debugEl) paintDebug(); }
        if (!started && clock > 0.9) { started = true; if (!(M.seenBefore && M.returning && mem.torment > 25)) knockSome(wide ? 4 : 3); }
        stepLetters(dt); if (clock > 1.5) { stepRobot(dt); if (!greeted && clock > 2.6) greet(); }
        if (askChip && askChip.left < 0.1 && askChip.onTimeout) { var f = askChip.onTimeout; askChip.onTimeout = null; f(); }
        if (askChip && chips.items.indexOf(askChip) < 0) askChip = null;
        chips.step(dt, S.W);
        rings.forEach(function (r) { r.t += dt; }); rings = rings.filter(function (r) { return r.t < 0.7; });
        if (ghost) { ghost.t += dt; if (ghost.t > 0.3) ghost = null; }
        var over = S.inside && letters.some(function (l) { return l.state === "home" && Math.abs(S.mx - l.hx) < l.w / 2 + 2 && Math.abs(S.my - l.hy) < l.h / 2; });
        root.style.cursor = over ? "pointer" : "";
      },
      settle: function () { var b = homeBase(); bot.x = b.x; bot.y = b.y; started = true; greeted = true; for (var i = 0; i < 40; i++) bot.step(0.03, b, null, { floor: floorY }); },
      click: function (x, y) {
        sinceClick = 0;
        if (Math.hypot(x - bot.x, y - (bot.y - R * 0.6)) < R * 1.7) {
          var now = Date.now(); robotClicks = robotClicks.filter(function (t) { return now - t < 700; }); robotClicks.push(now); mem.clicks.robot++; M.touch();
          if (robotClicks.length >= 3) { robotClicks = []; toggleDebug(); return; }
          if (dead) return; bot.mood.wide = 1; bot.freeze = 0.25; mood.frus = clamp(mood.frus + 0.03, 0, 1); window.setTimeout(function () { bot.mood.wide = 0; }, 500); return;
        }
        var hit = null, bd = 1e9;
        letters.forEach(function (l) { var hx = l.state === "stolen" ? l.x : l.hx, hy = l.state === "stolen" ? l.y : l.hy, d = Math.hypot(x - hx, y - hy); if ((l.state === "home" || l.state === "stolen") && Math.abs(x - hx) < l.w / 2 + 3 && Math.abs(y - hy) < l.h / 2 && d < bd) { bd = d; hit = l; } });
        if (!hit) { mood.cur = clamp(mood.cur + 0.05, 0, 1); return; }
        if (lastLetter >= 0) { if (!mem.trans[lastLetter]) mem.trans[lastLetter] = {}; mem.trans[lastLetter][hit.idx] = (mem.trans[lastLetter][hit.idx] || 0) + 1; }
        lastLetter = hit.idx; mem.clicks.letters++; mem.torment++; M.touch();
        if (dead) return;
        if (hit === guarded || shieldAll || hit.state === "stolen") {       // the click bounces off the shield
          rings.push({ x: x, y: y, r: R * 0.5, t: 0 }); bot.mood.joy = 0.9; window.setTimeout(function () { bot.mood.joy = 0; }, 900);
          if (hit === guarded && task && task.type === "guard") { say("called it. " + Math.round(task.p * 100) + "%"); mood.conf = clamp(mood.conf + 0.1, 0, 1); }
          return;
        }
        if (task && task.type === "guard" && hit !== task.l) { say("wrong one."); bot.mood.wide = 0.9; mood.conf = clamp(mood.conf - 0.12, 0, 1); guarded = null; task = null; window.setTimeout(function () { bot.mood.wide = 0; }, 900); }
        heat += 1; attacks += 1; mood.frus = clamp(mood.frus + 0.055, 0, 1); mood.trust = clamp(mood.trust - 0.02, 0, 1);
        var n = Math.round(attacks);
        if (heat > 9) { knock(hit, 0); die(); return; }
        if (n === 1) { bot.mood.wide = 1; window.setTimeout(function () { bot.mood.wide = 0; }, 600); say("!", 900); }
        else if (n === 5) say("hey.");
        else if (n === 10) say("stop that.");
        else if (n === 15) say("I can catch those now.");
        else if (n === 20) { say("fine."); revengeDue = !pranked; }
        knock(hit, 0); hit.vy = -320;
        if (n >= 15 && (!task || task.type === "action" || task.type === "guard")) { guarded = null; shieldAll = false; task = { type: "fetch", l: hit, phase: "approach", t: 0, side: 0, catching: true }; }
        // which letter next? learned from this visitor's own click history
        var row = mem.trans[hit.idx], bestK = null, sum = 0; if (row) Object.keys(row).forEach(function (k) { sum += row[k]; if (bestK === null || row[k] > row[bestK]) bestK = k; });
        if (bestK !== null && sum >= 2 && row[bestK] / sum >= 0.5 && letters[bestK] && +bestK !== hit.idx) guardWanted = { l: letters[bestK], p: row[bestK] / sum * clamp(0.6 + sum * 0.06, 0, 0.97) };
        if (guardWanted && task && task.type === "action") { shieldAll = false; task = null; }
      },
      act: function (name) {
        if (name === "knock") knockSome(wide ? 4 : 3);
        else if (name === "typo") { if (!makeTypo()) say("nothing to scramble."); else typoT = 9; }
        else if (name === "battery" && !dead) { chips.clear("ask"); askChip = null; shieldAll = false; guarded = null; task = { type: "battery", t: 0 }; }
        else if (name === "learned") { if (panelEl) closePanel(); else openPanel(); }
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H); sync();
        var fg = ctx.createLinearGradient(0, 0, S.W, 0); fg.addColorStop(0, "rgba(" + INK + ",0)"); fg.addColorStop(0.2, "rgba(" + INK + ",.34)"); fg.addColorStop(0.8, "rgba(" + INK + ",.34)"); fg.addColorStop(1, "rgba(" + INK + ",0)");
        ctx.fillStyle = fg; ctx.fillRect(0, floorY + 2, S.W, 1);
        motes.forEach(function (p) { var y = (p.y - clock * 9 * p.z) % S.H; if (y < 0) y += S.H; dot(ctx, p.x + Math.sin(clock * 0.4 + p.ph) * 14, y, 1.1 * p.z, INK, 0.3 * p.z); });
        if (task && task.type === "fetch" && !task.to) {
          var l = task.l, pad = 5, x0 = l.hx - l.w / 2 - pad, y0 = l.hy - l.h / 2 + l.h * 0.08, x1 = l.hx + l.w / 2 + pad, y1 = l.hy + l.h / 2 - l.h * 0.04, c = 8;
          ctx.beginPath(); ctx.moveTo(x0, y0 + c); ctx.lineTo(x0, y0); ctx.lineTo(x0 + c, y0); ctx.moveTo(x1 - c, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + c); ctx.moveTo(x1, y1 - c); ctx.lineTo(x1, y1); ctx.lineTo(x1 - c, y1); ctx.moveTo(x0 + c, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - c);
          glow(ctx, TEAL, 1.4, 0.7 + Math.sin(clock * 6) * 0.25);
          if (l.state !== "home") { ctx.setLineDash([2, 8]); ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.hx, l.hy); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + TEAL + ",.45)"; ctx.stroke(); ctx.setLineDash([]); }
        }
        if (task && task.type === "recharge" && task.plugged) { var a = bot.arms[0]; for (var i = 0; i < 3; i++) { var k = (clock * 1.5 + i / 3) % 1; dot(ctx, task.plugged.x + (a.ex - task.plugged.x) * k, task.plugged.y + (a.ey - task.plugged.y) * k, 3, TEAL, 0.9 * (1 - k)); } dot(ctx, task.plugged.x, task.plugged.y, R * 0.3, TEAL, 0.5 + Math.sin(clock * 8) * 0.2); }
        rings.forEach(function (r) { var k = r.t / 0.7; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.7 + k * 1.6), 0, 6.2832); glow(ctx, TEAL, 1.6, (1 - k) * 0.9); });
        if (ghost) { ctx.beginPath(); ctx.arc(ghost.x, ghost.y, 9, 0, 6.2832); glow(ctx, WARM, 1.2, 0.8 * (1 - ghost.t / 0.3)); dot(ctx, ghost.x, ghost.y, 2.5, WARM, 0.9); }
        if (juggle) dot(ctx, bot.x + Math.sin(juggle * 3.2) * R * 1.2, bot.y - R * 1.0 - Math.abs(Math.cos(juggle * 3.2)) * R * 1.7, R * 0.13, U.GOLD, 1);
        bot.draw(ctx, floorY, S.H);
        if (magnet) { ctx.save(); ctx.translate(magnet.gx, magnet.gy); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4.5, 13); ctx.lineTo(8, 20); ctx.lineTo(10.5, 19); ctx.lineTo(7.2, 12); ctx.lineTo(12.5, 12); ctx.closePath(); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = "#000"; ctx.stroke(); ctx.restore(); }
      }
    };
  };
})();
