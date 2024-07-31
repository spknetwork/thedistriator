const { config } = require("../config");
const dhive = require("@hiveio/dhive");

async function hbdTransfer(
  client,
  key,
  receiver,
  hbd,
  permlink,
  account,
  percentage,
  invoice_id,
  business_name,
  guides,
  onborder
) {
  let op = [
    [
      "transfer",
      {
        from: account,
        to: receiver,
        amount: hbd,
        memo: `You claimed back ${percentage} of payment (${invoice_id}) & adding review of a ${business_name} - https://peakd.com/@${receiver}/${permlink}`,
      },
    ],
    [
      "transfer",
      {
        from: account,
        to: onborder.name,
        amount: onborder.value,
        memo: `Thank you for helping to onboard ${receiver} to Hive. Related review - https://peakd.com/@${receiver}/${permlink}`,
      },
    ],
  ];
  if (guides !== undefined && guides !== null && guides.length > 0) {
    guides.forEach((g) => {
      op.push([
        "transfer",
        {
          from: account,
          to: g.name,
          amount: g.value,
          memo: `Thank you for helping to onboard ${business_name} to Hive. Related review - https://peakd.com/@${receiver}/${permlink}`,
        },
      ]);
    });
  }
  try {
    const result = await client.broadcast.sendOperations(op, key);
    return result;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function broadcastOps(json) {
  const key = dhive.PrivateKey.from(config.distriator.key);
  const ops = [
    "custom_json",
    {
      ...json,
      required_auths: [],
      required_posting_auths: [config.distriator.account],
    },
  ];
  const op = [ops];
  try {
    logger.info(`Broadcasting operation ${JSON.stringify(ops)}`);
    const result = await client.broadcast.sendOperations(op, key);
    logger.info(`Operation broadcasted. Result is - ${JSON.stringify(result)}`);
  } catch (e) {
    logger.error(e);
    throw e;
  }
}

module.exports = {
  hbdTransfer,
  broadcastOps,
};
