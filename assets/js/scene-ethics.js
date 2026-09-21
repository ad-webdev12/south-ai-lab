/* South Artificial Intelligence Laboratory: the Ethics hero.
   One idea: a feed becoming narrower through reinforcement. Two people, two phone feeds,
   six harmless topics. Each new post is either picked at random or, with the probability
   set by the slider, picked to match what that person clicked before. People click what
   they already like a little more often, so the loop feeds itself. The number underneath
   counts how many of the twelve posts on screen the two feeds still have in common.
   It is an illustration of a feedback loop, not data from a real platform. */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL) return;
  var TOPICS = [
    { n: "Sports", c: "222,170,96", h: ["Late goal decides the final", "Local team starts new season", "Runner breaks school record", "How the playoffs work"] },
    { n: "Music", c: "126,196,180", h: ["Band announces spring tour", "Five songs for a long drive", "Student orchestra plays downtown", "Why that chorus sticks"] },
    { n: "Science", c: "232,138,116", h: ["Telescope spots distant storm", "How vaccines train the body", "New battery charges faster", "What a black hole is not"] },
    { n: "Food", c: "214,196,150", h: ["Weeknight pasta in one pan", "The case for frozen peas", "Bakery line worth the wait", "Spices that change a soup"] },
    { n: "Travel", c: "140,165,205", h: ["A weekend by train", "Packing light for a week", "Small towns with big views", "What to do on a layover"] },
    { n: "Games", c: "164,190,130", h: ["Indie puzzle game surprises", "Speedrun record falls again", "Board games for six people", "Patch notes, explained"] }
  ];
  var N = 12;

  SAIL.scenes.society = function (S, root) {
    var wide = S.W >= 980, bar = root.querySelector(".ghero-bar"), floorY = bar ? bar.offsetTop + 6 : S.H - 120, slider = root.querySelector('[data-act="feed"]');
    var r = wide ? { x: S.W * 0.51, y: 96, w: S.W * 0.46, h: floorY - 96 } : { x: S.W * 0.04, y: floorY - (Math.min(window.innerHeight * 0.46, 440) - 22), w: S.W * 0.92, h: Math.min(window.innerHeight * 0.46, 440) - 22 };
    var pw = Math.min(r.w * 0.44, 270), ph = r.h - 64, gap = Math.min(40, r.w - pw * 2), x0 = r.x + (r.w - pw * 2 - gap) / 2, slim = pw < 170;
    var strength = slider ? slider.value / 100 : 0.2, tick = 0, clock = 0, shared = 0, shownShared = 0;
    var people = [{ name: "Feed A", lean: 0, x: x0 }, { name: "Feed B", lean: 3, x: x0 + pw + gap }];
    people.forEach(function (p) { p.likes = TOPICS.map(function (t, i) { return i === p.lean ? 2 : 1; }); p.posts = []; });

    function pick(p) {
      if (Math.random() < strength) { var w = p.likes.map(function (v) { return v * v; }), sum = w.reduce(function (a, b) { return a + b; }, 0), x = Math.random() * sum; for (var i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return i; } }
      return (Math.random() * TOPICS.length) | 0;
    }
    function post(p, quiet) {
      var t = pick(p), mx = Math.max.apply(null, p.likes), liked = Math.random() < 0.3 + 0.55 * p.likes[t] / mx;
      if (liked) p.likes[t] = Math.min(60, p.likes[t] + 1);
      p.posts.unshift({ t: t, h: TOPICS[t].h[(Math.random() * 4) | 0], liked: liked, slide: quiet ? 0 : 1 }); if (p.posts.length > N) p.posts.pop();
    }
    function measure() { var a = [0, 0, 0, 0, 0, 0], b = a.slice(); people[0].posts.forEach(function (q) { a[q.t]++; }); people[1].posts.forEach(function (q) { b[q.t]++; }); shared = a.reduce(function (s, v, i) { return s + Math.min(v, b[i]); }, 0); }
    people.forEach(function (p) { for (var i = 0; i < N; i++) post(p, true); }); measure(); shownShared = shared;

    return {
      step: function (dt) {
        clock += dt; tick += dt; strength = slider ? slider.value / 100 : strength;
        if (tick > 1.15) { tick = 0; people.forEach(function (p) { post(p, false); p.likes = p.likes.map(function (v) { return Math.max(1, v * 0.992); }); }); measure(); }
        people.forEach(function (p) { p.posts.forEach(function (q) { q.slide = Math.max(0, q.slide - dt * 3.2); }); });
        shownShared += (shared - shownShared) * Math.min(1, dt * 4);
      },
      settle: function () { shownShared = shared; },
      act: function (name, value) { if (name === "feed") strength = value / 100; },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        var top = r.y + 4, head = 30, ch = (ph - head - 10) / N;
        people.forEach(function (p) {
          // the phone
          ctx.fillStyle = "#0a0f1a"; ctx.fillRect(p.x - 7, top - 7, pw + 14, ph + 14); ctx.lineWidth = 1.5; ctx.strokeStyle = "#3a4558"; ctx.strokeRect(p.x - 6.5, top - 6.5, pw + 13, ph + 13);
          ctx.fillStyle = "#141b29"; ctx.fillRect(p.x, top, pw, ph); ctx.fillStyle = "#0a0f1a"; ctx.fillRect(p.x + pw / 2 - 22, top - 7, 44, 9);
          ctx.font = "700 12px 'Libre Franklin', sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#efe6d4"; ctx.fillText(p.name, p.x + 10, top + head / 2 + 2);
          // what this person has clicked most, as a row of small swatches
          var mx = Math.max.apply(null, p.likes); p.likes.forEach(function (v, i) { var hh = 3 + 13 * v / mx; ctx.fillStyle = "rgba(" + TOPICS[i].c + ",.95)"; ctx.fillRect(p.x + pw - 12 - (TOPICS.length - i) * 9, top + head - 6 - hh, 6, hh); });
          ctx.save(); ctx.beginPath(); ctx.rect(p.x, top + head, pw, ph - head); ctx.clip();
          p.posts.forEach(function (q, i) {
            var t = TOPICS[q.t], y = top + head + 4 + (i - p.posts[0].slide) * ch, fresh = i === 0 ? 1 - q.slide : 1;
            ctx.globalAlpha = Math.max(0, fresh); ctx.fillStyle = "#efe6d4"; ctx.fillRect(p.x + 6, y, pw - 12, ch - 4);
            ctx.fillStyle = "rgb(" + t.c + ")"; ctx.fillRect(p.x + 6, y, slim ? 8 : 58, ch - 4);
            ctx.textBaseline = "middle";
            if (!slim) { ctx.font = "700 9px 'Libre Franklin', sans-serif"; ctx.fillStyle = "#1d2330"; ctx.textAlign = "center"; ctx.fillText(t.n.toUpperCase(), p.x + 35, y + (ch - 4) / 2 + 0.5); }
            ctx.textAlign = "left"; ctx.font = "500 " + Math.min(12, ch * 0.42).toFixed(1) + "px 'Source Serif 4', Georgia, serif"; ctx.fillStyle = "#1d2330";
            var label = slim ? t.n : q.h, maxW = pw - (slim ? 40 : 94); while (ctx.measureText(label).width > maxW && label.length > 4) label = label.slice(0, -2); if (label !== (slim ? t.n : q.h)) label += "…";
            ctx.fillText(label, p.x + (slim ? 20 : 72), y + (ch - 4) / 2 + 0.5);
            if (q.liked) { ctx.fillStyle = "rgb(" + t.c + ")"; ctx.beginPath(); ctx.arc(p.x + pw - 17, y + (ch - 4) / 2, 3.2, 0, 6.2832); ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = "#1d2330"; ctx.stroke(); }
            ctx.globalAlpha = 1;
          });
          ctx.restore();
        });
        // what the two feeds still have in common
        var my = top + ph + 30, cx = r.x + r.w / 2, n = Math.round(shownShared), bw = Math.min(16, (pw * 2 + gap) / N - 4), total = N * (bw + 4) - 4, bx = cx - total / 2;
        for (var i = 0; i < N; i++) { ctx.fillStyle = i < n ? "#efe6d4" : "rgba(239,230,212,.16)"; ctx.fillRect(bx + i * (bw + 4), my + 12, bw, 5); }
        ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = "600 " + (wide ? 15 : 13) + "px 'Libre Franklin', sans-serif"; ctx.fillStyle = "#efe6d4"; ctx.fillText("shared topics: " + n + " / " + N, cx, my + 2);
      }
    };
  };
})();
