import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SAV AI actif");
});

app.post("/generate", async (req, res) => {
  const { subject, description, instruction } = req.body;

  const prompt = `
Tu es une assistante SAV Elyamaje experte.

Tu dois répondre uniquement en JSON valide.

Format :
{
  "difficulty": "facile|moyen|difficile|sensible",
  "confidence": "haute|moyenne|faible",
  "human_validation": "oui|non",
  "reply": "..."
}

Règles :
- Toujours commencer par "Bonjour chère cliente,"
- Ton professionnel SAV Elyamaje
- Réponse courte, claire
- Ne jamais inventer

Cas SAV :

Décollement :
→ demander protocole + lot + facture + photos

Colis non reçu :
→ dire qu'une enquête est ouverte

Produit défectueux :
→ demander preuve + facture + photo

Message cliente :
${description}
`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Assistant SAV"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data.choices[0].message.content;

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
    console.log(error.response?.data || error.message);

    res.status(500).json({
      difficulty: "sensible",
      confidence: "faible",
      human_validation: "oui",
      reply: "Erreur serveur."
    });
  }
});

app.listen(3000, () => console.log("Serveur lancé"));
