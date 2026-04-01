import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SAV AI actif");
});

app.post("/generate", (req, res) => {
  const { message } = req.body;

  res.json({
    difficulty: "moyen",
    confidence: "moyenne",
    human_validation: "non",
    reply: "Bonjour chère cliente, nous vous remercions pour votre message. Afin de pouvoir vous apporter une réponse adaptée, pourriez-vous nous transmettre plus de précisions concernant votre demande ?"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Serveur lancé");
});
