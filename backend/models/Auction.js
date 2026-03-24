const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema(
{
  paintingName: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: String,
    required: true,
    enum: ['Oil', 'Watercolor', 'Digital', 'Sculpture', 'Sketch', 'Acrylic', 'Other']
  },

  image: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: ''
  },

  painter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Painter',
    required: true
  },

  startingBid: {
    type: Number,
    required: true,
    min: 0
  },

  currentBid: {
    type: Number
  },

  minimumIncrement: {
    type: Number,
    required: true,
    min: 1
  },

  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  startTime: {
    type: Date,
    required: true
  },

  endTime: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: ['UPCOMING', 'LIVE', 'ENDED', 'PAUSED'],
    default: 'UPCOMING'
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  bids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid'
    }
  ]

},
{ timestamps: true }
);



// Auto set current bid
auctionSchema.pre('save', function (next) {

  if (!this.currentBid) {
    this.currentBid = this.startingBid;
  }

  // Validate time
  if (this.endTime <= this.startTime) {
    return next(new Error("End time must be after start time"));
  }

  next();
});

module.exports = mongoose.model('Auction', auctionSchema);