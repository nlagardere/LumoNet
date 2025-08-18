// api/send.js
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // --- Récupération du cookie de session ---
  const cookieHeader = req.headers.cookie || "";
  const cookies = Object.fromEntries(cookieHeader.split("; ").filter(Boolean).map(c => c.split("=").map(decodeURIComponent)));
  const session = cookies["zilo_session"];
  if (!session) return res.status(401).json({ error: "Non connecté" });

  // --- Vérifier le JWT ---
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "JWT_SECRET manquant" });

  let payload;
  try {
    payload = jwt.verify(session, secret); // { u: "nathan", iat, exp }
  } catch (e) {
    return res.status(401).json({ error: "Session invalide" });
  }

  const { recipient, message } = req.body || {};
  if (!recipient || !message) {
    return res.status(400).json({ error: "recipient et message requis" });
  }

  // --- Icône optionnelle ---
  const ICON_URL = process.env.ICON_URL || ""; // optionnel

  // --- Tokens Bark (NE JAMAIS les mettre dans le front) ---
  const BARK = {
    denis: process.env.BARK_TOKEN_DENIS,
    nathan: process.env.BARK_TOKEN_NATHAN,
    // ajoute d'autres si besoin…
  };

  const barkToken = BARK[recipient];
  if (!barkToken) return res.status(400).json({ error: "Destinataire inconnu" });

  // L’expéditeur sera l’utilisateur connecté (payload.u)
  const title = encodeURIComponent(payload.u);
  const body = encodeURIComponent(message);
  const iconParam = ICON_URL ? `&icon=${encodeURIComponent(ICON_URL)}` : "";

  const url = `https://api.day.app/${barkToken}/${title}/${body}?isArchive=1${iconParam}`;

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("Bark a renvoyé une erreur");
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "Erreur d'envoi Bark" });
  }
}
