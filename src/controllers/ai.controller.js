const Employee = require("../models/employee.model");
const asyncHandler = require("../utils/asyncHandler");
const { generateRecommendation } = require("../service/ai.service");

const recommend = asyncHandler(async (req, res) => {
  const { employeeIds } = req.body;

  let employees = [];
  if (Array.isArray(employeeIds) && employeeIds.length > 0) {
    employees = await Employee.find({ _id: { $in: employeeIds } });
  } else {
    employees = await Employee.find().sort({ performanceScore: -1 }).limit(25);
  }

  if (!employees.length) {
    return res.status(404).json({ message: "No employees found for recommendation" });
  }

  const employeePayload = employees.map((emp) => ({
    id: emp._id,
    name: emp.name,
    email: emp.email,
    dept: emp.dept,
    skills: emp.skills,
    performanceScore: emp.performanceScore,
    experience: emp.experience,
  }));

  const recommendation = await generateRecommendation(employeePayload);
  return res.status(200).json({ recommendation, employees: employeePayload });
});

module.exports = { recommend };
