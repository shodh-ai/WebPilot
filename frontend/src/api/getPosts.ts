import axios from "axios";
import { Post } from "@/types/posts";

export async function getPosts() {
  try {
    const response = await axios.get(`http://localhost:8000/api/posts/get_posts`);
    console.log(response.data);
    const posts: Post[] = response.data;
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}
