import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6xJCfrjk3RQ5vWAoDVBP5nhaDSlTw-F0",
  authDomain: "emre-tkmolustr.firebaseapp.com",
  databaseURL: "https://emre-tkmolustr-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "emre-tkmolustr",
  storageBucket: "emre-tkmolustr.firebasestorage.app",
  messagingSenderId: "465918251433",
  appId: "1:465918251433:web:41d61ae613b224353934b8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const playersCollection = collection(db, "players");
const usersCollection = collection(db, "users");

const authScreen = document.getElementById("authScreen");
const appRoot = document.getElementById("appRoot");
const authMessage = document.getElementById("authMessage");
const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const logoutBtn = document.getElementById("logoutBtn");
const sessionInfo = document.getElementById("sessionInfo");

const adminUsersCard = document.getElementById("adminUsersCard");
const usersList = document.getElementById("usersList");
const userCountBadge = document.getElementById("userCountBadge");
const playerFormCard = document.getElementById("playerFormCard");

const playerForm = document.getElementById("playerForm");
const playersList = document.getElementById("playersList");
const generateTeamsBtn = document.getElementById("generateTeamsBtn");
const clearPlayersBtn = document.getElementById("clearPlayersBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const teamAEl = document.getElementById("teamA");
const teamBEl = document.getElementById("teamB");
const benchListEl = document.getElementById("benchList");
const teamATotalEl = document.getElementById("teamATotal");
const teamBTotalEl = document.getElementById("teamBTotal");
const teamAMetaEl = document.getElementById("teamAMeta");
const teamBMetaEl = document.getElementById("teamBMeta");
const resultInfoBadge = document.getElementById("resultInfoBadge");

let players = [];
let users = [];
let currentTeams = {
  teamA: [],
  teamB: [],
  bench: []
};

let currentAuthUser = null;
let currentUserDoc = null;

function normalizeName(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/\s+/g, ".");
}

function prettifyName(text) {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildHiddenEmail(firstName, lastName) {
  return `${normalizeName(firstName)}.${normalizeName(lastName)}@halisaha.local`;
}

function showAuthMessage(text, isError = false) {
  authMessage.style.display = "block";
  authMessage.textContent = text;
  authMessage.style.borderColor = isError ? "#fecaca" : "#cbd5e1";
  authMessage.style.background = isError ? "#fef2f2" : "#f8fafc";
  authMessage.style.color = isError ? "#b91c1c" : "#475569";
}

function hideAuthMessage() {
  authMessage.style.display = "none";
}

function openLogin() {
  loginForm.style.display = "block";
  registerForm.style.display = "none";
  showLoginBtn.classList.remove("secondary");
  showRegisterBtn.classList.add("secondary");
  hideAuthMessage();
}

function openRegister() {
  loginForm.style.display = "none";
  registerForm.style.display = "block";
  showRegisterBtn.classList.remove("secondary");
  showLoginBtn.classList.add("secondary");
  hideAuthMessage();
}

showLoginBtn.addEventListener("click", openLogin);
showRegisterBtn.addEventListener("click", openRegister);

function isAdmin() {
  return currentUserDoc?.role === "admin";
}

function canEditRatings() {
  return currentUserDoc?.role === "admin" || currentUserDoc?.role === "editor";
}

function isNormalUser() {
  return currentUserDoc?.role === "user";
}

async function loadUsers() {
  const snapshot = await getDocs(usersCollection);
  users = snapshot.docs.map(docSnap => ({
    uid: docSnap.id,
    ...docSnap.data()
  }));
}

async function loadPlayers() {
  const snapshot = await getDocs(playersCollection);
  players = snapshot.docs
    .map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }))
    .filter(player => player.name && player.position);
}

async function getCurrentUserDoc(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() };
}

