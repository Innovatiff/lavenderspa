/* Lavender Spa & Boutique — interactions (no dependencies) */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------------- */
  /* Business hours (America/Toronto). 0 = Sunday. [open, close] in hours.  */
  /* ---------------------------------------------------------------------- */
  var HOURS = {
    0: null,
    1: [9, 17],
    2: [9, 17],
    3: [9, 17],
    4: [9, 20],
    5: [9, 17],
    6: [9, 14]
  };

  function torontoNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Toronto",
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: false
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[map.weekday], hour: (parseInt(map.hour, 10) % 24) + parseInt(map.minute, 10) / 60 };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), hour: d.getHours() + d.getMinutes() / 60 };
    }
  }

  function fmt(h) {
    var suffix = h >= 12 ? "pm" : "am";
    var hr = h % 12 || 12;
    return hr + suffix;
  }

  function updateStatus() {
    var now = torontoNow();
    var today = HOURS[now.day];
    var open = today && now.hour >= today[0] && now.hour < today[1];
    var text;
    if (open) {
      text = "Open now · until " + fmt(today[1]);
    } else {
      // Find next opening
      for (var i = 0; i < 8; i++) {
        var d = (now.day + i) % 7;
        var h = HOURS[d];
        if (!h) continue;
        if (i === 0 && now.hour >= h[0]) continue;
        var label = i === 0 ? "today" : i === 1 ? "tomorrow" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d];
        text = "Closed · opens " + label + " " + fmt(h[0]);
        break;
      }
    }
    doc.querySelectorAll("[data-open-status]").forEach(function (el) { el.textContent = text; });
    doc.querySelectorAll(".status-dot").forEach(function (el) { el.classList.toggle("is-open", !!open); });
    doc.querySelectorAll(".hours li[data-day]").forEach(function (li) {
      li.classList.toggle("is-today", parseInt(li.getAttribute("data-day"), 10) === now.day);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------------------------------------------------------------------- */
  /* Header, progress bar, back-to-top, mobile book bar                     */
  /* ---------------------------------------------------------------------- */
  var header = doc.querySelector(".header");
  var progress = doc.querySelector(".scroll-progress");
  var toTop = doc.querySelector(".to-top");
  var ring = doc.querySelector(".to-top__ring circle");
  var mobileBook = doc.querySelector(".mobile-book");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = root.scrollHeight - window.innerHeight;
    var pct = max > 0 ? y / max : 0;
    if (header) header.classList.toggle("is-scrolled", y > 20);
    if (progress) progress.style.transform = "scaleX(" + pct + ")";
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
    if (ring) ring.style.strokeDashoffset = String(151 - 151 * pct);
    if (mobileBook) mobileBook.classList.toggle("is-visible", y > 500);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Mobile menu                                                            */
  /* ---------------------------------------------------------------------- */
  var toggle = doc.querySelector(".menu-toggle");
  var mobileNav = doc.querySelector(".mobile-nav");

  function setMenu(open) {
    root.classList.toggle("menu-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    if (mobileNav) mobileNav.setAttribute("aria-hidden", String(!open));
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(!root.classList.contains("menu-open"));
    });
  }
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.classList.contains("menu-open")) {
      setMenu(false);
      if (toggle) toggle.focus();
    }
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 1080 && root.classList.contains("menu-open")) setMenu(false);
  });

  /* ---------------------------------------------------------------------- */
  /* Split headline into animated words                                     */
  /* ---------------------------------------------------------------------- */
  doc.querySelectorAll("[data-split]").forEach(function (el) {
    var i = 0;
    function walk(node, gradient) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(" ")); return; }
            var outer = doc.createElement("span");
            outer.className = "split-word";
            var inner = doc.createElement("span");
            inner.style.setProperty("--i", i++);
            // background-clip:text doesn't reach transformed inline-blocks, so re-apply per word
            if (gradient) inner.className = "text-gradient";
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child, gradient || child.classList.contains("text-gradient"));
        }
      });
    }
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    walk(el, false);
    Array.prototype.forEach.call(el.children, function (c) { c.setAttribute("aria-hidden", "true"); });
  });

  /* ---------------------------------------------------------------------- */
  /* Reveal on scroll + counters                                            */
  /* ---------------------------------------------------------------------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
    var start = null;
    var dur = 1800;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.hasAttribute("data-count")) countUp(el);
        else el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    doc.querySelectorAll("[data-reveal], [data-count]").forEach(function (el) { io.observe(el); });
  } else {
    doc.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); });
    doc.querySelectorAll("[data-count]").forEach(countUp);
  }

  // Stagger children of [data-stagger]
  doc.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.querySelectorAll("[data-reveal]"), function (el, idx) {
      el.style.setProperty("--delay", (idx * 0.09).toFixed(2) + "s");
    });
  });

  /* ---------------------------------------------------------------------- */
  /* 3D tilt                                                                */
  /* ---------------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    doc.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateY(" + x * 8 + "deg) rotateX(" + -y * 8 + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });

    var glow = doc.querySelector(".cursor-glow");
    if (glow) {
      var gx = 0, gy = 0, tx = 0, ty = 0, raf = null;
      function loop() {
        gx += (tx - gx) * 0.12;
        gy += (ty - gy) * 0.12;
        glow.style.transform = "translate(" + gx + "px," + gy + "px)";
        if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) raf = requestAnimationFrame(loop);
        else raf = null;
      }
      window.addEventListener("mousemove", function (e) {
        tx = e.clientX; ty = e.clientY;
        glow.classList.add("is-active");
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
      doc.addEventListener("mouseleave", function () { glow.classList.remove("is-active"); });
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Hero falling petals (canvas)                                           */
  /* ---------------------------------------------------------------------- */
  var canvas = doc.getElementById("petals");
  if (canvas && !reduceMotion && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var petals = [];
    var W, H, dpr, running = true;
    var colors = ["#e0d6f5", "#c4b3ea", "#a893d8", "#f2c6de"];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make(randomY) {
      return {
        x: Math.random() * W,
        y: randomY ? Math.random() * H : -20,
        r: 3 + Math.random() * 5,
        vy: 0.3 + Math.random() * 0.7,
        vx: -0.3 + Math.random() * 0.6,
        rot: Math.random() * Math.PI,
        vr: -0.02 + Math.random() * 0.04,
        sway: Math.random() * Math.PI * 2,
        a: 0.35 + Math.random() * 0.45,
        c: colors[(Math.random() * colors.length) | 0]
      };
    }
    resize();
    var count = W < 680 ? 18 : 36;
    for (var p = 0; p < count; p++) petals.push(make(true));

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      petals.forEach(function (pt, idx) {
        pt.sway += 0.015;
        pt.x += pt.vx + Math.sin(pt.sway) * 0.4;
        pt.y += pt.vy;
        pt.rot += pt.vr;
        if (pt.y > H + 20 || pt.x < -20 || pt.x > W + 20) petals[idx] = make(false);
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.globalAlpha = pt.a;
        ctx.fillStyle = pt.c;
        ctx.beginPath();
        ctx.ellipse(0, 0, pt.r, pt.r * 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener("resize", resize);

    // Pause when hero is off-screen to save battery
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !running) { running = true; draw(); }
        else if (!vis) running = false;
      }).observe(canvas);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Hero parallax                                                          */
  /* ---------------------------------------------------------------------- */
  var parallax = doc.querySelectorAll("[data-parallax]");
  if (parallax.length && !reduceMotion && window.innerWidth > 900) {
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      parallax.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
        el.style.transform = "translate3d(0," + y * speed + "px,0)";
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------- */
  /* Service menu tabs                                                      */
  /* ---------------------------------------------------------------------- */
  var tabs = doc.querySelector(".tabs");
  if (tabs) {
    var pill = tabs.querySelector(".tabs__pill");
    var tabButtons = tabs.querySelectorAll(".tab");
    var groups = doc.querySelectorAll(".menu-group");

    function movePill(btn) {
      if (!pill || !btn) return;
      pill.style.width = btn.offsetWidth + "px";
      pill.style.transform = "translateX(" + btn.offsetLeft + "px)";
    }

    function select(filter, scroll) {
      var active;
      tabButtons.forEach(function (b) {
        var on = b.getAttribute("data-filter") === filter;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        if (on) active = b;
      });
      groups.forEach(function (g) {
        var show = filter === "all" || g.id === filter;
        g.classList.toggle("is-hidden", !show);
        if (show) {
          g.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); });
        }
      });
      movePill(active);
      if (active && active.scrollIntoView && tabs.scrollWidth > tabs.clientWidth) {
        tabs.scrollTo({ left: active.offsetLeft - tabs.clientWidth / 2 + active.offsetWidth / 2, behavior: "smooth" });
      }
      if (scroll) {
        var top = tabs.getBoundingClientRect().top + window.scrollY - 120;
        if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
      }
    }

    tabButtons.forEach(function (btn, idx) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        select(f, true);
        history.replaceState(null, "", f === "all" ? location.pathname : "#" + f);
      });
      btn.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = tabButtons[(idx + dir + tabButtons.length) % tabButtons.length];
        next.focus();
        next.click();
      });
    });

    var initial = location.hash.replace("#", "");
    var valid = Array.prototype.some.call(tabButtons, function (b) { return b.getAttribute("data-filter") === initial; });
    select(valid ? initial : "all", false);
    window.addEventListener("resize", function () { movePill(tabs.querySelector('[aria-selected="true"]')); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { movePill(tabs.querySelector('[aria-selected="true"]')); });
  }

  /* ---------------------------------------------------------------------- */
  /* Booking / contact form → opens email client with a prefilled request   */
  /* ---------------------------------------------------------------------- */
  var form = doc.querySelector("[data-booking-form]");
  if (form) {
    // Prefill service from ?service=
    var params = new URLSearchParams(location.search);
    var svc = params.get("service");
    var select = form.querySelector("select[name=service]");
    if (svc && select) {
      Array.prototype.forEach.call(select.options, function (o) { if (o.value === svc) select.value = svc; });
    }
    var dateInput = form.querySelector("input[type=date]");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      var lines = [
        "Name: " + data.get("name"),
        "Phone: " + data.get("phone"),
        "Email: " + data.get("email"),
        "Service: " + data.get("service"),
        "Preferred date: " + (data.get("date") || "Flexible"),
        "Preferred time: " + (data.get("time") || "Flexible"),
        "",
        data.get("message") || ""
      ];
      var href = "mailto:lavenderspa@gmail.com?subject=" +
        encodeURIComponent("Appointment request — " + data.get("service")) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      window.location.href = href;
      var status = form.querySelector(".form-status");
      if (status) status.textContent = "Thank you! Your email app should open with your request ready to send. Prefer to talk? Call (519) 326-3331.";
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Soft page transitions for internal links                               */
  /* ---------------------------------------------------------------------- */
  if (!reduceMotion) {
    doc.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      var href = a.getAttribute("href");
      if (!href || a.target === "_blank" || href.charAt(0) === "#" || /^(mailto:|tel:|https?:)/.test(href)) return;
      var url = new URL(a.href, location.href);
      if (url.pathname === location.pathname) return;
      e.preventDefault();
      doc.body.classList.add("is-leaving");
      setTimeout(function () { location.href = a.href; }, 280);
    });
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) doc.body.classList.remove("is-leaving");
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Swipe carousel dots (carousels are CSS-only; dots show on phones)      */
  /* ---------------------------------------------------------------------- */
  doc.querySelectorAll(".swipe").forEach(function (track) {
    var items = track.children;
    if (items.length < 2) return;
    var dots = doc.createElement("div");
    dots.className = "swipe-dots";
    dots.setAttribute("aria-hidden", "true");
    for (var i = 0; i < items.length; i++) dots.appendChild(doc.createElement("span"));
    track.parentNode.insertBefore(dots, track.nextSibling);
    var pending = false;
    function update() {
      pending = false;
      var step = items[1].offsetLeft - items[0].offsetLeft || 1;
      var max = track.scrollWidth - track.clientWidth;
      var idx = track.scrollLeft >= max - 4 ? items.length - 1 : Math.round(track.scrollLeft / step);
      Array.prototype.forEach.call(dots.children, function (d, n) { d.classList.toggle("is-active", n === idx); });
    }
    track.addEventListener("scroll", function () {
      if (!pending) { pending = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  });

  /* Year */
  doc.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
