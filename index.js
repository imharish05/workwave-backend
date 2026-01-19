const express = require("express");
const path = require("path");
const session = require("express-session");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "config", ".env") });

const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

const passport = require("./passport.js");

const connectDB = require("./config/dbConnect.js");

const authRoutes = require("./Routes/authRoutes.js");

const employeeRoutes = require("./Routes/employeeRoutes.js");

const employerRoutes = require("./Routes/employerRoutes.js");

const jobRoutes = require("./Routes/jobRoutes.js");

// Middlewares

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());
app.use(passport.initialize());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://imharish05.github.io",
  "https://workwave.netlify.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS Blocked: Origin not allowed"));
      }
    },
    credentials: true,
  })
);


// connectdb
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/job", jobRoutes);

// Test route
app.use("/", (req, res) => {
  res.send("Test server");
});

app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});
