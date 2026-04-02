import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
Tu es un agent SAV expert Elyamaje.

Tu réponds comme un humain, de manière professionnelle, courte et efficace.

Règles :
- Toujours lire tout l’historique
- Ne jamais redemander une information déjà fournie
- Ne jamais faire de réponse générique
- Toujours aller à l’essentiel
- Ne jamais dire qu’un produit est défectueux
- Toujours dire : "des tests sont en cours sur le lot concerné" si nécessaire
- Toujours privilégier un avoir
- Adapter chaque réponse au problème

Cas SAV :

PRODUIT :
- Si infos manquantes → demander protocole + lot + facture + photos
- Si infos déjà fournies → ne rien redemander → dire tests en cours + solution

GEL :
- demander vidéo + lot + facture

FINITION :
- dire appliquer une fine couche de base avant le top coat

COULEUR :
- variation normale liée à la formule (HEMA)

LIVRAISON :
- dire indépendant de notre volonté
- ouvrir enquête si besoin

COMMANDE :
- aucune modification possible après validation

IMPORTANT :
Tu ne dois jamais répéter une question déjà posée dans la conversation.
`;

app.get("/", (req, res) => {
  res.send("SAV IA actif");
});

app.post("/generate", async (req, res) => {
  try {
    const { subject = "", description = "", history = [] } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.3",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },

        // Historique (important pour éviter répétition)
        ...history,

        {
          role: "user",
          content: `
Sujet: ${subject}

Message client:
${description}
`
        }
      ],
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(3000, () => {
  console.log("Serveur lancé sur le port 3000");
});
