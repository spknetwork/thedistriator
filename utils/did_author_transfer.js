var dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

const dhive = require("@hiveio/dhive");

const businessData = require("../database/businesses_v2.json");
const { config } = require("../config");
const logger = require("node-color-log");

const { getInvoiceID } = require("./invoice_id.js");

function filterHistory(records, author) {
  const businesses = businessData.map((a) => a.username);
  const filteredRecords = records.filter((h) => {
    const firstChecks =
      h[1].op[1].from === author &&
      businesses.includes(h[1].op[1].to) &&
      h[1].op[1].amount.includes("HBD") &&
      h[1].op[1].hasOwnProperty("memo") &&
      h[1].op[1].memo.length > 0;
    if (!firstChecks) {
      return false;
    }
    let timestamp = h[1].timestamp;
    if (timestamp.toLowerCase().includes("z") === false) {
      timestamp = `${timestamp}Z`;
    }
    const transferPlus7Days = dayjs(timestamp).add(7, "day");
    if (
      dayjs().isBefore(transferPlus7Days) === true &&
      (h[1].op[1].memo.includes("v4v-") || h[1].op[1].memo.includes("kcs-"))
    ) {
      return true;
    }
    return false;
  });
  return filteredRecords.length;
}

async function getClaimsForAuthor(client, author) {
  const op = dhive.utils.operationOrders;
  const operationsBitmask = dhive.utils.makeBitMaskFilter([op.transfer]);
  const distriatorResponse = await client.database.getAccountHistory(
    config.distriator.account,
    -1,
    100,
    operationsBitmask
  );
  const distriatorHistoryData = distriatorResponse
    .filter((h) => {
      return (
        h[1].op[1].to === author &&
        h[1].op[1].amount.includes("HBD") &&
        h[1].op[1].hasOwnProperty("memo") &&
        h[1].op[1].memo.length > 0 &&
        (h[1].op[1].memo.includes("v4v-") || h[1].op[1].memo.includes("kcs-"))
      );
    })
    .map((h) => {
      return {
        amount: h[1].op[1].amount,
        memo: h[1].op[1].memo,
        invoice: getInvoiceID(h[1].op[1].memo),
        timestamp: h[1].timestamp,
      };
    });
  return distriatorHistoryData;
}

async function getClaimableAmount(client, author) {
  const op = dhive.utils.operationOrders;
  const businesses = businessData;
  const businessesName = businesses.map((e) => e.username);
  const operationsBitmask = dhive.utils.makeBitMaskFilter([op.transfer]);
  const response = await client.database.getAccountHistory(
    author,
    -1,
    100,
    operationsBitmask
  );
  let historyData = response
    .filter((h) => {
      let timestamp = h[1].timestamp;
      if (timestamp.toLowerCase().includes("z") === false) {
        timestamp = `${timestamp}Z`;
      }
      let transferPlusThirtyMins = dayjs(timestamp)
      transferPlusThirtyMins = transferPlusThirtyMins.add(30, "minute");
      return (
        h[1].op[1].from === author &&
        businessesName.includes(h[1].op[1].to) &&
        h[1].op[1].amount.includes("HBD") &&
        h[1].op[1].hasOwnProperty("memo") &&
        h[1].op[1].memo.length > 0 &&
        dayjs().isBefore(transferPlusThirtyMins) &&
        (h[1].op[1].memo.includes("v4v-") || h[1].op[1].memo.includes("kcs-"))
      );
    })
    .map((h) => {
      return {
        amount: h[1].op[1].amount,
        to: h[1].op[1].to,
        memo: h[1].op[1].memo,
        invoice: getInvoiceID(h[1].op[1].memo),
        timestamp: h[1].timestamp,
      };
    });
  const alreadyClaimed = await getClaimsForAuthor(client, author);
  const invoices = alreadyClaimed.map((e) => e.invoice);
  historyData = historyData.filter((e) => {
    return invoices.includes(e.invoice) === false;
  });
  if (historyData.length === 0) {
    return { claimValue: "", percentage: "", timestamp: "" };
  }

  let amount = parseFloat(historyData[0].amount.replaceAll(" HBD", ""));
  const count = filterHistory(response, author);
  let percentage = "0%";
  if (count === 0) {
    percentage = "30 %";
    amount = (amount * 30) / 100;
  } else if (count === 2) {
    percentage = "35 %";
    amount = (amount * 35) / 100;
  } else if (count === 3) {
    percentage = "40 %";
    amount = (amount * 40) / 100;
  } else if (count === 4) {
    percentage = "45 %";
    amount = (amount * 45) / 100;
  } else if (count === 5) {
    percentage = "50 %";
    amount = (amount * 50) / 100;
  } else if (count === 6) {
    percentage = "55 %";
    amount = (amount * 55) / 100;
  } else {
    percentage = "60 %";
    amount = (amount * 60) / 100;
    // const rndInt = randomIntFromInterval(35, 100);
    // percentage = `${rndInt} %`;
    // amount = (amount * rndInt) / 100;
  }
  if (amount > 10.0) {
    amount = 10;
  }
  let timestamp = historyData[0].timestamp;
  if (timestamp.toLowerCase().includes("z") === false) {
    timestamp = `${timestamp}Z`;
  }
  return {
    claimValue: `${amount.toFixed(3)} HBD`,
    percentage,
    timestamp,
    invoice: historyData[0].invoice,
    memo: historyData[0].memo,
    business: historyData[0].to,
    amount: historyData[0].amount,
  };
}

