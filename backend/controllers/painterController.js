const Painter = require('../models/Painter');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');
const { generateToken } = require('../utils/generateToken');

// ================= REGISTER =================
const register = async (req, res) => {
  try {
    const { name, email, password, bio, portfolio } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    const exists = await Painter.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'Email already registered' });

    const painter = await Painter.create({ name, email, password, bio, portfolio });
    res.status(201).json({
      success: true,
      message: 'Registration successful. Awaiting admin approval.',
      painter: { id: painter._id, name: painter.name, email: painter.email },
    });
  } catch (error) {
    console.error('PAINTER REGISTER ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const painter = await Painter.findOne({ email });
    if (!painter || !(await painter.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!painter.isApproved)
      return res.status(403).json({ message: 'Account pending admin approval' });

    if (!painter.isActive)
      return res.status(403).json({ message: 'Account deactivated' });

    res.json({
      success: true,
      token: generateToken(painter._id, 'painter'),
      painter: { id: painter._id, name: painter.name, email: painter.email, profileImage: painter.profileImage },
    });
  } catch (error) {
    console.error('PAINTER LOGIN ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= PROFILE =================
const getProfile = async (req, res) => {
  try {
    const painter = await Painter.findById(req.user.id).select('-password').populate('auctions');
    if (!painter) return res.status(404).json({ message: 'Painter not found' });
    res.json({ success: true, painter });
  } catch (error) {
    console.error('GET PAINTER PROFILE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio, portfolio, profileImage } = req.body;

    const painter = await Painter.findByIdAndUpdate(
      req.user.id,
      { name, bio, portfolio, profileImage },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, painter });
  } catch (error) {
    console.error('UPDATE PAINTER PROFILE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= AUCTIONS =================
const getMyAuctions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { painter: req.user.id };
    if (status) query.status = status;
    const auctions = await Auction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Auction.countDocuments(query);
    res.json({ success: true, auctions, total });
  } catch (error) {
    console.error('GET MY AUCTIONS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

const createAuction = async (req, res) => {
  try {
    const { paintingName, category, image, description, startingBid, minimumIncrement, startTime, endTime } = req.body;

    const auction = await Auction.create({
      paintingName, category, image, description,
      painter: req.user.id, startingBid, minimumIncrement, startTime, endTime,
    });

    await Painter.findByIdAndUpdate(req.user.id, { $push: { auctions: auction._id } });

    res.status(201).json({ success: true, auction });
  } catch (error) {
    console.error('CREATE AUCTION ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateAuction = async (req, res) => {
  try {
    const auction = await Auction.findOne({ _id: req.params.id, painter: req.user.id });
    if (!auction) return res.status(404).json({ message: 'Auction not found or unauthorized' });
    if (auction.status !== 'UPCOMING') return res.status(400).json({ message: 'Cannot edit auction that has already started' });

    const { paintingName, category, image, description, startingBid, minimumIncrement, startTime, endTime } = req.body;
    Object.assign(auction, { paintingName, category, image, description, startingBid, minimumIncrement, startTime, endTime });
    await auction.save();

    res.json({ success: true, auction });
  } catch (error) {
    console.error('UPDATE AUCTION ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteAuction = async (req, res) => {
  try {
    const auction = await Auction.findOne({ _id: req.params.id, painter: req.user.id });
    if (!auction) return res.status(404).json({ message: 'Auction not found or unauthorized' });
    if (auction.status !== 'UPCOMING') return res.status(400).json({ message: 'Cannot delete auction that has already started' });

    await auction.deleteOne();
    await Painter.findByIdAndUpdate(req.user.id, { $pull: { auctions: req.params.id } });

    res.json({ success: true, message: 'Auction deleted' });
  } catch (error) {
    console.error('DELETE AUCTION ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= AUCTION BIDS =================
const getAuctionBids = async (req, res) => {
  try {
    const auction = await Auction.findOne({ _id: req.params.id, painter: req.user.id });
    if (!auction) return res.status(404).json({ message: 'Auction not found or unauthorized' });

    const bids = await Bid.find({ auction: req.params.id }).populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, bids });
  } catch (error) {
    console.error('GET AUCTION BIDS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= NOTIFICATIONS =================
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id, recipientModel: 'Painter' })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('GET PAINTER NOTIFICATIONS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register, login, getProfile, updateProfile,
  getMyAuctions, createAuction, updateAuction, deleteAuction,
  getAuctionBids, getNotifications
};