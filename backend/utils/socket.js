const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Authorization"],
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    const uuid = uuidv4();
    console.log(`[${new Date().toISOString()}] [${uuid}] Incoming connection attempt`, {
      clientIp: socket.handshake.address,
      userAgent: socket.handshake.headers["user-agent"],
      headers: { origin: socket.handshake.headers.origin },
    });

    const token = socket.handshake.auth.token;
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`[${new Date().toISOString()}] [${uuid}] JWT validated`, {
        userId: decoded.id,
        roles: decoded.roles,
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [${uuid}] JWT validation failed`, error.message);
      socket.disconnect();
      return;
    }

    const userId = decoded.id;
    socket.userId = userId;

    console.log(`[${new Date().toISOString()}] [${uuid}] User connected`, {
      userId,
      socketId: socket.id,
    });

    socket.on("join", ({ role }) => {
      if (role === "Financial Staff" && decoded.roles.includes("Financial Staff")) {
        socket.join("Financial Staff");
        console.log(`[${new Date().toISOString()}] [${uuid}] User joined Financial Staff room`, { userId });
      } else if (role === "Informatic Systems Staff" && decoded.roles.includes("Informatic Systems Staff")) {
        socket.join("Informatic Systems Staff");
        console.log(`[${new Date().toISOString()}] [${uuid}] User joined Informatic Systems Staff room`, { userId });
      } else {
        console.log(`[${new Date().toISOString()}] [${uuid}] User not authorized for ${role} room`, {
          userId,
          roles: decoded.roles,
        });
      }
    });

    io.emit("userCount", { count: io.engine.clientsCount });
    console.log(`[${new Date().toISOString()}] [${uuid}] Emitted userCount`, {
      count: io.engine.clientsCount,
    });

    socket.on("disconnect", () => {
      console.log(`[${new Date().toISOString()}] [${uuid}] User disconnected`, { userId });
      io.emit("userCount", { count: io.engine.clientsCount });
    });
  });

  const emitNewCall = (call) => {
    const uuid = uuidv4();
    console.log(`[${new Date().toISOString()}] [${uuid}] Emitting call-update for call`, {
      callId: call._id,
      status: call.status,
    });
    io.to("Financial Staff").emit("call-update", { type: "call-update", call });
    io.to("Informatic Systems Staff").emit("call-update", { type: "call-update", call });
    console.log(`[${new Date().toISOString()}] [${uuid}] Call-update emitted successfully`, {
      callId: call._id,
    });
  };

  return { io, emitNewCall };
};

module.exports = { initSocket };