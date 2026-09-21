/* South Artificial Intelligence Laboratory: what the site's robot remembers.
   Everything here stays in this browser (localStorage). Nothing is sent anywhere.
   The Agents page writes what the robot learned, every page notes that it was
   visited, and the Ethics page shows all of it and can delete it. */

(function () {
  "use strict";
  var KEY = "sail-bot-v1";

  function blank() {
    return { v: 1, first: Date.now(), last: 0, views: 0, pages: {}, clicks: { total: 0, letters: 0, robot: 0, controls: 0 }, navHover: {},
             feedback: 0, reward: 0, q: {}, trans: {}, spell: {}, torment: 0, deaths: 0, trust: 0.5, frus: 0, verdict: null, events: [] };
  }
  function load() {
    try { var m = JSON.parse(window.localStorage.getItem(KEY)); if (m && m.v === 1) return m; } catch (e) {}
    return blank();
  }
  var mem = load(), dirty = false;
  function save() { try { window.localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} dirty = false; }

  var page = (location.pathname.split("/").pop() || "index").replace(".html", "") || "index";
  var api = {
    data: function () { return mem; },
    page: page,
    touch: function () { dirty = true; },
    save: save,
    log: function (type, detail) {
      mem.events.push({ t: Date.now(), p: page, type: type, d: detail || "" });
      if (mem.events.length > 80) mem.events.splice(0, mem.events.length - 80);
      dirty = true;
    },
    forget: function () { try { window.localStorage.removeItem(KEY); } catch (e) {} mem = blank(); mem.pages[page] = { n: 1, sec: 0 }; dirty = false; },
    bytes: function () { return JSON.stringify(mem).length; }
  };
  window.SAILMemory = api;

  var gap = Date.now() - (mem.last || 0);
  api.returning = mem.views > 0 && gap > 60000;
  api.seenBefore = !!(mem.pages[page] && mem.pages[page].n);
  mem.views++; mem.last = Date.now();
  if (!mem.pages[page]) mem.pages[page] = { n: 0, sec: 0 };
  mem.pages[page].n++;
  save();

  window.setInterval(function () {
    if (document.hidden) return;
    if (!mem.pages[page]) mem.pages[page] = { n: 1, sec: 0 };
    mem.pages[page].sec += 5; mem.last = Date.now(); save();
  }, 5000);
  window.addEventListener("pagehide", function () { if (dirty) save(); });

  document.addEventListener("click", function (ev) {
    mem.clicks.total++;
    if (ev.target.closest && ev.target.closest("[data-act]")) mem.clicks.controls++;
    dirty = true;
  }, true);
  document.addEventListener("pointerenter", function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest("#nav-research a, .groups a");
    if (!a) return;
    var k = (a.getAttribute("href") || "").replace(".html", "");
    mem.navHover[k] = (mem.navHover[k] || 0) + 1; dirty = true;
  }, true);
})();
