const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://user:K6Z1czWishtycMt0@cluster0.nphjw.mongodb.net/data.users?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let userCollection;

let MongoConnect = async () => {
  try {
    await client.connect();
    await client.db("data").command({ ping: 1 });
    console.log("Connected to server successfully!");
    const db = client.db("data");
    userCollection = await client.db("data").collection("users");
  } catch (err) {
    console.log(err);
  }
};
const insertUser = async (userId, pwd, groups = ["common"]) => {
  try {
    // let results = await doesUserExists(userId);
    // if (results ? true : false) {
    let dataToInsert = {
      userId: userId,
      pwd: pwd,
      groups: groups,
    };
    const result = await client
      .db("data")
      .collection("users")
      .insertOne(dataToInsert);
    console.log(result.insertedCount);
    return result.insertedCount;
    // } else {
    //   console.log("user does not exist");
    //   return false;
    // }
  } catch (err) {
    console.log(err);
  }
};

const updateUser = async (user, groups) => {
  try {
    let findResult = await doesUserExists(user);
    if (findResult ? true : false) {
      let tempGroup = [...findResult.groups];
      let temp = groups.filter((x) => !tempGroup.includes(x));
      tempGroup = [...findResult.groups, ...temp];
      let filter = { userId: user };
      let updateDocument = {
        $set: {
          groups: tempGroup,
        },
      };
      let updateResult = await client
        .db("data")
        .collection("users")
        .updateOne(filter, updateDocument);

      console.log(updateResult, "sdf");
      return updateResult;
    } else {
      console.log("no user woth suc name");
      return false;
    }
  } catch (err) {
    console.log(err);
  }
};

const doesUserExists = async (user) => {
  try {
    let findResult = await client
      .db("data")
      .collection("users")
      .findOne({ userId: user });

    return findResult;
  } catch (err) {
    console.log(err);
  }
};

const insertGroup = async (group) => {
  try {
    let doesAlreadyExist = await doesFieldExist("groupName", group);
    if (!doesAlreadyExist) {
      let dataToInsert = {
        groupName: group,
        messages: [],
      };
      let findResult = await client
        .db("data")
        .collection("users")
        .insertOne(dataToInsert);
    } else {
      return "group already exists";
    }
  } catch (err) {
    console.log(err);
  }
};

const insertMessages = async (group, data) => {
  let findResult = await client
    .db("data")
    .collection("users")
    .updateOne({ groupName: group }, { $push: { messages: data } });
  return findResult;
};

const doesFieldExist = async (field, fieldValue) => {
  try {
    let dataToFind = { [field]: fieldValue };
    let findResult = await client
      .db("data")
      .collection("users")
      .findOne(dataToFind);
    return findResult;
  } catch (err) {
    console.log(err);
    return err;
  }
};

const findAndInsertGroupPrivate = async (username1, username2) => {
  if (username1 && username2) {
    let groupName = `${username1}mmm${username2}`;
    let findResult = await doesPrivateGroupExist(groupName);
    if (!findResult) {
      groupName = `${username2}mmm${username1}`;
      let findResult1 = await doesPrivateGroupExist(groupName);
      if (!findResult1) {
        await insertGroupPrivate(groupName);
      } else {
        return groupName;
      }
    } else {
      return groupName;
    }
    return groupName;
  } else {
    return (
      "username is not defined: username1:" + username1 + " and username2: " + username2
    );
  }
};
const doesPrivateGroupExist = async (groupName) => {
  let filter = {
    groupName: groupName,
    type: "private",
  };
  let findResult = await userCollection.findOne(filter);
  return findResult;
};

const insertGroupPrivate = async (groupName) => {
  let dataToInsert = {
    groupName: groupName,
    type: "private",
    messages: [],
  };
  let results = await userCollection.insertOne(dataToInsert);
  return results;
};

const insertMessagesPrivate = async (username1, username2, data) => {
  let groupName = await findAndInsertGroupPrivate(username1, username2);
  let findResult = await userCollection.updateOne(
    { groupName: groupName, type: "private" },
    { $push: { messages: data } }
  );
  return findResult;
};

module.exports = {
  updateUser,
  insertUser,
  MongoConnect,
  doesUserExists,
  insertGroup,
  doesFieldExist,
  insertMessages,
  findAndInsertGroupPrivate,
  insertMessagesPrivate,
};
