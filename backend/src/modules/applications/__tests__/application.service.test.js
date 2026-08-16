"use strict";

jest.mock("../application.model");
jest.mock("../../jobListings/jobListing.model");
jest.mock("../../companies/company.model");
jest.mock("../../users/user.model");
jest.mock("../../../queues/email.queue");
jest.mock("../../../models", () => ({}));

const Application = require("../application.model");
const JobListing = require("../../jobListings/jobListing.model");
const Company = require("../../companies/company.model");
const { enqueueStatusEmail } = require("../../../queues/email.queue");

const {
  createApplication,
  getMyApplications,
  getCompanyApplications,
  getJobApplications,
  updateApplicationStatus,
} = require("../application.service");

const { NotFoundError, ConflictError, ForbiddenError, BadRequestError } = require("../../../shared/utils/errors");
const { APPLICATION_STATUS } = require("../../../shared/constants/applicationStatus");

const USER_ID = 5;
const COMPANY_ID = "comp-1";
const JOB_ID = "job-1";
const APP_ID = "app-1";

const mockJob = { id: JOB_ID, companyId: COMPANY_ID, Company: { createdBy: USER_ID } };
const mockUser = { id: USER_ID, firstName: "Jane", lastName: "Doe", username: "jane@example.com" };
const mockCompany = { id: COMPANY_ID, createdBy: USER_ID };
const mockApplication = {
  id: APP_ID,
  status: APPLICATION_STATUS.PENDING,
  Company: mockCompany,
  User: mockUser,
  update: jest.fn(),
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ─── createApplication ────────────────────────────────────────────────────────

describe("createApplication", () => {
  const payload = { jobListingId: JOB_ID, resumeUrl: "https://example.com/cv.pdf" };

  it("should create and return an application on happy path", async () => {
    JobListing.findByPk.mockResolvedValue(mockJob);
    Application.findOne.mockResolvedValue(null);
    Application.create.mockResolvedValue({ id: APP_ID, ...payload });

    const result = await createApplication(payload, USER_ID);

    expect(Application.create).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: USER_ID,
        jobListingId: JOB_ID,
        status: APPLICATION_STATUS.PENDING,
      })
    );
    expect(result).toMatchObject({ id: APP_ID });
  });

  it("should throw NotFoundError when job does not exist", async () => {
    JobListing.findByPk.mockResolvedValue(null);

    await expect(createApplication(payload, USER_ID)).rejects.toThrow(NotFoundError);
    await expect(createApplication(payload, USER_ID)).rejects.toThrow("Job not found");
  });

  it("should throw ConflictError when user already applied", async () => {
    JobListing.findByPk.mockResolvedValue(mockJob);
    Application.findOne.mockResolvedValue({ id: "existing" });

    await expect(createApplication(payload, USER_ID)).rejects.toThrow(ConflictError);
    await expect(createApplication(payload, USER_ID)).rejects.toThrow("You already applied for this job");
  });
});

// ─── getMyApplications ────────────────────────────────────────────────────────

describe("getMyApplications", () => {
  it("should return applications for the given user", async () => {
    Application.findAll.mockResolvedValue([mockApplication]);

    const result = await getMyApplications(USER_ID);

    expect(Application.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { candidateId: USER_ID } })
    );
    expect(result).toEqual([mockApplication]);
  });

  it("should return empty array when user has no applications", async () => {
    Application.findAll.mockResolvedValue([]);

    const result = await getMyApplications(USER_ID);

    expect(result).toEqual([]);
  });
});

// ─── getCompanyApplications ───────────────────────────────────────────────────

describe("getCompanyApplications", () => {
  it("should return applications for the company when owner calls it", async () => {
    Company.findByPk.mockResolvedValue(mockCompany);
    Application.findAll.mockResolvedValue([mockApplication]);

    const result = await getCompanyApplications(COMPANY_ID, USER_ID);

    expect(Application.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: COMPANY_ID } })
    );
    expect(result).toEqual([mockApplication]);
  });

  it("should throw NotFoundError when company does not exist", async () => {
    Company.findByPk.mockResolvedValue(null);

    await expect(getCompanyApplications("missing", USER_ID)).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when caller does not own the company", async () => {
    Company.findByPk.mockResolvedValue({ ...mockCompany, createdBy: 99 });

    await expect(getCompanyApplications(COMPANY_ID, USER_ID)).rejects.toThrow(ForbiddenError);
  });
});

// ─── getJobApplications ───────────────────────────────────────────────────────

describe("getJobApplications", () => {
  it("should return applications for the job when owner calls it", async () => {
    JobListing.findByPk.mockResolvedValue(mockJob);
    Application.findAll.mockResolvedValue([mockApplication]);

    const result = await getJobApplications(JOB_ID, USER_ID);

    expect(result).toEqual([mockApplication]);
  });

  it("should throw NotFoundError when job does not exist", async () => {
    JobListing.findByPk.mockResolvedValue(null);

    await expect(getJobApplications("missing", USER_ID)).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when caller does not own the job's company", async () => {
    JobListing.findByPk.mockResolvedValue({ ...mockJob, Company: { createdBy: 99 } });

    await expect(getJobApplications(JOB_ID, USER_ID)).rejects.toThrow(ForbiddenError);
  });
});

// ─── updateApplicationStatus ──────────────────────────────────────────────────

describe("updateApplicationStatus", () => {
  it("should update status and enqueue email on a valid transition", async () => {
    const app = { ...mockApplication, update: jest.fn().mockResolvedValue(undefined) };
    Application.findByPk.mockResolvedValue(app);
    enqueueStatusEmail.mockResolvedValue(undefined);

    const result = await updateApplicationStatus(APP_ID, "accepted", USER_ID);

    expect(app.update).toHaveBeenCalledWith({ status: "accepted" });
    expect(enqueueStatusEmail).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted", recipientEmail: mockUser.username })
    );
    expect(result).toBe(app);
  });

  it("should throw NotFoundError when application does not exist", async () => {
    Application.findByPk.mockResolvedValue(null);

    await expect(updateApplicationStatus("missing", "accepted", USER_ID)).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when caller does not own the company", async () => {
    Application.findByPk.mockResolvedValue({ ...mockApplication, Company: { createdBy: 99 } });

    await expect(updateApplicationStatus(APP_ID, "accepted", USER_ID)).rejects.toThrow(ForbiddenError);
  });

  it("should throw BadRequestError on an invalid status transition", async () => {
    // pending → hired is not a valid transition
    Application.findByPk.mockResolvedValue(mockApplication);

    await expect(updateApplicationStatus(APP_ID, "hired", USER_ID)).rejects.toThrow(BadRequestError);
    await expect(updateApplicationStatus(APP_ID, "hired", USER_ID)).rejects.toThrow("Invalid status transition");
  });

  it("should still return the application even when email enqueue fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const app = { ...mockApplication, update: jest.fn().mockResolvedValue(undefined) };
    Application.findByPk.mockResolvedValue(app);
    enqueueStatusEmail.mockRejectedValue(new Error("Redis down"));

    // Should NOT throw — email failure is swallowed intentionally
    const result = await updateApplicationStatus(APP_ID, "accepted", USER_ID);

    expect(result).toBe(app);
    errorSpy.mockRestore();
  });
});
