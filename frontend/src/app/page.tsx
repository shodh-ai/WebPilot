"use client";

import NavigationMenuBar from "@/components/nav";
import { Card } from "@/components/ui/card";
import { getPosts } from "@/api/getPosts";
import { Post } from "@/types/posts";
import { useEffect, useState } from "react";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchPosts() {
      const topPosts = await getPosts();
      setPosts(topPosts);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  return (
    <>
      <NavigationMenuBar />
      <div className="flex flex-col overflow-x-hidden overflow-y-auto h-min-screen w-screen p-4">
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
