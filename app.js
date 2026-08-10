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


// ========================================
// FIREBASE
// ========================================

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


// ========================================
// AUTHENTIFICATION
// ========================================

const authReady = signInAnonymously(auth)
  .then(() => {

    console.log(
      "Firebase : utilisateur connecté"
    );

  })
  .catch(error => {

    console.error(
      "Erreur authentification :",
      error
    );

    throw error;

  });


// ========================================
// REJOINDRE LE COUPLE
// ========================================

const joinButton =
  $("#joinCoupleBtn");

const codeInput =
  $("#coupleCodeInput");

const coupleStatus =
  $("#coupleStatus");


if (joinButton) {

  joinButton.onclick = async () => {

    const code =
      codeInput.value.trim();


    if (!code) {

      coupleStatus.textContent =
        "Entre le code de votre couple ❤️";

      return;
    }


    try {

      coupleStatus.textContent =
        "Connexion à Firebase...";


      await authReady;


      console.log(
        "Firebase connecté"
      );


      console.log(
        "Projet Firebase :",
        "penseeatoi-fb1eb"
      );


      console.log(
        "Recherche : couples/couple1"
      );


      // IMPORTANT :
      // Collection : couples
      // Document : couple1

      const coupleRef =
        doc(
          db,
          "couples",
          "couple1"
        );


      const snapshot =
        await getDoc(coupleRef);


      console.log(
        "Document trouvé :",
        snapshot.exists()
      );


      if (!snapshot.exists()) {

        coupleStatus.textContent =
          "Firebase ne trouve pas couples/couple1.";

        console.error(
          "DOCUMENT INTROUVABLE : couples/couple1"
        );

        return;
      }


      const data =
        snapshot.data();


      console.log(
        "Données Firestore :",
        data
      );


      // Ton champ Firestore est bien "Code"
      const firestoreCode =
        String(
          data.Code || ""
        )
        .trim()
        .toLowerCase();


      const enteredCode =
        String(code)
        .trim()
        .toLowerCase();


      console.log(
        "Code Firestore :",
        firestoreCode
      );


      console.log(
        "Code entré :",
        enteredCode
      );


      if (
        firestoreCode !== enteredCode
      ) {

        coupleStatus.textContent =
          "Code incorrect ❤️";

        return;
      }


      // ====================================
      // COUPLE VALIDÉ
      // ====================================

      COUPLE_ID =
        "couple1";


      localStorage.setItem(
        "pat_couple_id",
        COUPLE_ID
      );


      // Afficher les partenaires

      if ($("#partnerLabel")) {

        const partner1 =
          data.Partner1 || "Vincent";

        const partner2 =
          data.Partner2 || "Ma chérie";


        $("#partnerLabel").textContent =
          `${partner1} ❤️ ${partner2}`;

      }


      // Afficher la date si elle existe

      if (data.Partner3) {

        reunion =
          data.Partner3;

      }


      coupleStatus.textContent =
        "Couple connecté ❤️";


      showToast(
        "Bienvenue dans votre couple ❤️"
      );


      // Charger les pensées

      startThoughtListener();

    }

    catch (error) {

      console.error(
        "ERREUR FIREBASE :",
        error
      );


      coupleStatus.textContent =
        "Erreur Firebase : " +
        (
          error.message ||
          "erreur inconnue"
        );

    }

  };

}


// ========================================
// TEMPS
// ========================================

function timeAgo(ts) {

  const d =
    ts instanceof Date
      ? ts
      : new Date(ts);


  const now =
    new Date();


  const m =
    Math.floor(
      (now - d) / 60000
    );


  if (m < 1) {

    return "À l’instant";

  }


  if (m < 60) {

    return `Il y a ${m} min`;

  }


  if (m < 1440) {

    return `Il y a ${Math.floor(m / 60)} h`;

  }


  return d.toLocaleDateString(
    "fr-FR"
  );

}


// ========================================
// SECURITE HTML
// ========================================

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


// ========================================
// AFFICHER LES PENSEES
// ========================================

function render() {

  if (!list) {
    return;
  }


  if (!thoughts.length) {

    list.innerHTML = `

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

    return;
  }


  list.innerHTML =
    thoughts
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

              ${
                t.sender
                  ? escapeHtml(t.sender) + " · "
                  : ""
              }

              ${timeAgo(t.ts)}

            </small>

          </div>

        </div>

      `)
      .join("");

}


// ========================================
// MESSAGE
// ========================================

function showToast(s) {

  if (!toast) {
    return;
  }


  toast.textContent =
    s;


  toast.classList.add(
    "show"
  );


  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    2200
  );

}


