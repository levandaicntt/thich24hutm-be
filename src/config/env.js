require("dotenv").config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

module.exports = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  DATABASE_URL: required("DATABASE_URL"),
  ZALO_APP_ID: required("ZALO_APP_ID"),
  ZALO_APP_SECRET: required("ZALO_APP_SECRET"),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "",
};
