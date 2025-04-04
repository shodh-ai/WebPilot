  import axios from "axios";

  export async function addTicket(mail: string, department: string, detail: string) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`http://localhost:8000/api/query/add_query`, {
        text: detail,
        department: department,
        email: mail,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );
      if (response.status === 200) {
        console.log('Request was successful');
        return true;
      } else {
        console.log('Request failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }
