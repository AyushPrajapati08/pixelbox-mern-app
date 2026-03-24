const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const painterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    bio: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    auctions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auction' }],
  },
  { timestamps: true }
);

painterSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

painterSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Painter', painterSchema);
