"use strict";

jest.mock("../company.model");
jest.mock("../../../models", () => ({}));

const Company = require("../company.model");
const { createCompany, getAllCompanies, getCompanyById, updateCompany, deleteCompany } = require("../company.service");
const { NotFoundError, ForbiddenError } = require("../../../shared/utils/errors");

const USER_ID = 10;
const mockCompany = {
  id: "c1",
  name: "Acme Corp",
  createdBy: USER_ID,
  update: jest.fn(),
  destroy: jest.fn(),
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ─── createCompany ────────────────────────────────────────────────────────────

describe("createCompany", () => {
  it("should create and return a company", async () => {
    Company.create.mockResolvedValue(mockCompany);

    const result = await createCompany({ name: "Acme Corp" }, USER_ID);

    expect(Company.create).toHaveBeenCalledWith({ name: "Acme Corp", createdBy: USER_ID });
    expect(result).toBe(mockCompany);
  });

  it("should propagate DB errors", async () => {
    Company.create.mockRejectedValue(new Error("DB error"));

    await expect(createCompany({ name: "X" }, USER_ID)).rejects.toThrow("DB error");
  });
});

// ─── getAllCompanies ──────────────────────────────────────────────────────────

describe("getAllCompanies", () => {
  it("should return all companies", async () => {
    Company.findAll.mockResolvedValue([mockCompany]);

    const result = await getAllCompanies();

    expect(result).toEqual([mockCompany]);
  });

  it("should return empty array when no companies exist", async () => {
    Company.findAll.mockResolvedValue([]);

    const result = await getAllCompanies();

    expect(result).toEqual([]);
  });
});

// ─── getCompanyById ───────────────────────────────────────────────────────────

describe("getCompanyById", () => {
  it("should return the company when found", async () => {
    Company.findByPk.mockResolvedValue(mockCompany);

    const result = await getCompanyById("c1");

    expect(Company.findByPk).toHaveBeenCalledWith("c1");
    expect(result).toBe(mockCompany);
  });

  it("should return null when company does not exist", async () => {
    Company.findByPk.mockResolvedValue(null);

    const result = await getCompanyById("nonexistent");

    expect(result).toBeNull();
  });
});

// ─── updateCompany ────────────────────────────────────────────────────────────

describe("updateCompany", () => {
  it("should update and return the company when owner calls it", async () => {
    const company = { ...mockCompany, update: jest.fn().mockResolvedValue(undefined) };
    Company.findByPk.mockResolvedValue(company);

    const result = await updateCompany("c1", { name: "New Name" }, USER_ID);

    expect(company.update).toHaveBeenCalledWith({ name: "New Name" });
    expect(result).toBe(company);
  });

  it("should throw NotFoundError when company does not exist", async () => {
    Company.findByPk.mockResolvedValue(null);

    await expect(updateCompany("missing", {}, USER_ID)).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when caller does not own the company", async () => {
    Company.findByPk.mockResolvedValue({ ...mockCompany, createdBy: 99 });

    await expect(updateCompany("c1", {}, USER_ID)).rejects.toThrow(ForbiddenError);
    await expect(updateCompany("c1", {}, USER_ID)).rejects.toThrow("You are not allowed to update this company");
  });
});

// ─── deleteCompany ────────────────────────────────────────────────────────────

describe("deleteCompany", () => {
  it("should destroy the company and return true when owner calls it", async () => {
    const company = { ...mockCompany, destroy: jest.fn().mockResolvedValue(undefined) };
    Company.findByPk.mockResolvedValue(company);

    const result = await deleteCompany("c1", USER_ID);

    expect(company.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("should throw NotFoundError when company does not exist", async () => {
    Company.findByPk.mockResolvedValue(null);

    await expect(deleteCompany("missing", USER_ID)).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when caller does not own the company", async () => {
    Company.findByPk.mockResolvedValue({ ...mockCompany, createdBy: 99 });

    await expect(deleteCompany("c1", USER_ID)).rejects.toThrow(ForbiddenError);
    await expect(deleteCompany("c1", USER_ID)).rejects.toThrow("You are not allowed to delete this company");
  });
});
