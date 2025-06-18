const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, leaveRoom, getRoomInfo } = require('../controller/roomController');

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.post('/leave', leaveRoom);
router.get('/:roomId', getRoomInfo);

module.exports = router;