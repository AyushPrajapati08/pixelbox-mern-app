const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'recipientModel' },
    recipientModel: { type: String, required: true, enum: ['User', 'Painter'] },
    type: {
      type: String,
      enum: ['outbid', 'winner', 'auction_ended', 'painter_approved', 'auction_paused', 'general'],
      required: true,
    },
    message: { type: String, required: true },
    auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
