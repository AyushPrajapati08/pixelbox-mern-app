const Admin = require('../models/Admin');
const Painter = require('../models/Painter');
const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');
const { generateToken } = require('../utils/generateToken');
const { emitToRoom, emitToUser } = require('../utils/socketEmitter');


// ================= REGISTER ADMIN =================
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      role: 'admin',
    });

    res.status(201).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(admin._id, 'admin'),
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= DASHBOARD =================
const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPainters,
      totalAuctions,
      totalBids,
      liveAuctions,
      endedAuctions,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Painter.countDocuments({ isApproved: true }),
      Auction.countDocuments(),
      Bid.countDocuments(),
      Auction.countDocuments({ status: 'LIVE' }),
      Auction.countDocuments({ status: 'ENDED' }),
    ]);

    const revenueResult = await Bid.aggregate([
      { $match: { isWinning: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPainters,
        totalAuctions,
        totalBids,
        liveAuctions,
        endedAuctions,
        totalRevenue,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= GET ALL AUCTIONS =================
const getAuctions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) query.paintingName = { $regex: search, $options: 'i' };

    const auctions = await Auction.find(query)
      .populate('painter', 'name email')
      .populate('highestBidder', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Auction.countDocuments(query);

    res.json({
      success: true,
      auctions,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= CREATE AUCTION =================
const createAuction = async (req, res) => {
  try {
    const auction = await Auction.create(req.body);
    res.status(201).json({ success: true, auction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= UPDATE AUCTION =================
const updateAuction = async (req, res) => {
  try {
    const auction = await Auction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (req.body.endTime) {
      emitToRoom(`auction:${auction._id}`, 'auction:timeExtended', {
        endTime: auction.endTime,
      });
    }

    res.json({ success: true, auction });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= DELETE AUCTION =================
const deleteAuction = async (req, res) => {
  try {
    const auction = await Auction.findByIdAndDelete(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    await Bid.deleteMany({ auction: req.params.id });

    res.json({ success: true, message: 'Auction deleted' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= UPDATE AUCTION STATUS =================
const updateAuctionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const auction = await Auction.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    emitToRoom(`auction:${auction._id}`, 'auction:statusChange', { status });

    res.json({ success: true, auction });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= TOGGLE FEATURE =================
const toggleFeature = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    auction.isFeatured = !auction.isFeatured;
    await auction.save();

    res.json({ success: true, auction });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= GET PAINTERS =================
const getPainters = async (req, res) => {
  try {
    const painters = await Painter.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, painters });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= APPROVE PAINTER =================
const approvePainter = async (req, res) => {
  try {
    const { isApproved } = req.body;

    const painter = await Painter.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).select('-password');

    if (!painter) {
      return res.status(404).json({ message: 'Painter not found' });
    }

    await Notification.create({
      recipient: painter._id,
      recipientModel: 'Painter',
      type: 'painter_approved',
      message: isApproved
        ? 'Your account has been approved!'
        : 'Your approval has been revoked.',
    });

    emitToUser(painter._id, 'notification:new', {
      message: isApproved
        ? 'Account approved!'
        : 'Approval revoked',
    });

    res.json({ success: true, painter });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= UPDATE PAINTER =================
const updatePainter = async (req, res) => {
  try {
    const painter = await Painter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select('-password');

    if (!painter) {
      return res.status(404).json({ message: 'Painter not found' });
    }

    res.json({ success: true, painter });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= GET USERS =================
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, users });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= GET BIDS =================
const getBids = async (req, res) => {
  try {
    const bids = await Bid.find()
      .populate('user', 'name email')
      .populate('auction', 'paintingName status')
      .sort({ createdAt: -1 });

    res.json({ success: true, bids });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= SEND NOTIFICATION =================
const sendNotification = async (req, res) => {
  try {
    const { recipientId, recipientModel, message, type, auctionId } = req.body;

    const notification = await Notification.create({
      recipient: recipientId,
      recipientModel,
      type: type || 'general',
      message,
      auction: auctionId || null,
    });

    emitToUser(recipientId, 'notification:new', { message });

    res.status(201).json({ success: true, notification });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  registerAdmin,
  login,
  getDashboard,
  getAuctions,
  createAuction,
  updateAuction,
  deleteAuction,
  updateAuctionStatus,
  toggleFeature,
  getPainters,
  approvePainter,
  updatePainter,
  getUsers,
  getBids,
  sendNotification,
};