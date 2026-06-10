const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

console.log(
  path.resolve(__dirname, "../../.env")
);

const sequelize = require("../config/db");
const JobListing = require("../modules/jobListings/jobListing.model");

const TOTAL_JOBS = 100000;
const BATCH_SIZE = 1000;

const companyIds = [
  "a5e3a302-9b30-45ef-bdf6-5b535419cc84", // Mobiuso
  "a9f94d50-42db-4a11-b21f-7cb21b76f18b", // Cognizant
  "29d21620-9380-43bc-b6c4-d22b4800236f", // Capgemini
  "2ce61ab1-6089-4400-9a33-9f671ee5c07f", // Intergen
  "a2e4932c-d978-4020-977e-0d5eec88de03", // EY
];

const locations = [
  "Mumbai",
  "Pune",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Delhi",
  "Noida",
  "Gurgaon",
];

const employmentTypes = [
  "Full Time",
  "Part Time",
  "Contract",
];

const jobTemplates = [
  {
    title: "React Developer",
    skills: ["React", "JavaScript", "Redux", "Node.js", "AWS"],
  },
  {
    title: "Senior React Developer",
    skills: ["React", "TypeScript", "Redux", "PostgreSQL", "Docker"],
  },
  {
    title: "Node.js Developer",
    skills: ["Node.js", "Express", "MongoDB", "AWS", "Docker"],
  },
  {
    title: "Java Developer",
    skills: ["Java", "Spring Boot", "PostgreSQL", "Kafka", "AWS"],
  },
  {
    title: "Angular Developer",
    skills: ["Angular", "TypeScript", "RxJS", "NgRx", "Azure"],
  },
  {
    title: "Python Developer",
    skills: ["Python", "Django", "PostgreSQL", "Redis", "AWS"],
  },
  {
    title: "DevOps Engineer",
    skills: ["Docker", "Kubernetes", "AWS", "Terraform", "Jenkins"],
  },
  {
    title: "Data Engineer",
    skills: ["Python", "Spark", "Kafka", "AWS", "Snowflake"],
  },
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDescription(template, location) {
  return `
${template.title} opportunity based in ${location}.

Required Skills:
${template.skills.join(", ")}

Responsibilities:
- Build scalable enterprise applications
- Collaborate with product and engineering teams
- Participate in architecture discussions
- Write clean, maintainable code
- Conduct code reviews and mentor team members

Preferred Qualifications:
Experience with ${template.skills[0]} and ${template.skills[1]}.
Strong understanding of software development best practices.
Exposure to cloud platforms and distributed systems.

Location: ${location}

Excellent growth opportunities and competitive compensation package.
`;
}

async function generateJobs() {
  try {
    console.log({
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
});
    await sequelize.authenticate();

    console.log("Connected to database");
    console.log(`Generating ${TOTAL_JOBS.toLocaleString()} jobs...`);

    for (
      let currentBatchStart = 0;
      currentBatchStart < TOTAL_JOBS;
      currentBatchStart += BATCH_SIZE
    ) {
      const jobs = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const template = randomItem(jobTemplates);
        const location = randomItem(locations);

        const salaryMin =
          300000 + Math.floor(Math.random() * 2200000);

        const salaryMax =
          salaryMin +
          200000 +
          Math.floor(Math.random() * 800000);

        jobs.push({
          title: template.title,
          description: generateDescription(
            template,
            location
          ),
          location,
          salaryMin,
          salaryMax,
          employmentType: randomItem(employmentTypes),
          isActive: true,
          companyId: randomItem(companyIds),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await JobListing.bulkCreate(jobs);

      console.log(
        `Inserted ${Math.min(
          currentBatchStart + BATCH_SIZE,
          TOTAL_JOBS
        ).toLocaleString()} / ${TOTAL_JOBS.toLocaleString()} jobs`
      );
    }

    console.log(
      `✅ Successfully inserted ${TOTAL_JOBS.toLocaleString()} jobs`
    );

    process.exit(0);
  } catch (error) {
    console.error("Error generating jobs:", error);
    process.exit(1);
  }
}

generateJobs();