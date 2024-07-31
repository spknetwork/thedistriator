const mongoose = require("mongoose");

// A Business Owner can own multiple businesses.
// A Business Owner can not change business status (Whitelisted / Listed)
// A Business Owner can update business contact details, address etc.
const BusinessOwnerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  banned: { type: Boolean, required: true, default: false },
});
exports.BusinessOwner = mongoose.model("BusinessOwner", BusinessOwnerSchema);