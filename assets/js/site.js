/* South Artificial Intelligence Laboratory
   1. navigation
   2. join form (builds an email, preselects a group from the URL)
   3. learning path progress (saved in this browser)
   4. home hero: plasma */

(function () {
  "use strict";

  var LAB_EMAIL = "southailab@gmail.com";

  /* ---------------- 1. navigation ---------------- */
  function nav() {
    // the bar is clear over the top of the page and turns to frosted glass once content scrolls under it
    var mast = document.querySelector("[data-masthead]");
    if (mast) {
      var hero = document.querySelector(".hero, .ghero, .pagetop");
      var onScroll = function () {
        var limit = hero ? hero.offsetHeight - mast.offsetHeight - 4 : 6;
        mast.classList.toggle("scrolled", window.scrollY > limit);
        mast.classList.toggle("sunk", window.scrollY > 8 && window.scrollY <= limit);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }

    var toggle = document.querySelector("[data-navtoggle]");
    var drawer = document.querySelector("[data-drawer]");
    if (toggle && drawer) {
      toggle.addEventListener("click", function () {
        var open = drawer.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }

    var group = document.querySelector("[data-navgroup]");
    if (group) {
      var gbtn = group.querySelector("button");
      var setOpen = function (open) {
        group.classList.toggle("open", open);
        gbtn.setAttribute("aria-expanded", String(open));
      };
      gbtn.addEventListener("click", function () { setOpen(!group.classList.contains("open")); });
      // the menu is a child of the group, so moving from the button into the
      // menu never leaves it; the short delay forgives a diagonal mouse path
      var closeTimer;
      group.addEventListener("pointerenter", function (ev) {
        if (ev.pointerType === "touch") return;
        window.clearTimeout(closeTimer); setOpen(true);
      });
      group.addEventListener("pointerleave", function (ev) {
        if (ev.pointerType === "touch") return;
        closeTimer = window.setTimeout(function () { setOpen(false); }, 220);
      });
      group.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && group.classList.contains("open")) { setOpen(false); gbtn.focus(); }
      });
      group.addEventListener("focusout", function (ev) {
        if (!group.contains(ev.relatedTarget)) setOpen(false);
      });
      document.addEventListener("click", function (ev) {
        if (!group.contains(ev.target)) setOpen(false);
      });
    }

    // highlight the current section in a page's side navigation
    var links = document.querySelectorAll("[data-subnav] a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("on"); });
        var hit = byId[en.target.id];
        if (hit) hit.classList.add("on");
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ---------------- 2. join form ---------------- */
  function joinForm() {
    var form = document.querySelector("[data-apply]");
    if (!form) return;
    var status = form.querySelector(".fstatus");

    function pickGroup() {
      var m = /^#join-([a-z-]+)$/.exec(window.location.hash);
      if (!m) return;
      var opt = form.querySelector('select[name="group"] option[data-key="' + m[1] + '"]');
      if (opt) opt.selected = true;
    }
    pickGroup();
    window.addEventListener("hashchange", pickGroup);

    // the project idea only matters for the Applied Research Division, so it only shows then
    var trackSel = form.querySelector('select[name="track"]');
    var ideaWrap = form.querySelector("[data-idea]");
    var idea = form.querySelector('textarea[name="statement"]');
    function syncIdea() {
      var on = trackSel.options[trackSel.selectedIndex].getAttribute("data-key") === "division";
      ideaWrap.hidden = !on;
      idea.required = on;
    }
    trackSel.addEventListener("change", syncIdea);
    syncIdea();

    function message() {
      var d = new FormData(form);
      var v = function (k) { return (d.get(k) || "").toString().trim(); };
      var lines = [
        "Name: " + v("name"),
        "School email: " + v("email"),
        "Grade: " + v("grade"),
        "Track: " + v("track"),
        "Research group: " + v("group"),
        "Experience: " + (v("experience") || "none yet")
      ];
      if (!ideaWrap.hidden) lines.push("", "Project idea:", v("statement"));
      return { subject: "Joining SAIL: " + v("name"), body: lines.join("\n") };
    }
    function show(html) { status.classList.add("show"); status.innerHTML = html; }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      var m = message();
      show("Your email app should now be open with the message written. <strong>Press send there to finish.</strong> " +
           "If nothing opened, use Copy the message and email it to <strong>" + LAB_EMAIL + "</strong>.");
      window.location.href = "mailto:" + LAB_EMAIL + "?subject=" + encodeURIComponent(m.subject) + "&body=" + encodeURIComponent(m.body);
    });

    var copy = form.querySelector("[data-copy]");
    if (copy) {
      copy.addEventListener("click", function () {
        if (!form.reportValidity()) return;
        var m = message(), text = "To: " + LAB_EMAIL + "\nSubject: " + m.subject + "\n\n" + m.body;
        var done = function () { show("Copied. Paste it into an email to <strong>" + LAB_EMAIL + "</strong>."); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { show("<pre style=\"white-space:pre-wrap;margin:0\">" + text.replace(/</g, "&lt;") + "</pre>"); });
        else show("<pre style=\"white-space:pre-wrap;margin:0\">" + text.replace(/</g, "&lt;") + "</pre>");
      });
    }
  }

  /* ---------------- 3. learning path ----------------
     Progress is one checkbox per stage (its task), not one per resource, because
     most resources are alternatives or references. Saved in this browser only. */
  function planner() {
    var boxes = document.querySelectorAll("input[data-task]");
    if (!boxes.length) return;
    var KEY = "sail-path-v1", done = {};
    try { done = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { done = {}; }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} }
    function refresh() {
      var n = 0;
      boxes.forEach(function (b) {
        if (b.checked) n++;
        var title = b.closest(".stage").querySelector(".st-title");
        if (title) title.classList.toggle("done", b.checked);
      });
      var label = document.querySelector("[data-progress-label]");
      if (label) label.textContent = n + " of " + boxes.length + " stages done";
    }
    boxes.forEach(function (b) {
      var id = b.getAttribute("data-task");
      b.checked = !!done[id];
      b.addEventListener("change", function () { if (b.checked) done[id] = 1; else delete done[id]; save(); refresh(); });
    });
    var reset = document.querySelector("[data-reset]");
    if (reset) {
      reset.addEventListener("click", function () {
        if (!Object.keys(done).length || !window.confirm("Clear your progress on all stages?")) return;
        done = {}; save(); boxes.forEach(function (b) { b.checked = false; }); refresh();
      });
    }
    refresh();
  }

  /* ---------------- 4. home hero: plasma ----------------
     Glowing orbs drift across the screen. Each one throws out slow filaments,
     and when two orbs come near each other, or near your pointer, the filaments
     jump across and brighten, the way they do inside a plasma ball.
     Filaments writhe smoothly; nothing flashes. */
  /* Home hero, the project wall: pieces of real SAIL work drifting slowly behind the name,
     joined by thin paths from learning to projects. Hover or tap a piece to bring it forward.
     The earlier plasma hero is kept as a backup: set SITE["hero"] = "plasma" in build.py, or
     open index.html#plasma to look at it. */
  // sections ease in as they are scrolled to; nothing is hidden unless this script is running
  function reveal() {
    if (!("IntersectionObserver" in window) || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    [].forEach.call(document.querySelectorAll("main > section.section > .wrap > *, main > section.section > .narrow > *"), function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
      el.classList.add("rv"); io.observe(el);
    });
  }

  function heroWall() {
    var host = document.querySelector("[data-hero]"), canvas = document.querySelector("[data-field]");
    if (!host || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d"), pauseBtn = document.querySelector("[data-pause]");
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var W = 0, H = 0, dpr = 1, t = 0, last = 0, running = !reduced, mx = -1, my = -1, frags = [];
    var PAPER = "#ece5d6", INKC = "#1b2333", LINE = "143,180,255";
    var thumb = new Image(); thumb.src = "assets/img/street-thumb.jpg"; var digits = new Image(); digits.src = "assets/img/mnist-fashion-samples.png";
    thumb.onload = digits.onload = function () { if (!running) paint(); };

    var KINDS = [
      { title: "Titanic prediction", w: 190, h: 120, draw: function (c, w, h) {
          c.fillStyle = INKC; c.font = "600 10px 'Libre Franklin', sans-serif"; c.textBaseline = "alphabetic"; c.textAlign = "left"; c.fillText("Survival rate, training set", 12, 20);
          [["women", 0.742], ["men", 0.189], ["1st class", 0.63], ["3rd class", 0.242]].forEach(function (b, i) { var y = 34 + i * 20; c.fillStyle = "#5b6577"; c.font = "500 9px 'Libre Franklin', sans-serif"; c.fillText(b[0], 12, y + 9); c.fillStyle = "#d9d0bd"; c.fillRect(64, y, w - 104, 11); c.fillStyle = i < 2 ? "#1a4fc4" : "#2f8f86"; c.fillRect(64, y, (w - 104) * b[1], 11); c.fillStyle = INKC; c.fillText(Math.round(b[1] * 100) + "%", w - 34, y + 9); }); } },
      { title: "MNIST classifier", w: 170, h: 112, draw: function (c, w, h) { if (digits.naturalWidth) { var sw = digits.naturalWidth, sh = digits.naturalHeight; c.drawImage(digits, sw * 0.02, sh * 0.06, sw * 0.5, sh * 0.42, 10, 10, w - 20, h - 34); } c.fillStyle = INKC; c.font = "600 10px ui-monospace, Consolas, monospace"; c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillText("28 x 28 pixels, 10 classes", 10, h - 10); } },
      { title: "NLP workshop", w: 200, h: 84, draw: function (c, w, h) { c.fillStyle = INKC; c.font = "italic 500 12px 'Source Serif 4', Georgia, serif"; c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillText("“great acting, slow ending”", 12, 26); c.font = "600 9px 'Libre Franklin', sans-serif"; c.fillStyle = "#5b6577"; c.fillText("LABEL", 12, 54); c.fillStyle = "#2f8f86"; c.fillRect(52, 43, 64, 16); c.fillStyle = "#fff"; c.font = "700 9px 'Libre Franklin', sans-serif"; c.fillText("POSITIVE", 58, 54.5); c.fillStyle = "#c9bfa9"; c.fillRect(124, 43, 64, 16); c.fillStyle = "#5b6577"; c.fillText("NEGATIVE", 130, 54.5); } },
      { title: "A first notebook", w: 236, h: 92, dark: true, draw: function (c, w, h) { c.font = "500 11px ui-monospace, Consolas, monospace"; c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillStyle = "#7f93b3"; c.fillText("In [3]:", 10, 24); c.fillStyle = "#e6edf7"; var a = "df = pd.read_csv(", b = "\"train.csv\""; c.fillText(a, 62, 24); c.fillStyle = "#9ad4a0"; c.fillText(b, 62 + c.measureText(a).width, 24); c.fillStyle = "#e6edf7"; c.fillText(")", 62 + c.measureText(a + b).width, 24); c.fillText("df.shape", 62, 44); c.fillStyle = "#ff8a8a"; c.fillText("Out[3]:", 10, 70); c.fillStyle = "#e6edf7"; c.fillText("(891, 12)", 62, 70); } },
      { title: "Model cards", w: 186, h: 104, draw: function (c, w, h) { c.fillStyle = INKC; c.font = "700 11px 'Libre Franklin', sans-serif"; c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillText("Model card", 12, 22); ["Intended use", "Trained on", "Known limits"].forEach(function (f, i) { var y = 42 + i * 20; c.font = "600 9px 'Libre Franklin', sans-serif"; c.fillStyle = "#5b6577"; c.fillText(f.toUpperCase(), 12, y); c.fillStyle = "#c9bfa9"; c.fillRect(92, y - 7, w - 106 - i * 14, 2); c.fillRect(92, y - 2, w - 130 + i * 8, 2); }); } },
      { title: "Object detection", w: 200, h: 124, dark: true, draw: function (c, w, h) { if (thumb.naturalWidth) c.drawImage(thumb, 0, 0, 320, 180, 6, 6, w - 12, h - 12); var sx = (w - 12) / 320, sy = (h - 12) / 180; [[147.5, 58.5, 77.5, 67.5, "car 99%"], [59.5, 34.5, 81, 84, "car 96%"]].forEach(function (b) { var x = 6 + b[0] * sx, y = 6 + b[1] * sy, bw = b[2] * sx, bh = b[3] * sy; c.lineWidth = 1.5; c.strokeStyle = "#4fd1c5"; c.strokeRect(x, y, bw, bh); c.fillStyle = "#4fd1c5"; c.fillRect(x, y - 11, 44, 11); c.fillStyle = "#04101c"; c.font = "700 8px 'Libre Franklin', sans-serif"; c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillText(b[4], x + 3, y - 3); }); } }
    ];
    // a loose ring around the name, fixed so the wall looks the same on every visit
    var SPOTS = [[0.13, 0.27, -4], [0.84, 0.22, 3], [0.1, 0.7, 3], [0.87, 0.64, -3], [0.3, 0.86, -2], [0.68, 0.87, 2]], ORDER = [3, 0, 1, 2, 5, 4];

    function build() {
      var rect = host.getBoundingClientRect(); if (rect.width < 2 || rect.height < 2) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2); W = rect.width; H = rect.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var small = W < 760, use = small ? [0, 5, 3] : [0, 1, 2, 3, 4, 5], spots = small ? [[0.27, 0.15, -4], [0.74, 0.19, 3], [0.5, 0.91, -2]] : SPOTS, k = small ? 0.7 : Math.min(1.2, Math.max(0.85, W / 1400));
      frags = use.map(function (ki, i) { var s = spots[small ? i : ki]; return { kind: KINDS[ki], x: s[0] * W, y: s[1] * H, rot: s[2] * Math.PI / 180, k: k, grow: 0, ph: i * 1.7, drift: small ? (i === 0 ? 1 : 0) : 1, order: small ? i : ORDER.indexOf(ki) }; });
      return true;
    }
    function pos(f) { return { x: f.x + Math.sin(t * 0.11 + f.ph) * 10 * f.drift, y: f.y + Math.cos(t * 0.09 + f.ph * 1.3) * 8 * f.drift }; }
    function paint() {
      ctx.clearRect(0, 0, W, H);
      var bg = ctx.createRadialGradient(W / 2, H * 0.46, 40, W / 2, H * 0.46, Math.max(W, H) * 0.7); bg.addColorStop(0, "#0c1a33"); bg.addColorStop(0.55, "#07101f"); bg.addColorStop(1, "#03070e"); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      var seq = frags.slice().sort(function (a, b) { return a.order - b.order; });
      for (var i = 0; i + 1 < seq.length; i++) {      // thin paths, in the order a member meets this work
        var a = pos(seq[i]), b = pos(seq[i + 1]), cx = (a.x + b.x) / 2 + (W / 2 - (a.x + b.x) / 2) * 0.35, cy = (a.y + b.y) / 2 + (H / 2 - (a.y + b.y) / 2) * 0.35;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cx, cy, b.x, b.y); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + LINE + ",.16)"; ctx.stroke();
        var u = (t * 0.035 + i * 0.37) % 1, qx = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * cx + u * u * b.x, qy = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * cy + u * u * b.y; ctx.fillStyle = "rgba(" + LINE + ",.7)"; ctx.fillRect(qx - 1.5, qy - 1.5, 3, 3);
      }
      frags.slice().sort(function (a, b) { return a.grow - b.grow; }).forEach(function (f) {
        var p = pos(f), w = f.kind.w, h = f.kind.h, s = f.k * (1 + f.grow * 0.32);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(f.rot * (1 - f.grow)); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2); ctx.globalAlpha = 0.8 + f.grow * 0.2;
        ctx.fillStyle = f.kind.dark ? "#0b1524" : PAPER; ctx.fillRect(0, 0, w, h); ctx.lineWidth = 1; ctx.strokeStyle = f.kind.dark ? "rgba(143,180,255,.35)" : "rgba(255,255,255,.5)"; ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
        f.kind.draw(ctx, w, h); ctx.restore();
        if (f.grow > 0.05) { ctx.globalAlpha = f.grow; ctx.font = "600 13px 'Libre Franklin', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#fff"; ctx.fillText(f.kind.title, p.x, p.y + h * s / 2 + 22); ctx.globalAlpha = 1; }
      });
    }
    function over(f) { var p = pos(f); return Math.abs(mx - p.x) < f.kind.w * f.k / 2 + 6 && Math.abs(my - p.y) < f.kind.h * f.k / 2 + 6; }
    function tick(dt) { var hit = null; frags.forEach(function (f) { if (!hit && over(f)) hit = f; }); frags.forEach(function (f) { f.grow += ((f === hit ? 1 : 0) - f.grow) * Math.min(1, dt * 6); }); }
    function frame(ts) {
      if (!running) { last = 0; return; }
      if (!last) last = ts; var dt = Math.min((ts - last) / 1000, 0.05); last = ts; t += dt; tick(dt); paint(); window.requestAnimationFrame(frame);
    }
    function point(ev) { var r = host.getBoundingClientRect(); mx = ev.clientX - r.left; my = ev.clientY - r.top; if (!running) { tick(1); paint(); } }
    host.addEventListener("pointermove", point);
    host.addEventListener("pointerdown", function (ev) { point(ev); if (ev.pointerType === "touch") window.setTimeout(function () { mx = my = -1; if (!running) { tick(1); paint(); } }, 2400); });
    host.addEventListener("pointerleave", function () { mx = my = -1; if (!running) { tick(1); paint(); } });
    if (pauseBtn) { if (reduced) pauseBtn.textContent = "Play animation"; pauseBtn.addEventListener("click", function () { running = !running; pauseBtn.textContent = running ? "Pause animation" : "Play animation"; if (running) window.requestAnimationFrame(frame); }); }
    var timer; function fit() { window.clearTimeout(timer); timer = window.setTimeout(function () { var r = host.getBoundingClientRect(); if (Math.abs(r.width - W) > 1 || Math.abs(r.height - H) > 1) { build(); paint(); } }, 160); }
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(host); else window.addEventListener("resize", fit);
    build(); paint(); if (running) window.requestAnimationFrame(frame);
  }

  // The home hero: a field of soft particles that a hidden model keeps pulling into four calm
  // neighbourhoods (vision, language, data, agents), which clear, dissolve, and form again.
  // Loose signal drifts in from the edges; strands appear only inside a formed cluster; a faint
  // contour bends around each one. The centre stays dark so the name stays dominant.
  function hero() {
    var host = document.querySelector("[data-hero]");
    var canvas = document.querySelector("[data-field]");
    if (!host || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var title = host.querySelector("h1"), status = host.querySelector("[data-status]");
    var words = status ? [].slice.call(status.querySelectorAll("span")) : [];
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var W = 0, H = 0, dpr = 1, t = 0, pts = [], hubs = [], sprites = [], box = null, grid = {}, GC = 28;
    var mouse = { x: -9999, y: -9999, tx: 0, ty: 0, on: false, k: 0 };
    var running = !reduced, offscreen = false, last = 0, T = 26, wordAt = -1, wordT = 0;
    var COL = [[120, 176, 255], [196, 150, 255], [156, 236, 196], [255, 240, 220]];

    function sprite(c) {
      var s = document.createElement("canvas"); s.width = s.height = 64;
      var g = s.getContext("2d"), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",1)");
      grad.addColorStop(0.25, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",0.55)");
      grad.addColorStop(1, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",0)");
      g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
      return s;
    }
    function edgeSpawn(p) {
      var e = Math.random() * 4, m = 30;
      if (e < 1) { p.x = -m; p.y = Math.random() * H; } else if (e < 2) { p.x = W + m; p.y = Math.random() * H; }
      else if (e < 3) { p.x = Math.random() * W; p.y = -m; } else { p.x = Math.random() * W; p.y = H + m; }
      var ang = Math.atan2(H / 2 - p.y, W / 2 - p.x) + (Math.random() - 0.5) * 0.8, sp = 14 + Math.random() * 18;
      p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp; p.life = 0; p.span = 18 + Math.random() * 20;
    }
    function measure() {
      var r = host.getBoundingClientRect(), tr = title ? title.getBoundingClientRect() : r;
      box = { x0: tr.left - r.left, y0: tr.top - r.top, x1: tr.right - r.left, y1: tr.bottom - r.top };
      var cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2, hw = (box.x1 - box.x0) / 2, hh = (box.y1 - box.y0) / 2, u = Math.min(W, H);
      // four neighbourhoods around the title, never across it
      var raw = [[cx - hw - u * 0.16, cy - hh - u * 0.06], [cx + hw + u * 0.14, cy - hh - u * 0.1], [cx + hw + u * 0.1, cy + hh + u * 0.2], [cx - hw - u * 0.1, cy + hh + u * 0.24]];
      hubs = raw.map(function (q, i) { return { x: Math.min(W * 0.9, Math.max(W * 0.1, q[0])), y: Math.min(H * 0.9, Math.max(H * 0.14, q[1])), r: u * (0.17 + i * 0.01), ph: i * 1.7 }; });
      if (W < 700) hubs.forEach(function (h, i) { h.x = i % 2 ? W * 0.8 : W * 0.2; h.y = i < 2 ? H * 0.2 : H * 0.82; h.r = u * 0.2; });
    }
    function build() {
      var rect = host.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!sprites.length) sprites = COL.map(sprite);
      measure();
      var n = W < 700 ? 360 : W < 1100 ? 640 : 880; pts = [];
      for (var i = 0; i < n; i++) {
        var p = { c: i % 4, s: 2.2 + Math.random() * 3.2, ph: Math.random() * 6.28, x: 0, y: 0, vx: 0, vy: 0, life: 0, span: 0 };
        edgeSpawn(p); p.x = Math.random() * W; p.y = Math.random() * H; p.life = Math.random() * p.span;
        pts.push(p);
      }
      if (reduced) { t = 11; for (var k = 0; k < 400; k++) advance(1 / 30, true); }
      draw(); return true;
    }
    // the loop: scattered signal enters, the field bends and groups it, clusters clear, then dissolve
    function pull(tt) {
      var u = tt % T;
      if (u < 3) return 0; if (u < 9) return (u - 3) / 6; if (u < 15) return 1; if (u < 19) return 1 - (u - 15) / 4; return 0;
    }
    function advance(dt, quiet) {
      t += dt;
      if (mouse.on) { mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 12); mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 12); }
      mouse.k += ((mouse.on ? 1 : 0) - mouse.k) * Math.min(1, dt * 3);
      var k = pull(t), ks = k * k * (3 - 2 * k), i;
      for (i = 0; i < pts.length; i++) {
        var p = pts[i], h = hubs[p.c];
        p.life += dt;
        // a slow flow field, so the loose signal moves with purpose rather than jitter
        var fx = Math.sin(p.y * 0.006 + t * 0.19 + p.ph) * 9 + Math.sin(p.x * 0.004 - t * 0.13) * 6, fy = Math.cos(p.x * 0.005 + t * 0.17 + p.ph) * 8 + Math.cos(p.y * 0.0045 + t * 0.11) * 5;
        p.vx += fx * dt * (1.6 - ks); p.vy += fy * dt * (1.6 - ks);
        // the model field: similar particles gather around their hub, with a gentle swirl once they are close
        var dx = h.x + Math.sin(t * 0.23 + h.ph) * h.r * 0.25 - p.x, dy = h.y + Math.cos(t * 0.2 + h.ph) * h.r * 0.2 - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        var g = ks * (d > h.r ? 42 : 42 * (d / h.r) * 0.6 + 6);
        p.vx += dx / d * g * dt; p.vy += dy / d * g * dt;
        if (d < h.r * 1.2) { p.vx += -dy / d * 10 * ks * dt; p.vy += dx / d * 10 * ks * dt; }
        // the cursor is a small local disturbance; the field reorganises around it and settles
        if (mouse.k > 0.02) { var mx = p.x - mouse.x, my = p.y - mouse.y, md = Math.sqrt(mx * mx + my * my) || 1; if (md < 150) { var f = (1 - md / 150) * 380 * mouse.k; p.vx += mx / md * f * dt; p.vy += my / md * f * dt; } }
        var damp = Math.pow(0.28 + 0.4 * (1 - ks), dt); p.vx *= damp; p.vy *= damp;
        var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy), cap = 26 + 60 * ks + 90 * mouse.k; if (sp > cap) { p.vx *= cap / sp; p.vy *= cap / sp; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.life > p.span || p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) edgeSpawn(p);
      }
      if (quiet) return;
      // the status line: one word brightens at a time, slowly
      wordT += dt;
      var target = k > 0.4 ? Math.floor(((t % T) - 3) / 3.2) % 4 : -1;
      if (target !== wordAt && wordT > 1.5) { wordAt = target; wordT = 0; words.forEach(function (w, n) { w.classList.toggle("on", n === wordAt); }); }
    }
    function bucket() { grid = {}; for (var i = 0; i < pts.length; i++) { var p = pts[i], key = ((p.x / GC) | 0) + "," + ((p.y / GC) | 0); (grid[key] || (grid[key] = [])).push(i); } }
    function calm(x, y) {          // how much to dim near the name
      if (!box) return 1;
      var dx = Math.max(box.x0 - 40 - x, 0, x - box.x1 - 40), dy = Math.max(box.y0 - 30 - y, 0, y - box.y1 - 30), d = Math.sqrt(dx * dx + dy * dy);
      return d === 0 ? 0.12 : Math.min(1, 0.12 + d / 160);
    }
    function draw() {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#04060d"; ctx.fillRect(0, 0, W, H);
      var k = pull(t), ks = k * k * (3 - 2 * k), i, j;
      // a faint contour field that bends around each formed cluster
      if (ks > 0.05) for (i = 0; i < hubs.length; i++) {
        var h = hubs[i], c = COL[i];
        for (var ring = 1; ring <= 3; ring++) {
          ctx.beginPath();
          for (var a = 0; a <= 40; a++) { var an = a / 40 * 6.2832, rr = h.r * (0.55 + ring * 0.38) * (1 + Math.sin(an * 3 + t * 0.5 + h.ph) * 0.09 + Math.sin(an * 5 - t * 0.3) * 0.05); var px = h.x + Math.cos(an) * rr, py = h.y + Math.sin(an) * rr * 0.86; if (a) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
          ctx.closePath(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (0.11 * ks / ring * calm(h.x, h.y)).toFixed(3) + ")"; ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "lighter";
      // fine strands only inside active neighbourhoods
      if (ks > 0.35) {
        bucket();
        for (i = 0; i < pts.length; i++) {
          var p = pts[i], hb = hubs[p.c]; if (Math.hypot(p.x - hb.x, p.y - hb.y) > hb.r * 1.1) continue;
          var gx = (p.x / GC) | 0, gy = (p.y / GC) | 0, col = COL[p.c];
          for (var ox = 0; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) {
            if (ox === 0 && oy < 0) continue; var cell = grid[(gx + ox) + "," + (gy + oy)]; if (!cell) continue;
            for (var n = 0; n < cell.length; n++) { j = cell[n]; if (j <= i && ox === 0 && oy === 0) continue; var q = pts[j]; if (q.c !== p.c) continue; var d = Math.hypot(p.x - q.x, p.y - q.y); if (d > 34) continue;
              ctx.strokeStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + (0.34 * (1 - d / 26) * (ks - 0.35) / 0.65 * calm(p.x, p.y)).toFixed(3) + ")"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
          }
        }
      }
      for (i = 0; i < pts.length; i++) {
        var pp = pts[i], hh = hubs[pp.c], dd = Math.hypot(pp.x - hh.x, pp.y - hh.y), near = Math.max(0, 1 - dd / (hh.r * 1.4));
        var fade = Math.min(1, pp.life * 0.8, (pp.span - pp.life) * 0.8), al = (0.34 + 0.6 * near * ks) * fade * calm(pp.x, pp.y), size = pp.s * (3.4 + near * ks * 2.6);
        if (al < 0.02) continue;
        ctx.globalAlpha = al; ctx.drawImage(sprites[pp.c], pp.x - size / 2, pp.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    function frame(ts) {
      if (!running || offscreen) { last = 0; return; }
      if (!last) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.05); last = ts;
      if (dt > 0) { advance(dt); draw(); }
      window.requestAnimationFrame(frame);
    }
    host.addEventListener("pointermove", function (ev) { var rect = host.getBoundingClientRect(); mouse.tx = ev.clientX - rect.left; mouse.ty = ev.clientY - rect.top; if (!mouse.on) { mouse.x = mouse.tx; mouse.y = mouse.ty; } mouse.on = true; });
    host.addEventListener("pointerleave", function () { mouse.on = false; });
    var timer;
    function fit() { window.clearTimeout(timer); timer = window.setTimeout(function () { var rect = host.getBoundingClientRect(); if (Math.abs(rect.width - W) > 1 || Math.abs(rect.height - H) > 1) build(); else measure(); }, 160); }
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(host); else window.addEventListener("resize", fit);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (entries) { var was = offscreen; offscreen = !entries[0].isIntersecting; if (was && !offscreen && running) { last = 0; window.requestAnimationFrame(frame); } }).observe(host);
    build();
    if (running) window.requestAnimationFrame(frame);
    host.__kick = function () { last = 0; if (running) window.requestAnimationFrame(frame); };
  }

  document.addEventListener("DOMContentLoaded", function () {
    nav();
    joinForm();
    planner();
    var heroEl = document.querySelector("[data-hero]");
    if (heroEl && (heroEl.getAttribute("data-hero") === "plasma" || location.hash === "#plasma")) { heroEl.setAttribute("data-hero", "plasma"); hero(); } else heroWall();
    reveal();
    document.querySelectorAll("[data-email]").forEach(function (el) {
      el.textContent = LAB_EMAIL;
      if (el.tagName === "A") el.setAttribute("href", "mailto:" + LAB_EMAIL);
    });
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  });
})();
