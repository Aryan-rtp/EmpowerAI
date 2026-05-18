const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const state = mongoose.connection.readyState; // 0 disconnected,1 connected
    const db = mongoose.connection.db;
    const info = {
      readyState: state,
      host: mongoose.connection.host || null,
      port: mongoose.connection.port || null,
      name: mongoose.connection.name || (db && db.databaseName) || null,
    };
    res.json({ ok: true, info });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
