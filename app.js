document.addEventListener("DOMContentLoaded",()=>{ const h=document.querySelector(".hero .cta.gold"); if(h){h.textContent="ENTRA NELL’ESPERIENZA"; h.classList.add("gold");} });
const C = window.WTE_GUEST_CONFIG;
const $ = s => document.querySelector(s);
const panels = [...document.querySelectorAll(".panel")];

$("#eventNames").textContent = C.event.couple;
$("#eventDate").textContent = C.event.dateDisplay;
$("#couponEvent").textContent = C.event.couple.toUpperCase();
$("#couponDate").textContent = C.event.dateCoupon;
$("#couponDiscount").textContent = "–" + C.coupon.discount;
$("#couponExpiry").textContent = "VALIDO FINO AL " + C.coupon.expiryDisplay.toUpperCase();

function openPanel(id){
  panels.forEach(p=>p.classList.add("hidden"));
  const p = document.getElementById(id);
  if(p){ p.classList.remove("hidden"); setTimeout(()=>p.scrollIntoView({behavior:"smooth",block:"start"}),20); }
}
document.querySelectorAll("[data-open]").forEach(el=>el.addEventListener("click",e=>{
  e.preventDefault(); openPanel(el.dataset.open);
}));
document.querySelectorAll(".back").forEach(b=>b.addEventListener("click",()=>{
  panels.forEach(p=>p.classList.add("hidden"));
  $("#actions").scrollIntoView({behavior:"smooth",block:"start"});
}));

$("#projectForm").addEventListener("submit", e=>{
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const refs = document.getElementById("refs");
  if(refs && refs.files.length > 3){
    alert("Puoi selezionare al massimo 3 immagini di riferimento.");
    return;
  }
  const text = [
    `Ciao Elvis, arrivo dal Guest Hub di ${C.event.couple} (${C.event.dateDisplay}).`,
    ``,
    `TATTOO REQUEST`,
    `Nome: ${fd.get("name")}`,
    `WhatsApp: ${fd.get("phone")}`,
    `Email: ${fd.get("email") || "-"}`,
    ``,
    `Idea: ${fd.get("idea")}`,
    `Zona: ${fd.get("body")}`,
    `Dimensione: ${fd.get("size")}`,
    `BN / Colore: ${fd.get("styleColor")}`,
    `Budget indicativo: ${fd.get("budget") || "non indicato"}`,
    ``,
    refs && refs.files.length
      ? `Ho ${refs.files.length} reference da allegarti qui su WhatsApp.`
      : `Non ho selezionato reference.`
  ].join("
");
  window.location.href = `https://wa.me/${C.artist.whatsapp}?text=${encodeURIComponent(text)}`;
});

function randCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s="";
  for(let i=0;i<5;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return `${C.coupon.prefix}-${s}`;
}
$("#giftForm").addEventListener("submit", e=>{
  e.preventDefault();
  const name = $("#giftName").value.trim();
  if(!name) return;
  $("#couponName").textContent = name.toUpperCase();
  $("#couponCode").textContent = "CODICE: " + randCode();
  $("#coupon").classList.remove("hidden");
  $("#saveCoupon").classList.remove("hidden");
  setTimeout(()=>$("#coupon").scrollIntoView({behavior:"smooth",block:"center"}),80);
});
$("#saveCoupon").addEventListener("click", async ()=>{
  const shareText = `Wedding Gift ${C.event.couple} — ${C.coupon.discount} sul prossimo tattoo con ${C.artist.name}. ${$("#couponCode").textContent}`;
  if(navigator.share){
    try{ await navigator.share({title:"Wedding Gift",text:shareText}); }catch(e){}
  } else if(navigator.clipboard) {
    await navigator.clipboard.writeText(shareText);
    alert("Dati coupon copiati.");
  }
});

if(C.googleReviewUrl){
  $("#reviewLink").href = C.googleReviewUrl;
} else {
  $("#reviewLink").addEventListener("click", e=>{
    e.preventDefault();
    alert("Inseriremo qui il link diretto alla recensione Google.");
  });
}

// v0.2.8 — portfolio lightbox con navigazione e swipe
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCount = document.getElementById("lightboxCount");
const portfolioShots = [...document.querySelectorAll("[data-lightbox]")];
let lightboxIndex = 0;
let touchStartX = null;

function showLightbox(index){
  if(!lightbox || !lightboxImage || !portfolioShots.length) return;
  lightboxIndex = (index + portfolioShots.length) % portfolioShots.length;
  lightboxImage.src = portfolioShots[lightboxIndex].dataset.lightbox;
  lightboxCount.textContent = `${lightboxIndex + 1} / ${portfolioShots.length}`;
  lightbox.classList.remove("hidden");
  document.body.classList.add("lightbox-open");
}
function closeLightbox(){
  if(!lightbox) return;
  lightbox.classList.add("hidden");
  lightboxImage.removeAttribute("src");
  document.body.classList.remove("lightbox-open");
}
portfolioShots.forEach((btn,index)=>btn.addEventListener("click",()=>showLightbox(index)));
document.querySelector(".lightbox-close")?.addEventListener("click",closeLightbox);
document.querySelector(".lightbox-prev")?.addEventListener("click",e=>{e.stopPropagation();showLightbox(lightboxIndex-1);});
document.querySelector(".lightbox-next")?.addEventListener("click",e=>{e.stopPropagation();showLightbox(lightboxIndex+1);});
lightbox?.addEventListener("click",e=>{ if(e.target===lightbox) closeLightbox(); });
lightbox?.addEventListener("touchstart",e=>{touchStartX=e.changedTouches[0].clientX;},{passive:true});
lightbox?.addEventListener("touchend",e=>{
  if(touchStartX===null) return;
  const dx=e.changedTouches[0].clientX-touchStartX;
  touchStartX=null;
  if(Math.abs(dx)<45) return;
  showLightbox(lightboxIndex+(dx<0?1:-1));
},{passive:true});
document.addEventListener("keydown",e=>{
  if(lightbox?.classList.contains("hidden")) return;
  if(e.key==="Escape") closeLightbox();
  if(e.key==="ArrowLeft") showLightbox(lightboxIndex-1);
  if(e.key==="ArrowRight") showLightbox(lightboxIndex+1);
});

const refsInput = document.getElementById("refs");
if(refsInput){
  refsInput.addEventListener("change", ()=>{
    if(refsInput.files.length > 3){
      alert("Puoi selezionare al massimo 3 immagini.");
      refsInput.value = "";
    } else {
      const n = refsInput.files.length;
      const note = document.getElementById("fileNote");
      if(note && n) note.textContent = `${n} ${n===1 ? "immagine selezionata" : "immagini selezionate"}. Le allegherai alla conversazione WhatsApp.`;
    }
  });
}