async function registerNewAccount(firstName, lastName, password) {
  const cleanFirstName = prettifyName(firstName);
  const cleanLastName = prettifyName(lastName);
  const fullName = `${cleanFirstName} ${cleanLastName}`;
  const email = buildHiddenEmail(cleanFirstName, cleanLastName);

  const sameNameQuery = query(
    usersCollection,
    where("email", "==", email)
  );
  const sameNameSnap = await getDocs(sameNameQuery);

  if (!sameNameSnap.empty) {
    throw new Error("Bu isim ve soyisimle kayıt zaten var.");
  }

  const existingUsersSnap = await getDocs(usersCollection);
  const firstUser = existingUsersSnap.empty;

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  const role = firstUser ? "admin" : "user";

  await setDoc(doc(db, "users", uid), {
    firstName: cleanFirstName,
    lastName: cleanLastName,
    fullName,
    email,
    role,
    createdAt: new Date().toISOString()
  });

  await addDoc(playersCollection, {
    ownerUid: uid,
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
    createdAt: new Date().toISOString()
  });
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAuthMessage();

  const firstName = document.getElementById("loginFirstName").value;
  const lastName = document.getElementById("loginLastName").value;
  const password = document.getElementById("loginPassword").value;

  const email = buildHiddenEmail(firstName, lastName);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
  } catch (error) {
    console.error(error);
    showAuthMessage("Giriş yapılamadı. Bilgileri kontrol et.", true);
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAuthMessage();

  const firstName = document.getElementById("registerFirstName").value;
  const lastName = document.getElementById("registerLastName").value;
  const password = document.getElementById("registerPassword").value;

  if (!firstName.trim() || !lastName.trim() || password.length < 6) {
    showAuthMessage("İsim, soyisim ve en az 6 karakter şifre gir.", true);
    return;
  }

  try {
    await registerNewAccount(firstName, lastName, password);
    registerForm.reset();
  } catch (error) {
    console.error(error);
    showAuthMessage(error.message || "Kayıt sırasında hata oluştu.", true);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

function updateVisibilityByRole() {
  const admin = isAdmin();
  const editor = canEditRatings();

  adminUsersCard.style.display = admin ? "block" : "none";
  playerFormCard.style.display = editor ? "block" : "none";

  clearPlayersBtn.style.display = admin ? "inline-flex" : "none";

  sessionInfo.innerHTML = `
    <strong>${currentUserDoc?.fullName || ""}</strong> |
    Rol: <strong>${currentUserDoc?.role || "-"}</strong>
  `;
}

function getPositionBadgeClass(position) {
  if (position === "Kaleci") return "badge-kaleci";
  if (position === "Defans") return "badge-defans";
  if (position === "Orta Saha") return "badge-orta-saha";
  return "badge-forvet";
}

function getCurrentPlayerDoc() {
  if (!currentAuthUser) return null;
  return players.find(p => p.ownerUid === currentAuthUser.uid) || null;
}

function resetForm() {
  playerForm.reset();
  document.getElementById("editIndex").value = -1;
  document.getElementById("savePlayerBtn").textContent = "Kaydet";
}

function validatePlayer(player) {
  return (
    player.name &&
    player.position &&
    [player.overall, player.shot, player.defense, player.pass, player.speed, player.stamina]
      .every(v => v >= 1 && v <= 10)
  );
}

async function normalizeOldPlayers() {
  let changed = false;

  players = players.map(p => {
    const normalized = {
      active: p.active !== undefined ? p.active : true,
      playingToday: p.playingToday !== undefined ? p.playingToday : true,
      isBench: p.isBench !== undefined ? p.isBench : false,
      ...p
    };

    if (
      p.active === undefined ||
      p.playingToday === undefined ||
      p.isBench === undefined
    ) {
      changed = true;
    }

    return normalized;
  });

  if (changed) {
    for (let i = 0; i < players.length; i++) {
      await updatePlayerInFirestore(i);
    }
  }
}

async function updatePlayerInFirestore(index) {
  const player = players[index];
  if (!player?.id) return;

  const { id, ...playerData } = player;
  await updateDoc(doc(db, "players", id), playerData);
}

async function deletePlayerFromFirestore(index) {
  const player = players[index];
  if (!player?.id) return;
  await deleteDoc(doc(db, "players", player.id));
}

async function deleteAllPlayersFromFirestore() {
  const snapshot = await getDocs(playersCollection);
  const deletions = snapshot.docs.map(docSnap => deleteDoc(doc(db, "players", docSnap.id)));
  await Promise.all(deletions);
}

function getFormValues() {
  return {
    name: document.getElementById("name").value.trim(),
    position: document.getElementById("position").value,
    overall: Number(document.getElementById("overall").value),
    shot: Number(document.getElementById("shot").value),
    defense: Number(document.getElementById("defense").value),
    pass: Number(document.getElementById("pass").value),
    speed: Number(document.getElementById("speed").value),
    stamina: Number(document.getElementById("stamina").value),
    active: true,
    playingToday: true,
    isBench: false
  };
}

function canCurrentUserEditPlayer(player) {
  if (!currentAuthUser || !player) return false;
  if (isAdmin() || canEditRatings()) return true;
  return player.ownerUid === currentAuthUser.uid;
}

function renderUsers() {
  if (!isAdmin()) return;

  userCountBadge.textContent = `${users.length} kullanıcı`;

  if (!users.length) {
    usersList.innerHTML = `<p class="empty-text">Henüz kullanıcı yok.</p>`;
    return;
  }

  usersList.innerHTML = users.map(user => `
    <div class="player-item">
      <div class="player-top">
        <div class="player-left">
          <div class="player-name">${user.fullName}</div>
          <span class="position-badge badge-orta-saha">${user.role}</span>
        </div>
      </div>

      <div class="player-stats">
        Gizli giriş: ${user.email}
      </div>

      <div class="player-actions">
        <select class="role-select" data-uid="${user.uid}">
          <option value="user" ${user.role === "user" ? "selected" : ""}>user</option>
          <option value="editor" ${user.role === "editor" ? "selected" : ""}>editor</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>admin</option>
        </select>
        <button type="button" class="edit-btn" onclick="saveUserRole('${user.uid}')">Yetki Kaydet</button>
      </div>
    </div>
  `).join("");
}

async function saveUserRole(uid) {
  if (!isAdmin()) return;

  const select = document.querySelector(`select[data-uid="${uid}"]`);
  if (!select) return;

  const role = select.value;
  await updateDoc(doc(db, "users", uid), { role });

  if (currentAuthUser && currentAuthUser.uid === uid) {
    currentUserDoc.role = role;
    updateVisibilityByRole();
  }

  await loadUsers();
  renderUsers();
}

function renderPlayers() {
  const playerCountBadge = document.getElementById("playerCountBadge");
  const activeCountBadge = document.getElementById("activeCountBadge");

  const visiblePlayers = isAdmin() || canEditRatings()
    ? players
    : players.filter(p => p.ownerUid === currentAuthUser?.uid);

  const activeCount = visiblePlayers.filter(p => p.active && p.playingToday && !p.isBench).length;

  if (playerCountBadge) playerCountBadge.textContent = `${visiblePlayers.length} oyuncu`;
  if (activeCountBadge) activeCountBadge.textContent = `${activeCount} aktif`;

  if (visiblePlayers.length === 0) {
    playersList.innerHTML = `<p class="empty-text">Henüz oyuncu eklenmedi.</p>`;
    return;
  }

  playersList.innerHTML = visiblePlayers.map((player) => {
    const realIndex = players.findIndex(p => p.id === player.id);
    const editable = canCurrentUserEditPlayer(player);
    const ratingsEditable = canEditRatings();
    const showActions = editable;

    return `
      <div class="player-item">
        <div class="player-top">
          <div class="player-left">
            <div class="player-name">${player.name}</div>
            <span class="position-badge ${getPositionBadgeClass(player.position)}">${player.position}</span>
          </div>
        </div>

        <div class="player-flags">
          <span class="flag-pill ${player.active ? 'flag-active' : 'flag-passive'}">
            ${player.active ? 'Aktif' : 'Pasif'}
          </span>
          <span class="flag-pill ${player.playingToday ? 'flag-active' : 'flag-passive'}">
            ${player.playingToday ? 'Bugün Oynuyor' : 'Bugün Yok'}
          </span>
          ${player.isBench ? `<span class="flag-pill flag-bench">Yedek</span>` : ``}
        </div>

        <div class="player-stats">
          Genel: ${player.overall} |
          Şut: ${player.shot} |
          Defans: ${player.defense} |
          Pas: ${player.pass} |
          Hız: ${player.speed} |
          Dayanıklılık: ${player.stamina}
        </div>

        <div class="player-controls">
          <label class="toggle-box">
            <input type="checkbox" ${player.active ? "checked" : ""} ${editable ? "" : "disabled"} onchange="togglePlayerActive(${realIndex})" />
            <span>Aktif</span>
          </label>

          <label class="toggle-box">
            <input type="checkbox" ${player.playingToday ? "checked" : ""} ${editable ? "" : "disabled"} onchange="togglePlayingToday(${realIndex})" />
            <span>Bugün Var</span>
          </label>

          <label class="toggle-box">
            <input type="checkbox" ${player.isBench ? "checked" : ""} ${editable ? "" : "disabled"} onchange="toggleBench(${realIndex})" />
            <span>Yedek</span>
          </label>
        </div>

        ${showActions ? `
          <div class="player-actions">
            ${ratingsEditable ? `<button class="edit-btn" onclick="editPlayer(${realIndex})">Düzenle</button>` : ``}
            ${isAdmin() ? `<button class="player-delete-btn" onclick="deletePlayer(${realIndex})">Sil</button>` : ``}
          </div>
        ` : ``}
      </div>
    `;
  }).join("");
}

function editPlayer(index) {
  if (!canEditRatings()) return;

  const p = players[index];
  document.getElementById("name").value = p.name;
  document.getElementById("position").value = p.position;
  document.getElementById("overall").value = p.overall;
  document.getElementById("shot").value = p.shot;
  document.getElementById("defense").value = p.defense;
  document.getElementById("pass").value = p.pass;
  document.getElementById("speed").value = p.speed;
  document.getElementById("stamina").value = p.stamina;
  document.getElementById("editIndex").value = index;
  document.getElementById("savePlayerBtn").textContent = "Güncelle";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deletePlayer(index) {
  if (!isAdmin()) return;
  await deletePlayerFromFirestore(index);
  players.splice(index, 1);
  renderPlayers();
  clearResults();
}

async function togglePlayerActive(index) {
  const player = players[index];
  if (!canCurrentUserEditPlayer(player)) return;
  players[index].active = !players[index].active;
  await updatePlayerInFirestore(index);
  renderPlayers();
}

async function togglePlayingToday(index) {
  const player = players[index];
  if (!canCurrentUserEditPlayer(player)) return;
  players[index].playingToday = !players[index].playingToday;
  await updatePlayerInFirestore(index);
  renderPlayers();
}

async function toggleBench(index) {
  const player = players[index];
  if (!canCurrentUserEditPlayer(player)) return;
  players[index].isBench = !players[index].isBench;
  await updatePlayerInFirestore(index);
  renderPlayers();
}

function calculatePlayerScore(player) {
  return (
    player.overall * 3 +
    player.shot * 2 +
    player.defense * 2 +
    player.pass * 1.5 +
    player.speed * 1.5 +
    player.stamina * 1
  );
}

function calculateAttackScore(player) {
  return player.shot * 3 + player.speed * 2 + player.pass * 1 + player.overall * 1;
}

function calculateDefenseScore(player) {
  return player.defense * 3 + player.stamina * 2 + player.overall * 1;
}

function getTeamStats(team) {
  const total = team.reduce((sum, p) => sum + calculatePlayerScore(p), 0);
  const attack = team.reduce((sum, p) => sum + calculateAttackScore(p), 0);
  const defense = team.reduce((sum, p) => sum + calculateDefenseScore(p), 0);

  const positions = {
    Kaleci: team.filter(p => p.position === "Kaleci").length,
    Defans: team.filter(p => p.position === "Defans").length,
    "Orta Saha": team.filter(p => p.position === "Orta Saha").length,
    Forvet: team.filter(p => p.position === "Forvet").length,
  };

  return { total, attack, defense, positions };
}

function shuffleArray(arr) {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function getPositionDifferencePenalty(teamA, teamB) {
  const positions = ["Kaleci", "Defans", "Orta Saha", "Forvet"];
  let penalty = 0;

  for (const pos of positions) {
    const a = teamA.filter(p => p.position === pos).length;
    const b = teamB.filter(p => p.position === pos).length;
    penalty += Math.abs(a - b) * 20;
  }

  return penalty;
}

function getGoalkeeperPenalty(teamA, teamB) {
  const gkA = teamA.filter(p => p.position === "Kaleci").length;
  const gkB = teamB.filter(p => p.position === "Kaleci").length;
  return Math.abs(gkA - gkB) * 40;
}

function evaluateTeams(teamA, teamB, usePositionBalance, useGoalkeeperBalance) {
  const statsA = getTeamStats(teamA);
  const statsB = getTeamStats(teamB);

  let diff = 0;
  diff += Math.abs(statsA.total - statsB.total);
  diff += Math.abs(statsA.attack - statsB.attack) * 0.7;
  diff += Math.abs(statsA.defense - statsB.defense) * 0.7;

  if (usePositionBalance) diff += getPositionDifferencePenalty(teamA, teamB);
  if (useGoalkeeperBalance) diff += getGoalkeeperPenalty(teamA, teamB);

  return {
    score: diff,
    statsA,
    statsB
  };
}

function distributeBalanced(pool, teamSize) {
  const sorted = [...pool].sort((a, b) => calculatePlayerScore(b) - calculatePlayerScore(a));
  const teamA = [];
  const teamB = [];
  let scoreA = 0;
  let scoreB = 0;

  for (const player of sorted) {
    if (teamA.length >= teamSize) {
      teamB.push(player);
      scoreB += calculatePlayerScore(player);
      continue;
    }

    if (teamB.length >= teamSize) {
      teamA.push(player);
      scoreA += calculatePlayerScore(player);
      continue;
    }

    if (scoreA <= scoreB) {
      teamA.push(player);
      scoreA += calculatePlayerScore(player);
    } else {
      teamB.push(player);
      scoreB += calculatePlayerScore(player);
    }
  }

  return { teamA, teamB };
}

function distributeRandom(pool, teamSize) {
  const shuffled = shuffleArray(pool);
  return {
    teamA: shuffled.slice(0, teamSize),
    teamB: shuffled.slice(teamSize, teamSize * 2)
  };
}

function distributeSemiRandom(pool, teamSize) {
  const sorted = [...pool].sort((a, b) => calculatePlayerScore(b) - calculatePlayerScore(a));
  const chunks = [];

  for (let i = 0; i < sorted.length; i += 2) {
    chunks.push(sorted.slice(i, i + 2));
  }

  const randomized = chunks.flatMap(chunk => shuffleArray(chunk));
  const teamA = [];
  const teamB = [];
  let scoreA = 0;
  let scoreB = 0;

  for (const player of randomized) {
    if (teamA.length >= teamSize) {
      teamB.push(player);
      scoreB += calculatePlayerScore(player);
      continue;
    }

    if (teamB.length >= teamSize) {
      teamA.push(player);
      scoreA += calculatePlayerScore(player);
      continue;
    }

    if (scoreA <= scoreB) {
      teamA.push(player);
      scoreA += calculatePlayerScore(player);
    } else {
      teamB.push(player);
      scoreB += calculatePlayerScore(player);
    }
  }

  return { teamA, teamB };
}

function getEligiblePlayers() {
  const visiblePlayers = isAdmin() || canEditRatings()
    ? players
    : players.filter(p => p.ownerUid === currentAuthUser?.uid);

  return visiblePlayers.filter(p => p.active && p.playingToday && !p.isBench);
}

function getBenchPlayers() {
  const visiblePlayers = isAdmin() || canEditRatings()
    ? players
    : players.filter(p => p.ownerUid === currentAuthUser?.uid);

  return visiblePlayers.filter(p => p.active && p.playingToday && p.isBench);
}

function generateBestTeams(pool, teamSize, balanceMode, usePositionBalance, useGoalkeeperBalance) {
  let best = null;

  for (let i = 0; i < 300; i++) {
    const shuffledPool = shuffleArray(pool);
    let teams;

    if (balanceMode === "random") {
      teams = distributeRandom(shuffledPool, teamSize);
    } else if (balanceMode === "semi-random") {
      teams = distributeSemiRandom(shuffledPool, teamSize);
    } else {
      teams = distributeBalanced(shuffledPool, teamSize);
    }

    const evaluation = evaluateTeams(
      teams.teamA,
      teams.teamB,
      usePositionBalance,
      useGoalkeeperBalance
    );

    const result = { teamA: teams.teamA, teamB: teams.teamB, evaluation };

    if (!best || result.evaluation.score < best.evaluation.score) {
      best = result;
    }
  }

  return best;
}

function renderSingleTeam(team, target, teamKey) {
  if (!team.length) {
    target.innerHTML = `<p class="empty-text">Takım boş.</p>`;
    return;
  }

  target.innerHTML = team.map((player, index) => `
    <div class="team-player" draggable="true"
      data-team="${teamKey}"
      data-index="${index}">
      <div class="team-player-head">
        <div class="team-player-name">${player.name}</div>
        <span class="position-badge ${getPositionBadgeClass(player.position)}">${player.position}</span>
      </div>
      <div class="team-player-stats">
        Genel: ${player.overall} | Şut: ${player.shot} | Defans: ${player.defense}<br>
        Pas: ${player.pass} | Hız: ${player.speed} | Dayanıklılık: ${player.stamina}
      </div>
    </div>
  `).join("");

  attachDragEvents();
}

function renderBench(bench) {
  if (!bench.length) {
    benchListEl.innerHTML = `<p class="empty-text">Yedek oyuncu yok.</p>`;
    return;
  }

  benchListEl.innerHTML = bench.map(player => `
    <div class="bench-player">
      <strong>${player.name}</strong><br>
      <span class="position-badge ${getPositionBadgeClass(player.position)}">${player.position}</span>
    </div>
  `).join("");
}

function renderTeamMetas() {
  const statsA = getTeamStats(currentTeams.teamA);
  const statsB = getTeamStats(currentTeams.teamB);

  teamATotalEl.textContent = `Puan ${statsA.total.toFixed(1)}`;
  teamBTotalEl.textContent = `Puan ${statsB.total.toFixed(1)}`;

  teamAMetaEl.innerHTML = `
    Takım A Toplam: ${statsA.total.toFixed(1)}<br>
    Hücum: ${statsA.attack.toFixed(1)}<br>
    Defans: ${statsA.defense.toFixed(1)}<br>
    Kaleci: ${statsA.positions["Kaleci"]} | Defans: ${statsA.positions["Defans"]} |
    Orta Saha: ${statsA.positions["Orta Saha"]} | Forvet: ${statsA.positions["Forvet"]}
  `;

  teamBMetaEl.innerHTML = `
    Takım B Toplam: ${statsB.total.toFixed(1)}<br>
    Hücum: ${statsB.attack.toFixed(1)}<br>
    Defans: ${statsB.defense.toFixed(1)}<br>
    Kaleci: ${statsB.positions["Kaleci"]} | Defans: ${statsB.positions["Defans"]} |
    Orta Saha: ${statsB.positions["Orta Saha"]} | Forvet: ${statsB.positions["Forvet"]}
  `;

  const diff = Math.abs(statsA.total - statsB.total).toFixed(1);
  resultInfoBadge.textContent = `Fark ${diff}`;
}

function renderCurrentTeams() {
  renderSingleTeam(currentTeams.teamA, teamAEl, "A");
  renderSingleTeam(currentTeams.teamB, teamBEl, "B");
  renderBench(currentTeams.bench);
  renderTeamMetas();
}

function clearResults() {
  teamAEl.innerHTML = `<p class="empty-text">Takım henüz oluşturulmadı.</p>`;
  teamBEl.innerHTML = `<p class="empty-text">Takım henüz oluşturulmadı.</p>`;
  benchListEl.innerHTML = `<p class="empty-text">Yedek oyuncu yok.</p>`;
  teamATotalEl.textContent = "";
  teamBTotalEl.textContent = "";
  teamAMetaEl.textContent = "";
  teamBMetaEl.textContent = "";
  resultInfoBadge.textContent = "Henüz oluşturulmadı";
  currentTeams = { teamA: [], teamB: [], bench: [] };
}

function generateTeams() {
  const eligiblePlayers = getEligiblePlayers();
  const benchPlayers = getBenchPlayers();

  if (eligiblePlayers.length < 2) {
    alert("Takım kurmak için yeterli aktif oyuncu yok.");
    return;
  }

  const teamSizeInput = Number(document.getElementById("teamSize").value);
  const balanceMode = document.getElementById("balanceMode").value;
  const usePositionBalance = document.getElementById("usePositionBalance").checked;
  const useGoalkeeperBalance = document.getElementById("useGoalkeeperBalance").checked;

  let teamSize = teamSizeInput && teamSizeInput > 0
    ? teamSizeInput
    : Math.floor(eligiblePlayers.length / 2);

  if (eligiblePlayers.length < teamSize * 2) {
    alert(`Bu ayarla takım kurmak için en az ${teamSize * 2} aktif oyuncu lazım.`);
    return;
  }

  const pool = eligiblePlayers.slice(0, teamSize * 2);
  const extraBench = eligiblePlayers.slice(teamSize * 2);
  const fullBench = [...benchPlayers, ...extraBench];

  const best = generateBestTeams(
    pool,
    teamSize,
    balanceMode,
    usePositionBalance,
    useGoalkeeperBalance
  );

  currentTeams = {
    teamA: [...best.teamA],
    teamB: [...best.teamB],
    bench: [...fullBench]
  };

  renderCurrentTeams();
}

function attachDragEvents() {
  const draggablePlayers = document.querySelectorAll(".team-player");
  const dropZones = [teamAEl, teamBEl];

  draggablePlayers.forEach(el => {
    el.addEventListener("dragstart", () => {
      el.classList.add("dragging");
    });

    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
    });
  });

  dropZones.forEach(zone => {
    zone.addEventListener("dragover", e => {
      e.preventDefault();
      zone.classList.add("drop-hover");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("drop-hover");
    });

    zone.addEventListener("drop", e => {
      e.preventDefault();
      zone.classList.remove("drop-hover");

      const dragged = document.querySelector(".team-player.dragging");
      if (!dragged) return;

      const fromTeam = dragged.dataset.team;
      const fromIndex = Number(dragged.dataset.index);
      const toTeam = zone.id === "teamA" ? "A" : "B";

      if (fromTeam === toTeam) return;

      swapPlayersBetweenTeams(fromTeam, fromIndex, toTeam);
    });
  });
}

function swapPlayersBetweenTeams(fromTeam, fromIndex, toTeam) {
  const source = fromTeam === "A" ? currentTeams.teamA : currentTeams.teamB;
  const target = toTeam === "A" ? currentTeams.teamA : currentTeams.teamB;

  if (!source.length || !target.length) return;

  const movedPlayer = source[fromIndex];
  if (!movedPlayer) return;

  const targetIndex = target.length - 1;
  const temp = target[targetIndex];
  target[targetIndex] = movedPlayer;
  source[fromIndex] = temp;

  renderCurrentTeams();
}

playerForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!canEditRatings()) {
    alert("Bu işlem için yetkin yok.");
    return;
  }

  const player = getFormValues();
  if (!validatePlayer(player)) {
    alert("Lütfen tüm alanları doğru doldur.");
    return;
  }

  const editIndex = Number(document.getElementById("editIndex").value);

  if (editIndex >= 0) {
    players[editIndex] = {
      ...players[editIndex],
      ...player,
      ownerUid: players[editIndex].ownerUid,
      active: players[editIndex].active,
      playingToday: players[editIndex].playingToday,
      isBench: players[editIndex].isBench
    };
    await updatePlayerInFirestore(editIndex);
  } else {
    const newPlayer = {
      ...player,
      ownerUid: currentAuthUser.uid
    };
    const docRef = await addDoc(playersCollection, newPlayer);
    newPlayer.id = docRef.id;
    players.push(newPlayer);
  }

  renderPlayers();
  resetForm();
});

