const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json());

let attendanceData = [];
let isSessionActive = false;
// Variable to store the monitor's current location
let monitorLocation = null;

// Test route
app.get("/", (req, res) => {
  res.send("Attendance Backend Running ✅");
});

// Endpoint for the monitor to set their location
app.post("/update-monitor-location", (req, res) => {
  const { lat, lon } = req.body;
  if (lat && lon) {
    monitorLocation = { lat, lon };
    res.json({ message: "Your location has been set as the attendance center." });
  } else {
    res.status(400).json({ message: "Invalid location data." });
  }
});

// Endpoint for students to get the monitor's location
app.get("/get-monitor-location", (req, res) => {
  if (monitorLocation && isSessionActive) {
    res.json(monitorLocation);
  } else {
    res.status(404).json({ message: "Monitor has not set the location or session is inactive." });
  }
});

// Endpoints for session control
app.post("/start-session", (req, res) => {
  isSessionActive = true;
  res.json({ message: "Attendance session started!" });
});

app.post("/end-session", (req, res) => {
  isSessionActive = false;
  res.json({ message: "Attendance session ended!" });
});

// Endpoint to mark attendance (checks for active session)
app.post("/mark-attendance", (req, res) => {
  if (!isSessionActive) {
    return res.status(403).json({ message: "Attendance session is not active right now!" });
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

// Endpoints to get and clear attendance data
app.get("/get-attendance", (req, res) => {
  res.json(attendanceData);
});

app.post("/clear-attendance", (req, res) => {
  attendanceData = [];
  res.json({ message: "All attendance data cleared!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));