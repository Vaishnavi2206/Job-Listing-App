"use strict";

jest.mock("../jobListing.service");
jest.mock("../../../models", () => ({}));
jest.mock("../../../middleware/auth.middleware", () => (req, res, next) => {
  req.user = { userId: 7, roleName: "EMPLOYER" };
  next();
});
jest.mock("../../../middleware/employerOnly.middleware", () => (req, res, next) => next());

const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const jobService = require("../jobListing.service");
const jobRouter = require("../jobListing.route");
const errorMiddleware = require("../../../middleware/error.middleware");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/jobs", jobRouter);
  app.use(errorMiddleware);
  return app;
};

let app;
beforeAll(() => { app = buildApp(); });
beforeEach(() => { jest.resetAllMocks(); });

const COMPANY_ID = "550e8400-e29b-41d4-a716-446655440001";
const JOB_ID = "job-1";
const mockJob = { id: JOB_ID, title: "Engineer", companyId: COMPANY_ID };
const paginatedResponse = { jobs: [mockJob], pagination: { hasMore: false, nextCursor: null } };

// ─── GET /api/jobs ────────────────────────────────────────────────────────────

describe("GET /api/jobs", () => {
  it("should return 200 with paginated jobs", async () => {
    jobService.getAllJobs.mockResolvedValue(paginatedResponse);

    const res = await request(app).get("/api/jobs");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: paginatedResponse });
    expect(jobService.getAllJobs).toHaveBeenCalledWith(
      expect.objectContaining({ limit: undefined, cursor: undefined, search: undefined })
    );
  });

  it("should pass query params to the service", async () => {
    jobService.getAllJobs.mockResolvedValue(paginatedResponse);

    await request(app).get("/api/jobs?limit=5&cursor=abc&search=engineer");

    expect(jobService.getAllJobs).toHaveBeenCalledWith({ limit: "5", cursor: "abc", search: "engineer" });
  });
});

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────

describe("GET /api/jobs/:id", () => {
  it("should return 200 with the job", async () => {
    jobService.getJobById.mockResolvedValue(mockJob);

    const res = await request(app).get(`/api/jobs/${JOB_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: JOB_ID });
  });

  it("should return 404 when service throws NotFoundError", async () => {
    const { NotFoundError } = require("../../../shared/utils/errors");
    jobService.getJobById.mockRejectedValue(new NotFoundError("Job not found"));

    const res = await request(app).get("/api/jobs/missing");

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/jobs ───────────────────────────────────────────────────────────

describe("POST /api/jobs", () => {
  const validBody = {
    title: "Engineer",
    description: "Build great things",
    companyId: COMPANY_ID,
  };

  it("should return 201 with the created job", async () => {
    jobService.createJob.mockResolvedValue(mockJob);

    const res = await request(app).post("/api/jobs").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, data: mockJob });
    expect(jobService.createJob).toHaveBeenCalledWith(expect.objectContaining({ title: "Engineer" }), 7);
  });

  it("should return 422 when title is missing", async () => {
    const res = await request(app).post("/api/jobs").send({ description: "No title", companyId: COMPANY_ID });

    expect(res.status).toBe(422);
    expect(jobService.createJob).not.toHaveBeenCalled();
  });

  it("should return 422 when companyId is not a valid UUID", async () => {
    const res = await request(app).post("/api/jobs").send({ ...validBody, companyId: "not-a-uuid" });

    expect(res.status).toBe(422);
  });

  it("should return 422 when description is shorter than 10 characters", async () => {
    const res = await request(app).post("/api/jobs").send({ ...validBody, description: "Short" });

    expect(res.status).toBe(422);
  });

  it("should return 404 when service throws NotFoundError (company missing)", async () => {
    const { NotFoundError } = require("../../../shared/utils/errors");
    jobService.createJob.mockRejectedValue(new NotFoundError("Company not found"));

    const res = await request(app).post("/api/jobs").send(validBody);

    expect(res.status).toBe(404);
  });

  it("should return 403 when service throws ForbiddenError", async () => {
    const { ForbiddenError } = require("../../../shared/utils/errors");
    jobService.createJob.mockRejectedValue(new ForbiddenError("Not your company"));

    const res = await request(app).post("/api/jobs").send(validBody);

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/jobs/:id ──────────────────────────────────────────────────────

describe("PATCH /api/jobs/:id", () => {
  it("should return 200 with the updated job", async () => {
    const updated = { ...mockJob, title: "Senior Engineer" };
    jobService.updateJob.mockResolvedValue(updated);

    const res = await request(app).patch(`/api/jobs/${JOB_ID}`).send({ title: "Senior Engineer" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Senior Engineer");
    expect(jobService.updateJob).toHaveBeenCalledWith(JOB_ID, expect.any(Object), 7);
  });

  it("should return 404 when service throws NotFoundError", async () => {
    const { NotFoundError } = require("../../../shared/utils/errors");
    jobService.updateJob.mockRejectedValue(new NotFoundError("Job not found"));

    // title must be >= 2 chars to pass Zod validation and reach the service
    const res = await request(app).patch(`/api/jobs/missing`).send({ title: "XX" });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/jobs/:id ─────────────────────────────────────────────────────

describe("DELETE /api/jobs/:id", () => {
  it("should return 200 on successful deletion", async () => {
    jobService.deleteJob.mockResolvedValue(true);

    const res = await request(app).delete(`/api/jobs/${JOB_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: "Job deleted successfully" });
    expect(jobService.deleteJob).toHaveBeenCalledWith(JOB_ID, 7);
  });

  it("should return 403 when caller does not own the job", async () => {
    const { ForbiddenError } = require("../../../shared/utils/errors");
    jobService.deleteJob.mockRejectedValue(new ForbiddenError("Not allowed"));

    const res = await request(app).delete(`/api/jobs/${JOB_ID}`);

    expect(res.status).toBe(403);
  });
});
