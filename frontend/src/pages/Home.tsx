import { useEffect, useState } from "react";
import Auth from "../components/auth/Auth";
// import { getJobs } from "../services/jobs.service";

import "../App.css";

const Home = () => {
    // const [jobs, setJobs] = useState<Job[]>([]);
    
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                
            //  const   data = await  getJobs();

        // setJobs(data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);


    return (
    <div className="homePage">
      <div className="heroSection">
        <div>
          <h1>
            Find Your Dream Job
          </h1>

          <p>
            Discover jobs from top
            companies.
          </p>
        </div>

        <div className="authContainer">
          <Auth formType="signup" />

          <Auth formType="login" />
        </div>
      </div>

        {/* <section className="jobsSection">
        <h2>Latest Jobs</h2>

        {loading ? (
          <p>Loading jobs...</p>
        ) : (
          <div className="jobsGrid">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
              />
            ))}
          </div>
        )}
      </section> */}
    </div>
  );
};

export default Home;
