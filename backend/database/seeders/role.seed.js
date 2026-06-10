const sequelize = require("../../src/config/db");

const Role = require(
  "../../src/modules/roles/role.model"
);

async function seedRoles() {
  try {
    await sequelize.authenticate();

    await sequelize.sync();

    const roles = [
      {
        name: "EMPLOYER",
        description:
          "Employer role",
      },

      {
        name: "CANDIDATE",
        description:
          "Candidate role",
      },
    ];

    for (const role of roles) {
      await Role.findOrCreate({
        where: {
          name: role.name,
        },

        defaults: role,
      });
    }

    console.log(
      "Roles seeded successfully"
    );

    process.exit();

  } catch (error) {
    console.error(error);

    process.exit(1);
  }
}

seedRoles();