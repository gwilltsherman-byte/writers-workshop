export function api(path: string, init: RequestInit = {}) {
  return fetch(path, { credentials: "include", cache: "no-store", ...init });
}