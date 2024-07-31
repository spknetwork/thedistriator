let logger = require("node-color-log");
const dhive = require("@hiveio/dhive");
var _ = require("lodash");
const fs = require("fs").promises;

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

const { dhiveClient } = require("./utils/dhive");
const { config } = require("./config");

const mongoDB = require("./database/mongoDB.js");
const adminRepository = require("./database/admin_repository.js");
const guideRepository = require("./database/guide_repository.js");
const userRepository = require("./database/user_repository.js");
const businessRepository = require("./database/business_repository.js");
const fileName = "./last_block_read.txt";

function isValidOperation(t) {
  const checkOne =
    t.operations[0][0] === "custom_json" &&
    t.operations[0][1].required_posting_auths[0] === config.distriator.account;
  if (checkOne === false) return false;
  return true;
}

async function superOps(opsData) {
  try {
    await adminRepository.distriator_super_admin_add(opsData);
    await adminRepository.distriator_super_admin_remove(opsData);
  } catch (e) {
    logger.error(`Error getting while performing super ops`);
    logger.error(`Data = ${JSON.stringify(opsData)}`);
    logger.error(`Error Data = ${e.toString()}`);
  }
}

async function adminOps(opsData) {
  try {
    await adminRepository.distriator_admin_add(opsData);
    await adminRepository.distriator_admin_remove(opsData);
    await adminRepository.distriator_admin_update(opsData);
  } catch (e) {
    logger.error(`Error getting while performing admin ops`);
    logger.error(`Data = ${JSON.stringify(opsData)}`);
    logger.error(`Error Data = ${e.toString()}`);
  }
}

async function guideOps(opsData) {
  try {
    await guideRepository.distriator_guide_add(opsData);
    await guideRepository.distriator_guide_remove(opsData);
    await guideRepository.distriator_guide_update(opsData);
  } catch (e) {
    logger.error(`Error getting while performing guide ops`);
    logger.error(`Data = ${JSON.stringify(opsData)}`);
    logger.error(`Error Data = ${e.toString()}`);
  }
}

async function userOps(opsData) {
  try {
    await userRepository.distriator_user_add(opsData);
    await userRepository.distriator_user_remove(opsData);
    await userRepository.distriator_user_update(opsData);
  } catch (e) {
    logger.error(`Error getting while performing user ops`);
    logger.error(`Data = ${JSON.stringify(opsData)}`);
    logger.error(`Error Data = ${e.toString()}`);
  }
}

async function businessOps(opsData) {
  try {
    await businessRepository.distriator_business_add(opsData);
    await businessRepository.distriator_business_update(opsData);
    await businessRepository.distriator_business_delete(opsData);
  } catch (e) {
    logger.error(`Error getting while performing user ops`);
    logger.error(`Data = ${JSON.stringify(opsData)}`);
    logger.error(`Error Data = ${e.toString()}`);
  }
}

async function syncFromBlock(blockNumber) {
  let block = blockNumber;
  while (true) {
    try {
      logger.info(`Getting block ${block}`);
      const blockData = await dhiveClient.database.getBlock(block);
      logger.info(`Got block ${block}'s details`);
      let timestamp = blockData.timestamp;
      if (timestamp.toLowerCase().includes("z") === false) {
        timestamp = `${timestamp}Z`;
      }
      const blockDate = dayjs(timestamp);
      const fastFetchNextBlock =
        blockDate.isBefore(dayjs().subtract(3, "second")) === true;
      const operations = blockData.transactions;
      const filteredOperations = operations.filter((t) => isValidOperation(t));
      for (i = 0; i < filteredOperations.length; i++) {
        const opsData = filteredOperations[i].operations[0][1];
        await superOps(opsData);
        await adminOps(opsData);
        await guideOps(opsData);
        await userOps(opsData);
        await businessOps(opsData);
      }
      block++;
      await fs.writeFile(fileName, `${block}`);
      if (fastFetchNextBlock === false) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2));
      }
    } catch (e) {
      logger.error(`Error getting block number ${block} - ${e.toString()}`);
    }
  }
}

async function main() {
  await mongoDB.connectDB();
  // Overall start block is this - 87357738
  // however it all depends on the last bloack that was read & update.
  let block = `87357738`;
  try {
    block = await fs.readFile(fileName);
  } catch (e) {
    logger.error(
      `Error reading file ${fileName}, So we are starting with ${block}`
    );
  }
  const blockNumber = parseInt(block);
  logger.info(`details which we read - ${blockNumber}`);
  await syncFromBlock(blockNumber);
}

main();
