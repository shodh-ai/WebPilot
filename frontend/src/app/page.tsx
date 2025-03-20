"use client";
import NavigationMenuBar from "@/components/nav";
import { Card } from "@/components/ui/card";
import { getPosts } from "@/api/getPosts";
import { addPost } from "@/api/addPost";
import { Post } from "@/types/posts";
import { useEffect, useState, FormEvent } from "react";
export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [adding, setAdding] = useState<boolean>(false);
  useEffect(() => {
    async function fetchPosts() {
      const topPosts = await getPosts();
      setPosts(topPosts);
      setLoading(false);
    }
    fetchPosts();
  }, []);
  async function handleAddPost(e: FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const result = await addPost(title, content);
      if (result && result.post) {
        setPosts((prevPosts) => [result.post, ...prevPosts]);
      }
      setTitle("");
      setContent("");
    } catch (error) {
      console.error("Error adding post:", error);
    } finally {
      setAdding(false);
    }
  }
  return (
    <>
      <NavigationMenuBar />
      <div className="flex flex-col overflow-x-hidden overflow-y-auto h-min-screen w-screen p-4">
        <Card className="p-6 mb-6 border border-gray-200 rounded-xl dark:border-neutral-700">
          <h3 className="text-lg font-bold mb-4">Add a New Post</h3>
          <form onSubmit={handleAddPost} className="flex flex-col space-y-4">
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300" required />
            <textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300" rows={4} required />
            <button type="submit" disabled={adding} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{adding ? "Adding..." : "Add Post"}</button>
          </form>
        </Card>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-transparent border-solid rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((item, index) => (
              <Card key={index} className="p-6 border border-gray-200 rounded-xl dark:border-neutral-700">
                <p className="mb-2 text-sm text-gray-500 dark:text-neutral-500">{new Date(item.created_at).getFullYear()}</p>
                <h5 className="font-medium text-sm text-gray-800 dark:text-neutral-200">{item.Title}</h5>
                <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500">{item.Content}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
