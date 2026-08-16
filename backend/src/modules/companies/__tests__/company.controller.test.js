"use strict";

jest.mock("../company.service");
jest.mock("../../../models", () => ({}));
jest.mock("../../../middleware/auth.middleware", () => (req, res, next) => {
  req.user = { userId: 10, roleName: "EMPLOYER" };
  next();
});

const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const companyService = require("../company.service");
const companyRouter = require("../company.route");
const errorMiddleware = require("../../../middleware/error.middleware");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/companies", companyRouter);
  app.use(errorMiddleware);
  return app;
};

let app;
beforeAll(() => { app = buildApp(); });
beforeEach(() => { jest.resetAllMocks(); });

const mockCompany = { id: "c1", name: "Acme Corp", createdBy: 10 };

// ─── GET /api/companies ───────────────────────────────────────────────────────

describe("GET /api/companies", () => {
  it("should return 200 with list of companies", async () => {
    companyService.getAllCompanies.mockResolvedValue([mockCompany]);

    const res = await request(app).get("/api/companies");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: [mockCompany] });
  });

  it("should return empty array when no companies exist", async () => {
    companyService.getAllCompanies.mockResolvedValue([]);

    const res = await request(app).get("/api/companies");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─── GET /api/companies/:id ───────────────────────────────────────────────────

describe("GET /api/companies/:id", () => {
  it("should return 200 with the company", async () => {
    companyService.getCompanyById.mockResolvedValue(mockCompany);

    const res = await request(app).get("/api/companies/c1");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: "c1" });
  });

  it("should return 200 with null when company is not found (service returns null)", async () => {
    companyService.getCompanyById.mockResolvedValue(null);

    const res = await request(app).get("/api/companies/nonexistent");

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});

// ─── POST /api/companies ──────────────────────────────────────────────────────

describe("POST /api/companies", () => {
  const validBody = { name: "Acme Corp", description: "A company" };

  it("should return 201 with created company", async () => {
    companyService.createCompany.mockResolvedValue(mockCompany);

    const res = await request(app).post("/api/companies").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, data: mockCompany });
    expect(companyService.createCompany).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Acme Corp" }),
      10
    );
  });

  it("should return 422 when name is missing", async () => {
    const res = await request(app).post("/api/companies").send({});

    expect(res.status).toBe(422);
    expect(companyService.createCompany).not.toHaveBeenCalled();
  });

  it("should return 422 when name is too short (< 2 chars)", async () => {
    const res = await request(app).post("/api/companies").send({ name: "X" });

    expect(res.status).toBe(422);
  });
});

// ─── PATCH /api/companies/:id ─────────────────────────────────────────────────

describe("PATCH /api/companies/:id", () => {
  it("should return 200 with updated company", async () => {
    const updated = { ...mockCompany, name: "New Name" };
    companyService.updateCompany.mockResolvedValue(updated);

    const res = await request(app).patch("/api/companies/c1").send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Name");
    expect(companyService.updateCompany).toHaveBeenCalledWith("c1", expect.objectContaining({ name: "New Name" }), 10);
  });

  it("should return 404 when service throws NotFoundError", async () => {
    const { NotFoundError } = require("../../../shared/utils/errors");
    companyService.updateCompany.mockRejectedValue(new NotFoundError("Company not found"));

    const res = await request(app).patch("/api/companies/missing").send({ name: "X Corp" });

    expect(res.status).toBe(404);
  });

  it("should return 403 when service throws ForbiddenError", async () => {
    const { ForbiddenError } = require("../../../shared/utils/errors");
    companyService.updateCompany.mockRejectedValue(new ForbiddenError("Not allowed"));

    const res = await request(app).patch("/api/companies/c1").send({ name: "X Corp" });

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/companies/:id ────────────────────────────────────────────────

describe("DELETE /api/companies/:id", () => {
  it("should return 200 on successful deletion", async () => {
    companyService.deleteCompany.mockResolvedValue(true);

    const res = await request(app).delete("/api/companies/c1");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: "Company deleted successfully" });
    expect(companyService.deleteCompany).toHaveBeenCalledWith("c1", 10);
  });

  it("should return 404 when service throws NotFoundError", async () => {
    const { NotFoundError } = require("../../../shared/utils/errors");
    companyService.deleteCompany.mockRejectedValue(new NotFoundError("Company not found"));

    const res = await request(app).delete("/api/companies/missing");

    expect(res.status).toBe(404);
  });

  it("should return 403 when caller does not own the company", async () => {
    const { ForbiddenError } = require("../../../shared/utils/errors");
    companyService.deleteCompany.mockRejectedValue(new ForbiddenError("Not allowed"));

    const res = await request(app).delete("/api/companies/c1");

    expect(res.status).toBe(403);
  });
});
