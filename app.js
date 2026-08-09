const $ = s => document.querySelector(s);

const list = $("#thoughtList");
const toast = $("#toast");
const modal = $("#modal");
const text = $("#thoughtText");

let thoughts = [];
let reunion = localStorage.getItem("pat_reunion");

const COUPLE_ID = "couple1";
const SENDER = "Vincent";

// Firebase
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const db = getFirestore(window.firebaseApp);

function timeAgo(ts) {
  const d = ts instanceof Date ? ts : new Date(ts);
  const now = new Date();
  const m = Math.floor((now - d) / 60000);

  return m < 1
    ? "À l’instant"
    : m < 60
      ? `Il y a ${m} min`
      : m < 1440
        ? `Il y a ${Math.floor(m / 60)} h`
        : d.toLocaleDateString("fr-FR");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function render() {
  list.innerHTML = thoughts.length
    ? thoughts.slice(0, 8).map(t => `
      <div class="thought-item">
        <span class="heart">💗</span>
        <div>
          <b>${escapeHtml(t.text)}</b>
          <small>${timeAgo(t.ts)}</small>
        </div>
      </div>
    `).join("")
    : `
      <div class="thought-item">
        <span class="heart">💭</span>
        <div>
          <b>Aucune pensée pour le moment</b>
          <small>Envoie la première ❤️</small>
        </div>
      </div>
    `;
}

function showToast(s) {
  toast.textContent = s;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function popHearts() {
  for (let i = 0; i < 14; i++) {
    const h = document.createElement("span");
    h.className = "heart-pop";
    h.textContent = ["❤️", "💕", "💗", "💖"][i % 4];
    h.style.left = (35 + Math.random() * 30) + "%";
    h.style.top = (42 + Math.random() * 12) + "%";
    h.style.setProperty("--x", (Math.random() * 180 - 90) + "px");

    $("#hearts").appendChild(h);

    setTimeout(() => h.remove(), 1500);
  }
}

// Envoie une pensée dans Firestore
async function addThought(t) {
  try {
    await addDoc(
      collection(db, "couples", COUPLE_ID, "thoughts"),
      {
        text: t,
        sender: SENDER,
        createdAt: new Date()
      }
    );

    showToast("Pensée envoyée ❤️");
    popHearts();
  } catch (error) {
    console.error(error);
    showToast("Impossible d’envoyer la pensée");
  }
}

// Écoute les pensées en temps réel
const thoughtsQuery = query(
  collection(db, "couples", COUPLE_ID, "thoughts"),
  orderBy("createdAt", "desc")
);

onSnapshot(thoughtsQuery, snapshot => {
  thoughts = snapshot.docs.map(doc => {
    const data = doc.data();

    return {
      text: data.text || "",
      sender: data.sender || "",
      ts: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : new Date()
    };
  });

  render();
});

// Bouton principal
$("#thinkBtn").onclick = () => {
  addThought("Je pense à toi ❤️");
};

// Pensées rapides
document.querySelectorAll("[data-thought]").forEach(b => {
  b.onclick = () => addThought(b.dataset.thought);
});

// Pensée personnalisée
$("#customBtn").onclick =
$("#plusBtn").onclick = () => {
  modal.classList.remove("hidden");
  text.focus();
};

$("#closeModal").onclick = () => {
  modal.classList.add("hidden");
};

$("#sendThought").onclick = () => {
  const v = text.value.trim();

  if (!v) return;

  addThought(v);

  text.value = "";
  modal.classList.add("hidden");
};

modal.addEventListener("click", e => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

// Compte à rebours
function countdown() {
  if (!reunion) {
    $("#countdownValue").textContent =
      "Ajoute une date dans « Nous »";
    return;
  }

  const n = new Date(reunion) - Date.now();

  if (n <= 0) {
    $("#countdownValue").textContent =
      "C’est le jour des retrouvailles ❤️";
    return;
  }

  const s = Math.floor(n / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor(s % 86400 / 3600);
  const m = Math.floor(s % 3600 / 60);
  const sec = s % 60;

  $("#countdownValue").textContent =
    `${d} j · ${String(h).padStart(2, "0")} h · ${String(m).padStart(2, "0")} min · ${String(sec).padStart(2, "0")} s`;
}

setInterval(countdown, 1000);
countdown();
render();

document.querySelectorAll("[data-tab]").forEach(b =>
  b.onclick = () =>
    showToast("Cette section arrive dans la prochaine version 💕")
);

$("#menuBtn").onclick =
  () => showToast("Menu — bientôt disponible");

$("#profileBtn").onclick =
  () => showToast("Profil — bientôt disponible");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .catch(() => {});
}
