const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    //updateable
    title: {
      type: String,
    },
    //autofetched
    access1: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Empty Message'],
    },
    access2: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Empty Message'],
    },
    //update while populate
    sentAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.index(
  {
    access1: 1,
    access2: 1,
  },
  { unique: true }
);

messageSchema.virtual('sentBefore').get(function () {
  const diff = Math.abs(Date.now() - this.sentAt);
  const diffTime = Math.floor(diff / (1000 * 60 * 60)); //in hours
  if (!diffTime) {
    return `${Math.floor(diff / (1000 * 60))} min`; //in minutes
  }
  return `${diffTime} hr`;
});
messageSchema.virtual('chats', {
  ref: 'Chats',
  foreignField: 'messageID',
  localField: '_id',
});

messageSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'access1',
    select: 'name',
  });
  next();
});
messageSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'access2',
    select: 'name',
  });
  next();
});

messageSchema.pre('save', function (next) {
  this.sentAt = Date.now() - 1000; //update last sent time
  next();
});
// messageSchema.pre/post('save/find', function(next) {
//  next();
// });

// messageSchema.pre('aggregate', function(next) {
//  next();
// });

const Message = mongoose.model('Messages', messageSchema);

module.exports = Message;
