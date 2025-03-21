import axios from "axios";


export async function getUsers() {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post("http://localhost:8000/api/users/get",{}, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
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
