let logger = require("node-color-log");

const mongoDB = require("./mongoDB");
const { dhiveClient } = require("../utils/dhive");

async function addAnOwner(username) {
  try {
    logger.info(`Trying to add an owner ${username}`);
    const accounts = await dhiveClient.database.getAccounts([username]);
    if (accounts.length !== 1) {
      throw "Invalid Hive Username.";
    }
    const record = await mongoDB.BusinessOwner.findOne({ username: username });
    if (record !== null) {
      const error = `Owner with hiveusername ${username} already exists`;
      throw error;
    } else {
      const record = new mongoDB.BusinessOwner({ username: username });
      await record.save();
    }
    logger.info("done adding an owner");
  } catch (e) {
    logger.error("error adding an owner" + e.toString());
    throw e;
  }
}

async function removeAnOwner(username) {
  try {
    logger.info(`Trying to delete an owner ${username}`);
    const record = await mongoDB.BusinessOwner.findOne({ username: username })
    if (record !== null) {
      await record.deleteOne();
    } else {
      const error = `No owner found to delete with hiveusername ${username}`;
      throw error;
    }
    logger.info("done deleting owner");
  } catch (e) {
    logger.error("error deleting owner" + e.toString());
    throw e;
  }
}

async function banAnOwner(username) {
  try {
    logger.info(`Trying to ban an owner ${username}`);
    const record = await mongoDB.BusinessOwner.findOne({ username: username });
    if (record !== null) {
      record.banned = true;
      await record.save();
    } else {
      const error = `No owner found to unban with hiveusername ${username}`;
      throw error;
    }
    logger.info("done banning owner");
  } catch (e) {
    logger.error("error banning owner" + e.toString());
    throw e;
  }
}

async function unbanAnOwner(username) {
  try {
    logger.info(`Trying to unban an owner ${username}`);
    const record = await mongoDB.BusinessOwner.findOne({ username: username });
    if (record !== null) {
      record.banned = false;
      await record.save();
    } else {
      const error = `No owner found to unban with hiveusername ${username}`;
      throw error;
    }
    logger.info("done unbanning owner");
  } catch (e) {
    logger.error("error unbanning owner" + e.toString());
    throw e;
  }
}

async function getAllOwners() {
  return await mongoDB.BusinessOwner.find();
}

async function distriator_owner_add(op) {
  const opType = "distriator_owner_add";
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
  await addAnOwner(object.username);
}

async function distriator_owner_update(op) {
  const opType = "distriator_owner_update";
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
    await banAnOwner(object.username);
  } else {
    await unbanAnOwner(object.username);
  }
}

async function distriator_owner_remove(op) {
  const opType = "distriator_owner_remove";
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
  await removeAnOwner(object.username);
}

async function broadcast_distriator_owner_remove(username) {
  await broadcastOps({
    id: "distriator_owner_remove",
    json: JSON.stringify({
      username: username,
    }),
  });
}

async function broadcast_distriator_owner_add(username) {
  await broadcastOps({
    id: "distriator_owner_add",
    json: JSON.stringify({
      username: username,
    }),
  });
}

async function broadcast_distriator_owner_update(username, banned) {
  await broadcastOps({
    id: "distriator_owner_update",
    json: JSON.stringify({
      username: username,
      banned: banned,
    }),
  });
}

module.exports = {
  // These functions read from block-chain-based-synced-database 
  getAllOwners,

  // These functions pulls changes from blockchain & apply it on database
  distriator_owner_remove,
  distriator_owner_add,
  distriator_owner_update,

  // These functions pushes changes to blockchain
  broadcast_distriator_owner_remove,
  broadcast_distriator_owner_add,
  broadcast_distriator_owner_update,
};