const express = require("express");
const cors = require("cors");
const connectDB = require("./db/db");
const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employee.routes");
const aiRoutes = require("./routes/ai.routes");
const diagRoutes = require("./routes/diag.routes");
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

// Serve root explicitly (ensure SPA index is returned)
app.get("/", (req, res, next) => {
	const indexPath = path.join(publicDir, "index.html");
	if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
	return next();
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/diag", diagRoutes);

// Serve frontend static files when deployed or when `public` exists
const path = require("path");
const fs = require("fs");
const publicDir = path.join(__dirname, "..", "public");
if (process.env.NODE_ENV === "production" || process.env.SERVE_CLIENT === "true" || fs.existsSync(publicDir)) {
	console.log('Serving static from', publicDir, 'exists=', fs.existsSync(publicDir));
	const files = fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : [];
	console.log('Public files:', files);
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