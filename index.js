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
  const { subject = "", description = "", instruction = "" } = req.body || {};

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
- ton professionnel, calme, SAV
- réponse courte, claire, naturelle
- ne jamais mettre de texte en gras
- ne jamais inventer une politique commerciale ou logistique
- ne jamais trop expliquer
- demander uniquement les éléments strictement nécessaires
- style Elyamaje : simple, direct, professionnel
- éviter les tournures trop robotiques
- privilégier des formulations comme :
  "Afin que nous puissions..."
  "Nous vous remercions de bien vouloir..."
  "Nous sommes sincèrement navrés..."
- si le cas est ambigu, conflictuel, juridique, commercialement sensible ou sort des procédures prévues, mettre "human_validation": "oui"

Cas SAV à reconnaître :

1. Décollement Base / Base Solid / base qui se décolle / base qui ne tient pas
Réponse attendue :
- demander le protocole de pose
- demander une photo du numéro de lot visible sous le produit
- demander la facture d'achat
- demander des photos du problème
Style attendu :
"Bonjour chère cliente, afin que nous puissions analyser la situation, nous vous remercions de bien vouloir nous transmettre votre protocole de pose, une photo du numéro de lot visible sous le produit, votre facture d'achat ainsi que des photos du problème rencontré."

2. Colis non reçu / livraison bloquée / colis perdu / aucun suivi
Réponse attendue :
- indiquer qu'une réclamation ou enquête transporteur doit être ouverte ou a été ouverte
- ton rassurant
- ne pas demander des éléments inutiles
Style attendu :
"Bonjour chère cliente, nous sommes sincèrement navrés pour ce désagrément. Nous vous informons qu'une réclamation a été ouverte auprès du transporteur afin de débloquer la situation dans les plus brefs délais."

3. Article manquant
Réponse attendue :
- demander confirmation du produit manquant
- demander une photo des produits reçus si nécessaire
- rester prudent
- ne pas promettre immédiatement un renvoi ou remboursement

4. Produit défectueux / produit abîmé / casse / produit reçu endommagé
Réponse attendue :
- demander une photo ou vidéo du problème
- demander la facture
- demander si besoin le numéro de lot
Style attendu :
"Bonjour chère cliente, nous sommes sincèrement navrés pour la gêne occasionnée. Afin que nous puissions traiter votre demande, nous vous remercions de bien vouloir nous transmettre une photo ou vidéo du problème rencontré ainsi que votre facture d'achat."

5. Problème de couleur / teinte différente / ancienne et nouvelle formule / HEMA
Réponse attendue :
- expliquer qu'une évolution de formule peut entraîner une légère variation de teinte
- rester concise
- ne pas promettre un rendu identique si ce n'est pas certain

6. Transporteur Chronopost / Colissimo
Réponse attendue :
- si problème de livraison : dire qu'une réclamation ou enquête transporteur est en cours ou doit être ouverte
- ne pas inventer un résultat d'enquête

7. Avoir / remboursement / geste commercial
Réponse attendue :
- si le message ne permet pas de décider clairement : human_validation = "oui"
- ne jamais promettre un avoir ou remboursement sans base claire

8. DOM-TOM / produit non livrable
Réponse attendue :
- expliquer simplement que certains produits ne peuvent pas être livrés
- rester prudent si la liste exacte n'est pas donnée

9. Ponceuse / garantie / panne
Réponse attendue :
- si trop technique ou lié à garantie expirée : human_validation = "oui"
- demander la facture et les éléments utiles si nécessaire

10. Cas non reconnu
Réponse attendue :
- demander poliment les précisions minimales utiles
Style attendu :
"Bonjour chère cliente, nous vous remercions pour votre message. Afin de pouvoir vous apporter une réponse adaptée, pourriez-vous nous transmettre plus de précisions concernant votre demande ?"

Sujet :
${subject}

Message cliente :
${description}

Instruction complémentaire :
${instruction}
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

    const content = response?.data?.choices?.[0]?.message?.content?.trim() || "";

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
    console.log("Erreur OpenAI:", error?.response?.data || error?.message);

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
