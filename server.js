const path = require("node:path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "jobbiesarea";
const projectRoot = __dirname;

if (!mongoUri) {
  console.error("MONGODB_URI is required. Copy .env.example to .env and add your MongoDB connection string.");
  process.exit(1);
}

const mongoClient = new MongoClient(mongoUri);
let users;

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "16kb" }));

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || "").replace(/\s+/g, "");
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    gender: user.gender
  };
}

function validateUserInput({ firstName, lastName, email, phone, gender, password }) {
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRx = /^\+?\d{7,15}$/;

  if (!firstName || !lastName || !email || !phone || !gender || !password) {
    return "Please fill all fields.";
  }
  if (!phoneRx.test(phone)) {
    return "Invalid phone number format.";
  }
  if (!emailRx.test(email)) {
    return "Invalid email format.";
  }
  if (!["female", "male"].includes(gender)) {
    return "Invalid gender.";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  return null;
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: users ? "connected" : "disconnected" });
});

app.post("/api/register", async (req, res, next) => {
  try {
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const email = normalizeEmail(req.body.email);
    const phone = normalizePhone(req.body.phone);
    const gender = String(req.body.gender || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const validationError = validateUserInput({ firstName, lastName, email, phone, gender, password });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const result = await users.insertOne({
      firstName,
      lastName,
      email,
      phone,
      gender,
      passwordHash,
      createdAt: now,
      updatedAt: now
    });

    return res.status(201).json({
      user: publicUser({ _id: result.insertedId, firstName, lastName, email, phone, gender })
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }
    return next(error);
  }
});

app.post("/api/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    const user = await users.findOne({ email });
    const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.use(express.static(projectRoot));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found." });
  }
  return res.sendFile(path.join(projectRoot, "index.html"), next);
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Server error. Please try again." });
});

async function start() {
  await mongoClient.connect();
  const database = mongoClient.db(databaseName);
  users = database.collection("users");
  await users.createIndex({ email: 1 }, { unique: true });

  app.listen(port, "0.0.0.0", () => {
    console.log(`JobbiesArea is running on http://localhost:${port}`);
    console.log(`Connected to MongoDB database: ${databaseName}`);
  });
}

async function shutdown() {
  await mongoClient.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch((error) => {
  console.error("Unable to connect to MongoDB:", error.message);
  process.exit(1);
});
