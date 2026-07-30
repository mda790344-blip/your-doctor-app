require("dotenv").config();
const express = require("express");
const cors = require("cors");
const triageRoutes = require("./routes/triage");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic health check -- useful to confirm the server is up when you're
// testing from the Expo app on your phone
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/triage", triageRoutes);

app.listen(PORT, () => {
  console.log(`Symptom triage backend running on port ${PORT}`);
});
