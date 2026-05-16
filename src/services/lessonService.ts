import type {
  LessonRequest,
  LessonResponse,
  LessonUnitResponse,
  LessonUpdate,
  UUID,
} from "../types/api";
import { api } from "./http";

export const lessonService = {
  async listBySchool(schoolId: UUID): Promise<LessonResponse[]> {
    const { data } = await api.get<LessonResponse[]>(`/schools/${schoolId}/lessons`);
    return data;
  },

  async get(schoolId: UUID, lessonId: UUID): Promise<LessonUnitResponse> {
    const { data } = await api.get<LessonUnitResponse>(`/schools/${schoolId}/lessons/${lessonId}`);
    return data;
  },

  async create(schoolId: UUID, payload: LessonRequest): Promise<LessonResponse> {
    const { data } = await api.post<LessonResponse>(`/schools/${schoolId}/lessons`, payload);
    return data;
  },

  async update(schoolId: UUID, lessonId: UUID, payload: LessonUpdate): Promise<LessonResponse> {
    const { data } = await api.put<LessonResponse>(`/schools/${schoolId}/lessons/${lessonId}`, payload);
    return data;
  },

  async remove(schoolId: UUID, lessonId: UUID): Promise<void> {
    await api.delete(`/schools/${schoolId}/lessons/${lessonId}`);
  },
};

