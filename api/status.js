import jwt from "jsonwebtoken";

export default function handler(req, res) {
  const token = req.cookies?.zilo_session;
  if (!token) return res.status(200).json({ connected: false });

  try {
    const secret = process.env.JWT_SECRET;
    jwt.verify(token, secret);
    return res.status(200).json({ connected: true });
  } catch {
    return res.status(200).json({ connected: false });
  }
}
