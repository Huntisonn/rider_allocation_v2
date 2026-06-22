require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const socketHandler = require("./sockets/socketHandler");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

// Make io accessible inside controllers via req.app.get("io")
app.set("io", io);

socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});