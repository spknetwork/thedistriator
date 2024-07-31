const mongoose = require("mongoose");

// Admins can add - view, add, remove, ban, unban - Guides, Business owners
// Admins can view, ban, unban - regular users (who claim rewards)
// Admins can set guides to busineses
// Admins can set business owner to multiple-businesses
const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  banned: { type: Boolean, required: true, default: false },
});
exports.Admin = mongoose.model("Admin", AdminSchema);