require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Painter = require('./models/Painter');
const User = require('./models/User');
const Auction = require('./models/Auction');
const Bid = require('./models/Bid');

const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    Admin.deleteMany(),
    Painter.deleteMany(),
    User.deleteMany(),
    Auction.deleteMany(),
    Bid.deleteMany(),
  ]);

  console.log('🗑️  Cleared existing data');

  // Create Admin
  const admin = await Admin.create({
    name: 'Super Admin',
    email: 'admin@pixelbox.com',
    password: 'Admin@123',
    role: 'superadmin',
  });
  console.log('✅ Admin created:', admin.email);

  // Create Painters
  const painter1 = await Painter.create({
    name: 'Leonardo DaVinci',
    email: 'leonardo@pixelbox.com',
    password: 'Painter@123',
    bio: 'Renaissance master of oil paintings',
    portfolio: 'https://portfolio.example.com/leo',
    isApproved: true,
    isActive: true,
  });

  const painter2 = await Painter.create({
    name: 'Frida Kahlo',
    email: 'frida@pixelbox.com',
    password: 'Painter@123',
    bio: 'Mexican surrealist painter known for self-portraits',
    isApproved: true,
    isActive: true,
  });

  const painter3 = await Painter.create({
    name: 'Pending Artist',
    email: 'pending@pixelbox.com',
    password: 'Painter@123',
    bio: 'Awaiting approval',
    isApproved: false,
    isActive: true,
  });

  console.log('✅ Painters created');

  // Create Users
  const user1 = await User.create({
    name: 'John Bidder',
    email: 'john@pixelbox.com',
    password: 'User@123',
    phone: '555-0101',
  });

  const user2 = await User.create({
    name: 'Jane Collector',
    email: 'jane@pixelbox.com',
    password: 'User@123',
    phone: '555-0102',
  });

  console.log('✅ Users created');

  // Create Auctions
  const now = new Date();
  const auction1 = await Auction.create({
    paintingName: 'Starry Night Redux',
    category: 'Oil',
    image: 'https://picsum.photos/seed/art1/800/600',
    description: 'A breathtaking oil painting inspired by Van Gogh',
    painter: painter1._id,
    startingBid: 500,
    currentBid: 750,
    minimumIncrement: 50,
    startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
    status: 'LIVE',
    isFeatured: true,
  });

  const auction2 = await Auction.create({
    paintingName: 'Garden in Bloom',
    category: 'Watercolor',
    image: 'https://picsum.photos/seed/art2/800/600',
    description: 'Vibrant watercolor of spring flowers',
    painter: painter2._id,
    startingBid: 300,
    currentBid: 300,
    minimumIncrement: 25,
    startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
    endTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
    status: 'UPCOMING',
  });

  const auction3 = await Auction.create({
    paintingName: 'Abstract Dreams',
    category: 'Digital',
    image: 'https://picsum.photos/seed/art3/800/600',
    description: 'Digital art exploring subconscious patterns',
    painter: painter1._id,
    startingBid: 200,
    currentBid: 200,
    minimumIncrement: 20,
    startTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // ended 1 hour ago
    status: 'ENDED',
    winner: user1._id,
    highestBidder: user1._id,
  });

  // Update painters with auction refs
  await Painter.findByIdAndUpdate(painter1._id, { auctions: [auction1._id, auction3._id] });
  await Painter.findByIdAndUpdate(painter2._id, { auctions: [auction2._id] });

  // Create some bids
  const bid1 = await Bid.create({ auction: auction1._id, user: user1._id, amount: 600, isWinning: false });
  const bid2 = await Bid.create({ auction: auction1._id, user: user2._id, amount: 700, isWinning: false });
  const bid3 = await Bid.create({ auction: auction1._id, user: user1._id, amount: 750, isWinning: true });

  await Auction.findByIdAndUpdate(auction1._id, {
    bids: [bid1._id, bid2._id, bid3._id],
    highestBidder: user1._id,
  });

  console.log('✅ Auctions and Bids created');
  console.log('\n📋 Login Credentials:');
  console.log('Admin:   admin@pixelbox.com / Admin@123');
  console.log('Painter: leonardo@pixelbox.com / Painter@123');
  console.log('Painter: frida@pixelbox.com / Painter@123');
  console.log('User:    john@pixelbox.com / User@123');
  console.log('User:    jane@pixelbox.com / User@123');

  mongoose.connection.close();
  console.log('\n🌱 Database seeded successfully!');
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
