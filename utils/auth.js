let logger = require("node-color-log");

const { config } = require('../config.js');

const dayjs = require("dayjs");
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

const dhive = require("@hiveio/dhive");
const jwt = require("jsonwebtoken");

const mongoDB = require("../database/mongoDB.js");
const { dhiveClient } = require("./dhive.js");

async function getDataToSign(challenge, username, pubkey, proof) {
  if (username == null) {
    throw "Please provide Hive username.";
  }
  if (challenge == null) {
    throw "Please provide challenge.";
  }
  if (pubkey == null) {
    throw "Please provide pubkey.";
  }
  if (proof == null) {
    throw "Please provide proof.";
  }
  // need to work on expiry
  let proofDay = dayjs(proof).add(30, 'second');
  let nowDay = dayjs()
  // .add(5, "minute");
  // .add(1, "day");
  //.add(30, 'second');

  if (nowDay.isAfter(proofDay)) {
    throw "Proof has expired. Please try again";
  }
  const accounts = await dhiveClient.database.getAccounts([username]);
  if (accounts.length !== 1) {
    throw "Invalid Hive Username.";
  }
  const postingPublicKeys = accounts[0].posting.key_auths.map((e) => e[0]);
  if (postingPublicKeys.includes(pubkey) === false) {
    throw `Invalid Hive PubKey. ${pubkey} does not belong to ${username}`;
  }
  const sigValidity = dhive.PublicKey.fromString(pubkey).verify(
    Buffer.from(dhive.cryptoUtils.sha256(proof)),
    dhive.Signature.fromBuffer(Buffer.from(challenge, "hex"))
  );
  if (sigValidity !== true) {
    throw `Invalid Signature. ${challenge} does not belong to ${username}`;
  }
  const bannedError = "You do not have access to this resources (banned).";
  const superAdmin = await mongoDB.SuperAdmin.findOne({ username: username });
  if (superAdmin !== null) {
    logger.info(`Super admin logging in ${username}`);
    return { username: username, type: "super" };
  }
  const admin = await mongoDB.Admin.findOne({ username: username });
  if (admin !== null) {
    if (admin.banned) {
      throw bannedError;
    } else {
      logger.info(`Admin logging in ${username}`);
      return { username: username, type: "admin" };
    }
  }

  const owner = await mongoDB.BusinessOwner.findOne({ username: username });
  if (owner !== null) {
    if (owner.banned) {
      throw bannedError;
    } else {
      logger.info(`Owner logging in ${username}`);
      return { username: username, type: "owner" };
    }
  }

  const guide = await mongoDB.Guide.findOne({ username: username });
  if (guide !== null) {
    if (guide.banned) {
      throw bannedError;
    } else {
      logger.info(`Guide logging in ${username}`);
      return { username: username, type: "guide" };
    }
  }

  let user = await mongoDB.User.findOne({ username: username });
  if (user !== null) {
    if (user.banned) {
      throw bannedError;
    } else {
      logger.info(`A Regular User logging in ${username}`);
      return { username: username, type: "user" };
    }
  } else {
    const user = new mongoDB.User({ username: username });
    await user.save();
    logger.info(`A Regular User logging in ${username}`);
    return { username: username, type: "user" };
  }
}

async function tokenValidation(req, res, next) {
  try {
    if ("authorization" in req.headers === false) {
      throw "Authorization header not found in the request";
    }
    const token = req.headers["authorization"].replace("Bearer ", "");
    let usr = jwt.verify(token, config.crypto.jwt);
    logger.info(`User ${usr.username} trying to access ${req.baseUrl}${req.path}`);
    const bannedError = "You do not have access to this resources (banned).";
    const superAdmin = await mongoDB.SuperAdmin.findOne({
      username: usr.username,
    });
    if (superAdmin !== null) {
      req.usertype = "super";
      req.username = usr.username;
      return next();
    }
    const admin = await mongoDB.Admin.findOne({ username: usr.username });
    if (admin !== null) {
      if (admin.banned) {
        throw bannedError;
      } else {
        req.usertype = "admin";
        req.username = usr.username;
        return next();
      }
    }

    const owner = await mongoDB.BusinessOwner.findOne({ username: usr.username });
    if (owner !== null) {
      if (owner.banned) {
        throw bannedError;
      } else {
        req.usertype = "owner";
        req.username = usr.username;
        return next();
      }
    }

    const guide = await mongoDB.Guide.findOne({ username: usr.username });
    if (guide !== null) {
      if (guide.banned) {
        throw bannedError;
      } else {
        req.usertype = "guide";
        req.username = usr.username;
        return next();
      }
    }

    let user = await mongoDB.User.findOne({ username: usr.username });
    if (user !== null) {
      if (user.banned) {
        throw bannedError;
      } else {
        req.usertype = "user";
        req.username = usr.username;
        return next();
      }
    } else {
      throw `Authentication not found for user - ${user.username}. Please login again.`
    }
  } catch (e) {
    return res.status(500).send({ error: e.toString() });
  }
}

async function skipValidation(req, res, next) {
  try {
    if ("authorization" in req.headers === false) {
      req.usertype = "";
      req.username = "";
      return next();
    }
    const token = req.headers["authorization"].replace("Bearer ", "");
    let usr = jwt.verify(token, config.crypto.jwt);
    logger.info(`User ${usr.username} trying to access ${req.baseUrl}${req.path}`);
    const bannedError = "You do not have access to this resources (banned).";
    const superAdmin = await mongoDB.SuperAdmin.findOne({
      username: usr.username,
    });
    if (superAdmin !== null) {
      req.usertype = "super";
      req.username = usr.username;
      return next();
    }
    const admin = await mongoDB.Admin.findOne({ username: usr.username });
    if (admin !== null) {
      if (admin.banned) {
        throw bannedError;
      } else {
        req.usertype = "admin";
        req.username = usr.username;
        return next();
      }
    }

    const owner = await mongoDB.BusinessOwner.findOne({ username: usr.username });
    if (owner !== null) {
      if (owner.banned) {
        throw bannedError;
      } else {
        req.usertype = "owner";
        req.username = usr.username;
        return next();
      }
    }

    const guide = await mongoDB.Guide.findOne({ username: usr.username });
    if (guide !== null) {
      if (guide.banned) {
        throw bannedError;
      } else {
        req.usertype = "guide";
        req.username = usr.username;
        return next();
      }
    }

    let user = await mongoDB.User.findOne({ username: usr.username });
    if (user !== null) {
      if (user.banned) {
        throw bannedError;
      } else {
        req.usertype = "user";
        req.username = usr.username;
        return next();
      }
    } else {
      req.usertype = "";
      req.username = "";
      return next();
    }
  } catch (e) {
    return res.status(500).send({ error: e.toString() });
  }
}

exports.getDataToSign = getDataToSign;
exports.tokenValidation = tokenValidation;
exports.skipValidation = skipValidation;