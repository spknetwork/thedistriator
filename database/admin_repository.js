let logger = require("node-color-log");

const mongoDB = require("./mongoDB");
const { dhiveClient } = require("../utils/dhive");
const { broadcastOps } = require("../utils/transfer_hp");

async function addAnAdmin(username) {
  try {
    logger.info(`Trying to add an admin ${username}`);
    const accounts = await dhiveClient.database.getAccounts([username]);
    if (accounts.length !== 1) {
      throw "Invalid Hive Username.";
    }
    const record = await mongoDB.Admin.findOne({ username: username });
    if (record !== null) {
      const error = `Admin with hiveusername ${username} already exists`;
      throw error;
    } else {
      const record = new mongoDB.Admin({ username: username });
      await record.save();
    }
    logger.info("done adding admin");
  } catch (e) {
    logger.error("error adding admin" + e.toString());
    throw e;
  }
}

async function addASuper(username) {
  try {
    logger.info(`Trying to add a Super ${username}`);
    const accounts = await dhiveClient.database.getAccounts([username]);
    if (accounts.length !== 1) {
      throw "Invalid Hive Username.";
    }
    const record = await mongoDB.SuperAdmin.findOne({ username: username });
    if (record !== null) {
      const error = `Super with hiveusername ${username} already exists`;
      throw error;
    } else {
      const record = new mongoDB.SuperAdmin({ username: username });
      await record.save();
    }
    logger.info("done adding Super");
  } catch (e) {
    logger.error("error adding Super" + e.toString());
    throw e;
  }
}

async function removeAnAdmin(username) {
  try {
    logger.info(`Trying to delete an admin ${username}`);
    const record = await mongoDB.Admin.findOne({ username: username });
    if (record !== null) {
      await record.deleteOne();
    } else {
      const error = `No Admin found to delete with hiveusername ${username}`;
      throw error;
    }
    logger.info("done deleting admin");
  } catch (e) {
    logger.error("error deleting admin" + e.toString());
    throw e;
  }
}

async function removeASuper(username) {
  try {
    logger.info(`Trying to delete a super ${username}`);
    const record = await mongoDB.SuperAdmin.findOne({ username: username });
    if (record !== null) {
      await record.deleteOne();
    } else {
      const error = `No Super found to delete with hiveusername ${username}`;
      throw error;
    }
    logger.info("done deleting Super");
  } catch (e) {
    logger.error("error deleting Super" + e.toString());
    throw e;
  }
}

async function banAnAdmin(username) {
  try {
    logger.info(`Trying to ban an admin ${username}`);
    const record = await mongoDB.Admin.findOne({ username: username });
    if (record !== null) {
      record.banned = true;
      await record.save();
    } else {
      const error = `No Admin found to ban with hiveusername ${username}`;
      throw error;
    }
    logger.info("done banning admin");
  } catch (e) {
    logger.error("error banning admin" + e.toString());
    throw e;
  }
}

async function unbanAnAdmin(username) {
  try {
    logger.info(`Trying to unban an admin ${username}`);
    const record = await mongoDB.Admin.findOne({ username: username });
    if (record !== null) {
      record.banned = false;
      await record.save();
    } else {
      const error = `No Admin found to unban with hiveusername ${username}`;
      throw error;
    }
    logger.info("done unbanning admin");
  } catch (e) {
    logger.error("error unbanning admin" + e.toString());
    throw e;
  }
}

async function getAllAdmins() {
  return await mongoDB.Admin.find();
}

async function distriator_admin_add(op) {
  const opType = "distriator_admin_add";
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
  await addAnAdmin(object.username);
}

async function distriator_admin_update(op) {
  const opType = "distriator_admin_update";
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
    await banAnAdmin(object.username);
  } else {
    await unbanAnAdmin(object.username);
  }
}

async function distriator_admin_remove(op) {
  const opType = "distriator_admin_remove";
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
  await removeAnAdmin(object.username);
}

async function distriator_super_admin_add(op) {
  const opType = "distriator_super_admin_add";
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
  await addASuper(object.username);
}

async function distriator_super_admin_remove(op) {
  const opType = "distriator_super_admin_remove";
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
  await removeASuper(object.username);
}

async function broadcast_distriator_admin_remove(username) {
  await broadcastOps({
    id: "distriator_admin_remove",
    json: JSON.stringify({
      username: username,
    }),
  });
}

async function broadcast_distriator_admin_add(username) {
  await broadcastOps({
    id: "distriator_admin_add",
    json: JSON.stringify({
      username: username,
    }),
  });
}

async function broadcast_distriator_admin_update(username, banned) {
  await broadcastOps({
    id: "distriator_admin_update",
    json: JSON.stringify({
      username: username,
      banned: banned,
    }),
  });
}

module.exports = {
  // These functions read from block-chain-based-synced-database 
  getAllAdmins,

  // These functions pulls changes from blockchain & apply it on database
  distriator_admin_remove,
  distriator_admin_add,
  distriator_admin_update,
  distriator_super_admin_add,
  distriator_super_admin_remove,

  // These functions pushes changes to blockchain
  broadcast_distriator_admin_remove,
  broadcast_distriator_admin_add,
  broadcast_distriator_admin_update,
};