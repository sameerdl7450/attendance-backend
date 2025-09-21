const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json());

let attendanceData = [];
// Naya variable jo session ka status store karega
let isSessionActive = false;

// Test route
app.get("/", (req, res) => {
  res.send("Attendance Backend Running ✅");
});

// Naya Endpoint: Attendance session start karne ke liye
app.post("/start-session", (req, res) => {
  isSessionActive = true;
  res.json({ message: "Attendance session started!" });
});

// Naya Endpoint: Attendance session end karne ke liye
app.post("/end-session", (req, res) => {
  isSessionActive = false;
  res.json({ message: "Attendance session ended!" });
});

// Mark attendance (Updated to check session status)
app.post("/mark-attendance", (req, res) => {
  // Check: Agar session active nahi hai toh error bhej do
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
  res.json({ message: `Attendance for ${subject} marked successfully!`, data: { roll, name, status, subject, time } });
});

app.get("/get-attendance", (req, res) => {
  res.json(attendanceData);
});

app.post("/clear-attendance", (req, res) => {
  attendanceData = [];
  res.json({ message: "Attendance cleared!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));