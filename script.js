// ===============================
// Clés API — remplace par les tiennes
// ===============================
const YT_API_KEY = "AIzaSyBabOz5P3LcCQkx-GSVRBEa9GCJ0GaFSFs"; // Clé YouTube
const AUDD_API_KEY = "fd51053ca520d0dee25cd7b4327ebd90";       // Clé AudD

// ===============================
// Lecture unique : un seul son/vidéo à la fois
// ===============================
let ytApiReady = false;
const pendingPlayers = [];
const activePlayers = [];

function onYouTubeIframeAPIReady() {
  ytApiReady = true;
  pendingPlayers.splice(0).forEach(createPlayer);
}

function createPlayer(iframeEl) {
  if (!iframeEl) return;
  if (!ytApiReady || !window.YT || !YT.Player) {
    pendingPlayers.push(iframeEl);
    return;
  }
  const player = new YT.Player(iframeEl, {
    events: { onStateChange: onPlayerStateChange },
  });
  activePlayers.push(player);
}

function onPlayerStateChange(event) {
  if (event.data !== YT.PlayerState.PLAYING) return;
  activePlayers.forEach((player) => {
    if (player === event.target) return;
    try {
      if (typeof player.pauseVideo === "function") player.pauseVideo();
    } catch (e) {}
  });
}

function forgetPlayer(iframeEl) {
  if (!iframeEl) return;
  const index = activePlayers.findIndex((p) => {
    try {
      return p.getIframe && p.getIframe() === iframeEl;
    } catch (e) {
      return false;
    }
  });
  if (index !== -1) activePlayers.splice(index, 1);
}

// ===============================
// Mode (recherche vidéo / reconnaissance audio)
// ===============================
function switchMode(mode) {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
  document.getElementById("videoPanel").classList.toggle("hidden", mode !== "video");
  document.getElementById("audioPanel").classList.toggle("hidden", mode !== "audio");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchMode(btn.dataset.mode));
  });
});

// ===============================
// Recherche YouTube
// ===============================
async function searchYouTube(queryOverride) {
  const searchInput = document.getElementById("searchInput");
  const query = (queryOverride ?? searchInput.value).trim();
  const resultDiv = document.getElementById("result");
  const toolbar = document.getElementById("resultsToolbar");
  const title = document.getElementById("resultsTitle");

  if (queryOverride) searchInput.value = queryOverride;

  if (!query) {
    resultDiv.innerHTML = `<p class="msg msg-error">Veuillez saisir une recherche.</p>`;
    toolbar.classList.add("hidden");
    return;
  }

  resultDiv.innerHTML = `<div class="loader-wrap"><div class="loader"></div></div>`;
  toolbar.classList.add("hidden");

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=6&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error("Erreur API : " + response.status);

    const data = await response.json();
    resultDiv.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      resultDiv.innerHTML = `<p class="msg msg-warning">Aucune vidéo trouvée.</p>`;
      return;
    }

    title.textContent = `Résultats pour « ${query} »`;
    toolbar.classList.remove("hidden");

    data.items.forEach((item, index) => {
      resultDiv.appendChild(buildVideoCard(item, index));
    });
  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = `<p class="msg msg-error">${error.message}</p>`;
  }
}

function buildVideoCard(item, index) {
  const videoId = item.id.videoId;
  const titleText = item.snippet.title;
  const thumbnail = item.snippet.thumbnails.medium.url;
  const iframeId = `yt-frame-${videoId}-${index}`;

  const card = document.createElement("div");
  card.className = "video-card";

  card.innerHTML = `
    <img src="${thumbnail}" alt="${titleText}">
    <h3>${titleText}</h3>
    ${
      videoId
        ? `<iframe id="${iframeId}"
             src="https://www.youtube.com/embed/${videoId}?enablejsapi=1"
             title="${titleText}"
             frameborder="0"
             allowfullscreen></iframe>`
        : `<p class="msg msg-warning">Vidéo non intégrable.</p>`
    }
    <div class="card-actions">
      ${
        videoId
          ? `<button class="stv-link" onclick="playOnSTV('${videoId}')">🎬 Lire sur STV</button>`
          : ""
      }
      <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="youtube-link">▶ YouTube</a>
    </div>
  `;

  if (videoId) {
    const iframeEl = card.querySelector(`#${iframeId}`);
    createPlayer(iframeEl);
  }

  return card;
}

// ===============================
// Lecture STV (plein écran)
// ===============================
function playOnSTV(videoId) {
  const ancienne = document.getElementById("stv-player");
  if (ancienne) {
    forgetPlayer(ancienne.querySelector("iframe"));
    ancienne.remove();
  }

  // Coupe toutes les vidéos de la grille avant d'ouvrir le lecteur plein écran
  activePlayers.forEach((player) => {
    try {
      if (typeof player.pauseVideo === "function") player.pauseVideo();
    } catch (e) {}
  });

  const overlay = document.createElement("div");
  overlay.id = "stv-player";
  overlay.className = "stv-overlay";

  overlay.innerHTML = `
    <button class="close-btn" aria-label="Fermer le lecteur" onclick="closeSTVPlayer()">✖</button>
    <iframe id="stv-iframe"
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1"
      allow="autoplay; encrypted-media"
      allowfullscreen></iframe>
  `;

  document.body.appendChild(overlay);
  createPlayer(document.getElementById("stv-iframe"));
}

