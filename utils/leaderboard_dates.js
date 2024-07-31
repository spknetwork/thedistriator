const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

function getLeaderboardDates() {
  const today = dayjs().toISOString();
  const part = today.substring(0, 7);
  const firstOfMonth = dayjs(`${part}-01T00:00:00.0Z`);
  const fifteenOfMonth = dayjs(`${part}-15T00:00:00.0Z`);
  if (fifteenOfMonth.isBefore(dayjs())) {
    return {
      biweeklyLeaderboardDate: fifteenOfMonth.toISOString(),
      monthlyLeaderboardDate: firstOfMonth.toISOString(),
    };
  } else {
    return {
      biweeklyLeaderboardDate: firstOfMonth.toISOString(),
      monthlyLeaderboardDate: firstOfMonth.toISOString(),
    };
  }
}

exports.getLeaderboardDates = getLeaderboardDates;