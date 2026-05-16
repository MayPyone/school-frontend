export type UUID = string;

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type StaffRole = "ADMIN" | "TEACHER" | "ASSISTANT";
export type LessonCategory = "GRAMMAR" | "VOCAB" | "PRACTICE" | "GENERAL";
export type ScheduleMode = "ONLINE" | "ONSITE";

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

export interface OpeningHourRequest {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
}

export interface User {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: "Bearer";
  user: User;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserRequest extends UserLoginRequest {
  firstName: string;
  lastName: string;
  role: StaffRole;
}

export interface School {
  id: UUID;
  schoolName: string;
  schoolEmail?: string;
  schoolAddress?: string[];
  logoUrl?: string;
  phoneNumbers?: string[];
  description?: string;
  subTitle?: string;
  openingHours?: OpeningHourRequest[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolRequest {
  userId: UUID;
  schoolName: string;
  schoolEmail?: string;
  schoolAddress: string[];
  logoUrl?: string;
  phoneNumbers: string[];
  description?: string;
  subTitle?: string;
  openingHours?: OpeningHourRequest[];
}

export type SchoolUpdate = Partial<Omit<SchoolRequest, "userId">>;

export interface LessonRequest {
  schoolId?: UUID;
  title: string;
  levelId: number;
  content: string;
  category: LessonCategory;
  userId: UUID;
}

export interface LessonUpdate {
  title?: string;
  levelId: number;
  content?: string;
  category?: LessonCategory;
}

export interface LessonResponse {
  lessonId: UUID;
  schoolId: UUID;
  title: string;
  level: string;
  content: string;
  category: LessonCategory;
  createdBy: string;
}

export interface LessonUnitResponse {
  lesson: LessonResponse;
  units: UnitResponse[];
}

export interface CreateUnitRequest {
  title: string;
  content: string;
  videoUrl?: string;
  lessonId: UUID;
  createdById: UUID;
}

export interface UpdateUnitRequest extends CreateUnitRequest {
  id: UUID;
}

export interface UnitResponse {
  id: UUID;
  title: string;
  content: string;
  videoUrl?: string;
  lessonId: UUID;
  createdById?: UUID;
}

export interface ClassSchedule {
  id: UUID;
  schoolId: UUID;
  teacherId?: UUID;
  teacherName?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  mode: ScheduleMode;
  location?: string;
  meetingUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ClassScheduleRequest = Omit<ClassSchedule, "id" | "teacherName" | "createdAt" | "updatedAt">;

export interface StaffMember {
  id: UUID;
  schoolId?: UUID;
  userId?: UUID;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  hireDate?: string;
  status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  createdAt?: string;
  updatedAt?: string;
}

export interface Activity {
  id: UUID;
  schoolId: UUID;
  title: string;
  description?: string;
  activityDate?: string;
  location?: string;
  maxParticipants?: number;
  registeredCount?: number;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ImageUploadPresignRequest {
  originalFilename: string;
  contentType: string;
  folder?: string;
}

export interface ImageUploadPresignResponse {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
  expiresAt: string;
}
