import type { School, SchoolRequest, SchoolUpdate, UUID } from "../types/api";
import { api } from "./http";

export const schoolService = {
  async list(): Promise<School[]> {
    const { data } = await api.get<School[]>("/schools");
    return data;
  },

  async get(id: UUID): Promise<School> {
    const { data } = await api.get<School>(`/schools/${id}`);
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

  async exportData(id: UUID): Promise<Blob> {
    const { data } = await api.get<Blob>(`/admin/schools/${id}/export`, {
      responseType: "blob",
    });
    return data;
  },

  async importData(id: UUID, file: File): Promise<School> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<School>(`/admin/schools/${id}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
};
