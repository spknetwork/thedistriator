let logger = require("node-color-log");

const mongoDB = require("./mongoDB");
const { dhiveClient } = require("../utils/dhive");
const guideRepository = require("./guide_repository");
const { broadcastOps } = require("../utils/transfer_hp");
const { BusinessJoi } = require("./schemas/joi/business_joi.js");

function recordToData(record) {
  const data = {
    distriator: {
      guides: record.distriator.guides.map((g) => {
        return {
          name: g.name,
          percent: g.percent,
        };
      }),
      owner: record.distriator.owner,
      creator: record.distriator.creator,
      expiry: record.distriator.expiry,
      subscriptionStatus: record.distriator.subscriptionStatus,
      paymentMethods: record.distriator.paymentMethods,
      spendHBDLink: record.distriator.spendHBDLink,
    },
    profile: {
      displayName: record.profile.displayName,
      displayImage: record.profile.displayImage,
      businessType: record.profile.businessType,
      images: record.profile.images,
      workTime: record.profile.workTime,
    },
    contact: {
      email: record.contact.email,
      phone: record.contact.phone,
      notes: record.contact.notes,
      website: record.contact.website,
      instagram: record.contact.instagram,
      facebook: record.contact.facebook,
      twitter: record.contact.twitter,
    },
    location: {
      pin: {
        latitude: record.location.pin.latitude,
        longitude: record.location.pin.longitude,
      },
      address: {
        address1: record.location.address.address1,
        address2: record.location.address.address2,
        city: record.location.address.city,
        state: record.location.address.state,
        country: record.location.address.country,
      },
    },
  };
  return data;
}

async function broadcast_distriator_business_add(r) {
  delete r.distriator.owner;
  await broadcastOps({
    id: "distriator_business_add",
    json: JSON.stringify(r),
  });
}

async function broadcast_distriator_business_update(data) {
  delete data.distriator.owner;
  await broadcastOps({
    id: "distriator_business_update",
    json: JSON.stringify(data),
  });
}

async function broadcast_distriator_business_delete(data) {
  delete data.distriator.owner;
  await broadcastOps({
    id: "distriator_business_delete",
    json: JSON.stringify(data),
  });
}

async function addABusiness(object, broadcast) {
  try {
    // Check for business ower
    if (
      object.distriator.owner !== undefined &&
      object.distriator.owner !== null &&
      object.distriator.owner.length > 0
    ) {
      logger.info(
        `Trying to add a business with owner ${object.distriator.owner}`
      );
      const accounts = await dhiveClient.database.getAccounts([
        object.distriator.owner,
      ]);
      if (accounts.length !== 1) {
        throw `Invalid Hive Username - ${object.distriator.owner}`;
      }
      const ownerRecord = await mongoDB.BusinessOwner.findOne({
        username: object.distriator.owner,
      });
      const record = await mongoDB.Business.findOne({
        "distriator.owner": object.distriator.owner,
        "profile.displayName": object.profile.displayName,
      });
      if (record !== null) {
        const error = `Business with owner ${object.distriator.owner} & Name ${object.profile.displayName} already exists`;
        throw error;
      } else {
        if (ownerRecord == null) {
          const newOwnerRecord = new mongoDB.BusinessOwner({
            username: object.distriator.owner,
          });
          await newOwnerRecord.save();
        }
      }
    }
    // ====== Check for business ower complete

    // Check for business guides
    if (object.distriator.guides.length > 0) {
      logger.info(`Trying to validate a business with business guides`);
      const totalPercent = object.distriator.guides.reduce(
        (p, c) => p + c.percent,
        0
      );
      if (totalPercent !== 10_000) {
        const error = `Total of guides percentage is not 100%`;
        throw error;
      }
      const guideNames = object.distriator.guides.map((g) => g.name);
      const accounts = await dhiveClient.database.getAccounts(guideNames);
      if (accounts.length !== guideNames.length) {
        throw `Invalid Guide hiveusername. Please check hiveusername of guides`;
      }
      for (const guide of guideNames) {
        const guideRecord = await mongoDB.Guide.findOne({
          username: guide,
        });
        if (guideRecord == null) {
          await guideRepository.broadcast_distriator_guide_add(
            guide,
            object.location.city,
            object.location.country
          );
        }
      }
      logger.info(`Done validating a business with business guides`);
    }
    // ====== Check for business guides

    const newBusiness = new mongoDB.Business({
      ...object,
    });
    await newBusiness.save();
    const data = recordToData(newBusiness);
    if (broadcast) {
      await broadcast_distriator_business_add(data);
    }
    return newBusiness;
  } catch (e) {
    logger.error("error adding a Business" + e.toString());
    throw e;
  }
}

