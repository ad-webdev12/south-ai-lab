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
  function hero() {
    var host = document.querySelector("[data-hero]");
    var canvas = document.querySelector("[data-field]");
    if (!host || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var pauseBtn = document.querySelector("[data-pause]");
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var W = 0, H = 0, dpr = 1, t = 0, orbs = [], sprite = null;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0, on: false, k: 0 };
    var running = !reduced, offscreen = false, last = 0, slow = 0, strands = 2;

    function makeSprite() {
      var s = document.createElement("canvas"); s.width = s.height = 256;
      var g = s.getContext("2d"), grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, "rgba(255,245,255,1)");
      grad.addColorStop(0.08, "rgba(255,190,250,0.95)");
      grad.addColorStop(0.22, "rgba(196,110,255,0.55)");
      grad.addColorStop(0.5, "rgba(96,70,255,0.18)");
      grad.addColorStop(1, "rgba(40,30,160,0)");
      g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
      return s;
    }

    function build() {
      var rect = host.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      dpr = Math.min(window.devicePixelRatio || 1, rect.width > 900 ? 1.25 : 2);
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      if (!sprite) sprite = makeSprite();
      var n = W < 700 ? 5 : 8, unit = Math.min(W, H);
      orbs = [];
      for (var i = 0; i < n; i++) {
        var o = { x: W * (0.08 + 0.84 * Math.random()), y: H * (0.1 + 0.8 * Math.random()),
                  vx: (Math.random() - 0.5) * 34, vy: (Math.random() - 0.5) * 26,
                  r: unit * (0.035 + Math.random() * 0.03), ph: Math.random() * 100, arms: [] };
        for (var a = 0; a < 6; a++) o.arms.push({ ang: a / 6 * 6.2832 + Math.random(), len: unit * (0.16 + Math.random() * 0.14), ph: Math.random() * 100 });
        orbs.push(o);
      }
      draw();
      return true;
    }

    function advance(dt) {
      t += dt;
      if (mouse.on) { mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 10); mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 10); }
      mouse.k += ((mouse.on ? 1 : 0) - mouse.k) * Math.min(1, dt * 4);
      for (var i = 0; i < orbs.length; i++) {
        var o = orbs[i];
        o.vx += Math.sin(t * 0.21 + o.ph) * 4 * dt; o.vy += Math.cos(t * 0.17 + o.ph * 1.3) * 4 * dt;
        for (var j = 0; j < orbs.length; j++) {
          if (j === i) continue;
          var dx = o.x - orbs[j].x, dy = o.y - orbs[j].y, d = Math.sqrt(dx * dx + dy * dy) || 1, min = (o.r + orbs[j].r) * 2.4;
          if (d < min) { o.vx += dx / d * (min - d) * 1.6 * dt; o.vy += dy / d * (min - d) * 1.6 * dt; }
        }
        if (mouse.k > 0.05) {
          var mx = mouse.x - o.x, my = mouse.y - o.y, md = Math.sqrt(mx * mx + my * my) || 1;
          if (md < 420 && md > 90) { o.vx += mx / md * 22 * mouse.k * dt; o.vy += my / md * 22 * mouse.k * dt; }
        }
        var sp = Math.sqrt(o.vx * o.vx + o.vy * o.vy);
        if (sp > 46) { o.vx *= 46 / sp; o.vy *= 46 / sp; }
        o.x += o.vx * dt; o.y += o.vy * dt;
        if (o.x < o.r) { o.x = o.r; o.vx = Math.abs(o.vx); } if (o.x > W - o.r) { o.x = W - o.r; o.vx = -Math.abs(o.vx); }
        if (o.y < o.r) { o.y = o.r; o.vy = Math.abs(o.vy); } if (o.y > H - o.r) { o.y = H - o.r; o.vy = -Math.abs(o.vy); }
      }
    }

    // one filament from a to b: a smooth writhing curve, drawn three times for the glow
    function bolt(ax, ay, bx, by, alpha, seed, fork) {
      var dx = bx - ax, dy = by - ay, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 4 || alpha < 0.02) return;
      var nx = -dy / d, ny = dx / d, N = Math.max(10, Math.min(30, Math.round(d / 22))), amp = Math.min(70, d * 0.13), pts = [];
      for (var i = 0; i <= N; i++) {
        var u = i / N, env = Math.sin(Math.PI * u);
        var off = env * amp * (Math.sin(u * 7 + t * 1.7 + seed) * 0.6 + Math.sin(u * 15 - t * 2.6 + seed * 2.1) * 0.3 + Math.sin(u * 31 + t * 4.1 + seed * 0.7) * 0.12);
        pts.push([ax + dx * u + nx * off, ay + dy * u + ny * off]);
      }
      var passes = [[16, "96,84,255", 0.10], [5, "208,128,255", 0.32], [1.5, "255,238,255", 1]];
      for (var p = 0; p < 3; p++) {
        ctx.lineWidth = passes[p][0]; ctx.strokeStyle = "rgba(" + passes[p][1] + "," + (passes[p][2] * alpha).toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
        ctx.stroke();
      }
      if (fork) {
        var m = pts[Math.round(N * 0.58)], ang = Math.atan2(dy, dx) + Math.sin(t * 0.9 + seed) * 0.9 + 0.6, L = d * 0.22;
        bolt(m[0], m[1], m[0] + Math.cos(ang) * L, m[1] + Math.sin(ang) * L, alpha * 0.55, seed + 9, false);
      }
    }

    function draw() {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#04020c"; ctx.fillRect(0, 0, W, H);
      var bg = ctx.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, Math.max(W, H) * 0.75);
      bg.addColorStop(0, "rgba(72,28,150,0.6)"); bg.addColorStop(0.55, "rgba(24,12,80,0.4)"); bg.addColorStop(1, "rgba(4,2,12,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      var reach = Math.min(W, H) * 0.62, i, j;
      for (i = 0; i < orbs.length; i++) {
        var o = orbs[i];
        for (var a = 0; a < o.arms.length; a++) {
          var arm = o.arms[a], ang = arm.ang + t * 0.05 + Math.sin(t * 0.31 + arm.ph) * 0.7, len = arm.len * (0.75 + 0.25 * Math.sin(t * 0.5 + arm.ph));
          bolt(o.x, o.y, o.x + Math.cos(ang) * len, o.y + Math.sin(ang) * len, 0.30, arm.ph, false);
        }
        for (j = i + 1; j < orbs.length; j++) {
          var q = orbs[j], d = Math.hypot(o.x - q.x, o.y - q.y);
          if (d < reach) { var al = Math.pow(1 - d / reach, 1.35); for (var s = 0; s < strands; s++) bolt(o.x, o.y, q.x, q.y, al, i * 7 + j * 3 + s * 11, s === 0); }
        }
        if (mouse.k > 0.03) {
          var md = Math.hypot(o.x - mouse.x, o.y - mouse.y), mr = Math.min(W, H) * 0.7;
          if (md < mr) { var ma = Math.pow(1 - md / mr, 1.1) * mouse.k; bolt(o.x, o.y, mouse.x, mouse.y, ma * 1.15, i * 5 + 40, true); bolt(o.x, o.y, mouse.x, mouse.y, ma * 0.7, i * 5 + 71, false); }
        }
      }
      for (i = 0; i < orbs.length; i++) {
        var ob = orbs[i], size = ob.r * (12 + Math.sin(t * 1.3 + ob.ph) * 1.4);
        ctx.globalAlpha = 0.95; ctx.drawImage(sprite, ob.x - size / 2, ob.y - size / 2, size, size);
      }
      if (mouse.k > 0.03) { var ms = 150 * mouse.k; ctx.globalAlpha = 0.9 * mouse.k; ctx.drawImage(sprite, mouse.x - ms / 2, mouse.y - ms / 2, ms, ms); }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }

    function frame(ts) {
      if (!running || offscreen) { last = 0; return; }
      if (!last) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      slow = dt > 0.04 ? slow + 1 : Math.max(0, slow - 2);
      if (slow > 40 && strands > 1) { strands = 1; slow = 0; }      // slower machines get one strand per pair
      if (dt > 0) { advance(dt); draw(); }
      window.requestAnimationFrame(frame);
    }
    function setRunning(on) {
      running = on;
      if (pauseBtn) pauseBtn.textContent = on ? "Pause animation" : "Play animation";
      if (on) { last = 0; window.requestAnimationFrame(frame); }
    }

    host.addEventListener("pointermove", function (ev) {
      var rect = host.getBoundingClientRect();
      mouse.tx = ev.clientX - rect.left; mouse.ty = ev.clientY - rect.top;
      if (!mouse.on) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      mouse.on = true;
      if (!running) { mouse.k = 1; mouse.x = mouse.tx; mouse.y = mouse.ty; draw(); }
    });
    host.addEventListener("pointerleave", function () { mouse.on = false; });
    if (pauseBtn) pauseBtn.addEventListener("click", function () { setRunning(!running); });

    var timer;
    function fit() {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        var rect = host.getBoundingClientRect();
        if (Math.abs(rect.width - W) > 1 || Math.abs(rect.height - H) > 1) build();
      }, 160);
    }
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(host);
    else window.addEventListener("resize", fit);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var was = offscreen; offscreen = !entries[0].isIntersecting;
        if (was && !offscreen && running) { last = 0; window.requestAnimationFrame(frame); }
      }).observe(host);
    }
    build();
    setRunning(running);
  }

  document.addEventListener("DOMContentLoaded", function () {
    nav();
    joinForm();
    planner();
    hero();
    document.querySelectorAll("[data-email]").forEach(function (el) {
      el.textContent = LAB_EMAIL;
      if (el.tagName === "A") el.setAttribute("href", "mailto:" + LAB_EMAIL);
    });
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  });
})();
