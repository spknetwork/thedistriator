let logger = require("node-color-log");

var fs = require("fs/promises");
const Joi = require("joi");

const express = require("express");
var router = express.Router();

const { tokenValidation } = require("../utils/auth");

const countries = require("./countries.json");

router.get("/", tokenValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  if (req.usertype !== "super" && req.usertype !== "admin") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  return res.send(countries);
});

router.post("/", tokenValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  if (req.usertype !== "super" && req.usertype !== "admin") {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const schema = Joi.object().keys({
    name: Joi.string().required(),
    code: Joi.string().required(),
    limit: Joi.number().integer().min(1).max(15).required(),
  });
  try {
    try {
      const value = await schema.validateAsync(req.body);
    } catch (e) {
      const message = err.annotate();
      return res.status(422).json({
        error: message,
      });
    }
    const country = countries.filter((a) => {
      return a.name === req.body.name && a.code === req.body.code;
    });
    if (country.length !== 1) {
      return res.status(422).json({
        error: `Invalid country & country code`,
      });
    }
    countries.find((e, i) => {
      if (e.name === req.body.name && e.code === req.body.code) {
        countries[i] = {
          name: req.body.name,
          code: req.body.code,
          limit: parseInt(req.body.limit),
        };
        return true;
      }
    });
    await fs.writeFile(`./countries.json`, JSON.stringify(countries));
    return res.send(countries);
  } catch (err) {
    return res.status(422).json({
      error: err.toString(),
    });
  }
});

exports.countriesRouter = router;
