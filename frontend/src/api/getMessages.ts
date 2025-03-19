import axios from "axios";

const CONSTANT_USER_ID = "719e481e-76fb-4938-8f06-0de7ae9f4e70";

export async function getMessages() {
  try {
    const response = await axios.post("http://localhost:8000/api/messages/get", {
      user_id: CONSTANT_USER_ID,
    });
    if (response.status === 200) {
      console.log("Frontend: Messages fetched successfully:", response.data.messages);
      return response.data.messages;
    } else {
      console.log("Frontend: Request failed with status:", response.status);
      return [];
    }
  } catch (error) {
    console.error("Frontend: Error fetching messages:", error);
    throw error;
  }
}
