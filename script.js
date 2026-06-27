// Ta clé API YouTube
const apiKey = "AIzaSyCcgi5D1FLniPRDYAYPWztdQ7x2AE6_edI";

// Fonction de recherche YouTube
async function searchYouTube() {
  console.log("✅ searchYouTube() appelée"); // Debug

  const query = document.getElementById("searchInput").value.trim();
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = `<div class="loader"></div>`; // Loader animé

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=6&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur API: ${response.status}`);

    const data = await response.json();
    console.log("Résultats YouTube:", data);

    resultDiv.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      resultDiv.innerHTML = "<p style='color:orange;'>⚠ Aucune vidéo trouvée.</p>";
      return;
    }

    // Affichage des vidéos avec fallback si non intégrables
    data.items.forEach(item => {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const thumbnail = item.snippet.thumbnails.medium.url;

      if (!videoId) {
        // Vidéo protégée (non intégrable)
        resultDiv.innerHTML += `
          <div class="video-card">
            <img src="${thumbnail}" alt="${title}">
            <h3>${title}</h3>
            <p style="color:orange;">⚠ Vidéo protégée, cliquez sur YouTube.</p>
            <a href="https://www.youtube.com/watch?v=${item.id.videoId}" target="_blank" class="youtube-link">▶ Voir sur YouTube</a>
          </div>
        `;
      } else {
        // Vidéo intégrable
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
    console.error("❌ Erreur recherche:", error);
    resultDiv.innerHTML = `<p style="color:red;">Erreur: ${error.message}</p>`;
  }
}

// Fonction pour lecture plein écran STV
function playOnSTV(videoId) {
  console.log("▶ Lecture STV:", videoId);
  const player = document.createElement("iframe");
  player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  player.width = "100%";
  player.height = "400";
  player.allowFullscreen = true;
  document.body.appendChild(player);
  player.requestFullscreen();
}
