const mongoose = require("mongoose");

// A regular user can send request to claim rewards from Distriator Subscribed businesses
// A regular user can send request to claim rewards for Distriator Campaigns
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  banned: { type: Boolean, required: true, default: false },
});
exports.User = mongoose.model("User", UserSchema);
