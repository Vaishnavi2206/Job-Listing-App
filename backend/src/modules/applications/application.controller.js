const asyncHandler = require(
  "../../shared/utils/asyncHandler"
);

const {
  createApplicationSchema,
  updateStatusSchema,
} = require("./application.validation");

const applicationService = require(
  "./application.service"
);

const createApplication =
  asyncHandler(async (req, res) => {
    const validatedData =
      createApplicationSchema.parse(
        req.body
      );

    const application =
      await applicationService.createApplication(
        validatedData,
        req.user.userId
      );

    res.status(201).json({
      success: true,
      data: application,
    });
  });

const getMyApplications =
  asyncHandler(async (req, res) => {
    const applications =
      await applicationService.getMyApplications(
        req.user.userId
      );

    res.json({
      success: true,
      data: applications,
    });
  });

const getCompanyApplications =
  asyncHandler(async (req, res) => {
    const applications =
      await applicationService.getCompanyApplications(
        req.params.companyId,
        req.user.userId
      );

    res.json({
      success: true,
      data: applications,
    });
  });

const getJobApplications =
  asyncHandler(async (req, res) => {
    const applications =
      await applicationService.getJobApplications(
        req.params.jobId,
        req.user.userId
      );

    res.json({
      success: true,
      data: applications,
    });
  });

const updateApplicationStatus =
  asyncHandler(async (req, res) => {
    const validatedData =
      updateStatusSchema.parse(
        req.body
      );

    const application =
      await applicationService.updateApplicationStatus(
        req.params.id,
        validatedData.status,
        req.user.userId
      );

    res.json({
      success: true,
      data: application,
    });
  });

module.exports = {
  createApplication,
  getMyApplications,
  getCompanyApplications,
  getJobApplications,
  updateApplicationStatus,
};