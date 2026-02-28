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

const db = new Database("preventai.db");

// Initialize Database
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

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "preventai-super-secret-key";

app.use(express.json());
app.use(cookieParser());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Signup
app.post("/api/auth/signup", async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (fullName, email, password, specialization) VALUES (?, ?, ?, ?)");
    const result = stmt.run(fullName, email, hashedPassword, "General Clinician");
    
    const token = jwt.sign({ id: result.lastInsertRowid, email, fullName }, JWT_SECRET, { expiresIn: "24h" });
    
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(201).json({ user: { id: result.lastInsertRowid, fullName, email } });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user.id, email, fullName: user.fullName }, JWT_SECRET, { expiresIn: "24h" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// Get Current User
app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const user = db.prepare("SELECT id, fullName, email, specialization FROM users WHERE id = ?").get(req.user.id);
  res.json({ user });
});

// Update Profile
app.put("/api/auth/profile", authenticateToken, (req: any, res) => {
  const { fullName, specialization } = req.body;
  try {
    db.prepare("UPDATE users SET fullName = ?, specialization = ? WHERE id = ?").run(fullName, specialization, req.user.id);
    res.json({ message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// --- Vite Integration ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
