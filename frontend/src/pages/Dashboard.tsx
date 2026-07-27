import "./Dashboard.css";
import "../App.css";
import EmployerDashboard from "../components/dashboard/EmployerDashboard";
import CandidateDashboard from "../components/dashboard/CandidateDashboard";
import AppliedJobsModal from "./AppliedJobsModal";
import { DashboardProvider } from "../context/DashboardContext";
import { JobsProvider } from "../context/JobsContext";
import { useDashboard } from "../hooks/useDashboard";
import useAuth from "../hooks/useAuth";
import { Button, Alert, Loader } from "../components/ui";

const DashboardInner = () => {
  const { user } = useAuth();
  const isEmployer = user?.roleName === "EMPLOYER";
  const {
    applications,
    showAppliedJobs,
    setShowAppliedJobs,
    loading,
    message,
    error,
    handleLogout,
  } = useDashboard();

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="db-layout">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="db-sidebar">
        <div className="db-sidebar__logo">
          <div className="db-sidebar__logo-mark">JB</div>
          <span className="db-sidebar__logo-name">JobBoard</span>
        </div>

        <nav className="db-nav" aria-label="Dashboard navigation">
          <p className="db-nav__label">{isEmployer ? "Employer" : "Candidate"}</p>

          {isEmployer ? (
            <>
              <a className="db-nav__item db-nav__item--active" href="#overview">
                <span className="db-nav__icon" aria-hidden="true">
                  ◈
                </span>
                Overview
              </a>
              <a className="db-nav__item" href="#companies">
                <span className="db-nav__icon" aria-hidden="true">
                  ⊞
                </span>
                Companies
              </a>
              <a className="db-nav__item" href="#jobs">
                <span className="db-nav__icon" aria-hidden="true">
                  ◇
                </span>
                Jobs
              </a>
              <a className="db-nav__item" href="#applications">
                <span className="db-nav__icon" aria-hidden="true">
                  ☰
                </span>
                Applications
              </a>
            </>
          ) : (
            <div className="db-nav__item db-nav__item--active">
              <span className="db-nav__icon" aria-hidden="true">
                ⊞
              </span>
              Browse Jobs
            </div>
          )}
        </nav>

        <div className="db-sidebar__footer">
          <div className="db-sidebar__user">
            <div className="db-sidebar__avatar">{initials}</div>
            <div className="db-sidebar__user-info">
              <div className="db-sidebar__user-name">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="db-sidebar__user-role">{isEmployer ? "Employer" : "Candidate"}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" fullWidth onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="db-main">
        {/* Topbar */}
        <div className="db-topbar">
          <div className="db-topbar__left">
            <h1 className="db-topbar__title">
              Welcome back, <span>{user?.firstName || "there"}</span>
            </h1>
            <p className="db-topbar__subtitle">
              {isEmployer
                ? "Manage your companies, jobs, and applications."
                : "Find your next opportunity and track your applications."}
            </p>
          </div>
          <div className="db-topbar__right">
            {!isEmployer && (
              <Button variant="secondary" size="sm" onClick={() => setShowAppliedJobs((v) => !v)}>
                My Applications ({applications.length})
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="db-content">
          {message && (
            <Alert key={message} variant="success" message={message} compact className="db-alert" />
          )}
          {error && (
            <Alert key={error} variant="danger" message={error} compact className="db-alert" />
          )}

          {showAppliedJobs &&
            !isEmployer &&
            (applications.length ? (
              <AppliedJobsModal />
            ) : (
              <p className="db-empty-inline">No applications yet.</p>
            ))}

          {loading ? (
            <div className="db-loader-wrap">
              <Loader label="Loading your dashboard…" />
            </div>
          ) : isEmployer ? (
            <EmployerDashboard />
          ) : (
            <CandidateDashboard />
          )}
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => (
  <DashboardProvider>
    <JobsProvider>
      <DashboardInner />
    </JobsProvider>
  </DashboardProvider>
);

export default Dashboard;
