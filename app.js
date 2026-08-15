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
  setText("#couponDiscount", coupon.discount ? "–" + coupon.discount : "");
  setText("#couponExpiry", coupon.expiryDisplay ? "VALIDO FINO AL " + coupon.expiryDisplay.toUpperCase() : "");

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

  function randCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return `${coupon.prefix || "WTE"}-${s}`;
  }

  const giftForm = q("#giftForm");
  if (giftForm) {
    giftForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const nameField = q("#giftName");
      const name = nameField ? nameField.value.trim() : "";
      if (!name) return;
      setText("#couponName", name.toUpperCase());
      setText("#couponCode", "CODICE: " + randCode());
      q("#coupon")?.classList.remove("hidden");
      q("#saveCoupon")?.classList.remove("hidden");
      setTimeout(() => q("#coupon")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    });
  }

  const saveCoupon = q("#saveCoupon");
  if (saveCoupon) {
    saveCoupon.addEventListener("click", async function () {
      const code = q("#couponCode")?.textContent || "";
      const shareText = `Wedding Gift ${event.couple || ""} — ${coupon.discount || ""} sul prossimo tattoo con ${artist.name || "Elvis B Tattoo"}. ${code}`;
      if (navigator.share) {
        try { await navigator.share({ title: "Wedding Gift", text: shareText }); } catch (_) {}
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        alert("Dati coupon copiati.");
      }
    });
  }

  const reviewLink = q("#reviewLink");
  if (reviewLink) {
    if (C.googleReviewUrl) {
      reviewLink.href = C.googleReviewUrl;
    } else {
      reviewLink.addEventListener("click", function (e) {
        e.preventDefault();
        alert("Inseriremo qui il link diretto alla recensione Google.");
      });
    }
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