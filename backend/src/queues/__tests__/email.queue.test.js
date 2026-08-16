"use strict";

const mockAdd = jest.fn();
const mockClose = jest.fn();
const mockQueueCtor = jest.fn().mockImplementation(() => ({
  add: mockAdd,
  close: mockClose,
}));

const mockQuit = jest.fn();
const mockCreateRedisConnection = jest.fn().mockReturnValue({ quit: mockQuit });

jest.mock("bullmq", () => ({
  Queue: mockQueueCtor,
}));

jest.mock("../../config/redis", () => ({
  createRedisConnection: mockCreateRedisConnection,
}));

describe("queues/email.queue", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("should lazily initialize queue only once", () => {
    const { getEmailQueue } = require("../email.queue");

    const q1 = getEmailQueue();
    const q2 = getEmailQueue();

    expect(q1).toBe(q2);
    expect(mockCreateRedisConnection).toHaveBeenCalledTimes(1);
    expect(mockQueueCtor).toHaveBeenCalledTimes(1);
  });

  it("should enqueue status email with deterministic jobId", async () => {
    mockAdd.mockResolvedValue({ id: "job-1" });
    const { enqueueStatusEmail } = require("../email.queue");

    const job = await enqueueStatusEmail({
      applicationId: "app-1",
      status: "accepted",
      recipientEmail: "jane@example.com",
      applicantName: "Jane Doe",
    });

    expect(mockAdd).toHaveBeenCalledWith(
      "send-status-email",
      expect.objectContaining({
        applicationId: "app-1",
        status: "accepted",
        recipientEmail: "jane@example.com",
        applicantName: "Jane Doe",
        meta: {},
        enqueuedAt: expect.any(String),
      }),
      expect.objectContaining({ jobId: "status-email:app-1:accepted" })
    );
    expect(job).toEqual({ id: "job-1" });
  });

  it("should pass through custom meta when provided", async () => {
    mockAdd.mockResolvedValue({ id: "job-2" });
    const { enqueueStatusEmail } = require("../email.queue");

    await enqueueStatusEmail({
      applicationId: "app-2",
      status: "rejected",
      recipientEmail: "john@example.com",
      applicantName: "John Doe",
      meta: { reason: "No match" },
    });

    expect(mockAdd).toHaveBeenCalledWith(
      "send-status-email",
      expect.objectContaining({ meta: { reason: "No match" } }),
      expect.any(Object)
    );
  });

  it("should close queue and connection when closeEmailQueue is called", async () => {
    const { getEmailQueue, closeEmailQueue } = require("../email.queue");
    getEmailQueue();

    await closeEmailQueue();

    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockQuit).toHaveBeenCalledTimes(1);
  });

  it("should be safe to close when queue was never created", async () => {
    const { closeEmailQueue } = require("../email.queue");

    await expect(closeEmailQueue()).resolves.toBeUndefined();
  });

  it("should expose queue through emailQueue getter", () => {
    const moduleUnderTest = require("../email.queue");

    const queue = moduleUnderTest.emailQueue;

    expect(queue).toBeDefined();
    expect(mockQueueCtor).toHaveBeenCalledTimes(1);
  });
});
