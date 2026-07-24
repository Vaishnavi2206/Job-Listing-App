const { z } = require("zod");

const createCompanySchema = z.object({
  name: z.string().min(2),

  description: z.string().optional(),

  employeeSize: z.string().optional(),

  location: z.string().optional(),

  category: z.string().optional(),
});

const updateCompanySchema = createCompanySchema.partial();

module.exports = {
  createCompanySchema,
  updateCompanySchema,
};
