import "./Dashboard.css";
import "../App.css";
import EmployerDashboard from "../components/dashboard/EmployerDashboard";
import CandidateDashboard from "../components/dashboard/CandidateDashboard";
import AppliedJobsModal from "./AppliedJobsModal";
import { DashboardProvider } from "../context/DashboardContext";
import { useDashboard } from "../hooks/useDashboard";
import useAuth from "../hooks/useAuth";

const DashboardInner = () => {
  const { user } = useAuth();
  const isEmployer = user?.roleName === "EMPLOYER";
  const {
    applications,
    showAppliedJobs, setShowAppliedJobs,
    loading,
    message, error,
    handleLogout,
  } = useDashboard();
  return (
    <div className="dashboardPage">
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">JOB HUNT</p>
          <h1>Welcome, {user?.firstName || "there"}</h1>
          <p>
            {isEmployer
              ? "Create companies and publish jobs from one workspace."
              : "Your candidate dashboard is ready."}
          </p>
        </div>

        <div className="dashboardActions">
          {!isEmployer && (
            <button
              className="appliedJobsButton"
              onClick={() => setShowAppliedJobs((isVisible) => !isVisible)}
              aria-label="Show applied jobs"
            >
              <span aria-hidden="true">A</span>
              <strong>{applications.length}</strong>
            </button>
          )}

          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {message && <p className="successText">{message}</p>}

      {error && <p className="errorText">{error}</p>}
      {showAppliedJobs &&
        !isEmployer &&
        (applications.length ? (
          <AppliedJobsModal />
        ) : (
          <p>No applications yet.</p>
        ))}
      {loading ? (
        <p>Loading dashboard...</p>
      ) : isEmployer ? (
        <EmployerDashboard />
      ) : (
        <CandidateDashboard />
      )}
    </div>
  );
};

const Dashboard = () => (
  <DashboardProvider>
    <DashboardInner />
  </DashboardProvider>
);

export default Dashboard;
