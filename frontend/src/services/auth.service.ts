import api from "../api/axios";
import type {
  LoginPayload,
  SignupPayload,
  User,
} from "../types";

export const signupUser = async (
  payload: SignupPayload
) => {
  const response = await api.post(
    "/auth/signup",
    payload
  );

  return response.data;
};

export const loginUser = async (
  payload: LoginPayload
): Promise<{ accessToken: string; user: User }> => {
  const response = await api.post(
    "/auth/login",
    payload
  );

  return response.data;
};

export const refreshUserSession = async (): Promise<{
  accessToken: string;
  user: User;
}> => {
  const response = await api.post("/auth/refresh");

  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");

  return response.data;
};
