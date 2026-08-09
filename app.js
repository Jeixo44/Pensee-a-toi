const $ = s => document.querySelector(s);

const list = $("#thoughtList");
const toast = $("#toast");
const modal = $("#modal");
const text = $("#thoughtText");

let thoughts = [];
let reunion = localStorage.getItem("pat_reunion");

let COUPLE_ID = localStorage.getItem("pat_couple_id") || "couple1";

let SENDER = localStorage.getItem("pat_sender");

if (!SENDER) {
  SENDER = prompt("Qui es-tu ?\n\nÉcris Vincent ou Ma chérie");

  if (SENDER !== "Vincent" && SENDER !== "Ma chérie") {
    SENDER = "Vincent";
  }

  localStorage.setItem("pat_sender", SENDER);
}


// ==============================
// FIREBASE
// ==============================

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const db = getFirestore(window.firebaseApp);
const auth = getAuth(window.firebaseApp);


// Authentification anonyme
const authReady = signInAnonymously(auth)
  .then(() => {
    console.log("Utilisateur Firebase connecté");
  })
  .catch(error => {
    console.error("Erreur authentification :", error);
    throw error;
  });


// ==============================
// REJOINDRE UN COUPLE
// ==============================

const joinButton = $("#joinCoupleBtn");
const codeInput = $("#coupleCodeInput");
const coupleStatus = $("#coupleStatus");


if (joinButton) {

  joinButton.onclick = async () => {

    const code = codeInput.value.trim();

    if (!code) {
      coupleStatus.textContent =
        "Entre le code de votre couple ❤️";
      return;
    }

    try {

      coupleStatus.textContent =
        "Vérification du code...";

      await authReady;


      // Pour notre première version,
      // nous vérifions le code dans couple1.
      const coupleRef =
        doc(db, "couples", "couple1");

      const coupleSnapshot =
        await getDoc(coupleRef);


      if (!coupleSnapshot.exists()) {

        coupleStatus.textContent =
          "Ce couple n'existe pas.";

        return;
      }


      const coupleData =
        coupleSnapshot.data();


 if (
  String(coupleData.Code || "").trim().toLowerCase()
  !== code.trim().toLowerCase()
) {

        coupleStatus.textContent =
          "Code incorrect ❤️";

        return;
      }


      // Code correct
      COUPLE_ID = "couple1";

      localStorage.setItem(
        "pat_couple_id",
        COUPLE_ID
      );


      coupleStatus.textContent =
        "Couple connecté ❤️";


      showToast(
        "Bienvenue dans votre couple ❤️"
      );


      // Recharge les pensées
      startThoughtListener();

    } catch (error) {

      console.error(
        "Erreur rejoindre couple :",
        error
      );

      coupleStatus.textContent =
        "Impossible de rejoindre le couple.";
    }

  };

}


// ==============================
// TEMPS
// ==============================

function timeAgo(ts) {

  const d =
    ts instanceof Date
      ? ts
      : new Date(ts);

  const now =
    new Date();

  const m =
    Math.floor((now - d) / 60000);


  return m < 1
    ? "À l’instant"
    : m < 60
      ? `Il y a ${m} min`
      : m < 1440
        ? `Il y a ${Math.floor(m / 60)} h`
        : d.toLocaleDateString("fr-FR");
}


// ==============================
// SECURITE HTML
// ==============================

function escapeHtml(s) {

  return String(s).replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );

}


// ==============================
// AFFICHER LES PENSEES
// ==============================

function render() {

  list.innerHTML =
    thoughts.length

      ? thoughts
          .slice(0, 8)
          .map(t => `

            <div class="thought-item">

              <span class="heart">
                💗
              </span>

              <div>

                <b>
                  ${escapeHtml(t.text)}
                </b>

                <small>
                  ${t.sender ? escapeHtml(t.sender) + " · " : ""}
                  ${timeAgo(t.ts)}
                </small>

              </div>

            </div>

          `)
          .join("")

      : `

        <div class="thought-item">

          <span class="heart">
            💭
          </span>

          <div>

            <b>
              Aucune pensée pour le moment
            </b>

            <small>
              Envoie la première ❤️
            </small>

          </div>

        </div>

      `;
}


// ==============================
// TOAST
// ==============================

function showToast(s) {

  toast.textContent =
    s;

  toast.classList.add("show");

  setTimeout(
    () => toast.classList.remove("show"),
    2200
  );

}


// ==============================
// COEURS
// ==============================

function popHearts() {

  for (
    let i = 0;
    i < 14;
    i++
  ) {

    const h =
      document.createElement("span");

    h.className =
      "heart-pop";

    h.textContent =
      [
        "❤️",
        "💕",
        "💗",
        "💖"
      ][i % 4];


    h.style.left =
      (35 + Math.random() * 30) + "%";


    h.style.top =
      (42 + Math.random() * 12) + "%";


    h.style.setProperty(
      "--x",
      (Math.random() * 180 - 90) + "px"
    );


    $("#hearts").appendChild(h);


    setTimeout(
      () => h.remove(),
      1500
    );

  }

}