cancelEditBtn.addEventListener("click", resetForm);
generateTeamsBtn.addEventListener("click", generateTeams);

clearPlayersBtn.addEventListener("click", async function () {
  if (!isAdmin()) {
    alert("Bu işlem için admin yetkisi gerekir.");
    return;
  }

  const ok = confirm("Tüm oyuncuları silmek istediğine emin misin?");
  if (!ok) return;

  await deleteAllPlayersFromFirestore();
  players = [];
  renderPlayers();
  clearResults();
  resetForm();
});

window.editPlayer = editPlayer;
window.deletePlayer = deletePlayer;
window.togglePlayerActive = togglePlayerActive;
window.togglePlayingToday = togglePlayingToday;
window.toggleBench = toggleBench;
window.saveUserRole = saveUserRole;

async function bootLoggedInUser(firebaseUser) {
  currentAuthUser = firebaseUser;
  currentUserDoc = await getCurrentUserDoc(firebaseUser.uid);

  if (!currentUserDoc) {
    await signOut(auth);
    return;
  }

  await loadUsers();
  await loadPlayers();
  await normalizeOldPlayers();

  authScreen.style.display = "none";
  appRoot.style.display = "block";

  updateVisibilityByRole();
  renderUsers();
  renderPlayers();
  clearResults();
}

function bootLoggedOutUser() {
  currentAuthUser = null;
  currentUserDoc = null;
  authScreen.style.display = "block";
  appRoot.style.display = "none";
  openLogin();
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await bootLoggedInUser(user);
  } else {
    bootLoggedOutUser();
  }
});
