const path = require("path");
const dotenv = require("dotenv");

const rootDir = path.resolve(__dirname, "../../..");

const envFile =
  process.env.NODE_ENV === "development" ? ".env.local" : ".env";

dotenv.config({ path: path.join(rootDir, envFile) });
