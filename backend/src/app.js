const express = require("express");
const cookieParser = require("cookie-parser");

// Must be required before any route/service so all Sequelize associations are registered
require("./models");

const authRoutes = require("./modules/auth/auth.route.js");
const errorMiddleware = require("./middleware/error.middleware");
const companyRoutes = require("./modules/companies/company.route");
const jobRoutes = require("./modules/jobListings/jobListing.route");
const applicationRoutes = require("./modules/applications/application.route");
const app = express();
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    message: "Job Listing API Running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

app.use(errorMiddleware);

module.exports = app;
