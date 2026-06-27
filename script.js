// Clé API YouTube
const apiKey = "AIzaSyCcgi5D1FLniPRDYAYPWztdQ7x2AE6_edI";

// Fonction de recherche YouTube
async function searchYouTube() {
  const query = document.getElementById("searchInput").value.trim();
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>🔎 Chargement des vidéos...</p>";

  try {
    // Requête API avec filtre videoEmbeddable=true
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&order=viewCount&maxResults=6&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Résultats YouTube:", data); // Debug console

    resultDiv.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      resultDiv.innerHTML = "<p style='color:orange;'>⚠ Aucune vidéo intégrable trouvée.</p>";
      return;
    }

    data.items.forEach(item => {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const thumbnail = item.snippet.thumbnails.medium.url;

      // Vérification si la vidéo est intégrable
      if (!videoId) {
        resultDiv.innerHTML += `
          <div class="video-card">
            <img src="${thumbnail}" alt="${title}">
            <h3>${title}</h3>
            <p style="color:orange;">⚠ Cette vidéo ne peut pas être lue ici. Cliquez sur "Voir sur YouTube".</p>
            <a href="https://www.youtube.com/watch?v=${item.id.videoId}" target="_blank" class="youtube-link">▶ Voir sur YouTube</a>
          </div>
        `;
      } else {
        resultDiv.innerHTML += `
          <div class="video-card">
            <img src="${thumbnail}" alt="${title}">
            <h3>${title}</h3>
            <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
            <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="youtube-link">▶ Voir sur YouTube</a>
            <button class="stv-link" onclick="playOnSTV('${videoId}')">🎬 Lire sur STV</button>
          </div>
        `;
      }
    });
  } catch (error) {
    console.error("Erreur lors de la recherche YouTube:", error);
    resultDiv.innerHTML = `<p style="color:red;">❌ Impossible de charger les vidéos (${error.message}).</p>`;
  }
}

// Fonction pour lecture plein écran STV
function playOnSTV(videoId) {
  const player = document.createElement("iframe");
  player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  player.width = "100%";
  player.height = "400";
  player.allowFullscreen = true;
  document.body.appendChild(player);
  player.requestFullscreen();
}
<p style="color:orange;">⚠ Cette vidéo est protégée, cliquez sur "Voir sur YouTube".</p>
window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
