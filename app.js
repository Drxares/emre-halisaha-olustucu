import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6xJCfrjk3RQ5vWAoDVBP5nhaDSLTw-F0",
  authDomain: "emre-tkmolustr.firebaseapp.com",
  databaseURL: "https://emre-tkmolustr-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "emre-tkmolustr",
  storageBucket: "emre-tkmolustr.firebasestorage.app",
  messagingSenderId: "465918251433",
  appId: "1:465918251433:web:41d61ae613b224353934b8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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
let currentTeams = {
  teamA: [],
  teamB: [],
  bench: []
};

async function savePlayers() {
  await set(ref(db, "players"), players);
}

async function loadPlayers() {
  const snapshot = await get(ref(db, "players"));
  if (snapshot.exists()) {
    players = snapshot.val() || [];
  } else {
    players = [];
  }
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

function normalizeOldPlayers() {
  players = players.map(p => ({
    active: p.active !== undefined ? p.active : true,
    playingToday: p.playingToday !== undefined ? p.playingToday : true,
    isBench: p.isBench !== undefined ? p.isBench : false,
    ...p
  }));
  savePlayers();
}

function getPositionBadgeClass(position) {
  if (position === "Kaleci") return "badge-kaleci";
  if (position === "Defans") return "badge-defans";
  if (position === "Orta Saha") return "badge-orta-saha";
  return "badge-forvet";
}

function renderPlayers() {
  const playerCountBadge = document.getElementById("playerCountBadge");
  const activeCountBadge = document.getElementById("activeCountBadge");

  const activeCount = players.filter(p => p.active && p.playingToday && !p.isBench).length;

  if (playerCountBadge) playerCountBadge.textContent = `${players.length} oyuncu`;
  if (activeCountBadge) activeCountBadge.textContent = `${activeCount} aktif`;

  if (players.length === 0) {
    playersList.innerHTML = `<p class="empty-text">Henüz oyuncu eklenmedi.</p>`;
    return;
  }

  playersList.innerHTML = players.map((player, index) => `
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
          <input type="checkbox" ${player.active ? "checked" : ""} onchange="togglePlayerActive(${index})" />
          <span>Aktif</span>
        </label>

        <label class="toggle-box">
          <input type="checkbox" ${player.playingToday ? "checked" : ""} onchange="togglePlayingToday(${index})" />
          <span>Bugün Var</span>
        </label>

        <label class="toggle-box">
          <input type="checkbox" ${player.isBench ? "checked" : ""} onchange="toggleBench(${index})" />
          <span>Yedek</span>
        </label>
      </div>

      <div class="player-actions">
        <button class="edit-btn" onclick="editPlayer(${index})">Düzenle</button>
        <button class="player-delete-btn" onclick="deletePlayer(${index})">Sil</button>
      </div>
    </div>
  `).join("");
}

function editPlayer(index) {
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

function deletePlayer(index) {
  players.splice(index, 1);
  savePlayers();
  renderPlayers();
  clearResults();
}

function togglePlayerActive(index) {
  players[index].active = !players[index].active;
  savePlayers();
  renderPlayers();
}

function togglePlayingToday(index) {
  players[index].playingToday = !players[index].playingToday;
  savePlayers();
  renderPlayers();
}

function toggleBench(index) {
  players[index].isBench = !players[index].isBench;
  savePlayers();
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
  return players.filter(p => p.active && p.playingToday && !p.isBench);
}

function getBenchPlayers() {
  return players.filter(p => p.active && p.playingToday && p.isBench);
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

playerForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const player = getFormValues();
  if (!validatePlayer(player)) {
    alert("Lütfen tüm alanları doğru doldur.");
    return;
  }

  const editIndex = Number(document.getElementById("editIndex").value);

  if (editIndex >= 0) {
    players[editIndex] = {
      ...players[editIndex],
      ...player
    };
  } else {
    players.push(player);
  }

  savePlayers();
  renderPlayers();
  resetForm();
});

cancelEditBtn.addEventListener("click", resetForm);

generateTeamsBtn.addEventListener("click", generateTeams);

clearPlayersBtn.addEventListener("click", function () {
  const ok = confirm("Tüm oyuncuları silmek istediğine emin misin?");
  if (!ok) return;

  players = [];
  savePlayers();
  renderPlayers();
  clearResults();
  resetForm();
});

window.editPlayer = editPlayer;
window.deletePlayer = deletePlayer;
window.togglePlayerActive = togglePlayerActive;
window.togglePlayingToday = togglePlayingToday;
window.toggleBench = toggleBench;

async function initApp() {
  await loadPlayers();
  normalizeOldPlayers();
  renderPlayers();
  clearResults();
}

initApp();
