async function askAI() {
  const question = document.getElementById("question").value;
  const response = await fetch("http://localhost:3000/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
  const data = await response.json();
  document.getElementById("answer").innerText = data.answer;
}
async function createImage() {
  const prompt = document.getElementById("imagePrompt").value;
  const response = await fetch("http://localhost:3000/create-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  const data = await response.json();
  document.getElementById("imageResult").innerHTML =
    `<img src="${data.image}" alt="Image générée">`;
}
