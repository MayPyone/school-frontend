import type { StaffRole, User } from "../types/api";
import { api } from "./http";

export const userService = {
  async list(role?: StaffRole): Promise<User[]> {
    const { data } = await api.get<User[]>("/users", {
      params: role ? { role } : undefined,
    });
    return data;
  },
};
