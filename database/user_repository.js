let logger = require("node-color-log");

const mongoDB = require("./mongoDB");
const { dhiveClient } = require("../utils/dhive");

async function addAUser(username) {
  try {
    logger.info(`Trying to add an user ${username}`);
    const accounts = await dhiveClient.database.getAccounts([username]);
    if (accounts.length !== 1) {
      throw "Invalid Hive Username.";
    }
    const record = await mongoDB.User.findOne({ username: username });
    if (record !== null) {
      const error = `User with hiveusername ${username} already exists`;
      throw error;
    } else {
      const record = new mongoDB.User({ username: username });
      await record.save();
    }
    logger.info("done adding an User");
  } catch (e) {
    logger.error("error adding an User" + e.toString());
    throw e;
  }
}

async function removeAUser(username) {
  try {
    logger.info(`Trying to delete a user ${username}`);
    const record = await mongoDB.User.findOne({ username: username })
    if (record !== null) {
      await record.deleteOne();
    } else {
      const error = `No user found to delete with hiveusername ${username}`;
      throw error;
    }
    logger.info("done deleting user");
  } catch (e) {
    logger.error("error deleting user" + e.toString());
    throw e;
  }
}

async function banAUser(username) {
  try {
    logger.info(`Trying to ban a user ${username}`);
    const record = await mongoDB.User.findOne({ username: username });
    if (record !== null) {
      record.banned = true;
      await record.save();
    } else {
      const error = `No user found to unban with hiveusername ${username}`;
      throw error;
    }
    logger.info("done banning user");
  } catch (e) {
    logger.error("error banning user" + e.toString());
    throw e;
  }
}

async function unbanAUser(username) {
  try {
    logger.info(`Trying to unban a user ${username}`);
    const record = await mongoDB.User.findOne({ username: username });
    if (record !== null) {
      record.banned = false;
      await record.save();
    } else {
      const error = `No user found to unban with hiveusername ${username}`;
      throw error;
    }
    logger.info("done unbanning user");
  } catch (e) {
    logger.error("error unbanning user" + e.toString());
    throw e;
  }
}

async function getAllUsers() {
  return await mongoDB.User.find();
}

async function distriator_user_add(op) {
  const opType = "distriator_user_add";
  if (op.id !== opType) {
    logger.warn(`${opType} != ${op.id}`);
    return;
  }
  if (!("json" in op)) {
    logger.error(`${opType} operation doesn't have json attribute`);
    return;
  }
  if (typeof op.json !== "string") {
    logger.error(`${opType} operation's json attribute is not of type string`);
    return;
  }
  const object = JSON.parse(op.json);
  if (!("username" in object)) {
    logger.error(`${opType} operation's json does not have username attribute`);
    return;
  }
  if (typeof object.username !== "string") {
    logger.error(`${opType} operation's json's username attribute is not of type string`);
    return;
  }
  await addAUser(object.username);
}

async function distriator_user_update(op) {
  const opType = "distriator_user_update";
  if (op.id !== opType) {
    logger.warn(`${opType} != ${op.id}`);
    return;
  }
  if (!("json" in op)) {
    logger.error(`${opType} operation doesn't have json attribute`);
    return;
  }
  if (typeof op.json !== "string") {
    logger.error(`${opType} operation's json attribute is not of type string`);
    return;
  }
  const object = JSON.parse(op.json);
  if (!("username" in object)) {
    logger.error(`${opType} operation's json does not have username attribute`);
    return;
  }
  if (typeof object.username !== "string") {
    logger.error(`${opType} operation's json's username attribute is not of type string`);
    return;
  }
  if (!("banned" in object)) {
    logger.error(`${opType} operation's json does not have banned attribute`);
    return;
  }
  if (typeof object.banned !== "boolean") {
    logger.error(`${opType} operation's json's username attribute is not of type boolean`);
    return;
  }
  if (object.banned) {
    await banAUser(object.username);
  } else {
    await unbanAUser(object.username);
  }
}

async function distriator_user_remove(op) {
  const opType = "distriator_user_remove";
  if (op.id !== opType) {
    logger.warn(`${opType} != ${op.id}`);
    return;
  }
  if (!("json" in op)) {
    logger.error(`${opType} operation doesn't have json attribute`);
    return;
  }
  if (typeof op.json !== "string") {
    logger.error(`${opType} operation's json attribute is not of type string`);
    return;
  }
  const object = JSON.parse(op.json);
  if (!("username" in object)) {
    logger.error(`${opType} operation's json does not have username attribute`);
    return;
  }
  if (typeof object.username !== "string") {
    logger.error(`${opType} operation's json's username attribute is not of type string`);
    return;
  }
  await removeAUser(object.username);
}

async function broadcast_distriator_user_remove(username) {
  await broadcastOps({
    id: "distriator_user_remove",
    json: JSON.stringify({
      username: username,
    }),
  });
}

async function broadcast_distriator_user_add(username) {
  await broadcastOps({
    id: "distriator_user_add",
    json: JSON.stringify({
      username: username,
    }),
  });
}

async function broadcast_distriator_user_update(username, banned) {
  await broadcastOps({
    id: "distriator_user_update",
    json: JSON.stringify({
      username: username,
      banned: banned,
    }),
  });
}

module.exports = {
  // These functions read from block-chain-based-synced-database 
  getAllUsers,

  // These functions pulls changes from blockchain & apply it on database
  distriator_user_remove,
  distriator_user_add,
  distriator_user_update,

  // These functions pushes changes to blockchain
  broadcast_distriator_user_remove,
  broadcast_distriator_user_add,
  broadcast_distriator_user_update,
};