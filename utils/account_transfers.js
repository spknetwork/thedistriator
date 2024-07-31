const dhive = require("@hiveio/dhive");

async function getTransfers(client, author, limit) {
  const op = dhive.utils.operationOrders;
  const operationsBitmask = dhive.utils.makeBitMaskFilter([op.transfer]);
  const records = await client.database.getAccountHistory(
    author,
    -1,
    limit,
    operationsBitmask
  );
  return records;
}

exports.getTransfers = getTransfers;