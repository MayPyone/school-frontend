import axios, { AxiosError } from "axios";
import type { ApiError, AuthResponse, User } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://school-o3fd.onrender.com/api/v1";
const AUTH_STORAGE_KEY = "school-dashboard-auth";
const LEGACY_USER_STORAGE_KEY = "school-dashboard-user";
const SESSION_EXPIRED_REASON = "session-expired";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const hadAuth = Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
      clearStoredUser();

      if (hadAuth && window.location.pathname !== "/login") {
        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("reason", SESSION_EXPIRED_REASON);
        loginUrl.searchParams.set("from", `${window.location.pathname}${window.location.search}`);
        window.location.assign(loginUrl.toString());
      }
    }

    return Promise.reject(error);
  }
);

export function getStoredUser(): User | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const storedAuth = JSON.parse(raw) as AuthResponse;
    return storedAuth.user;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getStoredToken(): string | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const storedAuth = JSON.parse(raw) as AuthResponse;
    return storedAuth.token;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function storeAuth(auth: AuthResponse) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  window.localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
}

export function clearStoredUser() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    return {
      message:
        axiosError.response?.data?.message ??
        axiosError.response?.data?.error ??
        axiosError.message ??
        "Request failed",
      status: axiosError.response?.status,
      details: axiosError.response?.data,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Unexpected error" };
}

export function unavailableEndpointError(section: string): ApiError {
  return {
    message: `${section} endpoints are not implemented by the current Spring Boot API yet.`,
    status: 501,
  };
}
