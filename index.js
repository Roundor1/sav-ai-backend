import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SAV AI actif");
});

app.post("/generate", async (req, res) => {
  const { description } = req.body;

  const prompt = `
Tu es une assistante SAV Elyamaje.

Tu dois répondre EXACTEMENT en JSON valide, sans texte autour.

Format OBLIGATOIRE :
{
  "difficulty": "...",
  "confidence": "...",
  "human_validation": "...",
  "reply": "..."
}

Règles :
- Commence toujours par "Bonjour chère cliente,"
- Ton professionnel SAV
- Réponse courte et claire
- Si info manquante → demande simplement
- Ne mets AUCUN texte en dehors du JSON

Message cliente :
${description}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Tu es une assistante interne experte en rédaction SAV."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        difficulty: "moyen",
        confidence: "moyenne",
        human_validation: "non",
        reply: content
      };
    }

    res.json(parsed);
  } catch (error) {
    res.status(500).json({
      difficulty: "sensible",
      confidence: "faible",
      human_validation: "oui",
      reply: "Erreur technique lors de la génération."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
