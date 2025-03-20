import axios from "axios";


export async function sendMessage(sender_id: string, content: string , receiver_id:string) {
  try {
    const response = await axios.post("http://localhost:8000/api/messages/send", {
      sender_id: sender_id,
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
