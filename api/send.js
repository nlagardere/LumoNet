import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  console.log("API /api/send appelée ! Méthode :", req.method);
// TEMPORAIRE pour test uniquement
let payload = { u: "testuser" };
// Supprime la vérification JWT et cookie

  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // --- Body JSON parsing sûr ---
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: "Body JSON invalide" });
    }
  }

  const { recipient, message } = body || {};
  console.log("Body reçu :", body);

  if (!recipient || !message) {
    return res.status(400).json({ error: "recipient et message requis" });
  }

  // --- Vérification JWT ---
  const cookieHeader = req.headers.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").filter(Boolean).map(c => c.split("=").map(decodeURIComponent))
  );
  const session = cookies["zilo_session"];
  if (!session) return res.status(401).json({ error: "Non connecté" });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "JWT_SECRET manquant" });

  let payload;
  try {
    payload = jwt.verify(session, secret);
  } catch (e) {
    return res.status(401).json({ error: "Session invalide" });
  }

  // --- Tokens Bark ---
  const BARK = {
    denis: process.env.BARK_TOKEN_DENIS,
    nathan: process.env.BARK_TOKEN_NATHAN,
  };
  console.log("BARK tokens disponibles :", BARK);
  console.log("Clé recherchée :", recipient, "=>", BARK[recipient]);

  const barkToken = BARK[recipient];
  if (!barkToken) return res.status(400).json({ error: `Destinataire inconnu ou token manquant pour '${recipient}'` });

  // --- Préparer et envoyer la notification ---
  const ICON_URL = process.env.ICON_URL || "";
  const title = encodeURIComponent(payload.u);
  const bodyEncoded = encodeURIComponent(message);
  const iconParam = ICON_URL ? `&icon=${encodeURIComponent(ICON_URL)}` : "";
  const url = `https://api.day.app/${barkToken}/${title}/${bodyEncoded}?isArchive=1${iconParam}`;

  console.log("URL Bark :", url);

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("Bark a renvoyé une erreur");
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Erreur Bark :", e);
    return res.status(502).json({ error: "Erreur d'envoi Bark" });
  }
}
