import axios from "axios";


export async function getMessages(user_id: string ) {
  try {
    const response = await axios.post("http://localhost:8000/api/messages/get", {
      user_id: user_id,
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
