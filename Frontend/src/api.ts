import type { Course } from "./data/courses";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "API request failed");
  }

  return data as T;
}

export const api = {
  getCourses: () => request<Course[]>("/courses"),
  getRegistrations: () => request<Course[]>("/registrations"),
  createRegistration: (classId: number) =>
    request<{ message: string }>("/registrations", {
      method: "POST",
      body: JSON.stringify({ classId }),
    }),
  deleteRegistration: (classId: number) =>
    request<{ message: string }>(`/registrations/${classId}`, {
      method: "DELETE",
    }),
};
