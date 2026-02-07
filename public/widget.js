(function () {
  "use strict";

  // ── Find script tag & config ──
  var script =
    document.currentScript ||
    document.querySelector("script[data-restaurant]");
  if (!script) return;

  var slug = script.getAttribute("data-restaurant");
  if (!slug) return;

  var apiBase = new URL(script.src).origin;

  // ── Create container ──
  var container = document.createElement("div");
  container.id = "adamenu-widget-" + slug;
  container.className = "adamenu-widget";
  script.parentNode.insertBefore(container, script.nextSibling);

  // ── Language detection ──
  function detectLang() {
    try {
      var url = window.location.href;
      if (url.indexOf("/fr") !== -1) return "fr";
      if (url.indexOf("/en") !== -1) return "en";
    } catch (e) {}
    return null; // use default
  }

  // ── Inject CSS ──
  function injectStyles(theme) {
    if (document.getElementById("adamenu-widget-styles")) return;

    var css = [
      '@import url("https://fonts.cdnfonts.com/css/celine-sans");',
      '@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap");',
      "",
      ".adamenu-widget { font-family: " + theme.fontFamily + '; width:100%; margin:0; padding:0; box-sizing:border-box; }',
      ".adamenu-widget *, .adamenu-widget *::before, .adamenu-widget *::after { box-sizing:border-box; }",
      "",
      "/* ── Category tabs ── */",
      ".adamenu-tabs { display:flex; list-style:none; margin:0 auto; padding:0; width:100%; }",
      ".adamenu-tab { display:flex; justify-content:center; align-items:center; position:relative; overflow:hidden;",
      "  background:" + theme.backgroundColor + "; color:" + theme.textColor + "; padding:1rem 2rem; cursor:pointer;",
      "  border-right:1px solid " + theme.hoverColor + "; font-size:12px; font-weight:600; transition:background .3s; }",
      ".adamenu-tab::after { content:''; position:absolute; bottom:0; left:0; right:0; height:4px;",
      "  background:" + theme.primaryColor + "; transform:scaleX(0); transition:transform .5s; }",
      ".adamenu-tab:hover, .adamenu-tab.adamenu-selected { background:" + theme.hoverColor + "; color:" + theme.primaryColor + "; font-weight:700; }",
      ".adamenu-tab:hover::after, .adamenu-tab.adamenu-selected::after { transform:scaleX(1); }",
      "",
      "/* ── Category title ── */",
      ".adamenu-cat-title { font-family:" + theme.headerFontFamily + "; font-weight:lighter; font-size:42px; color:white; text-align:center; padding:4rem 0; }",
      "",
      "/* ── Mobile selector ── */",
      ".adamenu-mobile-sel { display:none; justify-content:space-between; align-items:center; margin:auto;",
      "  padding:1rem; background:" + theme.backgroundColor + "; width:100%; cursor:pointer; }",
      ".adamenu-mobile-sel .adamenu-chose { font-size:smaller; }",
      ".adamenu-mobile-sel svg { width:16px; height:16px; }",
      "",
      "/* ── Dialog (mobile dropdown) ── */",
      ".adamenu-dialog { display:none; position:fixed; z-index:9999; left:0; top:0; width:100%;",
      "  background:" + theme.backgroundColor + "; box-shadow:0 2px 10px rgba(0,0,0,.1); padding:2rem; }",
      ".adamenu-dialog-inner { max-height:calc(100vh - 4rem); overflow-y:auto; }",
      "",
      "/* ── Subcategories grid ── */",
      ".adamenu-subcats { display:grid; grid-template-columns:auto auto; gap:2rem; margin-top:20px; }",
      ".adamenu-subcat { background:" + theme.backgroundColor + "; padding:2rem; margin-bottom:10px; border-radius:4px; height:fit-content; }",
      ".adamenu-subcat h3 { font-size:18px; padding-bottom:1rem; margin-bottom:1rem; border-bottom:1px solid #000;",
      "  margin-top:0; color:" + theme.primaryColor + "; }",
      "",
      "/* ── Menu items ── */",
      ".adamenu-item { position:relative; display:flex; justify-content:space-between; padding:10px;",
      "  border-bottom:1px solid #eee; }",
      ".adamenu-item:last-child { border-bottom:none; }",
      ".adamenu-item:hover { background:" + theme.hoverColor + "; }",
      ".adamenu-item article { width:85%; }",
      ".adamenu-item .adamenu-price { width:51px; }",
      ".adamenu-item .adamenu-desc { margin:0; font-size:x-small; }",
      ".adamenu-item .adamenu-name { margin:0; }",
      "",
      "/* ── Supplements ── */",
      ".adamenu-supplements { background:" + theme.backgroundColor + "; padding:1rem; margin-bottom:10px; border-radius:4px;",
      "  height:fit-content; border:1px solid #000; margin-top:2rem; }",
      ".adamenu-supplements h3 { font-size:18px; padding-bottom:1rem; margin-bottom:1rem; border-bottom:1px solid #000;",
      "  margin-top:0; color:" + theme.primaryColor + "; }",
      ".adamenu-supplements h4 { font-size:16px; margin-top:0; }",
      ".adamenu-supplements .adamenu-item .adamenu-price { position:absolute; top:50%; right:0; transform:translateY(-50%); width:unset; }",
      ".adamenu-supplements article { width:85%; }",
      ".adamenu-supplements .adamenu-name { width:100%; }",
      "",
      "/* ── Responsive ── */",
      "@media (max-width:1124px) {",
      "  .adamenu-mobile-sel { display:flex; }",
      "  .adamenu-tabs { display:none; }",
      "}",
      "@media (max-width:920px) {",
      "  .adamenu-subcats { grid-template-columns:auto; gap:1rem; }",
      "  .adamenu-name { font-size:small; }",
      "  .adamenu-item .adamenu-price { position:absolute; top:50%; right:0; width:31px; }",
      "}",
    ].join("\n");

    var style = document.createElement("style");
    style.id = "adamenu-widget-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Chevron SVG (replaces Font Awesome) ──
  var chevronSVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';

  // ── Render ──
  function render(el, config, menuData, lang) {
    var theme = config.theme;
    injectStyles(theme);

    var excludeIds = config.excludeCategoryIds || [];
    var categories = menuData
      .filter(function (c) {
        return excludeIds.indexOf(c.id) === -1;
      })
      .sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });

    if (!categories.length) {
      el.innerHTML = "<p>No menu data available.</p>";
      return;
    }

    // State
    var currentCategory = categories[0];

    // Build DOM
    var mobileSel = document.createElement("div");
    mobileSel.className = "adamenu-mobile-sel";
    mobileSel.innerHTML =
      '<article><p class="adamenu-chose">' +
      langText("chooseCategory", lang) +
      '</p><p class="adamenu-selected-cat">' +
      catName(currentCategory, lang) +
      "</p></article>" +
      chevronSVG;

    var tabsUl = document.createElement("ul");
    tabsUl.className = "adamenu-tabs";

    var dialog = document.createElement("div");
    dialog.className = "adamenu-dialog";
    var dialogInner = document.createElement("div");
    dialogInner.className = "adamenu-dialog-inner";
    dialog.appendChild(dialogInner);

    var catTitle = document.createElement("h2");
    catTitle.className = "adamenu-cat-title";
    catTitle.textContent = catName(currentCategory, lang);

    var subcatsDiv = document.createElement("div");
    subcatsDiv.className = "adamenu-subcats";

    // Create tabs
    categories.forEach(function (cat) {
      var li = document.createElement("li");
      li.className = "adamenu-tab";
      li.textContent = catName(cat, lang);
      li.setAttribute("data-cat-id", cat.id);
      li.addEventListener("click", function () {
        showCategory(cat);
      });
      tabsUl.appendChild(li);
    });

    // Mobile selector click
    mobileSel.addEventListener("click", function () {
      showDialog();
    });

    function showDialog() {
      dialogInner.innerHTML = "";
      categories.forEach(function (cat) {
        var li = document.createElement("li");
        li.className = "adamenu-tab";
        li.textContent = catName(cat, lang);
        li.addEventListener("click", function () {
          showCategory(cat);
          dialog.style.display = "none";
        });
        dialogInner.appendChild(li);
      });
      dialog.style.display = "block";
    }

    function showCategory(cat) {
      currentCategory = cat;
      catTitle.textContent = catName(cat, lang);
      mobileSel.querySelector(".adamenu-selected-cat").textContent = catName(
        cat,
        lang
      );

      // Update tab selection
      var allTabs = tabsUl.querySelectorAll(".adamenu-tab");
      allTabs.forEach(function (t) {
        t.classList.remove("adamenu-selected");
      });
      var active = tabsUl.querySelector('[data-cat-id="' + cat.id + '"]');
      if (active) active.classList.add("adamenu-selected");

      // Render subcategories
      subcatsDiv.innerHTML = "";
      if (!cat.subCategories) return;

      cat.subCategories
        .slice()
        .sort(function (a, b) {
          return (a.order || 0) - (b.order || 0);
        })
        .forEach(function (sub) {
          var div = document.createElement("div");
          div.className = "adamenu-subcat";

          var h3 = document.createElement("h3");
          h3.textContent = catName(sub, lang);
          div.appendChild(h3);

          // Menu items
          if (sub.menuItems) {
            sub.menuItems
              .slice()
              .sort(function (a, b) {
                return (a.order || 0) - (b.order || 0);
              })
              .forEach(function (item) {
                div.appendChild(buildMenuItem(item, lang));
              });
          }

          // Supplements
          if (config.supplements && config.supplements[sub.id]) {
            div.appendChild(
              buildSupplements(config.supplements[sub.id], sub.id, lang)
            );
          }

          subcatsDiv.appendChild(div);
        });
    }

    // Assemble
    el.innerHTML = "";
    el.appendChild(mobileSel);
    el.appendChild(tabsUl);
    el.appendChild(dialog);
    el.appendChild(catTitle);
    el.appendChild(subcatsDiv);

    // Initial render
    showCategory(categories[0]);
  }

  function buildMenuItem(item, lang) {
    var div = document.createElement("div");
    div.className = "adamenu-item";

    var desc =
      item.descriptions && item.descriptions[lang]
        ? item.descriptions[lang]
        : "";
    // Don't show description if same as name
    if (desc === (item.names && item.names[lang])) desc = "";

    div.innerHTML =
      "<article>" +
      '<p class="adamenu-name">' +
      esc(item.names ? item.names[lang] || "" : item.name || "") +
      "</p>" +
      (desc ? '<p class="adamenu-desc">' + esc(desc) + "</p>" : "") +
      "</article>" +
      '<p class="adamenu-price">€ ' +
      esc(String(item.price || "")) +
      "</p>";

    return div;
  }

  function buildSupplements(suppConfig, subId, lang) {
    var wrapper = document.createElement("div");
    wrapper.className = "adamenu-supplements";

    // Special case: Pizza base text
    if (subId === "a1426770-286d-4f22-9d09-a8d9fc911a58") {
      var base = document.createElement("h3");
      base.textContent = "Base: Pomodoro, mozzarella e origano";
      wrapper.appendChild(base);

      var h4 = document.createElement("h4");
      h4.textContent = suppConfig.title[lang] || suppConfig.title.en || "";
      wrapper.appendChild(h4);
    } else {
      var h3 = document.createElement("h3");
      h3.textContent = suppConfig.title[lang] || suppConfig.title.en || "";
      wrapper.appendChild(h3);
    }

    suppConfig.items.forEach(function (item) {
      var div = document.createElement("div");
      div.className = "adamenu-item";

      var desc =
        item.descriptions && item.descriptions[lang]
          ? item.descriptions[lang]
          : "";

      div.innerHTML =
        "<article>" +
        '<p class="adamenu-name">' +
        esc(item.name) +
        "</p>" +
        (desc ? '<p class="adamenu-desc">' + esc(desc) + "</p>" : "") +
        "</article>" +
        '<p class="adamenu-price">€ ' +
        esc(item.price) +
        "</p>";

      wrapper.appendChild(div);
    });

    return wrapper;
  }

  // ── Helpers ──
  function catName(cat, lang) {
    if (cat.names) return cat.names[lang] || cat.names.en || cat.name || "";
    return cat.name || "";
  }

  function langText(key, lang) {
    var t = {
      chooseCategory: {
        nl: "Kies categorie",
        fr: "Choisir une catégorie",
        en: "Choose a category",
      },
    };
    return t[key] ? t[key][lang] || t[key].en : key;
  }

  function esc(s) {
    if (!s) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  // ── Init ──
  function init() {
    container.innerHTML =
      '<p style="text-align:center;padding:2rem;color:#888;">Loading menu...</p>';

    fetch(apiBase + "/api/widget/" + slug + "/menu")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        var lang = detectLang() || data.restaurant.defaultLanguage || "nl";
        render(container, data.restaurant, data.menu, lang);
      })
      .catch(function (err) {
        console.error("[AdaMenu Widget] Failed to load menu:", err);
        container.innerHTML =
          '<p style="text-align:center;padding:2rem;color:red;">Failed to load menu. Please try again later.</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
