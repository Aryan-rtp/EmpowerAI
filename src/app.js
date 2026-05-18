const express = require("express");
const cors = require("cors");
const connectDB = require("./db/db");
const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employee.routes");
const aiRoutes = require("./routes/ai.routes");
const { errorHandler } = require("./middleware/error.middleware");

connectDB();

const app = express();

app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:5173",
	})
);
app.use(express.json());

app.get("/api/health", (req, res) => {
	res.status(200).json({ message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/ai", aiRoutes);

// Serve frontend static files when deployed
const path = require("path");
if (process.env.NODE_ENV === "production" || process.env.SERVE_CLIENT === "true") {
	const publicDir = path.join(__dirname, "..", "public");
	app.use(express.static(publicDir));
	// fallback to index.html for SPA routes
	app.use((req, res, next) => {
		if (req.method !== "GET" || req.path.startsWith("/api")) {
			return next();
		}
		res.sendFile(path.join(publicDir, "index.html"));
	});
}

app.use(errorHandler);

module.exports = app;