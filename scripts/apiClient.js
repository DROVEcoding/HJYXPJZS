import { apiConfig } from "./apiConfig.js";

export function createApiClient(options = {}) {
  const baseUrl = options.baseUrl ?? apiConfig.baseUrl;
  const getToken = options.getToken ?? (() => localStorage.getItem("hjyxpjzs_token"));
  const fetchImpl = options.fetchImpl ?? fetch;

  async function request(path, requestOptions = {}) {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(requestOptions.headers ?? {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...requestOptions,
      headers
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "请求失败。");
    }

    return data;
  }

  return {
    get(path) {
      return request(path);
    },
    post(path, body) {
      return request(path, {
        method: "POST",
        body: JSON.stringify(body)
      });
    },
    put(path, body) {
      return request(path, {
        method: "PUT",
        body: JSON.stringify(body)
      });
    }
  };
}

export const apiClient = createApiClient();
