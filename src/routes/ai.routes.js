const express = require("express");
const { recommend } = require("../controllers/ai.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/recommend", verifyToken, recommend);

module.exports = router;
