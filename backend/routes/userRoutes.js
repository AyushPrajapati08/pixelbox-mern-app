const express = require('express');
const router = express.Router();
const { requireUser } = require('../middlewares/auth');
const {
  register, login, getProfile, updateProfile,
  getAuctions, getAuction, placeBid, getMyBids, getWins, getNotifications,
} = require('../controllers/userController');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', requireUser, getProfile);
router.put('/profile', requireUser, updateProfile);
router.get('/auctions', getAuctions); // public
router.get('/auctions/:id', getAuction); // public
router.post('/bid', requireUser, placeBid);
router.get('/bids', requireUser, getMyBids);
router.get('/wins', requireUser, getWins);
router.get('/notifications', requireUser, getNotifications);

module.exports = router;
