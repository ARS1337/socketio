const express = require("express");
const { read } = require("fs");
const app = express();
const cookieParser = require("cookie-parser");
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
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
  insertGroup,
  doesFieldExist,
  insertMessages,
  findAndInsertGroupPrivate,
  insertMessagesPrivate,
} = require("./Mongo");
const { randomUUID } = require("crypto");

const userToSocketId = {};
const userList = [];

app.get("/", (req, res) => {
  res.cookie("userName", "");
  res.cookie("group", "");
  res.cookie("private", "");
  res.cookie("pwd", "");
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
    res.cookie("private", 0);
    res.sendFile(__dirname + "/index.html");
    console.log("post called group");
  }
);

app.get("/joinGroup", (req, res) => {
  res.sendFile(__dirname + "/getGroupData.html");
});

app.get("/privateChat", (req, res) => {
  res.sendFile(__dirname + "/privateChat.html");
});

app.post(
  "/privateChat",
  body("connectTo", "username should be atleast 1 character in length")
    .exists()
    .trim()
    .isLength({ min: 1 }),
  body("connectTo").custom(async (value, { req }) => {
    let userExists = await doesUserExists(value);
    if (!userExists) {
      return Promise.reject("user doesn't exist");
    }
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    console.log(req.body);
    let groupName = await findAndInsertGroupPrivate(
      req.body.connectTo,
      req.body.currUser
    );
    res.cookie("private", 1);
    res.cookie("group", groupName);
    res.sendFile(__dirname + "/index.html");
  }
);

io.use((socket, next) => {
  try {
    if (socket && socket.handshake.auth!=={}) {
      socket.sessionID = socket.handshake.auth.sessionID;
      console.log("sdfd0")
    } else {
      socket.sessionID = randomUUID();
      console.log("sdfd1")
    }
    console.log(socket.handshake.auth, "socketttttttt auth");
  } catch (err) {
    console.log(err);
    return next(err);
  }
  next();
});

io.on("connection", (socket) => {
  socket.emit("session", {
    sessionID: socket.sessionID,
  });
  socket.on("join", async (data) => {
    socket.join(data.currGroup);
    if (data.private == 0) {
      let results = await insertGroup(data.currGroup);
    }
    io.to(data.currGroup).emit(
      "join",
      `${data.user} has joined group ${data.currGroup} !`
    );
  });
  socket.on("chat message", async (msg) => {
    io.to(msg.currGroup).emit("chat message", `${msg.user}:${msg.data}`);
    let results = await insertMessages(msg.currGroup, {
      [msg.user]: msg.data,
    });
    console.log(results);
    console.log("message: ", `${msg.user}:${msg.data}:${msg.currGroup}`);
  });
  socket.on("disconnect", () => {
    io.emit("userDisconnect", "a user disconnected");
    console.log("a user disconnected!");
  });
});

server.listen(3000, async () => {
  await MongoConnect();
  let res = await findAndInsertGroupPrivate("jj", "kk");
  console.log(res);
  console.log("listening on *:3000");
  // await insertMessagesPrivate(["ttt", "ggg"], { ttt: "gdfgfdgdfgdfgdfg" });
});
