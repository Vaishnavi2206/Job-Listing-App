const { z } = require("zod");

const signupSchema = z.object({
  firstName: z.string().min(2),

  lastName: z.string().min(2),

  username: z.string().min(4),

  password: z.string().min(6),

  roleName: z.string(),
});

const loginSchema = z.object({
  username: z.string(),

  password: z.string(),
});

module.exports = {
  signupSchema,
  loginSchema,
};