// ✅ Import des modules
const express = require("express");
const { OpenAI } = require("openai");
const fetch = require("node-fetch"); // utile si tu veux appeler Replicate

const app = express();
app.use(express.json());

// ✅ Configure OpenAI avec ta clé API
const client = new OpenAI({
  apiKey: "TA_CLE_API_OPENAI" // remplace par ta clé OpenAI
});

// ✅ Page d'accueil
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Bienvenue sur Stevy IA</title>
    </head>
    <body>
      <h1>🤖 Stevy IA</h1>
      <p>Bienvenue sur ton intelligence artificielle personnelle</p>
      <p>Utilise le frontend (http://127.0.0.1:53627) pour poser tes questions.</p>
    </body>
    </html>
  `);
});

// ✅ Route POST "/ask" connectée à ChatGPT
app.post("/ask", async (req, res) => {
  const question = req.body.question;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // modèle ChatGPT
      messages: [{ role: "user", content: question }]
    });

    const answer = completion.choices[0].message.content;
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ answer: "Erreur lors de la connexion à ChatGPT." });
  }
});

// ✅ Route POST "/create-image" (choix : DALL·E ou Replicate)

// --- Option 1 : DALL·E (OpenAI)
app.post("/create-image", async (req, res) => {
  const { prompt } = req.body;

  try {
    const result = await client.images.generate({
      model: "gpt-image-1", // modèle DALL·E
      prompt: prompt,
      size: "512x512"
    });

    const imageUrl = result.data[0].url;
    res.json({ image: imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ image: null, error: "Erreur lors de la génération d'image." });
  }
});

/*
// --- Option 2 : Stable Diffusion via Replicate
app.post("/create-image", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": "Token TA_CLE_API_REPLICATE",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "runwayml/stable-diffusion-v1-5",
        input: { prompt }
      })
    });

    const data = await response.json();
    res.json({ image: data.output[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ image: null, error: "Erreur lors de la génération d'image." });
  }
});
*/

// ✅ Lancement du serveur
app.listen(3000, () => {
  console.log("Serveur Stevy IA connecté sur http://localhost:3000");
});
