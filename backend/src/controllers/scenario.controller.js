const express = require('express');
const router = express.Router();

// Route temporaire pour les scénarios
router.get('/', async (req, res) => {
  res.json({ scenarios: [] });
});

module.exports = router;
