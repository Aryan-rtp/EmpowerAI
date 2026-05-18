const Employee = require("../models/employee.model");
const asyncHandler = require("../utils/asyncHandler");

const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, dept, skills, performanceScore, experience } = req.body;

  if (
    !name ||
    !email ||
    !dept ||
    performanceScore === undefined ||
    performanceScore === null ||
    experience === undefined ||
    experience === null
  ) {
    return res.status(400).json({
      message: "Name, email, dept, performanceScore, and experience are required",
    });
  }

  const employee = await Employee.create({
    name,
    email,
    dept,
    skills: Array.isArray(skills) ? skills : [],
    performanceScore,
    experience,
  });

  return res.status(201).json({ message: "Employee created", employee });
});

const getEmployees = asyncHandler(async (req, res) => {
  const { department, search } = req.query;
  const filter = {};

  if (department) {
    filter.dept = new RegExp(`^${department}$`, "i");
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { dept: { $regex: search, $options: "i" } },
      { skills: { $elemMatch: { $regex: search, $options: "i" } } },
    ];
  }

  const employees = await Employee.find(filter).sort({ createdAt: -1 });
  return res.status(200).json({ total: employees.length, employees });
});

module.exports = { createEmployee, getEmployees };
