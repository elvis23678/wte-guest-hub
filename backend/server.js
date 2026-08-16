const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "requests.json");
const ADMIN_USER = process.env.ADMIN_USER || "elvis";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "";

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]", "utf8");

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN || "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function readDb() {
  try {
    const rows = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}
function writeDb(rows) {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), "utf8");
  fs.renameSync(tmp, DB_FILE);
}
function safeEqual(a,b){
  const aa=Buffer.from(String(a)), bb=Buffer.from(String(b));
  return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}
function basicAuth(req,res,next){
  if(!ADMIN_PASSWORD) return res.status(503).send("ADMIN_PASSWORD non configurata.");
  const auth=req.headers.authorization||"";
  if(!auth.startsWith("Basic ")){
    res.setHeader("WWW-Authenticate",'Basic realm="WTE Guest Admin"');
    return res.status(401).send("Autenticazione richiesta");
  }
  const decoded=Buffer.from(auth.slice(6),"base64").toString("utf8");
  const i=decoded.indexOf(":");
  const user=i>=0?decoded.slice(0,i):decoded;
  const pass=i>=0?decoded.slice(i+1):"";
  if(!safeEqual(user,ADMIN_USER)||!safeEqual(pass,ADMIN_PASSWORD)){
    res.setHeader("WWW-Authenticate",'Basic realm="WTE Guest Admin"');
    return res.status(401).send("Credenziali non valide");
  }
  next();
}

