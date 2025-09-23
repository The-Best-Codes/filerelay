const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 1869;

app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Fallback to serve index.html for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

const clients = {};

io.on("connection", (socket) => {
  const clientId = Math.random().toString(36).substring(2, 8);
  clients[clientId] = socket.id;
  socket.emit("clientId", clientId);

  socket.on("ping", () => {
    socket.emit("pong");
  });

  socket.on("connect to", (targetId) => {
    const targetSocketId = clients[targetId];
    if (targetSocketId) {
      const room = Math.random().toString(36).substring(2, 8);
      socket.join(room);
      io.to(targetSocketId).emit("join", room, true); // isInitiator = true
      socket.emit("join", room, false); // isInitiator = false
    }
  });

  socket.on("join", (room) => {
    socket.join(room);
    io.to(room).emit("ready");
  });

  socket.on("message", (message, room) => {
    socket.to(room).emit("message", message);
  });

  socket.on("disconnect", () => {
    for (const id in clients) {
      if (clients[id] === socket.id) {
        delete clients[id];
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Signaling server is running on port ${PORT}`);
});
