let logger = require("node-color-log");

const express = require("express");
var router = express.Router();
var _ = require("lodash");

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

const { tokenValidation } = require("../utils/auth");
const { config } = require("../config");
const businessData = require("../database/businesses_v2.json");
const { dhiveClient } = require("../utils/dhive");
const { sendOnWebHook } = require("../utils/discord_webhooks");
const dhive = require("@hiveio/dhive");

const { hbdTransfer } = require("../utils/transfer_hp.js");

const { getClaimableAmount } = require("../utils/did_author_transfer.js");

const { getInvoiceID } = require("../utils/invoice_id.js");
const { getLeaderboardDates } = require("../utils/leaderboard_dates.js");
const { getTransfers } = require("../utils/account_transfers.js");

const countries = require("./countries.json");

function webHook(title, subtitle, actionUser, user) {
  sendOnWebHook(
    title,
    subtitle,
    actionUser,
    user,
    config.webHooks.distriatorTransfer.id,
    config.webHooks.distriatorTransfer.token
  );
}

function getMostRecentPaymentRecordIfAny(records, author) {
  const businesses = businessData
    .filter(
      (a) => a.username.length > 0 && a.status.toLowerCase() === "whitelisted"
    )
    .map((a) => a.username);
  const filteredRecords = records
    .filter((h) => {
      const firstChecks =
        h[1].op[1].from === author &&
        businesses.includes(h[1].op[1].to) &&
        h[1].op[1].amount.includes("HBD") &&
        h[1].op[1].hasOwnProperty("memo") &&
        h[1].op[1].memo.length > 0 &&
        (h[1].op[1].memo.includes("v4v-") || h[1].op[1].memo.includes("kcs-"));
      if (!firstChecks) {
        return false;
      }
      let timestamp = h[1].timestamp;
      if (timestamp.toLowerCase().includes("z") === false) {
        timestamp = `${timestamp}Z`;
      }
      const transferPlus30Mins = dayjs(timestamp).add(30, "minute");
      if (dayjs().isBefore(transferPlus30Mins) === true) {
        return true;
      }
      return false;
    })
    .map((h) => {
      const guides = businessData
        .filter((a) => a.username === h[1].op[1].to)
        .map((a) => a.trusted_guides);
      const country = businessData
        .filter((a) => a.username === h[1].op[1].to)
        .map((a) => a.country);
      const businessGuides = guides[0];
      return {
        amount: h[1].op[1].amount,
        memo: h[1].op[1].memo,
        invoice: getInvoiceID(h[1].op[1].memo),
        timestamp: h[1].timestamp,
        business: h[1].op[1].to,
        guides: businessGuides,
        country: country[0],
      };
    });
  if (filteredRecords.length === 0) {
    return null;
  } else {
    return filteredRecords[filteredRecords.length - 1];
  }
}

async function getV4VPaymentHistory(client, author) {
  const businesses = businessData
    .filter(
      (a) => a.username.length > 0 && a.status.toLowerCase() === "whitelisted"
    )
    .map((a) => a.username);
  const op = dhive.utils.operationOrders;
  const operationsBitmask = dhive.utils.makeBitMaskFilter([op.custom_json]);
  const records = await client.database.getAccountHistory(
    config.distriator.v4v ?? "v4vapp",
    -1,
    1000,
    operationsBitmask
  );
  let filteredRecords = records.filter((r) => {
    return r[1].op[1].id === "v4vapp_transfer";
  });
  filteredRecords = filteredRecords
    .filter((r) => {
      const jsonString = r[1].op[1].json;
      const data = JSON.parse(jsonString);
      if (
        data.hasOwnProperty("hive_accname_from") &&
        data.hasOwnProperty("hive_accname_to") &&
        data.hasOwnProperty("memo") &&
        data.hasOwnProperty("pay_result") &&
        data.hasOwnProperty("invoice_message") &&
        data.hasOwnProperty("HBD")
      ) {
        if (
          data.hive_accname_from === author &&
          data.invoice_message.length > 0 &&
          data.invoice_message.includes("v4v-") &&
          businesses.includes(data.hive_accname_to)
        ) {
          let timestamp = r[1].timestamp;
          if (timestamp.toLowerCase().includes("z") === false) {
            timestamp = `${timestamp}Z`;
          }
          const transferPlus30Mins = dayjs(timestamp).add(30, "minute");
          if (dayjs().isBefore(transferPlus30Mins) === true) {
            return true;
          }
          return false;
        } else {
          return false;
        }
      } else {
        return false;
      }
    })
    .map((h) => {
      const jsonString = h[1].op[1].json;
      const data = JSON.parse(jsonString);
      const guides = businessData
        .filter((a) => a.username === data.hive_accname_to)
        .map((a) => a.trusted_guides);
      const country = businessData
        .filter((a) => a.username === data.hive_accname_to)
        .map((a) => a.country);
      const businessGuides = guides[0];
      let timestamp = h[1].timestamp;
      if (timestamp.toLowerCase().includes("z") === false) {
        timestamp = `${timestamp}Z`;
      }
      return {
        amount: `${data.HBD.toFixed(3)} HBD`,
        memo: data.invoice_message,
        invoice: getInvoiceID(data.invoice_message),
        timestamp: timestamp,
        business: data.hive_accname_to,
        guides: businessGuides,
        country: country[0],
      };
    });
  if (filteredRecords.length === 0) {
    return null;
  } else {
    return filteredRecords[filteredRecords.length - 1];
  }
}

