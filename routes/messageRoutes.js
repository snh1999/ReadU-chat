const express = require('express');
const messageController = require('../controllers/messageController');
const authController = require('../controllers/authController');

const router = express.Router();

//messages
router
  .route('/')
  .get(authController.protected, messageController.getAllMessages) //all messages
  .post(authController.protected, messageController.initiateMessage) //find user to send message
  .delete(authController.protected, messageController.deleteAllMessages); //delete all messages

router
  .route('/:id')
  .get(authController.protected, messageController.getMessage) //view chat
  .patch(authController.protected, messageController.updateMessageName) //update conversation name
  .post(authController.protected, messageController.sendMessage) //send message
  .delete(authController.protected, messageController.deleteMessage); //delete chat

router
  .route('/:id/:cid')
  .delete(authController.protected, messageController.deleteChat); //delete one message

module.exports = router;
