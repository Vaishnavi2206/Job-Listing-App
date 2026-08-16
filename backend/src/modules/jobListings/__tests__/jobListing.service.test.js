"use strict";

// Explicit factories prevent sequelize.define() from returning undefined when config/db is mocked
jest.mock("../jobListing.model", () => ({ create: jest.fn(), findAll: jest.fn(), findByPk: jest.fn() }));
jest.mock("../../companies/company.model", () => ({ findByPk: jest.fn() }));
jest.mock("../../../config/db");
jest.mock("../../../utils/cursor");
jest.mock("../../../models", () => ({}));

const JobListing = require("../jobListing.model");
const Company = require("../../companies/company.model");
const sequelize = require("../../../config/db");
const { decodeCursor, encodeCursor } = require("../../../utils/cursor");

const {
  createJob,
  _getAllJobs,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require("../jobListing.service");

const { NotFoundError, ForbiddenError } = require("../../../shared/utils/errors");

const USER_ID = 7;
const COMPANY_ID = "550e8400-e29b-41d4-a716-446655440001";
const JOB_ID = "job-1";

const mockCompany = { id: COMPANY_ID, createdBy: USER_ID };
const mockJob = {
  id: JOB_ID,
  title: "Engineer",
  Company: mockCompany,
  update: jest.fn(),
  destroy: jest.fn(),
};

beforeEach(() => {
  jest.resetAllMocks();
  // sequelize.escape is used inside service for raw literals
  sequelize.escape = jest.fn((v) => `'${v}'`);
  sequelize.literal = jest.fn((sql) => ({ sql }));
  decodeCursor.mockReturnValue(null);
  encodeCursor.mockReturnValue(null);
});

// ─── createJob ────────────────────────────────────────────────────────────────

describe("createJob", () => {
  const payload = { title: "Engineer", description: "Build stuff", companyId: COMPANY_ID };

  it("should create and return a job when the caller owns the company", async () => {
    Company.findByPk.mockResolvedValue(mockCompany);
    JobListing.create.mockResolvedValue(mockJob);

    const result = await createJob(payload, USER_ID);

    expect(Company.findByPk).toHaveBeenCalledWith(COMPANY_ID);
    expect(JobListing.create).toHaveBeenCalledWith(payload);
    expect(result).toBe(mockJob);
  });

  it("should throw NotFoundError when company does not exist", async () => {
    Company.findByPk.mockResolvedValue(null);

    await expect(createJob(payload, USER_ID)).rejects.toThrow(NotFoundError);
    await expect(createJob(payload, USER_ID)).rejects.toThrow("Company not found");
  });

  it("should throw ForbiddenError when caller does not own the company", async () => {
    Company.findByPk.mockResolvedValue({ ...mockCompany, createdBy: 99 });

    await expect(createJob(payload, USER_ID)).rejects.toThrow(ForbiddenError);
    await expect(createJob(payload, USER_ID)).rejects.toThrow("You can only create jobs for your own company");
  });
});

// ─── getAllJobs ───────────────────────────────────────────────────────────────

describe("getAllJobs", () => {
  it("should return jobs with hasMore=false when results fit within limit", async () => {
    const jobs = [{ id: "j1", createdAt: new Date(), toJSON: () => ({ id: "j1" }) }];
    JobListing.findAll.mockResolvedValue(jobs);

    const result = await getAllJobs({ limit: 10 });

    expect(result).toMatchObject({ jobs, pagination: { hasMore: false, nextCursor: null } });
  });

  it("should return hasMore=true and a nextCursor when there are more results", async () => {
    const now = new Date();
    // Return limit+1 results to trigger hasMore
    const jobs = Array.from({ length: 11 }, (_, i) => ({
      id: `j${i}`,
      createdAt: now,
    }));
    JobListing.findAll.mockResolvedValue(jobs);
    encodeCursor.mockReturnValue("next-cursor-token");

    const result = await getAllJobs({ limit: 10 });

    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).toBe("next-cursor-token");
    // The extra item is popped off
    expect(result.jobs).toHaveLength(10);
  });

  it("should apply cursor WHERE clause when a valid cursor is provided", async () => {
    decodeCursor.mockReturnValue({ createdAt: "2024-01-01", id: "j0" });
    JobListing.findAll.mockResolvedValue([]);

    await getAllJobs({ limit: 10, cursor: "some-cursor" });

    expect(JobListing.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });

  it("should return empty results when no jobs exist", async () => {
    JobListing.findAll.mockResolvedValue([]);

    const result = await getAllJobs({ limit: 10 });

    expect(result.jobs).toEqual([]);
    expect(result.pagination.hasMore).toBe(false);
  });

  it("should apply search ranking order when search term is provided", async () => {
    JobListing.findAll.mockResolvedValue([]);

    await getAllJobs({ limit: 10, search: "react" });

    expect(JobListing.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: expect.any(Array),
      })
    );
    expect(sequelize.literal).toHaveBeenCalled();
  });
});

