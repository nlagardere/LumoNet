import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

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

  const { recipient, message } = req.body || {};
  if (!recipient || !message) {
    return res.status(400).json({ error: "recipient et message requis" });
  }

  // --- Tokens Bark (backend uniquement) ---
  const BARK = {
    denis: process.env.BARK_TOKEN_DENIS,
    nathan: process.env.BARK_TOKEN_NATHAN,
    // ajoute d'autres si besoin…
  };

  console.log("Recipient reçu :", recipient);
  console.log("BARK disponibles :", BARK);

  const barkToken = BARK[recipient];
  if (!barkToken) return res.status(400).json({ error: `Destinataire inconnu ou token manquant pour '${recipient}'` });

  const ICON_URL = process.env.ICON_URL || "";
  const title = encodeURIComponent(payload.u);
  const bodyEncoded = encodeURIComponent(message);
  const iconParam = ICON_URL ? `&icon=${encodeURIComponent(ICON_URL)}` : "";
  const url = `https://api.day.app/${barkToken}/${title}/${bodyEncoded}?isArchive=1${iconParam}`;

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("Bark a renvoyé une erreur");
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Erreur Bark :", e);
    return res.status(502).json({ error: "Erreur d'envoi Bark" });
  }
}