async function updateABusiness(object, broadcast) {
  try {
    const record = await mongoDB.Business.findOne({
      "profile.displayName": object.profile.displayName,
      "distriator.creator": object.profile.creator,
    });
    if (record === null) {
      throw `No record found with display name ${object.profile.displayName} and creator ${object.profile.creator}`;
    }
    if (
      object.distriator.owner !== undefined &&
      object.distriator.owner !== null &&
      object.distriator.owner.length > 0
    ) {
      logger.info(
        `Trying to update a business ${id} with owner ${object.distriator.owner}`
      );
      const accounts = await dhiveClient.database.getAccounts([
        object.distriator.owner,
      ]);
      if (accounts.length !== 1) {
        throw `Invalid Hive Username - ${object.distriator.owner}`;
      }
      const ownerRecord = await mongoDB.BusinessOwner.findOne({
        username: object.distriator.owner,
      });
      if (ownerRecord == null) {
        const newOwnerRecord = new mongoDB.BusinessOwner({
          username: object.distriator.owner,
        });
        await newOwnerRecord.save();
      }
      record.distriator.owner = object.distriator.owner;
    } else {
      if (broadcast) {
        record.distriator.owner = null;
      }
    }
    // ====== Check for business ower complete

    // Check for business guides
    if (object.distriator.guides.length > 0) {
      logger.info(`Trying to validate a business with business guides`);
      const totalPercent = object.distriator.guides.reduce(
        (p, c) => p + c.percent,
        0
      );
      if (totalPercent !== 10_000) {
        const error = `Total of guides percentage is not 100%`;
        throw error;
      }
      const guideNames = object.distriator.guides.map((g) => g.name);
      const accounts = await dhiveClient.database.getAccounts(guideNames);
      if (accounts.length !== guideNames.length) {
        throw `Invalid Guide hiveusername. Please check hiveusername of guides`;
      }
      for (const guide of guideNames) {
        const guideRecord = await mongoDB.Guide.findOne({
          username: guide,
        });
        if (guideRecord == null) {
          guideRepository.broadcast_distriator_guide_add(
            guide,
            object.location.city,
            object.location.country
          );
        }
      }
      record.distriator.guides = object.distriator.guides;
      logger.info(`Done validating a business with business guides`);
    } else {
      record.distriator.guides = [];
    }
    record.distriator.expiry = object.distriator.expiry;
    record.distriator.subscriptionStatus = object.distriator.subscriptionStatus;
    record.distriator.paymentMethods = object.distriator.paymentMethods;
    record.distriator.spendHBDLink = object.distriator.spendHBDLink;
    record.location = object.location;
    record.profile = object.profile;
    record.contact = object.contact;
    await record.save();
    const data = recordToData(record);
    if (broadcast) {
      await broadcast_distriator_business_update(data);
    }
    return data;
  } catch (e) {
    logger.error(
      `error updating a Business with display name ${
        object.profile.displayName
      } and creator ${object.profile.creator} - ${e.toString()}`
    );
    throw e;
  }
}

