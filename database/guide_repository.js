let logger = require("node-color-log");

const mongoDB = require("./mongoDB");
const { dhiveClient } = require("../utils/dhive");

async function addAGuide(username, city, country) {
  try {
    logger.info(`Trying to add a guide ${username}`);
    const accounts = await dhiveClient.database.getAccounts([username]);
    if (accounts.length !== 1) {
      throw "Invalid Hive Username.";
    }
    const record = await mongoDB.Guide.findOne({ username: username });
    if (record !== null) {
      const error = `Guide with hiveusername ${username} already exists`;
      throw error;
    } else {
      const record = new mongoDB.Guide({ username: username, city: city, country: country });
      await record.save();
    }
    logger.info("done adding a guide");
  } catch (e) {
    logger.error("error adding a guide" + e.toString());
    throw e;
  }
}

async function removeAGuide(username) {
  try {
    logger.info(`Trying to delete a guide ${username}`);
    const record = await mongoDB.Guide.findOne({ username: username });
    if (record !== null) {
      await record.deleteOne();
    } else {
      const error = `No guide found to delete with hiveusername ${username}`;
      throw error;
    }
    logger.info("done deleting guide");
  } catch (e) {
    logger.error("error deleting guide" + e.toString());
    throw e;
  }
}

async function updateGuide(object) {
  try {
    logger.info(`Trying to update a guide ${object.username}`);
    const record = await mongoDB.Guide.findOne({ username: object.username });
    if (record !== null) {
      record.banned = object.banned;
      record.city = object.city;
      record.country = object.country;
      await record.save();
    } else {
      const error = `No Guide found to unban with hiveusername ${object.username}`;
      throw error;
    }
    logger.info("done updating guide");
  } catch (e) {
    logger.error("error updating guide" + e.toString());
    throw e;
  }
}

async function getAllGuides() {
  return await mongoDB.Guide.find();
}

async function distriator_guide_add(op) {
  const opType = "distriator_guide_add";
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
  if (!("city" in object)) {
    logger.error(`${opType} operation's json does not have city for guide`);
    return;
  }
  if (typeof object.city !== "string") {
    logger.error(`${opType} operation's json's guide's city attribute is not of type string`);
    return;
  }
  if (!("country" in object)) {
    logger.error(`${opType} operation's json does not have country for guide`);
    return;
  }
  if (typeof object.city !== "string") {
    logger.error(`${opType} operation's json's guide's country attribute is not of type string`);
    return;
  }
  await addAGuide(object.username, object.city, object.country);
}

async function distriator_guide_update(op) {
  const opType = "distriator_guide_update";
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

  if (!("city" in object)) {
    logger.error(`${opType} operation's json does not have city for guide`);
    return;
  }
  if (typeof object.city !== "string") {
    logger.error(`${opType} operation's json's guide's city attribute is not of type string`);
    return;
  }
  if (!("country" in object)) {
    logger.error(`${opType} operation's json does not have country for guide`);
    return;
  }
  if (typeof object.city !== "string") {
    logger.error(`${opType} operation's json's guide's country attribute is not of type string`);
    return;
  }
  updateGuide(object)
}

async function distriator_guide_remove(op) {
  const opType = "distriator_guide_remove";
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
  await removeAGuide(object.username);
}

async function broadcast_distriator_guide_remove(username) {
  await broadcastOps({
    id: "distriator_guide_remove",
    json: JSON.stringify({
      username: username,
    }),
  });
}

async function broadcast_distriator_guide_add(username, city, country) {
  await broadcastOps({
    id: "distriator_guide_add",
    json: JSON.stringify({
      username: username,
      city,
      country
    }),
  });
}

async function broadcast_distriator_guide_update(username, banned, city, country) {
  await broadcastOps({
    id: "distriator_guide_update",
    json: JSON.stringify({
      username: username,
      banned: banned,
      city,
      country
    }),
  });
}


module.exports = {
  // These functions read from block-chain-based-synced-database 
  getAllGuides,

  // These functions pulls changes from blockchain & apply it on database
  distriator_guide_remove,
  distriator_guide_add,
  distriator_guide_update,

  // These functions pushes changes to blockchain
  broadcast_distriator_guide_remove,
  broadcast_distriator_guide_add,
  broadcast_distriator_guide_update,
};