async function getClaimAmount(client, author, business, invoice_id) {
  const op = dhive.utils.operationOrders;
  const operationsBitmask = dhive.utils.makeBitMaskFilter([op.transfer]);
  const response = await client.database.getAccountHistory(
    author,
    -1,
    1000,
    operationsBitmask
  );
  const historyData = response.filter((h) => {
    const firstChecks =
      h[1].op[1].from === author &&
      h[1].op[1].to === business &&
      h[1].op[1].amount.includes("HBD") &&
      h[1].op[1].hasOwnProperty("memo") &&
      h[1].op[1].memo.length > 0;
    if (!firstChecks) {
      return false;
    }
    let timestamp = h[1].timestamp;
    if (timestamp.toLowerCase().includes("z") === false) {
      timestamp = `${timestamp}Z`;
    }
    const transferPlusThirtyMins = dayjs(timestamp).add(30, "minute");
    if (
      h[1].op[1].memo.includes(invoice_id) &&
      dayjs().isBefore(transferPlusThirtyMins)
    ) {
      return true;
    }
    return false;
  });
  if (historyData.length === 0) {
    return { claimValue: "", percentage: "" };
  }
  let amount = parseFloat(
    historyData[0][1].op[1].amount.replaceAll(" HBD", "")
  );
  const count = filterHistory(response, author);
  let percentage = "0%";
  if (count === 0) {
    percentage = "30 %";
    amount = (amount * 30) / 100;
  } else if (count === 2) {
    percentage = "35 %";
    amount = (amount * 35) / 100;
  } else if (count === 3) {
    percentage = "40 %";
    amount = (amount * 40) / 100;
  } else if (count === 4) {
    percentage = "45 %";
    amount = (amount * 45) / 100;
  } else if (count === 5) {
    percentage = "50 %";
    amount = (amount * 50) / 100;
  } else if (count === 6) {
    percentage = "55 %";
    amount = (amount * 55) / 100;
  } else {
    percentage = "60 %";
    amount = (amount * 60) / 100;
    // const rndInt = randomIntFromInterval(35, 100);
    // percentage = `${rndInt} %`;
    // amount = (amount * rndInt) / 100;
  }
  if (amount > 10.0) {
    amount = 10;
  }
  return {
    claimValue: `${amount.toFixed(3)} HBD`,
    percentage: percentage,
  };
}

exports.getClaimAmount = getClaimAmount;
exports.getClaimableAmount = getClaimableAmount;