async function getClaimsHistory(client, author, monthly, biweekly) {
  const op = dhive.utils.operationOrders;
  const operationsBitmask = dhive.utils.makeBitMaskFilter([op.transfer]);
  const records = await client.database.getAccountHistory(
    config.distriator.account ?? "thedistriator",
    -1,
    1000,
    operationsBitmask
  );
  const monthlyRecords = records
    .filter((h) => {
      const firstChecks =
        h[1].op[1].to === author &&
        h[1].op[1].amount.includes("HBD") &&
        h[1].op[1].hasOwnProperty("memo") &&
        h[1].op[1].memo.length > 0 &&
        (h[1].op[1].memo.includes("v4v-") || h[1].op[1].memo.includes("kcs-"));
      if (!firstChecks) {
        return false;
      }
      let timestamp = h[1].timestamp;
      if (timestamp.toLowerCase().includes("z") === false) {
        timestamp = `${timestamp}Z`;
      }
      const transferDate = dayjs(timestamp);
      if (transferDate.isAfter(dayjs(monthly)) === true) {
        return true;
      }
      return false;
    })
    .map((h) => {
      return {
        amount: h[1].op[1].amount,
        memo: h[1].op[1].memo,
        invoice: getInvoiceID(h[1].op[1].memo),
        timestamp: h[1].timestamp,
      };
    });
  const biweeklyRecords = records
    .filter((h) => {
      const firstChecks =
        h[1].op[1].to === author &&
        h[1].op[1].amount.includes("HBD") &&
        h[1].op[1].hasOwnProperty("memo") &&
        h[1].op[1].memo.length > 0 &&
        (h[1].op[1].memo.includes("v4v-") || h[1].op[1].memo.includes("kcs-"));
      if (!firstChecks) {
        return false;
      }
      let timestamp = h[1].timestamp;
      if (timestamp.toLowerCase().includes("z") === false) {
        timestamp = `${timestamp}Z`;
      }
      const transferDate = dayjs(timestamp);
      if (transferDate.isAfter(dayjs(biweekly)) === true) {
        return true;
      }
      return false;
    })
    .map((h) => {
      return {
        amount: h[1].op[1].amount,
        memo: h[1].op[1].memo,
        invoice: getInvoiceID(h[1].op[1].memo),
        timestamp: h[1].timestamp,
      };
    });
  return {
    monthly: monthlyRecords,
    biweekly: biweeklyRecords,
  };
}

