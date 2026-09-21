/* South Artificial Intelligence Laboratory: the Ethics hero.
   "I made a profile of you." The robot shows the visitor a profile built only from what
   memory.js recorded in this browser: pages opened, time spent, clicks, what the robot
   was taught on the Agents page. The visitor can ask for the evidence, say it is wrong,
   read every stored byte, and delete it. Nothing is sent anywhere.

   The camera is off until the visitor turns it on. Frames go from the camera to a face
   landmark model running in this tab (MediaPipe, loaded on demand) and are never stored
   or sent. The points are real measurements. The labels marked "guess" are invented on
   purpose, to show how easily a system attaches confident claims to a face. */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL || !SAIL.Bot) return;
  var U = SAIL.util, clamp = U.clamp, dot = SAIL.dot, glow = SAIL.glow, TEAL = SAIL.TEAL, WARM = SAIL.WARM, INK = SAIL.INK;
  var MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
  var MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
  var TOPICS = { agents: "AI agents", nlp: "Language models", vision: "Computer vision", "neural-networks": "Neural networks", "data-science": "Data science", society: "AI ethics", research: "Research groups",
                 learn: "Learning to code", materials: "Learning to code", resources: "Learning to code", "project-guide": "Building a project", reading: "AI safety reading", projects: "Student projects", people: "Who runs this", join: "Joining", news: "Club news", opportunities: "Programs and contests" };
  var cam = { stream: null, video: null, lm: null, cls: null, loading: false, failed: false, pts: null, frames: 0, last: 0, guess: null, guessT: 0 };   // survives a resize

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function infer(mem) {
    var score = {}, secs = 0, views = 0;
    Object.keys(mem.pages).forEach(function (p) { var t = TOPICS[p]; secs += mem.pages[p].sec; views += mem.pages[p].n; if (!t) return; score[t] = (score[t] || 0) + mem.pages[p].n * 2 + mem.pages[p].sec / 10; });
    Object.keys(mem.navHover).forEach(function (p) { var t = TOPICS[p]; if (t) score[t] = (score[t] || 0) + mem.navHover[p] * 1.5; });
    if (mem.clicks.letters || mem.feedback) score["AI agents"] = (score["AI agents"] || 0) + mem.clicks.letters * 0.3 + mem.feedback * 1.5;
    if (mem.typed && mem.typed.length) score["Language models"] = (score["Language models"] || 0) + mem.typed.length * 2;
    var evidence = views + mem.clicks.total / 4 + mem.feedback * 2, top = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; }).slice(0, 3), mx = top.length ? score[top[0]] : 1;
    var strength = clamp(evidence / 22, 0.25, 1);
    var tags = [], rate = mem.clicks.total / Math.max(20, secs);
    if (mem.clicks.total > 15 && rate > 0.22) tags.push("Rapid clicker");
    if (mem.clicks.controls + mem.clicks.letters + mem.clicks.robot > 6) tags.push("Explores interactive elements");
    if (secs > 90 && rate < 0.08) tags.push("Reads before clicking");
    if (mem.torment > 20) tags.push("Torments robots"); else if (mem.feedback > 2) tags.push("Patient with robots");
    if (mem.views > 4 && window.SAILMemory.returning) tags.push("Came back for more");
    if (mem.pages.join) tags.push("Thinking about joining");
    if (!tags.length) tags.push("Just got here");
    return { interests: top.map(function (t) { return { name: t, pct: Math.round(clamp(28 + 67 * score[t] / mx * strength, 5, 96)) }; }), tags: tags.slice(0, 4), conf: Math.round(clamp(24 + evidence * 2.4, 24, 93)), secs: secs, views: views };
  }

  SAIL.scenes.society = function (S, root, repaint) {
    var M = window.SAILMemory, mem = M.data(), wide = S.W >= 980, bar = root.querySelector(".ghero-bar"), camBtn = root.querySelector('[data-act="camera"]');
    var R = wide ? 40 : 30, floorY = bar ? bar.offsetTop + 20 : S.H - 120, chips = new SAIL.Chips(root);
    var old = root.querySelector(".pcard"); if (old) old.parentNode.removeChild(old);
    var card = document.createElement("div"); card.className = "pcard"; (wide ? chips.ui : root.querySelector(".ghero-in")).appendChild(card);
    var bot = new SAIL.Bot(R, S.W + R * 3, S.H * 0.5), clock = 0, view = { why: false, all: false, verdict: mem.verdict, conf: 0, confTo: 0, asked: false }, shred = null, stranger = false, sinceRender = 0;

    function say(t, ms) { chips.only("say", t, ms || 2400, function () { return { x: bot.x, y: bot.y - R * 2.9 }; }); }
    function render() {
      var p = infer(mem), RL = SAIL.RL, learned = [];
      if (RL) RL.STATES.forEach(function (s) { var row = mem.q[s] || {}; Object.keys(row).forEach(function (a) { if (row[a].n) learned.push({ a: a, v: row[a].v }); }); });
      learned.sort(function (a, b) { return Math.abs(b.v) - Math.abs(a.v); });
      view.confTo = stranger ? 0 : view.verdict === "wrong" ? 9 : p.conf;
      var h = '<p class="pc-k">Profile <span>visitor ' + (stranger ? "unknown" : "#" + (mem.first % 65536).toString(16)) + "</span></p>";
      if (stranger) h += '<p class="pc-empty">No data. I do not know who you are.</p><p class="pc-note">Everything was deleted. It starts again from zero as you keep browsing.</p>';
      else {
        h += '<h2 class="pc-h">Likely interests</h2><ul class="pc-bars' + (view.verdict === "wrong" ? " off" : "") + '">' + (p.interests.length ? p.interests.map(function (i) { return "<li><span>" + esc(i.name) + '</span><i style="--p:' + i.pct + '%"></i><b>' + i.pct + "%</b></li>"; }).join("") : "<li><span>Not enough yet</span></li>") + "</ul>";
        h += '<h2 class="pc-h">Behavior</h2><p class="pc-tags">' + p.tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</p>";
      }
      h += '<p class="pc-conf">Confidence <b data-conf>' + Math.round(view.conf) + "%</b></p>";
      h += '<p class="pc-note">Based only on how you used this website. Nothing leaves your browser.</p>';
      if (view.verdict === "wrong") h += '<p class="pc-lesson">A confident prediction is not necessarily a correct one.</p>';
      if (view.verdict === "right") h += '<p class="pc-lesson">Right this time, from ' + mem.clicks.total + " clicks and " + p.views + " page views. It would have sounded just as sure if it were wrong.</p>";
      if (cam.stream) h += '<p class="pc-cam">Camera on. Frames analysed: <b data-frames>' + cam.frames + "</b>. Stored: 0. Sent: 0.</p>";
      if (!stranger) {
        h += '<div class="pc-row"><button type="button" data-p="why" aria-expanded="' + view.why + '">Why did you infer this?</button>' + (view.verdict ? "" : '<span class="pc-q">Was I right? <button type="button" data-p="yes">Yes</button><button type="button" data-p="no">No</button></span>') + "</div>";
        if (view.why) {
          var ev = Object.keys(mem.pages).sort(function (a, b) { return mem.pages[b].sec - mem.pages[a].sec; }).slice(0, 5).map(function (k) { return "Opened " + esc(k) + " " + mem.pages[k].n + "×, about " + mem.pages[k].sec + " sec"; });
          if (mem.clicks.letters) ev.push("Knocked down " + mem.clicks.letters + " letters on Agents"); if (mem.clicks.robot) ev.push("Clicked the robot " + mem.clicks.robot + "×");
          if (mem.feedback) ev.push("Answered the robot " + mem.feedback + "×, total reward " + (mem.reward > 0 ? "+" : "") + mem.reward);
          Object.keys(mem.navHover).slice(0, 3).forEach(function (k) { ev.push("Hovered the " + esc(k) + " link " + mem.navHover[k] + "×"); });
          if (mem.typed && mem.typed.length) ev.push("Typed on Language: “" + esc(mem.typed[mem.typed.length - 1]) + "”");
          h += '<ul class="pc-ev">' + ev.map(function (e) { return "<li>" + e + "</li>"; }).join("") + "</ul>";
        }
        if (learned.length) {
          h += '<h2 class="pc-h">I learned this from you</h2><p class="pc-tags">' + learned.slice(0, 4).map(function (l) { return "<span>" + l.a + " " + (l.v >= 0 ? "+" : "") + l.v.toFixed(2) + "</span>"; }).join("") + '</p><p class="pc-note">Stored interaction history: ' + mem.events.length + " events.</p>";
          if (!view.asked) h += '<p class="pc-ask">Should a system keep behavior data just because it makes it more personal? <button type="button" data-p="keep">Keep</button><button type="button" data-p="forget">Delete</button></p>';
        }
      }
      h += '<div class="pc-row pc-mem">' + (stranger ? "" : '<button type="button" data-p="forget">Forget this</button>') + '<button type="button" data-p="all" aria-expanded="' + view.all + '">Show everything you stored</button></div>';
      if (view.all) h += '<pre class="pc-raw" tabindex="0">' + esc(JSON.stringify(mem, null, 1)) + "</pre>";
      card.innerHTML = h;
    }
    card.addEventListener("click", function (ev) {
      var b = ev.target.closest("button[data-p]"); if (!b) return; var p = b.getAttribute("data-p");
      if (p === "why") view.why = !view.why;
      else if (p === "all") view.all = !view.all;
      else if (p === "yes") { view.verdict = mem.verdict = "right"; bot.mood.joy = 1; window.setTimeout(function () { bot.mood.joy = 0; }, 1500); M.log("verdict", "right"); M.save(); }
      else if (p === "no") { view.verdict = mem.verdict = "wrong"; bot.mood.wide = 1; bot.freeze = 0.5; say("oh."); window.setTimeout(function () { bot.mood.wide = 0; bot.mood.lid = 0.4; }, 900); window.setTimeout(function () { bot.mood.lid = 0; }, 3000); M.log("verdict", "wrong"); M.save(); }
      else if (p === "keep") { view.asked = true; bot.mood.joy = 0.8; say("kept. you can change your mind."); window.setTimeout(function () { bot.mood.joy = 0; }, 1500); M.log("consent", "keep"); M.save(); }
      else if (p === "forget" && !shred) { view.asked = true; shred = { t: 0, cards: [], strips: [] }; bot.mood.lid = 0.5; say("...if I have to.", 2000); }
      render();
    });
    render(); M.log("opened", "profile");

    /* ---- camera ---- */
    function setCamLabel() { if (camBtn) camBtn.textContent = cam.stream ? "Turn off camera" : "Turn on camera"; }
    function status(t) { var s = root.querySelector("[data-status]"); if (s) s.textContent = t; }
    function camOff() { if (cam.stream) cam.stream.getTracks().forEach(function (t) { t.stop(); }); if (cam.video && cam.video.parentNode) cam.video.parentNode.removeChild(cam.video); cam.stream = null; cam.video = null; cam.pts = null; root.classList.remove("cam-on"); setCamLabel(); status(""); render(); }
    function camOn() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { status("This browser cannot open a camera here."); return; }
      status("Asking your browser for the camera…");
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }).then(function (stream) {
        cam.stream = stream; cam.frames = 0; var v = document.createElement("video"); v.className = "cam"; v.muted = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true"); v.srcObject = stream; cam.video = v;
        root.insertBefore(v, root.firstChild); root.classList.add("cam-on"); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        setCamLabel(); status("Camera on. Loading the face model…"); M.log("camera", "turned on"); render(); loadModel();
      }, function () { status("No camera, or permission was not given. Nothing was recorded."); });
    }
    function loadModel() {
      if (cam.lm || cam.loading) { if (cam.lm) status("The points are measured. The labels marked guess are invented."); return; }
      cam.loading = true;
      import(MP + "/vision_bundle.mjs").then(function (mod) {
        cam.cls = mod.FaceLandmarker;
        return mod.FilesetResolver.forVisionTasks(MP + "/wasm").then(function (files) { return mod.FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate: "GPU" }, runningMode: "VIDEO", numFaces: 1 }); });
      }).then(function (lm) { cam.lm = lm; cam.loading = false; status("The points are measured. The labels marked guess are invented."); },
              function () { cam.failed = true; cam.loading = false; status("The face model could not load, so this grid is not tracking you."); });
    }
    function detect() {
      if (!cam.lm || !cam.video || cam.video.readyState < 2) return; var now = performance.now(); if (now - cam.last < 45) return; cam.last = now;
      try { var res = cam.lm.detectForVideo(cam.video, now); cam.pts = res && res.faceLandmarks && res.faceLandmarks[0] ? res.faceLandmarks[0] : null; if (cam.pts) cam.frames++; } catch (e) { cam.pts = null; }
    }
    setCamLabel(); if (cam.video && !cam.video.parentNode) { root.insertBefore(cam.video, root.firstChild); root.classList.add("cam-on"); }

    function drawFace(ctx) {
      var v = cam.video; if (!v || !v.videoWidth) return null;
      var sc = Math.max(S.W / v.videoWidth, S.H / v.videoHeight), ox = (S.W - v.videoWidth * sc) / 2, oy = (S.H - v.videoHeight * sc) / 2;
      function P(p) { return [ox + (1 - p.x) * v.videoWidth * sc, oy + p.y * v.videoHeight * sc]; }      // mirrored, like the video
      var pts = cam.pts, box;
      if (pts) {
        var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, xy = pts.map(function (p) { var q = P(p); x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); return q; });
        ctx.globalCompositeOperation = "lighter"; ctx.lineWidth = 0.7;
        if (cam.cls && cam.cls.FACE_LANDMARKS_TESSELATION) { ctx.beginPath(); cam.cls.FACE_LANDMARKS_TESSELATION.forEach(function (c) { var a = xy[c.start], b = xy[c.end]; if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }); ctx.strokeStyle = "rgba(" + TEAL + ",.22)"; ctx.stroke(); }
        ["FACE_LANDMARKS_FACE_OVAL", "FACE_LANDMARKS_LEFT_EYE", "FACE_LANDMARKS_RIGHT_EYE", "FACE_LANDMARKS_LIPS", "FACE_LANDMARKS_LEFT_EYEBROW", "FACE_LANDMARKS_RIGHT_EYEBROW"].forEach(function (k) { var set = cam.cls && cam.cls[k]; if (!set) return; ctx.beginPath(); set.forEach(function (c) { var a = xy[c.start], b = xy[c.end]; if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }); ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(" + TEAL + ",.85)"; ctx.stroke(); });
        ctx.globalCompositeOperation = "source-over";
        for (var i = 0; i < xy.length; i += 3) { ctx.fillStyle = "rgba(200,255,250,.7)"; ctx.fillRect(xy[i][0] - 0.6, xy[i][1] - 0.6, 1.4, 1.4); }
        box = { x: x0 - 18, y: y0 - 26, w: x1 - x0 + 36, h: y1 - y0 + 52 };
        // two real measurements from the geometry
        var eye = Math.hypot(xy[159][0] - xy[145][0], xy[159][1] - xy[145][1]) / (Math.hypot(xy[33][0] - xy[133][0], xy[33][1] - xy[133][1]) || 1);
        var yaw = ((xy[1][0] - xy[234][0]) / ((xy[454][0] - xy[234][0]) || 1) - 0.5) * 2;
        box.real = ["points tracked: " + pts.length, "eyes: " + (eye < 0.16 ? "closed" : "open"), "head: " + (yaw > 0.22 ? "turned right" : yaw < -0.22 ? "turned left" : "facing the screen")];
      } else if (cam.failed) {
        var cx = S.W / 2, cy = S.H * 0.45, rw = Math.min(S.W, S.H) * 0.17; box = { x: cx - rw, y: cy - rw * 1.35, w: rw * 2, h: rw * 2.7, real: ["model unavailable"] };
        ctx.beginPath(); for (var g = -3; g <= 3; g++) { ctx.moveTo(cx + g * rw / 3.2, box.y + 12); ctx.quadraticCurveTo(cx + g * rw / 2.2, cy, cx + g * rw / 3.6, box.y + box.h - 12); ctx.moveTo(box.x + 10, cy + g * rw / 2.4); ctx.lineTo(box.x + box.w - 10, cy + g * rw / 2.4); } ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(" + TEAL + ",.35)"; ctx.stroke();
      }
      if (!box) return null;
      var L = 22; ctx.beginPath(); ctx.moveTo(box.x, box.y + L); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + L, box.y); ctx.moveTo(box.x + box.w - L, box.y); ctx.lineTo(box.x + box.w, box.y); ctx.lineTo(box.x + box.w, box.y + L); ctx.moveTo(box.x + box.w, box.y + box.h - L); ctx.lineTo(box.x + box.w, box.y + box.h); ctx.lineTo(box.x + box.w - L, box.y + box.h); ctx.moveTo(box.x + L, box.y + box.h); ctx.lineTo(box.x, box.y + box.h); ctx.lineTo(box.x, box.y + box.h - L); glow(ctx, TEAL, 2, 1);
      var sy = box.y + ((clock * 0.55) % 1) * box.h, sg = ctx.createLinearGradient(0, sy - 26, 0, sy); sg.addColorStop(0, "rgba(" + TEAL + ",0)"); sg.addColorStop(1, "rgba(" + TEAL + ",.28)"); ctx.fillStyle = sg; ctx.fillRect(box.x, sy - 26, box.w, 26); ctx.fillStyle = "rgba(" + TEAL + ",.9)"; ctx.fillRect(box.x, sy, box.w, 1);
      if (!cam.guess || clock - cam.guessT > 1.6) { cam.guessT = clock; var moods = ["skeptical", "curious", "bored", "impressed", "suspicious", "hungry"]; cam.guess = ["mood: " + moods[(Math.random() * moods.length) | 0] + " " + (50 + (Math.random() * 45 | 0)) + "%", "will click Join: " + (20 + (Math.random() * 70 | 0)) + "%", "trust score: " + (300 + (Math.random() * 550 | 0))]; }
      ctx.font = "600 11px ui-monospace, Consolas, monospace"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      var lx = box.x + box.w + 12; if (lx + 190 > S.W) lx = Math.max(8, box.x - 196);
      (box.real || []).concat(pts ? cam.guess : []).forEach(function (t, i) {
        var guess = i >= (box.real || []).length, y = box.y + 8 + i * 22, label = (guess ? "GUESS  " : "MEASURED  ") + t, w = ctx.measureText(label).width + 16;
        ctx.fillStyle = "rgba(4,10,22,.82)"; ctx.fillRect(lx, y, w, 18); ctx.fillStyle = "rgb(" + (guess ? WARM : TEAL) + ")"; ctx.fillRect(lx, y, 3, 18); ctx.fillStyle = guess ? "rgba(255,214,190,.95)" : "rgba(220,255,250,.95)"; ctx.fillText(label, lx + 9, y + 9.5);
      });
      return box;
    }

    return {
      step: function (dt, S) {
        clock += dt; view.conf += (view.confTo - view.conf) * Math.min(1, dt * 2.5); var cEl = card.querySelector("[data-conf]"); if (cEl) cEl.textContent = Math.round(view.conf) + "%";
        sinceRender += dt; if (cam.stream && sinceRender > 0.5) { sinceRender = 0; var fEl = card.querySelector("[data-frames]"); if (fEl) fEl.textContent = cam.frames; }
        if (cam.stream) detect();
        var cr = card.getBoundingClientRect(), rr = root.getBoundingClientRect(), target, focus = S.inside ? { x: S.mx, y: S.my } : null;
        if (wide) target = { x: cr.left - rr.left - R * 2.7, y: Math.min(floorY - R * 1.6, cr.top - rr.top + cr.height * 0.55) }; else target = { x: S.W - R * 2.2, y: floorY - R * 2.4 };
        if (wide && !shred && Math.sin(clock * 0.5) > 0.2) { bot.reach(1, cr.left - rr.left - 4, cr.top - rr.top + 60 + Math.sin(clock * 0.9) * 40, 0, "pointer"); focus = focus || { x: cr.left - rr.left + 80, y: cr.top - rr.top + 80 }; }
        if (cam.pts && cam.video) focus = { x: S.W / 2, y: S.H * 0.4 };
        if (shred) {
          target.y = floorY - R * 2.2; shred.t += dt; var sx = target.x - R * 0.9, syy = floorY - 6; shred.x = sx; shred.y = syy; bot.reach(-1, sx, syy - R * 1.1, 0, null); focus = { x: sx, y: syy };
          if (shred.t > 0.5 && shred.t < 2.3 && Math.random() < dt * 9) { for (var i = 0; i < 4; i++) shred.strips.push({ x: sx - 18 + Math.random() * 36, y: syy + 8, vy: 40 + Math.random() * 60, t: 0 }); }
          shred.strips.forEach(function (s) { s.t += dt; s.y += s.vy * dt; });
          if (shred.t > 2.6 && !shred.done) { shred.done = true; M.forget(); mem = M.data(); stranger = true; view.verdict = null; view.why = false; view.all = false; render(); }
          if (shred.t > 3.4) { shred = null; bot.mood.lid = 0; bot.mood.wide = 0.5; say("have we met?", 3000); window.setTimeout(function () { bot.mood.wide = 0; }, 1600); }
        }
        bot.step(dt, target, focus, { stiff: 10, floor: floorY }); chips.step(dt, S.W);
      },
      settle: function () { view.conf = view.confTo; bot.x = wide ? S.W * 0.52 : S.W - R * 2.2; bot.y = floorY - R * 2.4; },
      act: function (name) { if (name === "camera") { if (cam.stream) camOff(); else camOn(); } },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        if (cam.stream) drawFace(ctx);
        var fg = ctx.createLinearGradient(0, 0, S.W, 0); fg.addColorStop(0, "rgba(" + INK + ",0)"); fg.addColorStop(0.3, "rgba(" + INK + ",.3)"); fg.addColorStop(0.8, "rgba(" + INK + ",.3)"); fg.addColorStop(1, "rgba(" + INK + ",0)"); ctx.fillStyle = fg; ctx.fillRect(0, floorY + 2, S.W, 1);
        if (shred) {
          var x = shred.x, y = shred.y; shred.strips.forEach(function (s) { ctx.fillStyle = "rgba(" + TEAL + "," + clamp(1 - s.t / 1.2, 0, 1).toFixed(2) + ")"; ctx.fillRect(s.x, s.y, 2, 12); });
          ctx.fillStyle = "#0d1626"; ctx.fillRect(x - 30, y - 14, 60, 22); ctx.strokeStyle = "#55739b"; ctx.lineWidth = 1.5; ctx.strokeRect(x - 29.5, y - 13.5, 59, 21); ctx.fillStyle = "#02060e"; ctx.fillRect(x - 22, y - 9, 44, 4);
          if (shred.t < 2.4) { var k = (shred.t * 1.6) % 1; ctx.fillStyle = "rgba(230,240,255,.95)"; ctx.fillRect(x - 16, y - 12 - (1 - k) * R * 1.0, 32, (1 - k) * R * 0.9 + 2); ctx.fillStyle = "rgba(" + TEAL + ",.9)"; for (var i = 0; i < 3; i++) if ((1 - k) * R * 0.9 > 8 + i * 7) ctx.fillRect(x - 11, y - 8 - (1 - k) * R * 1.0 + i * 7, 22 - i * 5, 2); }
        }
        bot.draw(ctx, floorY, S.H);
      }
    };
  };
})();
