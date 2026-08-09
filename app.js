const $=s=>document.querySelector(s);
const list=$("#thoughtList"), toast=$("#toast"), modal=$("#modal"), text=$("#thoughtText");
let thoughts=JSON.parse(localStorage.getItem("pat_thoughts")||"[]");
let reunion=localStorage.getItem("pat_reunion");

function save(){localStorage.setItem("pat_thoughts",JSON.stringify(thoughts))}
function timeAgo(ts){const d=new Date(ts), now=new Date(), m=Math.floor((now-d)/60000);return m<1?"À l’instant":m<60?`Il y a ${m} min`:m<1440?`Il y a ${Math.floor(m/60)} h`:d.toLocaleDateString("fr-FR")}
function render(){list.innerHTML=thoughts.length?thoughts.slice(0,8).map(t=>`<div class="thought-item"><span class="heart">💗</span><div><b>${escapeHtml(t.text)}</b><small>${timeAgo(t.ts)}</small></div></div>`).join(""):`<div class="thought-item"><span class="heart">💭</span><div><b>Aucune pensée pour le moment</b><small>Envoie la première ❤️</small></div></div>`}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function showToast(s){toast.textContent=s;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2200)}
function addThought(t){thoughts.unshift({text:t,ts:Date.now()});save();render();showToast("Pensée enregistrée ❤️");popHearts();}

function popHearts(){for(let i=0;i<14;i++){const h=document.createElement("span");h.className="heart-pop";h.textContent=["❤️","💕","💗","💖"][i%4];h.style.left=(35+Math.random()*30)+"%";h.style.top=(42+Math.random()*12)+"%";h.style.setProperty("--x",(Math.random()*180-90)+"px");$("#hearts").appendChild(h);setTimeout(()=>h.remove(),1500)}}

$("#thinkBtn").onclick=()=>addThought("Je pense à toi ❤️");
document.querySelectorAll("[data-thought]").forEach(b=>b.onclick=()=>addThought(b.dataset.thought));
$("#customBtn").onclick=$("#plusBtn").onclick=()=>{modal.classList.remove("hidden");text.focus()};
$("#closeModal").onclick=()=>modal.classList.add("hidden");
$("#sendThought").onclick=()=>{const v=text.value.trim();if(!v)return;addThought(v);text.value="";modal.classList.add("hidden")};
modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.add("hidden")});

function countdown(){if(!reunion){$("#countdownValue").textContent="Ajoute une date dans « Nous »";return}const n=new Date(reunion)-Date.now();if(n<=0){$("#countdownValue").textContent="C’est le jour des retrouvailles ❤️";return}const s=Math.floor(n/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),sec=s%60;$("#countdownValue").textContent=`${d} j · ${String(h).padStart(2,"0")} h · ${String(m).padStart(2,"0")} min · ${String(sec).padStart(2,"0")} s`}
setInterval(countdown,1000);countdown();render();

document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>showToast("Cette section arrive dans la prochaine version 💕"));
$("#menuBtn").onclick=()=>showToast("Menu — bientôt disponible");
$("#profileBtn").onclick=()=>showToast("Profil — bientôt disponible");

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
