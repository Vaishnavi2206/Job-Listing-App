require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/db");
require("./models");

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log("Database connected");

    await sequelize.sync({ alter: true });

    console.log("Models synced");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
}

startServer();