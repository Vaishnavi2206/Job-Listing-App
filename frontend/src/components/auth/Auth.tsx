import { useState } from "react";

import { useForm } from "react-hook-form";

import { useNavigate } from "react-router-dom";

import { loginUser, signupUser } from "../../services/auth.service";

import useAuth from "../../hooks/useAuth";

import "./Auth.css";

type AuthFormData = {
  firstName: string;
  lastName: string;
  roleName: string;
  username: string;
  password: string;
};

const getErrorMessage = (requestError: unknown, fallback: string) => {
  const response = (
    requestError as {
      response?: { data?: { message?: string } };
    }
  ).response;

  return response?.data?.message || fallback;
};

const Auth = ({ formType }: { formType: "signup" | "login" }) => {
  const isSignup = formType === "signup";

  const navigate = useNavigate();

  const { setToken, setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const { register, handleSubmit, reset } = useForm<AuthFormData>();

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

        return;
      }

      const response = await loginUser({
        username: data.username,
        password: data.password,
      });

      setToken(response.accessToken);
      setUser(response.user);

      navigate("/dashboard");
    } catch (error) {
      setError(getErrorMessage(error, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authCard">
      <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        {isSignup && (
          <>
            <input type="text" placeholder="First Name" {...register("firstName")} />

            <input type="text" placeholder="Last Name" {...register("lastName")} />

            <select {...register("roleName")}>
              <option value="">Select Role</option>

              <option value="EMPLOYER">Employer</option>

              <option value="CANDIDATE">Candidate</option>
            </select>
          </>
        )}

        <input type="text" placeholder="Username" {...register("username")} />

        <input type="password" placeholder="Password" {...register("password")} />

        {error && <p className="errorText">{error}</p>}

        <button disabled={loading}>
          {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Auth;
