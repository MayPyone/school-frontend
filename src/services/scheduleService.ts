import type { ClassSchedule, ClassScheduleRequest, UUID } from "../types/api";
import { api } from "./http";

export const scheduleService = {
  async list(schoolId?: UUID): Promise<ClassSchedule[]> {
    const { data } = await api.get<ClassSchedule[]>("/schedules", {
      params: schoolId ? { schoolId } : undefined,
    });
    return data;
  },

  async create(payload: ClassScheduleRequest): Promise<ClassSchedule> {
    const { data } = await api.post<ClassSchedule>("/schedules", payload);
    return data;
  },

  async update(id: UUID, payload: Partial<ClassScheduleRequest>): Promise<ClassSchedule> {
    const { data } = await api.put<ClassSchedule>(`/schedules/${id}`, payload);
    return data;
  },

  async remove(id: UUID): Promise<void> {
    await api.delete(`/schedules/${id}`);
  },
};
