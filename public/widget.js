/**
 * AdaMenu Widget v2.0
 * Self-contained, shadow DOM isolated, multi-tenant restaurant menu widget.
 *
 * Usage:
 *   <script src="https://ada.mindgen.app/widget.js"
 *     data-restaurant="losteria"
 *     data-lang="nl"
 *     data-theme="light"
 *     data-primary-color="#861b2d"
 *     data-accent-color="#616f42"></script>
 */
(function () {
  "use strict";

  // ── Find our script tag ──
  var scriptEl =
    document.currentScript ||
    (function () {
      var scripts = document.querySelectorAll("script[data-restaurant]");
      return scripts[scripts.length - 1];
    })();

  if (!scriptEl) return;

  var SLUG = scriptEl.getAttribute("data-restaurant");
  if (!SLUG) return;

  var API_BASE = (function () {
    try { return new URL(scriptEl.src).origin; }
    catch (e) { return ""; }
  })();

  var ATTR_LANG = scriptEl.getAttribute("data-lang");
  var ATTR_THEME = scriptEl.getAttribute("data-theme") || "light";
  var ATTR_PRIMARY = scriptEl.getAttribute("data-primary-color");
  var ATTR_ACCENT = scriptEl.getAttribute("data-accent-color");

  // ── Utility helpers ──
  function esc(s) {
    if (!s) return "";
    var d = document.createElement("span");
    d.textContent = s;
    return d.innerHTML;
  }

  function t(obj, lang) {
    if (!obj) return "";
    return obj[lang] || obj.en || obj.nl || obj.fr || obj.it || "";
  }

  function formatPrice(p) {
    if (p == null || p === "") return "";
    var n = parseFloat(p);
    if (isNaN(n)) return esc(String(p));
    // Belgian format: comma decimal separator (€ 14,50 not €14.50)
    var formatted = n.toFixed(2).replace(".", ",").replace(/,00$/, "");
    return "€\u00A0" + formatted;
  }

  function detectLangFromURL() {
    try {
      var path = window.location.pathname;
      if (/\/(fr)(\/|$)/i.test(path)) return "fr";
      if (/\/(en)(\/|$)/i.test(path)) return "en";
      if (/\/(nl)(\/|$)/i.test(path)) return "nl";
    } catch (e) {}
    return null;
  }

  var UI_STRINGS = {
    chooseCategory: { nl: "Kies categorie", fr: "Choisir une catégorie", en: "Choose a category" },
    loading: { nl: "Menu laden…", fr: "Chargement du menu…", en: "Loading menu…" },
    errorTitle: { nl: "Menu niet beschikbaar", fr: "Menu non disponible", en: "Menu unavailable" },
    errorBody: { nl: "Probeer later opnieuw.", fr: "Réessayez plus tard.", en: "Please try again later." },
    noItems: { nl: "Geen items", fr: "Aucun article", en: "No items" },
    allergens: { nl: "Allergenen", fr: "Allergènes", en: "Allergens" },
    supplements: { nl: "Supplementen", fr: "Suppléments", en: "Supplements" },
    lastUpdated: { nl: "Laatst bijgewerkt", fr: "Dernière mise à jour", en: "Last updated" },
    dailySpecials: { nl: "Suggestie van de dag", fr: "Suggestion du jour", en: "Daily Special" },
    unavailable: { nl: "Niet beschikbaar", fr: "Non disponible", en: "Unavailable" },
    poweredBy: { nl: "Menu door", fr: "Menu par", en: "Menu by" },
  };

  function uiStr(key, lang) {
    var o = UI_STRINGS[key];
    return o ? (o[lang] || o.en || "") : key;
  }

  // ── Allergen name mapping ──
  var ALLERGEN_LABELS = {
    gluten: { nl: "Gluten", fr: "Gluten", en: "Gluten", icon: "🌾" },
    dairy: { nl: "Melk", fr: "Lait", en: "Dairy", icon: "🥛" },
    eggs: { nl: "Eieren", fr: "Œufs", en: "Eggs", icon: "🥚" },
    fish: { nl: "Vis", fr: "Poisson", en: "Fish", icon: "🐟" },
    shellfish: { nl: "Schaaldieren", fr: "Crustacés", en: "Shellfish", icon: "🦐" },
    nuts: { nl: "Noten", fr: "Noix", en: "Nuts", icon: "🥜" },
    peanuts: { nl: "Pinda's", fr: "Arachides", en: "Peanuts", icon: "🥜" },
    soy: { nl: "Soja", fr: "Soja", en: "Soy", icon: "🫘" },
    celery: { nl: "Selderij", fr: "Céleri", en: "Celery", icon: "🥬" },
    mustard: { nl: "Mosterd", fr: "Moutarde", en: "Mustard", icon: "🟡" },
    sesame: { nl: "Sesam", fr: "Sésame", en: "Sesame", icon: "⚪" },
    sulphites: { nl: "Sulfiet", fr: "Sulfites", en: "Sulphites", icon: "🍷" },
    lupin: { nl: "Lupine", fr: "Lupin", en: "Lupin", icon: "🌸" },
    molluscs: { nl: "Weekdieren", fr: "Mollusques", en: "Molluscs", icon: "🐚" },
  };

  // ── CSS ──
  function buildCSS(theme) {
    var primary = ATTR_PRIMARY || theme.primaryColor || "#2c3e50";
    var isDark = ATTR_THEME === "dark";

    var bg, bgCard, hoverBg, textMain, textMuted, borderColor;
    if (isDark) {
      bg = "#1a1a2e";
      bgCard = "#16213e";
      hoverBg = "#1f3054";
      textMain = "#e0e0e0";
      textMuted = "#9a9ab0";
      borderColor = "#2a2a4a";
    } else {
      bg = theme.backgroundColor || "#fafaf8";
      bgCard = theme.backgroundColor || "#fafaf8";
      hoverBg = theme.hoverColor || "#f0ede5";
      textMain = theme.textColor || "#333";
      textMuted = "#777";
      borderColor = "#e8e4dc";
    }

    var headerFont = theme.headerFontFamily || "inherit";
    var bodyFont = theme.fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    return "\n\
:host { display:block; width:100%; }\n\
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }\n\
\n\
.adamenu {\n\
  font-family: " + bodyFont + ";\n\
  color: " + textMain + ";\n\
  background: " + bg + ";\n\
  line-height: 1.5;\n\
  -webkit-font-smoothing: antialiased;\n\
}\n\
\n\
/* ── Loading skeleton ── */\n\
.adamenu-skeleton { padding: 2rem; }\n\
.adamenu-skeleton-tabs { display:flex; gap:1rem; margin-bottom:2rem; overflow:hidden; }\n\
.adamenu-skeleton-tab { width:120px; height:44px; border-radius:8px; background:" + hoverBg + "; animation: adamenu-pulse 1.5s ease-in-out infinite; }\n\
.adamenu-skeleton-title { width:220px; height:40px; border-radius:8px; background:" + hoverBg + "; margin:0 auto 2rem; animation: adamenu-pulse 1.5s ease-in-out infinite; }\n\
.adamenu-skeleton-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }\n\
.adamenu-skeleton-card { height:240px; border-radius:12px; background:" + hoverBg + "; animation: adamenu-pulse 1.5s ease-in-out infinite; }\n\
@keyframes adamenu-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }\n\
@media(max-width:768px){ .adamenu-skeleton-grid{grid-template-columns:1fr;} }\n\
\n\
/* ── Error state ── */\n\
.adamenu-error { text-align:center; padding:3rem 2rem; }\n\
.adamenu-error-icon { font-size:3rem; margin-bottom:1rem; }\n\
.adamenu-error h3 { font-size:1.25rem; margin-bottom:.5rem; }\n\
.adamenu-error p { color:" + textMuted + "; }\n\
.adamenu-error button { margin-top:1rem; padding:.6rem 1.5rem; border:2px solid " + primary + "; background:transparent; color:" + primary + "; border-radius:8px; cursor:pointer; font-weight:600; transition:all .2s; }\n\
.adamenu-error button:hover { background:" + primary + "; color:white; }\n\
\n\
/* ── Language switcher ── */\n\
.adamenu-topbar { display:flex; justify-content:flex-end; align-items:center; padding:.75rem 1.5rem; gap:.5rem; }\n\
.adamenu-lang-btn { padding:.35rem .75rem; border:1.5px solid " + borderColor + "; background:transparent; color:" + textMuted + "; border-radius:6px; cursor:pointer; font-size:.8rem; font-weight:600; text-transform:uppercase; transition:all .2s; font-family:inherit; }\n\
.adamenu-lang-btn:hover { border-color:" + primary + "; color:" + primary + "; }\n\
.adamenu-lang-btn.active { background:" + primary + "; color:white; border-color:" + primary + "; }\n\
\n\
/* ── Category tabs (desktop) ── */\n\
.adamenu-tabs { display:flex; list-style:none; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none; border-bottom:2px solid " + borderColor + "; }\n\
.adamenu-tabs::-webkit-scrollbar { display:none; }\n\
.adamenu-tab { flex-shrink:0; padding:.9rem 1.8rem; cursor:pointer; font-size:.85rem; font-weight:600; letter-spacing:.03em; text-transform:uppercase; color:" + textMuted + "; background:transparent; border:none; border-bottom:3px solid transparent; margin-bottom:-2px; transition:all .25s; white-space:nowrap; }\n\
.adamenu-tab:hover { color:" + primary + "; background:" + hoverBg + "; }\n\
.adamenu-tab.active { color:" + primary + "; border-bottom-color:" + primary + "; font-weight:700; }\n\
\n\
/* ── Mobile category selector ── */\n\
.adamenu-mobile-sel { display:none; padding:1rem 1.5rem; background:" + bgCard + "; border-bottom:1px solid " + borderColor + "; cursor:pointer; }\n\
.adamenu-mobile-sel-inner { display:flex; justify-content:space-between; align-items:center; }\n\
.adamenu-mobile-label { font-size:.75rem; color:" + textMuted + "; margin-bottom:.15rem; }\n\
.adamenu-mobile-value { font-weight:600; font-size:.95rem; color:" + textMain + "; }\n\
.adamenu-mobile-chevron { width:20px; height:20px; color:" + textMuted + "; transition:transform .3s; }\n\
.adamenu-mobile-sel.open .adamenu-mobile-chevron { transform:rotate(180deg); }\n\
\n\
/* ── Mobile dropdown ── */\n\
.adamenu-dropdown { display:none; background:" + bgCard + "; border-bottom:1px solid " + borderColor + "; max-height:0; overflow:hidden; transition:max-height .35s ease; }\n\
.adamenu-dropdown.open { display:block; max-height:600px; }\n\
.adamenu-dropdown-item { padding:.85rem 1.5rem; cursor:pointer; font-size:.9rem; color:" + textMain + "; transition:background .2s; }\n\
.adamenu-dropdown-item:hover { background:" + hoverBg + "; }\n\
.adamenu-dropdown-item.active { color:" + primary + "; font-weight:600; background:" + hoverBg + "; }\n\
\n\
/* ── Category title ── */\n\
.adamenu-cat-header { text-align:center; padding:2.5rem 1rem 1.5rem; }\n\
.adamenu-cat-title { font-family:" + headerFont + "; font-weight:300; font-size:2.2rem; color:" + primary + "; letter-spacing:.02em; }\n\
\n\
/* ── Subcategory grid ── */\n\
.adamenu-content { padding:0 1.5rem 2rem; }\n\
.adamenu-subcats { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }\n\
\n\
/* ── Subcategory card ── */\n\
.adamenu-subcat { background:" + bgCard + "; border-radius:12px; padding:1.5rem; border:1px solid " + borderColor + "; transition:box-shadow .3s; }\n\
.adamenu-subcat:hover { box-shadow:0 4px 20px rgba(0,0,0,.06); }\n\
.adamenu-subcat-title { font-size:1.05rem; font-weight:700; color:" + primary + "; padding-bottom:.75rem; margin-bottom:.75rem; border-bottom:2px solid " + primary + "22; }\n\
\n\
/* ── Menu items ── */\n\
.adamenu-item { display:flex; justify-content:space-between; align-items:flex-start; padding:.65rem .5rem; border-radius:6px; transition:background .2s; gap:1rem; }\n\
.adamenu-item:hover { background:" + hoverBg + "; }\n\
.adamenu-item-info { flex:1; min-width:0; }\n\
.adamenu-item-name { font-weight:600; font-size:.92rem; color:" + textMain + "; }\n\
.adamenu-item-desc { font-size:.78rem; color:" + textMuted + "; margin-top:.15rem; line-height:1.4; }\n\
.adamenu-item-price { font-weight:700; font-size:.92rem; color:" + primary + "; white-space:nowrap; flex-shrink:0; }\n\
\n\
/* ── Allergen badges ── */\n\
.adamenu-allergens { display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.3rem; }\n\
.adamenu-allergen { display:inline-flex; align-items:center; gap:.2rem; padding:.1rem .4rem; font-size:.65rem; background:" + primary + "15; color:" + primary + "; border-radius:4px; font-weight:500; }\n\
\n\
/* ── Supplements block ── */\n\
.adamenu-supplements { margin-top:1.25rem; padding:1rem; border:1.5px dashed " + primary + "44; border-radius:8px; background:" + primary + "08; }\n\
.adamenu-supp-title { font-size:.9rem; font-weight:700; color:" + primary + "; margin-bottom:.6rem; }\n\
.adamenu-supp-base { font-size:.8rem; font-style:italic; color:" + textMuted + "; margin-bottom:.5rem; }\n\
\n\
/* ── Last Updated Footer ── */\n\
.adamenu-footer { text-align:center; padding:1.5rem; font-size:.75rem; color:" + textMuted + "; border-top:1px solid " + borderColor + "; margin-top:1.5rem; }\n\
\n\
/* ── 86'd / Unavailable items ── */\n\
.adamenu-item.adamenu-item-86d { opacity:.5; }\n\
.adamenu-item-86d .adamenu-item-price { text-decoration:line-through; }\n\
.adamenu-86-badge { display:inline-block; padding:.1rem .4rem; font-size:.65rem; background:#ef4444; color:white; border-radius:4px; font-weight:700; margin-left:.4rem; }\n\
\n\
/* ── Daily Specials ── */\n\
.adamenu-specials { margin:0 1.5rem 1.5rem; padding:1.25rem; border:2px solid " + primary + "; border-radius:12px; background:" + primary + "08; }\n\
.adamenu-specials-title { font-size:1.1rem; font-weight:700; color:" + primary + "; margin-bottom:.75rem; text-align:center; }\n\
\n\
/* ── Print stylesheet ── */\n\
@media print {\n\
  .adamenu-topbar, .adamenu-mobile-sel, .adamenu-dropdown, .adamenu-tabs, .adamenu-footer { display:none !important; }\n\
  .adamenu-subcats { display:block !important; }\n\
  .adamenu-subcat { break-inside:avoid; page-break-inside:avoid; border:1px solid #ccc !important; margin-bottom:1rem !important; }\n\
  .adamenu-item:hover { background:none !important; }\n\
  .adamenu { background:white !important; color:black !important; }\n\
  .adamenu-cat-title, .adamenu-subcat-title { color:black !important; }\n\
  .adamenu-item-price { color:black !important; font-weight:bold !important; }\n\
  .adamenu-allergen { background:#eee !important; color:#333 !important; }\n\
  .adamenu-specials { border-color:#333 !important; background:white !important; }\n\
}\n\
\n\
/* ── Responsive ── */\n\
@media(max-width:920px) {\n\
  .adamenu-tabs { display:none; }\n\
  .adamenu-mobile-sel { display:block; }\n\
  .adamenu-subcats { grid-template-columns:1fr; gap:1rem; }\n\
  .adamenu-cat-title { font-size:1.6rem; }\n\
  .adamenu-content { padding:0 1rem 1.5rem; }\n\
}\n\
\n\
@media(max-width:480px) {\n\
  .adamenu-item-name { font-size:.85rem; }\n\
  .adamenu-item-desc { font-size:.72rem; }\n\
  .adamenu-subcat { padding:1rem; }\n\
}\n\
";
  }

  // ── JSON-LD Structured Data for SEO ──
  function injectStructuredData(config, menuData, lang) {
    // Remove any existing Adamenu structured data
    var existing = document.querySelector('script[data-adamenu-jsonld]');
    if (existing) existing.parentNode.removeChild(existing);

    var restaurantName = config.name || config.slug || SLUG;
    var categories = menuData
      .filter(function(c) { return !c.hidden; })
      .sort(function(a, b) { return (a.order || 0) - (b.order || 0); });

    var menuSections = categories.map(function(cat) {
      var items = [];
      (cat.subCategories || []).forEach(function(sub) {
        (sub.menuItems || []).forEach(function(item) {
          if (!item.hidden) {
            var menuItem = {
              "@type": "MenuItem",
              "name": t(item.names, lang) || item.name || "",
              "offers": {
                "@type": "Offer",
                "price": item.price,
                "priceCurrency": "EUR"
              }
            };
            var desc = t(item.descriptions, lang);
            if (desc) menuItem.description = desc;
            items.push(menuItem);
          }
        });
      });
      return {
        "@type": "MenuSection",
        "name": t(cat.names, lang),
        "hasMenuItem": items
      };
    });

    var schema = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": restaurantName,
      "hasMenu": {
        "@type": "Menu",
        "hasMenuSection": menuSections
      }
    };

    var scriptTag = document.createElement("script");
    scriptTag.type = "application/ld+json";
    scriptTag.setAttribute("data-adamenu-jsonld", "true");
    scriptTag.textContent = JSON.stringify(schema);
    document.head.appendChild(scriptTag);
  }

  // ── SVG icons ──
  var ICON_CHEVRON = '<svg class="adamenu-mobile-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

  // ── Create Shadow DOM host ──
  var host = document.createElement("div");
  host.id = "adamenu-host-" + SLUG;
  scriptEl.parentNode.insertBefore(host, scriptEl.nextSibling);

  var shadow = host.attachShadow({ mode: "open" });

  // ── Render: Loading skeleton ──
  function renderSkeleton(root, lang) {
    root.innerHTML = '\
<div class="adamenu">\
  <div class="adamenu-skeleton">\
    <div class="adamenu-skeleton-tabs">\
      <div class="adamenu-skeleton-tab"></div>\
      <div class="adamenu-skeleton-tab"></div>\
      <div class="adamenu-skeleton-tab"></div>\
      <div class="adamenu-skeleton-tab"></div>\
      <div class="adamenu-skeleton-tab"></div>\
    </div>\
    <div class="adamenu-skeleton-title"></div>\
    <div class="adamenu-skeleton-grid">\
      <div class="adamenu-skeleton-card"></div>\
      <div class="adamenu-skeleton-card"></div>\
      <div class="adamenu-skeleton-card"></div>\
      <div class="adamenu-skeleton-card"></div>\
    </div>\
    <p style="text-align:center;margin-top:1.5rem;opacity:.6;font-size:.9rem;">' + esc(uiStr("loading", lang)) + '</p>\
  </div>\
</div>';
  }

  // ── Render: Error state ──
  function renderError(root, lang, onRetry) {
    root.innerHTML = '\
<div class="adamenu">\
  <div class="adamenu-error">\
    <div class="adamenu-error-icon">🍽️</div>\
    <h3>' + esc(uiStr("errorTitle", lang)) + '</h3>\
    <p>' + esc(uiStr("errorBody", lang)) + '</p>\
    <button id="adamenu-retry">↻ Retry</button>\
  </div>\
</div>';
    var btn = root.getElementById("adamenu-retry");
    if (btn) btn.addEventListener("click", onRetry);
  }

  // ── Render: Full menu ──
  function renderMenu(root, config, menuData, lang) {
    var languages = config.languages || ["nl", "fr", "en"];
    var excludeIds = config.excludeCategoryIds || [];

    var categories = menuData
      .filter(function (c) { return !c.hidden && excludeIds.indexOf(c.id) === -1; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    if (!categories.length) {
      root.innerHTML = '<div class="adamenu"><p style="text-align:center;padding:2rem;">' + esc(uiStr("noItems", lang)) + '</p></div>';
      return;
    }

    var currentCat = categories[0];
    var dropdownOpen = false;

    // ── Build the DOM tree ──
    var wrapper = document.createElement("div");
    wrapper.className = "adamenu";

    // -- Top bar with language switcher --
    var topbar = document.createElement("div");
    topbar.className = "adamenu-topbar";
    languages.forEach(function (l) {
      var btn = document.createElement("button");
      btn.className = "adamenu-lang-btn" + (l === lang ? " active" : "");
      btn.textContent = l.toUpperCase();
      btn.addEventListener("click", function () {
        lang = l;
        fullRerender();
      });
      topbar.appendChild(btn);
    });
    wrapper.appendChild(topbar);

    // -- Desktop tabs --
    var tabsUl = document.createElement("ul");
    tabsUl.className = "adamenu-tabs";
    wrapper.appendChild(tabsUl);

    // -- Mobile selector --
    var mobileSel = document.createElement("div");
    mobileSel.className = "adamenu-mobile-sel";
    mobileSel.innerHTML =
      '<div class="adamenu-mobile-sel-inner">' +
      '<div><div class="adamenu-mobile-label"></div><div class="adamenu-mobile-value"></div></div>' +
      ICON_CHEVRON +
      '</div>';
    wrapper.appendChild(mobileSel);

    var dropdown = document.createElement("div");
    dropdown.className = "adamenu-dropdown";
    wrapper.appendChild(dropdown);

    // -- Category header --
    var catHeader = document.createElement("div");
    catHeader.className = "adamenu-cat-header";
    var catTitle = document.createElement("h2");
    catTitle.className = "adamenu-cat-title";
    catHeader.appendChild(catTitle);
    wrapper.appendChild(catHeader);

    // -- Content area --
    var content = document.createElement("div");
    content.className = "adamenu-content";
    var subcatsGrid = document.createElement("div");
    subcatsGrid.className = "adamenu-subcats";
    content.appendChild(subcatsGrid);
    wrapper.appendChild(content);

    // ── Event: mobile selector ──
    mobileSel.addEventListener("click", function () {
      dropdownOpen = !dropdownOpen;
      mobileSel.classList.toggle("open", dropdownOpen);
      dropdown.classList.toggle("open", dropdownOpen);
    });

    // ── Show a category ──
    function showCategory(cat) {
      currentCat = cat;
      dropdownOpen = false;
      mobileSel.classList.remove("open");
      dropdown.classList.remove("open");

      // Update tabs
      var tabs = tabsUl.querySelectorAll(".adamenu-tab");
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.toggle("active", tabs[i].getAttribute("data-cid") === cat.id);
      }

      // Update mobile
      mobileSel.querySelector(".adamenu-mobile-label").textContent = uiStr("chooseCategory", lang);
      mobileSel.querySelector(".adamenu-mobile-value").textContent = t(cat.names, lang);

      // Update dropdown
      var ddItems = dropdown.querySelectorAll(".adamenu-dropdown-item");
      for (var j = 0; j < ddItems.length; j++) {
        ddItems[j].classList.toggle("active", ddItems[j].getAttribute("data-cid") === cat.id);
      }

      // Title
      catTitle.textContent = t(cat.names, lang);

      // Subcategories
      subcatsGrid.innerHTML = "";
      var subs = (cat.subCategories || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

      subs.forEach(function (sub) {
        var items = (sub.menuItems || [])
          .filter(function (mi) { return !mi.hidden; })
          .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        if (!items.length) return;

        var card = document.createElement("div");
        card.className = "adamenu-subcat";

        var h3 = document.createElement("h3");
        h3.className = "adamenu-subcat-title";
        h3.textContent = t(sub.names, lang);
        card.appendChild(h3);

        items.forEach(function (item) {
          card.appendChild(buildItem(item, lang));
        });

        // Supplements (from config)
        if (config.supplements && config.supplements[sub.id]) {
          card.appendChild(buildSupplements(config.supplements[sub.id], sub.id, lang));
        }

        subcatsGrid.appendChild(card);
      });
    }

    // ── Build tabs & dropdown items ──
    function buildNav() {
      tabsUl.innerHTML = "";
      dropdown.innerHTML = "";
      categories.forEach(function (cat) {
        // Desktop tab
        var li = document.createElement("li");
        li.className = "adamenu-tab";
        li.textContent = t(cat.names, lang);
        li.setAttribute("data-cid", cat.id);
        li.addEventListener("click", function () { showCategory(cat); });
        tabsUl.appendChild(li);

        // Mobile dropdown item
        var di = document.createElement("div");
        di.className = "adamenu-dropdown-item";
        di.textContent = t(cat.names, lang);
        di.setAttribute("data-cid", cat.id);
        di.addEventListener("click", function () { showCategory(cat); });
        dropdown.appendChild(di);
      });
    }

    // ── Build a menu item row ──
    function buildItem(item, lang) {
      var div = document.createElement("div");
      div.className = "adamenu-item";

      var info = document.createElement("div");
      info.className = "adamenu-item-info";

      var nameEl = document.createElement("div");
      nameEl.className = "adamenu-item-name";
      nameEl.textContent = t(item.names, lang) || item.name || "";
      info.appendChild(nameEl);

      var desc = t(item.descriptions, lang);
      // Don't show desc if same as name
      if (desc && desc !== (t(item.names, lang) || item.name || "")) {
        var descEl = document.createElement("div");
        descEl.className = "adamenu-item-desc";
        descEl.textContent = desc;
        info.appendChild(descEl);
      }

      // Allergens
      if (item.allergens && item.allergens.length) {
        var allergenDiv = document.createElement("div");
        allergenDiv.className = "adamenu-allergens";
        item.allergens.forEach(function (a) {
          var key = (typeof a === "string" ? a : a.name || a.id || "").toLowerCase();
          var labelObj = ALLERGEN_LABELS[key];
          var badge = document.createElement("span");
          badge.className = "adamenu-allergen";
          if (labelObj) {
            badge.textContent = labelObj.icon + " " + (labelObj[lang] || labelObj.en);
          } else {
            badge.textContent = key;
          }
          allergenDiv.appendChild(badge);
        });
        info.appendChild(allergenDiv);
      }

      div.appendChild(info);

      var priceEl = document.createElement("div");
      priceEl.className = "adamenu-item-price";
      priceEl.textContent = formatPrice(item.price);
      div.appendChild(priceEl);

      return div;
    }

    // ── Build supplements block ──
    function buildSupplements(suppConfig, subId, lang) {
      var wrap = document.createElement("div");
      wrap.className = "adamenu-supplements";

      // Show base text if configured for this subcategory (no more hardcoded IDs)
      if (suppConfig.baseText) {
        var baseP = document.createElement("div");
        baseP.className = "adamenu-supp-base";
        baseP.textContent = t(suppConfig.baseText, lang) || suppConfig.baseText;
        wrap.appendChild(baseP);
      }

      var title = document.createElement("div");
      title.className = "adamenu-supp-title";
      title.textContent = t(suppConfig.title, lang);
      wrap.appendChild(title);

      (suppConfig.items || []).forEach(function (si) {
        var row = document.createElement("div");
        row.className = "adamenu-item";

        var info = document.createElement("div");
        info.className = "adamenu-item-info";

        var name = document.createElement("div");
        name.className = "adamenu-item-name";
        name.textContent = si.name || "";
        info.appendChild(name);

        var desc = t(si.descriptions, lang);
        if (desc) {
          var d = document.createElement("div");
          d.className = "adamenu-item-desc";
          d.textContent = desc;
          info.appendChild(d);
        }

        row.appendChild(info);

        var price = document.createElement("div");
        price.className = "adamenu-item-price";
        price.textContent = formatPrice(si.price);
        row.appendChild(price);

        wrap.appendChild(row);
      });

      return wrap;
    }

    // ── Update language buttons ──
    function updateLangButtons() {
      var btns = topbar.querySelectorAll(".adamenu-lang-btn");
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle("active", btns[i].textContent.toLowerCase() === lang);
      }
    }

    // ── Full re-render (on language switch) ──
    function fullRerender() {
      updateLangButtons();
      buildNav();
      showCategory(currentCat);
    }

    // ── Last Updated Footer ──
    var footer = document.createElement("div");
    footer.className = "adamenu-footer";
    var lastUpdatedDate = config.lastUpdatedAt ? new Date(config.lastUpdatedAt) : new Date();
    var dateLocale = lang === "nl" ? "nl-BE" : lang === "fr" ? "fr-BE" : "en-GB";
    footer.textContent = uiStr("lastUpdated", lang) + ": " + lastUpdatedDate.toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });
    wrapper.appendChild(footer);

    // ── Mount ──
    root.innerHTML = "";
    root.appendChild(wrapper);
    buildNav();
    showCategory(categories[0]);
  }

  // ── Boot ──
  function boot() {
    var tempLang = ATTR_LANG || detectLangFromURL() || "nl";

    // Inject styles into shadow DOM
    var styleEl = document.createElement("style");
    shadow.appendChild(styleEl);

    // Show skeleton
    var contentRoot = document.createElement("div");
    shadow.appendChild(contentRoot);
    renderSkeleton(contentRoot, tempLang);

    // Fetch menu data
    var url = API_BASE + "/api/widget/" + encodeURIComponent(SLUG) + "/menu";
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        var config = data.restaurant || {};
        var menuData = data.menu || [];

        // Cache in localStorage for offline fallback
        try {
          localStorage.setItem("adamenu-cache-" + SLUG, JSON.stringify(data));
          localStorage.setItem("adamenu-cache-ts-" + SLUG, Date.now().toString());
        } catch(e) { /* localStorage full or unavailable — ignore */ }

        // Resolve language: data-lang > URL detect > restaurant default > nl
        var lang = ATTR_LANG || detectLangFromURL() || config.defaultLanguage || "nl";

        // Build CSS with theme info
        styleEl.textContent = buildCSS(config.theme || {});

        renderMenu(contentRoot, config, menuData, lang);

        // Inject SEO structured data into main document
        injectStructuredData(config, menuData, lang);
      })
      .catch(function (err) {
        console.error("[AdaMenu] Failed to load menu:", err);

        // Try localStorage offline cache before showing error
        try {
          var cachedStr = localStorage.getItem("adamenu-cache-" + SLUG);
          if (cachedStr) {
            var cachedData = JSON.parse(cachedStr);
            var config = cachedData.restaurant || {};
            var menuData = cachedData.menu || [];
            var lang = ATTR_LANG || detectLangFromURL() || config.defaultLanguage || "nl";
            styleEl.textContent = buildCSS(config.theme || {});
            renderMenu(contentRoot, config, menuData, lang);
            console.log("[AdaMenu] Serving from offline cache");
            return;
          }
        } catch(e) { /* cache parse error — fall through to error */ }

        styleEl.textContent = buildCSS({});
        renderError(contentRoot, tempLang, function () {
          // Clear shadow DOM and re-boot
          while (shadow.firstChild) shadow.removeChild(shadow.firstChild);
          boot();
        });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
