import type { School, SchoolRequest, SchoolUpdate, UUID } from "../types/api";
import { api } from "./http";

export const schoolService = {
  async list(): Promise<School[]> {
    const { data } = await api.get<School[]>("/schools");
    return data;
  },

  async create(payload: SchoolRequest): Promise<School> {
    const { data } = await api.post<School>("/schools", payload);
    return data;
  },

  async update(id: UUID, payload: SchoolUpdate): Promise<School> {
    const { data } = await api.put<School>(`/schools/${id}`, payload);
    return data;
  },

  async remove(id: UUID): Promise<void> {
    await api.delete(`/schools/${id}`);
  },
};

