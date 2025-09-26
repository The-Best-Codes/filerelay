const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
require("dotenv").config();

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
  },
});
const upload = multer({ storage: storage });

app.use(express.json());

const accessCode = process.env.LIGHTNING_ACCESS_CODE || "";
console.log("Access code loaded:", accessCode ? "***" : "empty");

// Lightning API Routes

app.post("/api/lightning-validate-code", (req, res) => {
  const { code } = req.body;
  res.json({ valid: code === accessCode });
});

app.post("/api/lightning-upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  if (!req.body.code) {
    return res.status(400).json({ error: "No access code provided" });
  }
  if (req.body.code !== accessCode) {
    console.log(
      "Received code:",
      req.body.code,
      "Expected:",
      accessCode ? "***" : "empty",
    );
    return res.status(400).json({ error: "Invalid access code" });
  }

  const id = req.file.filename;
  const originalname = req.file.originalname;
  const size = req.file.size;
  const upload_time = new Date().toISOString();

  db.run(
    "INSERT INTO lightning_files (id, originalname, size, upload_time) VALUES (?, ?, ?, ?)",
    [id, originalname, size, upload_time],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }

      // Delete after 10 minutes
      setTimeout(
        () => {
          fs.unlink(path.join(uploadsDir, id), (unlinkErr) => {
            if (unlinkErr) console.error("Delete file error:", unlinkErr);
          });
          db.run(
            "DELETE FROM lightning_files WHERE id = ?",
            [id],
            (deleteErr) => {
              if (deleteErr) console.error("Delete DB error:", deleteErr);
            },
          );
        },
        10 * 60 * 1000,
      );

      res.json({ id });
    },
  );
});

app.get("/api/lightning-metadata/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM lightning_files WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.status(404).json({ error: "File not found" });
    }

    const uploadTime = new Date(row.upload_time);
    const now = new Date();
    const diff = (now.getTime() - uploadTime.getTime()) / (1000 * 60);

    if (diff > 10) {
      // Expired, delete
      fs.unlink(path.join(uploadsDir, id), (unlinkErr) => {
        if (unlinkErr) console.error("Delete expired file:", unlinkErr);
      });
      db.run("DELETE FROM lightning_files WHERE id = ?", [id]);
      return res.status(404).json({ error: "Expired" });
    }

    res.json({ originalname: row.originalname, size: row.size });
  });
});

app.get("/api/file-download/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM lightning_files WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }

    if (!row) {
      return res.status(404).send("Not found");
    }

    const uploadTime = new Date(row.upload_time);
    const now = new Date();
    const diff = (now.getTime() - uploadTime.getTime()) / (1000 * 60);

    if (diff > 10) {
      // Expired, delete
      fs.unlink(path.join(uploadsDir, id), (unlinkErr) => {
        if (unlinkErr) console.error("Delete expired file:", unlinkErr);
      });
      db.run("DELETE FROM lightning_files WHERE id = ?", [id]);
      return res.status(404).send("Not found");
    }

    const filePath = path.join(uploadsDir, id);
    res.download(filePath, row.originalname, (downloadErr) => {
      if (downloadErr) {
        console.error("Download error:", downloadErr);
      }
      // Note: File deletion is handled by the 10-min timeout from upload, not here
    });
  });
});

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
