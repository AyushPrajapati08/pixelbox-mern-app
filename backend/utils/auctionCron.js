const cron = require('node-cron');
const Auction = require('../models/Auction');
const Notification = require('../models/Notification');
const { emitToRoom } = require('./socketEmitter');

const startAuctionCron = () => {

cron.schedule('* * * * *', async () => {

try {

const now = new Date();


// -----------------------------
// START AUCTIONS
// -----------------------------

const startingAuctions = await Auction.find({
status: 'UPCOMING',
startTime: { $lte: now },
endTime: { $gt: now }
});

for (const auction of startingAuctions) {

auction.status = 'LIVE';
await auction.save();

emitToRoom(`auction:${auction._id}`, 'auction:statusChange', {
status: 'LIVE'
});

console.log(`🚀 Auction started: ${auction.paintingName}`);

}


// -----------------------------
// END AUCTIONS
// -----------------------------

const endingAuctions = await Auction.find({
status: 'LIVE',
endTime: { $lte: now }
});

for (const auction of endingAuctions) {

auction.status = 'ENDED';


// Declare winner
if (auction.highestBidder) {

auction.winner = auction.highestBidder;


// Notification
await Notification.create({

recipient: auction.highestBidder,
recipientModel: 'User',
type: 'winner',
message: `🎉 You won "${auction.paintingName}" with $${auction.currentBid}`,
auction: auction._id

});


// Socket notification
emitToRoom(`auction:${auction._id}`, 'auction:winner', {

winnerId: auction.highestBidder,
amount: auction.currentBid,
auctionId: auction._id

});

}

await auction.save();

emitToRoom(`auction:${auction._id}`, 'auction:statusChange', {
status: 'ENDED'
});

console.log(`🏁 Auction ended: ${auction.paintingName}`);

}

}
catch (error) {

console.error('Cron job error:', error.message);

}

});

console.log('🕐 Auction cron job started');

};

module.exports = { startAuctionCron };