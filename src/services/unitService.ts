import type { CreateUnitRequest, UnitResponse, UpdateUnitRequest, UUID } from "../types/api";
import { api } from "./http";

export const unitService = {
  async listByLesson(lessonId: UUID): Promise<UnitResponse[]> {
    const { data } = await api.get<UnitResponse[]>(`/lessons/${lessonId}/units`);
    return data;
  },

  async get(lessonId: UUID, unitId: UUID): Promise<UnitResponse> {
    const { data } = await api.get<UnitResponse>(`/lessons/${lessonId}/units/${unitId}`);
    return data;
  },

  async create(lessonId: UUID, payload: CreateUnitRequest): Promise<UnitResponse> {
    const { data } = await api.post<UnitResponse>(`/lessons/${lessonId}/units`, payload);
    return data;
  },

  async update(lessonId: UUID, unitId: UUID, payload: UpdateUnitRequest): Promise<UnitResponse> {
    const { data } = await api.put<UnitResponse>(`/lessons/${lessonId}/units/${unitId}`, payload);
    return data;
  },

  async remove(lessonId: UUID, unitId: UUID): Promise<void> {
    await api.delete(`/lessons/${lessonId}/units/${unitId}`);
  },
};

