const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('unhandled rejection! shutting down');
  process.exit(1);
});
dotenv.config({ path: './config.env' });

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('connected to database'));
//start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening to ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('unhandled rejection! shutting down');
  server.close(() => {
    process.exit(1);
  });
});
