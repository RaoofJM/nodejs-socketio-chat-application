const http = require("http");

const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static Folder
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server started on 3000`);
});

// Setup Websocket
let users = [];

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const id = 123456;

  if (token == undefined) {
    console.log("fuck u");
  } else if (token != id) {
    console.log("fuck u two");
  } else {
    next();
  }
});

const chatNameSpace = io.of("/chat");

chatNameSpace.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Listening
  socket.on("disconnect", (data) => {
    const index = users.findIndex((s) => s.id == socket.id);
    if (index != -1) users.splice(index, 1);
    chatNameSpace.emit("online", users);
    console.log("User Disconnected");
  });

  socket.on("chat message", (data) => {
    const date = new Date();
    let hours = date.getHours();
    let miniutes = date.getMinutes();
    if (+hours <= 9) {
      hours = `0${hours}`;
    }
    if (+miniutes <= 9) {
      miniutes = `0${hours}`;
    }
    data.date = `${hours}:${miniutes}`;
    chatNameSpace.to(data.roomNumber).emit("chat message", data);
  });

  socket.on("typing", (data) => {
    socket.broadcast
      .in(data.roomNumber)
      .emit("typing", `${data.name} is typing...`);
  });

  socket.on("login", (data) => {
    users.push({
      id: socket.id,
      name: data.nickname,
      roomNumber: data.roomNumber,
    });
    socket.join(data.roomNumber);

    chatNameSpace.emit("online", users);
    console.log(`${data.nickname} connected`);
  });

  socket.on("pvChat", (data) => {
    chatNameSpace.to(data.to).emit("pvChat", data);
  });
});
