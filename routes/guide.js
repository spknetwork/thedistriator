let logger = require("node-color-log");

const express = require("express");
var router = express.Router();

const { tokenValidation } = require("../utils/auth");
const guideRepository = require("../database/guide_repository");

const { sendOnWebHook } = require("../utils/discord_webhooks");
const { config } = require('../config');

function webHook(title, subtitle, actionUser, user) {
  sendOnWebHook(
    title,
    subtitle,
    actionUser,
    user,
    config.webHooks.guide.id,
    config.webHooks.guide.token,
  );
}

router.get("/", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "admin" && req.usertype !== "super") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const all = await guideRepository.getAllGuides();
  const records = all.map((a) => {
    return { username: a.username, banned: a.banned, biweekly: a.biweeklyLimit, daily: a.perDayLimit };
  });
  res.send(records);
});

router.get("/add/:username", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "admin" && req.usertype !== "super") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const username = req.params.username;
  if (username === null || username === undefined || username.length === 0) {
    return res.status(500).json({
      error: "Please provide username to add as a guide.",
    });
  }
  try {
    await guideRepository.broadcast_distriator_guide_add(username);
    webHook(
      "Guide Added",
      `Guide ${username} added by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Guide ${username} add - broadcasted on Hive Blockchain successfully` });
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

router.get("/remove/:username", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "admin" && req.usertype !== "super") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const username = req.params.username;
  if (username === null || username === undefined || username.length === 0) {
    return res.status(500).json({
      error: "Please provide username to remove as a guide.",
    });
  }
  try {
    await guideRepository.broadcast_distriator_guide_remove(username);
    webHook(
      "Guide Removed",
      `Guide ${username} removed by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Guide ${username} remove - broadcasted on Hive Blockchain successfully` });
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

router.get("/ban/:username", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "admin" && req.usertype !== "super") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const username = req.params.username;
  if (username === null || username === undefined || username.length === 0) {
    return res.status(500).json({
      error: "Please provide username to ban as a guide.",
    });
  }
  try {
    await guideRepository.broadcast_distriator_guide_update(username, true);
    webHook(
      "Guide Banned",
      `Guide ${username} banned by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Guide ${username} ban - broadcasted on Hive Blockchain successfully` });
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

router.get("/unban/:username", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "admin" && req.usertype !== "super") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const username = req.params.username;
  if (username === null || username === undefined || username.length === 0) {
    return res.status(500).json({
      error: "Please provide username to unban as a guide.",
    });
  }
  try {
    await guideRepository.broadcast_distriator_guide_update(username, false);
    webHook(
      "Guide Unbanned",
      `Guide ${username} unbanned by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Guide ${username} unban - broadcasted on Hive Blockchain successfully` });
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

exports.guideRouter = router;
