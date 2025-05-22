const { v4: uuidv4 } = require('uuid');

const generateRoomId = () => uuidv4(); // Generates unique room IDs

module.exports = generateRoomId;
