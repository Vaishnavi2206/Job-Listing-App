const Application = require("./application.model");

const JobListing = require("../jobListings/jobListing.model");

const Company = require("../companies/company.model");
const User = require("../users/user.model");
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} = require("../../shared/utils/errors");

const {
  APPLICATION_STATUS,
  VALID_STATUS_TRANSITIONS,
} = require("../../shared/constants/applicationStatus");
const { enqueueStatusEmail } = require("../../queues/email.queue");

const createApplication = async (payload, userId) => {
  const job = await JobListing.findByPk(payload.jobListingId);

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  /*
    Prevent duplicate applications
  */

  const existingApplication = await Application.findOne({
    where: {
      candidateId: userId,
      jobListingId: payload.jobListingId,
    },
  });

  if (existingApplication) {
    throw new ConflictError("You already applied for this job");
  }

  const application = await Application.create({
    candidateId: userId,

    companyId: job.companyId,

    jobListingId: payload.jobListingId,

    resumeUrl: payload.resumeUrl,

    coverLetter: payload.coverLetter,

    status: APPLICATION_STATUS.PENDING,
  });

  return application;
};

const getMyApplications = async (userId) => {
  return await Application.findAll({
    where: {
      candidateId: userId,
    },

    include: [
      {
        model: JobListing,
      },

      {
        model: Company,
      },
    ],
  });
};

const getCompanyApplications = async (companyId, userId) => {
  const company = await Company.findByPk(companyId);

  if (!company) {
    throw new NotFoundError("Company not found");
  }

  if (company.createdBy !== userId) {
    throw new ForbiddenError("You are not allowed to view these applications");
  }

  return await Application.findAll({
    where: {
      companyId,
    },

    include: [
      {
        model: JobListing,
      },

      {
        model: User,
        attributes: ["id", "firstName", "lastName", "username"],
      },
    ],
  });
};

const getJobApplications = async (jobId, userId) => {
  const job = await JobListing.findByPk(jobId, {
    include: [
      {
        model: Company,
      },
    ],
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.Company.createdBy !== userId) {
    throw new ForbiddenError("You are not allowed to view these applications");
  }

  return await Application.findAll({
    where: {
      jobListingId: jobId,
    },

    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName", "username"],
      },
    ],
  });
};

const updateApplicationStatus = async (applicationId, status, userId) => {
  const application = await Application.findByPk(applicationId, {
    include: [
      {
        model: Company,
      },
      {
        model: User,
        attributes: ["id", "firstName", "lastName", "username"],
      },
    ],
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  if (application.Company.createdBy !== userId) {
    throw new ForbiddenError("You are not allowed to update this application");
  }

  const currentStatus = application.status.toLowerCase();
  const nextStatus = status.toLowerCase();
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(nextStatus)) {
    throw new BadRequestError(`Invalid status transition from ${currentStatus} to ${nextStatus}`);
  }

  await application.update({
    status: nextStatus,
  });

  // 2. Enqueue email job — fire-and-forget from the HTTP caller's
  // perspective, but we still await the queue.add() itself because
  // that's just a fast Redis command, not the email send.
  try {
    console.log("application", application);
    await enqueueStatusEmail({
      applicationId: applicationId,
      status,
      recipientEmail: application.User.username,
      applicantName: application.User.firstName + " " + application.User.lastName,
      meta: {},
    });
  } catch (queueErr) {
    // IMPORTANT: don't fail the whole API request just because the
    // notification couldn't be queued — the status update itself
    // already succeeded. Log for alerting / reconciliation instead.
    // See README "Reconciliation" section for a sweep-job pattern
    // that catches any application whose status changed but has no
    // matching row in ApplicationNotificationLog.
    console.error("Failed to enqueue status email:", queueErr);
  }

  return application;
};

module.exports = {
  createApplication,
  getMyApplications,
  getCompanyApplications,
  getJobApplications,
  updateApplicationStatus,
};
