const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");
const moment = require("moment-timezone");

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define schemas
const playerSchema = new mongoose.Schema({
  name: String,
  time: String, // Store time in AM/PM format
});

const dateSchema = new mongoose.Schema({
  lastDate: String,
});

const Player = mongoose.model("Player", playerSchema);
const QueueDate = mongoose.model("QueueDate", dateSchema);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the public directory

// Middleware to check and reset queue daily
app.use(async (_, res, next) => {
  try {
    const todayDate = moment().tz("America/Toronto").format("MM/DD/YYYY"); // Format: "MM/DD/YYYY"
    let queueDate = await QueueDate.findOne();

    if (!queueDate || queueDate.lastDate !== todayDate) {
      await Player.deleteMany({});
      if (!queueDate) {
        queueDate = new QueueDate({ lastDate: todayDate });
      } else {
        queueDate.lastDate = todayDate;
      }
      await queueDate.save();
    }
    next();
  } catch (error) {
    console.error("Error in daily reset middleware:", error);
    res.status(500).json({ error: "Server error during daily check" });
  }
});

// Serve the HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html", "style.css"));
});

// Load the queue
app.get("/queue", async (req, res) => {
  try {
    const queue = await Player.find().sort({ time: 1 });
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: "Failed to load queue" });
  }
});

// Add a new entry to the queue
app.post("/queue", async (req, res) => {
  try {
    const { name } = req.body;
    const currentTime = moment().tz("America/Toronto").format("hh:mm A");
    const newPlayer = new Player({ name, time: currentTime });
    await newPlayer.save();
    const queue = await Player.find().sort({ time: 1 });
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: "Failed to add to queue" });
  }
});

// Get the current date
app.get("/current-date", async (req, res) => {
  try {
    const queueDate = await QueueDate.findOne();
    res.json({ currentDate: queueDate ? queueDate.lastDate : null });
  } catch (err) {
    res.status(500).json({ error: "Failed to get current date" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
