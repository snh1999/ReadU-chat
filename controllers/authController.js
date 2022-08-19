const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../util/catchAsync');
const AppError = require('../util/AppError');
const User = require('../models/userModel');
const sendEmail = require('../util/email');
//functions

const signToken = (id) => jwt.sign({ id }, process.env.JWT_PASS);

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    handle: req.body.handle,
    messagePasscode: req.body.messagePasscode,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protected = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access', 401)
    );
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_PASS);
  //if user still exists
  const checkUser = await User.findById(decoded.id);
  if (!checkUser) {
    return next(new AppError('User no longer exists', 401));
  }
  //if password was changed after token issue
  if (checkUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password was changed recently, please log in again'),
      401
    );
  }
  //access to the protected route
  req.user = checkUser;
  res.locals.user = checkUser;
  next();
});

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError('You donot have permission to perform this action', 403)
    );
  }
  next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }); //user from mail
  if (!user) {
    return next(
      new AppError('Invalid email. Please recheck and try again', 404)
    );
  }
  //reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users//resetpassword/${resetToken}`;
  const message = `Forgot password? Follow the link to reset your password: ${resetURL} \n IF you didnot make this request, please ignore this email`;
  try {
    const options = {
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    };
    await sendEmail(options);
    res.status(200).json({
      status: 'success',
      message: 'token send to email',
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordresetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error Occured. Please Try again later', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user form token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  //if token expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordresetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Link invalid or expired', 400));
  }
  //update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //login
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get user
  const user = await User.findById(req.user.id).select('+password');

  // if correct password is entered
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
