/* ÉCHO DU NORD TV — connexion au projet Supabase de production */
const SUPABASE_URL = "https://snpcymhujnnjivdsvrsm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uTlOWdJxmyqMmj2cLRo0kA_Y9_8vzp1";
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const $ = (id) => document.getElementById(id);
let allArticles = [];
let selectedCategory = "Toutes";
let currentUser = null;
let isEchoAdmin = false;

const samples = [
 {id:"sample1",title:"Bienvenue sur ÉCHO DU NORD TV",category:"Woleu-Ntem",summary:"Votre média provincial couvre toute la province du Woleu-Ntem, le Gabon et l’actualité internationale.",body:"Bienvenue sur ÉCHO DU NORD TV.\n\nCette application est la vitrine de démonstration d’ÉCHO DU NORD TV, média provincial consacré à l’ensemble du Woleu-Ntem, au Gabon et au monde.",image_url:"",published_at:new Date().toISOString()},
 {id:"sample2",title:"Le Woleu-Ntem au cœur de l’actualité",category:"Woleu-Ntem",summary:"Retrouvez les nouvelles, initiatives et événements de l’ensemble des départements de la province du Woleu-Ntem.",body:"Cette rubrique couvre toute la province du Woleu-Ntem, y compris le département du Haut-Ntem et les autres départements qui la composent.",image_url:"",published_at:new Date(Date.now()-86400000).toISOString()},
 {id:"sample3",title:"Sport, culture et société",category:"Sport",summary:"Les événements sportifs, les rendez-vous culturels et les sujets de société ont aussi leur place sur ÉCHO DU NORD TV.",body:"Exemple de contenu éditorial.",image_url:"",published_at:new Date(Date.now()-172800000).toISOString()}
];

