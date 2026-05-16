import type { AuthResponse, User, UserLoginRequest, UserRequest } from "../types/api";
import { api, clearStoredUser, storeAuth } from "./http";

export const authService = {
  async login(payload: UserLoginRequest): Promise<User> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    storeAuth(data);
    return data.user;
  },

  async register(payload: UserRequest): Promise<User> {
    const { data } = await api.post<AuthResponse>("/users", payload);
    storeAuth(data);
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      clearStoredUser();
    }
  },
};
