const mongoose = require("mongoose");

// Super Admins can add, remove, ban, unban, view all admins
const SuperAdminSchema = new mongoose.Schema({
  username: { type: String, required: true },
});
exports.SuperAdmin = mongoose.model("SuperAdmin", SuperAdminSchema);