async function getClaimData(account) {
  const leaderboardDates = getLeaderboardDates();
  const last500TransferRecordsOfAccount = await getTransfers(
    dhiveClient,
    account,
    500
  );
  let lastTransfer = getMostRecentPaymentRecordIfAny(
    last500TransferRecordsOfAccount,
    account
  );
  if (lastTransfer === null) {
    lastTransfer = await getV4VPaymentHistory(dhiveClient, account);
  }
  const claims = await getClaimsHistory(
    dhiveClient,
    account,
    leaderboardDates.monthlyLeaderboardDate,
    leaderboardDates.biweeklyLeaderboardDate
  );
  const invoices = claims.monthly.map((e) => e.invoice);
  let claimEntry =
    lastTransfer !== null
      ? invoices.includes(lastTransfer.invoice) === false
        ? lastTransfer
        : null
      : null;
  if (claimEntry !== null) {
    const discount = {
      0: 30.0,
      1: 35.0,
      2: 40.0,
      3: 45.0,
      4: 50.0,
      5: 55.0,
      6: 60.0,
      7: 60.0,
    };
    let discountPercent = discount[claims.biweekly.length % 8];
    let transactionAmount = parseFloat(claimEntry.amount.split(" ")[0]);
    let filteredCountries = countries.filter(
      (a) => a.name === claimEntry.country
    );
    if (
      filteredCountries.length > 0 &&
      transactionAmount > filteredCountries[0].limit
    ) {
      transactionAmount = filteredCountries[0].limit;
    }
    if (claimEntry.guides.length > 0) {
      discountPercent = discountPercent - 2.5;
      const perGuideValue = 2.5 / claimEntry.guides.length;
      // claimEntry.guides = claimEntry.guides;
      // claimEntry.guidesPercent = perGuideValue.toFixed(2);
      claimEntry.guides = claimEntry.guides.map((g) => {
        const claimValue = (transactionAmount * perGuideValue) / 100.0;
        return {
          name: g,
          percent: `${perGuideValue.toFixed(2)} %`,
          value: `${claimValue.toFixed(3)} HBD`,
        };
      });
    }
    discountPercent = discountPercent - 2.5;
    const result = await dhiveClient.database.getAccounts([account]);
    const accountInfo = result[0];
    claimEntry.onborder = {
      name: accountInfo.recovery_account,
      percent: "2.5 %",
      value: `${((transactionAmount * 2.5) / 100.0).toFixed(3)} HBD`,
    };
    const claimValue = (transactionAmount * discountPercent) / 100.0;
    claimEntry = {
      ...claimEntry,
      percentage: `${discountPercent.toFixed(2)} %`,
      claimValue: `${claimValue.toFixed(3)} HBD`,
    };
  }
  return {
    claim: claimEntry,
    monthly: claims.monthly,
    biweekly: claims.biweekly,
  };
}

router.get("/", tokenValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  const result = await getClaimableAmount(dhiveClient, req.username);
  if (result.claimValue === "") {
    return res.status(500).json({
      error: `Payment not found to claim HBD`,
    });
  } else {
    return res.send(result);
  }
});

router.get("/v2", tokenValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  const result = await getClaimData(req.username);
  logger.info(`${req.username}'s claim data - ${JSON.stringify(result.claim)}`);
  return res.send(result);
});

