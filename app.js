const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const santizer = require('express-mongo-sanitize');

const AppError = require('./util/AppError');
const errorController = require('./controllers/errorController');
const messageRouter = require('./routes/messageRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//middlewires
//sequrity http headers
app.use(helmet());
//dev request log
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//limit requests
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests, Try after sometime',
});
app.use(limiter);
//body parser- body->req.body
app.use(express.json()); //{limit:100kb}
//data sanitization against query injection
app.use(santizer());

//mounted routes
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/users', userRouter);
//all undefined
app.all('*', (req, res, next) => {
  next(new AppError(`cannot find ${req.originalUrl}`, 404));
});
//error handling
app.use(errorController);

module.exports = app;
