const express = require("express");
const { createEmployee, getEmployees } = require("../controllers/employee.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", verifyToken, createEmployee);
router.get("/", verifyToken, getEmployees);

module.exports = router;
