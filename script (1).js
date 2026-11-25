/* ==========================================================================
   บาหมี่ — script.js (ใช้ร่วมกันทุกหน้า)
   ตรวจว่าอยู่หน้าไหนจาก id ของ element แล้วเรียกฟังก์ชันของหน้านั้น
   - product.html : #filter-bar, #product-list
   - order.html   : #orderForm, #customerName, #contact, #items, #total, #note
   - admin.html   : #ordersTable tbody
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- ค่าตั้งต้น ---------- */
  var APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzQ5eGe5u9BVas-pXgkhFSOSwj6IkO8sCXDSzB03Fp-88Sj58svKaXTktI3PsffmfhP/exec";

  var SHEET_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlEc84QQd_hLYHumCs6xjNX7OYRCMprLgulM9aIaQCwviUOCWlT8zJO944RAHOViBuNJq5yBzRu2-s/pub?gid=0&single=true&output=csv";

  var PRODUCTS_URL = "products.json";

  // mood: key (ใช้กับ ?mood=), ชื่อไทยในไฟล์ products.json, class สีใน style.css
  var MOODS = [
    { key: "all", label: "ทั้งหมด", th: null, cls: "" },
    { key: "light", label: "Light", th: "ซดคล่อง", cls: "mood-light" },
    { key: "creamy", label: "Creamy", th: "นัวละมุน", cls: "mood-creamy" },
    { key: "spicy", label: "Spicy", th: "จัดจ้าน", cls: "mood-spicy" },
    { key: "exotic", label: "Exotic", th: "ฟิวชัน", cls: "mood-exotic" }
  ];

  /* ---------- ตัวช่วยทั่วไป ---------- */

  // สร้าง element ด้วย textContent เสมอ (ไม่ใช้ innerHTML) กันข้อความจากชีต/ไฟล์ JSON แทรกโค้ด
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function formatNumber(value) {
    var raw = String(value === undefined || value === null ? "" : value).trim();
    var n = Number(raw.replace(/,/g, ""));
    if (raw !== "" && isFinite(n)) return n.toLocaleString("th-TH");
    return raw;
  }

  function findMood(input) {
    if (!input) return MOODS[0];
    var q = String(input).trim().toLowerCase();
    for (var i = 0; i < MOODS.length; i++) {
      var m = MOODS[i];
      if (m.key === q || m.label.toLowerCase() === q || (m.th && m.th === input.trim())) {
        return m;
      }
    }
    return MOODS[0];
  }

  function moodByThai(thName) {
    for (var i = 0; i < MOODS.length; i++) {
      if (MOODS[i].th === thName) return MOODS[i];
    }
    return null;
  }

  /* ==========================================================================
     1) หน้าสินค้า (product.html)
     ========================================================================== */
  function initProducts() {
    var filterBar = document.getElementById("filter-bar");
    var list = document.getElementById("product-list");
    if (!list) return;

    var products = [];
    var activeKey = findMood(new URLSearchParams(window.location.search).get("mood")).key;

    function buildFilterBar() {
      if (!filterBar) return;
      filterBar.textContent = "";
      MOODS.forEach(function (m) {
        var btn = el("button", "filter " + m.cls, m.label);
        btn.type = "button";
        btn.dataset.mood = m.key;
        btn.setAttribute("aria-pressed", String(m.key === activeKey));
        btn.addEventListener("click", function () {
          activeKey = m.key;
          updatePressed();
          renderProducts();
        });
        filterBar.appendChild(btn);
      });
    }

    function updatePressed() {
      if (!filterBar) return;
      var buttons = filterBar.querySelectorAll(".filter");
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].setAttribute("aria-pressed", String(buttons[i].dataset.mood === activeKey));
      }
    }

    function buildCard(p) {
      var mood = moodByThai(p.mood);
      var card = el("article", "product-card" + (mood && mood.cls ? " " + mood.cls : ""));

      // รูป
      var media = el("div", "product-card__media");
      var img = el("img");
      img.src = p.image;
      img.alt = p.name + (p.size ? " " + p.size : "");
      img.loading = "lazy";
      media.appendChild(img);

      // เนื้อหา
      var body = el("div", "product-card__body");
      body.appendChild(el("span", "mood-tag", p.mood));
      body.appendChild(el("h3", "product-card__title", p.name));
      // ถ้วยไม่มีไซส์ → แสดงประเภทแทน
      body.appendChild(el("p", "product-card__meta", p.size ? p.size : p.type));
      if (p.description) {
        body.appendChild(el("p", "product-card__desc", p.description));
      }

      // ราคา + ปุ่มสั่งซื้อ
      var footer = el("div", "product-card__footer");
      var price = el("span", "price", formatNumber(p.price));
      price.appendChild(el("small", "", "บาท"));

      var itemName = p.size ? p.name + " " + p.size : p.name;
      var link = el("a", "btn btn--small", "สั่งซื้อ");
      link.href =
        "order.html?item=" + encodeURIComponent(itemName) +
        "&price=" + encodeURIComponent(p.price);

      footer.appendChild(price);
      footer.appendChild(link);
      body.appendChild(footer);

      card.appendChild(media);
      card.appendChild(body);
      return card;
    }

    function renderProducts() {
      var active = findMood(activeKey);
      var shown = products.filter(function (p) {
        return !active.th || p.mood === active.th;
      });

      list.textContent = "";
      if (shown.length === 0) {
        list.appendChild(el("p", "muted", "ยังไม่มีสินค้าในหมวดนี้"));
        return;
      }
      shown.forEach(function (p) {
        list.appendChild(buildCard(p));
      });
    }

    buildFilterBar();
    list.appendChild(el("p", "muted", "กำลังโหลดสินค้า…"));

    fetch(PRODUCTS_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("โหลด products.json ไม่สำเร็จ (" + res.status + ")");
        return res.json();
      })
      .then(function (data) {
        products = Array.isArray(data) ? data : [];
        renderProducts();
      })
      .catch(function (error) {
        console.error(error);
        list.textContent = "";
        list.appendChild(el("p", "form-status form-status--error", "โหลดรายการสินค้าไม่สำเร็จ กรุณารีเฟรชหน้าอีกครั้ง"));
      });
  }

  /* ==========================================================================
     2) หน้าสั่งซื้อ (order.html)
     ========================================================================== */
  function initOrder() {
    var form = document.getElementById("orderForm");
    if (!form) return;

    var itemsInput = document.getElementById("items");
    var totalInput = document.getElementById("total");

    // เติมค่าจาก URL parameter ทันทีที่โหลดหน้า (ทั้ง items และ total)
    var params = new URLSearchParams(window.location.search);
    var itemParam = params.get("item");
    var priceParam = params.get("price");

    if (itemsInput && itemParam !== null) {
      itemsInput.value = itemParam.trim();
    }
    if (totalInput && priceParam !== null) {
      totalInput.value = priceParam.trim();
    }

    var submitting = false;
    var submitBtn = form.querySelector('[type="submit"]');

    function setSubmitting(state) {
      submitting = state;
      if (submitBtn) {
        submitBtn.disabled = state;
        submitBtn.setAttribute("aria-busy", String(state));
      }
    }

    function valueOf(id) {
      var node = document.getElementById(id);
      return node ? node.value.trim() : "";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (submitting) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var payload = {
        customerName: valueOf("customerName"),
        contact: valueOf("contact"),
        items: valueOf("items"),
        total: valueOf("total"),
        note: valueOf("note")
      };

      setSubmitting(true);

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(() => { window.location.href = 'thankyou.html'; })
      .catch(error => {
        console.error(error);
        setSubmitting(false);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      });
    });
  }

  /* ==========================================================================
     3) หน้า admin (admin.html)
     ========================================================================== */

  // parse CSV เอง: รองรับ "ข้อความในเครื่องหมายคำพูด", "" แทน ", คอมมาและขึ้นบรรทัดใหม่ในช่อง, CRLF, BOM
  function parseCSV(text) {
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;

    for (var i = 0; i < text.length; i++) {
      var c = text[i];

      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
      } else if (c === '"' && field === "") {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }

    if (field !== "" || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function initAdmin() {
    var table = document.getElementById("ordersTable");
    if (!table) return;

    var tbody = table.querySelector("tbody");
    if (!tbody) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }

    var COLUMNS = 6; // วันเวลา, ชื่อลูกค้า, เบอร์โทร/Line, รายการสินค้า, จำนวนเงินรวม, หมายเหตุ

    function showMessage(text, isError) {
      tbody.textContent = "";
      var tr = document.createElement("tr");
      var td = el("td", isError ? "form-status--error" : "muted", text);
      td.colSpan = COLUMNS;
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    function renderOrders(rows) {
      // ข้ามแถวว่าง
      rows = rows.filter(function (r) {
        return r.some(function (cell) { return cell.trim() !== ""; });
      });

      // ข้ามแถวหัวตาราง (ถ้าช่องแรกไม่มีตัวเลขเลย เช่น "วันเวลา" / "Timestamp")
      if (rows.length > 0 && !/\d/.test(rows[0][0] || "")) {
        rows.shift();
      }

      if (rows.length === 0) {
        showMessage("ยังไม่มีคำสั่งซื้อ", false);
        return;
      }

      // Sheet เพิ่มแถวใหม่ต่อท้ายเสมอ → กลับลำดับให้รายการล่าสุดขึ้นก่อน
      rows.reverse();

      tbody.textContent = "";
      var fragment = document.createDocumentFragment();

      rows.forEach(function (r) {
        var tr = document.createElement("tr");
        for (var i = 0; i < COLUMNS; i++) {
          var value = r[i] === undefined ? "" : r[i];
          if (i === 4) value = formatNumber(value); // จำนวนเงินรวม
          tr.appendChild(el("td", "", value));
        }
        fragment.appendChild(tr);
      });

      tbody.appendChild(fragment);
    }

    showMessage("กำลังโหลดข้อมูล…", false);

    fetch(SHEET_CSV_URL, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ (" + res.status + ")");
        return res.text();
      })
      .then(function (text) {
        renderOrders(parseCSV(text));
      })
      .catch(function (error) {
        console.error(error);
        showMessage("โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ กรุณารีเฟรชหน้าอีกครั้ง", true);
      });
  }

  /* ---------- เริ่มทำงาน ---------- */
  function init() {
    if (document.getElementById("product-list")) initProducts();
    if (document.getElementById("orderForm")) initOrder();
    if (document.getElementById("ordersTable")) initAdmin();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
