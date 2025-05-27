const express = require('express');
const router = express.Router();
const Watchlist = require('../models/watchlist');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret_here';

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Get all watchlist items for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ userId: req.user.id });
    res.json(watchlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add movie to watchlist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { movieId, title, poster, status, episodeCount, startDate, endDate } = req.body;
    const newEntry = new Watchlist({
      userId: req.user.id,
      movieId,
      title,
      poster,
      status,
      episodeCount,
      startDate,
      endDate
    });
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a watchlist item by ID
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedEntry = await Watchlist.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!updatedEntry) return res.status(404).json({ error: 'Item not found' });
    res.json(updatedEntry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a watchlist item by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Watchlist.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
