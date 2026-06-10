const JobListing = require("./jobListing.model");
const { Op, literal, where } = require("sequelize");

const Company = require(
  "../companies/company.model"
);
const sequelize = require("../../config/db");

const createJob = async (
  payload,
  userId
) => {
  const company = await Company.findByPk(
    payload.companyId
  );

  if (!company) {
    throw new Error("Company not found");
  }

  /*
    Ownership validation
  */

  if (company.createdBy !== userId) {
    throw new Error(
      "You can only create jobs for your own company"
    );
  }

  const job = await JobListing.create(payload);

  return job;
};


const getAllJobs = async (options) => {
  const { pageSize = 10, pageNo = 1, search } = options;
let order = [["createdAt", "DESC"]];

  const query = {
    where: {
      isActive: true,
    },
    include: [
      // {
      //   model: Company,
      // },
    ],
    order,
    limit: parseInt(pageSize, 10),
    offset: pageNo,
  };
  // if (search?.trim()) {
  //   query.where = {
  //     ...query.where,

  //     [Op.and]: [
  //       where(
  //         literal(`
  //           to_tsvector(
  //             'english',
  //             coalesce("JobListing"."title",'') || ' ' ||
  //             coalesce("JobListing"."description",'') || ' ' ||
  //             coalesce("JobListing"."location",'')
  //           )
  //         `),
  //         "@@",
  //         literal(
  //           `plainto_tsquery('english', '${search.replace(/'/g, "''")}')`
  //         )
  //       ),
  //     ],
  //   };

  //   query.order = [
  //     [
  //       literal(`
  //         ts_rank(
  //           to_tsvector(
  //             'english',
  //             coalesce("JobListing"."title",'') || ' ' ||
  //             coalesce("JobListing"."description",'') || ' ' ||
  //             coalesce("JobListing"."location",'')
  //           ),
  //           plainto_tsquery('english', '${search.replace(/'/g, "''")}')
  //         )
  //       `),
  //       "DESC",
  //     ],
  //   ];
  // }
// console.time("db");
  
  if (search?.trim()) {
    where[Op.and] = [
      sequelize.literal(`
        "JobListing"."search_vector"
        @@
        plainto_tsquery(
          'english',
          ${sequelize.escape(search)}
        )
      `),
    ];

    order = [
      [
        sequelize.literal(`
          ts_rank(
            "JobListing"."search_vector",
            plainto_tsquery(
              'english',
              ${sequelize.escape(search)}
            )
          )
        `),
        "DESC",
      ],
    ];
  }
  return JobListing.findAll({
    ...query,

    });
    // const jobs = await JobListing.findAll(query);

  // console.timeEnd("db");
  return jobs;
    };

const getJobById = async (id) => {
  const job = await JobListing.findByPk(id, {
    include: [
      {
        model: Company,
      },
    ],
  });

  if (!job) {
    throw new Error("Job not found");
  }

  return job;
};

const updateJob = async (
  jobId,
  payload,
  userId
) => {
  const job = await JobListing.findByPk(
    jobId,
    {
      include: [
        {
          model: Company,
        },
      ],
    }
  );

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.Company.createdBy !== userId) {
    throw new Error(
      "You are not allowed to update this job"
    );
  }

  await job.update(payload);

  return job;
};

const deleteJob = async (
  jobId,
  userId
) => {
  const job = await JobListing.findByPk(
    jobId,
    {
      include: [
        {
          model: Company,
        },
      ],
    }
  );

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.Company.createdBy !== userId) {
    throw new Error(
      "You are not allowed to delete this job"
    );
  }

  await job.destroy();

  return true;
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
};