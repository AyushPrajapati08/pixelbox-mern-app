const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');
const { generateToken } = require('../utils/generateToken');
const { emitToRoom, emitToUser } = require('../utils/socketEmitter');

// ================= REGISTER =================
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone: phone || '' });

    res.status(201).json({
      success: true,
      token: generateToken(user._id, 'user'),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('USER REGISTER ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isActive)
      return res.status(403).json({ message: 'Account deactivated' });

    res.json({
      success: true,
      token: generateToken(user._id, 'user'),
      user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage },
    });
  } catch (error) {
    console.error('USER LOGIN ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= PROFILE =================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    console.error('GET PROFILE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, profileImage },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    console.error('UPDATE PROFILE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= AUCTIONS =================
const getAuctions = async (req, res) => {
  try {
    const { page = 1, limit = 12, status, category, search, minBid, maxBid, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) query.paintingName = { $regex: search, $options: 'i' };
    if (minBid || maxBid) {
      query.currentBid = {};
      if (minBid) query.currentBid.$gte = Number(minBid);
      if (maxBid) query.currentBid.$lte = Number(maxBid);
    }

    const auctions = await Auction.find(query)
      .populate('painter', 'name profileImage')
      .sort({ isFeatured: -1, [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Auction.countDocuments(query);
    res.json({ success: true, auctions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('GET AUCTIONS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

const getAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('painter', 'name bio profileImage portfolio')
      .populate('highestBidder', 'name')
      .populate('winner', 'name');
    if (!auction) return res.status(404).json({ message: 'Auction not found' });

    const bids = await Bid.find({ auction: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, auction, bids });
  } catch (error) {
    console.error('GET AUCTION ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= BID =================
const placeBid = async (req, res) => {
  try {
    const { auctionId, amount } = req.body;
    const auction = await Auction.findById(auctionId);

    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    if (auction.status !== 'LIVE') return res.status(400).json({ message: 'Auction is not live' });
    if (new Date() > auction.endTime) return res.status(400).json({ message: 'Auction has ended' });
    if (auction.painter.toString() === req.user.id)
      return res.status(400).json({ message: 'Painters cannot bid on their own auctions' });

    const minRequired = auction.currentBid + auction.minimumIncrement;
    if (amount < minRequired)
      return res.status(400).json({ message: `Bid must be at least ${minRequired}` });

    // Mark previous winning bid as not winning
    if (auction.highestBidder) {
      await Bid.updateMany({ auction: auctionId, isWinning: true }, { isWinning: false });

      const outbidNotification = await Notification.create({
        recipient: auction.highestBidder,
        recipientModel: 'User',
        type: 'outbid',
        message: `You've been outbid on "${auction.paintingName}". New bid: $${amount}`,
        auction: auctionId,
      });
      emitToUser(auction.highestBidder, 'bid:outbid', { message: outbidNotification.message, auctionId });
    }

    // Create new bid
    const bid = await Bid.create({ auction: auctionId, user: req.user.id, amount, isWinning: true });

    // Update auction
    auction.currentBid = amount;
    auction.highestBidder = req.user.id;
    auction.bids.push(bid._id);
    await auction.save();

    // Update user's winning bids
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { winningBids: bid._id } });

    // Broadcast to auction room
    const user = await User.findById(req.user.id).select('name');
    emitToRoom(`auction:${auctionId}`, 'bid:new', {
      amount,
      bidder: user.name,
      auctionId,
      timestamp: bid.createdAt,
      currentBid: amount,
    });

    res.status(201).json({ success: true, bid, currentBid: amount });
  } catch (error) {
    console.error('PLACE BID ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= USER BIDS =================
const getMyBids = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const bids = await Bid.find({ user: req.user.id })
      .populate('auction', 'paintingName image status currentBid')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Bid.countDocuments({ user: req.user.id });
    res.json({ success: true, bids, total });
  } catch (error) {
    console.error('GET MY BIDS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= WINS =================
const getWins = async (req, res) => {
  try {
    const auctions = await Auction.find({ winner: req.user.id, status: 'ENDED' })
      .populate('painter', 'name')
      .sort({ updatedAt: -1 });
    res.json({ success: true, auctions });
  } catch (error) {
    console.error('GET WINS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ================= NOTIFICATIONS =================
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id, recipientModel: 'User' })
      .sort({ createdAt: -1 })
      .limit(50);

    // mark all as read
    await Notification.updateMany({ recipient: req.user.id, recipientModel: 'User', isRead: false }, { isRead: true });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('GET NOTIFICATIONS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getProfile, updateProfile, getAuctions, getAuction, placeBid, getMyBids, getWins, getNotifications };