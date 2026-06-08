const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB Successfully"))
  .catch((err) => console.log(err));

// Define Schema with timestamps
const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  subject: { type: String },
  message: { type: String }
}, { timestamps: true }); // adds createdAt and updatedAt automatically

const User = mongoose.model("User", UserSchema);

// POST route to save message
app.post("/message", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
      return res.json({ message: "User already exists" });
    }

    const newUser = new User({ name, email, subject, message });
    await newUser.save();

    res.json({ message: "User Registered successfully", user: newUser });
  } catch (e) {
    res.json(e);
  }
});

// GET route to fetch all messages
app.get("/fetch", async (req, res) => {
  try {
    const count = await User.countDocuments();
    const users = await User.find();
    res.json({ users, count });
  } catch (e) {
    res.json(e);
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
