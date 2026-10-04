const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const adminAuth = require('../../../middleware/adminAuth');

// Admin Auth Routes
router.post('/register', adminController.registerAdmin); // Note: You may want to disable this in production after creating the initial admin
router.post('/login', adminController.loginAdmin);

// Protected Admin Routes
router.use(adminAuth);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.get('/users/:id/followers', adminController.getUserFollowers);
router.get('/users/:id/following', adminController.getUserFollowing);
router.get('/users/:id/posts', adminController.getUserPosts);

module.exports = router;
