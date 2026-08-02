import type { StaffMember, UUID } from "../types/api";
import { api } from "./http";

export const staffService = {
  async list(schoolId?: UUID): Promise<StaffMember[]> {
    const { data } = await api.get<StaffMember[]>("/staff", {
      params: schoolId ? { schoolId } : undefined,
    });
    return data;
  },

  async listBySchool(schoolId: UUID): Promise<StaffMember[]> {
    const { data } = await api.get<StaffMember[]>(`/schools/${schoolId}/staff`);
    return data;
  },

  async create(payload: Omit<StaffMember, "id">): Promise<StaffMember> {
    const { data } = await api.post<StaffMember>("/admin/staff", payload);
    return data;
  },

  async update(id: UUID, payload: Partial<StaffMember>): Promise<StaffMember> {
    const { data } = await api.put<StaffMember>(`/admin/staff/${id}`, payload);
    return data;
  },

  async revoke(id: UUID): Promise<StaffMember> {
    const { data } = await api.put<StaffMember>(`/admin/staff/${id}/revoke`);
    return data;
  },

  async restore(id: UUID): Promise<StaffMember> {
    const { data } = await api.put<StaffMember>(`/admin/staff/${id}/restore`);
    return data;
  },

  async remove(id: UUID): Promise<void> {
    await api.delete(`/admin/staff/${id}`);
  },
};
