let logger = require("node-color-log");

const express = require("express");
var router = express.Router();

const { tokenValidation } = require("../utils/auth");
const ownerRepository = require("../database/owner_repository");

const { sendOnWebHook } = require("../utils/discord_webhooks");

const { config } = require('../config');

function webHook(title, subtitle, actionUser, user) {
  sendOnWebHook(
    title,
    subtitle,
    actionUser,
    user,
    config.webHooks.owner.id,
    config.webHooks.owner.token,
  );
}

router.get("/", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "admin" && req.usertype !== "super" && req.usertype !== "guide") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const all = await ownerRepository.getAllOwners();
  const records = all.map((a) => {
    return { username: a.username, banned: a.banned, biweekly: a.biweeklyLimit, daily: a.perDayLimit };
  });
  res.send(records);
});

router.get("/add/:username", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "admin" && req.usertype !== "super" && req.usertype !== "guide") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const username = req.params.username;
  if (username === null || username === undefined || username.length === 0) {
    return res.status(500).json({
      error: "Please provide username to add as an owner.",
    });
  }
  try {
    await ownerRepository.broadcast_distriator_owner_add(username);
    webHook(
      "Owner Added",
      `Owner ${username} added by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Owner ${username} add - broadcasted on Hive Blockchain successfully` });
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
      error: "Please provide username to remove as an owner.",
    });
  }
  try {
    await ownerRepository.broadcast_distriator_owner_remove(username);
    webHook(
      "Owner Removed",
      `Owner ${username} removed by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Owner ${username} remove - broadcasted on Hive Blockchain successfully` });
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
      error: "Please provide username to ban as an owner.",
    });
  }
  try {
    await ownerRepository.broadcast_distriator_owner_update(username, true);
    webHook(
      "Owner Banned",
      `Owner ${username} banned by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Owner ${username} ban - broadcasted on Hive Blockchain successfully` });
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
      error: "Please provide username to unban as an owner.",
    });
  }
  try {
    await ownerRepository.broadcast_distriator_owner_update(username, false);
    webHook(
      "Owner Unbanned",
      `Owner ${username} unbanned by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Owner ${username} unban - broadcasted on Hive Blockchain successfully` });
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

exports.ownerRouter = router;
