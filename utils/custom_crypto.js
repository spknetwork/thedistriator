const { config } = require("../config");

var AES = require("crypto-js/aes");


if (!config.crypto.secret_key) {
  throw new Error("secretKey is required");
}

// Encrypt data
function encryptData(data) {
  var encrypted = AES.encrypt(data, config.crypto.secret_key);
  return encrypted.toString();
}

exports.encryptData = encryptData;

// Decrypt data
function decryptData(data) {
  var decrypted = AES.decrypt(data, config.crypto.secret_key);
  return decrypted.toString();
}

exports.encryptData = encryptData;
exports.decryptData = decryptData;