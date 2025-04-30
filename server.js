const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/cypressDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

// ✅ Report Schema
const reportSchema = new mongoose.Schema({
  type: String,
  desc: String,
  lat: Number,
  lng: Number,
  user: String,
  notify: Boolean,
  media: String,
  status: { type: String, default: "New" }
});
const Report = mongoose.model("Report", reportSchema);

// ✅ User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// ✅ Multer (media upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ✅ Register route
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: "Username already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// ✅ Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Incorrect password" });

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

// ✅ Submit a report (with debug logs)
app.post("/report", upload.single("media"), async (req, res) => {
  const { type, desc, lat, lng, user, notify } = req.body;

  console.log("📥 Incoming report submission");
  console.log("Body:", req.body);
  console.log("File:", req.file);

  try {
    const duplicate = await Report.findOne({
      type,
      lat: { $gte: parseFloat(lat) - 0.0001, $lte: parseFloat(lat) + 0.0001 },
      lng: { $gte: parseFloat(lng) - 0.0001, $lte: parseFloat(lng) + 0.0001 }
    });

    if (duplicate) {
      console.log("⚠️ Duplicate report detected");
      return res.status(409).json({ message: "Duplicate report detected" });
    }

    const newReport = new Report({
      type,
      desc,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      user,
      notify: notify === "true" || notify === true,
      media: req.file ? req.file.filename : null
    });

    await newReport.save();
    console.log("✅ Report saved successfully");
    res.status(200).json({ message: "Report submitted successfully!" });

  } catch (err) {
    console.error("🔥 Error submitting report:", err);
    res.status(500).json({ message: "Something went wrong on the server." });
  }
});

// ✅ Fetch all reports
app.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reports" });
  }
});

app.get("/my_reports", async (req, res) => {
  const user = req.query.user;
  try {
    const reports = await Report.find({ user });
    res.json(reports);
  } catch (err) {
    console.error("Failed to fetch user reports:", err);
    res.status(500).json({ message: "Could not load reports." });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
