import axios from "axios";

const CONSTANT_USER_ID = "719e481e-76fb-4938-8f06-0de7ae9f4e70"; 

export async function addPost(title: string, content: string) {
  try {
    const response = await axios.post(`http://localhost:8000/api/posts/add_post`, {
      user_id: CONSTANT_USER_ID,
      title,
      content,
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
