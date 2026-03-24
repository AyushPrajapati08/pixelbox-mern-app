const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../middlewares/auth');

const {
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
} = require('../controllers/adminController');


// ===============================
// AUTH ROUTES
// ===============================
router.post('/register', registerAdmin); // Temporary - remove after creating admin
router.post('/login', login);


// ===============================
// DASHBOARD
// ===============================
router.get('/dashboard', requireAdmin, getDashboard);


// ===============================
// AUCTIONS
// ===============================
router.get('/auctions', requireAdmin, getAuctions);
router.post('/auctions', requireAdmin, createAuction);
router.put('/auctions/:id', requireAdmin, updateAuction);
router.delete('/auctions/:id', requireAdmin, deleteAuction);
router.patch('/auctions/:id/status', requireAdmin, updateAuctionStatus);
router.patch('/auctions/:id/feature', requireAdmin, toggleFeature);


// ===============================
// PAINTERS
// ===============================
router.get('/painters', requireAdmin, getPainters);
router.patch('/painters/:id/approve', requireAdmin, approvePainter);
router.put('/painters/:id', requireAdmin, updatePainter);


// ===============================
// USERS & BIDS
// ===============================
router.get('/users', requireAdmin, getUsers);
router.get('/bids', requireAdmin, getBids);


// ===============================
// NOTIFICATIONS
// ===============================
router.post('/notify', requireAdmin, sendNotification);


module.exports = router;