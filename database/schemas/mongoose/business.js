const mongoose = require("mongoose");

// A business - holds information about a business
const BusinessSchema = new mongoose.Schema({
  distriator: {
    guides: [
      {
        name: { type: String, required: true },
        percent: { type: Number, required: true },
      },
    ],
    owner: { type: String, required: false },
    creator: { type: String, required: true },
    expiry: {
      type: Date,
      required: true,
      default: new Date().getTime() + 1000 * 60 * 60 * 24 * 30 * 3, // expires in 90 days
    },
    subscriptionStatus: {
      type: String,
      required: true,
      index: true,
      enum: ["whitelisted", "listed", "blacklisted"],
      default: "listed",
    },
    paymentMethods: {
      type: [String],
      required: true,
      index: true,
      default: ["HBD", "SATS"],
    },
    spendHBDLink: { type: String, required: false },
  },
  profile: {
    displayName: { type: String, required: true },
    displayImage: { type: String, required: false },
    businessType: { type: String, required: false },
    workTime: { type: String, required: false },
    images: [String],
  },
  location: {
    pin: {
      latitude: Number,
      longitude: Number,
    },
    address: {
      address1: String,
      address2: String,
      city: String,
      state: String,
      country: String,
    },
  },
  contact: {
    email: String,
    phone: String,
    notes: String,
    website: String,
    instagram: String,
    facebook: String,
    twitter: String,
  },
});

exports.Business = mongoose.model("Business", BusinessSchema);
