const express = require("express");
const { address } = require("pure-gen");
const useragent = require("useragent");
const app = express();

// If you change this remember to change it on the client side as well
const port = 3000;

app.use(express.static("client"));

const server = app.listen(port, () =>
  console.log(`Listening at http://localhost:${port}`)
);
const io = require("socket.io")(server);

// Initialize candidates
const candidates = {
  0: { votes: 0, label: "Yes", color: "rgb(52, 255, 52)" },
  1: { votes: 0, label: "No", color: "rgb(255, 52, 52)" },
};

const users = {};

const coolDown = 6000;
const magicNumber = 2983198371298371329;

// On new client connection
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  const userAgent = useragent.parse(socket.handshake.headers["user-agent"]);

  const address = socket.handshake.address;

  const id = hash(
    userAgent.os.toString() + userAgent.device.toString() + magicNumber
  );
  const handled = hash(id + address + magicNumber);


  io.emit("update", candidates);

  // On new vote
  socket.on("vote", (index) => {
    if (
      typeof users[handled] === "undefined" 

    //   2nd voting iteration: everyone can vote every 6 seconds  
    //   ||
    //   (typeof users[handled] !== "undefined" &&
    //     users[handled] + coolDown <= Date.now())
    ) {
      // Increase the vote at index
      if (candidates[index]) {
        candidates[index].votes += 1;
      }

      console.log(candidates);

      // Tell everybody else about the new vote
      io.emit("update", candidates);

      users[handled] = Date.now();
    }
  });
});

function hash(s) {
  return s.split("").reduce(function (a, b) {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
}
