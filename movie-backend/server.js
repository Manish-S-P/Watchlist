require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const User = require('./models/user');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret';



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [
    'http://localhost:5500', 
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-tracker';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Movie Schema and Model
const movieSchema = new mongoose.Schema({
  imdbID: { type: String, required: true, trim: true },
  title: { type: String, trim: true },
  year: { type: String, trim: true },
  poster: { type: String, trim: true },
  type: { type: String, trim: true },
  status: { 
    type: String, 
    default: 'watching',
    enum: ['watching', 'planned', 'completed', 'rewatching', 'dropped']
  },
  episodeCount: { type: Number, default: 1, min: 1 },
  startDate: { type: String, trim: true },
  endDate: { type: String, trim: true },
  userId: { type: String, required: true, trim: true },
}, { timestamps: true });

const Movie = mongoose.model('Movie', movieSchema);

// Routes
app.post('/api/movies', async (req, res) => {
  const { imdbID, title, year, poster, type, status, episodeCount, startDate, endDate, userId } = req.body;

  if (!imdbID || !userId) {
    return res.status(400).json({ error: 'imdbID and userId are required' });
  }

  try {
    let movie = await Movie.findOne({ imdbID, userId });
    if (movie) {
      if (status) movie.status = status;
      if (episodeCount) movie.episodeCount = episodeCount;
      if (startDate) movie.startDate = startDate;
      if (endDate) movie.endDate = endDate;
      await movie.save();
    } else {
      movie = new Movie({ 
        imdbID, 
        title, 
        year, 
        poster, 
        type, 
        status: status || 'watching',
        episodeCount: episodeCount || 1,
        startDate,
        endDate,
        userId 
      });
      await movie.save();
    }
    res.json({ message: 'Movie saved', movie });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/movies/:userId/:status', async (req, res) => {
  try {
    const movies = await Movie.find({
      userId: req.params.userId,
      status: req.params.status
    }).sort({ updatedAt: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/movies/:userId', async (req, res) => {
  try {
    const movies = await Movie.find({ userId: req.params.userId })
      .sort({ status: 1, updatedAt: -1 });
    res.json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/movies/:userId/:imdbID', async (req, res) => {
  console.log('DELETE request received for:', req.params.userId, req.params.imdbID);
  
  try {
    const result = await Movie.findOneAndDelete({ 
      userId: req.params.userId, 
      imdbID: req.params.imdbID 
    });
    
    if (result) {
      console.log('Successfully deleted:', result);
      res.json({ 
        success: true,
        message: 'Movie deleted',
        deletedMovie: result
      });
    } else {
      console.log('Movie not found for deletion');
      res.status(404).json({ 
        success: false,
        error: 'Movie not found' 
      });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error during deletion' 
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});


app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, userId: user._id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});
