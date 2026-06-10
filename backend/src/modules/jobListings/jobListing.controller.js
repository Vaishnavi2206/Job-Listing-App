const asyncHandler = require(
  "../../shared/utils/asyncHandler"
);

const {
  createJobSchema,
  updateJobSchema,
} = require("./jobListing.validation");

const jobService = require(
  "./jobListing.service"
);

const createJob = asyncHandler(
  async (req, res) => {
    const validatedData =
      createJobSchema.parse(req.body);

    const job =
      await jobService.createJob(
        validatedData,
        req.user.userId
      );

    res.status(201).json({
      success: true,
      data: job,
    });
  }
);

const getAllJobs = asyncHandler(
  async (req, res) => {
    const {pageSize, pageNo,search} = req.query;
    const jobs =
      await jobService.getAllJobs({
        pageSize,
        pageNo,
        search
      });

    res.json({
      success: true,
      data: jobs,
    });
  }
);

const getJobById = asyncHandler(
  async (req, res) => {
    const job =
      await jobService.getJobById(
        req.params.id
      );

    res.json({
      success: true,
      data: job,
    });
  }
);

const updateJob = asyncHandler(
  async (req, res) => {
    const validatedData =
      updateJobSchema.parse(req.body);

    const job =
      await jobService.updateJob(
        req.params.id,
        validatedData,
        req.user.userId
      );

    res.json({
      success: true,
      data: job,
    });
  }
);

const deleteJob = asyncHandler(
  async (req, res) => {
    await jobService.deleteJob(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  }
);

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
};