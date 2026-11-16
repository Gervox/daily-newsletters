(function () {
  "use strict";

  var CFG = window.DN_CONFIG || {};
  var COLORS = ["var(--s2)", "var(--s5)", "var(--s3)", "var(--s4)", "var(--s1)", "var(--s7)", "var(--s6)"];
  var TAG_COLORS = { "Attualità": "var(--s2)", "Tendenze": "var(--s5)", "Curiosità": "var(--s3)" };
  var BLOCKED_HOSTS = /(^|\.)(mail\.google\.com|googlemail\.com|inbox\.google\.com|outlook\.live\.com|outlook\.office\.com|mail\.yahoo\.com|list-manage\.com|mail\.beehiiv\.com|sendgrid\.net|mailchi\.mp|substackcdn\.com)$/i;

  var $ = function (id) { return document.getElementById(id); };
  var data = null;

  /* ---------- sicurezza link: mai Gmail, mai link di tracciamento email ---------- */
  function safeUrl(u) {
    if (!u || typeof u !== "string") return null;
    try {
      var x = new URL(u);
      if (x.protocol !== "https:") return null;
      if (BLOCKED_HOSTS.test(x.hostname)) return null;
      if (/(^|\.)google\.com$/i.test(x.hostname) && /^\/mail/i.test(x.pathname)) return null;
      if (/@/.test(x.pathname + x.search)) return null;
      return x.href;
    } catch (e) { return null; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function icon(id) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  /* ---------- dati ---------- */
  function valid(d) {
    return d && typeof d.date === "string" && Array.isArray(d.news) && Array.isArray(d.tools) && Array.isArray(d.extra);
  }
  function stamp(d) { return d.date + (d.edition === "sera" ? "b" : "a"); }
  function fetchJson(url, ms) {
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, ms);
    var sep = url.indexOf("?") === -1 ? "?" : "&";
    return fetch(url + sep + "t=" + Date.now(), { cache: "no-store", signal: ctl.signal })
      .then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); })
      .then(function (d) { if (!valid(d)) throw new Error("schema"); return d; })
      .finally(function () { clearTimeout(timer); });
  }
  function load() {
    var remote = CFG.remoteUrl || "";
    var sameOrigin = false;
    try { sameOrigin = remote && new URL(remote).origin === location.origin; } catch (e) {}
    var jobs = [fetchJson("data/latest.json", 6000).catch(function () { return null; })];
    if (remote && !sameOrigin) jobs.push(fetchJson(remote, 7000).catch(function () { return null; }));
    return Promise.all(jobs).then(function (found) {
      try { found.push(JSON.parse(localStorage.getItem("dn-data"))); } catch (e) {}
      var best = null;
      found.forEach(function (d) { if (valid(d) && (!best || stamp(d) > stamp(best))) best = d; });
      if (best) { try { localStorage.setItem("dn-data", JSON.stringify(best)); } catch (e) {} }
      return best;
    });
  }

  /* ---------- render ---------- */
  function longDate(iso) {
    var p = iso.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" }).format(d);
  }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function roll(el, value) {
    var digits = String(value).split("");
    el.setAttribute("aria-label", value);
    el.innerHTML = digits.map(function () {
      var col = "";
      for (var i = 0; i < 10; i++) col += "<span>" + i + "</span>";
      return '<span class="col" aria-hidden="true">' + col + "</span>";
    }).join("");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        Array.prototype.forEach.call(el.children, function (col, i) {
          col.style.transitionDelay = i * 90 + 500 + "ms";
          col.style.transform = "translateY(-" + digits[i] + "em)";
        });
      });
    });
  }

  function render(d) {
    data = d;
    var when = longDate(d.date) + (d.edition ? " · " + d.edition : "");
    $("date-label").textContent = when;
    $("foot-date").textContent = "Edizione di " + when;

    var stale = $("stale");
    if (d.date < todayIso()) {
      stale.textContent = "Stai leggendo l'edizione di " + longDate(d.date) + ". La nuova arriva in mattinata.";
      stale.hidden = false;
    } else { stale.hidden = true; }

    var counts = { news: d.news.length, tools: d.tools.length, extra: d.extra.length, newsletters: d.newsletters || 0 };
    Array.prototype.forEach.call(document.querySelectorAll("[data-roll]"), function (el) {
      var v = counts[el.getAttribute("data-roll")];
      el.parentNode.hidden = !v;
      roll(el, v);
    });

    var featured = d.news.slice(0, 3), rest = d.news.slice(3);
    $("featured").innerHTML = featured.map(function (n, i) {
      return '<button type="button" class="feat reveal" style="--c:' + COLORS[i] + ";--i:" + i + '" data-kind="news" data-i="' + i + '">' +
        '<span class="big" aria-hidden="true">' + pad(i + 1) + "</span>" +
        '<span class="chip">' + esc(n.k) + "</span>" +
        "<h3>" + esc(n.title) + "</h3>" +
        '<span class="feat-foot"><span>' + esc(n.source) + '</span><span class="go">' + icon("i-arrow") + "</span></span>" +
        "</button>";
    }).join("");
    $("featured-count").textContent = "1 / " + featured.length + " · SCORRI";

    $("news-list").innerHTML = rest.map(function (n, j) {
      var i = j + 3;
      return '<li><button type="button" class="row reveal" style="--c:' + COLORS[i % COLORS.length] + ";--i:" + (j % 4) + '" data-kind="news" data-i="' + i + '">' +
        '<span class="num">' + pad(i + 1) + "</span>" +
        '<span><span class="k">' + esc(n.k) + '</span><span class="t">' + esc(n.title) + "</span></span>" +
        '<span class="go">' + icon("i-arrow") + "</span>" +
        "</button></li>";
    }).join("");

    $("tools-grid").innerHTML = d.tools.map(function (t, i) {
      return '<button type="button" class="tile reveal" style="--c:' + COLORS[i % COLORS.length] + ";--i:" + (i % 2) + '" data-kind="tools" data-i="' + i + '">' +
        '<span class="tile-top"><span class="badge" aria-hidden="true">' + esc(String(t.title).trim().charAt(0).toUpperCase()) + '</span><span class="n">' + pad(i + 1) + "</span></span>" +
        '<span class="t">' + esc(t.title) + "</span>" +
        '<span class="d">' + esc(t.summary) + "</span>" +
        "</button>";
    }).join("");

    $("extra-stack").innerHTML = d.extra.map(function (x, i) {
      var c = TAG_COLORS[x.tag] || COLORS[i % COLORS.length];
      return '<button type="button" class="note-card reveal" style="--c:' + c + '" data-kind="extra" data-i="' + i + '">' +
        '<span class="tag">' + esc(x.tag || x.k) + "</span>" +
        '<span class="t">' + esc(x.title) + "</span>" +
        '<span class="d">' + esc(x.summary) + "</span>" +
        '<span class="more"><span>' + esc(x.source) + "</span><span>Leggi tutto →</span></span>" +
        "</button>";
    }).join("");

    observeReveals();
  }

  /* ---------- reveal allo scroll ---------- */
  var revealObserver = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;
  function observeReveals() {
    Array.prototype.forEach.call(document.querySelectorAll(".reveal:not(.in)"), function (el) {
      if (revealObserver) revealObserver.observe(el); else el.classList.add("in");
    });
  }

  /* ---------- scheda di dettaglio ---------- */
  var detail = $("detail"), panel = detail.querySelector(".detail-panel"), lastFocus = null;
  function openDetail(kind, i, color) {
    var item = data && data[kind] && data[kind][i];
    if (!item) return;
    var url = safeUrl(item.url);
    var isTool = kind === "tools";
    var label = isTool ? "Apri " + item.title : "Apri la notizia originale";
    var kicker = kind === "extra" ? (item.tag || item.k) : item.k;
    var num = kind === "news" ? "Notizia " + pad(i + 1) : isTool ? "Tool " + pad(i + 1) : "Fuori scaffale";
    panel.style.setProperty("--c", color || "var(--accent)");
    $("detail-body").innerHTML =
      '<div class="detail-meta"><span class="tag" style="--c:' + (color || "var(--accent)") + '">' + esc(kicker) + '</span><span class="num">' + esc(num) + "</span></div>" +
      '<h3 id="detail-title">' + esc(item.title) + "</h3>" +
      '<p class="text">' + esc(item.summary) + "</p>" +
      (item.note ? '<p class="know"><b>Da sapere</b>' + esc(item.note) + "</p>" : "") +
      '<p class="src">Fonte: <b>' + esc(item.source) + "</b></p>" +
      (url
        ? '<a class="btn btn--accent btn--block" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + " " + icon("i-out") + "</a>"
        : '<p class="nolink">Per questa notizia non c\'è un link pubblico alla fonte.</p>');
    $("detail-body").scrollTop = 0;
    lastFocus = document.activeElement;
    detail.hidden = false;
    document.body.style.overflow = "hidden";
    panel.style.transform = "";
    requestAnimationFrame(function () { requestAnimationFrame(function () { detail.classList.add("is-open"); }); });
    try { history.pushState({ dn: "detail" }, ""); } catch (e) {}
    detail.querySelector(".detail-close").focus({ preventScroll: true });
  }
  function hideDetail() {
    if (detail.hidden) return;
    detail.classList.remove("is-open");
    panel.style.transform = "";
    document.body.style.overflow = "";
    setTimeout(function () { detail.hidden = true; }, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function closeDetail() {
    if (detail.hidden) return;
    if (history.state && history.state.dn === "detail") history.back(); else hideDetail();
  }
  window.addEventListener("popstate", hideDetail);
  detail.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeDetail(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDetail(); });

  // trascina verso il basso per chiudere
  var drag = null;
  panel.addEventListener("touchstart", function (e) {
    if ($("detail-body").scrollTop > 0) return;
    drag = { y: e.touches[0].clientY, dy: 0 };
  }, { passive: true });
  panel.addEventListener("touchmove", function (e) {
    if (!drag) return;
    drag.dy = e.touches[0].clientY - drag.y;
    if (drag.dy > 0) { panel.classList.add("is-dragging"); panel.style.transform = "translateY(" + drag.dy + "px)"; }
  }, { passive: true });
  panel.addEventListener("touchend", function () {
    if (!drag) return;
    panel.classList.remove("is-dragging");
    if (drag.dy > 110) closeDetail(); else panel.style.transform = "";
    drag = null;
  });

  document.addEventListener("click", function (e) {
    var card = e.target.closest("[data-kind]");
    if (card) openDetail(card.getAttribute("data-kind"), +card.getAttribute("data-i"), card.style.getPropertyValue("--c"));
  });

  /* ---------- carosello ---------- */
  var featuredEl = $("featured");
  featuredEl.addEventListener("scroll", function () {
    var cards = featuredEl.children;
    if (!cards.length) return;
    var mid = featuredEl.scrollLeft + featuredEl.clientWidth / 2, best = 0, bestDist = Infinity;
    Array.prototype.forEach.call(cards, function (c, i) {
      var dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    $("featured-count").textContent = best + 1 + " / " + cards.length + " · SCORRI";
  }, { passive: true });

  /* ---------- barra in basso ---------- */
  var tabs = $("tabs"), pill = $("tabs-pill");
  function setTab(name) {
    var link = tabs.querySelector('a[data-tab="' + name + '"]');
    if (!link) return;
    Array.prototype.forEach.call(tabs.querySelectorAll("a"), function (a) { a.classList.toggle("is-active", a === link); });
    pill.style.width = link.offsetWidth + "px";
    pill.style.transform = "translateX(" + link.offsetLeft + "px)";
  }
  function currentTab() {
    var line = window.innerHeight * 0.45, name = "oggi";
    Array.prototype.forEach.call(document.querySelectorAll("main [data-tab]"), function (s) {
      if (s.getBoundingClientRect().top <= line) name = s.getAttribute("data-tab");
    });
    return name;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    if (a.getAttribute("href") === "#oggi") window.scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  var nav = $("nav"), lastY = 0, ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      nav.classList.toggle("is-hidden", y > 240 && y > lastY);
      lastY = y;
      setTab(currentTab());
      ticking = false;
    });
  }, { passive: true });
  window.addEventListener("resize", function () { setTab(currentTab()); });

  /* ---------- aggiorna ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 2400);
  }
  $("refresh").addEventListener("click", function () {
    var btn = this, before = data ? stamp(data) : "";
    btn.classList.remove("is-spinning");
    void btn.offsetWidth;
    btn.classList.add("is-spinning");
    load().then(function (d) {
      if (!d) return toast("Nessuna connessione");
      if (stamp(d) !== before) { render(d); toast("Nuova edizione caricata"); }
      else toast("Hai già l'ultima edizione");
    });
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible" || !data || data.date >= todayIso()) return;
    load().then(function (d) { if (d && stamp(d) !== stamp(data)) { render(d); toast("Nuova edizione caricata"); } });
  });

  /* ---------- avvio ---------- */
  function start(d) {
    if (d) render(d);
    else {
      $("date-label").textContent = "Nessuna edizione disponibile";
      $("stale").textContent = "Non riesco a scaricare le notizie. Controlla la connessione e tocca il pulsante in alto a destra.";
      $("stale").hidden = false;
    }
    document.body.classList.add("is-ready");
    $("loader").classList.add("is-done");
    setTab(currentTab());
  }
  var minWait = new Promise(function (r) { setTimeout(r, 650); });
  Promise.all([load(), minWait]).then(function (r) { start(r[0]); }, function () { start(null); });

  if ("serviceWorker" in navigator && location.protocol === "https:" && !window.Capacitor) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
