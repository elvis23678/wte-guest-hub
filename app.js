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
  if(p){ p.classList.remove("hidden"); p.scrollIntoView({behavior:"smooth",block:"start"}); }
}
document.querySelectorAll("[data-open]").forEach(el=>el.addEventListener("click",e=>{
  e.preventDefault(); openPanel(el.dataset.open);
}));
document.querySelectorAll(".back").forEach(b=>b.addEventListener("click",()=>{
  panels.forEach(p=>p.classList.add("hidden"));
  $("#actions").scrollIntoView({behavior:"smooth"});
}));

$("#projectForm").addEventListener("submit", e=>{
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const text = [
    `Ciao Elvis, arrivo dal Guest Hub di ${C.event.couple} (${C.event.dateDisplay}).`,
    ``,
    `Nome: ${fd.get("name")}`,
    `Telefono: ${fd.get("phone")}`,
    `Email: ${fd.get("email") || "-"}`,
    `Zona: ${fd.get("body")}`,
    `Dimensione: ${fd.get("size") || "-"}`,
    `Richiesta: ${fd.get("request")}`,
    ``,
    `Idea: ${fd.get("idea")}`,
    ``,
    `Ho anche delle reference da inviarti.`
  ].join("\n");
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
});
$("#saveCoupon").addEventListener("click", async ()=>{
  const shareText = `Wedding Gift ${C.event.couple} — ${C.coupon.discount} sul prossimo tattoo con ${C.artist.name}. ${$("#couponCode").textContent}`;
  if(navigator.share){
    try{ await navigator.share({title:"Wedding Gift",text:shareText}); }catch(e){}
  } else {
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
