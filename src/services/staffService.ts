import type { StaffMember, UUID } from "../types/api";
import { api } from "./http";

export const staffService = {
  async list(schoolId?: UUID): Promise<StaffMember[]> {
    const { data } = await api.get<StaffMember[]>("/staff", {
      params: schoolId ? { schoolId } : undefined,
    });
    return data;
  },

  async create(payload: Omit<StaffMember, "id">): Promise<StaffMember> {
    const { data } = await api.post<StaffMember>("/staff", payload);
    return data;
  },

  async update(id: UUID, payload: Partial<StaffMember>): Promise<StaffMember> {
    const { data } = await api.put<StaffMember>(`/staff/${id}`, payload);
    return data;
  },

  async remove(id: UUID): Promise<void> {
    await api.delete(`/staff/${id}`);
  },
};
