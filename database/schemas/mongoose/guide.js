const mongoose = require("mongoose");

// Guides can also change the details of Businesses like contact details, address etc.
const GuideSchema = new mongoose.Schema({
  username: { type: String, required: true },
  banned: { type: Boolean, required: true, default: false },
  city: { type: String, required: false },
  country: { type: String, required: false },
});
exports.Guide = mongoose.model("Guide", GuideSchema);