router.get(
  "/v2/reward/:permlink/:invoice",
  tokenValidation,
  async (req, res) => {
    logger.info(
      `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
    );
    const permlink = req.params.permlink;
    const username = req.username;
    const invoice = req.params.invoice;
    if (permlink === null || permlink === undefined || permlink.length === 0) {
      return res.status(500).json({
        error: "Please provide permlink.",
      });
    }
    if (invoice === null || invoice === undefined || invoice.length === 0) {
      return res.status(500).json({
        error: "Please provide invoice.",
      });
    }
    // Check 1 - Do we have post?
    const postData = await dhiveClient.call("bridge", "get_post", {
      author: username,
      permlink: permlink,
    });
    // Check 2 - Do we have post JSON MetaData?
    if (postData.hasOwnProperty("json_metadata") === false) {
      return res.status(500).json({
        error: "Post does not have JSON MetaData",
      });
    }
    // Check 3 - Do we have post JSON MetaData app, businessname, invoiceid?
    if (
      postData.json_metadata.hasOwnProperty("app") === false ||
      postData.json_metadata.hasOwnProperty("business_name") === false ||
      postData.json_metadata.hasOwnProperty("invoice_id") === false
    ) {
      return res.status(500).json({
        error: "Post does not have VALID JSON MetaData",
      });
    }
    // Check 4 - Do we have beneficiaries, HBD & payout settings?
    // and do we have community?
    if (
      postData.hasOwnProperty("beneficiaries") === false ||
      postData.hasOwnProperty("max_accepted_payout") === false ||
      postData.hasOwnProperty("percent_hbd") === false ||
      postData.hasOwnProperty("community_title") === false ||
      postData.hasOwnProperty("community") === false ||
      postData.hasOwnProperty("created") === false
    ) {
      return res.status(500).json({
        error: "Post does not enough attributes to pass validation",
      });
    }
    // Check 5 - Was post created within last 30 mins?
    let postCreated = postData.created;
    if (postCreated.toLowerCase().includes("z") === false) {
      postCreated = `${postCreated}Z`;
    }
    const postThirtyMins = dayjs(postCreated).add(30, "minute");
    const now = dayjs();
    if (now.isAfter(postThirtyMins) === true) {
      return res.status(500).json({
        error: `Post is older than 30 mins for claim`,
      });
    }
    // Check 6 - Is distriator.bene set?
    if (
      postData.beneficiaries.length !== 1 ||
      postData.beneficiaries[0].hasOwnProperty("account") === false ||
      postData.beneficiaries[0].hasOwnProperty("weight") === false ||
      postData.beneficiaries[0].account !== "distriator.bene" ||
      postData.beneficiaries[0].weight !== 6000
    ) {
      return res.status(500).json({
        error: "Post beneficiary check failed.",
      });
    }
    // Check 6 - Is right community?
    if (
      postData.community !== "hive-106130" ||
      postData.community_title !== "SpendHBD"
    ) {
      return res.status(500).json({
        error: "Post community validation failed",
      });
    }
    // Check 7 - Is this business supported?
    const businesses = businessData
      .filter(
        (a) =>
          // a.payment_methods.toLowerCase().includes("hbd") &&
          a.username.length > 0 && a.status.toLowerCase() === "whitelisted"
      )
      .map((a) => a.username);
    if (businesses.includes(postData.json_metadata.business_name) === false) {
      return res.status(500).json({
        error: `Business - ${postData.json_metadata.business_name} is not yet supported for HBD rewards.`,
      });
    }
    // Check 8 - Do we have valid HBD setting?
    if (
      postData.max_accepted_payout !== "100000.000 HBD" ||
      postData.percent_hbd !== 10000
    ) {
      return res.status(500).json({
        error: `Post has not valid payout settings`,
      });
    }
    // Check 9 - Do we have valid invoice in post-json-meta-data?
    if (
      postData.json_metadata.invoice_id.length === 0 ||
      (postData.json_metadata.invoice_id.startsWith("v4v-") === false &&
        postData.json_metadata.invoice_id.startsWith("kcs-") === false)
    ) {
      return res.status(500).json({
        error: `Post does not have invoice ID`,
      });
    }
    // Check 10 - Do we have matching invoice?
    const result = await getClaimData(username);
    if (
      result.claim === null ||
      result.claim.invoice !== postData.json_metadata.invoice_id
    ) {
      return res.status(500).json({
        error: `Invoice mismatch`,
      });
    }
    // Check 11 - Do we have matching business name?
    if (result.claim.business !== postData.json_metadata.business_name) {
      return res.status(500).json({
        error: `Business mismatch`,
      });
    }
    const hbdTransferResult = await hbdTransfer(
      dhiveClient,
      dhive.PrivateKey.from(config.distriator.key),
      username,
      result.claim.claimValue,
      permlink,
      config.distriator.account,
      result.claim.percentage,
      result.claim.invoice,
      postData.json_metadata.business_display_name,
      result.claim.guides,
      result.claim.onborder
    );
    webHook(
      `Sent ${result.claim.claimValue} to ${username}`,
      `@${config.distriator.account} sent ${result.claim.claimValue}\nTo: @${username}\nClaim in Percentage: ${result.claim.percentage}\nInvoice: ${postData.json_metadata.invoice_id}\nBusiness HiveUsername: ${postData.json_metadata.business_name}\nReviewPost: https://peakd.com/@${username}/${permlink}`,
      config.distriator.account,
      username
    );

    return res.send({
      message: "success",
      success: true,
      result: "Success validating username & post",
      data: hbdTransferResult,
    });
  }
);

exports.claimRouter = router;

// async function main() {
//   const data = await getClaimData("arlettep");
//   logger.info(`${JSON.stringify(data)}`);
// }

// main();
