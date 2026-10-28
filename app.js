/* ÉCHO DU NORD TV — configuration à compléter dans SUPABASE_URL et SUPABASE_ANON_KEY */
const SUPABASE_URL = "COLLER_ICI_URL_SUPABASE";
const SUPABASE_ANON_KEY = "COLLER_ICI_CLE_PUBLIQUE_ANON";
const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("COLLER_ICI") && !SUPABASE_ANON_KEY.includes("COLLER_ICI");
const db = configured && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const $ = (id) => document.getElementById(id);
let allArticles = [];
let selectedCategory = "Toutes";
let currentUser = null;

const samples = [
 {id:"sample1",title:"Bienvenue sur ÉCHO DU NORD TV",category:"Gabon",summary:"Votre média en ligne se prépare à vous proposer une information de proximité, fiable et accessible.",body:"Bienvenue sur ÉCHO DU NORD TV.\\n\\nCette application est la vitrine de démonstration du média. Une fois la base de données configurée, la rédaction pourra publier ici ses propres articles.",image_url:"",published_at:new Date().toISOString()},
 {id:"sample2",title:"Le Haut-Ntem au cœur de l’actualité",category:"Haut-Ntem",summary:"Retrouvez dans cette rubrique les nouvelles locales, les initiatives communautaires et les événements de la région.",body:"Cette rubrique accueillera les articles consacrés au Haut-Ntem et à ses communautés.",image_url:"",published_at:new Date(Date.now()-86400000).toISOString()},
 {id:"sample3",title:"Sport, culture et société",category:"Sport",summary:"Les événements sportifs, les rendez-vous culturels et les sujets de société ont aussi leur place sur ÉCHO DU NORD TV.",body:"Cette rubrique est un exemple de contenu. Remplacez les textes de démonstration par des informations vérifiées avant publication.",image_url:"",published_at:new Date(Date.now()-172800000).toISOString()}
];