function safeText(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function dateLabel(value){if(!value)return "Non daté";try{return new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"long",year:"numeric"}).format(new Date(value));}catch{return "";}}
function slugify(value){return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function normalizeArticle(row){return {id:row.id,title:row.title,category:row.category||"Actualité",summary:row.excerpt||"",body:row.body||"",image_url:row.cover_image||"",published_at:row.published_at||row.created_at};}
function renderArticles(){
 const query=$("searchInput").value.trim().toLocaleLowerCase("fr");
 const visible=allArticles.filter(a=>(selectedCategory==="Toutes"||a.category===selectedCategory)&&(`${a.title} ${a.summary} ${a.body||""} ${a.category}`).toLocaleLowerCase("fr").includes(query));
 $("newsGrid").innerHTML=visible.length?visible.map(a=>`
 <article class="news-card">
  ${a.image_url?`<img src="${safeText(a.image_url)}" alt="" loading="lazy" onerror="this.style.display='none'">`:""}
  <div class="card-copy"><span class="tag">${safeText(a.category||"Actualité")}</span><h3>${safeText(a.title)}</h3>
  <p>${safeText(a.summary||"")}</p><div class="card-bottom"><span>${dateLabel(a.published_at)}</span><button class="read-more" data-open="${safeText(a.id)}">Lire l’article →</button></div></div>
 </article>`).join(""):`<div class="empty">${db?"Aucune actualité publiée pour le moment.":"Aucune actualité ne correspond à votre recherche."}</div>`;
 $("status").textContent=db?"Actualités synchronisées avec la rédaction.":"Aperçu de démonstration — connexion à la base indisponible.";
 document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openArticle(b.dataset.open)));
}
function openArticle(id){
 const a=allArticles.find(x=>String(x.id)===String(id));if(!a)return;
 $("articleDetail").innerHTML=`<article class="article-detail">${a.image_url?`<img src="${safeText(a.image_url)}" alt="">`:""}<p class="eyebrow">${safeText(a.category||"Actualité")} · ${dateLabel(a.published_at)}</p><h2>${safeText(a.title)}</h2><p><strong>${safeText(a.summary||"")}</strong></p><div class="article-body">${safeText(a.body||"")}</div><p><button class="outline" id="shareArticle">Partager cet article</button></p></article>`;
 $("articleDialog").showModal();
 $("shareArticle").addEventListener("click",async()=>{const share={title:a.title,text:a.summary||a.title,url:location.href};if(navigator.share){try{await navigator.share(share)}catch{}}else if(navigator.clipboard){await navigator.clipboard.writeText(`${a.title}\n${a.summary||""}\n${location.href}`);alert("Texte copié.");}});
}
async function loadArticles(){
 if(!db){allArticles=samples;renderArticles();return;}
 const {data,error}=await db.from("echo_articles").select("id,title,category,excerpt,body,cover_image,status,published_at,created_at").eq("status","published").order("published_at",{ascending:false,nullsFirst:false});
 if(error){$("status").textContent="Chargement des actualités impossible. Réessayez dans un instant.";console.error(error);allArticles=[];renderArticles();return;}
 allArticles=(data||[]).map(normalizeArticle);renderArticles();
}
function showAdminStatus(msg){$("adminStatus").textContent=msg;}
async function refreshAdminArticles(){
 if(!db||!currentUser||!isEchoAdmin)return;
 const {data,error}=await db.from("echo_articles").select("id,title,status,published_at,created_at").order("created_at",{ascending:false}).limit(30);
 if(error){$("adminArticles").textContent="Chargement impossible : "+error.message;return;}
 $("adminArticles").innerHTML=(data||[]).map(a=>`<div class="admin-row"><span><strong>${safeText(a.title)}</strong><br><small>${a.status==="published"?"Publié":"Brouillon"} · ${dateLabel(a.published_at||a.created_at)}</small></span><button data-delete="${safeText(a.id)}">Supprimer</button></div>`).join("")||"<p>Aucun article enregistré.</p>";
 document.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("Supprimer définitivement cet article ?"))return;const {error}=await db.from("echo_articles").delete().eq("id",b.dataset.delete);if(error)showAdminStatus("Suppression impossible : "+error.message);else{showAdminStatus("Article supprimé.");await refreshAdminArticles();await loadArticles();}}));
}
async function updateSession(session){
 currentUser=session?.user||null;isEchoAdmin=false;
 $("loginForm").classList.toggle("hidden",!!currentUser);
 $("editor").classList.add("hidden");
 if(!currentUser){$("adminArticles").innerHTML="";return;}
 const {data,error}=await db.from("echo_admins").select("user_id").eq("user_id",currentUser.id).maybeSingle();
 if(error||!data){showAdminStatus("Ce compte n’est pas autorisé à administrer ÉCHO DU NORD TV.");await db.auth.signOut();currentUser=null;$("loginForm").classList.remove("hidden");return;}
 isEchoAdmin=true;$("editor").classList.remove("hidden");showAdminStatus("Connecté : "+currentUser.email);await refreshAdminArticles();
}
$("categories").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;selectedCategory=b.dataset.category;document.querySelectorAll(".category").forEach(x=>x.classList.toggle("active",x===b));renderArticles();});
$("searchInput").addEventListener("input",renderArticles);
$("closeDialog").addEventListener("click",()=>$("articleDialog").close());
$("articleDialog").addEventListener("click",e=>{if(e.target===$("articleDialog"))$("articleDialog").close();});
$("shareBtn").addEventListener("click",async()=>{const data={title:"ÉCHO DU NORD TV",text:"L’information qui résonne au-delà des frontières.",url:location.href};if(navigator.share){try{await navigator.share(data)}catch{}}else if(navigator.clipboard){await navigator.clipboard.writeText(location.href);alert("Lien copié.");}else alert("Copiez le lien dans la barre d’adresse pour le partager.");});
$("year").textContent=new Date().getFullYear();

$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!db){showAdminStatus("Service de connexion indisponible.");return;}showAdminStatus("Connexion en cours…");const {data,error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error){showAdminStatus("Connexion impossible : vérifiez votre adresse e-mail et votre mot de passe.");return;}await updateSession(data.session);});
$("logoutBtn").addEventListener("click",async()=>{if(db)await db.auth.signOut();await updateSession(null);showAdminStatus("Vous êtes déconnecté.");});
$("articleForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!db||!currentUser||!isEchoAdmin){showAdminStatus("Connectez-vous avec un compte administrateur.");return;}
 const published=$("articlePublished").checked;const title=$("articleTitle").value.trim();
 const payload={title,slug:`${slugify(title)||"article"}-${Date.now()}`,category:$("articleCategory").value,excerpt:$("articleSummary").value.trim(),body:$("articleBody").value.trim(),cover_image:$("articleImage").value.trim()||null,status:published?"published":"draft",published_at:published?new Date().toISOString():null,author_id:currentUser.id};
 showAdminStatus("Enregistrement de l’article…");
 const {error}=await db.from("echo_articles").insert(payload);
 if(error){showAdminStatus("Enregistrement impossible : "+error.message);return;}
 e.target.reset();$("articlePublished").checked=true;showAdminStatus("Article enregistré dans la base éditoriale.");await refreshAdminArticles();await loadArticles();
});
if(db){db.auth.getSession().then(({data})=>updateSession(data.session));db.auth.onAuthStateChange((_event,session)=>{updateSession(session);});}
loadArticles();

let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").classList.remove("hidden");});
$("installBtn").addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").classList.add("hidden");});
