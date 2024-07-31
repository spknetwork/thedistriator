const Joi = require("joi");

exports.BusinessJoi = Joi.object({
  location: Joi.object({
    pin: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    }).required(),
    address: Joi.object({
      address1: Joi.string().required(),
      address2: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().required(),
    }).required(),
  }).required(),

  distriator: Joi.object({
    guides: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        percent: Joi.number().required(),
      })
    ),
    owner: Joi.string(),
    creator: Joi.string().required(),
    expiry: Joi.date(),
    subscriptionStatus: Joi.string(),
    paymentMethods: Joi.array().items(Joi.string()).required(),
    spendHBDLink: Joi.string(),
  }).required(),

  profile: Joi.object({
    displayName: Joi.string().required(),
    displayImage: Joi.string(),
    businessType: Joi.string(),
    images: Joi.array().items(Joi.string()),
    workTime: Joi.string(),
  }).required(),

  contact: Joi.object({
    email: Joi.string(),
    phone: Joi.string(),
    notes: Joi.string(),
    website: Joi.string(),
    instagram: Joi.string(),
    facebook: Joi.string(),
    twitter: Joi.string(),
  }).required(),
});