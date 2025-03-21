import axios from "axios";
export async function addPost(title: string, content: string) {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.post(`http://localhost:8000/api/posts/add_post`, {
      title,
      content,
    },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

    if (response.status === 200) {
      console.log('Post added successfully');
      return response.data;
    } else {
      console.log('Request failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error adding post:', error);
    throw error;
  }
}
