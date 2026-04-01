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

Tu dois répondre uniquement en JSON valide, sans texte avant ou après.

Format obligatoire :
{
  "difficulty": "facile|moyen|difficile|sensible",
  "confidence": "haute|moyenne|faible",
  "human_validation": "oui|non",
  "reply": "..."
}

Règles générales :
- "reply" doit toujours commencer par "Bonjour chère cliente,"
- ton professionnel SAV Elyamaje
- réponse courte, claire, exploitable
- ne jamais mettre de texte en gras
- ne jamais inventer une politique commerciale ou logistique
- si des informations manquent, demander seulement les éléments nécessaires
- si le cas est ambigu, conflictuel ou sensible, mettre "human_validation": "oui"

Cas SAV à reconnaître :

1. Décollement base / base qui ne tient pas / base qui se décolle
Réponse attendue :
- demander le protocole de pose
- demander une photo du numéro de lot visible sous le produit
- demander la facture d'achat
- demander des photos du problème

2. Colis non reçu / livraison bloquée / colis perdu / aucun suivi
Réponse attendue :
- indiquer qu'une réclamation ou enquête transporteur doit être ouverte
- ton rassurant
- ne pas demander des éléments inutiles

3. Produit défectueux / article abîmé / casse / problème produit
Réponse attendue :
- demander une photo ou vidéo du problème
- demander la facture
- demander si besoin le numéro de lot

4. Problème de couleur / teinte différente / ancienne et nouvelle formule
Réponse attendue :
- expliquer qu'une évolution de formule peut entraîner une légère variation de teinte
- rester concise
- ne pas promettre un rendu identique si ce n'est pas certain

5. Cas non reconnu
Réponse attendue :
- demander poliment les précisions minimales utiles

Sujet :
${subject || ""}

Message cliente :
${description || ""}

Instruction complémentaire :
${instruction || ""}
`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
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
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data?.choices?.[0]?.message?.content?.trim() || "";

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        difficulty: "moyen",
        confidence: "moyenne",
        human_validation: "non",
        reply:
          content ||
          "Bonjour chère cliente, nous vous remercions pour votre message. Afin de pouvoir vous apporter une réponse adaptée, pourriez-vous nous transmettre plus de précisions concernant votre demande ?"
      };
    }

    return res.json(parsed);
  } catch (error) {
    console.log("Erreur OpenAI:", error.response?.data || error.message);

    return res.status(500).json({
      difficulty: "sensible",
      confidence: "faible",
      human_validation: "oui",
      reply:
        "Bonjour chère cliente, nous rencontrons actuellement une difficulté technique. Nous vous invitons à réessayer dans quelques instants."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
