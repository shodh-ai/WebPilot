import axios from "axios";

const CONSTANT_SENDER_ID = "719e481e-76fb-4938-8f06-0de7ae9f4e70";
const CONSTANT_RECEIVER_ID = "b864a841-0b56-41a1-8aa5-3a92dc747953";

export async function sendMessage(content: string) {
  try {
    const response = await axios.post("http://localhost:8000/api/messages/send", {
      sender_id: CONSTANT_SENDER_ID,
      receiver_id: CONSTANT_RECEIVER_ID,
      content,
    });
    if (response.status === 200) {
      console.log("Message sent successfully");
      return response.data;
    } else {
      console.log("Request failed with status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}
