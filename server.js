const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json());

// --- STUDENT DATABASE (Yahan aapko apne sabhi classmates ka data add karna hoga) ---
const students = [
    { studentId: "E23BCA001", name: "Rahul Sharma", pass: "rahul123" },
    { studentId: "E23BCA002", name: "Priya Singh", pass: "priya456" },
    { studentId: "E23BCA003", name: "Amit Kumar", pass: "amit789" },
    // Yahan aur students add karein...
];
// --- ------------------------------------------------------------------- ---

// Server state variables
let attendanceData = [];
let isSessionActive = false;
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
    res.status(404).json({ message: "Monitor has not set the location or the session is inactive." });
  }
});

// Endpoints for session control
app.post("/start-session", (req, res) => {
  isSessionActive = true;
  res.json({ message: "Attendance session has been STARTED!" });
});

app.post("/end-session", (req, res) => {
  isSessionActive = false;
  res.json({ message: "Attendance session has been ENDED!" });
});

// Endpoint to mark attendance (checks session, credentials, and allows manual entry)
app.post("/mark-attendance", (req, res) => {
  if (!isSessionActive) {
    return res.status(403).json({ message: "Attendance session is not active right now!" });
  }

  const { studentId, name, subject, password } = req.body;
  
  // Check for student credentials if password is provided (student marking attendance)
  if (password) {
      const student = students.find(s => s.studentId.toLowerCase() === studentId.toLowerCase());
      if (!student || student.pass !== password) {
          return res.status(401).json({ message: "Invalid Student ID or Password!" });
      }
  } 
  // If no password, it's a manual entry by the monitor, so we trust it.
  
  const studentIdentifier = studentId;
  const studentName = name || (students.find(s => s.studentId.toLowerCase() === studentId.toLowerCase()) || {}).name;

  if (!studentIdentifier || !studentName) {
      return res.status(400).json({ message: "Student ID or Name is missing." });
  }

  const time = new Date().toLocaleString();
  const exists = attendanceData.find(item => item.studentId === studentIdentifier && item.subject === subject);
  if (exists) {
    return res.json({ message: `Attendance already marked for this subject!` });
  }
  
  attendanceData.push({ studentId: studentIdentifier, name: studentName, status: "Present", subject, time });
  res.json({ message: `Attendance for ${subject} marked successfully for ${studentName}!` });
});

// Endpoints to get and clear attendance data
app.get("/get-attendance", (req, res) => {
  res.json(attendanceData);
});

app.post("/clear-attendance", (req, res) => {
  attendanceData = [];
  res.json({ message: "All attendance data has been cleared!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));