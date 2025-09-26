const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 1869;

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, "lightning.db"));
db.run(`CREATE TABLE IF NOT EXISTS lightning_files (
  id TEXT PRIMARY KEY,
  originalname TEXT NOT NULL,
  size INTEGER NOT NULL,
  upload_time TEXT NOT NULL
)`);

// Create uploads directory
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const id = crypto.randomUUID();
    cb(null, id);
  }
});
const upload = multer({ storage: storage });

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
