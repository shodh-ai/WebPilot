import axios from 'axios';

export const sendMessage = async (receiver_id, content) => {
  const token = localStorage.getItem("token");
  
  try {
    const response = await axios.post(
      "http://localhost:8000/api/messages/send",
      { receiver_id, content },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};
