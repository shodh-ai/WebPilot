import axios from "axios";


export async function getMessages() {
  try {
    const response = await axios.post("http://localhost:8000/api/users/get", {});
    if (response.status === 200) {
      console.log("Frontend: Users fetched successfully:", response.data.messages);
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
