const express = require("express");
const cors = require("cors");

const riderRoutes =
  require("./routes/riderRoutes");

const orderRoutes =
  require("./routes/orderRoutes");

const restaurantRoutes =
  require("./routes/restaurantRoutes");

const { getHomePage } =
  require("./controllers/homeController");

const app = express();

app.use(cors());
app.use(express.json());

// Landing page — role selector
app.get("/", getHomePage);

// Mounting routers at root (/) to preserve original endpoint contract
app.use(
  "/",
  riderRoutes
);

app.use(
  "/",
  orderRoutes
);

app.use(
  "/",
  restaurantRoutes
);

module.exports = app;