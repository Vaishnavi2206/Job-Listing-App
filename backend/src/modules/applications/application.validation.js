const { z } = require("zod");
const {
  APPLICATION_STATUS,
} = require(
  "../../shared/constants/applicationStatus"
);

const createApplicationSchema =
  z.object({
    jobListingId: z.string().uuid(),

    resumeUrl: z.string().optional(),

    coverLetter: z.string().optional(),
  });


const updateStatusSchema = z.object({
  status: z.enum([
    APPLICATION_STATUS.REVIEWED,
    APPLICATION_STATUS.INTERVIEW,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.HIRED,
  ]),
});

module.exports = {
  createApplicationSchema,
  updateStatusSchema,
};