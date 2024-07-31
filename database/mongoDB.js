let logger = require("node-color-log");

const { config } = require("../config");

const mongoose = require("mongoose");

const { SuperAdmin } = require('./schemas/mongoose/super_admin')
const { Admin } = require('./schemas/mongoose/admin')
const { Guide } = require('./schemas/mongoose/guide')
const { BusinessOwner } = require('./schemas/mongoose/owner')
const { User } = require('./schemas/mongoose/user')
const { Business } = require('./schemas/mongoose/business')
const { Review } = require('./schemas/mongoose/review')

exports.SuperAdmin = SuperAdmin;
exports.Admin = Admin;
exports.Guide = Guide;
exports.BusinessOwner = BusinessOwner;
exports.User = User;
exports.Business = Business;
exports.Review = Review;

async function connectDB() {
  logger.info(`DB string is ${config.app.db}`);
  await mongoose.connect(config.app.db, {
    connectTimeoutMS: 30000,
  });
}

exports.connectDB = connectDB;
