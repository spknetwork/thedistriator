let logger = require("node-color-log");
const dhive = require("@hiveio/dhive");

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

const { dhiveClient } = require("../utils/dhive");
const { BusinessJoi } = require("../database/schemas/joi/business_joi.js");

const express = require("express");
var router = express.Router();

const { tokenValidation, skipValidation } = require("../utils/auth");
const businessRepository = require("../database/business_repository");

const { sendOnWebHook } = require("../utils/discord_webhooks");
const { config } = require("../config");

const { getTransfers } = require("../utils/account_transfers.js");

const businessDataV2 = require("../database/businesses_v2.json");

const dbCrypto = require("../utils/custom_crypto.js");

function webHook(title, subtitle, actionUser, user) {
  sendOnWebHook(
    title,
    subtitle,
    actionUser,
    user,
    config.webHooks.business.id,
    config.webHooks.business.token
  );
}

function getHBDIncomingRecords(records, author) {
  const filteredRecords = records
    .filter(
      (h) =>
        h[1].op[1].to === author &&
        h[1].op[1].amount.includes("HBD") &&
        (h[1].op[1].memo.includes("v4v-") || h[1].op[1].memo.includes("kcs-"))
    )
    .map((h) => {
      return {
        amount: h[1].op[1].amount,
        memo: h[1].op[1].memo,
        timestamp: h[1].timestamp,
        customer: h[1].op[1].from,
      };
    });
  return filteredRecords;
}

router.get("/", skipValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  const all = await businessRepository.getAllBusinesses();
  if (
    req.usertype === null ||
    req.usertype === undefined ||
    req.usertype === "user" ||
    req.usertype === "owner"
  ) {
    const records = all.map((a) => {
      return {
        profile: a.profile,
        accepts: a.paymentMethods,
        location: a.location,
        contact: a.contact,
        distriator: {
          owner: a.distriator.owner,
          paymentMethods: a.distriator.paymentMethods,
          spendHBDLink: a.distriator.spendHBDLink,
        },
        id: a.id,
      };
    });
    let data = JSON.stringify(records);
    data = dbCrypto.encryptData(data);
    return res.send({ data: data });
    // return res.send(records);
  } else {
    let data = JSON.stringify(all);
    data = dbCrypto.encryptData(data);
    return res.send({ data: data });
    // return res.send(all);
  }
});

router.get("/v2", async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  let data = JSON.stringify(businessDataV2);
  data = dbCrypto.encryptData(data);
  return res.send({ data: data });
});

router.post("/", tokenValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  if (
    req.usertype !== "admin" &&
    req.usertype !== "super" &&
    req.usertype !== "guide" &&
    req.usertype !== "owner" &&
    req.usertype !== "user"
  ) {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  try {
    const { error, value } = BusinessJoi.validate(req.body);
    if (error === undefined) {
      const newB = await businessRepository.addABusiness(req.body, true);
      let data = JSON.stringify(newB);
      data = dbCrypto.encryptData(data);
      return res.send({ data: data });
      // res.send(newB);
    } else {
      return res.status(500).json({
        error: error,
      });
    }
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

router.post("/update", tokenValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  if (
    req.usertype !== "admin" &&
    req.usertype !== "super" &&
    req.usertype !== "guide"
  ) {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  try {
    const { error, value } = BusinessJoi.validate(req.body);
    if (error === undefined) {
      const newB = await businessRepository.updateABusiness(req.body, true);
      let data = JSON.stringify(newB);
      data = dbCrypto.encryptData(data);
      return res.send({ data: data });
      // res.send(newB);
    } else {
      return res.status(500).json({
        error: error,
      });
    }
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

router.post("/delete", tokenValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  if (req.usertype !== "admin" && req.usertype !== "super") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  try {
    const { error, value } = BusinessJoi.validate(req.body);
    if (error === undefined) {
      const message = await businessRepository.deleteABusiness(req.body, true);
      return res.send({ data: { message: message } });
    }
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

router.get("/history/:accountName", tokenValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  if (
    req.usertype !== "admin" &&
    req.usertype !== "super" &&
    req.usertype !== "guide"
  ) {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const accountName = req.params.accountName;
  if (
    accountName === null ||
    accountName === undefined ||
    accountName.length === 0
  ) {
    return res.status(500).json({
      error: "Please provide business-account to find history.",
    });
  }
  logger.info(`Validating business-account-name ${accountName}`);
  const accounts = await dhiveClient.database.getAccounts([accountName]);
  if (accounts.length !== 1) {
    throw "Invalid business-account to find history.";
  }
  const transfers = await getTransfers(dhiveClient, accountName, 1000);
  const hbdIncomings = getHBDIncomingRecords(transfers, accountName);
  return res.send(hbdIncomings);
});

exports.businessRouter = router;
