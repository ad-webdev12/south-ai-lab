/* South Artificial Intelligence Laboratory: the Ethics hero.
   One face, scanned. A rendered head (assets/img/face.png, a sculpted surface, not a
   person) fills the right of the hero. A scan beam crosses it; landmarks lock on one by
   one, a mesh joins them, a box finds the face and corrects itself. Near the end of each
   pass the model loses its certainty for half a second: points drift, the box slips, one
   amber flicker, then it re-locks. The landmark positions come from the same 3-D model
   that rendered the head (assets/img/face.json). */

(function () {
  "use strict";
  var SAIL = window.SAIL; if (!SAIL) return;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  var ICE = "228,238,255", BLUE = "126,160,210", AMBER = "255,190,110";
  var IMG = new Image(); IMG.src = "assets/img/face.png"; var DATA = null;
  fetch("assets/img/face.json").then(function (r) { return r.json(); }).then(function (d) { DATA = d; });
  var LABELS = { eye_out_L: "EYE", nose_tip: "NOSE", jaw2_L: "JAW", cheek_L: "LANDMARK 68" };
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  SAIL.scenes.society = function (S, root) {
    var wide = S.W >= 980, bar = root.querySelector(".ghero-bar"), note = root.querySelector("[data-note]"), floorY = bar ? bar.offsetTop : S.H;
    var clock = 0, loop = 0, T = 13, pts = [], edges = [], box = null, fitted = null, jitter = {}, lastLoop = -1;
    // where the head sits: right two thirds on wide screens, the lower part on phones
    function frame() {
      var iw = DATA ? DATA.w : 1000, ih = DATA ? DATA.h : 1300, areaX = wide ? S.W * 0.36 : 0, areaW = wide ? S.W * 0.64 : S.W, areaY = wide ? 40 : S.H * 0.42, areaH = wide ? floorY - 40 : floorY - S.H * 0.42;
      var sc = Math.min(areaW / iw, areaH / ih) * (wide ? 1.0 : 1.0);
      return { sc: sc, x: areaX + (areaW - iw * sc) / 2 + (wide ? S.W * 0.03 : 0), y: areaY + (areaH - ih * sc) / 2 + 30 * sc };
    }
    function P(p, f) { return { x: f.x + p.x * f.sc, y: f.y + p.y * f.sc }; }
    function phase(t) {        // one pass of the scan, in seconds
      if (t < 1.2) return { name: "dark", k: t / 1.2 };
      if (t < 5.4) return { name: "scan", k: (t - 1.2) / 4.2 };
      if (t < 8.6) return { name: "mesh", k: (t - 5.4) / 3.2 };
      if (t < 9.2) return { name: "fail", k: (t - 8.6) / 0.6 };
      if (t < 10.4) return { name: "relock", k: (t - 9.2) / 1.2 };
      return { name: "still", k: (t - 10.4) / (T - 10.4) };
    }
    function seedJitter(l) { jitter = {}; if (!DATA) return; DATA.pts.forEach(function (p, i) { var a = Math.sin(i * 12.9 + l * 7.1) * 43758.5; a -= Math.floor(a); var b = Math.sin(i * 78.2 + l * 3.3) * 12345.6; b -= Math.floor(b); jitter[i] = { dx: (a - 0.5) * 34, dy: (b - 0.5) * 26 }; }); }

    return {
      step: function (dt) {
        clock += dt; var t = clock % T, l = Math.floor(clock / T); if (l !== lastLoop) { lastLoop = l; seedJitter(l); }
        var ph = phase(t); if (note) { var show = ph.name === "fail" || (ph.name === "relock" && ph.k < 0.7) || (ph.name === "still" && ph.k < 0.35); note.classList.toggle("on", show); }
      },
      settle: function () { clock = 7.5; },
      draw: function (ctx, S) {
        ctx.clearRect(0, 0, S.W, S.H);
        var bg = ctx.createRadialGradient(S.W * 0.65, S.H * 0.45, 20, S.W * 0.65, S.H * 0.45, S.W * 0.7); bg.addColorStop(0, "#0b0e13"); bg.addColorStop(1, "#040507"); ctx.fillStyle = bg; ctx.fillRect(0, 0, S.W, S.H);
        if (!IMG.complete || !IMG.naturalWidth || !DATA) return;
        var f = frame(), t = reduced ? 7.5 : clock % T, ph = phase(t), vis = DATA.pts.map(function (p) { return p.v; });
        var beamK = ph.name === "scan" ? ph.k : ph.name === "dark" ? 0 : 1;                     // how far the beam has crossed, 0 left to 1 right
        var b0 = DATA.box, bx = f.x + b0[0] * f.sc, by = f.y + b0[1] * f.sc, bw = b0[2] * f.sc, bh = b0[3] * f.sc, beamX = bx - 40 + (bw + 80) * beamK;
        // the head: dim in the dark phase, lit as the beam passes
        var lit = ph.name === "dark" ? 0.32 + 0.1 * ph.k : 1;
        ctx.save(); ctx.globalAlpha = 0.42 * lit; ctx.drawImage(IMG, f.x, f.y, DATA.w * f.sc, DATA.h * f.sc); ctx.restore();
        if (ph.name !== "dark") {      // the scanned part is fully lit
          ctx.save(); ctx.beginPath(); ctx.rect(0, 0, beamX, S.H); ctx.clip(); ctx.globalAlpha = 0.58 * lit; ctx.drawImage(IMG, f.x, f.y, DATA.w * f.sc, DATA.h * f.sc); ctx.restore();
        }
        var fail = ph.name === "fail" ? Math.sin(ph.k * Math.PI) : ph.name === "relock" ? Math.max(0, 1 - ph.k * 1.6) * 0.5 : 0;
        var offset = function (i) { var j = jitter[i] || { dx: 0, dy: 0 }; return { dx: j.dx * fail * f.sc * 0.9, dy: j.dy * fail * f.sc * 0.9 }; };
        var rgb = fail > 0.15 && Math.sin(clock * 40) > 0 ? AMBER : ICE;
        // the beam
        if (ph.name === "scan") {
          var g = ctx.createLinearGradient(beamX - 90, 0, beamX, 0); g.addColorStop(0, "rgba(" + BLUE + ",0)"); g.addColorStop(1, "rgba(" + BLUE + ",.16)"); ctx.fillStyle = g; ctx.fillRect(beamX - 90, by - 80, 90, bh + 160);
          ctx.fillStyle = "rgba(" + ICE + ",.85)"; ctx.fillRect(beamX, by - 80, 1, bh + 160); SAIL.dot(ctx, beamX, by - 80 + (bh + 160) * (0.5 + 0.5 * Math.sin(clock * 3)), 5, ICE, 0.35);
        }
        // the box: found by the scan, then corrected by a few pixels, then it slips during the failure
        if (ph.name !== "dark") {
          var settle = ph.name === "scan" ? 0 : Math.min(1, (t - 5.4) / 1.0), adjX = (1 - ease(settle)) * 14 * f.sc, adjW = (1 - ease(settle)) * 26 * f.sc;
          var rx = bx + adjX - fail * 22 * f.sc, ry = by - fail * 10 * f.sc, rw = bw + adjW + fail * 30 * f.sc, rh = bh + fail * 12 * f.sc, L = 22;
          if (ph.name === "scan") { rw = (beamX - bx) + adjW; rx = bx + adjX; }
          if (rw > 30) { ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + rgb + ",.35)"; ctx.strokeRect(rx + 0.5, ry + 0.5, rw, rh); ctx.beginPath(); ctx.moveTo(rx, ry + L); ctx.lineTo(rx, ry); ctx.lineTo(rx + L, ry); ctx.moveTo(rx + rw - L, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + L); ctx.moveTo(rx + rw, ry + rh - L); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx + rw - L, ry + rh); ctx.moveTo(rx + L, ry + rh); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx, ry + rh - L); ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(" + rgb + ",.9)"; ctx.stroke(); }
          ctx.font = "500 10px ui-monospace, Consolas, monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "rgba(" + rgb + ",.7)";
          if ("letterSpacing" in ctx) ctx.letterSpacing = "1.5px"; ctx.fillText(ph.name === "scan" ? "SCANNING" : fail > 0.2 ? "UNCERTAIN" : ph.name === "relock" ? "RE-LOCK" : "FACE  " + Math.round(bw / f.sc) + "×" + Math.round(bh / f.sc), rx, ry - 8); if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
        }
        // landmarks and mesh: each point appears as the beam passes it, the mesh draws in during the mesh phase
        var on = DATA.pts.map(function (p, i) { if (!vis[i]) return 0; var sx = f.x + p.x * f.sc; if (ph.name === "dark") return 0; if (ph.name === "scan") return clamp((beamX - sx) / 40, 0, 1); return 1; });
        var meshK = ph.name === "mesh" ? ease(ph.k * 1.6) : ph.name === "scan" || ph.name === "dark" ? 0 : 1;
        ctx.lineWidth = 0.8;
        DATA.edges.forEach(function (e, k) {
          var a = DATA.pts[e[0]], b = DATA.pts[e[1]], w = Math.min(on[e[0]], on[e[1]]) * clamp(meshK * DATA.edges.length - k, 0, 1); if (w <= 0) return;
          var oa = offset(e[0]), ob = offset(e[1]), pa = P(a, f), pb = P(b, f);
          ctx.beginPath(); ctx.moveTo(pa.x + oa.dx, pa.y + oa.dy); ctx.lineTo(pb.x + ob.dx, pb.y + ob.dy); ctx.strokeStyle = "rgba(" + (fail > 0.15 ? AMBER : BLUE) + "," + (0.55 * w * (1 - fail * 0.5)).toFixed(3) + ")"; ctx.stroke();
        });
        DATA.pts.forEach(function (p, i) {
          if (on[i] <= 0) return; var q = P(p, f), o = offset(i), x = q.x + o.dx, y = q.y + o.dy, lockK = on[i];
          var r = 2.2 + (1 - lockK) * 6; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + rgb + "," + (0.9 * lockK).toFixed(2) + ")"; ctx.stroke();
          if (lockK >= 1) { ctx.fillStyle = "rgba(" + rgb + ",.95)"; ctx.fillRect(x - 1, y - 1, 2, 2); }
          if (LABELS[p.n] && meshK > 0.6 && fail < 0.2) { ctx.font = "500 10px ui-monospace, Consolas, monospace"; if ("letterSpacing" in ctx) ctx.letterSpacing = "1.5px"; ctx.fillStyle = "rgba(" + ICE + ",.75)"; ctx.textAlign = "left"; ctx.beginPath(); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x + 16, y - 16); ctx.lineTo(x + 26, y - 16); ctx.strokeStyle = "rgba(" + ICE + ",.5)"; ctx.stroke(); ctx.fillText(LABELS[p.n], x + 30, y - 12); if ("letterSpacing" in ctx) ctx.letterSpacing = "0px"; }
        });
        // in the failure, a few points are drawn where the model wrongly thinks they are, and the truth shows faint
        if (fail > 0.15) { DATA.pts.forEach(function (p, i) { if (!vis[i] || i % 4) return; var q = P(p, f); ctx.beginPath(); ctx.arc(q.x, q.y, 2.5, 0, 6.2832); ctx.strokeStyle = "rgba(" + ICE + ",.2)"; ctx.lineWidth = 1; ctx.stroke(); }); }
      }
    };
  };
})();
