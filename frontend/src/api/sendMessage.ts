import axios from "axios";

const CONSTANT_SENDER_ID = "719e481e-76fb-4938-8f06-0de7ae9f4e70";


export async function sendMessage(content: string , receiver_id:string) {
  try {
    const response = await axios.post("http://localhost:8000/api/messages/send", {
      sender_id: CONSTANT_SENDER_ID,
      receiver_id,
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
