import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("SAV AI actif");
});

// ROUTE PRINCIPALE
app.post("/generate", async (req, res) => {
  const { subject, description } = req.body;

  return res.json({
    difficulty: "facile",
    confidence: "haute",
    human_validation: "non",
    reply: "Bonjour chère cliente, nous vous remercions pour votre message. Afin de pouvoir analyser la situation, pourriez-vous nous transmettre votre protocole de pose, une photo du numéro de lot situé sous le produit, votre facture ainsi que des photos du décollement constaté. Nous vous remercions pour votre compréhension."
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
