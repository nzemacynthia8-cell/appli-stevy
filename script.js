const apiKey = "AIzaSyCcgi5D1FLniPRDYAYPWztdQ7x2AE6_edI";

async function searchYouTube() {
  const query = document.getElementById("searchInput").value;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${query}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";

  data.items.forEach(item => {
    const videoId = item.id.videoId;
    const title = item.snippet.title;
    const thumbnail = item.snippet.thumbnails.medium.url;

    resultDiv.innerHTML += `
      <div class="video-card">
        <img src="${thumbnail}" alt="${title}">
        <h3>${title}</h3>
        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
        <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="youtube-link">▶ Voir sur YouTube</a>
        <button class="stv-link" onclick="playOnSTV('${videoId}')">🎬 Lire sur STV</button>
      </div>
    `;
  });
}

function playOnSTV(videoId) {
  const player = document.createElement("iframe");
  player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  player.width = "100%";
  player.height = "400";
  player.allowFullscreen = true;
  document.body.appendChild(player);
  player.requestFullscreen();
}
