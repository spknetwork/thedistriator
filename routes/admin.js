let logger = require("node-color-log");

const express = require("express");
var router = express.Router();

const { tokenValidation } = require("../utils/auth");
const { sendOnWebHook } = require("../utils/discord_webhooks");
const adminRepository = require("../database/admin_repository");

const { config } = require('../config');

function webHook(title, subtitle, actionUser, user) {
  sendOnWebHook(
    title,
    subtitle,
    actionUser,
    user,
    config.webHooks.admin.id,
    config.webHooks.admin.token,
  );
}

router.get("/", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "super") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const all = await adminRepository.getAllAdmins();
  const records = all.map((a) => {
    return { username: a.username, banned: a.banned, biweekly: a.biweeklyLimit, daily: a.perDayLimit };
  });
  res.send(records);
});

router.get("/add/:username", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "super") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const username = req.params.username;
  if (username === null || username === undefined || username.length === 0) {
    return res.status(500).json({
      error: "Please provide username to add as an admin.",
    });
  }
  try {
    await adminRepository.broadcast_distriator_admin_add(username);
    webHook(
      "Admin Added",
      `Admin ${username} added successfully by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Admin ${username} add - broadcasted on Hive Blockchain successfully` });
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

router.get("/remove/:username", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "super") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const username = req.params.username;
  if (username === null || username === undefined || username.length === 0) {
    return res.status(500).json({
      error: "Please provide username to remove as an admin.",
    });
  }
  try {
    await adminRepository.broadcast_distriator_admin_remove(username);
    webHook(
      "Admin Removed",
      `Admin ${username} removed by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Admin ${username} remove - broadcasted on Hive Blockchain successfully` });
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

router.get("/ban/:username", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "super") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const username = req.params.username;
  if (username === null || username === undefined || username.length === 0) {
    return res.status(500).json({
      error: "Please provide username to ban as an admin.",
    });
  }
  try {
    await adminRepository.distriator_admin_update(username, true);
    webHook(
      "Admin Banned",
      `Admin ${username} banned by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Admin ${username} ban - broadcasted on Hive Blockchain successfully` });
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

router.get("/unban/:username", tokenValidation, async (req, res) => {
  logger.info(`Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`);
  if (req.usertype !== "super") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const username = req.params.username;
  if (username === null || username === undefined || username.length === 0) {
    return res.status(500).json({
      error: "Please provide username to unban as an admin.",
    });
  }
  try {
    await adminRepository.distriator_admin_update(username, false);
    webHook(
      "Admin Unbanned",
      `Admin ${username} unbanned by super-admin ${req.username}`,
      req.username,
      username
    );
    res.send({ message: `Admin ${username} unban - broadcasted on Hive Blockchain successfully` });
  } catch (e) {
    return res.status(500).json({
      error: e.toString(),
    });
  }
});

exports.adminRouter = router;
