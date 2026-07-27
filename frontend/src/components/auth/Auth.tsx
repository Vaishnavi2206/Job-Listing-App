import { useState } from "react";

import { useForm } from "react-hook-form";

import { useNavigate } from "react-router-dom";

import { loginUser, signupUser } from "../../services/auth.service";

import useAuth from "../../hooks/useAuth";

import { Button, Input, PasswordInput, Select, FormField, Alert } from "../ui";

import "./Auth.css";

// ── Types ────────────────────────────────────────────────────

type AuthFormData = {
  firstName: string;
  lastName: string;
  roleName: string;
  username: string;
  password: string;
};

interface AuthProps {
  formType: "signup" | "login";
  /** Called after a successful signup so the parent can react (e.g. switch tabs). */
  onSuccess?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

const getErrorMessage = (requestError: unknown, fallback: string) => {
  const response = (
    requestError as {
      response?: { data?: { message?: string } };
    }
  ).response;

  return response?.data?.message || fallback;
};

const ROLE_OPTIONS = [
  { value: "EMPLOYER", label: "Employer — I want to hire" },
  { value: "CANDIDATE", label: "Candidate — I'm looking for work" },
];

// ── Component ────────────────────────────────────────────────

const Auth = ({ formType, onSuccess }: AuthProps) => {
  const isSignup = formType === "signup";

  const navigate = useNavigate();

  const { setToken, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, reset } = useForm<AuthFormData>();

  // ── Submit handler (logic unchanged) ─────────────────────

  const onSubmit = async (data: AuthFormData) => {
    try {
      setLoading(true);
      setError("");

      if (isSignup) {
        await signupUser({
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          password: data.password,
          roleName: data.roleName,
        });

        reset();
        onSuccess?.();
        return;
      }

      const response = await loginUser({
        username: data.username,
        password: data.password,
      });

      setToken(response.accessToken);
      setUser(response.user);

      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="auth-form">
      {/* Heading */}
      <div className="auth-form__heading">
        <h1>{isSignup ? "Create account" : "Welcome back"}</h1>
        <p>
          {isSignup
            ? "Fill in your details to get started."
            : "Sign in to continue to your dashboard."}
        </p>
      </div>

      {/* API error alert */}
      {error && (
        <div className="auth-form__alert">
          <Alert
            variant="danger"
            message={error}
            dismissible
            onDismiss={() => setError("")}
            compact
          />
        </div>
      )}

      {/* Form — noValidate hands control fully to react-hook-form */}
      <form className="auth-form__fields" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Signup-only fields */}
        {isSignup && (
          <>
            <div className="auth-name-row">
              <FormField label="First name" htmlFor="auth-firstName" required>
                <Input
                  id="auth-firstName"
                  placeholder="John"
                  autoComplete="given-name"
                  {...register("firstName")}
                />
              </FormField>

              <FormField label="Last name" htmlFor="auth-lastName" required>
                <Input
                  id="auth-lastName"
                  placeholder="Smith"
                  autoComplete="family-name"
                  {...register("lastName")}
                />
              </FormField>
            </div>

            <FormField label="I am a" htmlFor="auth-roleName" required>
              <Select
                id="auth-roleName"
                placeholder="Select your role"
                options={ROLE_OPTIONS}
                {...register("roleName")}
              />
            </FormField>
          </>
        )}

        {/* Shared fields */}
        <FormField label="Username" htmlFor="auth-username" required>
          <Input
            id="auth-username"
            placeholder="your_username"
            autoComplete="username"
            {...register("username")}
          />
        </FormField>

        <FormField label="Password" htmlFor="auth-password" required>
          <PasswordInput
            id="auth-password"
            placeholder="••••••••"
            autoComplete={isSignup ? "new-password" : "current-password"}
            {...register("password")}
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          className="auth-form__submit"
        >
          {isSignup ? "Create Account" : "Sign In"}
        </Button>
      </form>
    </div>
  );
};

export default Auth;