describe("_getAllJobs", () => {
  it("should fetch jobs using page-based pagination query", async () => {
    const jobs = [{ id: "job-1" }];
    JobListing.findAll.mockResolvedValue(jobs);

    const result = await _getAllJobs({ pageSize: 5, pageNo: 2 });

    expect(JobListing.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 5,
        offset: 2,
      })
    );
    expect(result).toEqual(jobs);
  });

  it("should apply search query in _getAllJobs when search is provided", async () => {
    JobListing.findAll.mockResolvedValue([]);

    await _getAllJobs({ pageSize: 10, pageNo: 1, search: "node" });

    expect(sequelize.literal).toHaveBeenCalled();
    expect(JobListing.findAll).toHaveBeenCalled();
  });
});

// ─── getJobById ───────────────────────────────────────────────────────────────

describe("getJobById", () => {
  it("should return the job when found", async () => {
    JobListing.findByPk.mockResolvedValue(mockJob);

    const result = await getJobById(JOB_ID);

    expect(result).toBe(mockJob);
  });

  it("should throw NotFoundError when job does not exist", async () => {
    JobListing.findByPk.mockResolvedValue(null);

    await expect(getJobById("missing")).rejects.toThrow(NotFoundError);
    await expect(getJobById("missing")).rejects.toThrow("Job not found");
  });
});

// ─── updateJob ────────────────────────────────────────────────────────────────

describe("updateJob", () => {
  it("should update and return the job when owner calls it", async () => {
    const job = { ...mockJob, update: jest.fn().mockResolvedValue(undefined) };
    JobListing.findByPk.mockResolvedValue(job);

    const result = await updateJob(JOB_ID, { title: "Senior Engineer" }, USER_ID);

    expect(job.update).toHaveBeenCalledWith({ title: "Senior Engineer" });
    expect(result).toBe(job);
  });

  it("should throw NotFoundError when job does not exist", async () => {
    JobListing.findByPk.mockResolvedValue(null);

    await expect(updateJob("missing", {}, USER_ID)).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when caller does not own the company", async () => {
    JobListing.findByPk.mockResolvedValue({ ...mockJob, Company: { createdBy: 99 } });

    await expect(updateJob(JOB_ID, {}, USER_ID)).rejects.toThrow(ForbiddenError);
  });
});

// ─── deleteJob ────────────────────────────────────────────────────────────────

describe("deleteJob", () => {
  it("should destroy the job and return true when owner calls it", async () => {
    const job = { ...mockJob, destroy: jest.fn().mockResolvedValue(undefined) };
    JobListing.findByPk.mockResolvedValue(job);

    const result = await deleteJob(JOB_ID, USER_ID);

    expect(job.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("should throw NotFoundError when job does not exist", async () => {
    JobListing.findByPk.mockResolvedValue(null);

    await expect(deleteJob("missing", USER_ID)).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when caller does not own the company", async () => {
    JobListing.findByPk.mockResolvedValue({ ...mockJob, Company: { createdBy: 99 } });

    await expect(deleteJob(JOB_ID, USER_ID)).rejects.toThrow(ForbiddenError);
  });
});
