import apiClient from "./apiClient";

export default class UserService {
  async sendCode(email: string) {
    try {
      const response = await apiClient.post("/users/send-code", { email });
      return response.data;
    } catch (error) {
      console.error("Error sending verification code:", error);
      throw error;
    }
  }

  async verify(email: string, key: string) {
    try {
      const response = await apiClient.post("/users/verify", { email, key });
      return response.data;
    } catch (error) {
      console.error("Error verifying code:", error);
      throw error;
    }
  }

  async updateProfile(email: string, name: string, cell: string) {
    try {
      const response = await apiClient.post("/users/update-profile", {
        email,
        name,
        cell,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }
}
