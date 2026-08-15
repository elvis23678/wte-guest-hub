document.addEventListener("DOMContentLoaded", function () {
  const C = window.WTE_GUEST_CONFIG || {};
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const panels = qa(".panel");

  const setText = (selector, value) => {
    const el = q(selector);
    if (el && value !== undefined && value !== null) el.textContent = value;
  };

  const event = C.event || {};
  const coupon = C.coupon || {};
  const artist = C.artist || {};

  setText("#eventNames", event.couple);
  setText("#eventDate", event.dateDisplay);
  setText("#couponEvent", event.couple ? event.couple.toUpperCase() : "");
  setText("#couponDate", event.dateCoupon);
  setText("#couponDiscount", "–20%");
  setText("#couponExpiry", "VALIDO FINO AL 5 MARZO 2027");

  const heroCta = q(".hero .cta.gold");
  if (heroCta) heroCta.textContent = "ENTRA NELL’ESPERIENZA";

  function openPanel(id) {
    panels.forEach((p) => p.classList.add("hidden"));
    const panel = document.getElementById(id);
    if (!panel) return;
    panel.classList.remove("hidden");
    setTimeout(() => panel.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  }

  qa("[data-open]").forEach((el) => {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openPanel(el.getAttribute("data-open"));
    });
  });

  qa(".back").forEach((btn) => {
    btn.addEventListener("click", function () {
      panels.forEach((p) => p.classList.add("hidden"));
      const actions = q("#actions");
      if (actions) actions.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const projectForm = q("#projectForm");
  if (projectForm) {
    projectForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const fd = new FormData(projectForm);
      const refs = q("#refs");

      if (refs && refs.files && refs.files.length > 3) {
        alert("Puoi selezionare al massimo 3 immagini di riferimento.");
        return;
      }

      const lines = [
        `Ciao Elvis, arrivo dal Guest Hub di ${event.couple || ""} (${event.dateDisplay || ""}).`,
        "",
        "TATTOO REQUEST",
        `Nome: ${fd.get("name") || "-"}`,
        `WhatsApp: ${fd.get("phone") || "-"}`,
        `Email: ${fd.get("email") || "-"}`,
        "",
        `Idea: ${fd.get("idea") || "-"}`,
        `Zona: ${fd.get("body") || "-"}`,
        `Dimensione: ${fd.get("size") || "-"}`,
        `BN / Colore: ${fd.get("styleColor") || "-"}`,
        `Budget indicativo: ${fd.get("budget") || "non indicato"}`,
        "",
        refs && refs.files && refs.files.length
          ? `Ho ${refs.files.length} reference da allegarti qui su WhatsApp.`
          : "Non ho selezionato reference."
      ];

      const number = artist.whatsapp || "";
      const url = `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
      window.location.href = url;
    });
  }

  const refsInput = q("#refs");
  if (refsInput) {
    refsInput.addEventListener("change", function () {
      const n = refsInput.files ? refsInput.files.length : 0;
      if (n > 3) {
        alert("Puoi selezionare al massimo 3 immagini.");
        refsInput.value = "";
        return;
      }
      const note = q("#fileNote");
      if (note && n) {
        note.textContent = `${n} ${n === 1 ? "immagine selezionata" : "immagini selezionate"}. Le allegherai alla conversazione WhatsApp.`;
      }
    });
  }

  function stableCouponCode(name) {
    const source = `${(event.couple || "WTE").toUpperCase()}|${(event.dateDisplay || "").toUpperCase()}|${(name || "").trim().toUpperCase()}`;
    let hash = 2166136261;
    for (let i = 0; i < source.length; i++) {
      hash ^= source.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let n = hash >>> 0;
    let suffix = "";
    for (let i = 0; i < 5; i++) {
      suffix += chars[n % chars.length];
      n = Math.floor(n / chars.length) ^ (n >>> 7);
    }
    return `US26-${suffix}`;
  }

  const giftForm = q("#giftForm");
  if (giftForm) {
    giftForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const nameField = q("#giftName");
      const name = nameField ? nameField.value.trim() : "";
      if (!name) return;
      setText("#couponName", name.toUpperCase());
      setText("#couponCode", "CODICE: " + stableCouponCode(name));
      q("#coupon")?.classList.remove("hidden");
      q("#saveCoupon")?.classList.remove("hidden");
      setTimeout(() => q("#coupon")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    });
  }

  const saveCoupon = q("#saveCoupon");
  if (saveCoupon) {
    saveCoupon.addEventListener("click", function () {
      const guest = q("#couponName")?.textContent || "INVITATO";
      const code = (q("#couponCode")?.textContent || "").replace("CODICE: ", "");
      const clean = (v) => v.replace(/[<>&"]/g, "");
      const g = clean(guest), c = clean(code);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
      <rect width="1080" height="1350" fill="#050505"/><rect x="38" y="38" width="1004" height="1274" fill="none" stroke="#b69043" stroke-width="3"/>
      <text x="540" y="160" text-anchor="middle" fill="#e2c275" font-family="Georgia" font-size="58">WEDDING</text>
      <text x="540" y="215" text-anchor="middle" fill="#e2c275" font-family="Arial" font-size="22">TATTOO EXPERIENCE</text>
      <text x="540" y="330" text-anchor="middle" fill="#999" font-family="Arial" font-size="20">UN REGALO DI</text>
      <text x="540" y="395" text-anchor="middle" fill="#f4efe5" font-family="Georgia" font-size="54">UMBERTO &amp; SOFIA</text>
      <text x="540" y="445" text-anchor="middle" fill="#d6aa4d" font-family="Arial" font-size="20">5 SETTEMBRE 2026</text>
      <text x="540" y="535" text-anchor="middle" fill="#999" font-family="Arial" font-size="19">RISERVATO A</text>
      <text x="540" y="595" text-anchor="middle" fill="#f4efe5" font-family="Georgia" font-size="46">${g}</text>
      <text x="540" y="790" text-anchor="middle" fill="#e2c275" font-family="Georgia" font-size="190">–20%</text>
      <text x="540" y="855" text-anchor="middle" fill="#f4efe5" font-family="Arial" font-size="27">SUL TUO PROSSIMO TATTOO</text>
      <text x="540" y="905" text-anchor="middle" fill="#e2c275" font-family="Arial" font-size="25">CON ELVIS B TATTOO</text>
      <text x="540" y="995" text-anchor="middle" fill="#e2c275" font-family="monospace" font-size="27">CODICE: ${c}</text>
      <text x="540" y="1045" text-anchor="middle" fill="#999" font-family="Arial" font-size="18">VALIDO FINO AL 5 MARZO 2027</text>
      <text x="540" y="1130" text-anchor="middle" fill="#bdb5a8" font-family="Arial" font-size="18">PRESENTA QUESTO WEDDING GIFT PRESSO</text>
      <text x="540" y="1175" text-anchor="middle" fill="#e2c275" font-family="Arial" font-size="21">TATTOO BEAUTY SALOON · CONDOVE (TO)</text>
      <text x="540" y="1260" text-anchor="middle" fill="#b69043" font-family="Arial" font-size="18">LOVE. MARKED. FOREVER.</text></svg>`;
      const blob = new Blob([svg], {type:"image/svg+xml;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href=url; a.download="Wedding-Gift-"+g.replace(/\s+/g,"-")+".svg";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
  }

  const reviewLink = q("#reviewLink");
  if (reviewLink) {
    const fallbackReviewUrl = "https://www.google.com/maps/search/?api=1&query=Tattoo%20Beauty%20Saloon%20Condove";
    reviewLink.href = C.googleReviewUrl || fallbackReviewUrl;
  }

  // Portfolio lightbox.
  const lightbox = q("#lightbox");
  const lightboxImage = q("#lightboxImage");
  const lightboxCount = q("#lightboxCount");
  const shots = qa("[data-lightbox]");
  let lightboxIndex = 0;
  let touchStartX = null;

  function showLightbox(index) {
    if (!lightbox || !lightboxImage || !shots.length) return;
    lightboxIndex = (index + shots.length) % shots.length;
    lightboxImage.src = shots[lightboxIndex].getAttribute("data-lightbox");
    if (lightboxCount) lightboxCount.textContent = `${lightboxIndex + 1} / ${shots.length}`;
    lightbox.classList.remove("hidden");
    document.body.classList.add("lightbox-open");
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.add("hidden");
    if (lightboxImage) lightboxImage.removeAttribute("src");
    document.body.classList.remove("lightbox-open");
  }

  shots.forEach((btn, index) => btn.addEventListener("click", () => showLightbox(index)));
  q(".lightbox-close")?.addEventListener("click", closeLightbox);
  q(".lightbox-prev")?.addEventListener("click", (e) => { e.stopPropagation(); showLightbox(lightboxIndex - 1); });
  q(".lightbox-next")?.addEventListener("click", (e) => { e.stopPropagation(); showLightbox(lightboxIndex + 1); });

  if (lightbox) {
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
    lightbox.addEventListener("touchstart", (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 45) return;
      showLightbox(lightboxIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  document.addEventListener("keydown", function (e) {
    if (!lightbox || lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showLightbox(lightboxIndex - 1);
    if (e.key === "ArrowRight") showLightbox(lightboxIndex + 1);
  });
});