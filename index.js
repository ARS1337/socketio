const express = require("express");
const { read } = require("fs");
const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { body, validationResult, json } = require("express-validator");
const {
  updateUser,
  insertUser,
  MongoConnect,
  doesUserExists,
} = require("./Mongo");

const userToSocketId = {};
const userList = [];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/first.html");
});

app.post(
  "/socket",
  body("name", "name should atleast be of 1 character")
    .exists()
    .trim()
    .isLength({ min: 1 }),
  body(
    "name",
    "name can only contain alphabets and numbers, no special character"
  ).isAlphanumeric(),
  body("pwd", "password should be of atleast 6 chars")
    .exists()
    .isLength({ min: 6 }),
  body("name").custom(async (value, { req }) => {
    let result = await doesUserExists(value);
    if (!result && req.body.process == "login") {
      return Promise.reject("user name does not exist, sign up first!");
    }
    if (req.body.process == "signup") {
      if (result ? true : false) {
        return Promise.reject(
          "username already exists, try again with a different user name "
        );
      }
    }
  }),
  body("pwd").custom(async (value, { req }) => {
    if (req.body.process == "login") {
      let result = await doesUserExists(req.body.name);
      if (result && result.pwd !== value) {
        return Promise.reject("wrong password");
      }
    }
  }),
  async (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (req.body.process == "signup") {
      let results = await insertUser(req.body.name, req.body.pwd);
    } else {
      // login
      // let results = await doesUserExists(req.body.name);
    }

    res.cookie("userName", req.body.name);
    res.cookie("pwd", req.body.pwd);
    res.cookie("group", req.body.group || "common");
    res.sendFile(__dirname + "/index.html");
    console.log(req.body.name, "connected");
  }
);

app.post("/createGroup", (req, res) => {
  res.end("create group page");
});

app.post(
  "/joinGroup",
  body("group", "group name should be atleast 1 character in length")
    .exists()
    .trim()
    .isLength({ min: 1 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    res.cookie("group", req.body.group);
    res.sendFile(__dirname + "/index.html");
    console.log("post called group");
  }
);

app.get("/joinGroup", (req, res) => {
  res.sendFile(__dirname + "/getGroupData.html");
});

app.post("/privateChat", (req, res) => {
  res.end("private chat page");
});

io.on("connection", (socket) => {
  socket.on("join", (data) => {
    // userToSocketId[socket.id] = data.user;
    socket.join(data.currGroup);
    // console.log(userToSocketId);
    io.to(data.currGroup).emit(
      "join",
      `${data.user} has joined group ${data.currGroup} !`
    );
  });
  socket.on("chat message", (msg) => {
    io.to(msg.currGroup).emit("chat message", `${msg.user}:${msg.data}`);
    console.log("message: ", `${msg.user}:${msg.data}:${msg.currGroup}`);
  });
  socket.on("disconnect", () => {
    io.emit("userDisconnect", "a user disconnected");
    console.log("a user disconnected!");
  });
});

server.listen(3000, async () => {
  await MongoConnect();
  console.log("listening on *:3000");
  // await updateUser("testuser0", ["dsfsdfsdfdsfsffsf555555555555"]);
  // doesUserExists("testuser1")
});