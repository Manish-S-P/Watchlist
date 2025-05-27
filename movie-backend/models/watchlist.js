const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: String, required: true }, // imdbID from OMDB
  title: { type: String, required: true },
  poster: { type: String },
  status: { type: String, enum: ['watching', 'completed', 'planned'], default: 'planned' },
  episodeCount: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
