import crypto from "crypto";
import "dotenv/config";
import express from "express";
import fs from "fs/promises";
import http from "http";
import multer from "multer";
import path, { dirname } from "path";
import { Server as SocketIoServer } from "socket.io";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 1869;
const LIGHTNING_ACCESS_CODE = process.env.LIGHTNING_ACCESS_CODE || "";
const UPLOADS_DIR = path.join(__dirname, "uploads");
const DB_PATH = path.join(__dirname, "lightning.db");
const FILE_EXPIRATION_MINUTES = 10;
const CLEANUP_INTERVAL_MINUTES = 5;

if (!LIGHTNING_ACCESS_CODE) {
  console.warn(
    "Warning: LIGHTNING_ACCESS_CODE is not set. Lightning feature will not be secure.",
  );
}

const app = express();
const server = http.createServer(app);
const io = new SocketIoServer(server);

const log = (level, message, ...args) => {
  console.log(
    `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`,
    ...args,
  );
};

const initializeDatabase = async () => {
  try {
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });
    await db.exec(`CREATE TABLE IF NOT EXISTS lightning_files (
      id TEXT PRIMARY KEY,
      originalname TEXT NOT NULL,
      size INTEGER NOT NULL,
      upload_time TEXT NOT NULL
    )`);
    log("info", "Database initialized successfully.");
    return db;
  } catch (error) {
    log("error", "Failed to initialize database:", error);
    process.exit(1);
  }
};

const db = await initializeDatabase();

const cleanupExpiredFiles = async () => {
  log("info", "Running expired files cleanup job...");
  const expirationTime = new Date(
    Date.now() - FILE_EXPIRATION_MINUTES * 60 * 1000,
  ).toISOString();

  try {
    const expiredFiles = await db.all(
      "SELECT id FROM lightning_files WHERE upload_time < ?",
      [expirationTime],
    );

    if (expiredFiles.length === 0) {
      log("info", "No expired files to clean up.");
      return;
    }

    log("info", `Found ${expiredFiles.length} expired file(s).`);

    for (const file of expiredFiles) {
      const filePath = path.join(UPLOADS_DIR, file.id);
      try {
        await fs.unlink(filePath);
        await db.run("DELETE FROM lightning_files WHERE id = ?", [file.id]);
        log("info", `Cleaned up expired file: ${file.id}`);
      } catch (err) {
        if (err.code === "ENOENT") {
          log(
            "warn",
            `File not found for deletion, removing DB entry: ${file.id}`,
          );
          await db.run("DELETE FROM lightning_files WHERE id = ?", [file.id]);
        } else {
          log("error", `Error cleaning up file ${file.id}:`, err);
        }
      }
    }
  } catch (err) {
    log("error", "Error during cleanup job:", err);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, crypto.randomUUID());
  },
});
const upload = multer({ storage });

app.use(express.json());

app.post("/api/lightning-validate-code", (req, res) => {
  const { code } = req.body;
  const isValid = !!LIGHTNING_ACCESS_CODE && code === LIGHTNING_ACCESS_CODE;
  log(
    "info",
    `Validation attempt for code "${code ? "***" : "empty"}": ${isValid ? "Success" : "Failure"}`,
  );
  res.json({ valid: isValid });
});

app.post(
  "/api/lightning-upload",
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (req.body.code !== LIGHTNING_ACCESS_CODE) {
        log("warn", "Invalid access code on upload attempt.");
        return res
          .status(403)
          .json({ success: false, error: "Invalid access code" });
      }
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No file uploaded" });
      }

      const { filename: id, originalname, size } = req.file;
      const upload_time = new Date().toISOString();

      await db.run(
        "INSERT INTO lightning_files (id, originalname, size, upload_time) VALUES (?, ?, ?, ?)",
        [id, originalname, size, upload_time],
      );

      log(
        "info",
        `File uploaded: ${originalname} (${size} bytes) with ID: ${id}`,
      );
      res.status(200).json({ success: true, id });
    } catch (error) {
      next(error);
    }
  },
);

const getFileMetadata = async (id) => {
  const row = await db.get("SELECT * FROM lightning_files WHERE id = ?", [id]);
  if (!row) return null;

  const uploadTime = new Date(row.upload_time);
  const now = new Date();
  const ageMinutes = (now.getTime() - uploadTime.getTime()) / (1000 * 60);

  if (ageMinutes > FILE_EXPIRATION_MINUTES) {
    log("info", `Attempt to access expired file: ${id}`);
    return null;
  }
  return row;
};

app.get("/api/lightning-metadata/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const metadata = await getFileMetadata(id);

    if (!metadata) {
      return res
        .status(404)
        .json({ success: false, error: "File not found or has expired" });
    }

    res.json({
      success: true,
      data: {
        originalname: metadata.originalname,
        size: metadata.size,
        upload_time: metadata.upload_time,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/file-download/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const metadata = await getFileMetadata(id);

    if (!metadata) {
      return res.status(404).send("File not found or has expired.");
    }

    const filePath = path.join(UPLOADS_DIR, id);
    res.download(filePath, metadata.originalname, (err) => {
      if (err) {
        log("error", `Download error for file ${id}:`, err);
      } else {
        log("info", `File downloaded: ${metadata.originalname} (ID: ${id})`);
      }
    });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.use((err, req, res, next) => {
  log("error", "An unhandled error occurred:", err);
  res.status(500).json({ success: false, error: "Internal Server Error" });
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
      io.to(targetSocketId).emit("join", room, true);
      socket.emit("join", room, false);
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
        break;
      }
    }
  });
});

const startServer = async () => {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  cleanupExpiredFiles();
  setInterval(cleanupExpiredFiles, CLEANUP_INTERVAL_MINUTES * 60 * 1000);

  server.listen(PORT, () => {
    log("info", `Server is running on port ${PORT}`);
  });
};

startServer();