function closeSTVPlayer() {
  const overlay = document.getElementById("stv-player");
  if (!overlay) return;
  forgetPlayer(overlay.querySelector("iframe"));
  overlay.remove();
}

// ===============================
// Reconnaissance audio (façon Shazam)
// ===============================
let mediaRecorder = null;
let audioChunks = [];
let isListening = false;
const LISTEN_DURATION_MS = 8000;

async function toggleListening() {
  if (isListening) {
    stopListening();
  } else {
    await startListening();
  }
}

async function startListening() {
  const recognizedBox = document.getElementById("recognizedTrack");
  recognizedBox.innerHTML = "";
  recognizedBox.classList.add("hidden");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];

    const mimeType = MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";
    mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

    mediaRecorder.addEventListener("dataavailable", (e) => {
      if (e.data && e.data.size > 0) audioChunks.push(e.data);
    });
    mediaRecorder.addEventListener("stop", () => {
      stream.getTracks().forEach((t) => t.stop());
      handleRecordingStop();
    });

    mediaRecorder.start();
    isListening = true;
    setListeningUI("listening");

    setTimeout(() => {
      if (isListening) stopListening();
    }, LISTEN_DURATION_MS);

  } catch (error) {
    console.error(error);
    setListeningUI("error");
  }
}

function stopListening() {
  if (!mediaRecorder || mediaRecorder.state === "inactive") return;
  isListening = false;
  setListeningUI("processing");
  mediaRecorder.stop();
}

async function handleRecordingStop() {
  try {
    if (!audioChunks.length) {
      setListeningUI("error", "Aucun son capté. Réessaie.");
      return;
    }

    const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });

    const formData = new FormData();
    formData.append("file", audioBlob, "sample.webm");
    formData.append("api_token", AUDD_API_KEY);
    formData.append("return", "apple_music,spotify");

    const response = await fetch("https://api.audd.io/", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Erreur AudD : " + response.status);

    const data = await response.json();

    if (data.status !== "success" || !data.result) {
      setListeningUI("idle");
      showNoMatch();
      return;
    }

    setListeningUI("idle");
    showRecognizedTrack(data.result);

  } catch (error) {
    console.error(error);
    setListeningUI("error", "Erreur pendant l'identification.");
  }
}

function showNoMatch() {
  const box = document.getElementById("recognizedTrack");
  box.innerHTML = `<p class="msg msg-warning">Aucune correspondance trouvée. Rapproche-toi du son et réessaie.</p>`;
  box.classList.remove("hidden");
}

function showRecognizedTrack(result) {
  const box = document.getElementById("recognizedTrack");
  const artwork =
    result.spotify?.album?.images?.[0]?.url ||
    result.apple_music?.artwork?.url?.replace("{w}", "200").replace("{h}", "200") ||
    "";
  const titre = result.title || "Titre inconnu";
  const artiste = result.artist || "Artiste inconnu";
  const requete = `${artiste} ${titre}`;

  box.innerHTML = `
    <div class="recognized-card">
      ${artwork ? `<img src="${artwork}" alt="${titre}">` : ""}
      <div class="recognized-info">
        <span class="eyebrow">Son identifié</span>
        <h3>${titre}</h3>
        <p>${artiste}</p>
        <button type="button" onclick="searchFromRecognition('${requete.replace(/'/g, "\\'")}')">
          🔎 Chercher sur YouTube
        </button>
      </div>
    </div>
  `;
  box.classList.remove("hidden");
}

function searchFromRecognition(query) {
  switchMode("video");
  searchYouTube(query);
  document.getElementById("videoPanel").scrollIntoView({ behavior: "smooth", block: "center" });
}

function setListeningUI(state, message) {
  const btn = document.getElementById("listenBtn");
  const label = document.getElementById("listenLabel");
  const viz = document.getElementById("listeningViz");
  const text = document.getElementById("listeningText");

  btn.classList.toggle("active", state === "listening");

  if (state === "listening") {
    label.textContent = "Écoute en cours…";
    viz.classList.remove("hidden");
    text.textContent = "Écoute en cours…";
  } else if (state === "processing") {
    label.textContent = "Analyse en cours…";
    viz.classList.remove("hidden");
    text.textContent = "Identification du morceau…";
  } else if (state === "error") {
    label.textContent = "Identifier ce son";
    viz.classList.add("hidden");
    const box = document.getElementById("recognizedTrack");
    box.innerHTML = `<p class="msg msg-error">${message || "Impossible d'accéder au micro."}</p>`;
    box.classList.remove("hidden");
  } else {
    label.textContent = "Identifier ce son";
    viz.classList.add("hidden");
  }
}

// ===============================
// Télécharger les résultats
// ===============================
function telechargerVideos() {
  const resultDiv = document.getElementById("result");

  if (!resultDiv) {
    alert("Aucun résultat trouvé.");
    return;
  }

  const cards = resultDiv.querySelectorAll(".video-card");

  if (cards.length === 0) {
    alert("Aucune vidéo à télécharger.");
    return;
  }

  let contenu = "Résultats de recherche STV\n";
  contenu += "============================\n\n";

  cards.forEach((card, index) => {
    const titre = card.querySelector("h3")?.textContent || "Sans titre";
    const lien = card.querySelector(".youtube-link")?.href || "";

    contenu += `${index + 1}. ${titre}\n`;
    contenu += `${lien}\n\n`;
  });

  const blob = new Blob([contenu], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "resultats_stv.txt";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}