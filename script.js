<script>
// Clé API YouTube Data v3
const apiKey = "AIzaSyBnzXAf6DH95X4rz5TuQKVDXx5oFK0enws";

// Fonction de recherche YouTube
async function searchYouTube() {
  const query = document.getElementById("searchInput").value;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodeURIComponent(query)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      let resultsHTML = "";
      data.items.forEach(item => {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const thumbnail = item.snippet.thumbnails.medium.url;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        resultsHTML += `
          <div class="video-card">
            <h3>${title}</h3>
            <img src="${thumbnail}" alt="${title}">
            <iframe id="player-${videoId}"
              src="https://www.youtube.com/embed/${videoId}"
              frameborder="0" allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin">
            </iframe>
            <a href="${videoUrl}" target="_blank" class="youtube-link">▶ Voir sur YouTube</a>
            <button onclick="playOnSTV('${videoId}')" class="stv-link">🎬 Lire sur STV</button>
          </div>
        `;
      });
      document.getElementById("result").innerHTML = resultsHTML;
    } else {
      document.getElementById("result").innerHTML = "⚠️ Aucun résultat trouvé.";
    }
  } catch (error) {
    console.error("Erreur API YouTube:", error);
    document.getElementById("result").innerHTML = "<p>Impossible de charger les vidéos YouTube.</p>";
  }
}

// Fonction pour lire en plein écran dans STV
function playOnSTV(videoId) {
  const iframe = document.getElementById(`player-${videoId}`);
  if (iframe.requestFullscreen) {
    iframe.requestFullscreen();
  } else if (iframe.webkitRequestFullscreen) { // Safari
    iframe.webkitRequestFullscreen();
  } else if (iframe.msRequestFullscreen) { // IE/Edge
    iframe.msRequestFullscreen();
  }
}

// Lance une recherche automatique dès l’ouverture de la page
window.onload = () => {
  document.getElementById("searchInput").value = naruto"; // recherche par défaut
  searchYouTube();
};
</script>
