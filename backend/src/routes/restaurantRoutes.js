const express = require("express");
const router = express.Router();

const {
  getRestaurantPage
} = require("../controllers/restaurantController");

router.get(
  "/restaurant",
  getRestaurantPage
);

module.exports = router;
