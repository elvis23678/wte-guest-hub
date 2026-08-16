document.addEventListener("DOMContentLoaded", async function () {
  const C = window.WTE_GUEST_CONFIG || {};
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const panels = qa(".panel");
  const apiBase = String(C.apiBaseUrl || "").replace(/\/+$/, "");
  const artist = C.artist || {};

  const setText = (selector, value) => {
    const el = q(selector);
    if (el && value !== undefined && value !== null) el.textContent = value;
  };

  let event = { ...(C.event || {}) };
  const explicitSlug = new URLSearchParams(location.search).get("event");
  const requestedSlug = explicitSlug || event.slug || "umberto-sofia";

  if (apiBase && requestedSlug) {
    try {
      const response = await fetch(`${apiBase}/api/events/${encodeURIComponent(requestedSlug)}`, { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.ok && result.event) {
        event = result.event;
      } else if (explicitSlug) {
        showEventUnavailable();
        return;
      }
    } catch (err) {
      console.warn("Evento dinamico non disponibile, uso configurazione locale.", err);
      if (explicitSlug && requestedSlug !== (C.event || {}).slug) {
        showEventUnavailable();
        return;
      }
    }
  }

  hydrateEvent();
  trackVisit();
  await loadDynamicPortfolio();
  initNavigation();
  initProjectForm();
  initReferences();
  initGift();
  initReview();
  initLightbox();

  function hydrateEvent() {
    const discount = Number(event.discount || 20);
    document.title = `WTE Guest Hub — ${event.couple || "Wedding Tattoo Experience"}`;
    setText("#eventNames", event.couple);
    setText("#eventDate", event.dateDisplay);
    setText("#giftCouple", event.couple);
    setText("#couponEvent", event.couple ? event.couple.toUpperCase() : "");
    setText("#couponDate", event.dateCoupon);
    setText("#giftDiscount", `–${discount}%`);
    setText("#couponDiscount", `–${discount}%`);
    setText("#couponExpiry", `VALIDO FINO AL ${(event.expiryCoupon || "").toUpperCase()}`);
    setText("#giftConditionsText", `Personale, utilizzabile una sola volta, non cedibile e non cumulabile. Valido fino al ${event.expiryDisplay || "termine indicato"}. Per usufruire dello sconto è necessario presentare il Wedding Gift in studio.`);
    const heroCta = q(".hero .cta.gold");
    if (heroCta) heroCta.textContent = "ENTRA NELL’ESPERIENZA";
  }

  function showEventUnavailable() {
    document.body.innerHTML = `
      <main style="min-height:100vh;background:#050505;color:#f4efe5;display:flex;align-items:center;justify-content:center;padding:28px;text-align:center;font-family:Arial,sans-serif">
        <div style="max-width:430px;border:1px solid #5a4721;padding:30px 22px;background:#090909">
          <div style="color:#c89a42;letter-spacing:.22em;font-size:10px">WEDDING TATTOO EXPERIENCE</div>
          <h1 style="font-family:Georgia,serif;font-weight:400">Evento non disponibile</h1>
          <p style="color:#aaa198;line-height:1.5">Questo Guest Hub non è attivo oppure il link non è corretto.</p>
        </div>
      </main>`;
  }

  async function trackVisit() {
    const params = new URLSearchParams(location.search);
    if (params.get("staff") === "1") return;
    if (!apiBase || !event.slug) return;
    try {
      const key = `wte_visit_${event.slug}`;
      let token = sessionStorage.getItem(key);
      if (token) return;
      token = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
      sessionStorage.setItem(key, token);
      fetch(`${apiBase}/api/events/${encodeURIComponent(event.slug)}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: token }),
        keepalive: true
      }).catch(() => {});
    } catch (_) {}
  }

  async function loadDynamicPortfolio() {
    if (!apiBase) return;
    try {
      const r = await fetch(`${apiBase}/api/portfolio`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j.ok || !Array.isArray(j.portfolio) || !j.portfolio.length) return;
      const gallery = q("#portfolioGallery");
      if (!gallery) return;
      const frag = document.createDocumentFragment();
      j.portfolio.forEach((item, i) => {
        const url = item.url && item.url.startsWith("http") ? item.url : `${apiBase}${item.url || ""}`;
        if (!url) return;
        const btn = document.createElement("button");
        btn.className = "portfolio-shot portfolio-shot-staff";
        btn.type = "button";
        btn.setAttribute("data-lightbox", url);
        btn.setAttribute("aria-label", `Apri nuovo lavoro ${i + 1}`);
        const img = document.createElement("img");
        img.src = url;
        img.loading = "lazy";
        img.alt = item.title || "Tattoo realizzato da Elvis B Tattoo";
        btn.appendChild(img);
        frag.appendChild(btn);
      });
      gallery.prepend(frag);
    } catch (err) {
      console.warn("Portfolio dinamico non disponibile", err);
    }
  }

  function initNavigation() {
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
        q("#actions")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function initProjectForm() {
    const projectForm = q("#projectForm");
    if (!projectForm) return;
    const projectLegalNote = projectForm.closest("#project")?.querySelector(".legal-note");
    if (projectLegalNote) {
      projectLegalNote.textContent = "I dati e le eventuali immagini di riferimento vengono salvati nell’archivio riservato di Elvis B Tattoo. Dopo il salvataggio potrai inviare anche la notifica allo studio su WhatsApp.";
    }

    projectForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const refs = q("#refs");
      if (refs?.files?.length > 3) {
        alert("Puoi selezionare al massimo 3 immagini di riferimento.");
        return;
      }
      if (!apiBase) {
        alert("Archivio richieste non configurato. Riprova più tardi.");
        return;
      }
      const submitBtn = projectForm.querySelector('button[type="submit"]');
      const oldLabel = submitBtn?.textContent || "";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "INVIO IN CORSO…"; }

      try {
        const fd = new FormData(projectForm);
        fd.set("eventSlug", event.slug || "");
        fd.set("event", `${event.couple || ""} — ${event.dateDisplay || ""}`);
        const response = await fetch(`${apiBase}/api/requests`, { method: "POST", body: fd });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.error || "Impossibile salvare la richiesta.");
        const requestId = result.id || "";
        const lines = [
          `Ciao Elvis, arrivo dal Guest Hub di ${event.couple || ""} (${event.dateDisplay || ""}).`, "",
          "TATTOO REQUEST", requestId ? `Codice richiesta: ${requestId}` : "",
          `Nome: ${fd.get("name") || "-"}`, `WhatsApp: ${fd.get("phone") || "-"}`, `Email: ${fd.get("email") || "-"}`, "",
          `Idea: ${fd.get("idea") || "-"}`, `Zona: ${fd.get("body") || "-"}`, `Dimensione: ${fd.get("size") || "-"}`,
          `BN / Colore: ${fd.get("styleColor") || "-"}`, `Budget indicativo: ${fd.get("budget") || "non indicato"}`, "",
          refs?.files?.length ? `${refs.files.length} ${refs.files.length === 1 ? "reference salvata" : "reference salvate"} nell’archivio Guest Hub.` : "Nessuna reference allegata."
        ].filter(Boolean);
        const number = artist.whatsapp || "";
        const whatsappUrl = number ? `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}` : "";
        projectForm.reset();
        setText("#fileNote", "Puoi scegliere foto, disegni o immagini di riferimento dal telefono.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = oldLabel || "INVIA LA MIA IDEA"; }
        showRequestSuccess(requestId, whatsappUrl);
      } catch (err) {
        console.error(err);
        alert("La richiesta non è stata salvata. Controlla la connessione e riprova.\n\n" + (err?.message || ""));
      } finally {
        if (submitBtn?.disabled) { submitBtn.disabled = false; submitBtn.textContent = oldLabel || "INVIA LA MIA IDEA"; }
      }
    });
  }

  function initReferences() {
    const refsInput = q("#refs");
    if (!refsInput) return;
    refsInput.addEventListener("change", function () {
      const n = refsInput.files ? refsInput.files.length : 0;
      if (n > 3) { alert("Puoi selezionare al massimo 3 immagini."); refsInput.value = ""; return; }
      if (n) setText("#fileNote", `${n} ${n === 1 ? "immagine selezionata" : "immagini selezionate"}. Verranno salvate insieme alla richiesta.`);
    });
  }

  function showRequestSuccess(requestId, whatsappUrl) {
    let modal = q("#requestSuccessModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "requestSuccessModal";
      modal.className = "request-success-modal hidden";
      modal.innerHTML = `<div class="request-success-backdrop" data-close-success></div><div class="request-success-card" role="dialog" aria-modal="true" aria-labelledby="requestSuccessTitle"><div class="request-success-check" aria-hidden="true">✓</div><div class="request-success-eyebrow">TATTOO REQUEST</div><h3 id="requestSuccessTitle">Richiesta ricevuta</h3><p>La tua idea è stata salvata correttamente nell'archivio riservato di Elvis B Tattoo.</p><div class="request-code-wrap"><span>CODICE RICHIESTA</span><strong id="requestSuccessCode"></strong></div><p class="request-success-note">Ora puoi inviare la notifica allo studio su WhatsApp.</p><a class="cta gold request-success-wa" id="requestSuccessWa" href="#">CONTINUA SU WHATSAPP</a><button class="request-success-close" type="button" data-close-success>CHIUDI</button></div>`;
      document.body.appendChild(modal);
      modal.querySelectorAll("[data-close-success]").forEach(el => el.addEventListener("click", () => modal.classList.add("hidden")));
    }
    setText("#requestSuccessCode", requestId || "SALVATA");
    const wa = q("#requestSuccessWa");
    if (wa) {
      if (whatsappUrl) { wa.href = whatsappUrl; wa.classList.remove("hidden"); }
      else { wa.href = "#"; wa.classList.add("hidden"); }
    }
    modal.classList.remove("hidden");
  }

  function initGift() {
    const giftForm = q("#giftForm");
    const saveCoupon = q("#saveCoupon");
    let currentCoupon = null;
    if (giftForm) {
      giftForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const name = q("#giftName")?.value.trim() || "";
        if (!name) return;
        if (!apiBase || !event.slug) { alert("Wedding Gift non disponibile. Riprova più tardi."); return; }
        const btn = giftForm.querySelector('button[type="submit"]');
        const old = btn?.textContent || "";
        if (btn) { btn.disabled = true; btn.textContent = "GENERAZIONE…"; }
        try {
          const r = await fetch(`${apiBase}/api/coupons`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventSlug: event.slug, name })
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.ok || !j.coupon) throw new Error(j.error || "Impossibile generare il Wedding Gift.");
          currentCoupon = j.coupon;
          setText("#couponName", name.toUpperCase());
          setText("#couponCode", "CODICE: " + currentCoupon.code);
          q("#coupon")?.classList.remove("hidden");
          saveCoupon?.classList.remove("hidden");
          setTimeout(() => q("#coupon")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
        } catch (err) {
          alert(err.message || "Impossibile generare il Wedding Gift.");
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = old || "GENERA IL MIO WEDDING GIFT"; }
        }
      });
    }

    if (saveCoupon) {
      saveCoupon.addEventListener("click", function () {
        const guest = q("#couponName")?.textContent || "INVITATO";
        const code = currentCoupon?.code || (q("#couponCode")?.textContent || "").replace("CODICE: ", "");
        if (!code) return;
        fetch(`${apiBase}/api/coupons/${encodeURIComponent(code)}/downloaded`, { method: "POST", keepalive: true }).catch(() => {});
        const x = xmlEscape;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="#050505"/><rect x="38" y="38" width="1004" height="1274" fill="none" stroke="#b69043" stroke-width="3"/><text x="540" y="160" text-anchor="middle" fill="#e2c275" font-family="Georgia" font-size="58">WEDDING</text><text x="540" y="215" text-anchor="middle" fill="#e2c275" font-family="Arial" font-size="22">TATTOO EXPERIENCE</text><text x="540" y="330" text-anchor="middle" fill="#999" font-family="Arial" font-size="20">UN REGALO DI</text><text x="540" y="395" text-anchor="middle" fill="#f4efe5" font-family="Georgia" font-size="54">${x((event.couple || "").toUpperCase())}</text><text x="540" y="445" text-anchor="middle" fill="#d6aa4d" font-family="Arial" font-size="20">${x(event.dateCoupon || "")}</text><text x="540" y="535" text-anchor="middle" fill="#999" font-family="Arial" font-size="19">RISERVATO A</text><text x="540" y="595" text-anchor="middle" fill="#f4efe5" font-family="Georgia" font-size="46">${x(guest)}</text><text x="540" y="790" text-anchor="middle" fill="#e2c275" font-family="Georgia" font-size="190">–${Number(event.discount || 20)}%</text><text x="540" y="855" text-anchor="middle" fill="#f4efe5" font-family="Arial" font-size="27">SUL TUO PROSSIMO TATTOO</text><text x="540" y="905" text-anchor="middle" fill="#e2c275" font-family="Arial" font-size="25">CON ELVIS B TATTOO</text><text x="540" y="995" text-anchor="middle" fill="#e2c275" font-family="monospace" font-size="27">CODICE: ${x(code)}</text><text x="540" y="1045" text-anchor="middle" fill="#999" font-family="Arial" font-size="18">VALIDO FINO AL ${x(event.expiryCoupon || "")}</text><text x="540" y="1130" text-anchor="middle" fill="#bdb5a8" font-family="Arial" font-size="18">PRESENTA QUESTO WEDDING GIFT PRESSO</text><text x="540" y="1175" text-anchor="middle" fill="#e2c275" font-family="Arial" font-size="21">TATTOO BEAUTY SALOON · CONDOVE (TO)</text><text x="540" y="1260" text-anchor="middle" fill="#b69043" font-family="Arial" font-size="18">LOVE. MARKED. FOREVER.</text></svg>`;
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Wedding-Gift-" + guest.replace(/\s+/g, "-") + ".svg";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    }
  }

  function xmlEscape(v) {
    return String(v || "").replace(/[<>&"]/g, c => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;" }[c]));
  }

  function initReview() {
    const reviewLink = q("#reviewLink");
    if (!reviewLink) return;
    reviewLink.href = C.googleReviewUrl || "https://www.google.com/maps/search/?api=1&query=Tattoo%20Beauty%20Saloon%20Condove";
  }

  function initLightbox() {
    const lightbox = q("#lightbox");
    const lightboxImage = q("#lightboxImage");
    const lightboxCount = q("#lightboxCount");
    const gallery = q("#portfolioGallery");
    let lightboxIndex = 0;
    let touchStartX = null;
    const shots = () => qa("[data-lightbox]");
    function showLightbox(index) {
      const list = shots();
      if (!lightbox || !lightboxImage || !list.length) return;
      lightboxIndex = (index + list.length) % list.length;
      lightboxImage.src = list[lightboxIndex].getAttribute("data-lightbox");
      if (lightboxCount) lightboxCount.textContent = `${lightboxIndex + 1} / ${list.length}`;
      lightbox.classList.remove("hidden");
      document.body.classList.add("lightbox-open");
    }
    function closeLightbox() {
      lightbox?.classList.add("hidden");
      lightboxImage?.removeAttribute("src");
      document.body.classList.remove("lightbox-open");
    }
    gallery?.addEventListener("click", e => {
      const btn = e.target.closest("[data-lightbox]");
      if (!btn) return;
      const list = shots();
      showLightbox(list.indexOf(btn));
    });
    q(".lightbox-close")?.addEventListener("click", closeLightbox);
    q(".lightbox-prev")?.addEventListener("click", e => { e.stopPropagation(); showLightbox(lightboxIndex - 1); });
    q(".lightbox-next")?.addEventListener("click", e => { e.stopPropagation(); showLightbox(lightboxIndex + 1); });
    lightbox?.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
    lightbox?.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].clientX; }, { passive:true });
    lightbox?.addEventListener("touchend", e => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX; touchStartX = null;
      if (Math.abs(dx) >= 45) showLightbox(lightboxIndex + (dx < 0 ? 1 : -1));
    }, { passive:true });
    document.addEventListener("keydown", e => {
      if (!lightbox || lightbox.classList.contains("hidden")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showLightbox(lightboxIndex - 1);
      if (e.key === "ArrowRight") showLightbox(lightboxIndex + 1);
    });
  }
});
