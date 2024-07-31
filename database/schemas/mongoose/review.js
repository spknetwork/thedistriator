const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  username: { type: String, required: true },
  permlink: { type: String, required: true },
  hiveTransactionId: { type: String, required: true },
  businessAccount: { type: String, required: true },
  photos: { type: [String], required: true },
  reviewText: { type: String, required: true },
  reviewStatus: {
    type: String,
    required: true,
    enum: ["review", "approve", "reject"],
    default: "review",
  },
});
exports.Review = mongoose.model("Review", ReviewSchema);