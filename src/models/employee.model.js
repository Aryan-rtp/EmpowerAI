const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Employee email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
    },
    dept: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value),
        message: "Skills must be an array of strings",
      },
    },
    performanceScore: {
      type: Number,
      required: [true, "Performance score is required"],
      min: [0, "Performance score must be between 0 and 100"],
      max: [100, "Performance score must be between 0 and 100"],
    },
    experience: {
      type: Number,
      required: [true, "Experience is required"],
      min: [0, "Experience cannot be negative"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
