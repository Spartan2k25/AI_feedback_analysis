import axios from "axios";

const API_URL = "http://127.0.0.1:5001";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export const submitFeedback = async (data) => {
  return await apiClient.post("/submit-feedback", data);
};

export const getAnalytics = async () => {
  return await apiClient.get("/analytics");
};

export const getFeedbackDetails = async (teacherName) => {
  return await apiClient.get(`/feedback-details/${encodeURIComponent(teacherName)}`);
};

export const deleteFeedback = async (recordId) => {
  return await apiClient.delete(`/feedback/${recordId}`);
};