async function getAllBusinesses() {
  let records = await mongoDB.Business.find();
  records = records.map((r) => {
    return {
      distriator: {
        guides: r.distriator.guides.map((g) => {
          return {
            name: g.name,
            percent: g.percent,
          };
        }),
        owner: r.distriator.owner,
        creator: r.distriator.creator,
        expiry: r.distriator.expiry,
        subscriptionStatus: r.distriator.subscriptionStatus,
        paymentMethods: r.distriator.paymentMethods,
        spendHBDLink: r.distriator.spendHBDLink,
      },
      profile: {
        displayName: r.profile.displayName,
        displayImage: r.profile.displayImage,
        businessType: r.profile.businessType,
        images: r.profile.images,
        workTime: r.profile.workTime,
      },
      contact: {
        email: r.contact.email,
        phone: r.contact.phone,
        notes: r.contact.notes,
        website: r.contact.website,
        instagram: r.contact.instagram,
        facebook: r.contact.facebook,
        twitter: r.contact.twitter,
      },
      location: {
        pin: {
          latitude: r.location.pin.latitude,
          longitude: r.location.pin.longitude,
        },
        address: {
          address1: r.location.address.address1,
          address2: r.location.address.address2,
          city: r.location.address.city,
          state: r.location.address.state,
          country: r.location.address.country,
        },
      },
      id: r._id,
    };
  });
  return records;
}

async function deleteABusiness(object, broadcast) {
  try {
    const record = await mongoDB.Business.findOne({
      "profile.displayName": object.profile.displayName,
      "distriator.creator": object.profile.creator,
    });
    if (record === null) {
      throw `No record found with display name ${object.profile.displayName} and creator ${object.profile.creator}`;
    } else {
      if (broadcast) {
        await broadcast_distriator_business_delete(record._doc);
      }
      await record.deleteOne();
      return `Business with with display name ${object.profile.displayName} and creator ${object.profile.creator} deleted successfully`;
    }
  } catch (e) {
    logger.error(
      `error deleting a Business with display name ${
        object.profile.displayName
      } and creator ${object.profile.creator} ${e.toString()}`
    );
    throw e;
  }
}

async function distriator_business_add(op) {
  const opType = "distriator_business_add";
  if (op.id !== opType) {
    logger.warn(`${opType} != ${op.id}`);
    return;
  }
  if (!("json" in op)) {
    logger.error(`${opType} operation doesn't have json attribute`);
    return;
  }
  if (typeof op.json !== "string") {
    logger.error(`${opType} operation's json attribute is not of type string`);
    return;
  }
  const object = JSON.parse(op.json);
  const { error, value } = BusinessJoi.validate(object);
  if (error !== undefined) {
    logger.error(error.details());
    return;
  }
  await addABusiness(object, false);
}

async function distriator_business_update(op) {
  const opType = "distriator_business_update";
  if (op.id !== opType) {
    logger.warn(`${opType} != ${op.id}`);
    return;
  }
  if (!("json" in op)) {
    logger.error(`${opType} operation doesn't have json attribute`);
    return;
  }
  if (typeof op.json !== "string") {
    logger.error(`${opType} operation's json attribute is not of type string`);
    return;
  }
  const object = JSON.parse(op.json);
  const { error, value } = BusinessJoi.validate(object);
  if (error !== undefined) {
    logger.error(error.details());
    return;
  }
  await updateABusiness(object, false);
}

async function distriator_business_delete(op) {
  const opType = "distriator_business_delete";
  if (op.id !== opType) {
    logger.warn(`${opType} != ${op.id}`);
    return;
  }
  if (!("json" in op)) {
    logger.error(`${opType} operation doesn't have json attribute`);
    return;
  }
  if (typeof op.json !== "string") {
    logger.error(`${opType} operation's json attribute is not of type string`);
    return;
  }
  const object = JSON.parse(op.json);
  const { error, value } = BusinessJoi.validate(object);
  if (error !== undefined) {
    logger.error(error.details());
    return;
  }
  await deleteABusiness(object, false);
}

module.exports = {
  getAllBusinesses,

  addABusiness,
  updateABusiness,
  deleteABusiness,

  distriator_business_add,
  distriator_business_update,
  distriator_business_delete,
};
