const JobListing = require("./jobListing.model");
const { Op, literal, where } = require("sequelize");

const Company = require(
  "../companies/company.model"
);
const sequelize = require("../../config/db");
const { decodeCursor, encodeCursor } = require("../../utils/cursor");

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


const _getAllJobs = async (options) => {
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
  // return JobListing.findAll({
  //   ...query,

  //   });
const start = Date.now();
    const jobs = await JobListing.findAll(query);

  console.log(`DB took ${Date.now() - start} ms`);
  return jobs;
    };

const getAllJobs = async (options) => {
  const {
      limit = 10,
      cursor,
      search
  } = options;
  let order = [
      ["createdAt", "DESC"],
      ["id", "DESC"],
  ];

  const cursorData = decodeCursor(cursor);
  console.log("cursor",decodeCursor(cursor));
  const where = {
      isActive: true,
  };



  /**
   * ---------------------------------------------------------
   * Search
   * ---------------------------------------------------------
   *
   * For now we DO NOT apply cursor pagination
   * when searching.
   *
   * Search results are generally much smaller,
   * and ts_rank ordering makes cursor pagination
   * considerably more complicated.
   *
   */
  
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
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ];
  }

    /**
   * ---------------------------------------------------------
   * Cursor Pagination
   * ---------------------------------------------------------
   */

    if (cursorData && !search?.trim()) {
      where[Op.and] = [
        sequelize.literal(`
          ("JobListing"."createdAt", "JobListing"."id")
          <
          (
            ${sequelize.escape(cursorData.createdAt)},
            ${sequelize.escape(cursorData.id)}
          )
        `),
      ];
    }


    const query = {
    where,
    order,
    limit: Number(limit) + 1,
  };
  // const start = Date.now();
  const jobs = await JobListing.findAll(query);

  const hasMore = jobs.length > Number(limit);

  if (hasMore) {
      jobs.pop();
  }

  let nextCursor = null;

if (hasMore && jobs.length) {

    const lastJob = jobs[jobs.length - 1];

    nextCursor = encodeCursor({
        createdAt: lastJob.createdAt,
        id: lastJob.id,
    });

}

// console.log(jobs[jobs.length - 1].createdAt);
// console.log(jobs[jobs.length - 1].id);
console.log(nextCursor,"nextCursor");
  // console.log(`DB took ${Date.now() - start} ms`);
 return {
    jobs,
    pagination: {
        hasMore,
        nextCursor,
    },
};
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