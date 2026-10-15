
import axios from "axios";

const MYMENTOR_BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL;

const CAREERCOMPASS_BACKEND_URL =
  process.env.REACT_APP_CAREERCOMPASS_BACKEND_URL;

const hostname = window.location.hostname;

const isCareerCompass =
  hostname === "carrercompass.com" ||
  hostname === "www.carrercompass.com";

const BACKEND_URL = isCareerCompass
  ? CAREERCOMPASS_BACKEND_URL
  : MYMENTOR_BACKEND_URL;

export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Separate client for CareerCompass backend
export const careerCompassApi = axios.create({
  baseURL: `${CAREERCOMPASS_BACKEND_URL}/api`,
  withCredentials: true,
});

// Attach token to MyMentor requests
const attachToken = (config) => {
  const token =
    localStorage.getItem("mm_token") ||
    sessionStorage.getItem("mm_token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

api.interceptors.request.use(attachToken);
careerCompassApi.interceptors.request.use(attachToken);

export function formatApiError(detail) {
  if (detail == null) {
    return "Something went wrong. Please try again.";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((e) =>
        e && typeof e.msg === "string"
          ? e.msg
          : JSON.stringify(e)
      )
      .filter(Boolean)
      .join(" ");
  }

  if (typeof detail.msg === "string") {
    return detail.msg;
  }

  return String(detail);
}

export function getToken() {
  return (
    localStorage.getItem("mm_token") ||
    sessionStorage.getItem("mm_token")
  );
}
