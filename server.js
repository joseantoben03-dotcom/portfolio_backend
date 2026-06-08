const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

app.use(cors());
app.use(express.json());

// ── MongoDB ──
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB Successfully"))
  .catch((err) => console.log(err));

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
  res.json({ status: "Backend is running properly 🚀" });
});

// ── POST /message ──
app.post("/message", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const newUser = new User({ name, email, subject, message });
    await newUser.save();
    res.json({ message: "Message sent successfully", user: newUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /fetch ──
app.get("/fetch", async (req, res) => {
  try {
    const U = await User.find().sort({ createdAt: -1 });
    const count = U.length;
    res.json({ U, count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Start server ──
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

module.exports = app;