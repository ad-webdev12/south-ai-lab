/* South Artificial Intelligence Laboratory
   1. navigation
   2. join form (builds an email, preselects a group from the URL)
   3. resources planner (progress saved in this browser)
   4. hero flow field */

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

    function pickGroup() {
      var m = /^#join-([a-z-]+)$/.exec(window.location.hash);
      if (!m) return;
      var opt = form.querySelector('select[name="group"] option[data-key="' + m[1] + '"]');
      if (opt) opt.selected = true;
    }
    pickGroup();
    window.addEventListener("hashchange", pickGroup);

    // a project idea is only required for the Applied Research Division
    var trackSel = form.querySelector('select[name="track"]');
    var idea = form.querySelector('textarea[name="statement"]');
    function syncIdea() {
      var chosen = trackSel.options[trackSel.selectedIndex];
      idea.required = chosen.getAttribute("data-key") === "division";
    }
    trackSel.addEventListener("change", syncIdea);
    syncIdea();

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var v = function (k) { return (d.get(k) || "").toString().trim(); };
      var body = [
        "Name: " + v("name"),
        "School email: " + v("email"),
        "Grade: " + v("grade"),
        "Track: " + v("track"),
        "Group I'm interested in: " + v("group"),
        "Experience: " + (v("experience") || "none yet"),
        "",
        "What I'd like to work on:",
        v("statement") || "(left blank)"
      ].join("\n");
      var href = "mailto:" + LAB_EMAIL +
        "?subject=" + encodeURIComponent("Joining SAIL: " + v("name")) +
        "&body=" + encodeURIComponent(body);
      var status = form.querySelector(".fstatus");
      if (status) {
        status.classList.add("show");
        status.innerHTML = "Your email app should now be open with a message ready to go. <strong>Press send there to finish.</strong> " +
          "If nothing opened, email the same details to <strong>" + LAB_EMAIL + "</strong>.";
      }
      window.location.href = href;
    });
  }

  /* ---------------- 3. planner ---------------- */
  function planner() {
    var boxes = document.querySelectorAll("input[data-res]");
    if (!boxes.length) return;
    var KEY = "sail-planner-v2";
    var done = {};
    try { done = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { done = {}; }

    function save() { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} }

    function refresh() {
      var total = 0, finished = 0;
      document.querySelectorAll("[data-stage]").forEach(function (stage) {
        var inputs = stage.querySelectorAll("input[data-res]");
        var n = 0;
        inputs.forEach(function (i) { if (i.checked) n++; });
        total += inputs.length; finished += n;
        var out = stage.querySelector("[data-stage-count]");
        if (out) out.textContent = n + " of " + inputs.length + " done";
      });
      var bar = document.querySelector("[data-progress]");
      var label = document.querySelector("[data-progress-label]");
      if (bar) { bar.max = total; bar.value = finished; }
      if (label) label.textContent = finished + " of " + total + " resources finished";
    }

    boxes.forEach(function (box) {
      var id = box.getAttribute("data-res");
      box.checked = !!done[id];
      box.closest("li").classList.toggle("done", box.checked);
      box.addEventListener("change", function () {
        if (box.checked) done[id] = 1; else delete done[id];
        box.closest("li").classList.toggle("done", box.checked);
        save(); refresh();
      });
    });

    var reset = document.querySelector("[data-reset]");
    if (reset) {
      reset.addEventListener("click", function () {
        done = {}; save();
        boxes.forEach(function (b) { b.checked = false; b.closest("li").classList.remove("done"); });
        refresh();
      });
    }
    refresh();
  }

  /* ---------------- 4. hero flow field ----------------
     Particles are carried through a slowly changing vector field. Each one
     remembers where it has been for the last few seconds, and that history is
     drawn as a tapered line, so the streamlines of the field become visible.
     The pointer adds a local swirl; when it leaves, the flow settles back.
     A click sends out a ring that pushes particles outward as it passes. */
  function hero() {
    var host = document.querySelector("[data-hero]");
    var canvas = document.querySelector("[data-field]");
    if (!host || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var pauseBtn = document.querySelector("[data-pause]");
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var TONES = ["152,188,234", "104,148,210", "222,134,96"];
    var WIDTHS = [1.1, 1.0, 1.5];
    var BANDS = [0.07, 0.16, 0.30, 0.52];      // opacity from tail to head
    var HIST = 40, SAMPLE = 0.085;             // 40 samples, one every 85 ms: about 3.4 s of trail
    var W = 0, H = 0, dpr = 1, t = 0, sinceSample = 0;
    var parts = [], pulses = [];
    var mouse = { x: 0, y: 0, tx: 0, ty: 0, on: false, k: 0 };
    var running = !reduced, offscreen = false, last = 0, slow = 0;

    function angle(x, y) {
      return 0.62 * Math.sin(x * 0.0042 + t * 0.13) * Math.cos(y * 0.0057 - t * 0.09) +
             0.36 * Math.sin((x + y) * 0.0026 + t * 0.07);
    }

    function spawn(p, anywhere) {
      p.x = anywhere ? Math.random() * W : -8;
      p.y = Math.random() * H;
      p.n = 0; p.head = 0;                     // empty history, so no line is drawn across the jump
      p.dying = false;
      p.life = 7 + Math.random() * 10;
      return p;
    }

    function build() {
      var rect = host.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;   // not laid out yet; the observer will call again
      dpr = Math.min(window.devicePixelRatio || 1, rect.width > 900 ? 1.25 : 2);
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      var n = Math.round(Math.min(420, Math.max(160, (W * H) / 3000)));
      parts = [];
      for (var i = 0; i < n; i++) {
        var r = Math.random();
        parts.push(spawn({
          hx: new Float32Array(HIST), hy: new Float32Array(HIST),
          speed: 46 + Math.random() * 44, tone: r < 0.07 ? 2 : (r < 0.52 ? 1 : 0)
        }, true));
      }
      for (var s = 0; s < 260; s++) advance(1 / 60);   // fill the trails before the first frame
      draw();
      return true;
    }

    function advance(dt) {
      t += dt;
      if (mouse.on) {
        mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 9);
        mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 9);
      }
      mouse.k += ((mouse.on ? 1 : 0) - mouse.k) * Math.min(1, dt * (mouse.on ? 6 : 1.5));
      for (var q = pulses.length - 1; q >= 0; q--) {
        pulses[q].age += dt;
        if (pulses[q].age > 1.2) pulses.splice(q, 1);
      }
      sinceSample += dt;
      var record = sinceSample >= SAMPLE;
      if (record) sinceSample = 0;

      var R = 210;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.dying) {                           // let the tail shrink away before the particle comes back
          if (record && --p.n < 2) spawn(p, Math.random() < 0.3);
          continue;
        }
        var a = angle(p.x, p.y);
        var vx = Math.cos(a) * p.speed, vy = Math.sin(a) * p.speed;

        if (mouse.k > 0.01) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y;
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          if (d < R) {
            var f = 1 - d / R; f = f * f * mouse.k;
            vx += (-dy / d) * 190 * f + (dx / d) * 85 * f;
            vy += (dx / d) * 190 * f + (dy / d) * 85 * f;
          }
        }
        for (var k = 0; k < pulses.length; k++) {
          var pu = pulses[k];
          var ex = p.x - pu.x, ey = p.y - pu.y;
          var ed = Math.sqrt(ex * ex + ey * ey) || 1;
          var off = Math.abs(ed - pu.age * 430);
          if (off < 85) {
            var g = (1 - off / 85) * (1 - pu.age / 1.2) * 320;
            vx += (ex / ed) * g; vy += (ey / ed) * g;
          }
        }

        p.x += vx * dt; p.y += vy * dt;
        p.life -= dt;
        if (record) {
          p.hx[p.head] = p.x; p.hy[p.head] = p.y;
          p.head = (p.head + 1) % HIST;
          if (p.n < HIST) p.n++;
        }
        if (p.life <= 0 || p.x > W + 60 || p.x < -60 || p.y < -60 || p.y > H + 60) {
          p.dying = true;
        }
      }
    }

    // Trails are drawn in four opacity bands, oldest to newest. Sample index 0 is
    // the oldest point a particle still remembers; a young particle has fewer
    // samples, and they are treated as the newest ones.
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var per = HIST / BANDS.length;
      for (var tone = 0; tone < 3; tone++) {
        ctx.lineWidth = WIDTHS[tone];
        for (var b = 0; b < BANDS.length; b++) {
          var lastBand = b === BANDS.length - 1;
          ctx.strokeStyle = "rgba(" + TONES[tone] + "," + BANDS[b] + ")";
          ctx.beginPath();
          for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            if (p.tone !== tone || p.n < 2) continue;
            var missing = HIST - p.n;
            var from = Math.max(0, Math.floor(b * per) - missing);
            var to = Math.min(p.n - 1, Math.floor((b + 1) * per) - missing);
            if (to < 0 || (to <= from && !lastBand)) continue;
            var base = (p.head - p.n + HIST) % HIST;
            var j0 = (base + from) % HIST;
            ctx.moveTo(p.hx[j0], p.hy[j0]);
            for (var s = from + 1; s <= to; s++) {
              var j = (base + s) % HIST;
              ctx.lineTo(p.hx[j], p.hy[j]);
            }
            if (lastBand) ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }
      }
    }

    function frame(ts) {
      if (!running || offscreen) { last = 0; return; }
      if (!last) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      // on a machine that can't keep up, carry fewer particles
      slow = dt > 0.04 ? slow + 1 : Math.max(0, slow - 2);
      if (slow > 40 && parts.length > 120) { parts.length = Math.round(parts.length * 0.7); slow = 0; }
      if (dt > 0) { advance(dt); draw(); }
      window.requestAnimationFrame(frame);
    }

    function setRunning(on) {
      running = on;
      if (pauseBtn) {
        pauseBtn.textContent = on ? "Pause animation" : "Play animation";
      }
      if (on) { last = 0; window.requestAnimationFrame(frame); }
    }

    host.addEventListener("pointermove", function (ev) {
      if (ev.pointerType === "touch") return;
      var rect = host.getBoundingClientRect();
      mouse.tx = ev.clientX - rect.left; mouse.ty = ev.clientY - rect.top;
      if (!mouse.on) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      mouse.on = true;
    });
    host.addEventListener("pointerleave", function () { mouse.on = false; });
    host.addEventListener("pointerdown", function (ev) {
      if (ev.target.closest("a,button,summary")) return;
      var rect = host.getBoundingClientRect();
      pulses.push({ x: ev.clientX - rect.left, y: ev.clientY - rect.top, age: 0 });
      if (pulses.length > 4) pulses.shift();
    });

    if (pauseBtn) pauseBtn.addEventListener("click", function () { setRunning(!running); });

    // Rebuild whenever the hero itself changes size: window resizes, a late
    // layout, or the web font arriving and changing the height of the heading.
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
        var was = offscreen;
        offscreen = !entries[0].isIntersecting;
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
