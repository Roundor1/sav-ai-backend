import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SAV AI actif");
});

app.post("/generate", async (req, res) => {
  const { subject, description, instruction } = req.body;

  const prompt = `
Tu es une assistante SAV Elyamaje.

Tu dois répondre uniquement en JSON valide, sans aucun texte avant ou après.

Format obligatoire :
{
  "difficulty": "facile|moyen|difficile|sensible",
  "confidence": "haute|moyenne|faible",
  "human_validation": "oui|non",
  "reply": "..."
}

Règles :
- La réponse "reply" doit toujours commencer par "Bonjour chère cliente,"
- Ton professionnel SAV
- Réponse courte, claire et exploitable
- Ne jamais inventer une politique commerciale ou logistique
- Si des informations manquent, demander seulement les éléments nécessaires
- Si le cas est ambigu, risqué ou sensible, mettre "human_validation": "oui"
- Ne mets aucun texte hors du JSON

Sujet :
${subject || ""}

Message cliente :
${description || ""}

Instruction complémentaire :
${instruction || ""}
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
    const content = data?.choices?.[0]?.message?.content?.trim() || "";

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        difficulty: "moyen",
        confidence: "moyenne",
        human_validation: "non",
        reply: content || "Bonjour chère cliente, nous vous remercions pour votre message. Afin de pouvoir vous apporter une réponse adaptée, pourriez-vous nous transmettre plus de précisions concernant votre demande ?"
      };
    }

    res.json(parsed);
  } catch (error) {
    res.status(500).json({
      difficulty: "sensible",
      confidence: "faible",
      human_validation: "oui",
      reply: "Bonjour chère cliente, nous rencontrons actuellement une difficulté technique. Nous vous invitons à réessayer dans quelques instants."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
