"use strict";

jest.mock("../application.service");
jest.mock("../../../models", () => ({}));
// Bypass JWT verification — inject a test user into req.user
jest.mock("../../../middleware/auth.middleware", () => (req, res, next) => {
  req.user = { userId: 5, roleName: "EMPLOYER" };
  next();
});
// Bypass role guards for routes that need them
jest.mock("../../../middleware/employerOnly.middleware", () => (req, res, next) => next());
jest.mock("../../../middleware/candidateOnly.middleware", () => (req, res, next) => next());

const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const applicationService = require("../application.service");
const applicationRouter = require("../application.route");
const errorMiddleware = require("../../../middleware/error.middleware");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/applications", applicationRouter);
  app.use(errorMiddleware);
  return app;
};

let app;
beforeAll(() => { app = buildApp(); });
beforeEach(() => { jest.resetAllMocks(); });

const JOB_ID = "550e8400-e29b-41d4-a716-446655440000";
const APP_ID = "app-1";
const COMPANY_ID = "comp-1";
const mockApplication = { id: APP_ID, jobListingId: JOB_ID, status: "pending" };

// ─── POST /api/applications ───────────────────────────────────────────────────

describe("POST /api/applications", () => {
  const validBody = { jobListingId: JOB_ID };

  it("should return 201 with created application", async () => {
    applicationService.createApplication.mockResolvedValue(mockApplication);

    const res = await request(app).post("/api/applications").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, data: mockApplication });
    expect(applicationService.createApplication).toHaveBeenCalledWith(
      expect.objectContaining({ jobListingId: JOB_ID }),
      5
    );
  });

  it("should return 422 when jobListingId is missing", async () => {
    const res = await request(app).post("/api/applications").send({});

    expect(res.status).toBe(422);
    expect(applicationService.createApplication).not.toHaveBeenCalled();
  });

  it("should return 422 when jobListingId is not a UUID", async () => {
    const res = await request(app).post("/api/applications").send({ jobListingId: "not-a-uuid" });

    expect(res.status).toBe(422);
  });

  it("should return 404 when service throws NotFoundError", async () => {
    const { NotFoundError } = require("../../../shared/utils/errors");
    applicationService.createApplication.mockRejectedValue(new NotFoundError("Job not found"));

    const res = await request(app).post("/api/applications").send(validBody);

    expect(res.status).toBe(404);
  });

  it("should return 409 when user already applied", async () => {
    const { ConflictError } = require("../../../shared/utils/errors");
    applicationService.createApplication.mockRejectedValue(new ConflictError("You already applied for this job"));

    const res = await request(app).post("/api/applications").send(validBody);

    expect(res.status).toBe(409);
  });
});

// ─── GET /api/applications/me ─────────────────────────────────────────────────

describe("GET /api/applications/me", () => {
  it("should return 200 with the user's applications", async () => {
    applicationService.getMyApplications.mockResolvedValue([mockApplication]);

    const res = await request(app).get("/api/applications/me");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: [mockApplication] });
    expect(applicationService.getMyApplications).toHaveBeenCalledWith(5);
  });

  it("should return empty array when user has no applications", async () => {
    applicationService.getMyApplications.mockResolvedValue([]);

    const res = await request(app).get("/api/applications/me");

    expect(res.body.data).toEqual([]);
  });
});

// ─── GET /api/applications/company/:companyId ─────────────────────────────────

describe("GET /api/applications/company/:companyId", () => {
  it("should return 200 with company applications", async () => {
    applicationService.getCompanyApplications.mockResolvedValue([mockApplication]);

    const res = await request(app).get(`/api/applications/company/${COMPANY_ID}`);

    expect(res.status).toBe(200);
    expect(applicationService.getCompanyApplications).toHaveBeenCalledWith(COMPANY_ID, 5);
  });

  it("should return 403 when service throws ForbiddenError", async () => {
    const { ForbiddenError } = require("../../../shared/utils/errors");
    applicationService.getCompanyApplications.mockRejectedValue(new ForbiddenError("Not allowed"));

    const res = await request(app).get(`/api/applications/company/${COMPANY_ID}`);

    expect(res.status).toBe(403);
  });
});

// ─── GET /api/applications/job/:jobId ─────────────────────────────────────────

describe("GET /api/applications/job/:jobId", () => {
  it("should return 200 with job applications", async () => {
    applicationService.getJobApplications.mockResolvedValue([mockApplication]);

    const res = await request(app).get(`/api/applications/job/${JOB_ID}`);

    expect(res.status).toBe(200);
    expect(applicationService.getJobApplications).toHaveBeenCalledWith(JOB_ID, 5);
  });

  it("should return 404 when service throws NotFoundError", async () => {
    const { NotFoundError } = require("../../../shared/utils/errors");
    applicationService.getJobApplications.mockRejectedValue(new NotFoundError("Job not found"));

    const res = await request(app).get(`/api/applications/job/${JOB_ID}`);

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/applications/:id/status ──────────────────────────────────────

describe("PATCH /api/applications/:id/status", () => {
  it("should return 200 with updated application", async () => {
    const updated = { ...mockApplication, status: "accepted" };
    applicationService.updateApplicationStatus.mockResolvedValue(updated);

    const res = await request(app).patch(`/api/applications/${APP_ID}/status`).send({ status: "accepted" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("accepted");
    expect(applicationService.updateApplicationStatus).toHaveBeenCalledWith(APP_ID, "accepted", 5);
  });

  it("should return 422 when status value is not allowed", async () => {
    const res = await request(app)
      .patch(`/api/applications/${APP_ID}/status`)
      .send({ status: "UNKNOWN_STATUS" });

    expect(res.status).toBe(422);
    expect(applicationService.updateApplicationStatus).not.toHaveBeenCalled();
  });

  it("should return 400 when service throws BadRequestError (invalid transition)", async () => {
    const { BadRequestError } = require("../../../shared/utils/errors");
    applicationService.updateApplicationStatus.mockRejectedValue(
      new BadRequestError("Invalid status transition from pending to hired")
    );

    const res = await request(app)
      .patch(`/api/applications/${APP_ID}/status`)
      .send({ status: "accepted" });

    expect(res.status).toBe(400);
  });
});