const allowedTypes = new Set(["image/jpeg","image/png","image/webp","image/heic","image/heif"]);
const storage = multer.diskStorage({
  destination: (_req,_file,cb)=>cb(null,UPLOAD_DIR),
  filename: (_req,file,cb)=>{
    const ext={ "image/jpeg":".jpg","image/png":".png","image/webp":".webp","image/heic":".heic","image/heif":".heif"}[file.mimetype]||"";
    cb(null,`${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  }
});
const upload = multer({
  storage,
  limits:{files:3,fileSize:12*1024*1024},
  fileFilter:(_req,file,cb)=>allowedTypes.has(file.mimetype)?cb(null,true):cb(new Error("Formato immagine non supportato"))
});
const clean=(v,max=4000)=>String(v||"").trim().slice(0,max);

app.get("/health",(_req,res)=>res.json({ok:true,service:"wte-guest-api"}));

app.post("/api/requests", upload.array("refs",3), (req,res)=>{
  const row={
    id:`WTE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    createdAt:new Date().toISOString(),
    status:"NUOVA",
    event:clean(req.body.event,240),
    name:clean(req.body.name,160),
    phone:clean(req.body.phone,80),
    email:clean(req.body.email,240),
    idea:clean(req.body.idea,6000),
    body:clean(req.body.body,160),
    size:clean(req.body.size,160),
    styleColor:clean(req.body.styleColor,160),
    budget:clean(req.body.budget,160),
    refs:(req.files||[]).map(f=>({name:f.originalname,file:f.filename,url:`/admin/uploads/${encodeURIComponent(f.filename)}`}))
  };
  if(!row.name||!row.phone||!row.idea||!row.body||!row.size||!row.styleColor){
    for(const f of req.files||[]) try{fs.unlinkSync(f.path)}catch{}
    return res.status(400).json({ok:false,error:"Campi obbligatori mancanti"});
  }
  const rows=readDb(); rows.unshift(row); writeDb(rows);
  res.status(201).json({ok:true,id:row.id});
});

app.get("/api/admin/requests",basicAuth,(_req,res)=>res.json({ok:true,requests:readDb()}));

app.patch("/api/admin/requests/:id/status",basicAuth,(req,res)=>{
  const allowed=new Set(["NUOVA","CONTATTATO","PREVENTIVO","CHIUSA"]);
  const status=clean(req.body.status,40).toUpperCase();
  if(!allowed.has(status)) return res.status(400).json({ok:false,error:"Stato non valido"});
  const rows=readDb(), row=rows.find(r=>r.id===req.params.id);
  if(!row) return res.status(404).json({ok:false,error:"Richiesta non trovata"});
  row.status=status; row.updatedAt=new Date().toISOString(); writeDb(rows);
  res.json({ok:true,request:row});
});

app.get("/admin/uploads/:file",basicAuth,(req,res)=>{
  const full=path.join(UPLOAD_DIR,path.basename(req.params.file));
  if(!fs.existsSync(full)) return res.sendStatus(404);
  res.sendFile(full);
});

app.get("/admin",basicAuth,(_req,res)=>{
  res.type("html").send(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WTE Guest Admin</title>
<style>
body{margin:0;background:#050505;color:#f4efe5;font-family:Arial,sans-serif}header{position:sticky;top:0;background:#050505;border-bottom:1px solid #4e3b1d;padding:18px;z-index:2}header b{font-family:Georgia,serif;font-size:22px;font-weight:400}header small{display:block;color:#c89a42;letter-spacing:.18em;margin-top:5px}main{padding:14px;max-width:900px;margin:auto}.card{border:1px solid #40341f;background:#080808;margin:0 0 14px;padding:16px}.id{color:#c89a42;font-size:11px}.date{color:#777;font-size:11px}.top{display:flex;justify-content:space-between;gap:10px}.card h2{font-family:Georgia,serif;font-size:24px;font-weight:400;margin:8px 0}.meta{color:#aaa198;font-size:13px;line-height:1.55}.idea{margin:16px 0;padding:13px;border-left:2px solid #b69043;background:#0c0b08;white-space:pre-wrap;line-height:1.5}.refs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.refs img{width:100%;height:110px;object-fit:cover;border:1px solid #3e311c}.actions{display:flex;gap:8px;margin-top:14px}.actions a,.actions select{min-height:42px;background:#0b0b0b;color:#eee;border:1px solid #59451f;padding:9px;text-decoration:none}.empty{text-align:center;color:#777;padding:50px 10px}@media(max-width:480px){.actions{flex-direction:column}}
</style></head><body><header><b>WTE Guest Admin</b><small>RICHIESTE TATTOO</small></header><main><div id="list"><div class="empty">Caricamento…</div></div></main>
<script>
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c]));
const fmt=d=>{try{return new Date(d).toLocaleString("it-IT")}catch{return d}};
async function load(){
 const j=await fetch("/api/admin/requests").then(r=>r.json()), rows=j.requests||[];
 document.querySelector("#list").innerHTML=rows.length?rows.map(r=>\`
 <article class="card"><div class="top"><div><div class="id">\${esc(r.id)} · \${esc(r.status)}</div><h2>\${esc(r.name)}</h2></div><div class="date">\${fmt(r.createdAt)}</div></div>
 <div class="meta"><b>WhatsApp:</b> \${esc(r.phone)}<br><b>Email:</b> \${esc(r.email||"-")}<br><b>Zona:</b> \${esc(r.body)} · <b>Misura:</b> \${esc(r.size)}<br><b>Stile:</b> \${esc(r.styleColor)} · <b>Budget:</b> \${esc(r.budget||"-")}<br><b>Evento:</b> \${esc(r.event||"-")}</div>
 <div class="idea">\${esc(r.idea)}</div>
 \${r.refs?.length?'<div class="refs">'+r.refs.map(x=>'<a href="'+x.url+'" target="_blank"><img src="'+x.url+'"></a>').join("")+'</div>':""}
 <div class="actions"><a href="https://wa.me/\${encodeURIComponent(String(r.phone).replace(/\\D/g,''))}" target="_blank">Apri WhatsApp</a>
 <select onchange="setStatus('\${esc(r.id)}',this.value)">\${["NUOVA","CONTATTATO","PREVENTIVO","CHIUSA"].map(s=>'<option '+(r.status===s?'selected':'')+'>'+s+'</option>').join("")}</select></div></article>\`).join(""):'<div class="empty">Nessuna richiesta.</div>';
}
async function setStatus(id,status){await fetch("/api/admin/requests/"+encodeURIComponent(id)+"/status",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});load();}
load();
</script></body></html>`);
});

app.use((err,_req,res,_next)=>{
  console.error(err);
  if(err?.code==="LIMIT_FILE_SIZE") return res.status(400).json({ok:false,error:"Immagine troppo grande (max 12 MB)"});
  if(err?.code==="LIMIT_FILE_COUNT") return res.status(400).json({ok:false,error:"Massimo 3 immagini"});
  res.status(400).json({ok:false,error:err.message||"Errore richiesta"});
});

app.listen(PORT,"0.0.0.0",()=>console.log(`WTE Guest API attiva sulla porta ${PORT}`));
