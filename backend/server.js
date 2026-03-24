require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { setIO } = require('./utils/socketEmitter');
const { startAuctionCron } = require('./utils/auctionCron');
const errorHandler = require('./middlewares/errorHandler');

const adminRoutes = require('./routes/adminRoutes');
const painterRoutes = require('./routes/painterRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
cors: {
origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
methods: ['GET', 'POST']
}
});


// Connect MongoDB
connectDB();


// Set socket globally
setIO(io);


// Middlewares
app.use(helmet());

app.use(cors({
origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000'
}));

app.use(express.json());

app.use(morgan('dev'));


// Rate limiter
const authLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 10,
message: { message: 'Too many requests. Try later.' }
});

app.use('/api/admin/login', authLimiter);
app.use('/api/painter/login', authLimiter);
app.use('/api/painter/register', authLimiter);
app.use('/api/user/login', authLimiter);
app.use('/api/user/register', authLimiter);


// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/painter', painterRoutes);
app.use('/api/user', userRoutes);


app.get('/api/health', (req, res) => {

res.json({
status: 'OK',
time: new Date()
});

});


// SOCKET CONNECTION
io.on('connection', (socket) => {

console.log(`🔌 Socket connected: ${socket.id}`);


// Join auction room
socket.on('join:auction', (auctionId) => {

socket.join(`auction:${auctionId}`);

console.log(`User joined auction:${auctionId}`);

});


// Leave auction room
socket.on('leave:auction', (auctionId) => {

socket.leave(`auction:${auctionId}`);

});


// Personal notification room
socket.on('join:user', (userId) => {

socket.join(`user:${userId}`);

});


socket.on('disconnect', () => {

console.log(`❌ Socket disconnected: ${socket.id}`);

});

});


// Error handler
app.use(errorHandler);


// Start auction cron job
startAuctionCron();


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

console.log(`🚀 PixelBox Server running on port ${PORT}`);

});