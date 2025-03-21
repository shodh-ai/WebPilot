import axios from "axios";
import { Post } from "@/types/posts";

export async function getPosts() {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.post(`http://localhost:8000/api/posts/get_posts`, {},
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );
    console.log(response.data);
    const posts: Post[] = response.data;
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}
