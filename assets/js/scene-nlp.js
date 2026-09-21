/* South Artificial Intelligence Laboratory: the Language hero.
   One sentence, four ways a language model looks at it: tokens, attention, meaning in
   context, and next-word prediction with temperature. The word vectors are a toy:
   ten hand-written dimensions for about sixty words. Real models learn thousands of
   dimensions for every token, but the arithmetic shown here is the same kind: cosine
   similarity, softmax, temperature. The robot reads the sentence too, and gets
   negation wrong for a second, the way keyword matching does. */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL || !SAIL.Bot) return;
  var U = SAIL.util, clamp = U.clamp, dot = SAIL.dot, glow = SAIL.glow, TEAL = SAIL.TEAL, WARM = SAIL.WARM, INK = SAIL.INK, DIM = SAIL.DIM;

  // dimensions: money, water, machine, good, bad, action, mind, place, animal, sport
  var V = {
    bank: [.62, .62, 0, 0, 0, 0, 0, .5, 0, 0], money: [1, 0, 0, .1, 0, 0, 0, 0, 0, 0], loan: [1, 0, 0, 0, .1, 0, 0, 0, 0, 0], account: [.95, 0, .1, 0, 0, 0, 0, 0, 0, 0], deposited: [.85, 0, 0, 0, 0, .4, 0, 0, 0, 0],
    cash: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0], interest: [.8, 0, 0, .1, 0, 0, .3, 0, 0, 0], finance: [1, 0, 0, 0, 0, 0, .1, 0, 0, 0], savings: [.95, 0, 0, .1, 0, 0, 0, 0, 0, 0],
    river: [0, 1, 0, 0, 0, .2, 0, .5, 0, 0], shore: [0, .9, 0, 0, 0, 0, 0, .6, 0, 0], water: [0, 1, 0, 0, 0, .1, 0, 0, 0, 0], fish: [0, .8, 0, 0, 0, 0, 0, 0, .6, 0], boat: [0, .85, .15, 0, 0, .3, 0, 0, 0, 0],
    mud: [0, .7, 0, 0, .2, 0, 0, .3, 0, 0], sat: [0, .05, 0, 0, 0, .5, 0, .5, 0, 0], grass: [0, .5, 0, .1, 0, 0, 0, .6, 0, 0],
    robot: [0, 0, 1, 0, 0, .2, .3, 0, 0, 0], machine: [0, 0, 1, 0, 0, .1, .1, 0, 0, 0], model: [0, 0, .9, 0, 0, 0, .4, 0, 0, 0], code: [0, 0, .95, 0, 0, .2, .1, 0, 0, 0], data: [.1, 0, .9, 0, 0, 0, .1, 0, 0, 0], computer: [0, 0, 1, 0, 0, 0, .1, 0, 0, 0],
    brilliant: [0, 0, 0, 1, 0, 0, .4, 0, 0, 0], great: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0], smart: [0, 0, .1, .9, 0, 0, .5, 0, 0, 0], helpful: [0, 0, 0, .9, 0, .2, .2, 0, 0, 0], good: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0], love: [0, 0, 0, 1, 0, .1, .4, 0, 0, 0], cool: [0, 0, 0, .9, 0, 0, 0, 0, 0, 0],
    annoying: [0, 0, 0, 0, 1, 0, .2, 0, 0, 0], bad: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0], wrong: [0, 0, 0, 0, .9, 0, .4, 0, 0, 0], boring: [0, 0, 0, 0, .9, 0, .1, 0, 0, 0], useless: [0, 0, .1, 0, 1, 0, 0, 0, 0, 0], hate: [0, 0, 0, 0, 1, .1, .4, 0, 0, 0], broken: [0, 0, .3, 0, .9, 0, 0, 0, 0, 0],
    thought: [0, 0, 0, 0, 0, .2, 1, 0, 0, 0], meant: [0, 0, 0, 0, 0, .1, 1, 0, 0, 0], know: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0], mean: [0, 0, 0, 0, .1, 0, .9, 0, 0, 0], understand: [0, 0, .1, .1, 0, 0, 1, 0, 0, 0], something: [0, 0, 0, 0, 0, 0, .4, 0, 0, 0], else: [0, 0, 0, 0, 0, 0, .3, 0, 0, 0], nothing: [0, 0, 0, 0, .3, 0, .4, 0, 0, 0],
    bat: [0, 0, 0, 0, 0, .2, 0, 0, .62, .62], cave: [0, .2, 0, 0, 0, 0, 0, .7, .5, 0], wings: [0, 0, 0, 0, 0, .4, 0, 0, .9, 0], night: [0, 0, 0, 0, .1, 0, 0, .3, .5, 0], flew: [0, 0, 0, 0, 0, .8, 0, 0, .6, 0],
    baseball: [0, 0, 0, 0, 0, .3, 0, 0, 0, 1], swung: [0, 0, 0, 0, 0, .8, 0, 0, 0, .7], ball: [0, 0, 0, 0, 0, .3, 0, 0, 0, .95], hit: [0, 0, 0, 0, .1, .8, 0, 0, 0, .6], player: [0, 0, 0, 0, 0, .3, .2, 0, 0, .9], team: [0, 0, 0, .1, 0, .1, .2, 0, 0, .9]
  };
  var NEG = { not: 1, never: 1, "isn't": 1, isnt: 1, no: 1, hardly: 1 }, AMBIG = ["bank", "bat"];
  var NEXT = { the: ["robot", "bank", "river", "model", "ball"], i: ["thought", "meant", "know", "love", "deposited"], meant: ["something", "nothing", "that", "it", "well"], is: ["brilliant", "annoying", "wrong", "helpful", "broken"], a: ["robot", "loan", "boat", "bat", "model"], my: ["account", "money", "robot", "code", "team"], of: ["the", "money", "water", "data", "course"], not: ["brilliant", "wrong", "helpful", "bad", "good"] };
  var PRESETS = ["The robot thought I meant something else.", "I deposited money at the bank.", "We sat on the bank of the river.", "The robot is definitely not brilliant.", "The bat flew out of the cave at night.", "She swung the bat and hit the ball."];
  var PIECES = ["thing", "some", "any", "every", "ing", "tion", "ness", "ment", "able", "ed", "ly", "er", "est", "un", "re", "de", "s"];
  var WHOLE = { the: 1, robot: 1, i: 1, a: 1, of: 1, at: 1, on: 1, is: 1, not: 1, we: 1, bank: 1, river: 1, money: 1, sat: 1, else: 1, thought: 1, meant: 1, bat: 1, ball: 1, hit: 1, she: 1, and: 1, out: 1, cave: 1, night: 1 };

  function vec(w) { return V[w] || null; }
  function cos(a, b) { var d = 0, p = 0, q = 0; for (var i = 0; i < a.length; i++) { d += a[i] * b[i]; p += a[i] * a[i]; q += b[i] * b[i]; } return p && q ? d / Math.sqrt(p * q) : 0; }
  function norm(w) { return w.toLowerCase().replace(/[^a-z']/g, ""); }
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 50257; return h; }
  function tokenize(w) {
    var s = norm(w); if (!s) return []; if (WHOLE[s] || s.length <= 3) return [s];
    var out = [], guard = 0;
    while (s.length && guard++ < 8) {
      var hitP = null; for (var i = 0; i < PIECES.length; i++) { var p = PIECES[i]; if (s.length > p.length + 1 && s.slice(-p.length) === p) { hitP = p; break; } }
      if (hitP && out.length < 2) { out.unshift(hitP); s = s.slice(0, -hitP.length); } else break;
    }
    if (s.length > 7) { out.unshift(s.slice(4)); s = s.slice(0, 4); }
    out.unshift(s); return out;
  }

  SAIL.scenes.nlp = function (S, root) {
    var M = window.SAILMemory, wide = S.W >= 860, r = SAIL.region(S.W, S.H);
    if (wide) { r = { x: S.W * 0.5, y: 100, w: S.W * 0.47, h: S.H - 100 - 160 }; } else { r = { x: S.W * 0.05, y: S.H * 0.47, w: S.W * 0.9, h: S.H * 0.38 }; }
    var R = wide ? 34 : 26, bot = new SAIL.Bot(R, r.x + r.w + R * 3, r.y + r.h - R), chips = new SAIL.Chips(root);
    var input = root.querySelector('[data-act="sentence"]'), tempEl = root.querySelector('[data-act="temp"]'), tempWrap = root.querySelector("[data-temp]");
    var text = input && input.value ? input.value : PRESETS[0], preset = 0, mode = "meaning", T = tempEl ? tempEl.value / 100 : 0.7;
    var words = [], fontPx = 30, area = null, hover = -1, auto = 0, clock = 0, map = {}, focusWord = null, ctxVec = null, cands = [], sample = null, sampleT = 0, react = null, flash = null, lastTop = "";

    function say(t, ms) { chips.only("say", t, ms || 2000, function () { return { x: bot.x, y: bot.y - R * 2.9 }; }); }
    function setMode(m) { mode = m; [].forEach.call(root.querySelectorAll("[data-act^='mode-']"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-act") === "mode-" + m)); }); if (tempWrap) tempWrap.hidden = m !== "predict"; analyse(); }

    function layoutSentence(ctx) {
      var raw = text.trim().split(/\s+/).filter(Boolean).slice(0, 14); fontPx = wide ? 34 : 24;
      for (var tries = 0; tries < 8; tries++) {
        ctx.font = "700 " + fontPx + "px 'Libre Franklin', sans-serif"; var x = 0, y = 0, sp = fontPx * 0.32, lh = fontPx * (mode === "tokens" ? 2.5 : 1.5); words = [];
        raw.forEach(function (w) { var ww = ctx.measureText(w).width; if (x + ww > r.w && x > 0) { x = 0; y += lh; } words.push({ t: w, n: norm(w), x: r.x + x, y: r.y + fontPx + y, w: ww, pieces: tokenize(w) }); x += ww + sp; });
        if (y <= lh * (mode === "tokens" ? 1 : 1.01) || fontPx <= 17) break; fontPx -= 3;
      }
      var bottom = words.length ? words[words.length - 1].y + (mode === "tokens" ? fontPx * 1.4 : fontPx * 0.5) : r.y + 40;
      area = { x: r.x, y: bottom + 18, w: r.w, h: Math.max(80, r.y + r.h - bottom - 18) };
    }

    function analyse() {
      var content = words.filter(function (w) { return vec(w.n); });
      focusWord = null; words.forEach(function (w) { if (!focusWord && AMBIG.indexOf(w.n) >= 0) focusWord = w; });
      if (!focusWord) focusWord = content[content.length - 1] || null;
      // the word in context: its own vector plus what surrounds it
      ctxVec = null;
      if (focusWord) { var base = vec(focusWord.n).slice(), others = content.filter(function (w) { return w !== focusWord; }); others.forEach(function (w) { var v = vec(w.n); for (var i = 0; i < base.length; i++) base[i] += v[i] * 1.3 / others.length; }); ctxVec = base; }
      var ring = Object.keys(V).sort(function (a, b) { return hash(a) - hash(b); });      // evenly spaced, in an order unrelated to meaning, so similar words do not stack up
      Object.keys(V).forEach(function (k) {
        if (!map[k]) { var a = ring.indexOf(k) / ring.length * 6.2832; map[k] = { a: a, d: 1, td: 1, s: 0 }; }
        var s = ctxVec && (!focusWord || k !== focusWord.n) ? cos(ctxVec, V[k]) : 0; map[k].s = s; map[k].td = 1 - s * 0.82;
      });
      var top = Object.keys(V).filter(function (k) { return !focusWord || k !== focusWord.n; }).sort(function (a, b) { return map[b].s - map[a].s; }).slice(0, 3).join(",");
      if (lastTop && top !== lastTop && mode === "meaning" && focusWord && AMBIG.indexOf(focusWord.n) >= 0) { say("ohhh."); bot.mood.wide = 0.8; window.setTimeout(function () { bot.mood.wide = 0; }, 900); }
      lastTop = top;
      // next word: score every known word against the context so far, then softmax with temperature
      var prefix = words.slice(0, -1), pv = null, pc = prefix.filter(function (w) { return vec(w.n); });
      if (pc.length) { pv = vec(pc[0].n).map(function () { return 0; }); pc.forEach(function (w, i) { var v = vec(w.n), wt = 0.5 + i / pc.length; for (var k = 0; k < pv.length; k++) pv[k] += v[k] * wt; }); }
      var prev = prefix.length ? prefix[prefix.length - 1].n : "", boost = NEXT[prev] || [], pool = {};
      Object.keys(V).forEach(function (k) { if (prefix.some(function (w) { return w.n === k; })) return; pool[k] = (pv ? cos(pv, V[k]) * 2.4 : 0); });
      boost.forEach(function (k, i) { pool[k] = (pool[k] || 0) + 1.6 - i * 0.22; });
      cands = Object.keys(pool).map(function (k) { return { w: k, logit: pool[k] }; }).sort(function (a, b) { return b.logit - a.logit; }).slice(0, 5);
      soften();
    }
    function soften() { var mx = cands.length ? cands[0].logit : 0, sum = 0; cands.forEach(function (c) { c.e = Math.exp((c.logit - mx) / Math.max(0.08, T * 0.45)); sum += c.e; }); cands.forEach(function (c) { c.p = c.e / sum; }); }

    function readSentence() {        // the robot's own reaction, keyword first, then negation
      var about = words.some(function (w) { return w.n === "robot"; }); react = null; if (!about) return;
      var senti = null, neg = null; words.forEach(function (w, i) { var v = vec(w.n); if (v && (v[3] > 0.6 || v[4] > 0.6)) senti = { i: i, good: v[3] > v[4] }; });
      if (!senti) return;
      for (var i = Math.max(0, senti.i - 3); i < senti.i; i++) if (NEG[words[i].n]) neg = i;
      react = { t: 0, senti: senti, neg: neg, stage: 0 };
    }
    function stepReact(dt) {
      if (!react) return; react.t += dt;
      if (react.stage === 0 && react.t > 0.5) { react.stage = 1; bot.mood.joy = react.senti.good ? 1 : 0; bot.mood.anger = react.senti.good ? 0 : 0.55; bot.mood.lid = react.senti.good ? 0 : 0.35; }
      if (react.stage === 1 && react.neg !== null && react.t > 1.7) { react.stage = 2; bot.freeze = 0.6; bot.mood.joy = 0; bot.mood.anger = 0; bot.mood.wide = 1; flash = { a: react.neg, b: react.senti.i, t: 0 }; say("wait. “" + words[react.neg].t + "”."); }
      if (react.stage === 2 && react.t > 2.7) { react.stage = 3; bot.mood.wide = 0; bot.mood.joy = react.senti.good ? 0 : 0.8; bot.mood.anger = react.senti.good ? 0.5 : 0; bot.mood.lid = react.senti.good ? 0.35 : 0; }
      if (react.t > 6) { bot.mood.joy = 0; bot.mood.anger = 0; bot.mood.lid = 0; react = null; }
    }

    function refresh() { var c = document.createElement("canvas").getContext("2d"); layoutSentence(c); analyse(); readSentence(); }
    refresh(); setMode(mode);
    if (M) M.log("opened", "language demo");

    function attn(i) {     // how much word i looks at each other word: similarity, a little recency, and negation pairs
      var a = words[i], va = vec(a.n), ws = words.map(function (b, k) { if (k === i) return -9; var vb = vec(b.n), s = va && vb ? cos(va, vb) * 2.6 : vb ? 0.5 : -0.4; if (NEG[a.n] && k > i && k - i <= 3 && vb) s += 2.2; if (NEG[b.n] && i > k && i - k <= 3 && va) s += 2.2; return s - Math.abs(k - i) * 0.12; });
      var mx = Math.max.apply(null, ws), sum = 0, e = ws.map(function (s) { var x = Math.exp(s - mx); sum += x; return x; }); return e.map(function (x) { return x / sum; });
    }
    function arc(ctx, a, b, wgt, rgb) { var x0 = a.x + a.w / 2, x1 = b.x + b.w / 2, y0 = a.y - fontPx * 0.95, y1 = b.y - fontPx * 0.95, lift = Math.min(90, 26 + Math.abs(x1 - x0) * 0.22); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(x0, y0 - lift, x1, y1 - lift, x1, y1); glow(ctx, rgb, 0.8 + wgt * 5, 0.25 + wgt * 0.75); }

    return {
      step: function (dt, S) {
        clock += dt; T = tempEl ? tempEl.value / 100 : T;
        hover = -1; if (S.inside) words.forEach(function (w, i) { if (S.mx > w.x - 4 && S.mx < w.x + w.w + 4 && S.my > w.y - fontPx * 1.1 && S.my < w.y + fontPx * 0.4) hover = i; });
        if (hover < 0) { auto += dt; } else auto = 0;
        Object.keys(map).forEach(function (k) { var p = map[k]; p.d += (p.td - p.d) * Math.min(1, dt * 3.2); });
        if (mode === "predict") { sampleT += dt; if (sampleT > 2.4 && cands.length) { sampleT = 0; var x = Math.random(), pick = cands[0]; for (var i = 0; i < cands.length; i++) { x -= cands[i].p; if (x <= 0) { pick = cands[i]; break; } } sample = { w: pick.w, t: 0 }; } if (sample) sample.t += dt; }
        if (flash) { flash.t += dt; if (flash.t > 1.4) flash = null; }
        stepReact(dt);
        var reading = words.length ? words[Math.floor((clock * 2.2) % words.length)] : null, focus = hover >= 0 ? words[hover] : mode === "meaning" && focusWord ? { x: focusWord.x + focusWord.w / 2, y: focusWord.y } : reading;
        bot.step(dt, { x: wide ? r.x + r.w - R * 2.2 : S.W - R * 1.8, y: wide ? r.y + r.h - R * 0.4 : r.y + r.h + R * 0.2 }, focus ? { x: focus.x + (focus.w || 0) / 2, y: focus.y } : null, { stiff: 9 });
        chips.step(dt, S.W);
      },
      settle: function () { bot.x = r.x + r.w - R * 1.3; bot.y = r.y + r.h - R * 0.4; Object.keys(map).forEach(function (k) { map[k].d = map[k].td; }); },
      act: function (name, value) {
        if (name === "sentence") { text = String(value || "").slice(0, 90) || PRESETS[0]; refresh(); if (M && value) { var mem = M.data(); mem.typed = (mem.typed || []).concat([text.slice(0, 80)]).slice(-3); M.touch(); } }
        else if (name === "example") { preset = (preset + 1) % PRESETS.length; text = PRESETS[preset]; if (input) input.value = text; refresh(); }
        else if (name === "temp") { T = value / 100; soften(); }
        else if (name.indexOf("mode-") === 0) { setMode(name.slice(5)); refresh(); }
      },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H); if (!words.length) { bot.draw(ctx, 0, S.H); return; }
        var shown = mode === "predict" ? words.slice(0, -1) : words, active = hover >= 0 ? hover : mode === "attention" ? Math.floor(auto / 1.6) % words.length : -1;
        // the sentence
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.font = "700 " + fontPx + "px 'Libre Franklin', sans-serif";
        shown.forEach(function (w, i) { var isF = mode === "meaning" && w === focusWord; ctx.fillStyle = isF ? "rgb(" + TEAL + ")" : i === active ? "#fff" : vec(w.n) ? "rgba(235,243,255,.95)" : "rgba(160,178,205,.8)"; ctx.fillText(w.t, w.x, w.y); if (isF) { ctx.fillStyle = "rgba(" + TEAL + ",.9)"; ctx.fillRect(w.x, w.y + 7, w.w, 2); } });

        if (mode === "tokens") {
          ctx.font = "600 " + Math.max(10, fontPx * 0.36) + "px ui-monospace, Consolas, monospace"; ctx.textBaseline = "middle";
          words.forEach(function (w, i) {
            var x = w.x, y = w.y + fontPx * 0.55, on = i === hover, gapx = on ? 7 : 3;
            w.pieces.forEach(function (p, k) { var label = p, tw = ctx.measureText(label).width + 12, hh = fontPx * 0.62, rgb = k % 2 ? WARM : TEAL; ctx.fillStyle = "rgba(" + rgb + "," + (on ? 0.3 : 0.14) + ")"; ctx.fillRect(x, y, tw, hh); ctx.strokeStyle = "rgba(" + rgb + "," + (on ? 1 : 0.6) + ")"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, tw - 1, hh - 1); ctx.fillStyle = "#eaf2ff"; ctx.fillText(label, x + 6, y + hh / 2 + 0.5); if (on) { ctx.fillStyle = "rgba(" + rgb + ",.95)"; ctx.fillText(String(hash(p)), x + 1, y + hh + 10); } x += tw + gapx; });
          });
          SAIL.caption(ctx, words.reduce(function (n, w) { return n + w.pieces.length; }, 0) + " tokens from " + words.length + " words. Hover a word to see its ID numbers.", area.x, area.y + 16);
        }
        if (mode === "attention" && active >= 0 && words[active]) {
          var wts = attn(active), order = wts.map(function (v, i) { return i; }).sort(function (a, b) { return wts[b] - wts[a]; });
          words.forEach(function (w, i) { if (i !== active && wts[i] > 0.04) arc(ctx, words[active], w, wts[i], vec(w.n) ? TEAL : INK); });
          ctx.font = "600 12px 'Libre Franklin', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#eaf2ff";
          order.slice(0, 3).forEach(function (i) { if (i !== active) ctx.fillText(Math.round(wts[i] * 100) + "%", words[i].x + words[i].w / 2, words[i].y + 20); });
          SAIL.caption(ctx, "“" + words[active].t + "” is deciding which other words matter to it.", area.x, area.y + 16);
        }
        if (flash && words[flash.a] && words[flash.b]) arc(ctx, words[flash.a], words[flash.b], 1 - flash.t / 1.4, WARM);

        if (mode === "meaning" && focusWord) {
          var cx = area.x + area.w * (wide ? 0.44 : 0.5), cy = area.y + area.h * 0.52, rad = Math.min(area.w * 0.46, area.h * 0.5), keys = Object.keys(V).filter(function (k) { return k !== focusWord.n; });
          keys.sort(function (a, b) { return map[a].s - map[b].s; });
          keys.forEach(function (k) {
            var p = map[k], x = cx + Math.cos(p.a) * rad * p.d * (wide ? 1.25 : 1), y = cy + Math.sin(p.a) * rad * p.d * 0.92, near = clamp((p.s - 0.25) / 0.6, 0, 1);
            if (near > 0.05) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); glow(ctx, TEAL, 0.6 + near * 2.2, near * 0.8); }
            dot(ctx, x, y, 2 + near * 3.5, near > 0.3 ? TEAL : DIM, 0.35 + near * 0.65);
            if (near > 0.12 || p.d < 0.97 && wide) { ctx.font = (near > 0.4 ? "600 " : "500 ") + Math.round(11 + near * 5) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "rgba(225,236,252," + (0.3 + near * 0.7).toFixed(2) + ")"; ctx.fillText(k, x, y - 9); }
          });
          dot(ctx, cx, cy, 9, TEAL, 1); ctx.font = "800 " + (wide ? 22 : 17) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText(focusWord.n.toUpperCase(), cx, cy - 16);
        }
        if (mode === "predict") {
          var last = shown[shown.length - 1] || { x: r.x, y: r.y + fontPx, w: 0 }, bx = last.x + last.w + fontPx * 0.32, by = last.y, bw = fontPx * 2.6;
          if (bx + bw > r.x + r.w) { bx = r.x; by += fontPx * 1.5; }
          ctx.fillStyle = "rgba(" + TEAL + ",.9)"; ctx.fillRect(bx, by + 5, bw, 2);
          if (sample && sample.t < 1.6) { ctx.font = "700 " + fontPx + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "rgba(" + TEAL + "," + clamp(1.6 - sample.t, 0, 1).toFixed(2) + ")"; ctx.fillText(sample.w, bx, by); }
          var ox = bx + bw / 2, oy = by + 12, spread = clamp(0.35 + T * 0.75, 0.3, 1.5), n = cands.length;
          cands.forEach(function (c, i) {
            var slot = [2, 1, 3, 0, 4][i] === undefined ? i : [2, 1, 3, 0, 4][i], len = Math.min(area.h * 0.7, 110 + T * 70), x = r.x + r.w * (0.1 + 0.8 * (n > 1 ? slot / 4 : 0.5)) , y = oy + len * (0.62 + 0.38 * Math.cos((slot - 2) * spread * 0.6));
            ctx.beginPath(); ctx.moveTo(ox, oy); ctx.bezierCurveTo(ox, oy + len * 0.5, x, y - len * 0.5, x, y - 14); glow(ctx, sample && sample.w === c.w && sample.t < 1.2 ? WARM : TEAL, 0.7 + c.p * 7, 0.2 + c.p * 0.8);
            ctx.font = "600 " + Math.round(13 + c.p * 12) + "px 'Libre Franklin', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "rgba(235,243,255," + (0.45 + c.p * 0.55).toFixed(2) + ")"; ctx.fillText(c.w, x, y + 4);
            ctx.font = "500 12px 'Libre Franklin', sans-serif"; ctx.fillStyle = "rgba(" + TEAL + ",.95)"; ctx.fillText(Math.round(c.p * 100) + "%", x, y + 21);
          });
        }
        bot.draw(ctx, 0, S.H);
      }
    };
  };
})();
