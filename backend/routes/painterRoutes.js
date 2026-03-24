const express = require('express');
const router = express.Router();
const { requirePainter, verifyToken } = require('../middlewares/auth');
const {
  register, login, getProfile, updateProfile,
  getMyAuctions, createAuction, updateAuction, deleteAuction,
  getAuctionBids, getNotifications,
} = require('../controllers/painterController');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', requirePainter, updateProfile);
router.get('/auctions', requirePainter, getMyAuctions);
router.post('/auctions', requirePainter, createAuction);
router.put('/auctions/:id', requirePainter, updateAuction);
router.delete('/auctions/:id', requirePainter, deleteAuction);
router.get('/auctions/:id/bids', requirePainter, getAuctionBids);
router.get('/notifications', requirePainter, getNotifications);

module.exports = router;
