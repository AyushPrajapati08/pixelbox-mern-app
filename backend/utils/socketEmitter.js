let io;

const setIO = (socketIO) => {
  io = socketIO;
};

const getIO = () => io;

const emitToRoom = (room, event, data) => {
  if (io) io.to(room).emit(event, data);
};

const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

module.exports = { setIO, getIO, emitToRoom, emitToUser };
