export type SignupPayload = {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  roleName: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};
