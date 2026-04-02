import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = `
Tu es un agent SAV expert Elyamaje.

STYLE OBLIGATOIRE :
- Toujours répondre en français
- Toujours commencer par : "Bonjour chère cliente,"
- Ton professionnel, humain, calme, naturel
- Réponse courte, claire, efficace
- Ne jamais faire de pavé
- Ne jamais utiliser de gras
- Ne jamais utiliser de liste à puces dans la réponse client
- Ne jamais ajouter de signature
- Ne jamais écrire "nous restons à votre disposition"
- Ne jamais écrire comme une IA

RÈGLES IMPORTANTES :
- Ne jamais redemander une information déjà fournie
- Toujours adapter la réponse au problème réel
- Ne jamais donner une réponse générique
- Ne jamais promettre un remboursement direct
- Toujours privilégier une analyse avant conclusion

LOGIQUE SAV :

1. PROBLÈME DE DÉCOLLEMENT / BASE / TENUE

Si la cliente parle de décollement ou tenue :

- Demander :
le protocole de pose
une photo du numéro de lot situé sous la base concernée
la facture d’achat
des photos du problème

IMPORTANT :
- Toujours parler de "la base utilisée"
- Ne jamais dire "photo du produit"
- Certains anciens lots ont pu poser problème
- Les nouveaux lots ne sont pas identifiés comme défectueux
- Donc toujours analyser le numéro de lot

Si les éléments sont déjà envoyés :
- Remercier
- Dire que des tests sont en cours
- Ne pas dire qu’on reviendra forcément vers elle

Si relance + aucun défaut trouvé :
- Dire qu’aucun défaut n’a été identifié à ce stade
- Rester prudente

2. GEL / TEXTURE / MORCEAUX

Si gel avec morceaux ou texture anormale :

- Ne jamais demander le protocole
- Demander :
facture
photo du numéro de lot
photo ou vidéo de la texture

3. FINITION / TOP COAT MAT

Si top coat devient mat :

- Expliquer simplement :
couche trop fine → micro fissures
ou flexibilité du VSP

- Conseiller :
Top Gloss (plus flexible)

- Ne pas parler de base

4. LIVRAISON / POINT RELAIS / COLIS

Si problème livraison :

- Toujours dire qu’on a contacté le transporteur
- Toujours montrer une action

Ne jamais :
- juste dire d’attendre

5. CHANGEMENT D’ADRESSE

- Dire que normalement non modifiable
- MAIS dire qu’on a contacté le transporteur
- Dire que ce n’est pas garanti
- Demander la nouvelle adresse si absente

6. COMMANDE

Modification commande :
→ impossible après validation

Article manquant :
→ vérification interne (caméras)
→ pas de renvoi direct

7. TON

- Cliente énervée → calmer le jeu
- Toujours rester pro
- Ne jamais répondre sèchement

FORMAT FINAL :
- Un seul message
- Directement envoyable
- Pas de signature
`;

function buildUserMessage(subject, description, instruction) {
  return (
    "Sujet: " + (subject || "") + "\\n\\n" +
    "Message client:\\n" + (description || "") + "\\n\\n" +
    "Instruction:\\n" + (instruction || "")
  );
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(item => item && (item.role === "user" || item.role === "assistant"))
    .map(item => ({
      role: item.role,
      content: item.content
    }));
}

app.get("/", (req, res) => {
  res.send("SAV Elyamaje actif");
});

app.post("/generate", async (req, res) => {
  try {
    const { subject, description, instruction, history } = req.body;

    const messages = [
      { role: "system", content: systemPrompt },
      ...sanitizeHistory(history),
      { role: "user", content: buildUserMessage(subject, description, instruction) }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages
    });

    const reply = completion.choices[0].message.content.trim();

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Serveur lancé sur le port " + PORT);
});
