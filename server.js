const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- User Database ---
// IMPORTANT: A real project would use a database. This is a temporary in-memory store.
const users = {}; 

// --- Relying Party Identity ---
const rpID = 'moniter-f1a74.web.app'; // IMPORTANT: Yeh aapki Firebase website ka domain hona chahiye
const expectedOrigin = `https://${rpID}`;
const rpName = 'Student Attendance System';

// --- Session, Location, and Attendance Data ---
let isSessionActive = false;
let monitorLocation = null;
let attendanceData = [];

// --- FINGERPRINT REGISTRATION PROCESS ---
app.post('/register-challenge', (req, res) => {
    const { studentId, name } = req.body;
    if (!studentId || !name) return res.status(400).send({ error: 'Missing studentId or name' });

    if (users[studentId]) return res.status(400).send({ error: 'User already exists' });

    users[studentId] = {
        id: studentId,
        username: studentId,
        name: name,
        authenticators: [],
    };

    const options = generateRegistrationOptions({
        rpName,
        rpID,
        userID: studentId,
        userName: studentId,
        attestationType: 'none',
        excludeCredentials: [],
    });

    users[studentId].currentChallenge = options.challenge;
    res.send(options);
});

app.post('/register-verify', async (req, res) => {
    const { studentId, cred } = req.body;
    const user = users[studentId];
    if (!user) return res.status(404).send({ error: 'User not found.' });

    try {
        const verification = await verifyRegistrationResponse({
            response: cred,
            expectedChallenge: user.currentChallenge,
            expectedOrigin,
            expectedRPID: rpID,
        });

        if (verification.verified) {
            user.authenticators.push(verification.registrationInfo);
        }
        res.send({ verified: verification.verified });
    } catch (error) {
        console.error(error);
        res.status(400).send({ error: error.message });
    }
});

// --- FINGERPRINT LOGIN PROCESS ---
app.post('/login-challenge', (req, res) => {
    const { studentId } = req.body;
    const user = users[studentId];
    if (!user) return res.status(404).send({ error: 'User not found.' });

    const options = generateAuthenticationOptions({
        allowCredentials: user.authenticators.map(auth => ({
            id: auth.credentialID,
            type: 'public-key',
        })),
        userVerification: 'preferred',
    });

    user.currentChallenge = options.challenge;
    res.send(options);
});

app.post('/login-verify', async (req, res) => {
    const { studentId, cred } = req.body;
    const user = users[studentId];
    if (!user) return res.status(404).send({ error: 'User not found.' });

    const authenticator = user.authenticators.find(auth => auth.credentialID.toString('base64url') === cred.id);
    if (!authenticator) return res.status(400).send({ error: 'Authenticator not recognized.' });

    try {
        const verification = await verifyAuthenticationResponse({
            response: cred,
            expectedChallenge: user.currentChallenge,
            expectedOrigin,
            expectedRPID: rpID,
            authenticator,
        });

        if (verification.verified) {
            // Update counter
            authenticator.counter = verification.authenticationInfo.newCounter;
        }
        res.send({ verified: verification.verified, name: user.name });
    } catch (error) {
        console.error(error);
        res.status(400).send({ error: error.message });
    }
});

// --- ATTENDANCE LOGIC (No password needed now) ---
app.post('/mark-attendance', (req, res) => {
    if (!isSessionActive) return res.status(403).json({ message: "Session is not active!" });
    const { studentId, name, subject } = req.body;
    const time = new Date().toLocaleString();
    const exists = attendanceData.find(item => item.studentId === studentId && item.subject === subject);
    if (exists) return res.json({ message: `Attendance already marked for ${subject}!` });
    attendanceData.push({ studentId, name, status: "Present", subject, time });
    res.json({ message: `Attendance for ${subject} marked for ${name}!` });
});

// --- Other Endpoints ---
app.get("/", (req, res) => { res.send("Attendance Backend Running ✅"); });
app.post("/start-session", (req, res) => { isSessionActive = true; res.json({ message: "Session started!" }); });
app.post("/end-session", (req, res) => { isSessionActive = false; res.json({ message: "Session ended!" }); });
app.get("/get-attendance", (req, res) => { res.json(attendanceData); });
app.post("/clear-attendance", (req, res) => { attendanceData = []; users = {}; res.json({ message: "All data cleared!" }); }); // Clears users too
app.post("/update-monitor-location",(req,res)=>{const{lat,lon}=req.body;if(lat&&lon){monitorLocation={lat,lon};res.json({message:"Location set."})}else{res.status(400).json({message:"Invalid location."})}});
app.get("/get-monitor-location",(req,res)=>{if(monitorLocation&&isSessionActive){res.json(monitorLocation)}else{res.status(404).json({message:"Monitor has not started session."})}});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));