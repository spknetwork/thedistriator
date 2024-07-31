let logger = require("node-color-log");

const express = require("express");
var router = express.Router();

const axios = require("axios").default;

const { config } = require("../config");

const { tokenValidation } = require("../utils/auth");

const Joi = require("joi");

const schema = Joi.object({
  latitude: Joi.number(),
  longitude: Joi.number(),
});

// async function test(body) {
//   try {
//     const value = await schema.validateAsync(body);
//   } catch (err) {
//     logger.error(err.details[0].message);
//   }
// }

router.post("/", tokenValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  if (
    req.usertype !== "super" &&
    req.usertype !== "admin" &&
    req.usertype !== "guide"
  ) {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }

  try {
    const value = await schema.validateAsync(req.body);
    try {
      let url = "https://places.googleapis.com/v1/places:searchNearby";
      let data = JSON.stringify({
        "maxResultCount": 10,
        "locationRestriction": {
          "circle": {
            "center": {
              "latitude": value.latitude,
              "longitude": value.longitude,
            },
            "radius": 500
          }
        }
      });
      let requestConfig = {
        method: "post",
        maxBodyLength: Infinity,
        url: url,
        data: data,
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": config.google.key,
          // 'X-Goog-FieldMask': 'places.displayName',
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.addressComponents,places.id,places.photos,places.primaryType,places.primaryTypeDisplayName,places.currentOpeningHours,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.location",
        },
      };
      const result = await axios.request(requestConfig);
      res.send(result.data);
    } catch (err) {
      return res.status(500).json({
        error: `Error when getting details with google API - ${err}`,
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: `Schema Error ${err.details[0].message}`,
    });
  }
});

router.get("/details/:placeid", tokenValidation, async (req, res) => {
  logger.info(
    `Request ${req.baseUrl}${req.path}, from user ${req.username}, with type ${req.usertype}`
  );
  if (
    req.usertype !== "super" &&
    req.usertype !== "admin" &&
    req.usertype !== "guide"
  ) {
    return res.status(500).json({
      error: `User ${req.username} does not have access to requested resources.`,
    });
  }
  const placeid = req.params.placeid;
  if (placeid === null || placeid === undefined || placeid.length === 0) {
    return res.status(500).json({
      error: "Please provide placeid",
    });
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeid}&key=${config.google.key}`;
    let requestConfig = {
      method: "get",
      url: url,
      headers: {
        "Content-Type": "application/json",
        // "X-Goog-Api-Key": config.google.key,
        // "X-Goog-FieldMask": "id,displayName,photos,formattedAddress,regularOpeningHours,internationalPhoneNumber,nationalPhoneNumber,websiteUri,currentOpeningHours,primaryTypeDisplayName,regularSecondaryOpeningHours"
      },
    };
    const result = await axios.request(requestConfig);
    res.send(result.data);
  } catch (err) {
    return res.status(500).json({
      error: `Google API error Error ${err}`,
    });
  }
});

// test({ baa: "baa" });
exports.placesRouter = router;
