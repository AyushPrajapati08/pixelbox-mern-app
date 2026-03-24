const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Painter = require('../models/Painter');
const User = require('../models/User');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Admin only
const requireAdmin = async (req, res, next) => {
  await verifyToken(req, res, async () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(403).json({ message: 'Admin not found' });
    req.admin = admin;
    next();
  });
};

// Painter only (approved)
const requirePainter = async (req, res, next) => {
  await verifyToken(req, res, async () => {
    if (req.user.role !== 'painter') {
      return res.status(403).json({ message: 'Access denied: Painter only' });
    }
    const painter = await Painter.findById(req.user.id);
    if (!painter) return res.status(403).json({ message: 'Painter not found' });
    if (!painter.isApproved) {
      return res.status(403).json({ message: 'Your account is pending admin approval' });
    }
    if (!painter.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    req.painter = painter;
    next();
  });
};

// User only
const requireUser = async (req, res, next) => {
  await verifyToken(req, res, async () => {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Access denied: User only' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(403).json({ message: 'User not found' });
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    req.currentUser = user;
    next();
  });
};

// Optional auth (public routes that benefit from knowing who user is)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    next();
  } catch {
    next();
  }
};

module.exports = { verifyToken, requireAdmin, requirePainter, requireUser, optionalAuth };
