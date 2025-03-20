import axios from "axios";


export async function getUsers() {
  try {
    const response = await axios.post("http://localhost:8000/api/users/get", {});
    if (response.status === 200) {
      console.log("Frontend: Users fetched successfully:", response.data.data);
      return response.data.data;
    } else {
      console.log("Frontend: Request failed with status:", response.status);
      return [];
    }
  } catch (error) {
    console.error("Frontend: Error fetching messages:", error);
    throw error;
  }
}
