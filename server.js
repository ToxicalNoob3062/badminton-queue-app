const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define a schema and model for the queue
const playerSchema = new mongoose.Schema({
  name: String,
  timestamp: { type: Date, default: Date.now },
});

const Player = mongoose.model("Player", playerSchema);

app.use(bodyParser.json());
app.use(express.static("public"));

// Serve the HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Load the queue
app.get("/queue", async (req, res) => {
  try {
    const queue = await Player.find().sort({ timestamp: 1 });
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: "Failed to load queue" });
  }
});

// Add a new entry to the queue
app.post("/queue", async (req, res) => {
  try {
    const newPlayer = new Player(req.body);
    await newPlayer.save();
    const queue = await Player.find().sort({ timestamp: 1 });
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: "Failed to add to queue" });
  }
});

// Reset the queue
app.post("/reset", async (req, res) => {
  const { password } = req.body;
  if (password === "0195") {
    try {
      await Player.deleteMany({});
      res.json({ message: "Queue has been reset" });
    } catch (err) {
      res.status(500).json({ error: "Failed to reset queue" });
    }
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
