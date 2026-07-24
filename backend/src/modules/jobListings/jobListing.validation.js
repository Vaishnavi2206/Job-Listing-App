const { z } = require("zod");

const createJobSchema = z.object({
  title: z.string().min(2),

  description: z.string().min(10),

  location: z.string().optional(),

  salaryMin: z.number().optional(),

  salaryMax: z.number().optional(),

  employmentType: z.string().optional(),

  companyId: z.string().uuid(),
});

const updateJobSchema = createJobSchema.partial();

module.exports = {
  createJobSchema,
  updateJobSchema,
};
