let logger = require("node-color-log");
const dhive = require("@hiveio/dhive");
var _ = require("lodash");

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

const { dhiveClient } = require("./utils/dhive");
const { config } = require("./config");

const mongoDB = require("./database/mongoDB.js");
const adminRepository = require("./database/admin_repository");

function jsonToAddSuperAdmin(username) {
  return {
    id: "distriator_super_admin_add",
    json: JSON.stringify({
      username: username,
    }),
  };
}

function jsonToRemoveSuperAdmin(username) {
  return {
    id: "distriator_super_admin_remove",
    json: JSON.stringify({
      username: username,
    }),
  };
}

function jsonToAddAdmin(username) {
  return {
    id: "distriator_admin_add",
    json: JSON.stringify({
      username: username,
    }),
  };
}

function jsonToUpdateAdmin(username, banned) {
  return {
    id: "distriator_admin_update",
    json: JSON.stringify({
      username: username,
      banned: banned,
    }),
  };
}

function jsonToRemoveAdmin(username) {
  return {
    id: "distriator_admin_remove",
    json: JSON.stringify({
      username: username,
    }),
  };
}

async function broadcastOps(json) {
  const ops = [
    "custom_json",
    {
      ...json,
      required_auths: [],
      required_posting_auths: [config.distriator.account],
    },
  ];
  const key = dhive.PrivateKey.from(config.distriator.key);
  const op = [ops];
  try {
    const result = await dhiveClient.broadcast.sendOperations(op, key);
    logger.info(`Operation broadcasted. Result is - ${JSON.stringify(result)}`);
  } catch (e) {
    logger.error(e);
    throw e;
  }
}

async function adminRepoTest() {
  await broadcastOps(jsonToAddSuperAdmin("starkerz"));
  await broadcastOps(jsonToAddSuperAdmin("sagarkothari88"));
  await broadcastOps(jsonToAddSuperAdmin("sagarkothari"));
  await broadcastOps(jsonToAddSuperAdmin("scamforest"));
  await broadcastOps(jsonToRemoveSuperAdmin("scamforest"));
}

// adminRepoTest();

// ================================

function isValidOperation(t) {
  const checkOne =
    t.operations[0][0] === "custom_json" &&
    t.operations[0][1].required_posting_auths[0] === "thedistriator";
  if (checkOne === false) return false;
  return true;
}

async function syncFromBlock(blockNumber) {
  let block = blockNumber;
  try {
    const blockData = await dhiveClient.database.getBlock(blockNumber);
    let timestamp = blockData.timestamp;
    if (timestamp.toLowerCase().includes("z") === false) {
      timestamp = `${timestamp}Z`;
    }
    const blockDate = dayjs(timestamp);
    const fastFetchNextBlock = blockDate.isBefore(dayjs().subtract(3, "second")) === true;
    const operations = blockData.transactions;
    const filteredOperations = operations.filter((t) => isValidOperation(t));
    for (i = 0; i < filteredOperations.length; i++) {
      await adminRepository.distriator_admin_add(
        filteredOperations[i].operations[0][1]
      );
    }
    block++;
  } catch {
    logger.error(`Error getting block number ${block}`);
  }
}

async function readLastBlock() {
  await mongoDB.connectDB();
  // Overall start block is this - 87357738
  await syncFromBlock(87357738);
}

readLastBlock();