function safeText(value=""){return String(value).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function dateLabel(value){try{return new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"long",year:"numeric"}).format(new Date(value));}catch{return "";}}
function renderArticles(){
 const query=$("searchInput").value.trim().toLocaleLowerCase("fr");
 const visible=allArticles.filter(a=>(selectedCategory==="Toutes"||a.category===selectedCategory)&&(`${a.title} ${a.summary} ${a.body||""} ${a.category}`).toLocaleLowerCase("fr").includes(query));
 $("newsGrid").innerHTML=visible.length?visible.map(a=>`
 <article class="news-card">
  ${a.image_url?`<img src="${safeText(a.image_url)}" alt="" loading="lazy" onerror="this.style.display='none'">`:""}
  <div class="card-copy"><span class="tag">${safeText(a.category||"Actualité")}</span><h3>${safeText(a.title)}</h3>
  <p>${safeText(a.summary||"")}</p><div class="card-bottom"><span>${dateLabel(a.published_at)}</span><button class="read-more" data-open="${safeText(a.id)}">Lire l’article →</button></div></div>
 </article>`).join(""):`<div class="empty">Aucune actualité ne correspond à votre recherche.</div>`;
 $("status").textContent=db?"":"Aperçu de démonstration — connectez Supabase pour afficher les articles publiés par la rédaction.";
 document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openArticle(b.dataset.open)));
}
function openArticle(id){
 const a=allArticles.find(x=>String(x.id)===String(id));if(!a)return;
 $("articleDetail").innerHTML=`<article class="article-detail">${a.image_url?`<img src="${safeText(a.image_url)}" alt="">`:""}<p class="eyebrow">${safeText(a.category||"Actualité")} · ${dateLabel(a.published_at)}</p><h2>${safeText(a.title)}</h2><p><strong>${safeText(a.summary||"")}</strong></p><div class="article-body">${safeText(a.body||"")}</div><p><button class="outline" id="shareArticle">Partager cet article</button></p></article>`;
 $("articleDialog").showModal();
 $("shareArticle").addEventListener("click",async()=>{const share={title:a.title,text:a.summary||a.title,url:location.href};if(navigator.share){try{await navigator.share(share)}catch{}}else if(navigator.clipboard){await navigator.clipboard.writeText(`${a.title}\\n${a.summary||""}\\n${location.href}`);alert("Texte copié.")}});
}
async function loadArticles(){
 if(!db){allArticles=samples;renderArticles();return;}
 const {data,error}=await db.from("articles").select("*").eq("published",true).order("published_at",{ascending:false});
 if(error){$("status").textContent="Impossible de charger les actualités. Vérifiez la configuration de la base de données.";allArticles=samples;renderArticles();return;}
 allArticles=data||[];renderArticles();
}
function showAdminStatus(msg){$("adminStatus").textContent=msg;}
async function refreshAdminArticles(){
 if(!db||!currentUser)return;
 const {data,error}=await db.from("articles").select("id,title,published,published_at").order("created_at",{ascending:false}).limit(30);
 if(error){$("adminArticles").textContent=error.message;return;}
 $("adminArticles").innerHTML=(data||[]).map(a=>`<div class="admin-row"><span><strong>${safeText(a.title)}</strong><br><small>${a.published?"Publié":"Brouillon"} · ${dateLabel(a.published_at||new Date())}</small></span><button data-delete="${safeText(a.id)}">Supprimer</button></div>`).join("")||"<p>Aucun article enregistré.</p>";
 document.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("Supprimer cet article ?"))return;const {error}=await db.from("articles").delete().eq("id",b.dataset.delete);if(error)showAdminStatus("Suppression impossible : "+error.message);else{showAdminStatus("Article supprimé.");await refreshAdminArticles();await loadArticles();}}));
}
function updateSession(session){
 currentUser=session?.user||null;
 $("loginForm").classList.toggle("hidden",!!currentUser);
 $("editor").classList.toggle("hidden",!currentUser);
 if(currentUser){showAdminStatus("Connecté : "+currentUser.email);refreshAdminArticles();}
}
$("categories").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;selectedCategory=b.dataset.category;document.querySelectorAll(".category").forEach(x=>x.classList.toggle("active",x===b));renderArticles();});
$("searchInput").addEventListener("input",renderArticles);
$("closeDialog").addEventListener("click",()=>$("articleDialog").close());
$("articleDialog").addEventListener("click",e=>{if(e.target===$("articleDialog"))$("articleDialog").close();});
$("shareBtn").addEventListener("click",async()=>{const data={title:"ÉCHO DU NORD TV",text:"L’information qui résonne au-delà des frontières.",url:location.href};if(navigator.share){try{await navigator.share(data)}catch{}}else if(navigator.clipboard){await navigator.clipboard.writeText(location.href);alert("Lien copié.");}else alert("Copiez le lien dans la barre d’adresse pour le partager.");});
$("year").textContent=new Date().getFullYear();

$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!db){showAdminStatus("La base de données n’est pas configurée. Suivez le guide README.");return;}const {data,error}=await db.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(error){showAdminStatus("Connexion impossible : vérifiez vos identifiants.");return;}updateSession(data.session);});
$("logoutBtn").addEventListener("click",async()=>{if(db)await db.auth.signOut();updateSession(null);showAdminStatus("Vous êtes déconnecté.");});
$("articleForm").addEventListener("submit",async e=>{e.preventDefault();if(!db||!currentUser){showAdminStatus("Connectez-vous d’abord.");return;}const published=$("articlePublished").checked;const payload={title:$("articleTitle").value.trim(),category:$("articleCategory").value,summary:$("articleSummary").value.trim(),body:$("articleBody").value.trim(),image_url:$("articleImage").value.trim()||null,published,published_at:published?new Date().toISOString():null,author_id:currentUser.id};const {error}=await db.from("articles").insert(payload);if(error){showAdminStatus("Enregistrement impossible : "+error.message);return;}e.target.reset();$("articlePublished").checked=true;showAdminStatus("Article enregistré.");await refreshAdminArticles();await loadArticles();});
if(db){db.auth.getSession().then(({data})=>updateSession(data.session));db.auth.onAuthStateChange((_event,session)=>updateSession(session));}
loadArticles();

let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").classList.remove("hidden");});
$("installBtn").addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").classList.add("hidden");});
