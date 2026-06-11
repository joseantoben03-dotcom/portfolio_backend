const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

// ── Manual CORS headers ──
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── MongoDB ──
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not defined in environment variables");
    }
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB Successfully");
  } catch (err) {
    console.log("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

connectDB();

// ── Schema ──
const UserSchema = new mongoose.Schema({
  name:    { type: String },
  email:   { type: String },
  subject: { type: String },
  message: { type: String }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

// ── GET / — health check ──
app.get("/", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({
    status: "Backend is running properly 🚀",
    mongodb: statusMap[dbStatus] || "unknown",
    mongoUrl: process.env.MONGO_URL ? "✅ Set" : "❌ NOT SET"
  });
});

// ── POST /message — save contact form ──
app.post("/message", async (req, res) => {
  try {
    // Check DB connection first
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected. Please try again." });
    }

    console.log("📩 Body received:", req.body);
    const { name, email, subject, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const newUser = new User({ name, email, subject, message });
    const saved = await newUser.save();

    console.log("✅ Saved to MongoDB:", saved._id);
    res.status(201).json({ message: "Message sent successfully", user: saved });

  } catch (e) {
    console.log("❌ Save error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /fetch — return all messages ──
app.get("/fetch", async (req, res) => {
  try {
    // Check DB connection first
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected. Please try again." });
    }

    const U = await User.find().sort({ createdAt: -1 });
    const count = U.length;
    console.log(`📋 Fetched ${count} records`);
    res.json({ U, count });

  } catch (e) {
    console.log("❌ Fetch error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Start server ──
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});

module.exports = app;
