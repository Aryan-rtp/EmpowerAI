const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: "Validation failed", details });
  }

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ message: `${duplicateField} already exists` });
  }

  return res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
  });
};

module.exports = { errorHandler };
