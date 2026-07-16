import type { Activity, UUID } from "../types/api";
import { api } from "./http";

export const activityService = {
  async list(schoolId?: UUID): Promise<Activity[]> {
    const { data } = await api.get<Activity[]>("/activities", {
      params: schoolId ? { schoolId } : undefined,
    });
    return data;
  },

  async listBySchool(schoolId: UUID): Promise<Activity[]> {
    const { data } = await api.get<Activity[]>(`/schools/${schoolId}/activities`);
    return data;
  },

  async create(payload: Omit<Activity, "id">): Promise<Activity> {
    const { data } = await api.post<Activity>("/activities", payload);
    return data;
  },

  async update(id: UUID, payload: Partial<Activity>): Promise<Activity> {
    const { data } = await api.put<Activity>(`/activities/${id}`, payload);
    return data;
  },

  async remove(id: UUID): Promise<void> {
    await api.delete(`/activities/${id}`);
  },
};
