import { useState } from "react";
import Auth from "./Auth";
import { Alert } from "../ui";
import "./AuthPage.css";

// ── Static brand panel data ───────────────────────────────────

const FEATURES = [
  { icon: "✦", text: "Smart job matching based on your skills" },
  { icon: "⚡", text: "One-click applications to top companies" },
  { icon: "◎", text: "Real-time application status tracking" },
] as const;

type ActiveTab = "login" | "signup";

// ── Component ────────────────────────────────────────────────

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("login");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleTabSwitch = (tab: ActiveTab) => {
    setActiveTab(tab);
    // Clear the success banner when navigating to signup
    if (tab === "signup") setSignupSuccess(false);
  };

  // Called by Auth after a successful signup
  const handleSignupSuccess = () => {
    setSignupSuccess(true);
    setActiveTab("login");
  };

  return (
    <div className="auth-page">
      {/* ── Left: Brand panel ──────────────────────────── */}
      <aside className="auth-brand" aria-hidden="true">
        <div className="auth-brand__logo">
          <span className="auth-brand__logo-mark">JB</span>
          <span className="auth-brand__logo-name">JobBoard</span>
        </div>

        <div className="auth-brand__hero">
          <h2 className="auth-brand__headline">
            Find Your
            <br />
            <em>Dream Job.</em>
          </h2>
          <p className="auth-brand__subtext">
            Connect with thousands of opportunities from top companies worldwide.
          </p>

          <ul className="auth-brand__features">
            {FEATURES.map(({ icon, text }) => (
              <li key={text} className="auth-brand__feature">
                <span className="auth-brand__feature-icon">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="auth-brand__footer">
          © {new Date().getFullYear()} JobBoard. All rights reserved.
        </p>
      </aside>

      {/* ── Right: Form panel ──────────────────────────── */}
      <main className="auth-form-panel">
        <div className="auth-form-container">
          {/* Mobile-only logo — hidden when brand panel is visible */}
          <div className="auth-mobile-logo">
            <span className="auth-mobile-logo__mark">JB</span>
            <span className="auth-mobile-logo__name">JobBoard</span>
          </div>

          {/* Tab switcher */}
          <div className="auth-tabs" role="tablist" aria-label="Authentication options">
            <button
              role="tab"
              aria-selected={activeTab === "login"}
              className={`auth-tab${activeTab === "login" ? " auth-tab--active" : ""}`}
              onClick={() => handleTabSwitch("login")}
            >
              Sign In
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "signup"}
              className={`auth-tab${activeTab === "signup" ? " auth-tab--active" : ""}`}
              onClick={() => handleTabSwitch("signup")}
            >
              Create Account
            </button>
          </div>

          {/* Post-signup success banner — shown on login tab after account creation */}
          {signupSuccess && (
            <div className="auth-success-banner">
              <Alert
                variant="success"
                title="Account created!"
                message="Your account is ready. Sign in below to get started."
                dismissible
                onDismiss={() => setSignupSuccess(false)}
              />
            </div>
          )}

          {/*
           * key={activeTab} forces Auth to remount when the tab changes,
           * which resets form state and re-runs the entrance animation.
           */}
          <Auth
            key={activeTab}
            formType={activeTab}
            onSuccess={activeTab === "signup" ? handleSignupSuccess : undefined}
          />
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
