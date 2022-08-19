const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.post('/forgotpassword', authController.forgotPassword);
router.patch('/resetpassword/:token', authController.resetPassword);
router.patch('/updateMe', authController.protected, userController.updateMe);
router.delete('/deleteMe', authController.protected, userController.deleteMe);
router.patch(
  '/updateMyPassword',
  authController.protected,
  authController.updatePassword
);

//use authController.protect, then authController.restrictTo('admin') for all
router
  .route('/')
  .get(userController.getAllUsers) //all users(admin)
  .post(userController.createUser); //link for registration

router
  .route('/:id')
  .get(userController.getUser) //all users(user profile)
  .patch(userController.updateUser) //edit profile
  .delete(userController.deleteUser); //delete all messages

module.exports = router;
