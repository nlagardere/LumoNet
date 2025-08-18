// pages/api/send.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  let { recipient, message } = req.body || {};

  if (!recipient || !message) {
    return res.status(400).json({ error: "recipient et message requis" });
  }

  // --- Tokens Bark (backend uniquement) ---
  const BARK = {
    denis: process.env.BARK_TOKEN_DENIS || "TOKEN_TEST_DENIS",
    nathan: process.env.BARK_TOKEN_NATHAN || "TOKEN_TEST_NATHAN",
  };

  recipient = recipient.toLowerCase();

  const barkToken = BARK[recipient];
  if (!barkToken) {
    return res.status(400).json({ error: `Destinataire inconnu ou token manquant pour '${recipient}'` });
  }

  const title = encodeURIComponent("TestUser"); // nom fixe pour test
  const bodyEncoded = encodeURIComponent(message);
  const ICON_URL = process.env.ICON_URL || "";
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
