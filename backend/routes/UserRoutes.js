const express = require('express');
const router = express.Router();
const userController = require('../controller/UserController');
const { verifyToken } = require('../middleware/AuthToken');

router.get('/rentals', userController.getAvailableRentals);

router.get('/rentals/featured', userController.getFeaturedRentals);

router.get('/measurements', verifyToken, userController.getMyMeasurements);

router.get('/rentals/search', userController.searchRentals);

router.get('/rentals/categories', userController.getCategories);

router.get('/rentals/category/:category', userController.getRentalsByCategory);

router.get('/rentals/:id', userController.getRentalDetails);

router.get('/rentals/:id/similar', userController.getSimilarRentals);

module.exports = router;
