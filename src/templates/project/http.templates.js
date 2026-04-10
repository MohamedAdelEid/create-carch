export function axiosClientTemplate() {
  return `import axios from "axios";
import { env } from "@/config/env";

const axiosClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: Number(env.NEXT_PUBLIC_API_TIMEOUT ?? 15000),
  headers: { "Content-Type": "application/json" },
});

export default axiosClient;
`;
}

export function interceptorsTemplate() {
  return `import type { AxiosInstance } from "axios";

export function applyRequestInterceptor(
  client: AxiosInstance,
  getToken: () => string | null,
) {
  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = \`Bearer \${token}\`;
    return config;
  });
}

export function applyResponseInterceptor(
  client: AxiosInstance,
  onUnauthorized: () => void,
) {
  client.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) onUnauthorized();
      return Promise.reject(error);
    },
  );
}
`;
}

export function tokenStoreTemplate() {
  return `import { getSession } from "next-auth/react";
import { auth } from "@/shared/infrastructure/auth/nextAuth";

export async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    const session = await auth();
    return session?.accessToken ?? null;
  }
  const session = await getSession();
  return session?.accessToken ?? null;
}
`;
}

export function httpClientTemplate() {
  return `import type { AxiosRequestConfig } from "axios";
import axiosClient from "./axiosClient";
import { applyRequestInterceptor, applyResponseInterceptor } from "./interceptors";
import { getToken } from "./tokenStore";

export type RequestOptions<TData = unknown> = {
  url: string;
  data?: TData;
  params?: Record<string, unknown>;
  paramsSerializer?: AxiosRequestConfig["paramsSerializer"];
  headers?: Record<string, string>;
  isFormData?: boolean;
  withCredentials?: boolean;
  timeout?: number;
};

type ApiResult<T> = {
  data?: T;
  message?: string;
  error?: { message: string };
};

function buildHeaders(
  custom?: Record<string, string>,
  isFormData?: boolean,
): Record<string, string> {
  const base: Record<string, string> = { ...custom };
  if (isFormData) base["Content-Type"] = "multipart/form-data";
  return base;
}

function buildConfig(options: Omit<RequestOptions, "url" | "data">) {
  return {
    params: options.params,
    ...(options.paramsSerializer != null && { paramsSerializer: options.paramsSerializer }),
    headers: buildHeaders(options.headers, options.isFormData),
    ...(options.withCredentials === true && { withCredentials: true }),
    ...(options.timeout != null && { timeout: options.timeout }),
  };
}

export function serializeRepeatParams(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, String(v)));
    } else {
      sp.append(key, String(value));
    }
  }
  return sp.toString();
}

let _onUnauthorized: (() => void) | undefined;

export function setOnUnauthorized(fn: () => void) {
  _onUnauthorized = fn;
}

applyRequestInterceptor(axiosClient, () => {
  if (typeof window !== "undefined") return sessionStorage.getItem("token");
  return null;
});

applyResponseInterceptor(axiosClient, () => _onUnauthorized?.());

async function get<T>(options: Omit<RequestOptions, "data" | "isFormData">): Promise<ApiResult<T>> {
  return axiosClient.get(options.url, buildConfig(options)) as Promise<ApiResult<T>>;
}

async function post<T>(options: RequestOptions): Promise<ApiResult<T>> {
  return axiosClient.post(options.url, options.data, buildConfig(options)) as Promise<ApiResult<T>>;
}

async function put<T>(options: RequestOptions): Promise<ApiResult<T>> {
  return axiosClient.put(options.url, options.data, buildConfig(options)) as Promise<ApiResult<T>>;
}

async function patch<T>(options: RequestOptions): Promise<ApiResult<T>> {
  return axiosClient.patch(options.url, options.data, buildConfig(options)) as Promise<ApiResult<T>>;
}

async function del<T>(options: RequestOptions): Promise<ApiResult<T>> {
  const { url, data, ...rest } = options;
  return axiosClient.delete(url, {
    ...buildConfig(rest),
    ...(data !== undefined ? { data } : {}),
  }) as Promise<ApiResult<T>>;
}

export const httpClient = { get, post, put, patch, delete: del };
`;
}
