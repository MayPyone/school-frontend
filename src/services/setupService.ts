import type { AuthResponse, SetupStatusResponse, User, UserRequest } from "../types/api";
import { api, storeAuth } from "./http";

export const setupService = {
  async status(): Promise<SetupStatusResponse> {
    const { data } = await api.get<SetupStatusResponse>("/setup/status");
    return data;
  },

  async createInitialAdmin(payload: Omit<UserRequest, "role">): Promise<User> {
    const { data } = await api.post<AuthResponse>("/setup/admin", {
      ...payload,
      role: "ADMIN",
    });
    storeAuth(data);
    return data.user;
  },
};
