import axios from "axios";
import { Post } from "@/types/posts";

export async function searchPosts(query: string) {
  try {
    const response = await axios.get(
      `http://localhost:8000/api/posts/search?query=${encodeURIComponent(query)}`
    );
    const posts: Post[] = response.data;
    return posts;
  } catch (error) {
    console.error('Error searching posts:', error);
    throw error;
  }
}