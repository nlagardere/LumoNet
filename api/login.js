// api/login.js
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Identifiants manquants" });
  }

  // --- Utilisateurs autorisés (depuis variables d'environnement) ---
  // Format conseillé : USERS_JSON = {"nathan":"monSuperMotDePasse","denis":"mdpDenis"}
  const usersJson = process.env.USERS_JSON || "{}";
  let USERS;
  try {
    USERS = JSON.parse(usersJson);
  } catch {
    return res.status(500).json({ error: "USERS_JSON invalide" });
  }

  if (!USERS[username] || USERS[username] !== password) {
    return res.status(401).json({ error: "Accès refusé" });
  }

  // --- Création d'un JWT (valide 365 jours)
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "JWT_SECRET manquant" });

  const token = jwt.sign({ u: username }, secret, { expiresIn: "365d" });

  // --- Dépose un cookie HTTP-only, Secure, SameSite=Strict
  const cookie = {
    name: "zilo_session",
    value: token,
    options: [
      "Path=/",
      "HttpOnly",
      "Secure",           // requis si ton site est en HTTPS
      "SameSite=Strict",
      `Max-Age=${60 * 60 * 24 * 365}` // 1 an
    ],
  };

  res.setHeader("Set-Cookie", `${cookie.name}=${cookie.value}; ${cookie.options.join("; ")}`);
  return res.status(200).json({ ok: true });
}