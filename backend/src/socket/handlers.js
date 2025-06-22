import { logger } from '../middleware/index.js';

export function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    // Join disaster-specific rooms
    socket.on('join_disaster', (disasterId) => {
      socket.join(`disaster_${disasterId}`);
      logger.info(`Client ${socket.id} joined disaster room: ${disasterId}`);
    });
    
    // Leave disaster rooms
    socket.on('leave_disaster', (disasterId) => {
      socket.leave(`disaster_${disasterId}`);
      logger.info(`Client ${socket.id} left disaster room: ${disasterId}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });
    
    // Send initial connection status
    socket.emit('connection_status', {
      connected: true,
      timestamp: new Date().toISOString()
    });
  });
  
  // Broadcast system-wide updates
  setInterval(() => {
    io.emit('system_heartbeat', {
      timestamp: new Date().toISOString(),
      active_connections: io.engine.clientsCount
    });
  }, 30000); // Every 30 seconds
  
  logger.info('Socket.IO handlers initialized');
}

// Helper function to emit to specific disaster room
export function emitToDisasterRoom(io, disasterId, event, data) {
  io.to(`disaster_${disasterId}`).emit(event, data);
}