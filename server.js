const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json());

let attendanceData = [];
let isSessionActive = false;
// Naya variable jo monitor ki location store karega
let monitorLocation = null;

// Test route
app.get("/", (req, res) => {
  res.send("Attendance Backend Running ✅");
});

// Naya Endpoint: Monitor ki location update karne ke liye
app.post("/update-monitor-location", (req, res) => {
  const { lat, lon } = req.body;
  if (lat && lon) {
    monitorLocation = { lat, lon };
    res.json({ message: "Your location has been set as the attendance center." });
  } else {
    res.status(400).json({ message: "Invalid location data." });
  }
});

// Naya Endpoint: Student ko monitor ki location dene ke liye
app.get("/get-monitor-location", (req, res) => {
  if (monitorLocation && isSessionActive) {
    res.json(monitorLocation);
  } else {
    res.status(404).json({ message: "Monitor has not set the location or session is inactive." });
  }
});

// Session control
app.post("/start-session", (req, res) => { isSessionActive = true; res.json({ message: "Attendance session started!" }); });
app.post("/end-session", (req, res) => { isSessionActive = false; res.json({ message: "Attendance session ended!" }); });

// Mark attendance
app.post("/mark-attendance", (req, res) => {
  if (!isSessionActive) {
    return res.status(403).json({ message: "Attendance session is not active!" });
  }
  const { roll, name, status, subject } = req.body;
  const time = new Date().toLocaleString();
  const exists = attendanceData.find(item => item.roll === roll && item.subject === subject);
  if (exists) {
    return res.json({ message: `Attendance already marked for ${subject}!` });
  }
  attendanceData.push({ roll, name, status, subject, time });
  res.json({ message: `Attendance for ${subject} marked successfully!` });
});

// Get & Clear Attendance
app.get("/get-attendance", (req, res) => { res.json(attendanceData); });
app.post("/clear-attendance", (req, res) => { attendanceData = []; res.json({ message: "Attendance cleared!" }); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));