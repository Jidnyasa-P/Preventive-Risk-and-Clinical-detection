import express from "express";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Database ───────────────────────────────────────────────────────────────
const db = new Database("preventai.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    specialization TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── Config ─────────────────────────────────────────────────────────────────
const app        = express();
const PORT       = parseInt(process.env.PORT || "3000", 10);
const JWT_SECRET = process.env.JWT_SECRET || "preventai-super-secret-key-change-in-production";
const IS_PROD    = process.env.NODE_ENV === "production";

// Internal FastAPI URL — on Render this runs on localhost:8001
// Locally it runs on localhost:8000
const ML_BACKEND = process.env.ML_BACKEND_URL || (IS_PROD ? "http://127.0.0.1:8001" : "http://127.0.0.1:8000");

app.use(express.json());
app.use(cookieParser());

// ── ML Proxy ────────────────────────────────────────────────────────────────
// All /ml/* requests are forwarded to the Python FastAPI backend.
// This means the browser NEVER talks to Python directly — no CORS issues.
app.use("/ml", async (req, res) => {
  const targetUrl = `${ML_BACKEND}${req.path}`;
  try {
    const fetchRes = await fetch(targetUrl, {
      method:  req.method,
      headers: { "Content-Type": "application/json" },
      body:    req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });
    const data = await fetchRes.json();
    res.status(fetchRes.status).json(data);
  } catch (err) {
    console.error("ML proxy error:", err);
    res.status(502).json({ detail: "ML backend unavailable. Please try again shortly." });
  }
});

// ── Auth Middleware ─────────────────────────────────────────────────────────
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

// Cookie options — secure on production (HTTPS), lax on local HTTP
const cookieOpts = (res: any) => ({
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: IS_PROD ? ("none" as const) : ("lax" as const),
  maxAge:   24 * 60 * 60 * 1000,
});

// ── Auth Routes ─────────────────────────────────────────────────────────────
app.post("/api/auth/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt   = db.prepare("INSERT INTO users (fullName, email, password, specialization) VALUES (?, ?, ?, ?)");
    const result = stmt.run(fullName, email, hashedPassword, "General Clinician");
    const token  = jwt.sign({ id: result.lastInsertRowid, email, fullName }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie("token", token, cookieOpts(res));
    res.status(201).json({ user: { id: result.lastInsertRowid, fullName, email } });
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) return res.status(400).json({ error: "Invalid email or password" });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid email or password" });
    const token = jwt.sign({ id: user.id, email, fullName: user.fullName }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie("token", token, cookieOpts(res));
    res.json({ user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const user = db.prepare("SELECT id, fullName, email, specialization FROM users WHERE id = ?").get(req.user.id);
  res.json({ user });
});

app.put("/api/auth/profile", authenticateToken, (req: any, res) => {
  const { fullName, specialization } = req.body;
  try {
    db.prepare("UPDATE users SET fullName = ?, specialization = ? WHERE id = ?").run(fullName, specialization, req.user.id);
    res.json({ message: "Profile updated" });
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ── Static / Vite ───────────────────────────────────────────────────────────
async function startServer() {
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PreventAI server running on http://0.0.0.0:${PORT}`);
    console.log(`ML backend proxied from ${ML_BACKEND}`);
    console.log(`Environment: ${IS_PROD ? "production" : "development"}`);
  });
}

startServer();
