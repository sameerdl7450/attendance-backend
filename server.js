const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json());

let attendanceData = []; // Temporary storage

// Test route
app.get("/", (req, res) => {
  res.send("Attendance Backend Running ✅");
});

// Mark attendance (Updated to accept subject)
app.post("/mark-attendance", (req, res) => {
  const { roll, name, status, subject } = req.body; // Subject added
  const time = new Date().toLocaleString();

  // Check if student already marked present for the same subject
  const exists = attendanceData.find(item => item.roll === roll && item.subject === subject);
  if (exists) {
    return res.json({ message: `Attendance already marked for ${subject}!` });
  }

  attendanceData.push({ roll, name, status, subject, time }); // Subject saved
  res.json({ message: `Attendance for ${subject} marked successfully!`, data: { roll, name, status, subject, time } });
});

// Get all attendance (for monitor)
app.get("/get-attendance", (req, res) => {
  res.json(attendanceData);
});

// Clear attendance for new session
app.post("/clear-attendance", (req, res) => {
  attendanceData = [];
  res.json({ message: "Attendance cleared!" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));