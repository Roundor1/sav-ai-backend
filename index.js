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
Tu es une assistante interne SAV.

Rôle :
- analyser le message client
- proposer une réponse professionnelle
- rester concise et claire
- ne jamais inventer une politique commerciale ou logistique
- si l'information manque, demander uniquement les éléments nécessaires
- si le cas est ambigu ou sensible, indiquer qu'une validation humaine est nécessaire
- classer la difficulté du ticket en : facile, moyen, difficile, sensible
- classer la confiance en : haute, moyenne, faible

Retourne uniquement un JSON valide avec ce format :
{
  "difficulty": "facile|moyen|difficile|sensible",
  "confidence": "haute|moyenne|faible",
  "human_validation": "oui|non",
  "reply": "réponse proposée"
}

Sujet :
${subject || ""}

Message cliente :
${description || ""}

Instruction complémentaire :
${instruction || "aucune"}
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
        confidence: "faible",
        human_validation: "oui",
        reply: content || "Aucune réponse générée."
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
