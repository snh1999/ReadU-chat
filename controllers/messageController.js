const Message = require('../models/messageModel');
const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const AppError = require('../util/AppError');
const catchAsync = require('../util/catchAsync');

//const SearchStringFeatures = require('../util/searchStringFeatures');
////=============functions
// const sentBefore = function () {
//   const diff = Math.abs(Date.now() - this.sentAt);
//   const diffTime = Math.floor(diff / (1000 * 60 * 60)); //in hours
//   if (!diffTime) {
//     return `${Math.floor(diff / (1000 * 60))} min`; //in minutes
//   }
//   return `${diffTime} hr`;
//};

///api/v1/messages
//all messages
exports.getAllMessages = catchAsync(async (req, res, next) => {
  const userId = req.user.id; //from jwt
  const message = await Message.find({
    $or: [{ access1: userId }, { access2: userId }],
  });
  res.status(200).json({
    status: 'success',
    data: {
      message,
    },
  });
});

//particular chat initiate
exports.initiateMessage = catchAsync(async (req, res, next) => {
  const { handle, messagePasscode } = req.body;
  if (!handle || !messagePasscode) {
    return next(
      new AppError(
        'please provide userhandle and passcode to start conversation',
        400
      )
    );
  }
  const user = await User.findOne({ handle });
  if (!user || !(messagePasscode === user.messagePasscode)) {
    return next(new AppError('Incorrect userhandle or passcode', 401));
  }
  const newMessage = await Message.create({
    access1: req.user._id, //auto fetch from jwt
    access2: user._id,
    title: req.body.title, //not mandatory
  });
  res.status(200).json({
    status: 'success',
    result: 0, // messages.length,
    data: {
      message: newMessage,
    },
  });
});
//delete all
exports.deleteAllMessages = catchAsync(async (req, res, next) => {
  const userId = req.user._id; //from jwt
  await Message.deleteMany({
    $or: [{ access1: userId }, { access2: userId }],
  });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
//functions
///api/v1/messages/:id

//particular chat
exports.getMessage = catchAsync(async (req, res, next) => {
  //limited results
  // const features = new SearchStringFeatures(
  //   Message.findById(req.params.id),
  //   req.query
  // )
  //   .filter()
  //   .sort()
  //   .limitedFields()
  //   .pagination();
  // const message = await features.query;

  const message = await Message.findOne({ _id: req.params.id }).populate(
    'chats'
  );

  if (!message) {
    return next(new AppError('Nothing found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      message,
    },
  });
});
//send Message
// exports.sendMessage = catchAsync(async (req, res) => {
//   const newMessage = await Chat.create({
//     messageId: req.params.id,
//     messageText: req.body.messageText,
//   });
//   res.status(201).json({
//     status: 'success',
//     data: {
//       message: newMessage,
//     },
//   });
// });

//pseudo
//async await
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { chatText } = req.body;
  if (!chatText) {
    return next(new AppError('Empty Message', 400));
  }
  const newChat = await Chat.create({
    chatText: req.body.chatText,
    messageID: req.params.id,
    sender: req.user._id,
  });
  res.status(200).json({
    status: 'success',
    result: 0, // messages.length,
    data: {
      newChat,
    },
  });
});
//update name
exports.updateMessageName = catchAsync(async (req, res, next) => {
  const message = await Message.findByIdAndUpdate(req.params.id, {
    title: req.body.title,
  });
  if (!message) {
    return next(new AppError('Nothing found', 404));
  }
  res.status(204).json({
    status: 'success',
    data: {
      message,
    },
  });
});
//delete one
exports.deleteMessage = catchAsync(async (req, res, next) => {
  const message = await Message.findByIdAndDelete(req.params.id);
  if (!message) {
    return next(new AppError('Nothing found', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

///api/v1/messages/:id/:cid
//delete message

// async await
exports.deleteChat = catchAsync( async(req, res, next) => {
  const chat = await Chat.findByIdAndDelete(req.params.cid);
  if (!chat) {
    return next(new AppError('Nothing found', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
