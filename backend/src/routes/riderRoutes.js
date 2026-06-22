const express = require("express");
const router = express.Router();

const {
  getRiderPage,
  getActiveRiders
} = require("../controllers/riderController");

router.get(
  "/rider/:riderId",
  getRiderPage
);

router.get(
  "/riders",
  getActiveRiders
);

module.exports = router;