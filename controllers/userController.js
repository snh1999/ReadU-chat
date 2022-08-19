const catchAsync = require('../util/catchAsync');
const AppError = require('../util/AppError');
const User = require('../models/userModel');
//functions
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

///api/v1/users
//all messages
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    result: users.length, // messages.length,
    data: {
      users,
    },
  });
});
//create user admin
exports.createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  res.status(200).json({
    status: 'success',
    data: {
      newUser,
    },
  });
});

//particular view user data
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('Nothing found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

//update user
exports.updateUser = (req, res) => {
  console.log(req.body);
  res.send('done');
};
exports.updateMe = catchAsync(async (req, res, next) => {
  //password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('Please use /updatepassword to change your password', 400)
    );
  }

  // unwanted fields names not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  //Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
//delete one
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new AppError('Nothing found', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
