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
): Promise<{ token: string; user: User }> => {
  const response = await api.post(
    "/auth/login",
    payload
  );

  return response.data;
};
