// api/logout.js
export default async function handler(req, res) {
  // définit le cookie avec Max-Age=0 pour l'effacer
  res.setHeader(
    "Set-Cookie",
    "zilo_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
  );
  return res.status(200).json({ ok: true });
}
