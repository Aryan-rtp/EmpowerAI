const express = require("express");
const { createEmployee, getEmployees, deleteEmployee } = require("../controllers/employee.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", verifyToken, createEmployee);
router.get("/", verifyToken, getEmployees);
router.delete("/:id", verifyToken, deleteEmployee);

module.exports = router;
