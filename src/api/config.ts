export const API_BASE_PATH = "/api";

export function apiUrl(path: string): string {
  return `${API_BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
