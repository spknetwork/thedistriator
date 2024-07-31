let logger = require("node-color-log");

const express = require("express");
const dhive = require("@hiveio/dhive");
const dayjs = require("dayjs");
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

const jwt = require("jsonwebtoken");

const { config } = require("./config");
const mongoDB = require("./database/mongoDB.js");

const { indexRouter } = require("./routes/index.js");
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./swagger.json');

var app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
  res.locals = Object.assign(res.locals, global);
  res.header("Access-Control-Allow-Origin", req.header("Origin"));
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

app.use("/", indexRouter);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

const port = config.app.port || 3000;
app.listen(port, async () => {
  logger.info(`Server running on port ${port}`);
  await mongoDB.connectDB();
});
