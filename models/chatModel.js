const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    chatText: {
      type: String,
      required: [true, 'please write something'],
    },
    sentAt: {
      type: Date,
      default: Date.now(),
    },
    message: {
      type: mongoose.Schema.ObjectId,
      ref: 'Message',
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  { collection: 'chats' }
);

chatSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'sender',
    select: 'name',
  });
  next();
});

const Chat = mongoose.model('Chats', chatSchema);
module.exports = Chat;
