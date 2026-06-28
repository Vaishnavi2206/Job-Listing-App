import { useState } from 'react'
import "./JobSearch.css"

const JobSearch = () => {
const [jobs] = useState([]);
  return (
    <div className="searchPage">
  <div className="searchHeader">
    <h1>Search Jobs</h1>
    <p>Find opportunities matching your skills and interests.</p>
  </div>

  <div className="searchBar">
    <input
      type="text"
      placeholder="Search jobs, skills, company..."
    />
    <button>Search</button>
  </div>

  <div className="searchLayout">
    <aside className="searchFilters">
      <div className="filterGroup">
        <h3>Job Type</h3>

        <label>
          <input type="checkbox" />
          Full Time
        </label>

        <label>
          <input type="checkbox" />
          Part Time
        </label>

        <label>
          <input type="checkbox" />
          Contract
        </label>
      </div>

      <div className="filterGroup">
        <h3>Experience</h3>

        <label>
          <input type="checkbox" />
          0-2 Years
        </label>

        <label>
          <input type="checkbox" />
          2-5 Years
        </label>

        <label>
          <input type="checkbox" />
          5+ Years
        </label>
      </div>

      <div className="filterGroup">
        <h3>Location</h3>

        <label>
          <input type="checkbox" />
          Mumbai
        </label>

        <label>
          <input type="checkbox" />
          Pune
        </label>

        <label>
          <input type="checkbox" />
          Bangalore
        </label>
      </div>
    </aside>

    <section className="searchResults">
      <div className="resultsHeader">
        <h2>123 Jobs Found</h2>
      </div>

      <div className="resultsList">
        {jobs.map((job:any) => (
          <div key={job.id} className="jobResultCard">
            <h3>{job.title}</h3>

            <p className="companyName">
              {job.company}
            </p>

            <p className="jobMeta">
              {job.location} • {job.salary}
            </p>

            <div className="skills">
              {job.skills.join(", ")}
            </div>

            <small>Posted 2 days ago</small>

            <button>View Details</button>
          </div>
        ))}
      </div>
    </section>
  </div>
</div>
  )
}

export default JobSearch