// ========================================
// ANIMATION COEURS
// ========================================

function popHearts() {

  const container =
    $("#hearts");


  if (!container) {
    return;
  }


  for (
    let i = 0;
    i < 14;
    i++
  ) {

    const h =
      document.createElement(
        "span"
      );


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
      (
        35 +
        Math.random() * 30
      ) + "%";


    h.style.top =
      (
        42 +
        Math.random() * 12
      ) + "%";


    h.style.setProperty(
      "--x",
      (
        Math.random() * 180 -
        90
      ) + "px"
    );


    container.appendChild(h);


    setTimeout(
      () => h.remove(),
      1500
    );

  }

}


// ========================================
// ENVOYER UNE PENSEE
// ========================================

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

  }

  catch (error) {

    console.error(
      "Erreur envoi pensée :",
      error
    );


    showToast(
      "Impossible d’envoyer la pensée"
    );

  }

}


// ========================================
// PENSEES EN TEMPS REEL
// ========================================

let unsubscribeThoughts = null;


function startThoughtListener() {

  if (unsubscribeThoughts) {

    unsubscribeThoughts();

  }


  console.log(
    "Chargement des pensées de :",
    COUPLE_ID
  );


  const thoughtsRef =
    collection(
      db,
      "couples",
      COUPLE_ID,
      "thoughts"
    );


  const thoughtsQuery =
    query(
      thoughtsRef,
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
          "Erreur lecture Firestore :",
          error
        );


        showToast(
          "Impossible de charger les pensées"
        );

      }

    );

}


// ========================================
// BOUTON JE PENSE À TOI
// ========================================

const thinkButton =
  $("#thinkBtn");


if (thinkButton) {

  thinkButton.onclick =
    () => {

      addThought(
        "Je pense à toi ❤️"
      );

    };

}


// ========================================
// PENSEES RAPIDES
// ========================================

document
  .querySelectorAll(
    "[data-thought]"
  )
  .forEach(button => {

    button.onclick =
      () => {

        addThought(
          button.dataset.thought
        );

      };

  });


// ========================================
// PENSEE PERSONNALISEE
// ========================================

const customButton =
  $("#customBtn");

const plusButton =
  $("#plusBtn");


function openModal() {

  if (!modal) {
    return;
  }


  modal.classList.remove(
    "hidden"
  );


  if (text) {
    text.focus();
  }

}


if (customButton) {

  customButton.onclick =
    openModal;

}


if (plusButton) {

  plusButton.onclick =
    openModal;

}


if ($("#closeModal")) {

  $("#closeModal").onclick =
    () => {

      modal.classList.add(
        "hidden"
      );

    };

}


if ($("#sendThought")) {

  $("#sendThought").onclick =
    () => {

      const v =
        text.value.trim();


      if (!v) {
        return;
      }


      addThought(v);


      text.value =
        "";


      modal.classList.add(
        "hidden"
      );

    };

}


if (modal) {

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

}


// ========================================
// COMPTE À REBOURS
// ========================================

function countdown() {

  const element =
    $("#countdownValue");


  if (!element) {
    return;
  }


  if (!reunion) {

    element.textContent =
      "Ajoute une date dans « Nous »";

    return;

  }


  const n =
    new Date(reunion)
    - Date.now();


  if (n <= 0) {

    element.textContent =
      "C’est le jour des retrouvailles ❤️";

    return;

  }


  const s =
    Math.floor(n / 1000);


  const d =
    Math.floor(
      s / 86400
    );


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


  element.textContent =
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


// ========================================
// NAVIGATION
// ========================================

document
  .querySelectorAll(
    "[data-tab]"
  )
  .forEach(button => {

    button.onclick =
      () => {

        showToast(
          "Cette section arrive dans la prochaine version 💕"
        );

      };

  });


if ($("#menuBtn")) {

  $("#menuBtn").onclick =
    () => {

      showToast(
        "Menu — bientôt disponible"
      );

    };

}


if ($("#profileBtn")) {

  $("#profileBtn").onclick =
    () => {

      showToast(
        "Profil — bientôt disponible"
      );

    };

}


// ========================================
// SERVICE WORKER
// ========================================

if (
  "serviceWorker" in navigator
) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(error => {

      console.error(
        "Erreur Service Worker :",
        error
      );

    });

}


// ========================================
// AFFICHAGE INITIAL
// ========================================

render();


// On charge les pensées du couple
// déjà mémorisé sur le téléphone.

startThoughtListener();