// ==============================
// ENVOYER UNE PENSEE
// ==============================

async function addThought(t) {

  try {

    await authReady;


    await addDoc(
      collection(
        db,
        "couples",
        COUPLE_ID,
        "thoughts"
      ),

      {
        text: t,
        sender: SENDER,
        createdAt: new Date()
      }
    );


    showToast(
      "Pensée envoyée ❤️"
    );


    popHearts();

  } catch (error) {

    console.error(
      "Erreur lors de l'envoi :",
      error
    );


    showToast(
      "Impossible d’envoyer la pensée"
    );

  }

}


// ==============================
// PENSEES EN TEMPS REEL
// ==============================

let unsubscribeThoughts = null;


function startThoughtListener() {

  if (unsubscribeThoughts) {
    unsubscribeThoughts();
  }


  const thoughtsQuery =
    query(
      collection(
        db,
        "couples",
        COUPLE_ID,
        "thoughts"
      ),

      orderBy(
        "createdAt",
        "desc"
      )
    );


  unsubscribeThoughts =
    onSnapshot(

      thoughtsQuery,

      snapshot => {

        thoughts =
          snapshot.docs.map(
            doc => {

              const data =
                doc.data();


              return {

                text:
                  data.text || "",

                sender:
                  data.sender || "",

                ts:
                  data.createdAt?.toDate
                    ? data.createdAt.toDate()
                    : new Date()

              };

            }
          );


        render();

      },

      error => {

        console.error(
          "Erreur Firestore :",
          error
        );


        showToast(
          "Impossible de charger les pensées"
        );

      }

    );

}


// ==============================
// BOUTON JE PENSE A TOI
// ==============================

$("#thinkBtn").onclick =
  () => {

    addThought(
      "Je pense à toi ❤️"
    );

  };


// ==============================
// PENSEES RAPIDES
// ==============================

document
  .querySelectorAll("[data-thought]")
  .forEach(b => {

    b.onclick =
      () => {

        addThought(
          b.dataset.thought
        );

      };

  });


// ==============================
// PENSEE PERSONNALISEE
// ==============================

$("#customBtn").onclick =
$("#plusBtn").onclick =
  () => {

    modal.classList.remove(
      "hidden"
    );

    text.focus();

  };


$("#closeModal").onclick =
  () => {

    modal.classList.add(
      "hidden"
    );

  };


$("#sendThought").onclick =
  () => {

    const v =
      text.value.trim();


    if (!v) return;


    addThought(v);


    text.value =
      "";


    modal.classList.add(
      "hidden"
    );

  };


modal.addEventListener(
  "click",
  e => {

    if (
      e.target === modal
    ) {

      modal.classList.add(
        "hidden"
      );

    }

  }
);


// ==============================
// COMPTE A REBOURS
// ==============================

function countdown() {

  if (!reunion) {

    $("#countdownValue").textContent =
      "Ajoute une date dans « Nous »";

    return;

  }


  const n =
    new Date(reunion)
    - Date.now();


  if (n <= 0) {

    $("#countdownValue").textContent =
      "C’est le jour des retrouvailles ❤️";

    return;

  }


  const s =
    Math.floor(n / 1000);

  const d =
    Math.floor(s / 86400);

  const h =
    Math.floor(
      (s % 86400) / 3600
    );

  const m =
    Math.floor(
      (s % 3600) / 60
    );

  const sec =
    s % 60;


  $("#countdownValue").textContent =
    `${d} j · ` +
    `${String(h).padStart(2, "0")} h · ` +
    `${String(m).padStart(2, "0")} min · ` +
    `${String(sec).padStart(2, "0")} s`;

}


setInterval(
  countdown,
  1000
);


countdown();

render();


// ==============================
// NAVIGATION
// ==============================

document
  .querySelectorAll("[data-tab]")
  .forEach(b => {

    b.onclick =
      () => {

        showToast(
          "Cette section arrive dans la prochaine version 💕"
        );

      };

  });


$("#menuBtn").onclick =
  () => {

    showToast(
      "Menu — bientôt disponible"
    );

  };


$("#profileBtn").onclick =
  () => {

    showToast(
      "Profil — bientôt disponible"
    );

  };


// ==============================
// SERVICE WORKER
// ==============================

if (
  "serviceWorker" in navigator
) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(
      error => {

        console.error(
          "Erreur Service Worker :",
          error
        );

      }
    );

}


// ==============================
// DEMARRAGE
// ==============================

startThoughtListener();
