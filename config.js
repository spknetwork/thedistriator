const dotenv = require("dotenv");
dotenv.config();

exports.config = {
  crypto: {
    secret_key: process.env.SECRET_KEY,
    jwt: process.env.AUTH_JWT_SECRET,
  },
  app: {
    port: process.env.PORT,
    db: process.env.DB,
  },
  google: {
    key: process.env.G_API_KEY,
  },
  distriator: {
    account: process.env.APP_ACCOUNT,
    key: process.env.APP_KEY,
    v4v: process.env.V4V_APP,
  },
  webHooks: {
    admin: {
      id: process.env.ADMIN_WH_ID,
      token: process.env.ADMIN_WH_TOKEN,
    },
    guide: {
      id: process.env.GUIDE_WH_ID,
      token: process.env.GUIDE_WH_TOKEN,
    },
    owner: {
      id: process.env.OWNER_WH_ID,
      token: process.env.OWNER_WH_TOKEN,
    },
    user: {
      id: process.env.USER_WH_ID,
      token: process.env.USER_WH_TOKEN,
    },
    distriatorTransfer: {
      id: process.env.DISTRIATOR_TRF_WH_ID,
      token: process.env.DISTRIATOR_TRF_WH_TOKEN,
    },
    business: {
      id: process.env.BUSINESS_WH_ID,
      token: process.env.BUSINESS_WH_TOKEN,
    },
  },
};
