const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const server = http.createServer(app);

const io = new Server(server);

const rooms = {};
app.use(express.static(path.join(__dirname, "client")));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html");
});
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
  socket.on("createGame", () => {
    const roomUniqueId = makeid(6);
    rooms[roomUniqueId] = {};
    socket.join(roomUniqueId);
    socket.emit("newGame", { roomUniqueId: roomUniqueId });
  });
  socket.on("joinGame", (data) => {
    if (rooms[data.roomUniqueId] != null) {
      socket.join(data.roomUniqueId);
      socket.to(data.roomUniqueId).emit("playersConnected", {});
      socket.emit("playersConnected");
    }
  });
  socket.on("p1Choice", (data) => {
    let rpsValue = data.rpsValue;
    rooms[data.roomUniqueId].p1Choice = rpsValue;
    socket.to(data.roomUniqueId).emit("p1Choice", { rpsValue: data.rpsValue });
    if (rooms[data.roomUniqueId].p2Choice != null) {
      declareWinner(data.roomUniqueId);
    }
  });
  socket.on("p2Choice", (data) => {
    let rpsValue = data.rpsValue;
    rooms[data.roomUniqueId].p2Choice = rpsValue;
    socket.to(data.roomUniqueId).emit("p2Choice", { rpsValue: data.rpsValue });
    if (rooms[data.roomUniqueId].p1Choice != null) {
      declareWinner(data.roomUniqueId);
    }
  });
});

function declareWinner(roomUniqueId) {
  let p1Choice = rooms[roomUniqueId].p1Choice;
  let p2Choice = rooms[roomUniqueId].p2Choice;
  let winner = null;
  if (p1Choice == p2Choice) {
    winner = "d";
  } else if (p1Choice == "Paper") {
    p2Choice == "Scissors" ? (winner = "p2") : (winner = "p1");
  } else if (p1Choice == "Scissors") {
    p2Choice == "Rock" ? (winner = "p2") : (winner = "p1");
  } else if (p1Choice == "Rock") {
    p2Choice == "Paper" ? (winner = "p2") : (winner = "p1");
  }
  io.sockets.to(roomUniqueId).emit("result",{
    winner: winner,
  })
  rooms[roomUniqueId].p1Choice=null;
  rooms[roomUniqueId].p2Choice=null;
}
server.listen(3000, () => {
  console.log("listening on port:3000");
});

function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
