import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6xJCfrjk3RQ5vWAoDVBP5nhaDSLTw-F0",
  authDomain: "emre-tkmolustr.firebaseapp.com",
  projectId: "emre-tkmolustr",
  storageBucket: "emre-tkmolustr.firebasestorage.app",
  messagingSenderId: "465918251433",
  appId: "1:465918251433:web:41d61ae613b224353934b8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

function showMessage(text, isError = false) {
  registerMessage.style.display = "block";
  registerMessage.textContent = text;
  registerMessage.style.borderColor = isError ? "#fecaca" : "#cbd5e1";
  registerMessage.style.background = isError ? "#fef2f2" : "#f8fafc";
  registerMessage.style.color = isError ? "#b91c1c" : "#475569";
}

function normalizeText(text) {
  return text.trim().replace(/\s+/g, " ");
}

async function userAlreadyExists(firstName, lastName) {
  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    where("firstName", "==", firstName),
    where("lastName", "==", lastName)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

registerForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const firstName = normalizeText(document.getElementById("firstName").value);
  const lastName = normalizeText(document.getElementById("lastName").value);

  if (!firstName || !lastName) {
    showMessage("Lütfen isim ve soyisim gir.", true);
    return;
  }

  try {
    const exists = await userAlreadyExists(firstName, lastName);

    if (exists) {
      showMessage("Bu isimle kayıt zaten var.", true);
      return;
    }

    const fullName = `${firstName} ${lastName}`;

    const userData = {
      firstName,
      lastName,
      fullName,
      role: "user",
      canEditRatings: false,
      approved: true,
      createdAt: new Date().toISOString()
    };

    const playerData = {
      name: fullName,
      position: "Orta Saha",
      overall: 5,
      shot: 5,
      defense: 5,
      pass: 5,
      speed: 5,
      stamina: 5,
      active: true,
      playingToday: true,
      isBench: false,
      role: "user",
      canEditRatings: false,
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, "users"), userData);
    await addDoc(collection(db, "players"), playerData);

    registerForm.reset();
    showMessage("Kayıt başarılı. Artık takım ekranında listede görüneceksin.");
  } catch (error) {
    console.error(error);
    showMessage("Kayıt sırasında hata oluştu.", true);
  }
});
