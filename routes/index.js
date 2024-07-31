let logger = require("node-color-log");

const { config } = require("../config.js");

const express = require("express");
var router = express.Router();

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

const jwt = require("jsonwebtoken");

const businessData = require("../database/businesses_v2.json");

const dbCrypto = require("../utils/custom_crypto.js");
const { getDataToSign, tokenValidation } = require("../utils/auth.js");

const { adminRouter } = require("./admin.js");
const { ownerRouter } = require("./owner.js");
const { guideRouter } = require("./guide.js");
const { claimRouter } = require("./claim.js");
const { businessRouter } = require("./business.js");
const { userRouter } = require("./user.js");
const { placesRouter } = require("./places.js");
const { countriesRouter } = require("./countries.js");

router.use("/admin", adminRouter);
router.use("/owner", ownerRouter);
router.use("/guide", guideRouter);
router.use("/user", userRouter);
router.use("/claims", claimRouter);
router.use("/business", businessRouter);
router.use("/places", placesRouter);
router.use("/countries", countriesRouter);

router.get("/", (req, res) => {
  res.status(200);
  res.send("Welcome to root URL of Server");
});

router.post("/login", async (req, res) => {
  const challenge = req.body.challenge;
  const username = req.body.username;
  const pubkey = req.body.pubkey;
  const proof = req.body.proof;
  try {
    var dataToSign = await getDataToSign(challenge, username, pubkey, proof);
    var token = jwt.sign(dataToSign, config.crypto.jwt, {
      expiresIn: "30d",
    });
    return res.send({
      token: token,
      type: dataToSign.type,
    });
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

router.get("/businesses", async (req, res) => {
  let data = businessData;
  data = JSON.stringify(data);
  data = dbCrypto.encryptData(data);
  return res.send({ data: data });
});

router.get("/businesses_data", tokenValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  let data = JSON.stringify(businessData);
  data = dbCrypto.encryptData(data);
  return res.send({ data: data });
});

exports.indexRouter = router;
