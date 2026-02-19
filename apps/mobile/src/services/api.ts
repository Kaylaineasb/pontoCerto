import axios from "axios";
import { getToken } from "./authStorage";

export const api = axios.create({
  baseURL: "http://192.168.0.14:3000",
  timeout: 15000,
});
api.interceptors.request.use(async (config) => {
  const token = await getToken();

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("[API] auth set", token.slice(0, 15), token.length);
  } else {
    console.log("[API] no token");
  }

  return config;
});
